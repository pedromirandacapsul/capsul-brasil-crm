import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { flowEngine } from '@/lib/whatsapp/flow-engine'

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

    const execution = await prisma.flowExecution.findFirst({
      where: {
        id,
        flow: {
          userId: session.user.id
        }
      },
      include: {
        flow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        conversation: {
          select: {
            contactName: true,
            contactNumber: true
          }
        },
        account: {
          select: {
            phoneNumber: true,
            displayName: true
          }
        },
        currentStep: true
      }
    })

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    return NextResponse.json({ execution })

  } catch (error) {
    console.error('Error fetching flow execution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow execution' },
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Verify execution ownership
    const execution = await prisma.flowExecution.findFirst({
      where: {
        id,
        flow: {
          userId: session.user.id
        }
      }
    })

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    switch (action) {
      case 'pause':
        await flowEngine.pauseExecution(id)
        break
      case 'resume':
        await flowEngine.resumeExecution(id)
        break
      case 'stop':
        await flowEngine.stopExecution(id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch updated execution
    const updatedExecution = await prisma.flowExecution.findUnique({
      where: { id },
      include: {
        flow: {
          select: {
            name: true,
            description: true
          }
        },
        conversation: {
          select: {
            contactName: true,
            contactNumber: true
          }
        },
        currentStep: true
      }
    })

    return NextResponse.json({
      success: true,
      execution: updatedExecution
    })

  } catch (error) {
    console.error('Error controlling flow execution:', error)
    return NextResponse.json(
      { error: 'Failed to control flow execution' },
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

    // Verify execution ownership
    const execution = await prisma.flowExecution.findFirst({
      where: {
        id,
        flow: {
          userId: session.user.id
        }
      }
    })

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    }

    // Stop execution first
    await flowEngine.stopExecution(id)

    // Delete execution record
    await prisma.flowExecution.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting flow execution:', error)
    return NextResponse.json(
      { error: 'Failed to delete flow execution' },
      { status: 500 }
    )
  }
}