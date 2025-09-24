import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { emailMarketingService } from '@/services/email-marketing-service'

// POST /api/email/segments/preview - Preview de leads por critérios
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
        { success: false, error: 'Sem permissão para visualizar preview' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { criteria } = body

    if (!criteria) {
      return NextResponse.json(
        { success: false, error: 'Critérios são obrigatórios' },
        { status: 400 }
      )
    }

    const leads = await emailMarketingService.getLeadsBySegment(criteria)

    return NextResponse.json({
      success: true,
      data: {
        leads,
        totalCount: leads.length
      }
    })

  } catch (error) {
    console.error('Error previewing segment:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}