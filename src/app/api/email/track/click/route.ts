import { NextRequest, NextResponse } from 'next/server'
import { emailMarketingService } from '@/services/email-marketing-service'

// GET /api/email/track/click - Tracking de cliques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('c')
    const recipientId = searchParams.get('r')
    const url = searchParams.get('url')
    const linkText = searchParams.get('text')

    if (!campaignId || !recipientId || !url) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: c, r, url' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await emailMarketingService.trackEmailClick(
      campaignId,
      recipientId,
      decodeURIComponent(url),
      linkText ? decodeURIComponent(linkText) : undefined,
      ipAddress,
      userAgent
    )

    // Redireciona para a URL original
    return NextResponse.redirect(decodeURIComponent(url))

  } catch (error) {
    console.error('Error tracking email click:', error)

    // Em caso de erro, ainda redireciona para a URL
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (url) {
      return NextResponse.redirect(decodeURIComponent(url))
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}