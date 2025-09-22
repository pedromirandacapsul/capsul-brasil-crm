import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { whatsappManager } from '@/lib/whatsapp-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params

    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Disconnect the WhatsApp session
    const disconnected = await whatsappManager.disconnectSession(accountId)

    if (!disconnected) {
      return NextResponse.json(
        { error: 'Failed to disconnect WhatsApp session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    })
  } catch (error) {
    console.error('Error disconnecting account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}