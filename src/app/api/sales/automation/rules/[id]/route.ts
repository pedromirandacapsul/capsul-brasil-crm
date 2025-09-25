import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT /api/sales/automation/rules/[id] - Atualizar regra específica
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, triggerType, triggerValue, templateId, delayHours, conditions, active } = body

    // Atualizar regra
    const updatedRule = await prisma.salesAutomationRule.update({
      where: { id: params.id },
      data: {
        name,
        description,
        triggerType,
        triggerValue,
        templateId,
        delayHours: parseInt(delayHours),
        conditions: typeof conditions === 'string' ? conditions : JSON.stringify(conditions),
        active: Boolean(active)
      },
      include: {
        template: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRule
    })

  } catch (error: any) {
    console.error('Erro ao atualizar regra de automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}