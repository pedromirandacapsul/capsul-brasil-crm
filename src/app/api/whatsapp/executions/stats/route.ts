import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar estatísticas gerais de execuções
    const totalExecutions = await prisma.flowExecution.count({
      where: {
        flow: {
          userId: session.user.id
        }
      }
    })

    const statusCounts = await prisma.flowExecution.groupBy({
      by: ['status'],
      where: {
        flow: {
          userId: session.user.id
        }
      },
      _count: {
        id: true
      }
    })

    // Converter para objeto mais fácil de usar
    const stats = {
      total: totalExecutions,
      pending: 0,
      running: 0,
      completed: 0,
      error: 0
    }

    statusCounts.forEach(item => {
      const status = item.status.toLowerCase()
      if (status in stats) {
        stats[status as keyof typeof stats] = item._count.id
      }
    })

    // Buscar execuções recentes
    const recentExecutions = await prisma.flowExecution.findMany({
      where: {
        flow: {
          userId: session.user.id
        }
      },
      include: {
        flow: {
          select: {
            name: true
          }
        },
        conversation: {
          select: {
            contactName: true,
            contactNumber: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 10
    })

    // Formatear execuções recentes
    const formattedExecutions = recentExecutions.map(execution => {
      let triggerName = 'Trigger Manual'

      try {
        const metadata = execution.metadata ? JSON.parse(execution.metadata) : {}
        triggerName = metadata.triggerName || triggerName
      } catch (error) {
        // Ignorar erro de parse
      }

      return {
        id: execution.id,
        flowName: execution.flow.name,
        triggerName,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt?.toISOString() || null,
        conversationId: execution.conversationId,
        contactName: execution.conversation.contactName || execution.conversation.contactNumber
      }
    })

    return NextResponse.json({
      ...stats,
      recentExecutions: formattedExecutions
    })

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de execuções:', error)

    return NextResponse.json(
      {
        error: 'Falha ao obter estatísticas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}