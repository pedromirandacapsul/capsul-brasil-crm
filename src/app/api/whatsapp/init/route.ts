import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'
import { z } from 'zod'

// Schema for validation
const initSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required')
})

/**
 * POST /api/whatsapp/init
 * Endpoint simplificado para inicializar WhatsApp e gerar QR Code
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🚀 WhatsApp Init request:', body)

    const validation = initSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid phone number', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { phoneNumber } = validation.data
    console.log(`📱 Initializing WhatsApp for ${phoneNumber}`)

    // 1. Check if phone number is already connected
    const existingAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        phoneNumber: phoneNumber,
        status: { in: ['CONNECTED', 'CONNECTING'] }
      }
    })

    if (existingAccount) {
      console.log(`⚠️ Phone ${phoneNumber} already has an active connection`)

      // If it's connecting, check if QR is available
      if (existingAccount.status === 'CONNECTING' && existingAccount.qrCode) {
        return NextResponse.json({
          success: true,
          accountId: existingAccount.id,
          status: 'CONNECTING',
          qrCode: existingAccount.qrCode,
          message: 'QR Code já disponível'
        })
      }

      return NextResponse.json(
        { error: 'Este número já está conectado ou em processo de conexão' },
        { status: 400 }
      )
    }

    // 2. Clean any disconnected accounts with same number
    await prisma.whatsAppAccount.deleteMany({
      where: {
        phoneNumber: phoneNumber,
        status: 'DISCONNECTED'
      }
    })

    // 3. Create new WhatsApp account
    const account = await prisma.whatsAppAccount.create({
      data: {
        userId: session.user.id,
        phoneNumber,
        status: 'CONNECTING',
        isBusinessApi: false,
        lastHeartbeat: new Date()
      }
    })

    console.log(`✅ Account created: ${account.id}`)

    // 4. Create WhatsApp connection via ZapMeow
    console.log(`🔄 Creating ZapMeow connection...`)
    const connectionResult = await zapMeowService.createConnection(account.id, phoneNumber)

    if (!connectionResult.success) {
      console.log(`❌ ZapMeow connection failed: ${connectionResult.error}`)

      // Delete the account if connection creation failed
      await prisma.whatsAppAccount.delete({
        where: { id: account.id }
      })

      return NextResponse.json(
        { error: connectionResult.error || 'Failed to create ZapMeow connection' },
        { status: 500 }
      )
    }

    console.log(`🎯 ZapMeow connection created successfully`)

    // 5. Return QR code immediately if available
    return NextResponse.json({
      success: true,
      accountId: account.id,
      status: 'CONNECTING',
      qrCode: connectionResult.qrCode,
      message: connectionResult.qrCode ? 'QR Code gerado! Escaneie para conectar.' : 'Conectando via ZapMeow...',
      phoneNumber: phoneNumber
    })

  } catch (error) {
    console.error('❌ Error in WhatsApp init:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/whatsapp/init
 * Get current initialization status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.whatsAppAccount.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        qrCode: true,
        lastHeartbeat: true,
        displayName: true
      },
      orderBy: { id: 'desc' }
    })

    return NextResponse.json({
      success: true,
      accounts: accounts.map(acc => ({
        ...acc,
        hasQrCode: !!acc.qrCode,
        qrCodeSize: acc.qrCode?.length || 0
      }))
    })

  } catch (error) {
    console.error('Error getting init status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}