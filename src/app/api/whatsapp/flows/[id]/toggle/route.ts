import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
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
    const { isActive } = body

    // Update flow status
    const flow = await prisma.messageFlow.update({
      where: {
        id: flowId,
        userId: session.user.id
      },
      data: {
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      flow,
      message: `Flow ${isActive ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('Error toggling flow:', error)
    return NextResponse.json(
      { error: 'Failed to toggle flow status' },
      { status: 500 }
    )
  }
}