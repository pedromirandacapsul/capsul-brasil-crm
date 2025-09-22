import { Client, LocalAuth } from 'whatsapp-web.js'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

interface WhatsAppSession {
  accountId: string
  client: Client
  isReady: boolean
  qrCode?: string
}

class WhatsAppManager {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private static instance: WhatsAppManager

  private constructor() {}

  static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager()
    }
    return WhatsAppManager.instance
  }

  async createSession(accountId: string, userId: string): Promise<{ qrCode?: string; success: boolean; error?: string }> {
    try {
      console.log(`🔥 Creating REAL WhatsApp session for account ${accountId}`)

      // Check if session already exists
      if (this.sessions.has(accountId)) {
        const session = this.sessions.get(accountId)!
        if (session.isReady) {
          console.log(`✅ Session already ready for account ${accountId}`)
          return { success: true }
        }
        if (session.qrCode) {
          console.log(`📱 QR code available for account ${accountId}`)
          return { success: true, qrCode: session.qrCode }
        }
      }

      // Create new WhatsApp client
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: accountId,
          dataPath: './whatsapp-sessions'
        }),
        puppeteer: {
          headless: false,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      })

      const session: WhatsAppSession = {
        accountId,
        client,
        isReady: false
      }

      // QR Code handler
      client.on('qr', async (qr) => {
        try {
          console.log(`📱 QR Code generated for account ${accountId}`)
          const qrCodeImage = await QRCode.toDataURL(qr)
          session.qrCode = qrCodeImage

          // Save QR to database
          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: { qrCode: qrCodeImage }
          })

          console.log(`✅ QR Code saved for account ${accountId}`)
        } catch (error) {
          console.error('❌ Error generating QR code:', error)
        }
      })

      // Ready handler
      client.on('ready', async () => {
        console.log(`✅ REAL WhatsApp client ready for account ${accountId}`)
        session.isReady = true

        try {
          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: 'CONNECTED',
              qrCode: null,
              lastHeartbeat: new Date()
            }
          })
          console.log(`✅ Account ${accountId} connected successfully`)

          // Fetch and sync conversations ONCE
          const chats = await client.getChats()
          console.log(`📱 Found ${chats.length} conversations for account ${accountId}`)

          // Save conversations to database (no auto-responses)
          for (const chat of chats.slice(0, 20)) { // Limit to prevent overload
            const contactNumber = chat.id._serialized
            const contactName = chat.name || chat.pushname || contactNumber.split('@')[0]

            await prisma.whatsAppConversation.upsert({
              where: {
                accountId_contactNumber: {
                  accountId,
                  contactNumber
                }
              },
              update: {
                contactName,
                lastMessageAt: new Date()
              },
              create: {
                accountId,
                contactNumber,
                contactName,
                isGroup: chat.isGroup,
                status: 'ACTIVE',
                lastMessageAt: new Date(),
                unreadCount: 0
              }
            })
          }

          console.log(`✅ Conversations synced for account ${accountId}`)
        } catch (error) {
          console.error('Error updating account on ready:', error)
        }
      })

      // Authentication handlers
      client.on('authenticated', () => {
        console.log(`🔑 WhatsApp authenticated for account ${accountId}`)
      })

      client.on('auth_failure', async (msg) => {
        console.error(`❌ Authentication failed for account ${accountId}:`, msg)

        await prisma.whatsAppAccount.update({
          where: { id: accountId },
          data: { status: 'ERROR', qrCode: null }
        })

        this.sessions.delete(accountId)
      })

      client.on('disconnected', async (reason) => {
        console.log(`❌ WhatsApp disconnected for account ${accountId}:`, reason)

        await prisma.whatsAppAccount.update({
          where: { id: accountId },
          data: {
            status: 'DISCONNECTED',
            lastHeartbeat: null,
            qrCode: null
          }
        })

        this.sessions.delete(accountId)
      })

      // Message handlers - ONLY save to database, NO auto-responses
      client.on('message', async (message) => {
        try {
          // Skip status messages and our own messages
          if (message.fromMe || message.from.includes('status@broadcast')) return

          await this.saveMessageToDatabase(accountId, message, 'INBOUND')
          console.log(`📨 Saved incoming message from ${message.from}`)
        } catch (error) {
          console.error('Error saving incoming message:', error)
        }
      })

      client.on('message_create', async (message) => {
        try {
          // Only process outgoing messages
          if (message.fromMe && !message.from.includes('status@broadcast')) {
            await this.saveMessageToDatabase(accountId, message, 'OUTBOUND')
            console.log(`📤 Saved outgoing message to ${message.to}`)
          }
        } catch (error) {
          console.error('Error saving outgoing message:', error)
        }
      })

      // Store session and initialize
      this.sessions.set(accountId, session)
      client.initialize()

      console.log(`🚀 REAL WhatsApp client initialized for account ${accountId}`)
      return { success: true }

    } catch (error) {
      console.error('Error creating WhatsApp session:', error)
      this.sessions.delete(accountId)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async saveMessageToDatabase(accountId: string, message: any, direction: 'INBOUND' | 'OUTBOUND') {
    try {
      const fromNumber = message.from
      const toNumber = message.to
      const content = message.body
      const timestamp = new Date(message.timestamp * 1000)

      // Find or create conversation
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: { accountId, contactNumber: fromNumber }
      })

      if (!conversation) {
        conversation = await prisma.whatsAppConversation.create({
          data: {
            accountId,
            contactNumber: fromNumber,
            contactName: fromNumber.split('@')[0],
            isGroup: message.from.includes('@g.us'),
            status: 'ACTIVE',
            lastMessageAt: timestamp,
            unreadCount: direction === 'INBOUND' ? 1 : 0
          }
        })
      } else {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: timestamp,
            unreadCount: direction === 'INBOUND' ? { increment: 1 } : undefined
          }
        })
      }

      // Save message
      await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          whatsappId: message.id._serialized,
          direction,
          messageType: 'TEXT',
          content,
          status: direction === 'INBOUND' ? 'RECEIVED' : 'SENT',
          fromNumber,
          toNumber,
          timestamp
        }
      })

    } catch (error) {
      console.error('Error saving message to database:', error)
    }
  }

  async getSession(accountId: string): Promise<WhatsAppSession | null> {
    return this.sessions.get(accountId) || null
  }

  async disconnectSession(accountId: string): Promise<void> {
    try {
      const session = this.sessions.get(accountId)
      if (session && session.client) {
        await session.client.destroy()
      }
      this.sessions.delete(accountId)

      await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { status: 'DISCONNECTED', qrCode: null }
      })

      console.log(`✅ Session disconnected for account ${accountId}`)
    } catch (error) {
      console.error('Error disconnecting session:', error)
    }
  }
}

// Export singleton
export const whatsappManager = WhatsAppManager.getInstance()