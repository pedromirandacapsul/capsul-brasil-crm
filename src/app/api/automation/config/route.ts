import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { automationConfig } from '@/services/automation-config'
import { LeadStatus } from '@prisma/client'

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
        { success: false, error: 'Sem permissão para visualizar configurações de automação' },
        { status: 403 }
      )
    }

    // Obter todas as configurações
    const allTriggers = automationConfig.getAllTriggers()
    const activeTriggers = automationConfig.getActiveTriggers()
    const stats = automationConfig.getConfigStats()
    const validation = automationConfig.validateConfig()

    return NextResponse.json({
      success: true,
      data: {
        triggers: {
          all: allTriggers,
          active: activeTriggers
        },
        stats,
        validation,
        metadata: {
          totalConfigs: allTriggers.length,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching automation config:', error)
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
        { success: false, error: 'Sem permissão para modificar configurações de automação' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, updates } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se o status existe
    const validStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Atualizar configuração
    const updated = automationConfig.updateTriggerConfig(status, updates)

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Falha ao atualizar configuração' },
        { status: 400 }
      )
    }

    // Validar configuração após atualização
    const validation = automationConfig.validateConfig()

    return NextResponse.json({
      success: true,
      data: {
        updated: true,
        status,
        updates,
        validation,
        newConfig: automationConfig.getTriggerConfig(status)
      }
    })

  } catch (error) {
    console.error('Error updating automation config:', error)
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
        { success: false, error: 'Sem permissão para modificar configurações de automação' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, status, enabled } = body

    let result = false

    switch (action) {
      case 'toggle':
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Status é obrigatório para toggle' },
            { status: 400 }
          )
        }
        result = automationConfig.toggleTrigger(status, enabled)
        break

      case 'validate':
        const validation = automationConfig.validateConfig()
        return NextResponse.json({
          success: true,
          data: { validation }
        })

      case 'reset':
        // Aqui você poderia implementar reset para configurações padrão
        return NextResponse.json(
          { success: false, error: 'Reset ainda não implementado' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        result,
        status,
        enabled,
        newConfig: status ? automationConfig.getTriggerConfig(status) : null
      }
    })

  } catch (error) {
    console.error('Error performing automation config action:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}