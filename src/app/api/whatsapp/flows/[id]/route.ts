import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const flow = await prisma.messageFlow.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          include: {
            conversation: {
              select: {
                contactName: true,
                contactNumber: true
              }
            }
          }
        }
      }
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({ flow })

  } catch (error) {
    console.error('Error fetching flow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, isActive, triggerType, triggerValue, steps, triggers } = body

    // Verify ownership
    const existingFlow = await prisma.messageFlow.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingFlow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Update flow
    const flow = await prisma.messageFlow.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        triggerType,
        triggerValue
      }
    })

    // Update steps if provided
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await prisma.flowStep.deleteMany({
        where: { flowId: id }
      })

      // Create new steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await prisma.flowStep.create({
          data: {
            flowId: id,
            stepOrder: i + 1,
            stepType: step.stepType,
            messageType: step.messageType,
            content: step.content,
            mediaUrl: step.mediaUrl,
            delayMinutes: step.delayMinutes || 0,
            conditions: step.conditions ? JSON.stringify(step.conditions) : null,
            actions: step.actions ? JSON.stringify(step.actions) : null
          }
        })
      }
    }

    // Update triggers if provided
    if (triggers && Array.isArray(triggers)) {
      // Delete existing triggers
      await prisma.flowTrigger.deleteMany({
        where: { flowId: id }
      })

      // Create new triggers
      for (const trigger of triggers) {
        await prisma.flowTrigger.create({
          data: {
            flowId: id,
            triggerType: trigger.triggerType,
            triggerValue: trigger.triggerValue,
            isActive: trigger.isActive !== false
          }
        })
      }
    }

    // Fetch updated flow
    const updatedFlow = await prisma.messageFlow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true
      }
    })

    return NextResponse.json({
      success: true,
      flow: updatedFlow
    })

  } catch (error) {
    console.error('Error updating flow:', error)
    return NextResponse.json(
      { error: 'Failed to update flow' },
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingFlow = await prisma.messageFlow.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingFlow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Delete flow (cascades to steps, triggers, executions)
    await prisma.messageFlow.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting flow:', error)
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    )
  }
}