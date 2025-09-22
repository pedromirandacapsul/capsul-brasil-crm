import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

async function calculateTargetVsActual(userRole: string, userId: string, startDate: Date) {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // Get current month revenue targets
  const currentTargets = await prisma.revenueTarget.findMany({
    where: {
      year: currentYear,
      month: currentMonth,
      ...(userRole === 'SALES' ? { userId } : {})
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    }
  })

  // Calculate actual revenue for current month
  const monthStart = new Date(currentYear, currentMonth - 1, 1)
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  let whereClause: any = {
    stage: 'WON',
    closedAt: {
      gte: monthStart,
      lte: monthEnd,
    }
  }

  if (userRole === 'SALES') {
    whereClause.ownerId = userId
  } else if (userRole === 'MANAGER') {
    const teamMembers = await prisma.user.findMany({
      where: { role: 'SALES' },
      select: { id: true }
    })
    whereClause.ownerId = {
      in: [...teamMembers.map(u => u.id), userId]
    }
  }

  const actualRevenue = await prisma.opportunity.aggregate({
    where: whereClause,
    _sum: {
      amountBr: true
    }
  })

  const actualRevenueValue = actualRevenue._sum.amountBr || 0

  // Calculate individual targets vs actual
  const targetBreakdown = await Promise.all(
    currentTargets.map(async (target) => {
      if (!target.user) return null

      const userActual = await prisma.opportunity.aggregate({
        where: {
          stage: 'WON',
          ownerId: target.userId!,
          closedAt: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        _sum: {
          amountBr: true
        }
      })

      const userActualValue = userActual._sum.amountBr || 0
      const progressPercentage = target.targetValue > 0 ? (userActualValue / target.targetValue) * 100 : 0

      return {
        userId: target.user.id,
        userName: target.user.name,
        userRole: target.user.role,
        target: target.targetValue,
        actual: userActualValue,
        percentage: progressPercentage,
        remaining: Math.max(0, target.targetValue - userActualValue),
        status: progressPercentage >= 100 ? 'achieved' : progressPercentage >= 80 ? 'on-track' : 'at-risk'
      }
    })
  )

  const validTargetBreakdown = targetBreakdown.filter(Boolean)

  // Overall targets sum
  const totalTarget = currentTargets.reduce((sum, target) => sum + target.targetValue, 0)
  const overallProgressPercentage = totalTarget > 0 ? (actualRevenueValue / totalTarget) * 100 : 0

  return {
    currentMonth: `${currentMonth}/${currentYear}`,
    totalTarget,
    actualRevenue: actualRevenueValue,
    progressPercentage: overallProgressPercentage,
    remaining: Math.max(0, totalTarget - actualRevenueValue),
    status: overallProgressPercentage >= 100 ? 'achieved' : overallProgressPercentage >= 80 ? 'on-track' : 'at-risk',
    userBreakdown: validTargetBreakdown,
    daysInMonth: new Date(currentYear, currentMonth, 0).getDate(),
    daysPassed: currentDate.getDate(),
    projectedRevenue: currentDate.getDate() > 0 ? (actualRevenueValue / currentDate.getDate()) * new Date(currentYear, currentMonth, 0).getDate() : 0
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar analytics' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30') // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Build where clause based on role
    let whereClause: any = {}
    if (userRole === 'SALES') {
      whereClause.ownerId = session.user.id
    } else if (userRole === 'MANAGER') {
      const teamMembers = await prisma.user.findMany({
        where: { role: 'SALES' },
        select: { id: true }
      })
      whereClause.ownerId = {
        in: [...teamMembers.map(u => u.id), session.user.id]
      }
    }

    // Overview metrics
    const totalOpportunities = await prisma.opportunity.count({ where: whereClause })
    const newOpportunities = await prisma.opportunity.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startDate,
        },
      },
    })

    const wonOpportunities = await prisma.opportunity.count({
      where: {
        ...whereClause,
        stage: 'WON',
        closedAt: {
          gte: startDate,
        },
      },
    })

    const lostOpportunities = await prisma.opportunity.count({
      where: {
        ...whereClause,
        stage: 'LOST',
        updatedAt: {
          gte: startDate,
        },
      },
    })

    const winRate = newOpportunities > 0 ? (wonOpportunities / newOpportunities) * 100 : 0

    // Financial metrics
    const totalPipelineValue = await prisma.opportunity.aggregate({
      where: {
        ...whereClause,
        stage: {
          notIn: ['WON', 'LOST']
        }
      },
      _sum: {
        amountBr: true
      }
    })

    const wonValue = await prisma.opportunity.aggregate({
      where: {
        ...whereClause,
        stage: 'WON',
        closedAt: {
          gte: startDate,
        },
      },
      _sum: {
        amountBr: true
      }
    })

    const weightedPipelineValue = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        stage: {
          notIn: ['WON', 'LOST']
        }
      },
      select: {
        amountBr: true,
        probability: true
      }
    })

    const weightedValue = weightedPipelineValue.reduce((sum, opp) => {
      return sum + ((opp.amountBr || 0) * (opp.probability / 100))
    }, 0)

    const avgDealSize = wonOpportunities > 0 ? (wonValue._sum.amountBr || 0) / wonOpportunities : 0

    // Stage distribution
    const stageDistribution = await prisma.opportunity.groupBy({
      by: ['stage'],
      _count: {
        stage: true,
      },
      _sum: {
        amountBr: true
      },
      where: {
        ...whereClause,
        createdAt: {
          gte: startDate,
        },
      },
    })

    const stageDistributionFormatted = stageDistribution.map(item => ({
      stage: item.stage,
      count: item._count.stage,
      value: item._sum.amountBr || 0,
      percentage: totalOpportunities > 0 ? (item._count.stage / totalOpportunities) * 100 : 0,
    }))

    // Source breakdown for opportunities - need to query differently since lead is a relation
    const opportunitiesWithSources = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        lead: {
          select: {
            source: true,
          }
        }
      }
    })

    // Group by source manually
    const sourceStats = opportunitiesWithSources.reduce((acc, opp) => {
      const source = opp.lead.source || 'Não informado'
      if (!acc[source]) {
        acc[source] = { count: 0, totalValue: 0 }
      }
      acc[source].count++
      acc[source].totalValue += opp.amountBr || 0
      return acc
    }, {} as Record<string, { count: number; totalValue: number }>)

    const sourceBreakdownArray = Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      count: stats.count,
      value: stats.totalValue,
      percentage: newOpportunities > 0 ? (stats.count / newOpportunities) * 100 : 0,
    }))

    // Top performers by opportunities
    const topPerformers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ownedOpportunities: {
              where: {
                stage: 'WON',
                closedAt: {
                  gte: startDate,
                },
              },
            },
          },
        },
      },
      where: {
        ownedOpportunities: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
      take: 5,
    })

    const topPerformersWithMetrics = await Promise.all(topPerformers.map(async (user) => {
      const totalUserOpps = await prisma.opportunity.count({
        where: {
          ownerId: user.id,
          createdAt: {
            gte: startDate,
          },
        },
      })

      const userWonValue = await prisma.opportunity.aggregate({
        where: {
          ownerId: user.id,
          stage: 'WON',
          closedAt: {
            gte: startDate,
          },
        },
        _sum: {
          amountBr: true
        }
      })

      return {
        userId: user.id,
        userName: user.name,
        opportunitiesWon: user._count.ownedOpportunities,
        totalOpportunities: totalUserOpps,
        winRate: totalUserOpps > 0 ? (user._count.ownedOpportunities / totalUserOpps) * 100 : 0,
        revenue: userWonValue._sum.amountBr || 0,
      }
    }))

    const topPerformersFormatted = topPerformersWithMetrics.sort((a, b) => b.revenue - a.revenue)

    // Weekly trends
    const opportunitiesPerWeek = []
    const revenuePerWeek = []

    for (let i = 0; i < Math.min(period / 7, 8); i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekOpportunities = await prisma.opportunity.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      })

      const weekRevenue = await prisma.opportunity.aggregate({
        where: {
          ...whereClause,
          stage: 'WON',
          closedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        _sum: {
          amountBr: true
        }
      })

      opportunitiesPerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        count: weekOpportunities,
      })

      revenuePerWeek.unshift({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        revenue: weekRevenue._sum.amountBr || 0,
      })
    }

    // Sales cycle metrics
    const closedOpportunities = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        stage: {
          in: ['WON', 'LOST']
        },
        closedAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        closedAt: true,
        stage: true
      }
    })

    const salesCycleDays = closedOpportunities
      .filter(opp => opp.closedAt)
      .map(opp => {
        const diffTime = Math.abs(opp.closedAt!.getTime() - opp.createdAt.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      })

    const avgSalesCycle = salesCycleDays.length > 0
      ? salesCycleDays.reduce((sum, days) => sum + days, 0) / salesCycleDays.length
      : 0

    // Loss reasons analysis
    const lostOpportunitiesWithReasons = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        stage: 'LOST',
        updatedAt: {
          gte: startDate,
        },
        lostReason: {
          not: null
        }
      },
      select: {
        lostReason: true,
        amountBr: true
      }
    })

    const lossReasonStats = lostOpportunitiesWithReasons.reduce((acc, opp) => {
      const reason = opp.lostReason || 'OUTROS'
      if (!acc[reason]) {
        acc[reason] = { count: 0, totalValue: 0 }
      }
      acc[reason].count++
      acc[reason].totalValue += opp.amountBr || 0
      return acc
    }, {} as Record<string, { count: number; totalValue: number }>)

    const lossReasonsFormatted = Object.entries(lossReasonStats).map(([reason, stats]) => ({
      reason,
      count: stats.count,
      value: stats.totalValue,
      percentage: lostOpportunities > 0 ? (stats.count / lostOpportunities) * 100 : 0,
    }))

    // Revenue forecast for 30/60/90 days
    const today = new Date()
    const forecast30Days = new Date(today)
    forecast30Days.setDate(today.getDate() + 30)
    const forecast60Days = new Date(today)
    forecast60Days.setDate(today.getDate() + 60)
    const forecast90Days = new Date(today)
    forecast90Days.setDate(today.getDate() + 90)

    const getWeightedForecast = async (endDate: Date) => {
      const opportunities = await prisma.opportunity.findMany({
        where: {
          ...whereClause,
          stage: {
            notIn: ['WON', 'LOST']
          },
          expectedCloseAt: {
            lte: endDate
          }
        },
        select: {
          amountBr: true,
          probability: true
        }
      })

      return opportunities.reduce((sum, opp) => {
        return sum + ((opp.amountBr || 0) * (opp.probability / 100))
      }, 0)
    }

    const forecast30 = await getWeightedForecast(forecast30Days)
    const forecast60 = await getWeightedForecast(forecast60Days)
    const forecast90 = await getWeightedForecast(forecast90Days)

    // Stage timing analysis
    const stageHistoryData = await prisma.stageHistory.findMany({
      where: {
        opportunity: {
          ...whereClause,
          createdAt: {
            gte: startDate,
          }
        }
      },
      orderBy: {
        changedAt: 'asc'
      },
      include: {
        opportunity: {
          select: {
            id: true
          }
        }
      }
    })

    // Calculate average time in each stage
    const stageTimings = stageHistoryData.reduce((acc, history) => {
      const oppId = history.opportunity.id
      if (!acc[oppId]) {
        acc[oppId] = []
      }
      acc[oppId].push(history)
      return acc
    }, {} as Record<string, any[]>)

    const stageDurations: Record<string, number[]> = {}

    Object.values(stageTimings).forEach((history: any[]) => {
      for (let i = 0; i < history.length - 1; i++) {
        const currentStage = history[i].stageFrom
        const startTime = history[i].changedAt.getTime()
        const endTime = history[i + 1].changedAt.getTime()
        const durationHours = (endTime - startTime) / (1000 * 60 * 60)

        if (!stageDurations[currentStage]) {
          stageDurations[currentStage] = []
        }
        stageDurations[currentStage].push(durationHours)
      }
    })

    const avgStageTimings = Object.entries(stageDurations).map(([stage, durations]) => ({
      stage,
      avgHours: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      count: durations.length
    }))

    // Enhanced source analysis with ticket médio
    const sourceStatsEnhanced = opportunitiesWithSources.reduce((acc, opp) => {
      const source = opp.lead.source || 'Não informado'
      if (!acc[source]) {
        acc[source] = { count: 0, totalValue: 0, wonCount: 0, wonValue: 0 }
      }
      acc[source].count++
      acc[source].totalValue += opp.amountBr || 0

      if (opp.stage === 'WON') {
        acc[source].wonCount++
        acc[source].wonValue += opp.amountBr || 0
      }
      return acc
    }, {} as Record<string, { count: number; totalValue: number; wonCount: number; wonValue: number }>)

    const sourceAnalysisFormatted = Object.entries(sourceStatsEnhanced).map(([source, stats]) => ({
      source,
      count: stats.count,
      totalValue: stats.totalValue,
      avgTicket: stats.count > 0 ? stats.totalValue / stats.count : 0,
      wonCount: stats.wonCount,
      wonValue: stats.wonValue,
      conversionRate: stats.count > 0 ? (stats.wonCount / stats.count) * 100 : 0,
      percentage: newOpportunities > 0 ? (stats.count / newOpportunities) * 100 : 0,
    }))

    // Previous period comparison (same period length, but shifted back)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - period)
    const prevEndDate = new Date(startDate)

    const prevOpportunities = await prisma.opportunity.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        }
      }
    })

    const prevWonOpportunities = await prisma.opportunity.count({
      where: {
        ...whereClause,
        stage: 'WON',
        closedAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
      },
    })

    const prevWonValue = await prisma.opportunity.aggregate({
      where: {
        ...whereClause,
        stage: 'WON',
        closedAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
      },
      _sum: {
        amountBr: true
      }
    })

    const prevAvgDealSize = prevWonOpportunities > 0 ? (prevWonValue._sum.amountBr || 0) / prevWonOpportunities : 0
    const prevWinRate = prevOpportunities > 0 ? (prevWonOpportunities / prevOpportunities) * 100 : 0

    const prevClosedOppsSalesCycle = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        stage: {
          in: ['WON', 'LOST']
        },
        closedAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
      },
      select: {
        createdAt: true,
        closedAt: true,
      }
    })

    const prevSalesCycleDays = prevClosedOppsSalesCycle
      .filter(opp => opp.closedAt)
      .map(opp => {
        const diffTime = Math.abs(opp.closedAt!.getTime() - opp.createdAt.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      })

    const prevAvgSalesCycle = prevSalesCycleDays.length > 0
      ? prevSalesCycleDays.reduce((sum, days) => sum + days, 0) / prevSalesCycleDays.length
      : 0

    // Margin analysis
    const marginAnalysis = await prisma.opportunity.findMany({
      where: {
        ...whereClause,
        stage: 'WON',
        closedAt: {
          gte: startDate,
        },
        costEstimatedBr: {
          not: null
        }
      },
      select: {
        amountBr: true,
        costEstimatedBr: true
      }
    })

    const totalRevenue = marginAnalysis.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)
    const totalCost = marginAnalysis.reduce((sum, opp) => sum + (opp.costEstimatedBr || 0), 0)
    const totalMargin = totalRevenue - totalCost
    const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

    // Responsible user analysis (heatmap)
    const userOpportunityStats = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ownedOpportunities: {
              where: {
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
        },
      },
      where: {
        ownedOpportunities: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    })

    const userStatsDetailed = await Promise.all(userOpportunityStats.map(async (user) => {
      const createdOpps = await prisma.opportunity.count({
        where: {
          ownerId: user.id,
          createdAt: {
            gte: startDate,
          },
        },
      })

      const wonOpps = await prisma.opportunity.count({
        where: {
          ownerId: user.id,
          stage: 'WON',
          closedAt: {
            gte: startDate,
          },
        },
      })

      const lostOpps = await prisma.opportunity.count({
        where: {
          ownerId: user.id,
          stage: 'LOST',
          updatedAt: {
            gte: startDate,
          },
        },
      })

      const userRevenue = await prisma.opportunity.aggregate({
        where: {
          ownerId: user.id,
          stage: 'WON',
          closedAt: {
            gte: startDate,
          },
        },
        _sum: {
          amountBr: true
        }
      })

      return {
        userId: user.id,
        userName: user.name,
        createdOpportunities: createdOpps,
        wonOpportunities: wonOpps,
        lostOpportunities: lostOpps,
        revenue: userRevenue._sum.amountBr || 0,
        winRate: createdOpps > 0 ? (wonOpps / createdOpps) * 100 : 0,
      }
    }))

    const analyticsData = {
      overview: {
        totalOpportunities,
        newOpportunities,
        wonOpportunities,
        lostOpportunities,
        winRate,
        totalPipelineValue: totalPipelineValue._sum.amountBr || 0,
        weightedPipelineValue: weightedValue,
        wonValue: wonValue._sum.amountBr || 0,
        avgDealSize,
        avgSalesCycle,
      },
      trends: {
        opportunitiesPerWeek,
        revenuePerWeek,
        stageDistribution: stageDistributionFormatted,
        sourceBreakdown: sourceBreakdownArray,
      },
      performance: {
        topPerformers: topPerformersFormatted,
      },
      lossAnalysis: {
        lossReasons: lossReasonsFormatted,
        totalLostValue: lossReasonStats ? Object.values(lossReasonStats).reduce((sum, stat) => sum + stat.totalValue, 0) : 0
      },
      forecast: {
        next30Days: forecast30,
        next60Days: forecast60,
        next90Days: forecast90,
      },
      stageAnalysis: {
        avgStageTimings,
        totalStages: avgStageTimings.length
      },
      sourceAnalysis: {
        sources: sourceAnalysisFormatted,
        totalSources: sourceAnalysisFormatted.length
      },
      comparison: {
        previousPeriod: {
          totalOpportunities: prevOpportunities,
          wonOpportunities: prevWonOpportunities,
          wonValue: prevWonValue._sum.amountBr || 0,
          avgDealSize: prevAvgDealSize,
          avgSalesCycle: prevAvgSalesCycle,
          winRate: prevWinRate,
        },
        changes: {
          totalOpportunitiesChange: prevOpportunities > 0 ? ((newOpportunities - prevOpportunities) / prevOpportunities) * 100 : 0,
          winRateChange: prevWinRate > 0 ? ((winRate - prevWinRate) / prevWinRate) * 100 : 0,
          avgDealSizeChange: prevAvgDealSize > 0 ? ((avgDealSize - prevAvgDealSize) / prevAvgDealSize) * 100 : 0,
          avgSalesCycleChange: prevAvgSalesCycle > 0 ? ((avgSalesCycle - prevAvgSalesCycle) / prevAvgSalesCycle) * 100 : 0,
          revenueChange: (prevWonValue._sum.amountBr || 0) > 0 ? (((wonValue._sum.amountBr || 0) - (prevWonValue._sum.amountBr || 0)) / (prevWonValue._sum.amountBr || 0)) * 100 : 0,
        }
      },
      marginAnalysis: {
        totalRevenue,
        totalCost,
        totalMargin,
        marginPercentage,
        dealsWithCostData: marginAnalysis.length,
        avgMarginPerDeal: marginAnalysis.length > 0 ? totalMargin / marginAnalysis.length : 0,
      },
      userHeatmap: {
        users: userStatsDetailed.sort((a, b) => b.revenue - a.revenue),
        totalUsers: userStatsDetailed.length
      },
      targets: await calculateTargetVsActual(userRole, session.user.id, startDate)
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    console.error('Error fetching opportunities analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}