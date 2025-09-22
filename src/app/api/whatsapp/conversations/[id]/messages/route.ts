import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversationId = id

    console.log('Fetching messages for conversation:', conversationId)

    // Verify conversation exists (temporarily removing user check for debugging)
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
      },
    })

    if (!conversation) {
      console.log('Conversation not found:', conversationId)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    console.log('Conversation found:', conversation.contactName)

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    console.log('Found', messages.length, 'messages for conversation:', conversationId)

    // Mark messages as read
    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        unreadCount: 0,
      },
    })

    console.log('Returning messages for conversation:', conversationId)

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}