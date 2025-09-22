import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'
import { z } from 'zod'

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT']).default('TEXT'),
  mediaUrl: z.string().optional(),
  caption: z.string().optional(),
})

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
    const body = await request.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { content, messageType, mediaUrl, caption } = validation.data

    // Verify conversation belongs to user's account
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        account: {
          userId: session.user.id,
        },
      },
      include: {
        account: true,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.account.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'WhatsApp account is not connected' },
        { status: 400 }
      )
    }

    // Send message via ZapMeow
    console.log(`Sending message to ${conversation.contactNumber} via account ${conversation.accountId}`)
    console.log(`Message content: ${content}`)
    console.log(`Account status: ${conversation.account.status}`)

    const sendResult = await zapMeowService.sendMessage(
      conversation.accountId,
      conversation.contactNumber,
      content,
      messageType.toLowerCase()
    )

    console.log(`Send result:`, sendResult)

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Failed to send message' },
        { status: 500 }
      )
    }

    // Create message record
    const message = await prisma.whatsAppMessage.create({
      data: {
        accountId: conversation.accountId,
        conversationId: conversationId,
        whatsappId: sendResult.messageId,
        direction: 'OUTBOUND',
        messageType,
        content,
        mediaUrl,
        caption,
        status: 'SENT',
        fromNumber: conversation.account.phoneNumber,
        toNumber: conversation.contactNumber,
        timestamp: new Date(),
        sentById: session.user.id,
      },
    })

    // Update conversation
    await prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        status: message.status,
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}