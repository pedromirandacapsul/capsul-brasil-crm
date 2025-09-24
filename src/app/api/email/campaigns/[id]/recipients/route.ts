import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { emailMarketingService } from '@/services/email-marketing-service'

interface Params {
  params: { id: string }
}

// POST /api/email/campaigns/[id]/recipients - Adicionar destinatários
export async function POST(request: NextRequest, { params }: Params) {
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
        { success: false, error: 'Sem permissão para gerenciar destinatários' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { leadIds, segmentCriteria } = body

    if (!leadIds && !segmentCriteria) {
      return NextResponse.json(
        { success: false, error: 'É necessário especificar leads ou critérios de segmentação' },
        { status: 400 }
      )
    }

    const recipientsAdded = await emailMarketingService.addRecipientsToCampaign(
      params.id,
      leadIds,
      segmentCriteria
    )

    return NextResponse.json({
      success: true,
      message: `${recipientsAdded} destinatários adicionados com sucesso`,
      recipientsAdded
    })

  } catch (error) {
    console.error('Error adding recipients to campaign:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}