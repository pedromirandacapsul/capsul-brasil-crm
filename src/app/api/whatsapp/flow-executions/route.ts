import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { flowEngine } from '@/lib/whatsapp/flow-engine'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const accountId = searchParams.get('accountId')
    const flowId = searchParams.get('flowId')

    const whereConditions: any = {
      flow: {
        userId: session.user.id
      }
    }

    if (status) {
      whereConditions.status = status
    }

    if (accountId) {
      whereConditions.accountId = accountId
    }

    if (flowId) {
      whereConditions.flowId = flowId
    }

    const executions = await prisma.flowExecution.findMany({
      where: whereConditions,
      include: {
        flow: {
          select: {
            name: true,
            description: true
          }
        },
        conversation: {
          select: {
            contactName: true,
            contactNumber: true
          }
        },
        account: {
          select: {
            phoneNumber: true,
            displayName: true
          }
        },
        currentStep: {
          select: {
            stepOrder: true,
            stepType: true,
            content: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 50
    })

    // Get active executions from engine
    const activeExecutions = flowEngine.getActiveExecutions()

    return NextResponse.json({
      executions,
      activeCount: activeExecutions.length,
      totalCount: executions.length
    })

  } catch (error) {
    console.error('Error fetching flow executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow executions' },
      { status: 500 }
    )
  }
}