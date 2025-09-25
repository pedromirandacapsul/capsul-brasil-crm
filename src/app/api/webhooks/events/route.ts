import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { WebhookService } from '@/services/webhook-service'

// GET /api/webhooks/events - Get available webhook events
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
        { success: false, error: 'Sem permissão para visualizar eventos de webhook' },
        { status: 403 }
      )
    }

    const events = Object.entries(WebhookService.EVENTS).map(([key, value]) => ({
      key,
      value,
      description: getEventDescription(value)
    }))

    return NextResponse.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error fetching webhook events:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    'opportunity.created': 'Disparado quando uma nova oportunidade é criada',
    'opportunity.updated': 'Disparado quando uma oportunidade é atualizada',
    'opportunity.stage_changed': 'Disparado quando o estágio de uma oportunidade muda',
    'opportunity.won': 'Disparado quando uma oportunidade é marcada como ganha',
    'opportunity.lost': 'Disparado quando uma oportunidade é marcada como perdida',
    'opportunity.deleted': 'Disparado quando uma oportunidade é deletada'
  }

  return descriptions[event] || 'Evento de webhook'
}