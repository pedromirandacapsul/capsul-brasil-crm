import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { emailMarketingService } from '@/services/email-marketing-service'

// GET /api/email/segments - Listar segmentos salvos
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
        { success: false, error: 'Sem permissão para visualizar segmentos' },
        { status: 403 }
      )
    }

    // Para simplificar, vamos retornar uma lista vazia por enquanto
    // Futuramente implementar a busca no banco
    return NextResponse.json({
      success: true,
      data: []
    })

  } catch (error) {
    console.error('Error fetching email segments:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/email/segments - Criar segmento
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
        { success: false, error: 'Sem permissão para criar segmentos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, conditions } = body

    if (!name || !conditions) {
      return NextResponse.json(
        { success: false, error: 'Nome e condições são obrigatórios' },
        { status: 400 }
      )
    }

    const segment = await emailMarketingService.createSegment({
      name,
      description,
      conditions,
      createdById: session?.user?.id || 'admin'
    })

    return NextResponse.json({
      success: true,
      data: segment
    })

  } catch (error) {
    console.error('Error creating email segment:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}