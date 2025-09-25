import { PrismaClient } from '@prisma/client'
import { emailMarketingService } from './email-marketing-service'
import { emailWorkflowService } from './email-workflow-service'

const prisma = new PrismaClient()

interface OpportunityStageChange {
  opportunityId: string
  leadId: string
  oldStage: string
  newStage: string
  userId: string
  value?: number
}

interface ProposalParams {
  opportunityId: string
  templateId?: string
  customContent?: string
  attachments?: string[]
  scheduledAt?: Date
}

interface FollowUpRule {
  stage: string
  delayHours: number
  templateId: string
  maxAttempts: number
  conditions?: Record<string, any>
}

export class SalesAutomationService {
  // 1. TRIGGERS POR MUDANÇA DE ESTÁGIO
  async handleStageChange(params: OpportunityStageChange) {
    try {
      console.log(`🎯 Processando mudança de estágio: ${params.oldStage} → ${params.newStage}`)

      // Buscar configurações de automação para este estágio
      const automationRules = await this.getStageAutomationRules(params.newStage)

      for (const rule of automationRules) {
        await this.executeStageAutomation(rule, params)
      }

      // Registrar histórico
      await this.logStageAutomation(params)

      return { success: true, rulesExecuted: automationRules.length }
    } catch (error) {
      console.error('Erro no handleStageChange:', error)
      throw error
    }
  }

  async getStageAutomationRules(stage: string) {
    return await prisma.salesAutomationRule.findMany({
      where: {
        triggerType: 'STAGE_CHANGE',
        triggerValue: stage,
        active: true
      },
      include: {
        template: true
      }
    })
  }

  async executeStageAutomation(rule: any, params: OpportunityStageChange) {
    try {
      // Buscar dados do lead
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: {
          lead: true,
          owner: true
        }
      })

      if (!opportunity) return

      const emailData = {
        to: opportunity.lead.email,
        subject: this.parseTemplate(rule.template.subject, {
          leadName: opportunity.lead.name,
          company: opportunity.lead.company,
          stage: params.newStage,
          value: params.value || opportunity.value,
          ownerName: opportunity.owner.name
        }),
        html: this.parseTemplate(rule.template.htmlContent, {
          leadName: opportunity.lead.name,
          company: opportunity.lead.company,
          stage: params.newStage,
          value: this.formatCurrency(params.value || opportunity.value),
          ownerName: opportunity.owner.name,
          opportunityId: opportunity.id
        }),
        leadId: opportunity.leadId,
        opportunityId: opportunity.id,
        automationRuleId: rule.id
      }

      // Enviar email com delay se especificado
      if (rule.delayHours > 0) {
        await this.scheduleEmail(emailData, rule.delayHours)
      } else {
        await this.sendSalesEmail(emailData)
      }

      console.log(`✅ Automação executada: ${rule.name} para oportunidade ${params.opportunityId}`)
    } catch (error) {
      console.error('Erro ao executar automação de estágio:', error)
    }
  }

  // 2. SISTEMA DE PROPOSTAS AUTOMÁTICAS
  async sendAutomaticProposal(params: ProposalParams) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: {
          lead: true,
          owner: true
        }
      })

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada')
      }

      // Template padrão ou customizado
      let template
      if (params.templateId) {
        template = await prisma.salesTemplate.findUnique({
          where: { id: params.templateId }
        })
      } else {
        template = await this.getDefaultProposalTemplate(opportunity.stage)
      }

      if (!template) {
        throw new Error('Template de proposta não encontrado')
      }

      // Gerar PDF da proposta (se necessário)
      let proposalAttachment
      if (template.generatePdf) {
        proposalAttachment = await this.generateProposalPDF(opportunity)
      }

      const emailData = {
        to: opportunity.lead.email,
        subject: this.parseTemplate(template.subject, {
          leadName: opportunity.lead.name,
          company: opportunity.lead.company,
          value: this.formatCurrency(opportunity.value)
        }),
        html: params.customContent || this.parseTemplate(template.content, {
          leadName: opportunity.lead.name,
          company: opportunity.lead.company,
          value: this.formatCurrency(opportunity.value),
          ownerName: opportunity.owner.name,
          proposalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/proposal/${opportunity.id}`
        }),
        attachments: proposalAttachment ? [proposalAttachment, ...(params.attachments || [])] : params.attachments,
        leadId: opportunity.leadId,
        opportunityId: opportunity.id,
        type: 'PROPOSAL'
      }

      if (params.scheduledAt) {
        await this.scheduleEmail(emailData, null, params.scheduledAt)
      } else {
        await this.sendSalesEmail(emailData)
      }

      // Registrar envio da proposta
      await prisma.salesActivity.create({
        data: {
          opportunityId: opportunity.id,
          type: 'PROPOSAL_SENT',
          description: 'Proposta enviada automaticamente',
          metadata: JSON.stringify({
            templateId: template.id,
            hasAttachment: !!proposalAttachment
          })
        }
      })

      // Agendar follow-up automático
      await this.scheduleProposalFollowUp(opportunity.id)

      return { success: true, proposalSent: true }
    } catch (error) {
      console.error('Erro ao enviar proposta automática:', error)
      throw error
    }
  }

  // 3. FOLLOW-UP AUTOMATIZADO
  async createFollowUpSequence(opportunityId: string, rules: FollowUpRule[]) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { lead: true }
      })

      if (!opportunity) return

      // Criar workflow personalizado para esta oportunidade
      const workflow = await emailWorkflowService.createWorkflow({
        name: `Follow-up ${opportunity.lead.name} - ${opportunity.title}`,
        description: 'Follow-up automático de oportunidade',
        trigger: {
          type: 'OPPORTUNITY_STAGE',
          config: {
            opportunityId: opportunityId,
            stage: opportunity.stage
          }
        },
        steps: rules.map((rule, index) => ({
          templateId: rule.templateId,
          delayHours: rule.delayHours,
          conditions: {
            ...rule.conditions,
            maxAttempts: rule.maxAttempts,
            opportunityStage: rule.stage
          }
        })),
        userId: opportunity.ownerId
      })

      // Iniciar execução do workflow
      await emailWorkflowService.startWorkflowExecution(workflow.id, opportunity.leadId, {
        opportunityId: opportunityId,
        currentAttempt: 1
      })

      return { success: true, workflowId: workflow.id }
    } catch (error) {
      console.error('Erro ao criar sequência de follow-up:', error)
      throw error
    }
  }

  async scheduleProposalFollowUp(opportunityId: string) {
    const followUpRules: FollowUpRule[] = [
      {
        stage: 'PROPOSAL',
        delayHours: 24,
        templateId: 'proposal_followup_1',
        maxAttempts: 1
      },
      {
        stage: 'PROPOSAL',
        delayHours: 72,
        templateId: 'proposal_followup_2',
        maxAttempts: 1,
        conditions: { noResponse: true }
      },
      {
        stage: 'PROPOSAL',
        delayHours: 168, // 7 dias
        templateId: 'proposal_followup_final',
        maxAttempts: 1,
        conditions: { noResponse: true, finalAttempt: true }
      }
    ]

    return await this.createFollowUpSequence(opportunityId, followUpRules)
  }

  // 4. TEMPLATES ESPECÍFICOS PARA VENDAS
  async getDefaultProposalTemplate(stage: string) {
    return await prisma.salesTemplate.findFirst({
      where: {
        type: 'PROPOSAL',
        stage: stage,
        isDefault: true
      }
    })
  }

  async createSalesTemplate(params: {
    name: string
    type: 'PROPOSAL' | 'FOLLOW_UP' | 'NEGOTIATION' | 'CLOSING'
    stage?: string
    subject: string
    content: string
    generatePdf?: boolean
    isDefault?: boolean
    userId: string
  }) {
    return await prisma.salesTemplate.create({
      data: {
        name: params.name,
        type: params.type,
        stage: params.stage,
        subject: params.subject,
        content: params.content,
        generatePdf: params.generatePdf || false,
        isDefault: params.isDefault || false,
        createdById: params.userId
      }
    })
  }

  // UTILIDADES
  private parseTemplate(template: string, variables: Record<string, any>): string {
    let parsed = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      parsed = parsed.replace(regex, String(value || ''))
    })
    return parsed
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  private async sendSalesEmail(data: any) {
    // Integrar com o serviço de email marketing existente
    return await emailMarketingService.sendTransactionalEmail(data)
  }

  private async scheduleEmail(data: any, delayHours?: number, scheduledAt?: Date) {
    const sendAt = scheduledAt || new Date(Date.now() + (delayHours || 0) * 60 * 60 * 1000)

    return await prisma.scheduledEmail.create({
      data: {
        ...data,
        scheduledAt: sendAt,
        status: 'PENDING'
      }
    })
  }

  private async generateProposalPDF(opportunity: any) {
    // Implementar geração de PDF com Puppeteer
    // Por enquanto retorna mock
    return {
      filename: `proposta_${opportunity.id}.pdf`,
      path: `/tmp/proposal_${opportunity.id}.pdf`
    }
  }

  private async logStageAutomation(params: OpportunityStageChange) {
    await prisma.salesActivity.create({
      data: {
        opportunityId: params.opportunityId,
        type: 'STAGE_AUTOMATION',
        description: `Automação executada: ${params.oldStage} → ${params.newStage}`,
        metadata: JSON.stringify(params)
      }
    })
  }
}

export const salesAutomationService = new SalesAutomationService()