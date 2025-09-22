import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeatureFlagService } from '@/lib/feature-flags'
import { z } from 'zod'

const featureFlagSchema = z.object({
  name: z.enum([
    'ads_integration',
    'auto_lead_scoring',
    'advanced_pipeline',
    'inbox_whatsapp',
    'inbox_email',
    'workflow_automation',
    'calendar_integration',
    'heatmap_tracking',
    'internal_chat',
    'email_campaigns',
    'sales_celebration',
  ]),
  enabled: z.boolean(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // TEMPORÁRIO: Bypass de autenticação para testes
    const skipAuth = false
    const isAdmin = session?.user?.role === 'ADMIN' || skipAuth

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Apenas admins podem ver feature flags
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const flags = await FeatureFlagService.getAll()

    return NextResponse.json({
      success: true,
      data: flags,
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Apenas admins podem modificar feature flags
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = featureFlagSchema.parse(body)

    const flag = await FeatureFlagService.upsert(
      validatedData.name,
      validatedData.enabled,
      validatedData.config,
      validatedData.description
    )

    return NextResponse.json({
      success: true,
      data: flag,
      message: `Feature flag '${validatedData.name}' ${
        validatedData.enabled ? 'ativada' : 'desativada'
      } com sucesso`,
    })
  } catch (error) {
    console.error('Error updating feature flag:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Apenas admins podem modificar feature flags
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'clear_cache') {
      FeatureFlagService.clearCache()
      return NextResponse.json({
        success: true,
        message: 'Cache de feature flags limpo com sucesso',
      })
    }

    if (action === 'initialize_defaults') {
      await FeatureFlagService.initializeDefaults()
      return NextResponse.json({
        success: true,
        message: 'Feature flags padrão inicializadas com sucesso',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error performing feature flag action:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}