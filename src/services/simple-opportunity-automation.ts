import { prisma } from '@/lib/prisma'
import { LeadStatus, OpportunityStage } from '@prisma/client'

export class SimpleOpportunityAutomation {
  async createOpportunityFromLead(
    leadId: string,
    status: LeadStatus,
    userId: string,
    amount?: number
  ) {
    try {
      console.log(`🔍 Creating opportunity for lead ${leadId}:`, { status, userId, amount })
      // Verificar se já existe oportunidade para este lead
      const existingOpportunity = await prisma.opportunity.findFirst({
        where: { leadId }
      })

      if (existingOpportunity) {
        console.log(`Opportunity already exists for lead ${leadId}, updating with new data`)

        // Mapear status para stage
        const stageMapping: Record<LeadStatus, OpportunityStage> = {
          'QUALIFIED': 'QUALIFICATION',
          'PROPOSAL': 'PROPOSAL',
          'WON': 'WON',
          'NEW': 'NEW',
          'CONTACTED': 'NEW',
          'INTERESTED': 'DISCOVERY',
          'LOST': 'LOST'
        }

        const stage = stageMapping[status] || 'NEW'
        const probabilityMapping: Record<OpportunityStage, number> = {
          'NEW': 10,
          'QUALIFICATION': 25,
          'DISCOVERY': 40,
          'PROPOSAL': 60,
          'NEGOTIATION': 80,
          'WON': 100,
          'LOST': 0
        }
        const probability = probabilityMapping[stage] || 10

        // Atualizar oportunidade existente
        const updatedOpportunity = await prisma.opportunity.update({
          where: { id: existingOpportunity.id },
          data: {
            stage,
            probability,
            ...(amount && { amountBr: amount }),
            ...(stage === 'WON' && { closedAt: new Date() }),
            ...(stage === 'LOST' && { closedAt: new Date() })
          }
        })

        // Criar histórico de mudança de estágio se necessário
        if (existingOpportunity.stage !== stage) {
          try {
            await prisma.stageHistory.create({
              data: {
                opportunityId: existingOpportunity.id,
                stageFrom: existingOpportunity.stage,
                stageTo: stage,
                changedBy: userId
              }
            })
          } catch (historyError) {
            console.warn('Failed to create stage history:', historyError)
          }
        }

        console.log(`Updated opportunity ${existingOpportunity.id} with stage ${stage} and amount ${amount}`)
        return updatedOpportunity
      }

      // Mapear status para stage
      const stageMapping: Record<LeadStatus, OpportunityStage> = {
        'QUALIFIED': 'QUALIFICATION',
        'PROPOSAL': 'PROPOSAL',
        'WON': 'WON',
        'NEW': 'NEW',
        'CONTACTED': 'NEW',
        'INTERESTED': 'DISCOVERY',
        'LOST': 'LOST'
      }

      const stage = stageMapping[status] || 'NEW'
      console.log(`📊 Mapped status "${status}" to stage "${stage}"`)

      // Probabilidades padrão
      const probabilityMapping: Record<OpportunityStage, number> = {
        'NEW': 10,
        'QUALIFICATION': 25,
        'DISCOVERY': 40,
        'PROPOSAL': 60,
        'NEGOTIATION': 80,
        'WON': 100,
        'LOST': 0
      }

      const probability = probabilityMapping[stage] || 10

      // Buscar dados do lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          name: true,
          dealValue: true
        }
      })

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`)
      }

      // Buscar um usuário válido para ser o owner (se userId não existir, usar admin)
      let validOwnerId = userId
      try {
        const userExists = await prisma.user.findUnique({ where: { id: userId } })
        if (!userExists) {
          // Se o usuário não existe, usar o admin
          const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
          validOwnerId = adminUser?.id || 'cmfvq4tnh0000nce5axicbr1u'
        }
      } catch {
        // Em caso de erro, usar o admin padrão
        validOwnerId = 'cmfvq4tnh0000nce5axicbr1u'
      }

      // Criar oportunidade
      const opportunity = await prisma.opportunity.create({
        data: {
          leadId,
          ownerId: validOwnerId,
          stage,
          probability,
          amountBr: amount || lead.dealValue || 0,
          ...(stage === 'WON' && { closedAt: new Date() }),
          ...(stage === 'LOST' && { closedAt: new Date() })
        }
      })

      // Tentar criar histórico do stage (não falhar se der erro)
      try {
        await prisma.stageHistory.create({
          data: {
            opportunityId: opportunity.id,
            stageFrom: null,
            stageTo: stage,
            changedBy: validOwnerId
          }
        })
      } catch (historyError) {
        console.warn('Failed to create stage history:', historyError)
      }

      console.log(`Created opportunity ${opportunity.id} for lead ${leadId} with stage ${stage}`)
      return opportunity

    } catch (error) {
      console.error(`Failed to create opportunity for lead ${leadId}:`, error)
      return null
    }
  }
}

export const simpleOpportunityAutomation = new SimpleOpportunityAutomation()