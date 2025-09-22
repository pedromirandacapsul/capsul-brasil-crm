import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // ===============================
    // 1. OVERVIEW METRICS (Enhanced)
    // ===============================
    const totalLeads = await prisma.lead.count()
    const newLeads = await prisma.lead.count({
      where: { createdAt: { gte: startDate } }
    })

    const convertedLeads = await prisma.lead.count({
      where: { status: 'WON', createdAt: { gte: startDate } }
    })

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const totalTasks = await prisma.task.count({
      where: { createdAt: { gte: startDate } }
    })

    const completedTasks = await prisma.task.count({
      where: { status: 'COMPLETED', createdAt: { gte: startDate } }
    })

    // Financial metrics (mock data - integrate with real payment system)
    const totalRevenue = convertedLeads * 15000 // Mock: R$ 15k average ticket
    const avgTicket = convertedLeads > 0 ? totalRevenue / convertedLeads : 0
    const pipelineValue = (totalLeads - convertedLeads) * 8000 // Mock pipeline value

    // ===============================
    // 2. SALES FUNNEL
    // ===============================
    const funnelStages = [
      { stage: 'NEW', label: 'Leads Gerados' },
      { stage: 'CONTACTED', label: 'Primeiro Contato' },
      { stage: 'QUALIFIED', label: 'Qualificados' },
      { stage: 'PROPOSAL', label: 'Proposta Enviada' },
      { stage: 'WON', label: 'Fechados (Ganhos)' }
    ]

    const funnel = await Promise.all(
      funnelStages.map(async (stage, index) => {
        const count = await prisma.lead.count({
          where: {
            status: { in: funnelStages.slice(index).map(s => s.stage) },
            createdAt: { gte: startDate }
          }
        })

        const prevCount = index > 0 ? await prisma.lead.count({
          where: {
            status: { in: funnelStages.slice(index - 1).map(s => s.stage) },
            createdAt: { gte: startDate }
          }
        }) : newLeads

        return {
          stage: stage.stage,
          label: stage.label,
          value: count,
          conversion: prevCount > 0 ? (count / prevCount) * 100 : 100
        }
      })
    )

    // ===============================
    // 3. SPEED METRICS
    // ===============================
    const speedMetrics = {
      firstContactSLA: 2.4, // Mock: average 2.4h for first contact
      avgQualificationTime: 6.8, // Mock: 6.8h to qualify
      avgNegotiationTime: 3.2, // Mock: 3.2 days in negotiation
      avgClosingTime: 7.5, // Mock: 7.5 days to close
      slaCompliance: 78.5 // Mock: 78.5% within SLA
    }

    // ===============================
    // 4. SOURCE QUALITY ANALYSIS
    // ===============================
    const sourceBreakdown = await prisma.lead.groupBy({
      by: ['source'],
      _count: { source: true },
      where: { createdAt: { gte: startDate } }
    })

    const sourceQuality = await Promise.all(
      sourceBreakdown.map(async (source) => {
        const sourceConverted = await prisma.lead.count({
          where: {
            source: source.source,
            status: 'WON',
            createdAt: { gte: startDate }
          }
        })

        const conversionRate = source._count.source > 0 ? (sourceConverted / source._count.source) * 100 : 0
        const avgTicket = sourceConverted * 15000 // Mock average ticket per source

        return {
          source: source.source || 'Direto',
          volume: source._count.source,
          conversionRate,
          avgTicket,
          quality: conversionRate > 15 ? 'high' as const : conversionRate > 8 ? 'medium' as const : 'low' as const
        }
      })
    )

    // ===============================
    // 5. LOSS REASONS ANALYSIS
    // ===============================
    const lossReasons = await prisma.lead.groupBy({
      by: ['lossReason'],
      _count: { lossReason: true },
      where: {
        status: 'LOST',
        lossReason: { not: null },
        createdAt: { gte: startDate }
      }
    })

    const totalLost = lossReasons.reduce((sum, reason) => sum + reason._count.lossReason, 0)
    const lossReasonsFormatted = lossReasons.map(reason => ({
      reason: reason.lossReason || 'Não informado',
      count: reason._count.lossReason,
      percentage: totalLost > 0 ? (reason._count.lossReason / totalLost) * 100 : 0
    }))

    // ===============================
    // 6. SALESMAN PERFORMANCE
    // ===============================
    const salesmanPerformance = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ownedLeads: {
              where: {
                status: 'WON',
                updatedAt: { gte: startDate }
              }
            },
            assignedTasks: {
              where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      take: 10
    })

    const salesmanPerformanceFormatted = await Promise.all(
      salesmanPerformance.map(async (user) => {
        const totalUserLeads = await prisma.lead.count({
          where: {
            ownerId: user.id,
            createdAt: { gte: startDate }
          }
        })

        const conversionRate = totalUserLeads > 0 ? (user._count.ownedLeads / totalUserLeads) * 100 : 0
        const revenue = user._count.ownedLeads * 15000 // Mock revenue calculation

        return {
          userId: user.id,
          userName: user.name,
          conversionRate,
          avgTicket: 15000, // Mock
          avgClosingTime: 5.2, // Mock: 5.2 days average
          leadsConverted: user._count.ownedLeads,
          tasksCompleted: user._count.assignedTasks,
          revenue
        }
      })
    )

    // ===============================
    // 7. TEAM ENGAGEMENT
    // ===============================
    const teamEngagement = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedTasks: {
              where: { createdAt: { gte: startDate } }
            }
          }
        }
      }
    })

    const teamEngagementFormatted = teamEngagement.map(user => ({
      userId: user.id,
      userName: user.name,
      callsMade: Math.floor(Math.random() * 50) + 10, // Mock
      whatsappSent: Math.floor(Math.random() * 80) + 20, // Mock
      emailsSent: Math.floor(Math.random() * 30) + 5, // Mock
      score: Math.floor(Math.random() * 40) + 60 // Mock engagement score
    }))

    // ===============================
    // 8. FORECAST
    // ===============================
    const forecast = [
      {
        expectedLeads: Math.floor(newLeads * 1.15), // 15% growth projection
        expectedRevenue: Math.floor(totalRevenue * 1.12), // 12% revenue growth
        probability: 78,
        period: 'Próximos 30 dias'
      },
      {
        expectedLeads: Math.floor(newLeads * 1.35),
        expectedRevenue: Math.floor(totalRevenue * 1.28),
        probability: 65,
        period: 'Próximos 90 dias'
      }
    ]

    // ===============================
    // 9. FINANCIAL PIPELINE
    // ===============================
    const financialPipeline = {
      wonRevenue: totalRevenue,
      pipelineValue,
      lostValue: (totalLeads - convertedLeads) * 0.3 * avgTicket, // Mock lost revenue
      projectedRevenue: forecast[0].expectedRevenue
    }

    // ===============================
    // 10. COHORT ANALYSIS
    // ===============================
    const cohortAnalysis = []
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

    for (let i = 0; i < Math.min(period / 30, 6); i++) {
      const cohortStartDate = new Date()
      cohortStartDate.setMonth(cohortStartDate.getMonth() - i - 1)
      cohortStartDate.setDate(1)

      const cohortEndDate = new Date(cohortStartDate)
      cohortEndDate.setMonth(cohortEndDate.getMonth() + 1)

      const cohortLeads = await prisma.lead.count({
        where: { createdAt: { gte: cohortStartDate, lt: cohortEndDate } }
      })

      const convertedNextMonth = await prisma.lead.count({
        where: {
          createdAt: { gte: cohortStartDate, lt: cohortEndDate },
          status: 'WON',
          updatedAt: { gte: cohortEndDate }
        }
      })

      cohortAnalysis.push({
        month: months[cohortStartDate.getMonth()],
        totalLeads: cohortLeads,
        convertedNext: convertedNextMonth,
        conversionRate: cohortLeads > 0 ? (convertedNextMonth / cohortLeads) * 100 : 0,
        maturationDays: 15 + Math.random() * 20 // Mock: 15-35 days average
      })
    }

    // ===============================
    // 11. CUSTOMER LIFETIME VALUE (CLV)
    // ===============================
    const clvAnalysis = {
      averageClv: 45000, // Mock: R$ 45k average CLV
      clvBySource: await Promise.all(
        sourceBreakdown.map(async (source) => ({
          source: source.source || 'Direto',
          avgClv: 30000 + Math.random() * 30000, // Mock CLV between 30k-60k
          totalCustomers: source._count.source,
          totalValue: source._count.source * (30000 + Math.random() * 30000)
        }))
      ),
      clvTrend: [
        { month: 'Jan', clv: 42000 },
        { month: 'Fev', clv: 44000 },
        { month: 'Mar', clv: 43500 },
        { month: 'Abr', clv: 46000 },
        { month: 'Mai', clv: 45000 }
      ]
    }

    // ===============================
    // 12. CAC (CUSTO DE AQUISIÇÃO)
    // ===============================
    const cacAnalysis = {
      averageCac: 2500, // Mock: R$ 2.5k average CAC
      cacBySource: sourceQuality.map(source => ({
        source: source.source,
        cac: 1000 + Math.random() * 3000, // Mock CAC between 1k-4k
        volume: source.volume,
        efficiency: source.avgTicket / (1000 + Math.random() * 3000) // ROI efficiency
      })),
      cacTrend: [
        { month: 'Jan', cac: 2800 },
        { month: 'Fev', cac: 2600 },
        { month: 'Mar', cac: 2400 },
        { month: 'Abr', cac: 2300 },
        { month: 'Mai', cac: 2500 }
      ]
    }

    // ===============================
    // 13. PIPELINE HEALTH ANALYSIS
    // ===============================
    const pipelineHealth = {
      avgTimePerStage: {
        'NEW': 2.5,
        'CONTACTED': 3.2,
        'QUALIFIED': 4.8,
        'PROPOSAL': 7.2,
        'WON': 0
      },
      bottlenecks: [
        { stage: 'PROPOSAL', avgDays: 7.2, stuckDeals: 12, impact: 'high' },
        { stage: 'QUALIFIED', avgDays: 4.8, stuckDeals: 8, impact: 'medium' }
      ],
      stageConversion: funnelStages.map((stage, index) => ({
        stage: stage.stage,
        conversionToNext: index < funnelStages.length - 1 ? 65 + Math.random() * 20 : 100,
        dropOffRate: index < funnelStages.length - 1 ? 35 - Math.random() * 20 : 0
      }))
    }

    // ===============================
    // 14. SMART ALERTS
    // ===============================
    const smartAlerts = [
      {
        id: 1,
        type: 'warning',
        title: 'Taxa de conversão em queda',
        message: 'LinkedIn Ads: conversão caiu 15% esta semana vs semana anterior',
        severity: 'medium',
        actionable: true,
        suggestions: ['Revisar criativos', 'Ajustar targeting', 'Verificar landing page']
      },
      {
        id: 2,
        type: 'success',
        title: 'Meta de receita atingida',
        message: 'Receita mensal já atingiu 105% da meta com 5 dias de antecedência',
        severity: 'low',
        actionable: false
      },
      {
        id: 3,
        type: 'critical',
        title: 'Pipeline com baixa atividade',
        message: '8 deals em PROPOSAL há mais de 10 dias sem atividade',
        severity: 'high',
        actionable: true,
        suggestions: ['Agendar follow-ups', 'Revisar propostas', 'Contatar prospects']
      }
    ]

    // ===============================
    // 15. TRENDS (Enhanced)
    // ===============================
    const leadsPerWeek = []
    const revenuePerWeek = []
    const conversionPerWeek = []

    for (let i = 0; i < Math.min(period / 7, 8); i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekLeads = await prisma.lead.count({
        where: {
          createdAt: { gte: weekStart, lt: weekEnd }
        }
      })

      const weekConverted = await prisma.lead.count({
        where: {
          status: 'WON',
          createdAt: { gte: weekStart, lt: weekEnd }
        }
      })

      const weekRevenue = weekConverted * 15000 // Mock revenue

      leadsPerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        count: weekLeads
      })

      revenuePerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        revenue: weekRevenue
      })

      conversionPerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        rate: weekLeads > 0 ? (weekConverted / weekLeads) * 100 : 0
      })
    }

    // Status distribution (same as before)
    const statusDistribution = await prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: startDate } }
    })

    const statusDistributionFormatted = statusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: newLeads > 0 ? (item._count.status / newLeads) * 100 : 0
    }))

    // Top performers (enhanced)
    const topPerformers = salesmanPerformanceFormatted
      .sort((a, b) => b.leadsConverted - a.leadsConverted)
      .slice(0, 5)
      .map(performer => ({
        userId: performer.userId,
        userName: performer.userName,
        leadsConverted: performer.leadsConverted,
        conversionRate: performer.conversionRate,
        tasksCompleted: performer.tasksCompleted
      }))

    // Team metrics
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            ownedLeads: {
              some: { updatedAt: { gte: startDate } }
            }
          },
          {
            assignedTasks: {
              some: { createdAt: { gte: startDate } }
            }
          }
        ]
      }
    })

    const analyticsData = {
      overview: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
        totalTasks,
        completedTasks,
        averageResponseTime: speedMetrics.firstContactSLA,
        totalRevenue,
        avgTicket,
        pipelineValue
      },
      funnel,
      speedMetrics,
      sourceQuality,
      lossReasons: lossReasonsFormatted,
      salesmanPerformance: salesmanPerformanceFormatted,
      teamEngagement: teamEngagementFormatted,
      forecast,
      financialPipeline,
      cohortAnalysis,
      clvAnalysis,
      cacAnalysis,
      pipelineHealth,
      smartAlerts,
      trends: {
        leadsPerWeek,
        revenuePerWeek,
        conversionPerWeek,
        sourceBreakdown: sourceQuality.map(s => ({
          source: s.source,
          count: s.volume,
          percentage: newLeads > 0 ? (s.volume / newLeads) * 100 : 0
        })),
        statusDistribution: statusDistributionFormatted
      },
      performance: {
        topPerformers,
        teamMetrics: {
          totalUsers,
          activeUsers,
          averageLeadsPerUser: totalLeads / totalUsers,
          averageTasksPerUser: totalTasks / totalUsers
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Error fetching enhanced analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}