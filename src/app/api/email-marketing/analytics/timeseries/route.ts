/**
 * API para dados de série temporal e análise horária
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { format, eachDayOfInterval, parseISO } from 'date-fns'

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

    console.log('📊 Obtendo dados de série temporal...')

    // Definir período padrão se não fornecido
    const start = startDate ? parseISO(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? parseISO(endDate) : new Date()

    // Filtros
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    }
    if (campaignFilter && campaignFilter !== 'all') {
      whereClause.id = campaignFilter
    }

    // Obter campanhas do período
    const campaigns = await prisma.emailCampaignNew.findMany({
      where: whereClause,
      select: {
        id: true,
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        createdAt: true
      }
    })

    // Gerar série temporal por dia
    const dateRange = eachDayOfInterval({ start, end })
    const timeSeriesData = dateRange.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayCampaigns = campaigns.filter(campaign =>
        campaign.createdAt >= dayStart && campaign.createdAt <= dayEnd
      )

      const dayMetrics = dayCampaigns.reduce(
        (acc, campaign) => ({
          sent: acc.sent + campaign.sentCount,
          opened: acc.opened + campaign.openedCount,
          clicked: acc.clicked + campaign.clickedCount,
          bounced: acc.bounced + campaign.bouncedCount
        }),
        { sent: 0, opened: 0, clicked: 0, bounced: 0 }
      )

      return {
        date: format(date, 'dd/MM'),
        ...dayMetrics
      }
    })

    // Gerar dados por horário (simulado baseado em padrões típicos)
    // Em um sistema real, você teria timestamps de aberturas/cliques
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      // Padrões típicos de abertura de email
      let openMultiplier = 1
      if (hour >= 8 && hour <= 10) openMultiplier = 2.5  // Manhã
      else if (hour >= 14 && hour <= 16) openMultiplier = 2  // Tarde
      else if (hour >= 19 && hour <= 21) openMultiplier = 1.8  // Noite
      else if (hour >= 0 && hour <= 6) openMultiplier = 0.2  // Madrugada

      // Cliques são tipicamente 20-30% das aberturas
      const baseOpens = Math.floor(Math.random() * 100 * openMultiplier)
      const baseClicks = Math.floor(baseOpens * (0.2 + Math.random() * 0.1))

      return {
        hour,
        opens: baseOpens,
        clicks: baseClicks
      }
    })

    console.log('✅ Dados de série temporal gerados:', {
      diasAnalisados: timeSeriesData.length,
      campanhas: campaigns.length
    })

    return NextResponse.json({
      timeSeries: timeSeriesData,
      hourlyData,
      period: {
        start: format(start, 'dd/MM/yyyy'),
        end: format(end, 'dd/MM/yyyy'),
        days: dateRange.length
      }
    })

  } catch (error: any) {
    console.error('Erro ao obter dados de série temporal:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}