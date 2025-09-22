import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'
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
    const accountId = id

    // Verify account belongs to user
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (account.status !== 'CONNECTED') {
      return NextResponse.json({
        error: 'WhatsApp account not connected. Please connect first.'
      }, { status: 400 })
    }

    const body = await request.json()
    const { to, type, content, mediaUrl, caption, templateName, templateParams } = body

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'text' && !content) {
      return NextResponse.json({ error: 'Content is required for text messages' }, { status: 400 })
    }

    console.log(`📤 Sending ZapMeow message to ${to}`)

    try {
      if (type === 'text') {
        const sendResult = await zapMeowService.sendMessage(accountId, to, content, 'text')

        if (!sendResult.success) {
          return NextResponse.json({
            error: sendResult.error || 'Failed to send message via ZapMeow'
          }, { status: 500 })
        }

        console.log(`✅ ZapMeow message sent successfully: ${sendResult.messageId}`)

        return NextResponse.json({
          success: true,
          messageId: sendResult.messageId,
          message: 'Message sent via ZapMeow',
          method: 'zapmeow'
        })
      } else {
        return NextResponse.json({
          error: 'Message type not supported yet'
        }, { status: 400 })
      }

    } catch (sendError) {
      console.error('❌ Error sending ZapMeow message:', sendError)
      return NextResponse.json({
        error: 'Failed to send ZapMeow message. Check connection and try again.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in send route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}