import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { contactIds, triggerType = 'MANUAL' } = body

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    // Verificar se o fluxo existe e pertence ao usuário
    const flow = await prisma.messageFlow.findFirst({
      where: {
        id: flowId,
        userId: session.user.id
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    if (!flow.isActive) {
      return NextResponse.json({ error: 'Flow is not active' }, { status: 400 })
    }

    // Buscar as conversas dos contatos
    const conversations = await prisma.whatsAppConversation.findMany({
      where: {
        id: { in: contactIds }
      },
      include: {
        account: true
      }
    })

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'No valid conversations found' }, { status: 404 })
    }

    const executions = []

    // Criar execução para cada conversa
    for (const conversation of conversations) {
      try {
        const execution = await prisma.flowExecution.create({
          data: {
            flowId,
            conversationId: conversation.id,
            accountId: conversation.account.id,
            status: 'PENDING',
            triggerType,
            startedAt: new Date(),
            currentStep: 1,
            metadata: JSON.stringify({
              contactName: conversation.contactName,
              contactNumber: conversation.contactNumber,
              triggerType,
              executedBy: session.user.id
            })
          }
        })

        executions.push(execution)

        // Aqui você pode implementar a lógica para iniciar a execução do fluxo
        // Por exemplo, enviar a primeira mensagem
        console.log(`Flow execution started for conversation ${conversation.id}`)

      } catch (error) {
        console.error(`Error creating execution for conversation ${conversation.id}:`, error)
      }
    }

    // Log da atividade
    console.log(`Manual trigger executed by user ${session.user.id} for flow ${flowId}`)
    console.log(`Executions created: ${executions.length}`)

    return NextResponse.json({
      success: true,
      executionsCreated: executions.length,
      totalContacts: contactIds.length,
      executions: executions.map(exec => ({
        id: exec.id,
        conversationId: exec.conversationId,
        status: exec.status,
        startedAt: exec.startedAt
      }))
    })

  } catch (error) {
    console.error('Error executing flow:', error)
    return NextResponse.json(
      { error: 'Failed to execute flow' },
      { status: 500 }
    )
  }
}

// GET - Buscar histórico de execuções manuais
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

    // Buscar execuções manuais recentes
    const executions = await prisma.flowExecution.findMany({
      where: {
        flowId,
        triggerType: 'MANUAL',
        flow: {
          userId: session.user.id
        }
      },
      include: {
        conversation: {
          select: {
            contactName: true,
            contactNumber: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 10
    })

    // Agrupar execuções por horário (mesmo momento de disparo)
    const groupedExecutions = executions.reduce((groups, execution) => {
      const timeKey = execution.startedAt.toISOString().slice(0, 16) // Agrupar por minuto

      if (!groups[timeKey]) {
        groups[timeKey] = {
          timestamp: execution.startedAt,
          count: 0,
          executions: []
        }
      }

      groups[timeKey].count++
      groups[timeKey].executions.push(execution)

      return groups
    }, {} as any)

    const history = Object.values(groupedExecutions).map((group: any) => ({
      timestamp: group.timestamp,
      contactCount: group.count,
      status: group.executions.every((e: any) => e.status === 'COMPLETED') ? 'completed' : 'pending',
      contacts: group.executions.map((e: any) => ({
        name: e.conversation.contactName,
        number: e.conversation.contactNumber
      }))
    }))

    return NextResponse.json({
      history,
      total: executions.length
    })

  } catch (error) {
    console.error('Error fetching execution history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    )
  }
}