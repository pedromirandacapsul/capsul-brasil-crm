import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { salesAutomationService } from '@/services/sales-automation-service'

// POST /api/sales/proposals - Enviar proposta automática
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
        { success: false, error: 'Sem permissão para enviar propostas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      opportunityId,
      templateId,
      customContent,
      attachments,
      scheduledAt
    } = body

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'ID da oportunidade é obrigatório' },
        { status: 400 }
      )
    }

    const result = await salesAutomationService.sendAutomaticProposal({
      opportunityId,
      templateId,
      customContent,
      attachments,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Erro ao enviar proposta automática:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}