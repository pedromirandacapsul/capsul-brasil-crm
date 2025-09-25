import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/sales/activities - Listar atividades de vendas
export async function GET(request: NextRequest) {
  try {
    const activities = await prisma.salesActivity.findMany({
      include: {
        opportunity: {
          include: {
            lead: {
              select: {
                name: true,
                company: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar para performance
    })

    return NextResponse.json({
      success: true,
      data: activities
    })

  } catch (error: any) {
    console.error('Erro ao listar atividades de vendas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}