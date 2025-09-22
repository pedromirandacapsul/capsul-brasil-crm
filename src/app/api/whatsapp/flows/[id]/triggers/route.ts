import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scheduler } from '@/lib/scheduler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: flowId } = await params

    // Buscar gatilhos do fluxo
    const triggers = await prisma.flowTrigger.findMany({
      where: {
        flowId: flowId,
        flow: {
          userId: session.user.id
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Buscar informações do fluxo
    const flow = await prisma.messageFlow.findFirst({
      where: {
        id: flowId,
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true
      }
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json({
      flow,
      triggers: triggers.map(trigger => ({
        id: trigger.id,
        type: trigger.triggerType,
        name: trigger.name,
        isActive: trigger.isActive,
        config: trigger.config ? JSON.parse(trigger.config) : {}
      }))
    })

  } catch (error) {
    console.error('Error fetching triggers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: flowId } = await params
    const body = await request.json()
    const { type, name, isActive = true, config } = body

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar se o fluxo existe e pertence ao usuário
    const flow = await prisma.messageFlow.findFirst({
      where: {
        id: flowId,
        userId: session.user.id
      }
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Criar o gatilho
    const trigger = await prisma.flowTrigger.create({
      data: {
        flowId,
        triggerType: type,
        name,
        isActive,
        config: config ? JSON.stringify(config) : null
      },
      include: {
        flow: {
          select: {
            id: true,
            name: true,
            isActive: true,
            userId: true
          }
        }
      }
    })

    // Se for um gatilho de agendamento e estiver ativo, agendar no scheduler
    if (type === 'SCHEDULE' && isActive && trigger.flow.isActive) {
      try {
        await scheduler.scheduleJob(trigger)
        console.log(`✅ Trigger de agendamento "${name}" adicionado ao scheduler`)
      } catch (error) {
        console.error(`❌ Erro ao agendar trigger "${name}":`, error)
        // Não falhar a criação do trigger se o agendamento falhar
      }
    }

    return NextResponse.json({
      trigger: {
        id: trigger.id,
        type: trigger.triggerType,
        name: trigger.name,
        isActive: trigger.isActive,
        config: trigger.config ? JSON.parse(trigger.config) : {}
      }
    })

  } catch (error) {
    console.error('Error creating trigger:', error)
    return NextResponse.json(
      { error: 'Failed to create trigger' },
      { status: 500 }
    )
  }
}