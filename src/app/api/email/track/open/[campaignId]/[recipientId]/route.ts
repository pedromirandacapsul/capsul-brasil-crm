import { NextRequest, NextResponse } from 'next/server'
import { emailMarketingService } from '@/services/email-marketing-service'

interface Params {
  params: { campaignId: string; recipientId: string }
}

// GET /api/email/track/open/[campaignId]/[recipientId] - Tracking de abertura
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await emailMarketingService.trackEmailOpen(
      params.campaignId,
      params.recipientId,
      ipAddress,
      userAgent
    )

    // Retorna um pixel transparente 1x1
    const pixelBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixelBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error tracking email open:', error)

    // Mesmo com erro, retorna o pixel para não quebrar o email
    const pixelBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixelBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}