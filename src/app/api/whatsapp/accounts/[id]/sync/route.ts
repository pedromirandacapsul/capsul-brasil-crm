import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { whatsappManager } from '@/lib/whatsapp-manager'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const accountId = id

    // Verify account belongs to user
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (account.status !== 'CONNECTED') {
      return NextResponse.json({ error: 'Account not connected' }, { status: 400 })
    }

    console.log(`Starting full sync for account ${accountId}`)

    // Force sync all chats
    const result = await whatsappManager.syncAllChats(accountId)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to sync chats'
      }, { status: 500 })
    }

    console.log(`Sync completed for account ${accountId}. ${result.totalSynced} conversations synced.`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.totalSynced} conversations`,
      totalSynced: result.totalSynced
    })

  } catch (error) {
    console.error('Error syncing chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}