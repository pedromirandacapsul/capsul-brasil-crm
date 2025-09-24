/**
 * API para iniciar execução manual de workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { EmailWorkflowService } from '@/services/email-workflow-service'

const workflowService = new EmailWorkflowService()

export async function POST(
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
    const { leadId, leadIds } = body

    if (!leadId && (!leadIds || !Array.isArray(leadIds))) {
      return NextResponse.json(
        { success: false, error: 'leadId ou leadIds obrigatório' },
        { status: 400 }
      )
    }

    console.log('🚀 Iniciando execução manual de workflow:', workflowId)

    const results = []

    // Se for um único lead
    if (leadId) {
      const result = await workflowService.startWorkflowExecution(
        workflowId,
        leadId,
        { trigger: 'MANUAL', userId: session.user.id }
      )
      results.push({ leadId, ...result })
    }

    // Se for múltiplos leads
    if (leadIds && Array.isArray(leadIds)) {
      for (const id of leadIds) {
        const result = await workflowService.startWorkflowExecution(
          workflowId,
          id,
          { trigger: 'MANUAL', userId: session.user.id }
        )
        results.push({ leadId: id, ...result })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error: any) {
    console.error('Erro ao iniciar execução:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}