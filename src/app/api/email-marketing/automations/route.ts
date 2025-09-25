import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const automations = await prisma.emailWorkflow.findMany({
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        executions: {
          select: {
            id: true,
            status: true,
            startedAt: true
          }
        },
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estatísticas para cada automação
    const automationsWithStats = await Promise.all(
      automations.map(async (automation) => {
        const executions = await prisma.emailWorkflowExecution.findMany({
          where: { workflowId: automation.id }
        })

        const totalExecutions = executions.length
        const runningExecutions = executions.filter(e => e.status === 'RUNNING').length
        const completedExecutions = executions.filter(e => e.status === 'COMPLETED').length
        const failedExecutions = executions.filter(e => e.status === 'FAILED').length

        // Calcular leads elegíveis (simulado)
        const eligibleLeads = Math.floor(Math.random() * 500) + 50

        // Estatísticas de email (simuladas baseadas no tipo de trigger)
        let openRate = 0
        let clickRate = 0
        let triggered = totalExecutions

        switch (automation.triggerType) {
          case 'LEAD_CREATED':
            openRate = Math.random() * 20 + 30 // 30-50%
            clickRate = Math.random() * 10 + 5  // 5-15%
            break
          case 'STATUS_CHANGED':
            openRate = Math.random() * 30 + 40 // 40-70%
            clickRate = Math.random() * 15 + 10 // 10-25%
            break
          case 'TAG_ADDED':
            openRate = Math.random() * 25 + 35 // 35-60%
            clickRate = Math.random() * 12 + 8  // 8-20%
            break
          default:
            openRate = Math.random() * 20 + 25 // 25-45%
            clickRate = Math.random() * 8 + 6   // 6-14%
        }

        const opened = Math.floor(triggered * (openRate / 100))
        const clicked = Math.floor(opened * (clickRate / (openRate || 1)))

        return {
          id: automation.id,
          name: automation.name,
          description: automation.description,
          trigger: getTriggerLabel(automation.triggerType),
          isActive: automation.active,
          leads: eligibleLeads,
          triggered,
          opened,
          clicked,
          openRate: Number(openRate.toFixed(1)),
          clickRate: Number(clickRate.toFixed(1)),
          createdAt: automation.createdAt.toISOString(),
          steps: automation.steps.length,
          executions: {
            total: totalExecutions,
            running: runningExecutions,
            completed: completedExecutions,
            failed: failedExecutions
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: automationsWithStats
    })

  } catch (error) {
    console.error('Erro ao buscar automações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar automações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, triggerType, conditions, steps } = body

    // Validações básicas
    if (!name || !triggerType) {
      return NextResponse.json(
        { success: false, error: 'Nome e tipo de trigger são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar a automação
    const automation = await prisma.emailWorkflow.create({
      data: {
        name,
        description: description || '',
        triggerType,
        triggerConfig: JSON.stringify(conditions || {}),
        active: false, // Inicia inativa
        createdById: 'user-admin' // TODO: pegar do contexto de auth
      }
    })

    // Criar os steps se fornecidos
    if (steps && steps.length > 0) {
      await Promise.all(
        steps.map((step: any, index: number) =>
          prisma.emailWorkflowStep.create({
            data: {
              workflowId: automation.id,
              stepOrder: index + 1,
              templateId: step.templateId,
              delayHours: step.delayHours || 0,
              conditions: step.conditions ? JSON.stringify(step.conditions) : null
            }
          })
        )
      )
    }

    return NextResponse.json({
      success: true,
      data: automation,
      message: 'Automação criada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar automação' },
      { status: 500 }
    )
  }
}

function getTriggerLabel(triggerType: string): string {
  const labels = {
    'LEAD_CREATED': 'Não abriu email há 30 dias',
    'STATUS_CHANGED': 'Visitou página de preços sem converter',
    'TAG_ADDED': 'Data de aniversário',
    'DATE_BASED': 'Score ≥ 80 pontos',
    'MANUAL': 'Download de material'
  }
  return labels[triggerType as keyof typeof labels] || triggerType
}