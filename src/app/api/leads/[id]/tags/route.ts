import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const assignTagSchema = z.object({
  tagId: z.string().min(1, 'Tag é obrigatória'),
})

const bulkAssignSchema = z.object({
  tagIds: z.array(z.string()).min(1, 'Pelo menos uma tag é obrigatória'),
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

    const { id: leadId } = await params

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Get lead tags
    const leadTags = await prisma.leadTagAssignment.findMany({
      where: { leadId },
      include: {
        tag: true,
        assigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: leadTags.map(assignment => ({
        id: assignment.id,
        assignedAt: assignment.assignedAt,
        assigner: assignment.assigner,
        tag: assignment.tag
      }))
    })

  } catch (error) {
    console.error('Error fetching lead tags:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const { id: leadId } = await params
    const body = await request.json()

    // Check if it's bulk assignment or single
    const isBulk = Array.isArray(body.tagIds)
    const validatedData = isBulk ?
      bulkAssignSchema.parse(body) :
      assignTagSchema.parse(body)

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    const tagIds = isBulk ? validatedData.tagIds : [validatedData.tagId]

    // Verify all tags exist
    const tags = await prisma.leadTag.findMany({
      where: {
        id: {
          in: tagIds
        },
        active: true
      }
    })

    if (tags.length !== tagIds.length) {
      return NextResponse.json(
        { success: false, error: 'Uma ou mais tags não foram encontradas ou estão inativas' },
        { status: 404 }
      )
    }

    // Check for existing assignments
    const existingAssignments = await prisma.leadTagAssignment.findMany({
      where: {
        leadId,
        tagId: {
          in: tagIds
        }
      }
    })

    const existingTagIds = existingAssignments.map(a => a.tagId)
    const newTagIds = tagIds.filter(id => !existingTagIds.includes(id))

    if (newTagIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Todas as tags já estão atribuídas a este lead' },
        { status: 400 }
      )
    }

    // Create new assignments
    const newAssignments = await prisma.$transaction(
      newTagIds.map(tagId =>
        prisma.leadTagAssignment.create({
          data: {
            leadId,
            tagId,
            assignedBy: session.user.id
          },
          include: {
            tag: true,
            assigner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      )
    )

    // Create activity log
    await prisma.activity.create({
      data: {
        leadId,
        userId: session.user.id,
        type: 'TAG_ASSIGNED',
        payload: JSON.stringify({
          tags: newAssignments.map(a => ({
            id: a.tag.id,
            name: a.tag.name,
            color: a.tag.color
          }))
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: newAssignments.map(assignment => ({
        id: assignment.id,
        assignedAt: assignment.assignedAt,
        assigner: assignment.assigner,
        tag: assignment.tag
      })),
      message: `${newAssignments.length} tag(s) atribuída(s) com sucesso`
    })

  } catch (error) {
    console.error('Error assigning tags to lead:', error)

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

    const { id: leadId } = await params
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Tag ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verify assignment exists
    const assignment = await prisma.leadTagAssignment.findFirst({
      where: {
        leadId,
        tagId
      },
      include: {
        tag: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Tag não está atribuída a este lead' },
        { status: 404 }
      )
    }

    // Remove assignment
    await prisma.leadTagAssignment.delete({
      where: {
        id: assignment.id
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        leadId,
        userId: session.user.id,
        type: 'TAG_REMOVED',
        payload: JSON.stringify({
          tag: {
            id: assignment.tag.id,
            name: assignment.tag.name,
            color: assignment.tag.color
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tag removida com sucesso'
    })

  } catch (error) {
    console.error('Error removing tag from lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}