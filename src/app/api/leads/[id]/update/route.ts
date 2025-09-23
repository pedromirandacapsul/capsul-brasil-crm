import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { simpleOpportunityAutomation } from '@/services/simple-opportunity-automation'
import { automationConfig } from '@/services/automation-config'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Validar campos permitidos
    const allowedFields = [
      'status',
      'nextActionAt',
      'nextActionType',
      'nextActionNotes',
      'lastInteractionAt',
      'lastInteractionType',
      'lossReason',
      'lossDetails',
      'sourceDetails',
      'dealValue'  // Campo correto do schema
      // Nota: 'amount' NÃO é um campo do Lead, apenas passamos para automação
    ]

    const updateData: any = {}

    // Filtrar apenas campos permitidos
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    // Garantir que 'amount' não seja incluído no updateData (não é campo do Lead)
    if ('amount' in updateData) {
      delete updateData.amount
    }

    // Sempre atualizar o updatedAt
    updateData.updatedAt = new Date()

    // Se está atualizando status, também atualizar lastActivityAt
    if (updateData.status) {
      updateData.lastActivityAt = new Date()
    }

    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tagAssignments: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
          },
        },
      },
    })

    // Criar atividade para acompanhar mudanças (se existir usuário)
    const userId = session?.user?.id || 'cmfvq4tnh0000nce5axicbr1u' // Fallback para admin
    if ((updateData.nextActionAt || updateData.status || updateData.lossReason) && userId) {
      let activityType = 'UPDATED'
      let activityPayload: any = { changes: updateData }

      if (updateData.nextActionAt) {
        activityType = 'FOLLOW_UP_SCHEDULED'
        activityPayload = {
          nextActionAt: updateData.nextActionAt,
          nextActionType: updateData.nextActionType,
          nextActionNotes: updateData.nextActionNotes,
        }
      } else if (updateData.status === 'LOST') {
        activityType = 'DISQUALIFIED'
        activityPayload = {
          lossReason: updateData.lossReason,
          lossDetails: updateData.lossDetails,
        }
      }

      try {
        await prisma.activity.create({
          data: {
            leadId: id,
            userId: userId,
            type: activityType,
            payload: JSON.stringify(activityPayload),
          },
        })
      } catch (activityError) {
        // Se falhar ao criar atividade, apenas log o erro mas não falhe a request
        console.warn('Failed to create activity:', activityError)
      }
    }

    // ✅ NOVO: Auto-criar Oportunidade usando configuração dinâmica
    if (updateData.status && userId) {
      const shouldTrigger = automationConfig.shouldCreateOpportunity(updateData.status)
      console.log(`🔍 Checking automation trigger for status ${updateData.status}: ${shouldTrigger ? 'YES' : 'NO'}`)

      if (shouldTrigger) {
        console.log(`🚀 Triggering automation for lead ${id}:`, {
          status: updateData.status,
          userId,
          amount: body.amount || body.dealValue,
          bodyData: body
        })
        try {
          await simpleOpportunityAutomation.createOpportunityFromLead(
            id,
            updateData.status,
            userId,
            body.dealValue || body.amount
          )
        } catch (opportunityError) {
          // Log o erro mas não falhe a atualização do lead
          console.warn('Failed to auto-create opportunity:', opportunityError)
        }
      } else {
        console.log(`⏭️  Status ${updateData.status} não configurado para automação - pulando`)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead atualizado com sucesso',
    })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}