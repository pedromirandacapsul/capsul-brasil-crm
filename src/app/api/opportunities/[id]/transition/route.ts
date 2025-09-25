import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { opportunityWebhooks } from '@/services/webhook-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const VALID_STAGES = ['NEW', 'QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
const LOSS_REASONS = ['SEM_BUDGET', 'SEM_FIT', 'CONCORRENCIA', 'TIMING', 'NAO_RESPONDE', 'OUTROS']

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_EDIT)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para alterar estágios de oportunidades' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { stageTo, lostReason, amountBr } = body

    // Validate stageTo
    if (!stageTo || !VALID_STAGES.includes(stageTo)) {
      return NextResponse.json(
        { success: false, error: 'Estágio de destino inválido' },
        { status: 400 }
      )
    }

    // Get current opportunity
    const currentOpportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            name: true,
            company: true
          }
        }
      }
    })

    if (!currentOpportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can edit this opportunity
    if (userRole === 'SALES' && currentOpportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para alterar esta oportunidade' },
        { status: 403 }
      )
    }

    // Validate transition rules
    if (['PROPOSAL', 'NEGOTIATION'].includes(stageTo)) {
      if (!amountBr && !currentOpportunity.amountBr) {
        return NextResponse.json(
          { success: false, error: 'Valor é obrigatório para mover para estágios PROPOSAL ou NEGOTIATION' },
          { status: 400 }
        )
      }
    }

    if (stageTo === 'WON') {
      if (!amountBr && !currentOpportunity.amountBr) {
        return NextResponse.json(
          { success: false, error: 'Valor é obrigatório para marcar como WON' },
          { status: 400 }
        )
      }
    }

    if (stageTo === 'LOST') {
      if (!lostReason || !LOSS_REASONS.includes(lostReason)) {
        return NextResponse.json(
          { success: false, error: 'Motivo de perda válido é obrigatório para marcar como LOST' },
          { status: 400 }
        )
      }
    }

    // Get stage probability
    const stageProbability = await prisma.stageProbability.findUnique({
      where: { stage: stageTo }
    })

    // Prepare update data
    const updateData: any = {
      stage: stageTo,
      probability: stageProbability?.probability || 0
    }

    if (amountBr !== undefined) {
      updateData.amountBr = amountBr
    }

    if (stageTo === 'WON' && currentOpportunity.stage !== 'WON') {
      updateData.closedAt = new Date()
    }

    if (stageTo === 'LOST') {
      updateData.lostReason = lostReason
    }

    // Update opportunity
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id: id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            source: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create stage history entry
    await prisma.stageHistory.create({
      data: {
        opportunityId: id,
        stageFrom: currentOpportunity.stage,
        stageTo: stageTo,
        changedBy: session.user.id
      }
    })

    // Create audit log for important transitions
    if (['WON', 'LOST'].includes(stageTo)) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `OPPORTUNITY_${stageTo}`,
          resource: 'opportunity',
          resourceId: id,
          oldValues: JSON.stringify({
            stage: currentOpportunity.stage,
            amountBr: currentOpportunity.amountBr
          }),
          newValues: JSON.stringify({
            stage: stageTo,
            amountBr: updateData.amountBr || currentOpportunity.amountBr,
            lostReason: stageTo === 'LOST' ? lostReason : undefined
          }),
          metadata: JSON.stringify({
            leadName: currentOpportunity.lead.name,
            leadCompany: currentOpportunity.lead.company
          })
        }
      })
    }

    // Trigger webhooks for stage transition
    try {
      await opportunityWebhooks.stageChanged({
        opportunity: updatedOpportunity,
        previousStage: currentOpportunity.stage,
        newStage: stageTo,
        changedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      })

      // Trigger specific win/loss webhooks
      if (stageTo === 'WON' && currentOpportunity.stage !== 'WON') {
        await opportunityWebhooks.won({
          opportunity: updatedOpportunity,
          previousStage: currentOpportunity.stage,
          wonBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        })
      } else if (stageTo === 'LOST' && currentOpportunity.stage !== 'LOST') {
        await opportunityWebhooks.lost({
          opportunity: updatedOpportunity,
          previousStage: currentOpportunity.stage,
          lostReason,
          lostBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        })
      }
    } catch (webhookError) {
      console.error('Webhook error for opportunity transition:', webhookError)
      // Don't fail the API call if webhook fails
    }

    return NextResponse.json({
      success: true,
      data: updatedOpportunity,
      message: `Oportunidade movida para ${getStageLabel(stageTo)} com sucesso`
    })

  } catch (error) {
    console.error('Error transitioning opportunity stage:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'NEW': 'Novo',
    'QUALIFICATION': 'Qualificação',
    'DISCOVERY': 'Descoberta',
    'PROPOSAL': 'Proposta',
    'NEGOTIATION': 'Negociação',
    'WON': 'Ganho',
    'LOST': 'Perdido'
  }
  return labels[stage] || stage
}