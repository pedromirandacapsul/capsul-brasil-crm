import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/sales/scheduled-emails - Listar emails agendados
export async function GET(request: NextRequest) {
  try {
    const scheduledEmails = await prisma.scheduledEmail.findMany({
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
        scheduledAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: scheduledEmails
    })

  } catch (error: any) {
    console.error('Erro ao listar emails agendados:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}