import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { webhookService } from '@/services/webhook-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/webhooks/[id]/test - Test webhook endpoint
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: 'Sem permissão para testar webhooks' },
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

    if (!webhook.active) {
      return NextResponse.json(
        { success: false, error: 'Webhook está inativo' },
        { status: 400 }
      )
    }

    // Test the webhook with a sample payload
    const isValid = await webhookService.validateWebhookUrl(webhook.url, webhook.secret)

    return NextResponse.json({
      success: true,
      valid: isValid,
      message: isValid
        ? 'Webhook testado com sucesso'
        : 'Webhook falhou no teste. Verifique a URL e configurações.'
    })

  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}