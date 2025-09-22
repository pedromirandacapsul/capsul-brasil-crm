/**
 * Mass Messaging Service for WhatsApp Remarketing Campaigns
 * Handles bulk message sending with rate limiting, personalization, and analytics
 */

import { prisma } from '@/lib/prisma'
import { EventEmitter } from 'events'

export interface CampaignTarget {
  conversationId: string
  contactNumber: string
  contactName?: string
  variables?: Record<string, any>
}

export interface CampaignOptions {
  name: string
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
  content?: string
  mediaUrl?: string
  targets: CampaignTarget[]
  scheduledAt?: Date
  rateLimitPerMinute?: number
  personalizeMessages?: boolean
  useTypingSimulation?: boolean
  audienceFilter?: {
    tags?: string[]
    lastMessageBefore?: Date
    lastMessageAfter?: Date
    unreadOnly?: boolean
    excludeBlocked?: boolean
  }
}

export interface CampaignProgress {
  campaignId: string
  total: number
  sent: number
  delivered: number
  read: number
  failed: number
  progress: number
  estimatedCompletion?: Date
}

class MassMessagingService extends EventEmitter {
  private activeCampaigns = new Map<string, NodeJS.Timeout>()
  private campaignQueues = new Map<string, CampaignTarget[]>()

  constructor() {
    super()
  }

  /**
   * Create and optionally start a mass messaging campaign
   */
  async createCampaign(
    accountId: string,
    options: CampaignOptions
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      console.log(`📢 Creating mass messaging campaign: ${options.name}`)

      // Validate targets
      if (!options.targets || options.targets.length === 0) {
        return { success: false, error: 'No targets specified' }
      }

      // Create campaign record
      const campaign = await prisma.campaignMessage.create({
        data: {
          accountId,
          campaignName: options.name,
          messageType: options.messageType,
          content: options.content,
          mediaUrl: options.mediaUrl,
          targetAudience: JSON.stringify({
            count: options.targets.length,
            filter: options.audienceFilter
          }),
          scheduledAt: options.scheduledAt,
          status: options.scheduledAt ? 'SCHEDULED' : 'DRAFT'
        }
      })

      // Store targets for processing
      this.campaignQueues.set(campaign.id, options.targets)

      // If scheduled for immediate sending, start the campaign
      if (!options.scheduledAt || options.scheduledAt <= new Date()) {
        await this.startCampaign(campaign.id, options)
      } else {
        // Schedule for later
        this.scheduleCampaign(campaign.id, options)
      }

      console.log(`✅ Campaign created: ${campaign.id} (${options.targets.length} targets)`)

      return { success: true, campaignId: campaign.id }

    } catch (error) {
      console.error('❌ Error creating campaign:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Start executing a campaign
   */
  async startCampaign(campaignId: string, options: CampaignOptions): Promise<void> {
    try {
      console.log(`🚀 Starting campaign: ${campaignId}`)

      // Update campaign status
      await prisma.campaignMessage.update({
        where: { id: campaignId },
        data: { status: 'SENDING' }
      })

      // Get targets from queue
      const targets = this.campaignQueues.get(campaignId) || []
      if (targets.length === 0) {
        throw new Error('No targets found for campaign')
      }

      // Process targets with rate limiting
      await this.processCampaignTargets(campaignId, targets, options)

    } catch (error) {
      console.error(`❌ Error starting campaign ${campaignId}:`, error)
      await this.failCampaign(campaignId, error.message)
    }
  }

  /**
   * Process campaign targets with rate limiting and personalization
   */
  private async processCampaignTargets(
    campaignId: string,
    targets: CampaignTarget[],
    options: CampaignOptions
  ): Promise<void> {
    const rateLimitPerMinute = options.rateLimitPerMinute || 30 // Default 30 messages per minute
    const delayBetweenMessages = Math.ceil(60000 / rateLimitPerMinute)

    let sentCount = 0
    let deliveredCount = 0
    let failedCount = 0

    for (let i = 0; i < targets.length; i++) {
      try {
        const target = targets[i]

        console.log(`📤 Sending message ${i + 1}/${targets.length} to ${target.contactNumber}`)

        // Personalize message content if enabled
        let personalizedContent = options.content || ''
        if (options.personalizeMessages && target.variables) {
          personalizedContent = this.personalizeMessage(personalizedContent, target.variables)
        }

        // Send message with optional typing simulation
        const result = await this.sendCampaignMessage(
          campaignId,
          target,
          {
            ...options,
            content: personalizedContent
          }
        )

        if (result.success) {
          sentCount++
          if (result.delivered) {
            deliveredCount++
          }
        } else {
          failedCount++
          console.error(`❌ Failed to send to ${target.contactNumber}: ${result.error}`)
        }

        // Update campaign progress
        await this.updateCampaignProgress(campaignId, sentCount, deliveredCount, failedCount)

        // Emit progress event
        this.emit('campaign_progress', {
          campaignId,
          total: targets.length,
          sent: sentCount,
          delivered: deliveredCount,
          failed: failedCount,
          progress: (i + 1) / targets.length
        })

        // Rate limiting delay (except for last message)
        if (i < targets.length - 1) {
          await this.delay(delayBetweenMessages)
        }

      } catch (error) {
        failedCount++
        console.error(`❌ Error processing target ${i}:`, error)
        await this.updateCampaignProgress(campaignId, sentCount, deliveredCount, failedCount)
      }
    }

    // Complete campaign
    await this.completeCampaign(campaignId, sentCount, deliveredCount, failedCount)
  }

  /**
   * Send individual campaign message
   */
  private async sendCampaignMessage(
    campaignId: string,
    target: CampaignTarget,
    options: CampaignOptions
  ): Promise<{ success: boolean; delivered?: boolean; error?: string }> {
    try {
      const { mockWhatsAppService } = await import('./mock-whatsapp-service')

      // Get account from campaign
      const campaign = await prisma.campaignMessage.findUnique({
        where: { id: campaignId },
        include: { account: true }
      })

      if (!campaign) {
        throw new Error('Campaign not found')
      }

      // Simulate typing if enabled
      if (options.useTypingSimulation && options.messageType === 'TEXT' && options.content) {
        const { simulateHumanTyping } = await import('./typing-simulation')
        await simulateHumanTyping(
          target.conversationId,
          campaign.accountId,
          options.content,
          'professional'
        )
      }

      // Send message
      const result = await mockWhatsAppService.sendMessage(campaign.accountId, {
        to: target.contactNumber,
        type: options.messageType.toLowerCase() as any,
        content: options.content,
        mediaUrl: options.mediaUrl
      })

      return {
        success: result.success,
        delivered: result.success, // In mock service, success = delivered
        error: result.error
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Personalize message content with variables
   */
  private personalizeMessage(content: string, variables: Record<string, any>): string {
    let personalizedContent = content

    // Replace custom variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      personalizedContent = personalizedContent.replace(regex, String(value))
    }

    // Replace common variables
    personalizedContent = personalizedContent
      .replace(/{{name}}/g, variables.contactName || variables.contactNumber || 'Cliente')
      .replace(/{{time}}/g, new Date().toLocaleTimeString('pt-BR'))
      .replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'))

    return personalizedContent
  }

  /**
   * Update campaign progress in database
   */
  private async updateCampaignProgress(
    campaignId: string,
    sentCount: number,
    deliveredCount: number,
    failedCount: number
  ): Promise<void> {
    await prisma.campaignMessage.update({
      where: { id: campaignId },
      data: {
        sentCount,
        deliveredCount,
        // readCount will be updated separately when read receipts are received
      }
    })
  }

  /**
   * Complete campaign
   */
  private async completeCampaign(
    campaignId: string,
    sentCount: number,
    deliveredCount: number,
    failedCount: number
  ): Promise<void> {
    await prisma.campaignMessage.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        sentCount,
        deliveredCount,
        updatedAt: new Date()
      }
    })

    // Clean up
    this.campaignQueues.delete(campaignId)
    this.activeCampaigns.delete(campaignId)

    console.log(`✅ Campaign completed: ${campaignId} (${sentCount} sent, ${failedCount} failed)`)

    this.emit('campaign_completed', {
      campaignId,
      sentCount,
      deliveredCount,
      failedCount
    })
  }

  /**
   * Fail campaign
   */
  private async failCampaign(campaignId: string, error: string): Promise<void> {
    await prisma.campaignMessage.update({
      where: { id: campaignId },
      data: {
        status: 'FAILED',
        updatedAt: new Date()
      }
    })

    // Clean up
    this.campaignQueues.delete(campaignId)
    this.activeCampaigns.delete(campaignId)

    console.error(`❌ Campaign failed: ${campaignId} - ${error}`)

    this.emit('campaign_failed', {
      campaignId,
      error
    })
  }

  /**
   * Schedule campaign for later execution
   */
  private scheduleCampaign(campaignId: string, options: CampaignOptions): void {
    if (!options.scheduledAt) return

    const delay = options.scheduledAt.getTime() - Date.now()
    if (delay <= 0) {
      // Should start immediately
      this.startCampaign(campaignId, options)
      return
    }

    const timeoutId = setTimeout(() => {
      this.startCampaign(campaignId, options)
    }, delay)

    this.activeCampaigns.set(campaignId, timeoutId)

    console.log(`📅 Campaign scheduled: ${campaignId} at ${options.scheduledAt.toISOString()}`)
  }

  /**
   * Stop a running or scheduled campaign
   */
  async stopCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Cancel scheduled execution
      const timeoutId = this.activeCampaigns.get(campaignId)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.activeCampaigns.delete(campaignId)
      }

      // Update status
      await prisma.campaignMessage.update({
        where: { id: campaignId },
        data: {
          status: 'DRAFT', // Reset to draft
          updatedAt: new Date()
        }
      })

      // Clean up
      this.campaignQueues.delete(campaignId)

      console.log(`⏹️ Campaign stopped: ${campaignId}`)

      this.emit('campaign_stopped', { campaignId })

      return { success: true }

    } catch (error) {
      console.error(`❌ Error stopping campaign ${campaignId}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get campaign progress
   */
  async getCampaignProgress(campaignId: string): Promise<CampaignProgress | null> {
    try {
      const campaign = await prisma.campaignMessage.findUnique({
        where: { id: campaignId }
      })

      if (!campaign) return null

      const targetAudience = JSON.parse(campaign.targetAudience || '{}')
      const total = targetAudience.count || 0

      return {
        campaignId,
        total,
        sent: campaign.sentCount,
        delivered: campaign.deliveredCount,
        read: campaign.readCount,
        failed: total - campaign.sentCount,
        progress: total > 0 ? campaign.sentCount / total : 0
      }

    } catch (error) {
      console.error('❌ Error getting campaign progress:', error)
      return null
    }
  }

  /**
   * Filter conversations for targeting
   */
  async filterConversationsForCampaign(
    accountId: string,
    filter: {
      tags?: string[]
      lastMessageBefore?: Date
      lastMessageAfter?: Date
      unreadOnly?: boolean
      excludeBlocked?: boolean
    }
  ): Promise<CampaignTarget[]> {
    try {
      const whereConditions: any = {
        accountId,
        status: filter.excludeBlocked !== false ? 'ACTIVE' : undefined
      }

      if (filter.lastMessageBefore) {
        whereConditions.lastMessageAt = {
          ...whereConditions.lastMessageAt,
          lt: filter.lastMessageBefore
        }
      }

      if (filter.lastMessageAfter) {
        whereConditions.lastMessageAt = {
          ...whereConditions.lastMessageAt,
          gte: filter.lastMessageAfter
        }
      }

      if (filter.unreadOnly) {
        whereConditions.unreadCount = { gt: 0 }
      }

      let conversations = await prisma.whatsAppConversation.findMany({
        where: whereConditions,
        include: {
          contactTags: filter.tags ? {
            where: {
              tag: { in: filter.tags }
            }
          } : false
        }
      })

      // Filter by tags if specified
      if (filter.tags && filter.tags.length > 0) {
        conversations = conversations.filter(conv =>
          conv.contactTags && conv.contactTags.length > 0
        )
      }

      // Convert to campaign targets
      const targets: CampaignTarget[] = conversations.map(conv => ({
        conversationId: conv.id,
        contactNumber: conv.contactNumber,
        contactName: conv.contactName,
        variables: {
          contactName: conv.contactName,
          contactNumber: conv.contactNumber,
          lastMessageAt: conv.lastMessageAt
        }
      }))

      console.log(`🎯 Filtered ${targets.length} conversations for campaign`)

      return targets

    } catch (error) {
      console.error('❌ Error filtering conversations:', error)
      return []
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get active campaigns count
   */
  getActiveCampaignsCount(): number {
    return this.activeCampaigns.size
  }

  /**
   * Get all campaigns for an account
   */
  async getCampaigns(accountId: string, limit: number = 20) {
    return await prisma.campaignMessage.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}

// Export singleton instance
export const massMessagingService = new MassMessagingService()

/**
 * Helper function to create and start a quick campaign
 */
export async function sendMassMessage(
  accountId: string,
  targets: CampaignTarget[],
  message: string,
  options: {
    name?: string
    messageType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
    useTypingSimulation?: boolean
    personalizeMessages?: boolean
  } = {}
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  return massMessagingService.createCampaign(accountId, {
    name: options.name || `Quick Campaign ${new Date().toISOString()}`,
    messageType: options.messageType || 'TEXT',
    content: message,
    targets,
    useTypingSimulation: options.useTypingSimulation,
    personalizeMessages: options.personalizeMessages,
    rateLimitPerMinute: 30
  })
}