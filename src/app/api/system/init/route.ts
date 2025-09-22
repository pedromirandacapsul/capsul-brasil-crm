import { NextRequest, NextResponse } from 'next/server'
import { initializeServices } from '@/lib/startup'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Recebida solicitação para inicializar serviços')

    // Inicializar todos os serviços
    await initializeServices()

    return NextResponse.json({
      success: true,
      message: 'Serviços inicializados com sucesso',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao inicializar serviços',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de inicialização de serviços',
    usage: 'POST para inicializar serviços'
  })
}