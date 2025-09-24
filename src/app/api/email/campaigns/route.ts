import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { emailMarketingService } from '@/services/email-marketing-service'

// GET /api/email/campaigns - Listar campanhas
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
        { success: false, error: 'Sem permissão para visualizar campanhas' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const campaigns = await emailMarketingService.getCampaigns(status)

    return NextResponse.json({
      success: true,
      data: campaigns
    })

  } catch (error) {
    console.error('Error fetching email campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/email/campaigns - Criar campanha
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
    if (!skipAuth && session && !hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar campanhas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, subject, templateId, type, scheduledAt, segmentConfig } = body

    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: 'Nome e assunto são obrigatórios' },
        { status: 400 }
      )
    }

    const campaign = await emailMarketingService.createCampaign({
      name,
      subject,
      templateId,
      type,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      segmentConfig,
      createdById: session?.user?.id || 'cmfx575q400009t5sv8fjg1rh'
    })

    return NextResponse.json({
      success: true,
      data: campaign
    })

  } catch (error) {
    console.error('Error creating email campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}