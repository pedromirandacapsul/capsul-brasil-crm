import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

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
    const type = searchParams.get('type') // 'loss' or 'source'
    const value = searchParams.get('value') // loss reason or source name
    const period = parseInt(searchParams.get('period') || '30')

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

    let opportunities = []

    if (type === 'loss' && value) {
      // Get opportunities lost with specific reason
      opportunities = await prisma.opportunity.findMany({
        where: {
          ...whereClause,
          stage: 'LOST',
          lostReason: value,
          updatedAt: {
            gte: startDate,
          },
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              source: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    } else if (type === 'source' && value) {
      // Get opportunities from specific source
      opportunities = await prisma.opportunity.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate,
          },
          lead: {
            source: value
          }
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              source: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo ou valor de drill-down inválido' },
        { status: 400 }
      )
    }

    // Calculate summary stats
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)
    const avgValue = opportunities.length > 0 ? totalValue / opportunities.length : 0
    const wonCount = opportunities.filter(opp => opp.stage === 'WON').length
    const lostCount = opportunities.filter(opp => opp.stage === 'LOST').length
    const conversionRate = opportunities.length > 0 ? (wonCount / opportunities.length) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        summary: {
          total: opportunities.length,
          totalValue,
          avgValue,
          wonCount,
          lostCount,
          conversionRate,
          type,
          value
        }
      }
    })

  } catch (error) {
    console.error('Error fetching drill-down data:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}