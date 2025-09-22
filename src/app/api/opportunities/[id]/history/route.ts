import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar histórico de oportunidades' },
        { status: 403 }
      )
    }

    // Check if opportunity exists and user has access
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can view this opportunity
    if (userRole === 'SALES' && opportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar histórico desta oportunidade' },
        { status: 403 }
      )
    }

    const history = await prisma.stageHistory.findMany({
      where: { opportunityId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { changedAt: 'asc' }
    })

    // Calculate time spent in each stage
    const historyWithDuration = history.map((entry, index) => {
      let duration: number | null = null

      if (index < history.length - 1) {
        // Time to next stage
        const nextEntry = history[index + 1]
        duration = Math.floor((nextEntry.changedAt.getTime() - entry.changedAt.getTime()) / (1000 * 60 * 60 * 24)) // days
      } else {
        // Time from this stage to now (if not closed)
        duration = Math.floor((new Date().getTime() - entry.changedAt.getTime()) / (1000 * 60 * 60 * 24)) // days
      }

      return {
        ...entry,
        durationDays: duration,
        stageLabel: getStageLabel(entry.stageTo)
      }
    })

    return NextResponse.json({
      success: true,
      data: historyWithDuration
    })

  } catch (error) {
    console.error('Error fetching opportunity history:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'NEW': 'Novo',
    'QUALIFICATION': 'Qualificação',
    'DISCOVERY': 'Descoberta',
    'PROPOSAL': 'Proposta',
    'NEGOTIATION': 'Negociação',
    'WON': 'Ganho',
    'LOST': 'Perdido'
  }
  return labels[stage] || stage
}