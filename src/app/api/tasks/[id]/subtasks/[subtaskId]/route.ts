import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const updateSubtaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  completed: z.boolean().optional(),
})

// PATCH - Update subtask
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, subtaskId } = params
    const body = await request.json()

    // Validate input
    const validatedData = updateSubtaskSchema.parse(body)

    // Verify subtask exists and belongs to the task
    const subtask = await prisma.taskSubitem.findFirst({
      where: {
        id: subtaskId,
        taskId: id
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtarefa não encontrada' }, { status: 404 })
    }

    // Update subtask
    const updatedSubtask = await prisma.taskSubitem.update({
      where: { id: subtaskId },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: updatedSubtask
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, subtaskId } = params

    // Verify subtask exists and belongs to the task
    const subtask = await prisma.taskSubitem.findFirst({
      where: {
        id: subtaskId,
        taskId: id
      }
    })

    if (!subtask) {
      return NextResponse.json({ error: 'Subtarefa não encontrada' }, { status: 404 })
    }

    // Delete subtask
    await prisma.taskSubitem.delete({
      where: { id: subtaskId }
    })

    return NextResponse.json({
      success: true,
      message: 'Subtarefa removida com sucesso'
    })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}