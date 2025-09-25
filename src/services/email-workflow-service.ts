/**
 * Serviço para automação de workflows de email marketing
 */

import { prisma } from '@/lib/prisma'
import { EmailMarketingService } from './email-marketing-service'

export interface WorkflowTrigger {
  type: 'LEAD_CREATED' | 'STATUS_CHANGED' | 'TAG_ADDED' | 'DATE_BASED' | 'MANUAL'
  config?: {
    status?: string
    tag?: string
    dateField?: string
    daysAfter?: number
    time?: string
  }
}

export interface WorkflowStep {
  templateId: string
  delayHours: number
  conditions?: {
    leadStatus?: string[]
    leadTags?: string[]
    leadSource?: string[]
    customField?: { field: string; operator: string; value: string }
  }
}

export interface CreateWorkflowParams {
  name: string
  description?: string
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  userId: string
}

export class EmailWorkflowService {
  private emailService: EmailMarketingService

  constructor() {
    this.emailService = new EmailMarketingService()
  }

  /**
   * Criar novo workflow
   */
  async createWorkflow(params: CreateWorkflowParams) {
    try {
      const workflow = await prisma.emailWorkflow.create({
        data: {
          name: params.name,
          description: params.description,
          triggerType: params.trigger.type,
          triggerConfig: JSON.stringify(params.trigger.config || {}),
          createdById: params.userId,
          steps: {
            create: params.steps.map((step, index) => ({
              templateId: step.templateId,
              stepOrder: index + 1,
              delayHours: step.delayHours,
              conditions: JSON.stringify(step.conditions || {})
            }))
          }
        },
        include: {
          steps: {
            include: {
              template: true
            },
            orderBy: {
              stepOrder: 'asc'
            }
          }
        }
      })

      console.log('✅ Workflow criado:', workflow.name)
      return { success: true, workflow }

    } catch (error: any) {
      console.error('❌ Erro ao criar workflow:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Listar workflows
   */
  async getWorkflows() {
    try {
      const workflows = await prisma.emailWorkflow.findMany({
        include: {
          steps: {
            include: {
              template: true
            },
            orderBy: {
              stepOrder: 'asc'
            }
          },
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return { success: true, workflows }

    } catch (error: any) {
      console.error('❌ Erro ao listar workflows:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Iniciar execução de workflow para um lead
   */
  async startWorkflowExecution(workflowId: string, leadId: string, triggerData?: any) {
    try {
      // Verificar se já existe execução ativa para este workflow e lead
      const existingExecution = await prisma.emailWorkflowExecution.findFirst({
        where: {
          workflowId,
          leadId,
          status: 'RUNNING'
        }
      })

      if (existingExecution) {
        console.log('⚠️ Execução já em andamento para este lead')
        return { success: false, error: 'Execução já em andamento para este lead' }
      }

      // Obter workflow com steps
      const workflow = await prisma.emailWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      })

      if (!workflow || !workflow.active) {
        return { success: false, error: 'Workflow não encontrado ou inativo' }
      }

      // Criar execução
      const execution = await prisma.emailWorkflowExecution.create({
        data: {
          workflowId,
          leadId,
          data: JSON.stringify(triggerData || {}),
          currentStep: 0,        // Começar no step 0
          status: 'RUNNING',     // Status obrigatório
          nextStepAt: new Date() // Primeira etapa executa imediatamente
        }
      })

      console.log('✅ Execução de workflow iniciada:', execution.id)
      return { success: true, execution }

    } catch (error: any) {
      console.error('❌ Erro ao iniciar execução:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Processar steps agendados (executado por cron job)
   */
  async processScheduledSteps() {
    try {
      console.log('🔄 Processando steps agendados...')

      // Buscar execuções com steps pendentes
      const pendingExecutions = await prisma.emailWorkflowExecution.findMany({
        where: {
          status: 'RUNNING',
          nextStepAt: {
            lte: new Date()
          }
        },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' },
                include: {
                  template: true
                }
              }
            }
          },
          lead: true
        }
      })

      console.log(`📋 ${pendingExecutions.length} execuções para processar`)

      for (const execution of pendingExecutions) {
        await this.processWorkflowStep(execution)
      }

      return { success: true, processed: pendingExecutions.length }

    } catch (error: any) {
      console.error('❌ Erro ao processar steps:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Processar step individual de workflow
   */
  private async processWorkflowStep(execution: any) {
    try {
      const currentStep = execution.workflow.steps.find(
        (step: any) => step.stepOrder === execution.currentStep
      )

      if (!currentStep) {
        // Workflow completado
        await prisma.emailWorkflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
        console.log('✅ Workflow completado:', execution.id)
        return
      }

      // Verificar condições do step
      const shouldExecute = await this.checkStepConditions(currentStep, execution.lead)

      if (!shouldExecute) {
        console.log(`⏭️ Step ${currentStep.stepOrder} pulado por não atender condições`)
        // Avançar para próximo step
        await this.scheduleNextStep(execution.id)
        return
      }

      // Enviar email
      const emailResult = await this.sendWorkflowEmail(currentStep, execution.lead)

      if (emailResult.success) {
        console.log(`📧 Email enviado no step ${currentStep.stepOrder}`)

        // Registrar sucesso nos logs
        const successLog = {
          timestamp: new Date().toISOString(),
          action: 'EMAIL_SENT',
          step: currentStep.stepOrder,
          template: currentStep.template.name,
          recipient: execution.lead.email,
          status: 'SUCCESS'
        }

        // Avançar para próximo step
        await this.scheduleNextStep(execution.id, successLog)
      } else {
        // Registrar falha detalhada
        const errorLog = {
          timestamp: new Date().toISOString(),
          action: 'EMAIL_SEND_FAILED',
          step: currentStep.stepOrder,
          template: currentStep.template.name,
          recipient: execution.lead.email,
          error: emailResult.error,
          status: 'FAILED'
        }

        // Marcar como falha com detalhes
        await prisma.emailWorkflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            error: `Falha no step ${currentStep.stepOrder}: ${emailResult.error}`,
            logs: JSON.stringify([errorLog])
          }
        })
        console.error(`❌ Falha no step ${currentStep.stepOrder}:`, emailResult.error)
      }

    } catch (error: any) {
      console.error('❌ Erro ao processar step:', error)

      // Registrar erro crítico
      const criticalErrorLog = {
        timestamp: new Date().toISOString(),
        action: 'STEP_PROCESSING_ERROR',
        step: execution.currentStep,
        error: error.message,
        stack: error.stack,
        status: 'CRITICAL_ERROR'
      }

      // Marcar execução como falha com detalhes do erro
      await prisma.emailWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: `Erro crítico no processamento: ${error.message}`,
          logs: JSON.stringify([criticalErrorLog])
        }
      })
    }
  }

  /**
   * Agendar próximo step
   */
  private async scheduleNextStep(executionId: string, logEntry?: any) {
    try {
      const execution = await prisma.emailWorkflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          }
        }
      })

      if (!execution) return

      const nextStepOrder = execution.currentStep + 1
      const nextStep = execution.workflow.steps.find(
        step => step.stepOrder === nextStepOrder
      )

      if (!nextStep) {
        // Não há próximo step - completar workflow
        await prisma.emailWorkflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            nextStepAt: null
          }
        })
        return
      }

      // Calcular próximo agendamento
      const nextStepAt = new Date()
      nextStepAt.setHours(nextStepAt.getHours() + nextStep.delayHours)

      // Preparar dados de atualização
      const updateData: any = {
        currentStep: nextStepOrder,
        nextStepAt
      }

      // Se há log entry, incluir nos logs
      if (logEntry) {
        const currentLogs = execution.logs ? JSON.parse(execution.logs) : []
        currentLogs.push(logEntry)
        updateData.logs = JSON.stringify(currentLogs)
      }

      // Atualizar execução
      await prisma.emailWorkflowExecution.update({
        where: { id: executionId },
        data: updateData
      })

      console.log(`📅 Próximo step agendado para: ${nextStepAt}`)

    } catch (error: any) {
      console.error('❌ Erro ao agendar próximo step:', error)
    }
  }

  /**
   * Verificar condições do step
   */
  private async checkStepConditions(step: any, lead: any): Promise<boolean> {
    try {
      if (!step.conditions) return true

      const conditions = JSON.parse(step.conditions)

      // Verificar status do lead
      if (conditions.leadStatus && !conditions.leadStatus.includes(lead.status)) {
        return false
      }

      // Verificar source do lead
      if (conditions.leadSource && !conditions.leadSource.includes(lead.source)) {
        return false
      }

      // Verificar tags (se implementado)
      if (conditions.leadTags && conditions.leadTags.length > 0) {
        const leadTags = await prisma.leadTagAssignment.findMany({
          where: { leadId: lead.id },
          include: { tag: true }
        })

        const leadTagNames = leadTags.map(lt => lt.tag.name)
        const hasRequiredTag = conditions.leadTags.some((tag: string) =>
          leadTagNames.includes(tag)
        )

        if (!hasRequiredTag) return false
      }

      return true

    } catch (error: any) {
      console.error('❌ Erro ao verificar condições:', error)
      return false
    }
  }

  /**
   * Enviar email do workflow
   */
  private async sendWorkflowEmail(step: any, lead: any) {
    try {
      if (!step.template) {
        return { success: false, error: 'Template não encontrado' }
      }

      // Preparar variáveis do template
      const variables = {
        nome: lead.name,
        email: lead.email,
        empresa: lead.company || '',
        telefone: lead.phone || '',
        cargo: lead.roleTitle || ''
      }

      // Substituir variáveis no template
      let htmlContent = step.template.htmlContent
      let textContent = step.template.textContent || ''
      let subject = step.template.subject

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        htmlContent = htmlContent.replace(regex, value)
        textContent = textContent.replace(regex, value)
        subject = subject.replace(regex, value)
      })

      // Enviar email
      const result = await this.emailService.sendEmail({
        to: [lead.email],
        subject,
        htmlBody: htmlContent,
        textBody: textContent
      })

      return result

    } catch (error: any) {
      console.error('❌ Erro ao enviar email do workflow:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Pausar execução de workflow
   */
  async pauseWorkflowExecution(executionId: string) {
    try {
      await prisma.emailWorkflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'PAUSED',
          nextStepAt: null
        }
      })

      return { success: true }

    } catch (error: any) {
      console.error('❌ Erro ao pausar execução:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Retomar execução de workflow
   */
  async resumeWorkflowExecution(executionId: string) {
    try {
      const execution = await prisma.emailWorkflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          }
        }
      })

      if (!execution) {
        return { success: false, error: 'Execução não encontrada' }
      }

      const currentStep = execution.workflow.steps.find(
        step => step.stepOrder === execution.currentStep
      )

      // Calcular próximo agendamento
      const nextStepAt = new Date()
      if (currentStep) {
        nextStepAt.setHours(nextStepAt.getHours() + currentStep.delayHours)
      }

      await prisma.emailWorkflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'RUNNING',
          nextStepAt
        }
      })

      return { success: true }

    } catch (error: any) {
      console.error('❌ Erro ao retomar execução:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Obter estatísticas do workflow
   */
  async getWorkflowStats(workflowId: string) {
    try {
      const stats = await prisma.emailWorkflowExecution.groupBy({
        by: ['status'],
        where: { workflowId },
        _count: {
          id: true
        }
      })

      const totalExecutions = await prisma.emailWorkflowExecution.count({
        where: { workflowId }
      })

      const result = {
        total: totalExecutions,
        running: 0,
        completed: 0,
        paused: 0,
        failed: 0
      }

      stats.forEach(stat => {
        if (stat.status === 'RUNNING') result.running = stat._count.id
        if (stat.status === 'COMPLETED') result.completed = stat._count.id
        if (stat.status === 'PAUSED') result.paused = stat._count.id
        if (stat.status === 'FAILED') result.failed = stat._count.id
      })

      return { success: true, stats: result }

    } catch (error: any) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Verificar triggers automáticos (chamado quando lead é criado/modificado)
   */
  async checkAutoTriggers(leadId: string, triggerType: string, triggerData?: any) {
    try {
      console.log(`🔍 Verificando triggers automáticos para lead ${leadId}`)

      const workflows = await prisma.emailWorkflow.findMany({
        where: {
          active: true,
          triggerType
        }
      })

      for (const workflow of workflows) {
        let shouldTrigger = false
        const triggerConfig = JSON.parse(workflow.triggerConfig || '{}')

        switch (triggerType) {
          case 'LEAD_CREATED':
            shouldTrigger = true
            break

          case 'STATUS_CHANGED':
            if (triggerConfig.status === triggerData?.newStatus) {
              shouldTrigger = true
            }
            break

          case 'TAG_ADDED':
            if (triggerConfig.tag === triggerData?.tagName) {
              shouldTrigger = true
            }
            break
        }

        if (shouldTrigger) {
          console.log(`🚀 Iniciando workflow "${workflow.name}" para lead ${leadId}`)
          await this.startWorkflowExecution(workflow.id, leadId, triggerData)
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('❌ Erro ao verificar triggers:', error)
      return { success: false, error: error.message }
    }
  }
}

// Instância única do serviço
export const emailWorkflowService = new EmailWorkflowService()