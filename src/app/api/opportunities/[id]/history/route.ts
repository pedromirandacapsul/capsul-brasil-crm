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

    // Controle de bypass via variável de ambiente (para desenvolvimento)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_VIEW)) {
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
    if (!skipAuth && userRole === 'SALES' && opportunity.ownerId !== session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar histórico desta oportunidade' },
        { status: 403 }
      )
    }

    const history = await prisma.stageHistory.findMany({
      where: { opportunityId: params.id },
      include: {
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate time spent in each stage and enrich data
    const historyWithDuration = history.map((entry, index) => {
      let duration: number | null = null

      if (index > 0) {
        // Time from previous stage (history is in desc order)
        const prevEntry = history[index - 1]
        duration = Math.floor((prevEntry.createdAt.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
      } else {
        // Time from this stage to now (if it's current stage)
        duration = Math.floor((new Date().getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
      }

      const stageProbabilities: Record<string, number> = {
        'NEW': 10,
        'QUALIFICATION': 25,
        'DISCOVERY': 40,
        'PROPOSAL': 60,
        'NEGOTIATION': 80,
        'WON': 100,
        'LOST': 0
      }

      return {
        ...entry,
        durationDays: duration,
        stageFromLabel: entry.stageFrom ? getStageLabel(entry.stageFrom) : null,
        stageToLabel: getStageLabel(entry.stageTo),
        probabilityFrom: entry.stageFrom ? stageProbabilities[entry.stageFrom] || 0 : null,
        probabilityTo: stageProbabilities[entry.stageTo] || 0,
        isFirstEntry: !entry.stageFrom,
        isWinOrLoss: ['WON', 'LOST'].includes(entry.stageTo),
        changedByName: entry.changedBy?.name || 'Sistema'
      }
    })

    // Calculate summary statistics
    const stats = {
      totalChanges: history.length,
      currentStage: history[0]?.stageTo || 'NEW',
      currentStageLabel: getStageLabel(history[0]?.stageTo || 'NEW'),
      daysInPipeline: history.length > 0 ? Math.ceil(
        (new Date().getTime() - new Date(history[history.length - 1].createdAt).getTime())
        / (1000 * 60 * 60 * 24)
      ) : 0,
      lastUpdated: history[0]?.createdAt || null,
      lastUpdatedBy: history[0]?.changedBy?.name || 'Sistema'
    }

    return NextResponse.json({
      success: true,
      data: {
        opportunityId: params.id,
        history: historyWithDuration,
        stats
      }
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