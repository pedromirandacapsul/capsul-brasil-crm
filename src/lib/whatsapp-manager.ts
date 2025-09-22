import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { whatsappNotifications } from '@/lib/whatsapp-notifications'

interface WhatsAppSession {
  accountId: string
  client: Client
  isReady: boolean
  qrCode?: string
}

class WhatsAppManager {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private pendingSessions: Map<string, Promise<any>> = new Map()
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
      console.log(`Starting createSession for account ${accountId}`)

      // Check if session creation is already in progress
      if (this.pendingSessions.has(accountId)) {
        console.log(`Session creation already in progress for account ${accountId}, waiting...`)
        return await this.pendingSessions.get(accountId)!
      }

      // Check if session already exists
      if (this.sessions.has(accountId)) {
        console.log(`Session already exists for account ${accountId}`)
        const session = this.sessions.get(accountId)!
        if (session.isReady) {
          console.log(`Session is ready for account ${accountId}`)
          return { success: true }
        }
        if (session.qrCode) {
          console.log(`QR code available for account ${accountId}`)
          return { success: true, qrCode: session.qrCode }
        }
      }

      // Create a promise for this session creation
      const sessionPromise = this._createSessionInternal(accountId, userId)
      this.pendingSessions.set(accountId, sessionPromise)

      try {
        const result = await sessionPromise
        return result
      } finally {
        this.pendingSessions.delete(accountId)
      }
    } catch (error) {
      console.error('Error creating WhatsApp session:', error)
      this.pendingSessions.delete(accountId)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async _createSessionInternal(accountId: string, userId: string): Promise<{ qrCode?: string; success: boolean; error?: string }> {
    try {

      // Create new WhatsApp client
      console.log(`Creating new WhatsApp client for account ${accountId}`)
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: accountId,
          dataPath: './whatsapp-sessions'
        }),
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-ipc-flooding-protection',
            '--user-data-dir=./chrome-user-data',
            '--data-path=./chrome-user-data'
          ]
        }
      })
      console.log(`WhatsApp client created for account ${accountId}`)

      const session: WhatsAppSession = {
        accountId,
        client,
        isReady: false
      }

      // Set up event listeners
      client.on('qr', async (qr) => {
        try {
          console.log(`🔥 QR Code generated for account ${accountId}`)
          console.log(`QR String: ${qr.substring(0, 100)}...`)

          // Generate QR code image com configurações robustas
          const qrCodeImage = await QRCode.toDataURL(qr, {
            width: 512, // Aumentado para melhor qualidade
            margin: 4,  // Margem maior
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M', // Nível de correção de erro
            type: 'image/png',
            quality: 0.92,
            scale: 8 // Escala maior para melhor qualidade
          })

          session.qrCode = qrCodeImage

          // Update database com retry
          let retryCount = 0
          while (retryCount < 3) {
            try {
              await prisma.whatsAppAccount.update({
                where: { id: accountId },
                data: {
                  qrCode: qrCodeImage,
                  status: 'CONNECTING',
                  lastHeartbeat: new Date()
                }
              })
              console.log(`✅ QR Code saved for account ${accountId}`)
              break
            } catch (dbError) {
              retryCount++
              console.log(`⚠️ DB retry ${retryCount}/3 for account ${accountId}`)
              if (retryCount === 3) throw dbError
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }

          // Log para debug
          console.log(`📱 QR Code Size: ${qrCodeImage.length} chars`)
          console.log(`🎯 Account ${accountId} ready for QR scan!`)

        } catch (error) {
          console.error('❌ Error generating QR code:', error)
        }
      })

      client.on('ready', async () => {
        console.log(`WhatsApp client ready for account ${accountId}`)
        session.isReady = true

        try {
          // Get client info
          const clientInfo = client.info

          // Update database
          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: 'CONNECTED',
              displayName: clientInfo.pushname || clientInfo.wid.user,
              qrCode: null,
              lastHeartbeat: new Date(),
              sessionData: JSON.stringify({
                wid: clientInfo.wid,
                pushname: clientInfo.pushname,
                connectedAt: new Date()
              })
            }
          })

          // Notify user
          await whatsappNotifications.notifyConnectionStatus(
            userId,
            accountId,
            clientInfo.wid.user,
            'CONNECTED'
          )

          console.log(`Account ${accountId} connected successfully`)

          // 🔥 BUSCAR CONVERSAS IMEDIATAMENTE APÓS CONEXÃO
          console.log(`🔄 WhatsApp conectado! Buscando conversas para account ${accountId}...`)
          try {
            // OBRIGATÓRIO: Buscar todas as conversas diretamente do client
            console.log(`📋 Chamando client.getChats()...`)
            const chats = await client.getChats()
            console.log(`=== DEBUG CONVERSAS ===`)
            console.log(`Total de conversas encontradas: ${chats.length}`)

            if (chats.length > 0) {
              console.log('Primeiras 3 conversas:', chats.slice(0, 3).map(chat => ({
                id: chat.id._serialized,
                name: chat.name || chat.pushname,
                lastMessage: chat.lastMessage?.body || 'Sem mensagens',
                isGroup: chat.isGroup
              })))
            } else {
              console.log('⚠️ Nenhuma conversa retornada pelo client.getChats()')
            }
            console.log(`======================`)

            // Aguardar um pouco e tentar sincronizar
            console.log(`⏳ Aguardando 2 segundos antes de sincronizar...`)
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Sincronizar conversas para o banco de dados
            console.log(`🔄 Iniciando sincronização para ${accountId}...`)
            const syncResult = await this.syncAllChats(accountId)
            if (syncResult.success) {
              console.log(`✅ Auto-sync completed: ${syncResult.totalSynced} conversations synced`)
            } else {
              console.log(`⚠️ Auto-sync failed: ${syncResult.error}`)
            }
          } catch (syncError) {
            console.error(`❌ Error calling client.getChats() for account ${accountId}:`, syncError)
            console.error(`Stack trace:`, syncError.stack)

            // Tentar sync mesmo com erro
            try {
              console.log(`🔄 Tentando sincronização mesmo com erro...`)
              const syncResult = await this.syncAllChats(accountId)
              if (syncResult.success) {
                console.log(`✅ Sync funcionou apesar do erro inicial: ${syncResult.totalSynced} conversations`)
              } else {
                console.log(`⚠️ Sync também falhou: ${syncResult.error}`)
              }
            } catch (fallbackError) {
              console.error(`❌ Fallback sync também falhou:`, fallbackError)
            }
          }

        } catch (error) {
          console.error('Error updating account on ready:', error)
        }
      })

      client.on('authenticated', () => {
        console.log(`WhatsApp client authenticated for account ${accountId}`)
      })

      client.on('auth_failure', async (msg) => {
        console.error(`Authentication failed for account ${accountId}:`, msg)

        try {
          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: 'ERROR',
              qrCode: null
            }
          })

          await whatsappNotifications.notifyConnectionStatus(
            userId,
            accountId,
            'WhatsApp',
            'ERROR'
          )
        } catch (error) {
          console.error('Error updating account on auth failure:', error)
        }

        this.sessions.delete(accountId)
      })

      client.on('disconnected', async (reason) => {
        console.log(`WhatsApp client disconnected for account ${accountId}:`, reason)

        try {
          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: 'DISCONNECTED',
              lastHeartbeat: null,
              qrCode: null
            }
          })

          await whatsappNotifications.notifyConnectionStatus(
            userId,
            accountId,
            'WhatsApp',
            'DISCONNECTED'
          )
        } catch (error) {
          console.error('Error updating account on disconnect:', error)
        }

        this.sessions.delete(accountId)
      })

      client.on('message', async (message) => {
        try {
          await this.handleIncomingMessage(accountId, message)

          // Atualizar lista de conversas quando chegar nova mensagem
          console.log(`📨 Nova mensagem recebida - atualizando conversas para account ${accountId}`)
        } catch (error) {
          console.error('Error handling incoming message:', error)
        }
      })

      // Listener para mensagens enviadas
      client.on('message_create', async (message) => {
        try {
          // Só processar se a mensagem foi enviada por nós
          if (message.fromMe) {
            console.log(`📤 Mensagem enviada - atualizando conversas para account ${accountId}`)
            await this.handleIncomingMessage(accountId, message)
          }
        } catch (error) {
          console.error('Error handling outgoing message:', error)
        }
      })

      // Store session
      this.sessions.set(accountId, session)
      console.log(`Session stored for account ${accountId}`)

      // Initialize client
      console.log(`Initializing WhatsApp client for account ${accountId}`)
      client.initialize()
      console.log(`Client.initialize() called for account ${accountId}`)

      return { success: true }
    } catch (error) {
      console.error('Error in _createSessionInternal:', error)
      // Clean up failed session
      this.sessions.delete(accountId)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getSession(accountId: string): Promise<WhatsAppSession | null> {
    return this.sessions.get(accountId) || null
  }

  async disconnectSession(accountId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(accountId)
      if (session) {
        await session.client.destroy()
        this.sessions.delete(accountId)

        // Update database
        await prisma.whatsAppAccount.update({
          where: { id: accountId },
          data: {
            status: 'DISCONNECTED',
            lastHeartbeat: null,
            qrCode: null,
            sessionData: null
          }
        })
      }
      return true
    } catch (error) {
      console.error('Error disconnecting session:', error)
      return false
    }
  }

  // Método para acessar todas as sessões (necessário para API /chats)
  getAllSessions() {
    return this.sessions
  }

  async sendMessage(accountId: string, toNumber: string, content: string, messageType: string = 'TEXT'): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`[WhatsApp Manager] Attempting to send message for account ${accountId}`)
      console.log(`[WhatsApp Manager] Sessions available: ${Array.from(this.sessions.keys()).join(', ')}`)

      let session = this.sessions.get(accountId)
      console.log(`[WhatsApp Manager] Session found: ${!!session}, Ready: ${session?.isReady}`)

      if (!session || !session.isReady) {
        console.log(`[WhatsApp Manager] Session not ready - Session exists: ${!!session}, Ready: ${session?.isReady}`)

        // Try to get account info and recreate session if needed
        const account = await prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
          include: { user: true }
        })

        if (account && account.status === 'CONNECTED') {
          console.log(`[WhatsApp Manager] Account is marked as CONNECTED in DB, attempting to recreate session`)

          // First force disconnect and clean up any existing session
          if (session) {
            console.log(`[WhatsApp Manager] Cleaning up existing session`)
            try {
              await session.client.destroy()
            } catch (e) {
              console.log(`[WhatsApp Manager] Error destroying client: ${e.message}`)
            }
            this.sessions.delete(accountId)
          }

          // Try to recreate session
          const recreateResult = await this.createSession(accountId, account.userId)
          if (recreateResult.success) {
            session = this.sessions.get(accountId)
            console.log(`[WhatsApp Manager] Session recreated: ${!!session}, Ready: ${session?.isReady}`)

            // Wait a bit for the session to become ready
            if (session && !session.isReady) {
              console.log(`[WhatsApp Manager] Waiting for session to become ready...`)
              let waitCount = 0
              while (!session.isReady && waitCount < 10) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                waitCount++
                console.log(`[WhatsApp Manager] Wait attempt ${waitCount}, Ready: ${session.isReady}`)
              }
            }
          } else {
            console.log(`[WhatsApp Manager] Failed to recreate session: ${recreateResult.error}`)
            return { success: false, error: 'Failed to recreate WhatsApp session' }
          }
        }

        if (!session || !session.isReady) {
          console.log(`[WhatsApp Manager] Session still not ready after recreation attempt`)
          return { success: false, error: 'WhatsApp session not ready' }
        }
      }

      // Format number for WhatsApp
      // If it already has @g.us or @c.us, use as is. Otherwise, add @c.us for individual chats
      let formattedNumber = toNumber
      if (!toNumber.includes('@')) {
        formattedNumber = toNumber.replace(/\D/g, '') + '@c.us'
      }

      let sentMessage
      if (messageType === 'TEXT') {
        sentMessage = await session.client.sendMessage(formattedNumber, content)
      } else {
        // For media messages, you would handle different types here
        return { success: false, error: 'Media messages not implemented yet' }
      }

      return {
        success: true,
        messageId: sentMessage.id._serialized
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    }
  }

  private async handleIncomingMessage(accountId: string, message: any) {
    try {
      // Get account info
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId },
        include: { user: true }
      })

      if (!account) return

      // Extract message info
      const fromNumber = message.from
      const toNumber = message.to
      const content = message.body
      const messageType = message.type.toUpperCase()
      const timestamp = new Date(message.timestamp * 1000)

      // Skip if it's an outgoing message or status broadcast
      if (message.fromMe || fromNumber === 'status' || fromNumber.includes('status') || message.from.includes('status@broadcast')) return

      // Find or create conversation
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: {
          accountId,
          contactNumber: fromNumber
        }
      })

      if (!conversation) {
        // Determine if it's a group or individual chat
        const isGroup = fromNumber.includes('@g.us')

        // Try to get contact/group name and profile picture
        let contactName = fromNumber
        let profilePicture = null

        try {
          if (isGroup) {
            // For groups, get chat information
            const chat = await message.getChat()
            contactName = chat.name || fromNumber
            try {
              profilePicture = await chat.getProfilePicUrl()
            } catch (picError) {
              console.log(`Could not get group picture for ${fromNumber}`)
            }
          } else {
            // For individual contacts
            const contact = await message.getContact()
            contactName = contact.name || contact.pushname || fromNumber.split('@')[0]
            try {
              profilePicture = await contact.getProfilePicUrl()
            } catch (picError) {
              console.log(`Could not get profile picture for new contact ${fromNumber}`)
            }
          }
        } catch (e) {
          console.log(`Could not get contact/group info for ${fromNumber}:`, e.message)
          contactName = isGroup ? fromNumber : fromNumber.split('@')[0]
        }

        try {
          conversation = await prisma.whatsAppConversation.create({
            data: {
              accountId,
              contactNumber: fromNumber,
              contactName,
              profilePicture,
              status: 'ACTIVE',
              lastMessageAt: timestamp,
              unreadCount: 1,
              isGroup
            }
          })
        } catch (dbError: any) {
          // Handle unique constraint violation
          if (dbError.code === 'P2002') {
            console.log(`Conversation already exists for ${fromNumber}, fetching existing...`)
            conversation = await prisma.whatsAppConversation.findFirst({
              where: {
                accountId,
                contactNumber: fromNumber
              }
            })
            if (conversation) {
              await prisma.whatsAppConversation.update({
                where: { id: conversation.id },
                data: {
                  lastMessageAt: timestamp,
                  unreadCount: { increment: 1 }
                }
              })
            }
          } else {
            throw dbError
          }
        }
      } else {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: timestamp,
            unreadCount: { increment: 1 }
          }
        })
      }

      // Create message record
      await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          whatsappId: message.id._serialized,
          direction: 'INBOUND',
          messageType,
          content,
          status: 'RECEIVED',
          fromNumber,
          toNumber,
          timestamp
        }
      })

      // Notify user
      if (account.user) {
        await whatsappNotifications.notifyNewMessage(
          account.user.id,
          accountId,
          conversation.id,
          content,
          fromNumber
        )
      }

      console.log(`Processed incoming message from ${fromNumber} to account ${accountId}`)
    } catch (error) {
      console.error('Error handling incoming message:', error)
    }
  }

  // Method to restore sessions on server restart
  async restoreSessions() {
    try {
      const connectedAccounts = await prisma.whatsAppAccount.findMany({
        where: {
          status: 'CONNECTED'
        },
        include: { user: true }
      })

      for (const account of connectedAccounts) {
        console.log(`Restoring session for account ${account.id}`)
        await this.createSession(account.id, account.userId)
      }
    } catch (error) {
      console.error('Error restoring sessions:', error)
    }
  }

  // Method to sync all chats from WhatsApp Web
  async syncAllChats(accountId: string): Promise<{ success: boolean; totalSynced: number; error?: string }> {
    try {
      console.log(`🔄 Starting syncAllChats for account ${accountId}`)

      let session = this.sessions.get(accountId)
      console.log(`📋 Session exists: ${!!session}, isReady: ${session?.isReady}`)

      // If session doesn't exist or isn't ready, DON'T recreate - just return error
      if (!session || !session.isReady) {
        console.log(`❌ Session not ready for account ${accountId} - sync aborted`)
        return {
          success: false,
          totalSynced: 0,
          error: 'WhatsApp session not ready. Please reconnect your account.'
        }
      }

      console.log(`Starting to sync all chats for account ${accountId}`)

      // Get all chats from WhatsApp Web
      const chats = await session.client.getChats()
      console.log(`Found ${chats.length} chats to sync for account ${accountId}`)

      let syncedCount = 0
      for (const chat of chats) {
        try {
          // Skip status broadcasts
          if (chat.id._serialized.includes('status@broadcast')) continue

          // Determine if it's a group or individual chat
          const isGroup = chat.isGroup
          const contactNumber = chat.id._serialized
          let contactName = chat.name

          // Get profile picture and contact info
          let profilePicture = null
          if (!isGroup && (!contactName || contactName === contactNumber)) {
            try {
              const contact = await chat.getContact()
              contactName = contact.name || contact.pushname || contact.number || contactNumber.split('@')[0]

              // Try to get profile picture
              try {
                profilePicture = await contact.getProfilePicUrl()
              } catch (picError) {
                console.log(`Could not get profile picture for ${contactNumber}`)
              }
            } catch (e) {
              console.log(`Could not get contact info for ${contactNumber}`)
              contactName = contactNumber.split('@')[0]
            }
          } else if (isGroup) {
            // For groups, try to get group profile picture
            try {
              profilePicture = await chat.getProfilePicUrl()
            } catch (picError) {
              console.log(`Could not get group picture for ${contactNumber}`)
            }
          }

          // Check if conversation already exists
          let conversation = await prisma.whatsAppConversation.findFirst({
            where: {
              accountId,
              contactNumber
            }
          })

          if (!conversation) {
            // Get the last message timestamp
            const messages = await chat.fetchMessages({ limit: 1 })
            const lastMessageAt = messages.length > 0 ? new Date(messages[0].timestamp * 1000) : new Date()

            // Create new conversation with duplicate protection
            try {
              conversation = await prisma.whatsAppConversation.create({
                data: {
                  accountId,
                  contactNumber,
                  contactName,
                  profilePicture,
                  status: 'ACTIVE',
                  lastMessageAt,
                  unreadCount: chat.unreadCount || 0,
                  isGroup
                }
              })

              syncedCount++
              console.log(`Synced ${isGroup ? 'group' : 'contact'}: ${contactName}`)
            } catch (dbError: any) {
              // Handle unique constraint violation
              if (dbError.code === 'P2002') {
                console.log(`Conversation already exists for ${contactNumber}, updating existing...`)
                conversation = await prisma.whatsAppConversation.findFirst({
                  where: {
                    accountId,
                    contactNumber
                  }
                })
                if (conversation) {
                  await prisma.whatsAppConversation.update({
                    where: { id: conversation.id },
                    data: {
                      contactName,
                      profilePicture,
                      unreadCount: chat.unreadCount || 0,
                      isGroup
                    }
                  })
                }
              } else {
                throw dbError
              }
            }
          } else {
            // Update existing conversation
            await prisma.whatsAppConversation.update({
              where: { id: conversation.id },
              data: {
                contactName,
                profilePicture,
                unreadCount: chat.unreadCount || 0
                // isGroup (temporarily disabled until Prisma regeneration)
              }
            })
          }

          // Optional: sync recent messages for this chat
          // await this.syncChatMessages(accountId, conversation.id, chat, 50) // last 50 messages

        } catch (error) {
          console.error(`Error syncing chat ${chat.id._serialized}:`, error)
        }
      }

      console.log(`Completed sync for account ${accountId}. Synced ${syncedCount} new conversations.`)
      return { success: true, totalSynced: syncedCount }

    } catch (error) {
      console.error('Error syncing all chats:', error)
      return {
        success: false,
        totalSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Method to sync messages for a specific chat
  async syncChatMessages(accountId: string, conversationId: string, chat: any, limit: number = 50): Promise<number> {
    try {
      const messages = await chat.fetchMessages({ limit })
      let syncedCount = 0

      for (const message of messages.reverse()) { // Process from oldest to newest
        try {
          // Check if message already exists
          const existingMessage = await prisma.whatsAppMessage.findFirst({
            where: {
              accountId,
              whatsappId: message.id._serialized
            }
          })

          if (!existingMessage) {
            const fromNumber = message.from.replace(/@.*$/, '')
            const toNumber = message.to.replace(/@.*$/, '')
            const content = message.body || (message.type !== 'chat' ? `[${message.type}]` : '')
            const messageType = message.type.toUpperCase()
            const timestamp = new Date(message.timestamp * 1000)
            const direction = message.fromMe ? 'OUTBOUND' : 'INBOUND'

            await prisma.whatsAppMessage.create({
              data: {
                accountId,
                conversationId,
                whatsappId: message.id._serialized,
                direction,
                messageType,
                content,
                status: 'RECEIVED',
                fromNumber,
                toNumber,
                timestamp
              }
            })

            syncedCount++
          }
        } catch (error) {
          console.error(`Error syncing message ${message.id._serialized}:`, error)
        }
      }

      return syncedCount
    } catch (error) {
      console.error('Error syncing chat messages:', error)
      return 0
    }
  }
}

export const whatsappManager = WhatsAppManager.getInstance()

// Auto-restore sessions on startup
if (typeof window === 'undefined') { // Server-side only
  process.nextTick(() => {
    whatsappManager.restoreSessions()
  })
}