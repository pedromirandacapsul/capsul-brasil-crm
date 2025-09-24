/**
 * API para processar steps agendados (chamada por cron job)
 */

import { NextRequest, NextResponse } from 'next/server'
import { EmailWorkflowService } from '@/services/email-workflow-service'

const workflowService = new EmailWorkflowService()

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autorização para cron jobs
    const authHeader = request.headers.get('authorization')
    const cronToken = process.env.CRON_SECRET_TOKEN || 'default-cron-token'

    if (authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json(
        { success: false, error: 'Token de autorização inválido' },
        { status: 401 }
      )
    }

    console.log('⏰ Processando steps agendados via cron job...')

    const result = await workflowService.processScheduledSteps()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      message: `${result.processed} execuções processadas`
    })

  } catch (error: any) {
    console.error('Erro ao processar steps agendados:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// Também permitir GET para testes manuais em desenvolvimento
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    )
  }

  console.log('🔧 Processando steps agendados (teste manual)...')

  const result = await workflowService.processScheduledSteps()

  return NextResponse.json({
    success: true,
    processed: result.processed || 0,
    message: `${result.processed || 0} execuções processadas`
  })
}