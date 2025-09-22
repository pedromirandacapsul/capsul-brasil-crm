import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar itens de oportunidades' },
        { status: 403 }
      )
    }

    // Check if opportunity exists and user has access
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can view this opportunity
    if (userRole === 'SALES' && opportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar itens desta oportunidade' },
        { status: 403 }
      )
    }

    const items = await prisma.opportunityItem.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: items
    })

  } catch (error) {
    console.error('Error fetching opportunity items:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_EDIT)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para adicionar itens a oportunidades' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productName, qty = 1, unitPriceBr } = body

    // Validate required fields
    if (!productName || !unitPriceBr) {
      return NextResponse.json(
        { success: false, error: 'Nome do produto e preço unitário são obrigatórios' },
        { status: 400 }
      )
    }

    if (qty <= 0 || unitPriceBr <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantidade e preço devem ser maiores que zero' },
        { status: 400 }
      )
    }

    // Check if opportunity exists and user has access
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { ownerId: true }
    })

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: 'Oportunidade não encontrada' },
        { status: 404 }
      )
    }

    // Check if user can edit this opportunity
    if (userRole === 'SALES' && opportunity.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar itens desta oportunidade' },
        { status: 403 }
      )
    }

    // Calculate subtotal
    const subtotalBr = qty * unitPriceBr

    const item = await prisma.opportunityItem.create({
      data: {
        opportunityId: params.id,
        productName,
        qty,
        unitPriceBr,
        subtotalBr
      }
    })

    // Update opportunity amount based on items total
    const allItems = await prisma.opportunityItem.findMany({
      where: { opportunityId: params.id }
    })

    const totalAmount = allItems.reduce((sum, item) => sum + item.subtotalBr, 0)

    await prisma.opportunity.update({
      where: { id: params.id },
      data: { amountBr: totalAmount }
    })

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('Error creating opportunity item:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}