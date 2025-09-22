import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30000) // últimos 30 segundos por padrão

    // Buscar novas mensagens desde o último check
    const newMessages = await prisma.whatsAppMessage.findMany({
      where: {
        accountId,
        timestamp: {
          gt: sinceDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    })

    // Buscar atualizações de status de mensagens (usar timestamp já que updatedAt não existe)
    const statusUpdates = await prisma.whatsAppMessage.findMany({
      where: {
        accountId,
        timestamp: {
          gt: sinceDate
        }
      },
      select: {
        id: true,
        whatsappId: true,
        status: true,
        timestamp: true
      },
      take: 50
    })

    // Buscar conversas atualizadas
    const conversationUpdates = await prisma.whatsAppConversation.findMany({
      where: {
        accountId,
        updatedAt: {
          gt: sinceDate
        }
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      take: 20
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      newMessages,
      statusUpdates: statusUpdates.map(msg => ({
        messageId: msg.whatsappId || msg.id,
        status: msg.status,
        updatedAt: msg.timestamp
      })),
      conversationUpdates
    })

  } catch (error) {
    console.error('Error fetching updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    )
  }
}