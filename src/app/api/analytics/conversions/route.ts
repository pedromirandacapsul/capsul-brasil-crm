import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { automationConfig } from '@/services/automation-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar analytics' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // 1. Estatísticas Gerais de Conversão Lead → Oportunidade
    const totalLeads = await prisma.lead.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const totalOpportunities = await prisma.opportunity.count({
      where: {
        createdAt: { gte: startDate }
      }
    })

    const leadsWithOpportunities = await prisma.lead.count({
      where: {
        createdAt: { gte: startDate },
        opportunities: {
          some: {}
        }
      }
    })

    const conversionRate = totalLeads > 0 ? (leadsWithOpportunities / totalLeads) * 100 : 0

    // 2. Conversões por Status (usando configuração dinâmica)
    const activeTriggers = automationConfig.getActiveTriggers()
    const conversionsByStatus = await Promise.all(
      activeTriggers.map(async (trigger) => {
        const leadsWithStatus = await prisma.lead.count({
          where: {
            status: trigger.status,
            updatedAt: { gte: startDate }
          }
        })

        const conversionsFromStatus = await prisma.opportunity.count({
          where: {
            lead: {
              status: trigger.status
            },
            createdAt: { gte: startDate }
          }
        })

        const statusConversionRate = leadsWithStatus > 0 ? (conversionsFromStatus / leadsWithStatus) * 100 : 0

        return {
          status: trigger.status,
          description: trigger.description,
          stage: trigger.stage,
          totalLeads: leadsWithStatus,
          conversions: conversionsFromStatus,
          conversionRate: statusConversionRate,
          requiresValue: trigger.requiresValue,
          enabled: trigger.enabled
        }
      })
    )

    // 3. Tempo de Conversão (Lead criado → Oportunidade criada)
    const conversionTimes = await prisma.lead.findMany({
      where: {
        createdAt: { gte: startDate },
        opportunities: { some: {} }
      },
      include: {
        opportunities: {
          select: {
            createdAt: true
          },
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    // Processar dados de conversão
    const conversionTimesByStatus = conversionTimes.reduce((acc: any, lead) => {
      if (lead.opportunities.length > 0) {
        const daysDiff = Math.ceil(
          (lead.opportunities[0].createdAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (!acc[lead.status]) {
          acc[lead.status] = { totalDays: 0, count: 0 }
        }
        acc[lead.status].totalDays += daysDiff
        acc[lead.status].count += 1
      }
      return acc
    }, {})

    const conversionTimesFormatted = Object.entries(conversionTimesByStatus).map(([status, data]: [string, any]) => ({
      status,
      avgDaysToConvert: Math.round((data.totalDays / data.count) * 100) / 100,
      totalConversions: data.count
    }))

    // 4. Performance de Automação vs Manual
    const automationStats = await prisma.activity.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: startDate },
        type: {
          in: ['UPDATED', 'CONVERTED_TO_OPPORTUNITY']
        }
      },
      _count: {
        type: true
      }
    })

    // 5. Valor Total Convertido por Status
    const valueByStatus = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: {
        createdAt: { gte: startDate }
      },
      _sum: {
        amountBr: true
      },
      _count: {
        stage: true
      },
      _avg: {
        amountBr: true
      }
    })

    // 6. Tendência de Conversões (últimos 7 dias)
    const conversionTrend = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dailyConversions = await prisma.opportunity.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        })

        const dailyLeads = await prisma.lead.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        })

        return {
          date: date.toISOString().split('T')[0],
          conversions: dailyConversions,
          leads: dailyLeads,
          conversionRate: dailyLeads > 0 ? (dailyConversions / dailyLeads) * 100 : 0
        }
      })
    )

    // 7. Top Performers (usuários com mais conversões)
    const topPerformers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            ownedOpportunities: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: {
        ownedOpportunities: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // 8. Funil de Conversão Detalhado
    const funnelSteps = [
      { step: 'Leads Criados', count: totalLeads },
      { step: 'Leads Contatados', count: await prisma.lead.count({ where: { status: 'CONTACTED', createdAt: { gte: startDate } } }) },
      { step: 'Leads Interessados', count: await prisma.lead.count({ where: { status: 'INTERESTED', createdAt: { gte: startDate } } }) },
      { step: 'Leads Qualificados', count: await prisma.lead.count({ where: { status: 'QUALIFIED', createdAt: { gte: startDate } } }) },
      { step: 'Propostas Enviadas', count: await prisma.lead.count({ where: { status: 'PROPOSAL', createdAt: { gte: startDate } } }) },
      { step: 'Negócios Fechados', count: await prisma.lead.count({ where: { status: 'WON', createdAt: { gte: startDate } } }) }
    ]

    // Calcular taxas de conversão entre etapas
    const funnelWithRates = funnelSteps.map((step, index) => {
      const previousStep = funnelSteps[index - 1]
      const conversionFromPrevious = previousStep && previousStep.count > 0
        ? (step.count / previousStep.count) * 100
        : 100

      return {
        ...step,
        conversionFromPrevious: index === 0 ? 100 : conversionFromPrevious
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          totalOpportunities,
          leadsWithOpportunities,
          conversionRate: Math.round(conversionRate * 100) / 100,
          period: parseInt(period)
        },
        conversionsByStatus,
        conversionTimes: conversionTimesFormatted,
        automationStats,
        valueByStatus,
        conversionTrend: conversionTrend.reverse(), // Mais recente primeiro
        topPerformers: topPerformers.map(user => ({
          ...user,
          conversions: user._count.ownedOpportunities
        })),
        funnel: funnelWithRates,
        configStats: automationConfig.getConfigStats(),
        metadata: {
          generatedAt: new Date().toISOString(),
          period: `${period} dias`,
          activeTriggers: activeTriggers.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching conversion analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}