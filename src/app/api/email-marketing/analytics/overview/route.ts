/**
 * API para métricas gerais de email marketing
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

    console.log('📊 Obtendo métricas gerais de email marketing...')

    // Filtros base
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

    // Métricas do período atual
    const currentPeriodCampaigns = await prisma.emailCampaignNew.findMany({
      where: whereClause,
      select: {
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        unsubscribedCount: true,
        createdAt: true
      }
    })

    // Calcular período anterior para comparação
    const periodDays = startDate && endDate ?
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 30

    const previousStartDate = new Date(new Date(startDate || new Date()).getTime() - (periodDays * 24 * 60 * 60 * 1000))
    const previousEndDate = new Date(startDate || new Date())

    const previousPeriodCampaigns = await prisma.emailCampaignNew.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      },
      select: {
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        unsubscribedCount: true
      }
    })

    // Calcular métricas atuais
    const currentMetrics = currentPeriodCampaigns.reduce(
      (acc, campaign) => ({
        totalSent: acc.totalSent + campaign.sentCount,
        totalDelivered: acc.totalDelivered + campaign.deliveredCount,
        totalOpened: acc.totalOpened + campaign.openedCount,
        totalClicked: acc.totalClicked + campaign.clickedCount,
        totalBounced: acc.totalBounced + campaign.bouncedCount,
        totalUnsubscribed: acc.totalUnsubscribed + campaign.unsubscribedCount
      }),
      {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalUnsubscribed: 0
      }
    )

    // Calcular métricas do período anterior
    const previousMetrics = previousPeriodCampaigns.reduce(
      (acc, campaign) => ({
        totalSent: acc.totalSent + campaign.sentCount,
        totalDelivered: acc.totalDelivered + campaign.deliveredCount,
        totalOpened: acc.totalOpened + campaign.openedCount,
        totalClicked: acc.totalClicked + campaign.clickedCount,
        totalBounced: acc.totalBounced + campaign.bouncedCount,
        totalUnsubscribed: acc.totalUnsubscribed + campaign.unsubscribedCount
      }),
      {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalUnsubscribed: 0
      }
    )

    // Calcular taxas atuais
    const avgOpenRate = currentMetrics.totalDelivered > 0 ?
      (currentMetrics.totalOpened / currentMetrics.totalDelivered) * 100 : 0

    const avgClickRate = currentMetrics.totalOpened > 0 ?
      (currentMetrics.totalClicked / currentMetrics.totalOpened) * 100 : 0

    const avgBounceRate = currentMetrics.totalSent > 0 ?
      (currentMetrics.totalBounced / currentMetrics.totalSent) * 100 : 0

    // Calcular taxas do período anterior
    const prevAvgOpenRate = previousMetrics.totalDelivered > 0 ?
      (previousMetrics.totalOpened / previousMetrics.totalDelivered) * 100 : 0

    const prevAvgClickRate = previousMetrics.totalOpened > 0 ?
      (previousMetrics.totalClicked / previousMetrics.totalOpened) * 100 : 0

    const prevAvgBounceRate = previousMetrics.totalSent > 0 ?
      (previousMetrics.totalBounced / previousMetrics.totalSent) * 100 : 0

    // Calcular crescimento
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // Gerar insights automáticos
    const insights = {
      strengths: [],
      opportunities: []
    }

    if (avgOpenRate > 25) {
      insights.strengths.push('Excelente taxa de abertura, acima da média do mercado (20-25%)')
    }
    if (avgClickRate > 5) {
      insights.strengths.push('Boa taxa de clique, superior à média do mercado (2-5%)')
    }
    if (avgBounceRate < 2) {
      insights.strengths.push('Taxa de bounce baixa, indicando boa qualidade da lista')
    }

    if (avgOpenRate < 15) {
      insights.opportunities.push('Taxa de abertura baixa - revisar assuntos e horários de envio')
    }
    if (avgClickRate < 2) {
      insights.opportunities.push('Taxa de clique baixa - melhorar call-to-actions e conteúdo')
    }
    if (avgBounceRate > 5) {
      insights.opportunities.push('Taxa de bounce alta - validar e limpar lista de emails')
    }

    const result = {
      // Métricas principais
      totalSent: currentMetrics.totalSent,
      totalDelivered: currentMetrics.totalDelivered,
      totalOpened: currentMetrics.totalOpened,
      totalClicked: currentMetrics.totalClicked,
      totalBounced: currentMetrics.totalBounced,
      totalUnsubscribed: currentMetrics.totalUnsubscribed,

      // Taxas
      avgOpenRate,
      avgClickRate,
      avgBounceRate,

      // Crescimento vs período anterior
      sentGrowth: calculateGrowth(currentMetrics.totalSent, previousMetrics.totalSent),
      openRateGrowth: calculateGrowth(avgOpenRate, prevAvgOpenRate),
      clickRateGrowth: calculateGrowth(avgClickRate, prevAvgClickRate),
      bounceRateGrowth: calculateGrowth(avgBounceRate, prevAvgBounceRate),

      // Insights
      insights
    }

    console.log('✅ Métricas calculadas:', {
      campanhas: currentPeriodCampaigns.length,
      totalEnviados: result.totalSent,
      taxaAbertura: result.avgOpenRate.toFixed(1) + '%'
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Erro ao obter métricas gerais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}