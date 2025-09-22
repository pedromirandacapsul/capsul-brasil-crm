import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { flowEngine } from '@/lib/whatsapp/flow-engine'

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
    const { conversationId, accountId } = body

    if (!conversationId || !accountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify flow ownership
    const flow = await prisma.messageFlow.findFirst({
      where: {
        id: flowId,
        userId: session.user.id
      }
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    if (!flow.isActive) {
      return NextResponse.json({ error: 'Flow is not active' }, { status: 400 })
    }

    // Verify account ownership
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Verify conversation exists
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        accountId: accountId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Trigger manual flow execution
    const executionId = await flowEngine.startFlowExecution(flowId, conversationId, accountId)

    return NextResponse.json({
      success: true,
      executionId
    })

  } catch (error) {
    console.error('Error triggering flow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger flow' },
      { status: 500 }
    )
  }
}