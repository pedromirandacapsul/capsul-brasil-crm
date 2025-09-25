/**
 * API para gerenciamento de execuções de workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { EmailWorkflowService } from '@/services/email-workflow-service'

const workflowService = new EmailWorkflowService()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    if (process.env.SKIP_AUTH_IN_DEVELOPMENT !== 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 Listando execuções de workflow...')

    const whereClause: any = {}
    if (workflowId) whereClause.workflowId = workflowId
    if (status) whereClause.status = status

    const rawExecutions = await prisma.emailWorkflowExecution.findMany({
      where: whereClause,
      include: {
        workflow: {
          select: {
            name: true
          }
        },
        lead: {
          select: {
            name: true,
            email: true,
            company: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transformar dados para o formato esperado pela interface
    const executions = await Promise.all(rawExecutions.map(async (execution) => {
      // Buscar o step atual
      const currentStepData = await prisma.emailWorkflowStep.findFirst({
        where: {
          workflowId: execution.workflowId,
          stepOrder: execution.currentStep
        },
        include: {
          template: {
            select: {
              name: true,
              subject: true
            }
          }
        }
      })

      // Mapear status do banco para interface
      let uiStatus = execution.status
      switch (execution.status) {
        case 'RUNNING':
          uiStatus = execution.nextStepAt && execution.nextStepAt > new Date() ? 'PENDING' : 'RUNNING'
          break
        case 'COMPLETED':
          uiStatus = 'SENT'
          break
        case 'FAILED':
          uiStatus = 'FAILED'
          break
        case 'PAUSED':
          uiStatus = 'PENDING'
          break
      }

      // Adicionar informações sobre próximas ações para status pendentes
      let nextAction = null
      if (uiStatus === 'PENDING' && execution.nextStepAt) {
        const nextStepTime = new Date(execution.nextStepAt)
        const now = new Date()
        const diffMs = nextStepTime.getTime() - now.getTime()
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

        nextAction = {
          scheduledFor: execution.nextStepAt.toISOString(),
          hoursRemaining: diffHours > 0 ? diffHours : 0,
          description: diffHours > 0
            ? `Próximo email será enviado em ${diffHours} horas`
            : 'Aguardando processamento'
        }
      }

      return {
        id: execution.id,
        leadId: execution.leadId,
        workflowId: execution.workflowId,
        stepOrder: execution.currentStep,
        status: uiStatus,
        scheduledAt: execution.nextStepAt?.toISOString() || execution.startedAt.toISOString(),
        executedAt: execution.completedAt?.toISOString(),
        error: execution.error,
        logs: execution.logs,
        nextAction: nextAction,
        lead: execution.lead,
        workflow: {
          name: execution.workflow.name
        },
        step: currentStepData ? {
          template: currentStepData.template
        } : undefined
      }
    }))

    const total = await prisma.emailWorkflowExecution.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      executions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error: any) {
    console.error('Erro ao listar execuções:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { executionId, action } = body

    if (!executionId || !action) {
      return NextResponse.json(
        { success: false, error: 'executionId e action obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`🔄 Ação ${action} na execução ${executionId}`)

    let result
    switch (action) {
      case 'pause':
        result = await workflowService.pauseWorkflowExecution(executionId)
        break
      case 'resume':
        result = await workflowService.resumeWorkflowExecution(executionId)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Execução ${action === 'pause' ? 'pausada' : 'retomada'} com sucesso`
    })

  } catch (error: any) {
    console.error('Erro ao controlar execução:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}