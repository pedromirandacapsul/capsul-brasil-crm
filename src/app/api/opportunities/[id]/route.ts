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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar oportunidades' },
        { status: 403 }
      )
    }

    const { id } = await params

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
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
        },
        items: true,
        stageHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { changedAt: 'desc' }
        }
      }
    })

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can view this opportunity
    if (userRole === 'SALES' && opportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar esta oportunidade' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: opportunity
    })

  } catch (error) {
    console.error('Error fetching opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Sem permissão para editar oportunidades' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Get current opportunity
    const currentOpportunity = await prisma.opportunity.findUnique({
      where: { id }
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
        { success: false, error: 'Sem permissão para editar esta oportunidade' },
        { status: 403 }
      )
    }

    // Check if trying to edit amount after WON (only admin can)
    if (currentOpportunity.stage === 'WON' && body.amountBr !== undefined && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem alterar valor de oportunidades fechadas' },
        { status: 403 }
      )
    }

    // Validate stage-specific rules
    if (body.stage) {
      if (['PROPOSAL', 'NEGOTIATION'].includes(body.stage) && !body.amountBr && !currentOpportunity.amountBr) {
        return NextResponse.json(
          { success: false, error: 'Valor é obrigatório para estágios PROPOSAL e NEGOTIATION' },
          { status: 400 }
        )
      }

      if (body.stage === 'WON' && (!body.amountBr && !currentOpportunity.amountBr)) {
        return NextResponse.json(
          { success: false, error: 'Valor é obrigatório para marcar como WON' },
          { status: 400 }
        )
      }

      if (body.stage === 'LOST' && !body.lostReason) {
        return NextResponse.json(
          { success: false, error: 'Motivo da perda é obrigatório para marcar como LOST' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = { ...body }

    // Convert expectedCloseAt string to Date if provided
    if (updateData.expectedCloseAt && typeof updateData.expectedCloseAt === 'string') {
      updateData.expectedCloseAt = new Date(updateData.expectedCloseAt)
    }

    // Set closedAt for WON stage
    if (body.stage === 'WON' && currentOpportunity.stage !== 'WON') {
      updateData.closedAt = new Date()
    }

    // Update probability based on stage if not manually set by manager/admin
    if (body.stage && !body.probability && !['MANAGER', 'ADMIN'].includes(userRole)) {
      const stageProbability = await prisma.stageProbability.findUnique({
        where: { stage: body.stage }
      })
      if (stageProbability) {
        updateData.probability = stageProbability.probability
      }
    }

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
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

    // Create stage history if stage changed
    if (body.stage && body.stage !== currentOpportunity.stage) {
      await prisma.stageHistory.create({
        data: {
          opportunityId: id,
          stageFrom: currentOpportunity.stage,
          stageTo: body.stage,
          changedBy: session.user.id
        }
      })
    }

    // Audit log for amount changes after WON
    if (currentOpportunity.stage === 'WON' && body.amountBr !== undefined && userRole === 'ADMIN') {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_WON_AMOUNT',
          resource: 'opportunity',
          resourceId: id,
          oldValues: JSON.stringify({ amountBr: currentOpportunity.amountBr }),
          newValues: JSON.stringify({ amountBr: body.amountBr }),
          metadata: JSON.stringify({ reason: 'Admin override after won' })
        }
      })
    }

    // Trigger webhooks for opportunity changes
    try {
      // Always trigger updated webhook
      await opportunityWebhooks.updated({
        opportunity: updatedOpportunity,
        previousData: currentOpportunity,
        changedFields: Object.keys(body),
        updatedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      })

      // Trigger specific webhooks for stage changes
      if (body.stage && body.stage !== currentOpportunity.stage) {
        await opportunityWebhooks.stageChanged({
          opportunity: updatedOpportunity,
          previousStage: currentOpportunity.stage,
          newStage: body.stage,
          changedBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        })

        // Trigger specific win/loss webhooks
        if (body.stage === 'WON' && currentOpportunity.stage !== 'WON') {
          await opportunityWebhooks.won({
            opportunity: updatedOpportunity,
            previousStage: currentOpportunity.stage,
            wonBy: {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email
            }
          })
        } else if (body.stage === 'LOST' && currentOpportunity.stage !== 'LOST') {
          await opportunityWebhooks.lost({
            opportunity: updatedOpportunity,
            previousStage: currentOpportunity.stage,
            lostReason: body.lostReason,
            lostBy: {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email
            }
          })
        }
      }
    } catch (webhookError) {
      console.error('Webhook error for opportunity update:', webhookError)
      // Don't fail the API call if webhook fails
    }

    return NextResponse.json({
      success: true,
      data: updatedOpportunity
    })

  } catch (error) {
    console.error('Error updating opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar oportunidades' },
        { status: 403 }
      )
    }

    const { id } = await params

    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    })

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can delete this opportunity
    if (userRole === 'SALES' && opportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar esta oportunidade' },
        { status: 403 }
      )
    }

    await prisma.opportunity.delete({
      where: { id }
    })

    // Trigger webhook for opportunity deletion
    try {
      await opportunityWebhooks.deleted({
        opportunity,
        deletedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      })
    } catch (webhookError) {
      console.error('Webhook error for opportunity deletion:', webhookError)
      // Don't fail the API call if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: 'Oportunidade deletada com sucesso'
    })

  } catch (error) {
    console.error('Error deleting opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}