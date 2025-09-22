import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flows = await prisma.messageFlow.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true,
        executions: {
          take: 5,
          orderBy: { startedAt: 'desc' },
          include: {
            conversation: {
              select: {
                contactName: true,
                contactNumber: true
              }
            }
          }
        },
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ flows })

  } catch (error) {
    console.error('Error fetching flows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, triggerType, triggerValue, steps, triggers } = body

    if (!name || !triggerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create flow
    const flow = await prisma.messageFlow.create({
      data: {
        userId: session.user.id,
        name,
        description,
        triggerType,
        triggerValue,
        isActive: true
      }
    })

    // Create steps if provided
    if (steps && Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await prisma.flowStep.create({
          data: {
            flowId: flow.id,
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

    // Create additional triggers if provided
    if (triggers && Array.isArray(triggers)) {
      for (const trigger of triggers) {
        await prisma.flowTrigger.create({
          data: {
            flowId: flow.id,
            triggerType: trigger.triggerType,
            triggerValue: trigger.triggerValue,
            isActive: true
          }
        })
      }
    }

    // Fetch complete flow with relations
    const completeFlow = await prisma.messageFlow.findUnique({
      where: { id: flow.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true
      }
    })

    return NextResponse.json({
      success: true,
      flow: completeFlow
    })

  } catch (error) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { error: 'Failed to create flow' },
      { status: 500 }
    )
  }
}