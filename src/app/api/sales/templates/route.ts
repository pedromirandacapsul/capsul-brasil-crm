import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { salesAutomationService } from '@/services/sales-automation-service'

// GET /api/sales/templates - Listar templates de vendas
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
        { success: false, error: 'Sem permissão para visualizar templates' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const stage = searchParams.get('stage')

    const prisma = (salesAutomationService as any).prisma || require('@prisma/client').PrismaClient
    const db = new prisma()

    const where: any = { active: true }
    if (type) where.type = type
    if (stage) where.stage = stage

    const templates = await db.salesTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('Erro ao buscar templates de vendas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/sales/templates - Criar template de vendas
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
        { success: false, error: 'Sem permissão para criar templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      stage,
      subject,
      content,
      generatePdf,
      isDefault
    } = body

    if (!name || !type || !subject || !content) {
      return NextResponse.json(
        { success: false, error: 'Nome, tipo, assunto e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    const template = await salesAutomationService.createSalesTemplate({
      name,
      type,
      stage,
      subject,
      content,
      generatePdf,
      isDefault,
      userId: session?.user?.id || 'cmfx575q400009t5sv8fjg1rh'
    })

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Erro ao criar template de vendas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}