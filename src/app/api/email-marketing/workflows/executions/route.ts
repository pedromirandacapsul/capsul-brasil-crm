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

    const executions = await prisma.emailWorkflowExecution.findMany({
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