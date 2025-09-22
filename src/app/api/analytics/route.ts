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

    // Overview metrics
    const totalLeads = await prisma.lead.count()
    const newLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const convertedLeads = await prisma.lead.count({
      where: {
        status: 'WON',
        createdAt: {
          gte: startDate,
        },
      },
    })

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    const totalTasks = await prisma.task.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const completedTasks = await prisma.task.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Calculate average response time (simplified)
    const averageResponseTime = 24 // placeholder - would need to calculate based on activities

    // Source breakdown
    const sourceBreakdown = await prisma.lead.groupBy({
      by: ['source'],
      _count: {
        source: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const sourceBreakdownFormatted = sourceBreakdown.map(item => ({
      source: item.source || 'Direto',
      count: item._count.source,
      percentage: (item._count.source / newLeads) * 100,
    }))

    // Status distribution
    const statusDistribution = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    const statusDistributionFormatted = statusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: (item._count.status / newLeads) * 100,
    }))

    // Top performers (simplified)
    const topPerformers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ownedLeads: {
              where: {
                status: 'WON',
                updatedAt: {
                  gte: startDate,
                },
              },
            },
            assignedTasks: {
              where: {
                status: 'COMPLETED',
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
        },
      },
      take: 5,
    })

    const topPerformersFormatted = topPerformers.map(user => ({
      userId: user.id,
      userName: user.name,
      leadsConverted: user._count.ownedLeads,
      conversionRate: Math.random() * 30 + 10, // placeholder calculation
      tasksCompleted: user._count.assignedTasks,
    })).sort((a, b) => b.leadsConverted - a.leadsConverted)

    // Team metrics
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            ownedLeads: {
              some: {
                updatedAt: {
                  gte: startDate,
                },
              },
            },
          },
          {
            assignedTasks: {
              some: {
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
        ],
      },
    })

    // Generate weekly data (simplified)
    const leadsPerWeek = []
    const conversionPerWeek = []

    for (let i = 0; i < Math.min(period / 7, 8); i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekLeads = await prisma.lead.count({
        where: {
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      })

      const weekConverted = await prisma.lead.count({
        where: {
          status: 'WON',
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      })

      leadsPerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        count: weekLeads,
      })

      conversionPerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        rate: weekLeads > 0 ? (weekConverted / weekLeads) * 100 : 0,
      })
    }

    const analyticsData = {
      overview: {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate,
        totalTasks,
        completedTasks,
        averageResponseTime,
      },
      trends: {
        leadsPerWeek,
        conversionPerWeek,
        sourceBreakdown: sourceBreakdownFormatted,
        statusDistribution: statusDistributionFormatted,
      },
      performance: {
        topPerformers: topPerformersFormatted,
        teamMetrics: {
          totalUsers,
          activeUsers,
          averageLeadsPerUser: totalLeads / totalUsers,
          averageTasksPerUser: totalTasks / totalUsers,
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}