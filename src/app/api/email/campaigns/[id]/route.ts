import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { emailMarketingService } from '@/services/email-marketing-service'

interface Params {
  params: { id: string }
}

// GET /api/email/campaigns/[id] - Obter campanha específica
export async function GET(request: NextRequest, { params }: Params) {
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
        { success: false, error: 'Sem permissão para visualizar campanha' },
        { status: 403 }
      )
    }

    const campaign = await emailMarketingService.getCampaignById(params.id)

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campanha não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: campaign
    })

  } catch (error) {
    console.error('Error fetching email campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/email/campaigns/[id] - Atualizar campanha
export async function PUT(request: NextRequest, { params }: Params) {
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
        { success: false, error: 'Sem permissão para editar campanha' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, subject, type, scheduledAt } = body

    // Validações básicas
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, error: 'Nome e assunto são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a campanha existe
    const existingCampaign = await emailMarketingService.getCampaignById(params.id)
    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campanha não encontrada' },
        { status: 404 }
      )
    }

    // Só permite edição se estiver em DRAFT
    if (existingCampaign.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Só é possível editar campanhas em rascunho' },
        { status: 400 }
      )
    }

    const updateData = {
      name,
      subject,
      type,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    }

    const updatedCampaign = await emailMarketingService.updateCampaign(params.id, updateData)

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
      message: 'Campanha atualizada com sucesso'
    })

  } catch (error) {
    console.error('Error updating email campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/campaigns/[id] - Deletar campanha
export async function DELETE(request: NextRequest, { params }: Params) {
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
        { success: false, error: 'Sem permissão para deletar campanha' },
        { status: 403 }
      )
    }

    // Verificar se a campanha existe
    const existingCampaign = await emailMarketingService.getCampaignById(params.id)
    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campanha não encontrada' },
        { status: 404 }
      )
    }

    // Só permite deletar se estiver em DRAFT
    if (existingCampaign.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Só é possível deletar campanhas em rascunho' },
        { status: 400 }
      )
    }

    await emailMarketingService.deleteCampaign(params.id)

    return NextResponse.json({
      success: true,
      message: 'Campanha deletada com sucesso'
    })

  } catch (error) {
    console.error('Error deleting email campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}