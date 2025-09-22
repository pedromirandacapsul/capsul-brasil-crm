import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'
import { z } from 'zod'

// Schema for validation
const connectSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  type: z.enum(['web', 'api']),
  businessApiToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Connect request body:', body)

    const validation = connectSchema.safeParse(body)

    if (!validation.success) {
      console.log('Validation failed:', validation.error.issues)
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { phoneNumber, type, businessApiToken } = validation.data
    console.log('Attempting to connect:', { phoneNumber, type, userId: session.user.id })

    // Check if phone number is already connected
    const existingAccount = await prisma.whatsAppAccount.findUnique({
      where: {
        phoneNumber: phoneNumber,
      },
    })

    if (existingAccount) {
      console.log('Existing account found:', existingAccount)
      return NextResponse.json(
        { error: 'Este número já está conectado' },
        { status: 400 }
      )
    }

    // Validate business API token if provided
    if (type === 'api' && !businessApiToken) {
      return NextResponse.json(
        { error: 'Business API token is required for API connections' },
        { status: 400 }
      )
    }

    // Create new WhatsApp account
    const account = await prisma.whatsAppAccount.create({
      data: {
        userId: session.user.id,
        phoneNumber,
        status: 'CONNECTING',
        isBusinessApi: type === 'api',
        businessApiToken: type === 'api' ? businessApiToken : undefined,
        lastHeartbeat: new Date(),
      },
    })

    const response: any = {
      success: true,
      accountId: account.id,
      status: account.status,
    }

    if (type === 'web') {
      // Create ZapMeow connection
      console.log('Creating ZapMeow connection for account:', account.id)
      const connectionResult = await zapMeowService.createConnection(account.id, phoneNumber)
      console.log('ZapMeow connection result:', connectionResult)

      if (!connectionResult.success) {
        // Delete the account if connection creation failed
        console.log('ZapMeow connection failed, deleting account')
        await prisma.whatsAppAccount.delete({
          where: { id: account.id }
        })

        return NextResponse.json(
          { error: connectionResult.error || 'Failed to create ZapMeow connection' },
          { status: 500 }
        )
      }

      // Return QR code if available
      if (connectionResult.qrCode) {
        response.qrCode = connectionResult.qrCode
      }
    } else {
      // For Business API, validate token and mark as connected
      // In production, you would validate the token with WhatsApp Business API
      await prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: {
          status: 'CONNECTED',
          displayName: `WhatsApp Business - ${phoneNumber}`,
        },
      })
      response.status = 'CONNECTED'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error connecting WhatsApp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}