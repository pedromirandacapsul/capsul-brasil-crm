import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { notificationService } from '@/services/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
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
        { success: false, error: 'Sem permissão para visualizar configurações de notificação' },
        { status: 403 }
      )
    }

    const config = notificationService.getConfig()

    return NextResponse.json({
      success: true,
      data: {
        config,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching notification config:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
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
        { success: false, error: 'Sem permissão para modificar configurações de notificação' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuração é obrigatória' },
        { status: 400 }
      )
    }

    // Atualizar configuração
    notificationService.updateConfig(config)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Configuração atualizada com sucesso',
        newConfig: notificationService.getConfig()
      }
    })

  } catch (error) {
    console.error('Error updating notification config:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
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
        { success: false, error: 'Sem permissão para testar notificações' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, testData } = body

    if (action === 'test') {
      // Enviar notificação de teste
      const result = await notificationService.send({
        type: 'opportunity_created',
        title: '🧪 Teste de Notificação',
        message: 'Esta é uma notificação de teste do sistema CRM Capsul',
        urgency: 'medium',
        data: {
          leadName: 'Lead de Teste',
          stage: 'QUALIFICATION',
          amount: 5000,
          ownerName: 'Administrador',
          ...testData
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'Notificação de teste enviada',
          result
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error testing notification:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}