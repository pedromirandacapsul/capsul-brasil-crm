import { prisma } from '@/lib/prisma'
import { LeadStatus, OpportunityStage } from '@prisma/client'
import { automationConfig } from './automation-config'
import { notificationService } from './notification-service'

export class SimpleOpportunityAutomation {
  async createOpportunityFromLead(
    leadId: string,
    status: LeadStatus,
    userId: string,
    amount?: number
  ) {
    try {
      console.log(`🔍 Checking opportunity automation for lead ${leadId}:`, { status, userId, amount })

      // ✅ NOVO: Verificar se status deve triggerar criação de oportunidade
      if (!automationConfig.shouldCreateOpportunity(status)) {
        console.log(`⏭️  Status ${status} não está configurado para criar oportunidade automaticamente`)
        return null
      }

      // ✅ NOVO: Validar valor obrigatório
      if (automationConfig.requiresValue(status) && (!amount || amount <= 0)) {
        console.warn(`⚠️  Status ${status} requer valor, mas não foi fornecido ou é inválido:`, amount)
        return null
      }

      console.log(`✅ Status ${status} configurado para automação - prosseguindo...`)
      // Verificar se já existe oportunidade para este lead
      const existingOpportunity = await prisma.opportunity.findFirst({
        where: { leadId }
      })

      if (existingOpportunity) {
        console.log(`Opportunity already exists for lead ${leadId}, updating with new data`)

        // ✅ NOVO: Usar configuração dinâmica para mapeamento
        const stage = automationConfig.getStageForStatus(status)
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

        // ✅ NOVO: Notificar mudança de estágio
        try {
          const ownerData = await prisma.user.findUnique({
            where: { id: validOwnerId },
            select: { name: true }
          })

          await notificationService.notifyStageChanged({
            opportunityId: existingOpportunity.id,
            leadName: lead?.name || 'Lead',
            stageFrom: existingOpportunity.stage,
            stageTo: stage,
            ownerName: ownerData?.name || 'Usuário',
            ownerId: validOwnerId,
            amount: amount
          })
        } catch (notifyError) {
          console.warn('Failed to send stage change notification:', notifyError)
        }

        return updatedOpportunity
      }

      // ✅ NOVO: Usar configuração dinâmica para mapeamento
      const stage = automationConfig.getStageForStatus(status)
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

      // ✅ NOVO: Notificar criação de oportunidade
      try {
        const ownerData = await prisma.user.findUnique({
          where: { id: validOwnerId },
          select: { name: true }
        })

        await notificationService.notifyOpportunityCreated({
          id: opportunity.id,
          leadName: lead.name,
          stage,
          amount: amount || lead.dealValue || 0,
          ownerName: ownerData?.name || 'Usuário',
          ownerId: validOwnerId,
          leadId: leadId
        })

        // Notificar negócio de alto valor se aplicável
        const totalAmount = amount || lead.dealValue || 0
        if (totalAmount > 0) {
          await notificationService.notifyHighValueDeal({
            opportunityId: opportunity.id,
            leadName: lead.name,
            amount: totalAmount,
            stage,
            ownerName: ownerData?.name || 'Usuário',
            ownerId: validOwnerId
          })
        }
      } catch (notifyError) {
        console.warn('Failed to send opportunity creation notification:', notifyError)
      }

      return opportunity

    } catch (error) {
      console.error(`Failed to create opportunity for lead ${leadId}:`, error)
      return null
    }
  }
}

export const simpleOpportunityAutomation = new SimpleOpportunityAutomation()