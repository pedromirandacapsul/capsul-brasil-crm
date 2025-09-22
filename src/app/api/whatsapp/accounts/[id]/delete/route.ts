import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { whatsappManager } from '@/lib/whatsapp-manager'

export async function DELETE(
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

    // Disconnect the WhatsApp session first
    await whatsappManager.disconnectSession(accountId)

    // Delete all related data
    await prisma.$transaction([
      // Delete messages
      prisma.whatsAppMessage.deleteMany({
        where: { accountId }
      }),
      // Delete conversations
      prisma.whatsAppConversation.deleteMany({
        where: { accountId }
      }),
      // Delete the account
      prisma.whatsAppAccount.delete({
        where: { id: accountId }
      })
    ])

    // Clean up session files if they exist
    try {
      const fs = require('fs')
      const path = require('path')
      const sessionPath = path.join(process.cwd(), 'whatsapp-sessions', accountId)
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
      }
    } catch (error) {
      console.log('Session cleanup error (non-critical):', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}