import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: flowId } = await params
    const body = await request.json()
    const { name } = body

    // Get original flow with steps
    const originalFlow = await prisma.messageFlow.findFirst({
      where: {
        id: flowId,
        userId: session.user.id
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true
      }
    })

    if (!originalFlow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Create duplicate flow
    const duplicateFlow = await prisma.messageFlow.create({
      data: {
        userId: session.user.id,
        name: name || `${originalFlow.name} (Cópia)`,
        description: originalFlow.description,
        triggerType: originalFlow.triggerType,
        triggerValue: originalFlow.triggerValue,
        isActive: false // Start as inactive
      }
    })

    // Duplicate steps
    for (const step of originalFlow.steps) {
      await prisma.flowStep.create({
        data: {
          flowId: duplicateFlow.id,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          messageType: step.messageType,
          content: step.content,
          mediaUrl: step.mediaUrl,
          delayMinutes: step.delayMinutes,
          conditions: step.conditions,
          actions: step.actions
        }
      })
    }

    // Duplicate triggers
    for (const trigger of originalFlow.triggers) {
      await prisma.flowTrigger.create({
        data: {
          flowId: duplicateFlow.id,
          triggerType: trigger.triggerType,
          triggerValue: trigger.triggerValue,
          isActive: trigger.isActive
        }
      })
    }

    // Get complete duplicated flow
    const completeFlow = await prisma.messageFlow.findUnique({
      where: { id: duplicateFlow.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true
      }
    })

    return NextResponse.json({
      success: true,
      flow: completeFlow,
      message: 'Flow duplicated successfully'
    })

  } catch (error) {
    console.error('Error duplicating flow:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate flow' },
      { status: 500 }
    )
  }
}