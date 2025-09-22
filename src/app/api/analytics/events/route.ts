import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyticsEventSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // Only store analytics events in development mode
    if (process.env.NODE_ENV !== 'development' && process.env.ANALYTICS_MOCK !== '1') {
      return NextResponse.json({ success: true, message: 'Analytics disabled in production' })
    }

    const body = await request.json()
    const validatedData = analyticsEventSchema.parse(body)

    // Get IP address for session tracking
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await prisma.analyticsEvent.create({
      data: {
        event: validatedData.event,
        properties: validatedData.properties ? JSON.stringify(validatedData.properties) : null,
        userId: validatedData.userId,
        sessionId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded',
    })
  } catch (error) {
    console.error('Error recording analytics event:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Analytics data not available in production' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const event = searchParams.get('event')

    const where = event ? { event } : {}

    const events = await prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error('Error fetching analytics events:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}