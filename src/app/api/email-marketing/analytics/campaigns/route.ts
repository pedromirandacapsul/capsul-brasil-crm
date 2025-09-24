/**
 * API para dados de campanhas de email marketing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (pular em desenvolvimento se configurado)
    if (process.env.SKIP_AUTH_IN_DEVELOPMENT !== 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const campaignFilter = searchParams.get('campaign')

    console.log('📊 Obtendo dados de campanhas...')

    // Filtros
    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    if (campaignFilter && campaignFilter !== 'all') {
      whereClause.id = campaignFilter
    }

    const campaigns = await prisma.emailCampaignNew.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        unsubscribedCount: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular métricas para cada campanha
    const campaignsWithMetrics = campaigns.map(campaign => {
      const openRate = campaign.deliveredCount > 0 ?
        (campaign.openedCount / campaign.deliveredCount) * 100 : 0

      const clickRate = campaign.openedCount > 0 ?
        (campaign.clickedCount / campaign.openedCount) * 100 : 0

      const bounceRate = campaign.sentCount > 0 ?
        (campaign.bouncedCount / campaign.sentCount) * 100 : 0

      const unsubscribeRate = campaign.deliveredCount > 0 ?
        (campaign.unsubscribedCount / campaign.deliveredCount) * 100 : 0

      return {
        ...campaign,
        openRate,
        clickRate,
        bounceRate,
        unsubscribeRate
      }
    })

    console.log('✅ Dados de campanhas obtidos:', {
      total: campaignsWithMetrics.length,
      periodo: startDate && endDate ? `${startDate} a ${endDate}` : 'Todas'
    })

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      total: campaignsWithMetrics.length
    })

  } catch (error: any) {
    console.error('Erro ao obter dados de campanhas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}