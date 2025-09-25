import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { salesAutomationService } from '@/services/sales-automation-service'

// POST /api/sales/followup - Criar sequência de follow-up automático
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
        { success: false, error: 'Sem permissão para criar follow-ups' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      opportunityId,
      rules
    } = body

    if (!opportunityId || !rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { success: false, error: 'ID da oportunidade e regras são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await salesAutomationService.createFollowUpSequence(opportunityId, rules)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Erro ao criar sequência de follow-up:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}