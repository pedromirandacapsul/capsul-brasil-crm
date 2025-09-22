import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { massMessagingService } from '@/lib/whatsapp/mass-messaging-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock campaigns data for testing
    const mockCampaigns = [
      {
        id: 'campaign-1',
        campaignName: 'Promoção Black Friday 2024',
        messageType: 'TEXT',
        content: 'Oferta especial! 50% de desconto em todos os nossos serviços até meia-noite! 🔥\n\nAproveite esta oportunidade única!',
        status: 'COMPLETED',
        targetCount: 1500,
        sentCount: 1500,
        deliveredCount: 1487,
        readCount: 1203,
        failedCount: 13,
        scheduledAt: '2024-01-20T09:00:00Z',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-20T11:45:00Z'
      },
      {
        id: 'campaign-2',
        campaignName: 'Lançamento Novo Produto',
        messageType: 'TEXT',
        content: 'Estamos lançando uma nova solução revolucionária! 🚀\n\nSeja um dos primeiros a conhecer. Quer saber mais?',
        status: 'SENDING',
        targetCount: 800,
        sentCount: 320,
        deliveredCount: 315,
        readCount: 89,
        failedCount: 5,
        scheduledAt: '2024-01-21T10:00:00Z',
        createdAt: '2024-01-20T16:20:00Z',
        updatedAt: '2024-01-21T10:30:00Z'
      },
      {
        id: 'campaign-3',
        campaignName: 'Pesquisa de Satisfação',
        messageType: 'TEXT',
        content: 'Como foi sua experiência conosco? ⭐\n\nSua opinião é muito importante para nós!',
        status: 'SCHEDULED',
        targetCount: 450,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        scheduledAt: '2024-01-22T15:00:00Z',
        createdAt: '2024-01-21T11:15:00Z',
        updatedAt: '2024-01-21T11:15:00Z'
      }
    ]

    return NextResponse.json({
      campaigns: mockCampaigns,
      total: mockCampaigns.length
    })

  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountId,
      name,
      messageType,
      content,
      mediaUrl,
      targets,
      scheduledAt,
      rateLimitPerMinute,
      personalizeMessages,
      useTypingSimulation,
      audienceFilter
    } = body

    if (!accountId || !name || !messageType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    let campaignTargets = targets || []

    // If audience filter is provided, generate targets automatically
    if (audienceFilter && (!targets || targets.length === 0)) {
      campaignTargets = await massMessagingService.filterConversationsForCampaign(
        accountId,
        audienceFilter
      )
    }

    if (campaignTargets.length === 0) {
      return NextResponse.json({ error: 'No targets specified or found' }, { status: 400 })
    }

    // Create campaign
    const result = await massMessagingService.createCampaign(accountId, {
      name,
      messageType,
      content,
      mediaUrl,
      targets: campaignTargets,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      rateLimitPerMinute,
      personalizeMessages,
      useTypingSimulation,
      audienceFilter
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      targetCount: campaignTargets.length
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}