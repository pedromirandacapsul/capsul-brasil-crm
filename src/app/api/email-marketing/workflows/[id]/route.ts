/**
 * API para gerenciamento individual de workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { EmailWorkflowService } from '@/services/email-workflow-service'

const workflowService = new EmailWorkflowService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workflowId = params.id

    const workflow = await prisma.emailWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          include: {
            template: true
          },
          orderBy: {
            stepOrder: 'asc'
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow não encontrado' },
        { status: 404 }
      )
    }

    // Obter estatísticas
    const statsResult = await workflowService.getWorkflowStats(workflowId)
    const stats = statsResult.success ? statsResult.stats : null

    return NextResponse.json({
      success: true,
      workflow,
      stats
    })

  } catch (error: any) {
    console.error('Erro ao obter workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const workflowId = params.id
    const body = await request.json()
    const { active } = body

    // Ativar/desativar workflow
    if (typeof active === 'boolean') {
      const workflow = await prisma.emailWorkflow.update({
        where: { id: workflowId },
        data: { active }
      })

      return NextResponse.json({
        success: true,
        workflow
      })
    }

    return NextResponse.json(
      { success: false, error: 'Parâmetro inválido' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Erro ao atualizar workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const workflowId = params.id

    // Primeiro pausar todas as execuções ativas
    await prisma.emailWorkflowExecution.updateMany({
      where: {
        workflowId,
        status: 'RUNNING'
      },
      data: {
        status: 'PAUSED'
      }
    })

    // Deletar workflow (cascata deletará steps e execuções)
    await prisma.emailWorkflow.delete({
      where: { id: workflowId }
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow deletado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao deletar workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}