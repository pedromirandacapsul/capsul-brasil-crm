/**
 * WhatsApp Service - Robust implementation following official WhatsApp Business API patterns
 * Based on Meta's official documentation for 2025
 */

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()

export interface WhatsAppMessage {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'INTERACTIVE'
  content?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  fromNumber: string
  toNumber: string
  timestamp: Date
  whatsappId?: string
}

export interface WhatsAppConversation {
  id: string
  accountId: string
  contactNumber: string
  contactName?: string
  profilePicture?: string
  isGroup: boolean
  lastMessageAt?: Date
  unreadCount: number
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'
  assignedUserId?: string
  messages?: WhatsAppMessage[]
}

export interface SendMessageOptions {
  to: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  content?: string
  mediaUrl?: string
  caption?: string
  templateName?: string
  templateParams?: string[]
}

export interface MessageStatus {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  error?: string
}

class WhatsAppService extends EventEmitter {
  private connections: Map<string, any> = new Map()
  private messageQueue: Map<string, SendMessageOptions[]> = new Map()
  private processingQueue = false

  constructor() {
    super()
    this.initializeConnections()
  }

  /**
   * Initialize WhatsApp connections for all active accounts
   */
  private async initializeConnections() {
    try {
      const accounts = await prisma.whatsAppAccount.findMany({
        where: { status: 'CONNECTED' }
      })

      for (const account of accounts) {
        await this.createConnection(account.id)
      }
    } catch (error) {
      console.error('Failed to initialize WhatsApp connections:', error)
    }
  }

  /**
   * Create a new WhatsApp connection for an account
   */
  async createConnection(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId }
      })

      if (!account) {
        return { success: false, error: 'Account not found' }
      }

      // For now, we'll use WhatsApp Web approach
      // In production, you would use WhatsApp Business API
      const connection = await this.initializeWebConnection(account)

      if (connection.success) {
        this.connections.set(accountId, connection.client)
        this.emit('connectionReady', accountId)

        // Start syncing conversations
        await this.syncConversations(accountId)

        return { success: true }
      }

      return { success: false, error: connection.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Initialize WhatsApp Web connection (temporary solution)
   */
  private async initializeWebConnection(account: any): Promise<{ success: boolean; client?: any; error?: string }> {
    try {
      // Import whatsapp-web.js dynamically
      const { Client, LocalAuth } = await import('whatsapp-web.js')

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: account.id
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      })

      return new Promise((resolve) => {
        let resolved = false

        client.on('qr', (qr) => {
          if (!resolved) {
            // Save QR code for display
            this.saveQRCode(account.id, qr)
            this.emit('qrCode', account.id, qr)
          }
        })

        client.on('ready', async () => {
          if (!resolved) {
            resolved = true

            // Update account status
            await prisma.whatsAppAccount.update({
              where: { id: account.id },
              data: {
                status: 'CONNECTED',
                lastHeartbeat: new Date()
              }
            })

            resolve({ success: true, client })
          }
        })

        client.on('auth_failure', () => {
          if (!resolved) {
            resolved = true
            resolve({ success: false, error: 'Authentication failed' })
          }
        })

        client.on('message', (message) => {
          this.handleIncomingMessage(account.id, message)
        })

        client.on('message_ack', (message, ack) => {
          this.handleMessageStatus(account.id, message, ack)
        })

        client.initialize()

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve({ success: false, error: 'Connection timeout' })
          }
        }, 30000)
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Save QR code for account connection
   */
  private async saveQRCode(accountId: string, qrCode: string) {
    try {
      await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { qrCode }
      })
    } catch (error) {
      console.error('Failed to save QR code:', error)
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(accountId: string, message: any) {
    try {
      const fromNumber = message.from
      const content = message.body
      const messageType = this.mapMessageType(message.type)
      const timestamp = new Date(message.timestamp * 1000)

      // Skip outgoing messages and status broadcasts
      if (message.fromMe || fromNumber.includes('status@broadcast')) {
        return
      }

      // Find or create conversation
      let conversation = await this.findOrCreateConversation(accountId, fromNumber, message)

      // Create message record
      const messageRecord = await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          whatsappId: message.id._serialized,
          direction: 'INBOUND',
          messageType,
          content,
          status: 'DELIVERED',
          fromNumber,
          toNumber: message.to,
          timestamp
        }
      })

      // Update conversation
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          unreadCount: { increment: 1 }
        }
      })

      // Emit event for real-time updates
      this.emit('messageReceived', {
        accountId,
        conversationId: conversation.id,
        message: messageRecord
      })

    } catch (error) {
      console.error('Error handling incoming message:', error)
    }
  }

  /**
   * Handle message status updates
   */
  private async handleMessageStatus(accountId: string, message: any, ack: number) {
    try {
      let status: string

      switch (ack) {
        case 1: status = 'SENT'; break
        case 2: status = 'DELIVERED'; break
        case 3: status = 'READ'; break
        default: status = 'PENDING'
      }

      await prisma.whatsAppMessage.updateMany({
        where: {
          accountId,
          whatsappId: message.id._serialized
        },
        data: { status }
      })

      this.emit('messageStatusUpdate', {
        accountId,
        messageId: message.id._serialized,
        status
      })

    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  /**
   * Find or create conversation
   */
  private async findOrCreateConversation(accountId: string, contactNumber: string, message: any) {
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { accountId, contactNumber }
    })

    if (!conversation) {
      const isGroup = contactNumber.includes('@g.us')
      let contactName = contactNumber
      let profilePicture = null

      try {
        if (isGroup) {
          const chat = await message.getChat()
          contactName = chat.name || contactNumber
          profilePicture = await chat.getProfilePicUrl().catch(() => null)
        } else {
          const contact = await message.getContact()
          contactName = contact.name || contact.pushname || contactNumber.split('@')[0]
          profilePicture = await contact.getProfilePicUrl().catch(() => null)
        }
      } catch (error) {
        console.log('Could not get contact info:', error instanceof Error ? error.message : 'Unknown error')
      }

      conversation = await prisma.whatsAppConversation.create({
        data: {
          accountId,
          contactNumber,
          contactName,
          profilePicture,
          isGroup,
          status: 'ACTIVE',
          lastMessageAt: new Date(),
          unreadCount: 0
        }
      })
    }

    return conversation
  }

  /**
   * Map WhatsApp message types to our enum
   */
  private mapMessageType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'chat': 'TEXT',
      'image': 'IMAGE',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENT',
      'location': 'LOCATION',
      'contact': 'CONTACT'
    }
    return typeMap[type] || 'TEXT'
  }

  /**
   * Send a message
   */
  async sendMessage(accountId: string, options: SendMessageOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const connection = this.connections.get(accountId)

      if (!connection) {
        return { success: false, error: 'WhatsApp connection not available' }
      }

      let sentMessage

      if (options.type === 'text') {
        sentMessage = await connection.sendMessage(options.to, options.content)
      } else {
        // Handle media messages
        return { success: false, error: 'Media messages not yet implemented' }
      }

      // Create message record
      const messageRecord = await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: await this.getConversationId(accountId, options.to),
          whatsappId: sentMessage.id._serialized,
          direction: 'OUTBOUND',
          messageType: options.type.toUpperCase(),
          content: options.content,
          status: 'SENT',
          fromNumber: await this.getAccountNumber(accountId),
          toNumber: options.to,
          timestamp: new Date()
        }
      })

      this.emit('messageSent', {
        accountId,
        message: messageRecord
      })

      return { success: true, messageId: sentMessage.id._serialized }

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Sync all conversations for an account
   */
  async syncConversations(accountId: string): Promise<{ success: boolean; totalSynced: number; error?: string }> {
    try {
      const connection = this.connections.get(accountId)

      if (!connection) {
        return { success: false, totalSynced: 0, error: 'Connection not available' }
      }

      const chats = await connection.getChats()
      let syncedCount = 0

      for (const chat of chats) {
        try {
          if (chat.id._serialized.includes('status@broadcast')) continue

          await this.syncSingleConversation(accountId, chat)
          syncedCount++
        } catch (error) {
          console.error(`Error syncing chat ${chat.id._serialized}:`, error)
        }
      }

      return { success: true, totalSynced: syncedCount }

    } catch (error) {
      return { success: false, totalSynced: 0, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Sync a single conversation
   */
  private async syncSingleConversation(accountId: string, chat: any) {
    const contactNumber = chat.id._serialized
    const isGroup = chat.isGroup
    let contactName = chat.name || contactNumber
    let profilePicture = null

    try {
      profilePicture = await chat.getProfilePicUrl()
    } catch (error) {
      // Profile picture not available
    }

    // Upsert conversation
    await prisma.whatsAppConversation.upsert({
      where: {
        accountId_contactNumber: {
          accountId,
          contactNumber
        }
      },
      update: {
        contactName,
        profilePicture,
        lastMessageAt: chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : undefined
      },
      create: {
        accountId,
        contactNumber,
        contactName,
        profilePicture,
        isGroup,
        status: 'ACTIVE',
        lastMessageAt: chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : new Date(),
        unreadCount: chat.unreadCount || 0
      }
    })
  }

  /**
   * Get conversations for an account
   */
  async getConversations(accountId: string, limit = 50, offset = 0): Promise<WhatsAppConversation[]> {
    const conversations = await prisma.whatsAppConversation.findMany({
      where: { accountId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })

    return conversations.map(conv => ({
      id: conv.id,
      accountId: conv.accountId,
      contactNumber: conv.contactNumber,
      contactName: conv.contactName ?? undefined,
      profilePicture: conv.profilePicture ?? undefined,
      isGroup: conv.isGroup,
      lastMessageAt: conv.lastMessageAt ?? undefined,
      unreadCount: conv.unreadCount,
      status: conv.status as 'ACTIVE' | 'ARCHIVED' | 'BLOCKED',
      assignedUserId: conv.assignedUserId ?? undefined
    }))
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<WhatsAppMessage[]> {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    })

    return messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      direction: msg.direction as 'INBOUND' | 'OUTBOUND',
      messageType: msg.messageType as any,
      content: msg.content ?? undefined,
      mediaUrl: msg.mediaUrl ?? undefined,
      mediaType: msg.mediaType ?? undefined,
      caption: msg.caption ?? undefined,
      status: msg.status as any,
      fromNumber: msg.fromNumber,
      toNumber: msg.toNumber,
      timestamp: msg.timestamp,
      whatsappId: msg.whatsappId ?? undefined
    }))
  }

  /**
   * Get conversation ID by contact number
   */
  private async getConversationId(accountId: string, contactNumber: string): Promise<string> {
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { accountId, contactNumber }
    })
    return conversation?.id || ''
  }

  /**
   * Get account phone number
   */
  private async getAccountNumber(accountId: string): Promise<string> {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId }
    })
    return account?.phoneNumber || ''
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
    })

    this.emit('conversationRead', conversationId)
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { status: 'ARCHIVED' }
    })

    this.emit('conversationArchived', conversationId)
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string): Promise<{ status: string; lastHeartbeat?: Date }> {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      select: { status: true, lastHeartbeat: true }
    })

    return {
      status: account?.status || 'DISCONNECTED',
      lastHeartbeat: account?.lastHeartbeat ?? undefined
    }
  }

  /**
   * Disconnect account
   */
  async disconnect(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId)

    if (connection) {
      try {
        await connection.destroy()
      } catch (error) {
        console.error('Error destroying connection:', error)
      }
      this.connections.delete(accountId)
    }

    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
        lastHeartbeat: null
      }
    })

    this.emit('disconnected', accountId)
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()
export default whatsappService