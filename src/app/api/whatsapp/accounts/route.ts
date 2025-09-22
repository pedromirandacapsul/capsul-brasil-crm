import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.whatsAppAccount.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      accounts,
    })
  } catch (error) {
    console.error('Error fetching WhatsApp accounts:', error)
    console.log('Session:', session)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}