import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    // Calcular datas baseado no timeframe
    const today = new Date()
    let startDate: Date
    let groupBy: 'day' | 'week' | 'month'

    switch (timeframe) {
      case '7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
        break
      case '30d':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
        break
      case '90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        groupBy = 'week'
        break
      case '1y':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
        groupBy = 'month'
        break
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
    }

    // 1. Leads por Dia/Semana/Mês
    const leadsByTime = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Agrupar leads por período
    const leadsGrouped = groupBy === 'day' ?
      groupByDay(leadsByTime) : groupBy === 'week' ?
      groupByWeek(leadsByTime) : groupByMonth(leadsByTime)

    // 2. Conversões por Dia/Semana/Mês
    const conversionsByTime = leadsByTime.filter(lead => lead.status === 'WON')
    const conversionsGrouped = groupBy === 'day' ?
      groupByDay(conversionsByTime) : groupBy === 'week' ?
      groupByWeek(conversionsByTime) : groupByMonth(conversionsByTime)

    // 3. Funil de Vendas
    const funnelData = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    // 4. Performance por Fonte
    const sourcePerformance = await prisma.lead.groupBy({
      by: ['source'],
      _count: {
        source: true
      },
      where: {
        createdAt: {
          gte: startDate
        },
        source: {
          not: null
        }
      }
    })

    // 5. Top Performing Users
    const userStats = await prisma.user.findMany({
      where: {
        role: {
          in: ['SALES', 'MANAGER']
        }
      },
      include: {
        ownedLeads: {
          where: {
            createdAt: {
              gte: startDate
            }
          },
          select: {
            status: true,
            dealValue: true
          }
        },
        _count: {
          select: {
            activities: {
              where: {
                createdAt: {
                  gte: startDate
                }
              }
            }
          }
        }
      }
    })

    const topPerformers = userStats.map(user => ({
      name: user.name,
      totalLeads: user.ownedLeads.length,
      wonLeads: user.ownedLeads.filter(lead => lead.status === 'WON').length,
      totalValue: user.ownedLeads
        .filter(lead => lead.status === 'WON')
        .reduce((sum, lead) => sum + (lead.dealValue || 0), 0),
      activities: user._count.activities,
      conversionRate: user.ownedLeads.length > 0 ?
        (user.ownedLeads.filter(lead => lead.status === 'WON').length / user.ownedLeads.length * 100) : 0
    })).sort((a, b) => b.totalValue - a.totalValue)

    return NextResponse.json({
      success: true,
      data: {
        leadsOverTime: leadsGrouped,
        conversionsOverTime: conversionsGrouped,
        salesFunnel: funnelData.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        sourcePerformance: sourcePerformance.map(item => ({
          source: item.source || 'Não informado',
          count: item._count.source
        })),
        topPerformers: topPerformers.slice(0, 5),
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: today.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Funções auxiliares para agrupamento
function groupByDay(data: { createdAt: Date; status: string }[]) {
  const grouped: { [key: string]: number } = {}

  data.forEach(item => {
    const date = item.createdAt.toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  })

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function groupByWeek(data: { createdAt: Date; status: string }[]) {
  const grouped: { [key: string]: number } = {}

  data.forEach(item => {
    const date = new Date(item.createdAt)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekKey = weekStart.toISOString().split('T')[0]
    grouped[weekKey] = (grouped[weekKey] || 0) + 1
  })

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date))
}

function groupByMonth(data: { createdAt: Date; status: string }[]) {
  const grouped: { [key: string]: number } = {}

  data.forEach(item => {
    const date = new Date(item.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
    grouped[monthKey] = (grouped[monthKey] || 0) + 1
  })

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date))
}