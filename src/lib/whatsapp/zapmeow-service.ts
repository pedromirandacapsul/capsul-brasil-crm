/**
 * ZapMeow WhatsApp Service - Production-ready implementation
 * Replaces unreliable Puppeteer with stable Go-based ZapMeow API
 */

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()

// ZapMeow API Configuration
const ZAPMEOW_BASE_URL = process.env.ZAPMEOW_BASE_URL || 'http://localhost:8900'

export interface ZapMeowAccount {
  id: string
  instanceId: string
  phoneNumber: string
  displayName?: string
  profilePicture?: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  qrCode?: string
  lastHeartbeat?: Date
}

export interface ZapMeowMessage {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT'
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

class ZapMeowService extends EventEmitter {
  private instanceMapping: Map<string, string> = new Map() // accountId -> instanceId
  private statusPolling: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    super()
    this.initializeExistingConnections()
  }

  /**
   * Initialize existing connections from database
   */
  private async initializeExistingConnections() {
    try {
      const accounts = await prisma.whatsAppAccount.findMany({
        where: { status: 'CONNECTED' }
      })

      for (const account of accounts) {
        // Map account to ZapMeow instance
        const instanceId = account.phoneNumber.replace(/\D/g, '')
        this.instanceMapping.set(account.id, instanceId)

        // Start status monitoring
        this.startStatusPolling(account.id, instanceId)
      }
    } catch (error) {
      console.error('Failed to initialize ZapMeow connections:', error)
    }
  }

  /**
   * Create a new WhatsApp connection using ZapMeow
   */
  async createConnection(accountId: string, phoneNumber: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId }
      })

      if (!account) {
        return { success: false, error: 'Account not found' }
      }

      // Generate instance ID from phone number
      const instanceId = phoneNumber.replace(/\D/g, '')
      this.instanceMapping.set(accountId, instanceId)

      // Update account status to connecting
      await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          status: 'CONNECTING',
          lastHeartbeat: new Date()
        }
      })

      // Get QR Code from ZapMeow
      const qrResponse = await this.zapMeowRequest(instanceId, '/qrcode', 'GET')

      if (!qrResponse.success) {
        return { success: false, error: 'Failed to generate QR code' }
      }

      const qrCode = qrResponse.data.qrcode

      if (!qrCode) {
        return { success: false, error: 'QR code not available' }
      }

      // Convert raw QR string to visual QR code
      const qrCodeImage = await this.generateQRCodeImage(qrCode)

      // Save QR code
      await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { qrCode: qrCodeImage }
      })

      // Start polling for connection status
      this.startConnectionPolling(accountId, instanceId)

      return { success: true, qrCode: qrCodeImage }

    } catch (error) {
      console.error('ZapMeow connection error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Generate visual QR code from raw string
   */
  private async generateQRCodeImage(qrString: string): Promise<string> {
    try {
      // Dynamic import to avoid SSR issues
      const QRCode = await import('qrcode')
      return await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('QR code generation failed:', error)
      return qrString // Return raw string as fallback
    }
  }

  /**
   * Start polling for connection status
   */
  private startConnectionPolling(accountId: string, instanceId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await this.zapMeowRequest(instanceId, '/status', 'GET')

        if (statusResponse.success && statusResponse.data.connected) {
          // Connection successful!
          clearInterval(pollInterval)

          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: 'CONNECTED',
              qrCode: null, // Clear QR code
              lastHeartbeat: new Date()
            }
          })

          // Start regular status monitoring
          this.startStatusPolling(accountId, instanceId)

          // Sync conversations
          await this.syncConversations(accountId)

          this.emit('connectionReady', accountId)
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  /**
   * Start regular status monitoring
   */
  private startStatusPolling(accountId: string, instanceId: string) {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await this.zapMeowRequest(instanceId, '/status', 'GET')

        if (statusResponse.success) {
          const isConnected = statusResponse.data.connected
          const currentStatus = isConnected ? 'CONNECTED' : 'DISCONNECTED'

          await prisma.whatsAppAccount.update({
            where: { id: accountId },
            data: {
              status: currentStatus,
              lastHeartbeat: new Date(),
              displayName: statusResponse.data.phone || undefined
            }
          })

          if (!isConnected) {
            // Connection lost, clear interval
            clearInterval(interval)
            this.statusPolling.delete(accountId)
            this.emit('disconnected', accountId)
          }
        }
      } catch (error) {
        console.error('Status monitoring error:', error)
      }
    }, 30000) // Check every 30 seconds

    this.statusPolling.set(accountId, interval)
  }

  /**
   * Send message via ZapMeow
   */
  async sendMessage(accountId: string, to: string, content: string, type: 'text' = 'text'): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const instanceId = this.instanceMapping.get(accountId)
      if (!instanceId) {
        return { success: false, error: 'Account not connected' }
      }

      const messageData = {
        phone: to,
        text: content,
        funnelId: 'direct_message',
        stepId: 'manual_send',
        messageType: type
      }

      const response = await this.zapMeowRequest(instanceId, '/funnel/message', 'POST', messageData)

      if (response.success) {
        // Create message record in database
        const conversation = await this.findOrCreateConversation(accountId, to)

        const messageRecord = await prisma.whatsAppMessage.create({
          data: {
            accountId,
            conversationId: conversation.id,
            direction: 'OUTBOUND',
            messageType: type.toUpperCase(),
            content,
            status: 'SENT',
            fromNumber: await this.getAccountNumber(accountId),
            toNumber: to,
            timestamp: new Date()
          }
        })

        // Update conversation
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() }
        })

        this.emit('messageSent', {
          accountId,
          message: messageRecord
        })

        return { success: true, messageId: messageRecord.id }
      }

      return { success: false, error: 'Failed to send message via ZapMeow' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Sync conversations from ZapMeow
   */
  async syncConversations(accountId: string): Promise<{ success: boolean; totalSynced: number; error?: string }> {
    try {
      const instanceId = this.instanceMapping.get(accountId)
      if (!instanceId) {
        return { success: false, totalSynced: 0, error: 'Account not connected' }
      }

      // For now, we'll use the existing conversation sync logic
      // In the future, ZapMeow could provide conversation endpoints

      return { success: true, totalSynced: 0 }
    } catch (error) {
      return { success: false, totalSynced: 0, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Trigger funnel via ZapMeow
   */
  async triggerFunnel(accountId: string, phone: string, funnelId: string, funnelData: any, leadData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const instanceId = this.instanceMapping.get(accountId)
      if (!instanceId) {
        return { success: false, error: 'Account not connected' }
      }

      const triggerData = {
        phone,
        funnelId,
        funnelData: {
          funnelId,
          instanceId,
          ...funnelData
        },
        leadData
      }

      const response = await this.zapMeowRequest(instanceId, '/funnel/trigger', 'POST', triggerData)

      return { success: response.success, error: response.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string): Promise<{ status: string; connected: boolean; lastHeartbeat?: Date }> {
    try {
      const instanceId = this.instanceMapping.get(accountId)
      if (!instanceId) {
        return { status: 'DISCONNECTED', connected: false }
      }

      const response = await this.zapMeowRequest(instanceId, '/status', 'GET')

      if (response.success) {
        const account = await prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
          select: { status: true, lastHeartbeat: true }
        })

        return {
          status: account?.status || 'DISCONNECTED',
          connected: response.data.connected || false,
          lastHeartbeat: account?.lastHeartbeat
        }
      }

      return { status: 'ERROR', connected: false }
    } catch (error) {
      return { status: 'ERROR', connected: false }
    }
  }

  /**
   * Disconnect account
   */
  async disconnect(accountId: string): Promise<void> {
    try {
      // Stop status polling
      const interval = this.statusPolling.get(accountId)
      if (interval) {
        clearInterval(interval)
        this.statusPolling.delete(accountId)
      }

      // Remove instance mapping
      this.instanceMapping.delete(accountId)

      // Update database
      await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          status: 'DISCONNECTED',
          qrCode: null,
          lastHeartbeat: null
        }
      })

      this.emit('disconnected', accountId)
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  /**
   * Process webhook from ZapMeow
   */
  async processWebhook(data: any): Promise<void> {
    try {
      const { event, instanceId, phone, message, funnelData } = data

      // Find account by instanceId
      const accountId = Array.from(this.instanceMapping.entries())
        .find(([_, id]) => id === instanceId)?.[0]

      if (!accountId) {
        console.log('Webhook received for unknown instance:', instanceId)
        return
      }

      switch (event) {
        case 'message_received':
          await this.handleIncomingMessage(accountId, phone, message)
          break
        case 'funnel_trigger':
          this.emit('funnelTriggered', { accountId, phone, funnelData })
          break
        case 'message_sent':
          this.emit('messageSent', { accountId, phone, message })
          break
        default:
          console.log('Unknown webhook event:', event)
      }
    } catch (error) {
      console.error('Webhook processing error:', error)
    }
  }

  /**
   * Handle incoming message from webhook
   */
  private async handleIncomingMessage(accountId: string, fromNumber: string, messageData: any) {
    try {
      const conversation = await this.findOrCreateConversation(accountId, fromNumber)

      const messageRecord = await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          direction: 'INBOUND',
          messageType: 'TEXT',
          content: messageData.text || messageData.content,
          status: 'DELIVERED',
          fromNumber,
          toNumber: await this.getAccountNumber(accountId),
          timestamp: new Date()
        }
      })

      // Update conversation
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 }
        }
      })

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
   * Find or create conversation
   */
  private async findOrCreateConversation(accountId: string, contactNumber: string) {
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { accountId, contactNumber }
    })

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          accountId,
          contactNumber,
          contactName: contactNumber,
          isGroup: contactNumber.includes('@g.us'),
          status: 'ACTIVE',
          lastMessageAt: new Date(),
          unreadCount: 0
        }
      })
    }

    return conversation
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
   * Make request to ZapMeow API
   */
  private async zapMeowRequest(instanceId: string, endpoint: string, method: 'GET' | 'POST', data?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${ZAPMEOW_BASE_URL}/api/${instanceId}${endpoint}`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined
      })

      const responseData = await response.json()

      if (response.ok) {
        return { success: true, data: responseData }
      } else {
        return { success: false, error: responseData.error || 'ZapMeow API error' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  /**
   * Get all conversations for account
   */
  async getConversations(accountId: string, limit = 50, offset = 0) {
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
      contactName: conv.contactName,
      profilePicture: conv.profilePicture,
      isGroup: conv.isGroup,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      status: conv.status as 'ACTIVE' | 'ARCHIVED' | 'BLOCKED',
      assignedUserId: conv.assignedUserId
    }))
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0) {
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
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      caption: msg.caption,
      status: msg.status as any,
      fromNumber: msg.fromNumber,
      toNumber: msg.toNumber,
      timestamp: msg.timestamp,
      whatsappId: msg.whatsappId
    }))
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
}

// Export singleton instance
export const zapMeowService = new ZapMeowService()
export default zapMeowService