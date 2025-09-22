import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
      'sourceDetails'
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
    if ((updateData.nextActionAt || updateData.status || updateData.lossReason) && session.user?.id) {
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
            userId: session.user.id,
            type: activityType,
            payload: JSON.stringify(activityPayload),
          },
        })
      } catch (activityError) {
        // Se falhar ao criar atividade, apenas log o erro mas não falhe a request
        console.warn('Failed to create activity:', activityError)
      }
    }

    // Auto-criar Oportunidade quando Lead é qualificado
    if (updateData.status && ['QUALIFIED', 'PROPOSAL', 'WON'].includes(updateData.status)) {
      try {
        // Verificar se já existe uma oportunidade para este lead
        const existingOpportunity = await prisma.opportunity.findFirst({
          where: { leadId: id }
        })

        if (!existingOpportunity) {
          // Mapear status do Lead para stage da Oportunidade
          const stageMapping: Record<string, string> = {
            'QUALIFIED': 'QUALIFICATION',
            'PROPOSAL': 'PROPOSAL',
            'WON': 'WON'
          }

          const stage = stageMapping[updateData.status] || 'NEW'

          // Buscar probabilidade do estágio
          let probability = 0
          try {
            const stageProbability = await prisma.stageProbability.findUnique({
              where: { stage }
            })
            probability = stageProbability?.probability || 0
          } catch {
            // Probabilidades padrão
            const defaultProbabilities: Record<string, number> = {
              'NEW': 10,
              'QUALIFICATION': 25,
              'DISCOVERY': 40,
              'PROPOSAL': 60,
              'NEGOTIATION': 80,
              'WON': 100,
              'LOST': 0
            }
            probability = defaultProbabilities[stage] || 10
          }

          // Criar a oportunidade
          const opportunity = await prisma.opportunity.create({
            data: {
              leadId: id,
              ownerId: session.user.id,
              stage,
              probability,
              // Se for WON, definir como fechado
              ...(stage === 'WON' && { closedAt: new Date() })
            }
          })

          // Criar histórico inicial do estágio
          await prisma.stageHistory.create({
            data: {
              opportunityId: opportunity.id,
              stageFrom: null,
              stageTo: stage,
              changedBy: session.user.id
            }
          })

          console.log(`Auto-created opportunity ${opportunity.id} for lead ${id} with stage ${stage}`)
        }
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