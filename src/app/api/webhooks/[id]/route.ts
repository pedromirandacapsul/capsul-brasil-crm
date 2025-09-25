import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { webhookService, WebhookService } from '@/services/webhook-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/webhooks/[id] - Get specific webhook
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            event: true,
            status: true,
            responseCode: true,
            error: true,
            attempt: true,
            createdAt: true,
            deliveredAt: true
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    const stats = await webhookService.getDeliveryStats(webhook.id)

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        events: JSON.parse(webhook.events),
        headers: webhook.headers ? JSON.parse(webhook.headers) : null,
        deliveryStats: stats
      }
    })

  } catch (error) {
    console.error('Error fetching webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/webhooks/[id] - Update webhook
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Sem permissão para editar webhooks' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, url, events, secret, active, retryCount, timeout, headers } = body

    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id }
    })

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    // Validate fields if provided
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { success: false, error: 'URL inválida' },
          { status: 400 }
        )
      }
    }

    if (events) {
      if (!Array.isArray(events)) {
        return NextResponse.json(
          { success: false, error: 'Eventos deve ser um array' },
          { status: 400 }
        )
      }

      const validEvents = Object.values(WebhookService.EVENTS)
      const invalidEvents = events.filter((event: string) => !validEvents.includes(event))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { success: false, error: `Eventos inválidos: ${invalidEvents.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate webhook URL if changed (optional in development)
    if (url && url !== existingWebhook.url && process.env.NODE_ENV === 'production') {
      const isValid = await webhookService.validateWebhookUrl(url, secret || existingWebhook.secret)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Não foi possível validar o novo webhook URL' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (events !== undefined) updateData.events = JSON.stringify(events)
    if (secret !== undefined) updateData.secret = secret
    if (active !== undefined) updateData.active = active
    if (retryCount !== undefined) updateData.retryCount = retryCount
    if (timeout !== undefined) updateData.timeout = timeout
    if (headers !== undefined) updateData.headers = headers ? JSON.stringify(headers) : null

    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
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
        ...updatedWebhook,
        events: JSON.parse(updatedWebhook.events),
        headers: updatedWebhook.headers ? JSON.parse(updatedWebhook.headers) : null
      },
      message: 'Webhook atualizado com sucesso'
    })

  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/webhooks/[id] - Delete webhook
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Sem permissão para deletar webhooks' },
        { status: 403 }
      )
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id }
    })

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    await prisma.webhook.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook deletado com sucesso'
    })

  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}