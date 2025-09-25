import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/sales/automation/rules - Listar regras de automação
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar regras de automação' },
        { status: 403 }
      )
    }

    const rules = await prisma.salesAutomationRule.findMany({
      include: {
        template: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: rules
    })

  } catch (error) {
    console.error('Erro ao buscar regras de automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/sales/automation/rules - Criar regra de automação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar regras de automação' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      triggerType,
      triggerValue,
      templateId,
      delayHours,
      conditions,
      active
    } = body

    if (!name || !triggerType || !triggerValue) {
      return NextResponse.json(
        { success: false, error: 'Nome, tipo de trigger e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const rule = await prisma.salesAutomationRule.create({
      data: {
        name,
        description,
        triggerType,
        triggerValue,
        templateId,
        delayHours: delayHours || 0,
        conditions: conditions ? JSON.stringify(conditions) : null,
        active: active !== undefined ? active : true,
        createdById: session?.user?.id || 'cmfx575q400009t5sv8fjg1rh'
      },
      include: {
        template: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: rule
    })

  } catch (error) {
    console.error('Erro ao criar regra de automação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}