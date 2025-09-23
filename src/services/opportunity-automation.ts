import { prisma } from '@/lib/prisma'
import { LeadStatus, OpportunityStage } from '@prisma/client'

export interface AutoOpportunityConfig {
  triggerStatuses: LeadStatus[]
  stageMapping: Record<LeadStatus, OpportunityStage>
  requireAmountForProposal: boolean
  requireLossReasonForLost: boolean
  createActivities: boolean
}

const defaultConfig: AutoOpportunityConfig = {
  triggerStatuses: ['QUALIFIED', 'PROPOSAL', 'WON'],
  stageMapping: {
    'QUALIFIED': 'QUALIFICATION',
    'PROPOSAL': 'PROPOSAL',
    'WON': 'WON',
    'NEW': 'NEW',
    'CONTACTED': 'NEW',
    'INTERESTED': 'DISCOVERY',
    'LOST': 'LOST'
  },
  requireAmountForProposal: true,
  requireLossReasonForLost: true,
  createActivities: true
}

export class OpportunityAutomationService {
  private config: AutoOpportunityConfig

  constructor(config?: Partial<AutoOpportunityConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  async autoCreateOpportunity(
    leadId: string,
    newStatus: LeadStatus,
    userId: string,
    additionalData?: {
      amount?: number
      lossReason?: string
      lossDetails?: string
    }
  ) {
    try {
      // Verificar se status deve triggerar criação de oportunidade
      if (!this.config.triggerStatuses.includes(newStatus)) {
        return null
      }

      // Verificar se já existe oportunidade para este lead
      const existingOpportunity = await prisma.opportunity.findFirst({
        where: { leadId }
      })

      if (existingOpportunity) {
        console.log(`Opportunity already exists for lead ${leadId}`)
        return existingOpportunity
      }

      // Validações de negócio
      await this.validateBusinessRules(newStatus, additionalData)

      // Mapear status para stage
      const stage = this.config.stageMapping[newStatus] || 'NEW'

      // Buscar probabilidade do stage
      const probability = await this.getStageProbability(stage)

      // Buscar dados do lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          source: true,
          dealValue: true
        }
      })

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`)
      }

      // Criar oportunidade
      const opportunity = await prisma.opportunity.create({
        data: {
          leadId,
          ownerId: userId,
          stage,
          probability,
          amountBr: additionalData?.amount || lead.dealValue || 0,
          ...(stage === 'WON' && { closedAt: new Date() }),
          ...(stage === 'LOST' && {
            closedAt: new Date(),
            lostReason: additionalData?.lossReason
          })
        }
      })

      // Criar histórico do stage
      await prisma.stageHistory.create({
        data: {
          opportunityId: opportunity.id,
          stageFrom: null,
          stageTo: stage,
          changedBy: userId
        }
      })

      // Criar atividade de acompanhamento
      if (this.config.createActivities) {
        await this.createAutomationActivity(leadId, opportunity.id, userId, newStatus)
      }

      console.log(`Auto-created opportunity ${opportunity.id} for lead ${leadId} with stage ${stage}`)
      return opportunity

    } catch (error) {
      console.error(`Failed to auto-create opportunity for lead ${leadId}:`, error)
      throw error
    }
  }

  private async validateBusinessRules(
    status: LeadStatus,
    data?: { amount?: number; lossReason?: string }
  ) {
    // Validar se PROPOSAL requer valor
    if (this.config.requireAmountForProposal && status === 'PROPOSAL') {
      if (!data?.amount || data.amount <= 0) {
        throw new Error('Amount is required when creating opportunity from PROPOSAL status')
      }
    }

    // Validar se LOST requer motivo
    if (this.config.requireLossReasonForLost && status === 'LOST') {
      if (!data?.lossReason) {
        throw new Error('Loss reason is required when creating opportunity from LOST status')
      }
    }
  }

  private async getStageProbability(stage: OpportunityStage): Promise<number> {
    try {
      const stageProbability = await prisma.stageProbability.findUnique({
        where: { stage }
      })
      return stageProbability?.probability || this.getDefaultProbability(stage)
    } catch {
      return this.getDefaultProbability(stage)
    }
  }

  private getDefaultProbability(stage: OpportunityStage): number {
    const defaultProbabilities: Record<OpportunityStage, number> = {
      'NEW': 10,
      'QUALIFICATION': 25,
      'DISCOVERY': 40,
      'PROPOSAL': 60,
      'NEGOTIATION': 80,
      'WON': 100,
      'LOST': 0
    }
    return defaultProbabilities[stage] || 10
  }

  private async createAutomationActivity(
    leadId: string,
    opportunityId: string,
    userId: string,
    triggerStatus: LeadStatus
  ) {
    try {
      await prisma.activity.create({
        data: {
          leadId,
          userId,
          type: 'OPPORTUNITY_CREATED',
          description: `Oportunidade criada automaticamente`,
          payload: JSON.stringify({
            opportunityId,
            triggerStatus,
            automationType: 'LEAD_TO_OPPORTUNITY',
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.warn('Failed to create automation activity:', error)
    }
  }

  async updateOpportunityFromLead(
    leadId: string,
    newStatus: LeadStatus,
    userId: string,
    additionalData?: {
      amount?: number
      lossReason?: string
      lossDetails?: string
    }
  ) {
    try {
      // Buscar oportunidade existente
      const opportunity = await prisma.opportunity.findFirst({
        where: { leadId }
      })

      if (!opportunity) {
        // Se não existe, tentar criar
        return await this.autoCreateOpportunity(leadId, newStatus, userId, additionalData)
      }

      // Se existe, atualizar stage baseado no status do lead
      const newStage = this.config.stageMapping[newStatus]
      if (!newStage || opportunity.stage === newStage) {
        return opportunity
      }

      // Validar transição de stage
      await this.validateStageTransition(opportunity.stage, newStage, additionalData)

      // Atualizar oportunidade
      const updatedOpportunity = await prisma.opportunity.update({
        where: { id: opportunity.id },
        data: {
          stage: newStage,
          probability: await this.getStageProbability(newStage),
          ...(additionalData?.amount && { amountBr: additionalData.amount }),
          ...(newStage === 'WON' && { closedAt: new Date() }),
          ...(newStage === 'LOST' && {
            closedAt: new Date(),
            lostReason: additionalData?.lossReason
          }),
          updatedAt: new Date()
        }
      })

      // Criar histórico do stage
      await prisma.stageHistory.create({
        data: {
          opportunityId: opportunity.id,
          stageFrom: opportunity.stage,
          stageTo: newStage,
          changedBy: userId
        }
      })

      console.log(`Updated opportunity ${opportunity.id} stage from ${opportunity.stage} to ${newStage}`)
      return updatedOpportunity

    } catch (error) {
      console.error(`Failed to update opportunity for lead ${leadId}:`, error)
      throw error
    }
  }

  private async validateStageTransition(
    currentStage: OpportunityStage,
    newStage: OpportunityStage,
    data?: { amount?: number; lossReason?: string }
  ) {
    // Não permitir voltar de WON ou LOST
    if ((currentStage === 'WON' || currentStage === 'LOST') && newStage !== currentStage) {
      throw new Error(`Cannot change stage from ${currentStage} to ${newStage}`)
    }

    // Validar regras específicas (apenas para casos específicos de negócio)
    if (newStage === 'PROPOSAL' && this.config.requireAmountForProposal) {
      if (!data?.amount || data.amount <= 0) {
        throw new Error('Amount is required when moving to PROPOSAL stage')
      }
    }
  }

  async getAutomationStats(dateRange?: { from: Date; to: Date }) {
    try {
      const whereClause = dateRange ? {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {}

      const [totalOpportunities, autoCreated, totalValue] = await Promise.all([
        prisma.opportunity.count({ where: whereClause }),
        prisma.activity.count({
          where: {
            type: 'OPPORTUNITY_CREATED',
            ...whereClause
          }
        }),
        prisma.opportunity.aggregate({
          where: whereClause,
          _sum: { amountBr: true }
        })
      ])

      return {
        totalOpportunities,
        autoCreatedCount: autoCreated,
        automationRate: totalOpportunities > 0 ? (autoCreated / totalOpportunities * 100) : 0,
        totalValue: totalValue._sum.amountBr || 0
      }
    } catch (error) {
      console.error('Failed to get automation stats:', error)
      return null
    }
  }
}

export const opportunityAutomation = new OpportunityAutomationService()