import { NextRequest, NextResponse } from 'next/server'
import { salesAutomationService } from '@/services/sales-automation-service'

// POST /api/sales/automation/trigger - Disparar automação por mudança de estágio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      opportunityId,
      leadId,
      oldStage,
      newStage,
      userId,
      value
    } = body

    if (!opportunityId || !leadId || !newStage || !userId) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: opportunityId, leadId, newStage, userId' },
        { status: 400 }
      )
    }

    const result = await salesAutomationService.handleStageChange({
      opportunityId,
      leadId,
      oldStage: oldStage || 'NEW',
      newStage,
      userId,
      value
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Erro ao processar trigger de automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}