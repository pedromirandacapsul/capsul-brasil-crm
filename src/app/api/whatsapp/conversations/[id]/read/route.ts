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

    const { id } = await params
    const conversationId = id

    // Verify conversation belongs to user's account
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        account: {
          userId: session.user.id,
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mark conversation as read
    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        unreadCount: 0,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error marking conversation as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}