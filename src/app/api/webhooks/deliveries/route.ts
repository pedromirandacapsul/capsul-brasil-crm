import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { webhookService } from '@/services/webhook-service'

// GET /api/webhooks/deliveries - Get webhook deliveries with filtering
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
        { success: false, error: 'Sem permissão para visualizar deliveries de webhook' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const webhookId = searchParams.get('webhook_id')
    const status = searchParams.get('status')
    const event = searchParams.get('event')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const skip = (page - 1) * limit

    const whereClause: any = {}

    if (webhookId) {
      whereClause.webhookId = webhookId
    }

    if (status) {
      whereClause.status = status
    }

    if (event) {
      whereClause.event = event
    }

    if (from || to) {
      whereClause.createdAt = {}
      if (from) {
        whereClause.createdAt.gte = new Date(from)
      }
      if (to) {
        whereClause.createdAt.lte = new Date(to)
      }
    }

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: whereClause,
        include: {
          webhook: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.webhookDelivery.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching webhook deliveries:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/webhooks/deliveries/retry - Retry failed deliveries
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
        { success: false, error: 'Sem permissão para retentar deliveries de webhook' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { deliveryIds } = body

    if (!deliveryIds || !Array.isArray(deliveryIds)) {
      // Retry all pending failed deliveries
      await webhookService.retryFailedDeliveries()

      return NextResponse.json({
        success: true,
        message: 'Tentando reenviar todos os webhooks falhados'
      })
    }

    // Retry specific delivery IDs
    let retriedCount = 0

    for (const deliveryId of deliveryIds) {
      try {
        const delivery = await prisma.webhookDelivery.findUnique({
          where: { id: deliveryId },
          include: { webhook: true }
        })

        if (!delivery || !delivery.webhook.active) {
          continue
        }

        if (delivery.attempt >= delivery.webhook.retryCount) {
          continue
        }

        // Update delivery attempt and reset status
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'PENDING',
            attempt: delivery.attempt + 1,
            nextRetryAt: null,
            error: null
          }
        })

        // Trigger the webhook again
        const payload = JSON.parse(delivery.payload)
        await webhookService.triggerEvent(delivery.event, payload.data)

        retriedCount++
      } catch (error) {
        console.error(`Failed to retry delivery ${deliveryId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${retriedCount} deliveries foram reagendados para reenvio`
    })

  } catch (error) {
    console.error('Error retrying webhook deliveries:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}