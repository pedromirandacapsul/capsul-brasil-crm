import * as cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { WhatsAppMessageService } from '@/lib/whatsapp-message'
import { flowProcessor } from '@/lib/flow-processor'

interface ScheduledJob {
  triggerId: string
  cronExpression: string
  job: cron.ScheduledTask
}

class SchedulerService {
  private static instance: SchedulerService
  private scheduledJobs: Map<string, ScheduledJob> = new Map()
  private whatsappService: WhatsAppMessageService

  private constructor() {
    this.whatsappService = WhatsAppMessageService.getInstance()
  }

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService()
    }
    return SchedulerService.instance
  }

  // Inicializar scheduler carregando todos os gatilhos ativos
  async initialize() {
    console.log('🚀 Inicializando sistema de agendamento...')

    try {
      // Buscar todos os gatilhos de agendamento ativos
      const scheduleTriggers = await prisma.flowTrigger.findMany({
        where: {
          triggerType: 'SCHEDULE',
          isActive: true
        },
        include: {
          flow: {
            select: {
              id: true,
              name: true,
              isActive: true,
              userId: true
            }
          }
        }
      })

      console.log(`📅 Encontrados ${scheduleTriggers.length} gatilhos de agendamento ativos`)

      // Agendar cada gatilho
      for (const trigger of scheduleTriggers) {
        if (trigger.flow.isActive) {
          await this.scheduleJob(trigger)
        }
      }

      // Verificar gatilhos de eventos diariamente à meia-noite
      this.scheduleEventChecks()

      console.log('✅ Sistema de agendamento iniciado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de agendamento:', error)
    }
  }

  // Agendar um trabalho específico
  async scheduleJob(trigger: any) {
    try {
      const config = trigger.config ? JSON.parse(trigger.config) : {}
      const cronExpression = this.getCronExpression(config)

      if (!cronExpression) {
        console.warn(`⚠️ Não foi possível criar cron expression para trigger ${trigger.id}`)
        return
      }

      console.log(`📌 Agendando trigger "${trigger.name}" (${trigger.id}) com cron: ${cronExpression}`)

      const job = cron.schedule(cronExpression, async () => {
        console.log(`🎯 Executando gatilho agendado: ${trigger.name}`)
        await this.executeTrigger(trigger)
      }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo'
      })

      // Armazenar referência do job
      this.scheduledJobs.set(trigger.id, {
        triggerId: trigger.id,
        cronExpression,
        job
      })

      console.log(`✅ Trigger "${trigger.name}" agendado com sucesso`)
    } catch (error) {
      console.error(`❌ Erro ao agendar trigger ${trigger.id}:`, error)
    }
  }

  // Converter configuração para cron expression
  private getCronExpression(config: any): string | null {
    const { scheduleType, time, dayOfWeek, dayOfMonth, date } = config

    if (!time) return null

    // Separar hora e minuto do time (formato HH:MM)
    const [hour, minute] = time.split(':').map(Number)

    switch (scheduleType) {
      case 'once':
        // Para agendamento único, usar data específica
        if (!date) return null
        const targetDate = new Date(date + 'T' + time)
        const now = new Date()

        // Se a data já passou, não agendar
        if (targetDate <= now) {
          console.warn(`Data ${date} ${time} já passou, não será agendado`)
          return null
        }

        // Para agendamento único, usar formato específico de data
        return `${minute} ${hour} ${targetDate.getDate()} ${targetDate.getMonth() + 1} *`

      case 'daily':
        // Todos os dias no horário especificado
        return `${minute} ${hour} * * *`

      case 'weekly':
        // Semanalmente no dia específico
        if (dayOfWeek === undefined) return null
        return `${minute} ${hour} * * ${dayOfWeek}`

      case 'monthly':
        // Mensalmente no dia específico
        if (dayOfMonth === undefined) return null
        return `${minute} ${hour} ${dayOfMonth} * *`

      default:
        return null
    }
  }

  // Executar um gatilho específico
  private async executeTrigger(trigger: any) {
    try {
      // Buscar todos os contatos para disparar
      const contacts = await prisma.whatsAppConversation.findMany({
        where: {
          account: {
            userId: trigger.flow.userId,
            status: 'CONNECTED'
          },
          status: 'ACTIVE'
        },
        include: {
          account: true
        }
      })

      console.log(`📞 Encontrados ${contacts.length} contatos para executar trigger "${trigger.name}"`)

      if (contacts.length === 0) {
        console.log(`⚠️ Nenhum contato encontrado para o trigger "${trigger.name}"`)
        return
      }

      // Criar execuções para cada contato
      const executions = []
      for (const conversation of contacts) {
        try {
          const execution = await prisma.flowExecution.create({
            data: {
              flowId: trigger.flowId,
              conversationId: conversation.id,
              accountId: conversation.account.id,
              status: 'PENDING',
              triggerType: 'SCHEDULE',
              startedAt: new Date(),
              currentStep: 1,
              metadata: JSON.stringify({
                triggerId: trigger.id,
                triggerName: trigger.name,
                scheduleType: trigger.config?.scheduleType || 'unknown',
                executedAt: new Date().toISOString()
              })
            }
          })

          executions.push(execution)
        } catch (error) {
          console.error(`❌ Erro ao criar execução para conversa ${conversation.id}:`, error)
        }
      }

      console.log(`✅ Criadas ${executions.length} execuções para trigger "${trigger.name}"`)

      // Processar execuções usando o flow processor
      for (const execution of executions) {
        await flowProcessor.processExecution(execution.id)
      }

      // Se for agendamento único, desativar o trigger
      const config = trigger.config ? JSON.parse(trigger.config) : {}
      if (config.scheduleType === 'once') {
        await prisma.flowTrigger.update({
          where: { id: trigger.id },
          data: { isActive: false }
        })

        // Remover do scheduler
        this.removeJob(trigger.id)

        console.log(`🗑️ Trigger único "${trigger.name}" desativado após execução`)
      }

    } catch (error) {
      console.error(`❌ Erro ao executar trigger ${trigger.id}:`, error)
    }
  }

  // Processar execução de fluxo
  private async processFlowExecution(executionId: string) {
    try {
      const execution = await prisma.flowExecution.findUnique({
        where: { id: executionId },
        include: {
          flow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          },
          conversation: {
            include: {
              account: true
            }
          }
        }
      })

      if (!execution || !execution.flow.steps.length) {
        console.log(`⚠️ Execução ${executionId} não encontrada ou sem passos`)
        return
      }

      // Marcar como em execução
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: { status: 'RUNNING' }
      })

      // Executar primeiro passo
      const firstStep = execution.flow.steps[0]
      console.log(`🔄 Processando passo ${firstStep.stepOrder} do fluxo "${execution.flow.name}"`)

      // Por enquanto, apenas enviar mensagem se for um passo de texto
      if (firstStep.stepType === 'MESSAGE' && firstStep.content) {
        try {
          // Enviar mensagem via WhatsApp
          await this.whatsappService.sendMessage(
            execution.conversation.account.id,
            execution.conversation.contactNumber,
            firstStep.content
          )

          console.log(`✅ Mensagem enviada para ${execution.conversation.contactNumber}`)
        } catch (error) {
          console.error(`❌ Erro ao enviar mensagem para ${execution.conversation.contactNumber}:`, error)
        }
      }

      // Marcar execução como completa (por enquanto)
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      console.log(`✅ Execução ${executionId} completa`)

    } catch (error) {
      console.error(`❌ Erro ao processar execução ${executionId}:`, error)

      // Marcar como erro
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: {
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }).catch(console.error)
    }
  }

  // Agendar verificações de eventos (diariamente à meia-noite)
  private scheduleEventChecks() {
    console.log('📅 Agendando verificações diárias de eventos...')

    cron.schedule('0 0 * * *', async () => {
      console.log('🔍 Verificando gatilhos de eventos...')
      await this.checkEventTriggers()
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    })
  }

  // Verificar gatilhos de eventos
  private async checkEventTriggers() {
    try {
      // Buscar gatilhos de eventos ativos
      const eventTriggers = await prisma.flowTrigger.findMany({
        where: {
          triggerType: 'EVENT',
          isActive: true
        },
        include: {
          flow: {
            select: {
              id: true,
              name: true,
              isActive: true,
              userId: true
            }
          }
        }
      })

      for (const trigger of eventTriggers) {
        if (!trigger.flow.isActive) continue

        const config = trigger.config ? JSON.parse(trigger.config) : {}

        if (config.eventType === 'inactive_contact') {
          await this.checkInactiveContacts(trigger, config.daysInactive || 7)
        }
        // TODO: Implementar outros tipos de eventos (birthday, etc.)
      }

    } catch (error) {
      console.error('❌ Erro ao verificar gatilhos de eventos:', error)
    }
  }

  // Verificar contatos inativos
  private async checkInactiveContacts(trigger: any, daysInactive: number) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

      const inactiveContacts = await prisma.whatsAppConversation.findMany({
        where: {
          account: {
            userId: trigger.flow.userId,
            status: 'CONNECTED'
          },
          lastMessageAt: {
            lt: cutoffDate
          },
          status: 'ACTIVE'
        },
        include: {
          account: true
        }
      })

      console.log(`📊 Encontrados ${inactiveContacts.length} contatos inativos há ${daysInactive} dias`)

      for (const conversation of inactiveContacts) {
        // Verificar se já existe execução recente para este contato
        const recentExecution = await prisma.flowExecution.findFirst({
          where: {
            flowId: trigger.flowId,
            conversationId: conversation.id,
            triggerType: 'EVENT',
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        })

        if (!recentExecution) {
          // Criar nova execução
          const execution = await prisma.flowExecution.create({
            data: {
              flowId: trigger.flowId,
              conversationId: conversation.id,
              accountId: conversation.account.id,
              status: 'PENDING',
              triggerType: 'EVENT',
              startedAt: new Date(),
              currentStep: 1,
              metadata: JSON.stringify({
                triggerId: trigger.id,
                triggerName: trigger.name,
                eventType: 'inactive_contact',
                daysInactive,
                lastMessageAt: conversation.lastMessageAt
              })
            }
          })

          await flowProcessor.processExecution(execution.id)
        }
      }

    } catch (error) {
      console.error('❌ Erro ao verificar contatos inativos:', error)
    }
  }

  // Remover um job agendado
  removeJob(triggerId: string) {
    const scheduledJob = this.scheduledJobs.get(triggerId)
    if (scheduledJob) {
      scheduledJob.job.stop()
      scheduledJob.job.destroy()
      this.scheduledJobs.delete(triggerId)
      console.log(`🗑️ Job ${triggerId} removido do scheduler`)
    }
  }

  // Reagendar um trigger (quando atualizado)
  async rescheduleJob(triggerId: string) {
    // Remover job antigo
    this.removeJob(triggerId)

    // Buscar trigger atualizado e reagendar
    const trigger = await prisma.flowTrigger.findUnique({
      where: { id: triggerId },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            isActive: true,
            userId: true
          }
        }
      }
    })

    if (trigger && trigger.isActive && trigger.flow.isActive) {
      await this.scheduleJob(trigger)
    }
  }

  // Parar todos os jobs
  stopAll() {
    console.log('🛑 Parando todos os jobs agendados...')

    for (const [triggerId, scheduledJob] of this.scheduledJobs) {
      scheduledJob.job.stop()
      scheduledJob.job.destroy()
    }

    this.scheduledJobs.clear()
    console.log('✅ Todos os jobs foram parados')
  }

  // Obter status dos jobs
  getJobsStatus() {
    const jobs = Array.from(this.scheduledJobs.entries()).map(([triggerId, job]) => ({
      triggerId,
      cronExpression: job.cronExpression,
      isRunning: job.job.getStatus() === 'scheduled'
    }))

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.isRunning).length,
      jobs
    }
  }
}

export const scheduler = SchedulerService.getInstance()