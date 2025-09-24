/**
 * API para gerenciamento de workflows de email marketing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
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

    console.log('📋 Listando workflows...')

    const result = await workflowService.getWorkflows()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflows: result.workflows
    })

  } catch (error: any) {
    console.error('Erro ao listar workflows:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { name, description, trigger, steps } = body

    if (!name || !trigger || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: name, trigger, steps' },
        { status: 400 }
      )
    }

    console.log('✨ Criando workflow:', name)

    const result = await workflowService.createWorkflow({
      name,
      description,
      trigger,
      steps,
      userId: session.user.id
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflow: result.workflow
    })

  } catch (error: any) {
    console.error('Erro ao criar workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}