import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, priority, category, assigneeId, leadId, dueAt, title, description } = body

    // Prepare update data - only include fields that were provided
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (status !== undefined) {
      updateData.status = status
      updateData.statusChangedAt = new Date()
    }
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (leadId !== undefined) updateData.leadId = leadId
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
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
        subtasks: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}