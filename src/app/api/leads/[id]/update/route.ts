import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { simpleOpportunityAutomation } from '@/services/simple-opportunity-automation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // TEMPORÁRIO: Bypass de autenticação para testes
    const skipAuth = true

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
      'amount',
      'amountBr'
    ]

    const updateData: any = {}

    // Filtrar apenas campos permitidos
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
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

    // Auto-criar Oportunidade usando o serviço de automação simples
    if (updateData.status && userId && ['QUALIFIED', 'PROPOSAL', 'WON'].includes(updateData.status)) {
      console.log(`🚀 Triggering automation for lead ${id}:`, {
        status: updateData.status,
        userId,
        amount: body.amount,
        bodyData: body
      })
      try {
        await simpleOpportunityAutomation.createOpportunityFromLead(
          id,
          updateData.status,
          userId,
          body.amount || body.amountBr
        )
      } catch (opportunityError) {
        // Log o erro mas não falhe a atualização do lead
        console.warn('Failed to auto-create opportunity:', opportunityError)
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