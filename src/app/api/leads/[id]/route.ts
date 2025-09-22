import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
  ownerId: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  roleTitle: z.string().optional(),
  interest: z.string().optional(),
})

export async function GET(
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
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lead,
    })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const validatedData = updateLeadSchema.parse(body)

    const { id } = await params
    // Get current lead to track changes
    const currentLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!currentLead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Update lead and create activity in transaction
    const updatedLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
          lastActivityAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create activity for status change
      if (validatedData.status && validatedData.status !== currentLead.status) {
        await tx.activity.create({
          data: {
            leadId: id,
            userId: session.user.id,
            type: 'STATUS_CHANGED',
            payload: JSON.stringify({
              message: `Status alterado de ${currentLead.status} para ${validatedData.status}`,
              previousStatus: currentLead.status,
              newStatus: validatedData.status,
            }),
          },
        })
      }

      // Create activity for owner change
      if (validatedData.ownerId && validatedData.ownerId !== currentLead.ownerId) {
        await tx.activity.create({
          data: {
            leadId: id,
            userId: session.user.id,
            type: 'OWNER_CHANGED',
            payload: JSON.stringify({
              message: 'Responsável alterado',
              previousOwnerId: currentLead.ownerId,
              newOwnerId: validatedData.ownerId,
            }),
          },
        })
      }

      // Create activity for other updates
      const changedFields = Object.keys(validatedData).filter(
        key => key !== 'status' && key !== 'ownerId' &&
        validatedData[key as keyof typeof validatedData] !== currentLead[key as keyof typeof currentLead]
      )

      if (changedFields.length > 0) {
        await tx.activity.create({
          data: {
            leadId: id,
            userId: session.user.id,
            type: 'UPDATED',
            payload: JSON.stringify({
              message: `Lead atualizado: ${changedFields.join(', ')}`,
              changedFields,
            }),
          },
        })
      }

      return lead
    })

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead atualizado com sucesso',
    })
  } catch (error) {
    console.error('Error updating lead:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if user has permission to delete leads
    // For now, only admins can delete leads
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar leads' },
        { status: 403 }
      )
    }

    await prisma.lead.delete({
      where: { id: id },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead deletado com sucesso',
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}