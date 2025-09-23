import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpportunityStage } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stage, amount, lossReason, currentStage } = body

    const validationErrors: string[] = []

    // Validações por stage
    if (stage === 'PROPOSAL') {
      if (!amount || amount <= 0) {
        validationErrors.push('Valor da proposta é obrigatório para o estágio PROPOSAL')
      }
    }

    if (stage === 'LOST') {
      if (!lossReason) {
        validationErrors.push('Motivo da perda é obrigatório para o estágio LOST')
      }
    }

    // Validações de transição de estágio
    if (currentStage && (currentStage === 'WON' || currentStage === 'LOST')) {
      if (stage !== currentStage) {
        validationErrors.push(
          `Não é possível alterar o estágio de ${currentStage} para ${stage}`
        )
      }
    }

    // Validar sequência lógica de estágios
    const stageOrder: OpportunityStage[] = [
      'NEW',
      'QUALIFICATION',
      'DISCOVERY',
      'PROPOSAL',
      'NEGOTIATION',
      'WON'
    ]

    if (currentStage && stage && stage !== 'LOST') {
      const currentIndex = stageOrder.indexOf(currentStage as OpportunityStage)
      const newIndex = stageOrder.indexOf(stage as OpportunityStage)

      // Permitir avançar ou retroceder 1 estágio, ou pular para WON
      if (newIndex !== -1 && currentIndex !== -1) {
        const stageDiff = newIndex - currentIndex
        if (stageDiff > 2 && stage !== 'WON') {
          validationErrors.push(
            `Transição muito grande do estágio ${currentStage} para ${stage}. ` +
            `Considere passar pelos estágios intermediários.`
          )
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: validationErrors,
        message: 'Falha na validação'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Validação passou com sucesso'
    })

  } catch (error) {
    console.error('Error validating opportunity stage:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}