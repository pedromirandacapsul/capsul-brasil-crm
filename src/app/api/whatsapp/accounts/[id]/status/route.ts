import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params

    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        phoneNumber: true,
        displayName: true,
        lastHeartbeat: true,
        qrCode: true,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ...account,
    })
  } catch (error) {
    console.error('Error fetching account status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}