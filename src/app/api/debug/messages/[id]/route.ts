import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conversationId = id

    console.log('Debug: Fetching messages for conversation:', conversationId)

    // First check if conversation exists
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
      },
    })

    if (!conversation) {
      console.log('Debug: Conversation not found:', conversationId)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    console.log('Debug: Conversation found:', conversation.contactName)

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    console.log('Debug: Found', messages.length, 'messages')

    return NextResponse.json({
      success: true,
      messages,
      conversation: {
        id: conversation.id,
        contactName: conversation.contactName,
        contactNumber: conversation.contactNumber,
      }
    })
  } catch (error) {
    console.error('Debug: Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}