import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { webhookService, WebhookService } from '@/services/webhook-service'

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar webhooks' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const active = searchParams.get('active')

    const skip = (page - 1) * limit

    const whereClause: any = {}
    if (active !== null) {
      whereClause.active = active === 'true'
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.webhook.count({ where: whereClause })
    ])

    // Add delivery stats for each webhook
    const webhooksWithStats = await Promise.all(
      webhooks.map(async (webhook) => {
        const stats = await webhookService.getDeliveryStats(webhook.id)
        return {
          ...webhook,
          events: JSON.parse(webhook.events),
          headers: webhook.headers ? JSON.parse(webhook.headers) : null,
          deliveryStats: stats
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: webhooksWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar webhooks' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, url, events, secret, active = true, retryCount = 3, timeout = 30, headers } = body

    // Validate required fields
    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: 'Nome, URL e eventos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL inválida' },
        { status: 400 }
      )
    }

    // Validate events
    const validEvents = Object.values(WebhookService.EVENTS)
    const invalidEvents = events.filter((event: string) => !validEvents.includes(event))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { success: false, error: `Eventos inválidos: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate webhook URL (optional - can be skipped for development)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await webhookService.validateWebhookUrl(url, secret)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Não foi possível validar o webhook URL. Verifique se o endpoint está funcionando.' },
          { status: 400 }
        )
      }
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: JSON.stringify(events),
        secret,
        active,
        retryCount,
        timeout,
        headers: headers ? JSON.stringify(headers) : null,
        createdById: session?.user?.id || 'cmfvq4tnh0000nce5axicbr1u'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        events: JSON.parse(webhook.events),
        headers: webhook.headers ? JSON.parse(webhook.headers) : null
      },
      message: 'Webhook criado com sucesso'
    })

  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}