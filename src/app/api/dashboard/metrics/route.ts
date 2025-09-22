import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // TEMPORÁRIO: Bypass de autenticação para testes
    const skipAuth = true

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Data de hoje e 30 dias atrás
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Total de Leads
    const totalLeads = await prisma.lead.count()
    const leadsThisMonth = await prisma.lead.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
    const leadsLastMonth = await prisma.lead.count({
      where: {
        createdAt: {
          gte: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    })
    const leadsGrowth = leadsLastMonth > 0 ?
      ((leadsThisMonth - leadsLastMonth) / leadsLastMonth * 100) : 100

    // 2. Leads Qualificados
    const qualifiedLeads = await prisma.lead.count({
      where: {
        status: {
          in: ['QUALIFIED', 'PROPOSAL', 'WON']
        }
      }
    })
    const qualifiedThisMonth = await prisma.lead.count({
      where: {
        status: {
          in: ['QUALIFIED', 'PROPOSAL', 'WON']
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
    const qualifiedLastMonth = await prisma.lead.count({
      where: {
        status: {
          in: ['QUALIFIED', 'PROPOSAL', 'WON']
        },
        createdAt: {
          gte: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    })
    const qualifiedGrowth = qualifiedLastMonth > 0 ?
      ((qualifiedThisMonth - qualifiedLastMonth) / qualifiedLastMonth * 100) : 100

    // 3. Taxa de Conversão
    const wonLeads = await prisma.lead.count({
      where: { status: 'WON' }
    })
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads * 100) : 0

    const wonThisMonth = await prisma.lead.count({
      where: {
        status: 'WON',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
    const conversionThisMonth = leadsThisMonth > 0 ? (wonThisMonth / leadsThisMonth * 100) : 0

    const wonLastMonth = await prisma.lead.count({
      where: {
        status: 'WON',
        createdAt: {
          gte: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    })
    const conversionLastMonth = leadsLastMonth > 0 ? (wonLastMonth / leadsLastMonth * 100) : 0
    const conversionGrowth = conversionLastMonth > 0 ?
      (conversionThisMonth - conversionLastMonth) : conversionThisMonth

    // 4. Leads por Status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // 5. Atividades Recentes
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        lead: {
          select: {
            name: true,
            company: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    })

    // 6. Tasks Pendentes
    const pendingTasks = await prisma.task.count({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    })

    // 7. Tasks Atrasadas
    const overdueTasks = await prisma.task.count({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        },
        dueAt: {
          lt: today
        }
      }
    })

    // 8. Leads Hoje
    const leadsToday = await prisma.lead.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      }
    })

    // 9. Leads Esta Semana
    const leadsThisWeek = await prisma.lead.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    // 10. Performance por Usuário
    const userPerformance = await prisma.user.findMany({
      where: {
        role: {
          in: ['SALES', 'MANAGER']
        }
      },
      include: {
        ownedLeads: {
          select: {
            status: true
          }
        },
        _count: {
          select: {
            ownedLeads: true,
            assignedTasks: true,
            activities: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          leadsToday,
          leadsThisWeek,
          leadsThisMonth,
          leadsGrowth: Math.round(leadsGrowth * 100) / 100,
          qualifiedLeads,
          qualifiedGrowth: Math.round(qualifiedGrowth * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          conversionGrowth: Math.round(conversionGrowth * 100) / 100,
          pendingTasks,
          overdueTasks
        },
        leadsByStatus: leadsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.type,
          leadName: activity.lead.name,
          leadCompany: activity.lead.company,
          userName: activity.user.name,
          createdAt: activity.createdAt
        })),
        userPerformance: userPerformance.map(user => ({
          id: user.id,
          name: user.name,
          totalLeads: user._count.ownedLeads,
          totalTasks: user._count.assignedTasks,
          totalActivities: user._count.activities,
          wonLeads: user.ownedLeads.filter(lead => lead.status === 'WON').length,
          conversionRate: user._count.ownedLeads > 0 ?
            (user.ownedLeads.filter(lead => lead.status === 'WON').length / user._count.ownedLeads * 100) : 0
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}