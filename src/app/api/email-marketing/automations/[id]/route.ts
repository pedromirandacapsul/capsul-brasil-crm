import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const automation = await prisma.emailWorkflow.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 100,
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: automation
    })

  } catch (error) {
    console.error('Erro ao buscar automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar automação' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, active, triggerConditions, steps } = body

    // Atualizar automação
    const automation = await prisma.emailWorkflow.update({
      where: { id: params.id },
      data: {
        name,
        description,
        active,
        triggerConfig: triggerConditions ? JSON.stringify(triggerConditions) : undefined
      }
    })

    // Atualizar steps se fornecidos
    if (steps) {
      // Remover steps existentes
      await prisma.emailWorkflowStep.deleteMany({
        where: { workflowId: params.id }
      })

      // Criar novos steps
      if (steps.length > 0) {
        await Promise.all(
          steps.map((step: any, index: number) =>
            prisma.emailWorkflowStep.create({
              data: {
                workflowId: params.id,
                stepOrder: index + 1,
                templateId: step.templateId,
                delayHours: step.delayHours || 0,
                conditions: step.conditions ? JSON.stringify(step.conditions) : null
              }
            })
          )
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: automation,
      message: 'Automação atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar automação' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se há execuções ativas
    const activeExecutions = await prisma.emailWorkflowExecution.count({
      where: {
        workflowId: params.id,
        status: 'RUNNING'
      }
    })

    if (activeExecutions > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir automação com execuções ativas' },
        { status: 400 }
      )
    }

    // Excluir steps primeiro
    await prisma.emailWorkflowStep.deleteMany({
      where: { workflowId: params.id }
    })

    // Excluir execuções
    await prisma.emailWorkflowExecution.deleteMany({
      where: { workflowId: params.id }
    })

    // Excluir automação
    await prisma.emailWorkflow.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Automação excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir automação' },
      { status: 500 }
    )
  }
}