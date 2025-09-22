import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scheduler } from '@/lib/scheduler'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obter status dos jobs agendados
    const status = scheduler.getJobsStatus()

    return NextResponse.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro ao obter status do scheduler:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao obter status do scheduler',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, triggerId } = body

    switch (action) {
      case 'reschedule':
        if (!triggerId) {
          return NextResponse.json(
            { error: 'triggerId é obrigatório para reagendar' },
            { status: 400 }
          )
        }

        await scheduler.rescheduleJob(triggerId)

        return NextResponse.json({
          success: true,
          message: `Trigger ${triggerId} reagendado com sucesso`
        })

      case 'stop_all':
        scheduler.stopAll()

        return NextResponse.json({
          success: true,
          message: 'Todos os jobs foram parados'
        })

      case 'restart':
        // Parar todos e reinicializar
        scheduler.stopAll()
        await scheduler.initialize()

        return NextResponse.json({
          success: true,
          message: 'Scheduler reiniciado com sucesso'
        })

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Erro ao executar ação no scheduler:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao executar ação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}