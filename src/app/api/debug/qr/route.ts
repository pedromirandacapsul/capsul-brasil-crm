import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        qrCode: true,
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        status: account.status,
        hasQrCode: !!account.qrCode,
        qrCodeLength: account.qrCode?.length || 0,
        qrCode: account.qrCode // Incluindo o QR code completo
      }
    })
  } catch (error) {
    console.error('Error in debug QR endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}