import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
  metadata?: {
    webhookId: string
    deliveryId: string
  }
}

export interface WebhookEvent {
  name: string
  data: any
}

export class WebhookService {

  // Available webhook events for opportunities
  static EVENTS = {
    OPPORTUNITY_CREATED: 'opportunity.created',
    OPPORTUNITY_UPDATED: 'opportunity.updated',
    OPPORTUNITY_STAGE_CHANGED: 'opportunity.stage_changed',
    OPPORTUNITY_WON: 'opportunity.won',
    OPPORTUNITY_LOST: 'opportunity.lost',
    OPPORTUNITY_DELETED: 'opportunity.deleted'
  } as const

  /**
   * Trigger webhook for a specific event
   */
  async triggerEvent(eventName: string, data: any): Promise<void> {
    try {
      // Get all active webhooks that listen to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          active: true,
          events: {
            contains: eventName
          }
        }
      })

      console.log(`🪝 Triggering webhook event "${eventName}" for ${webhooks.length} webhooks`)

      // Process each webhook
      const deliveryPromises = webhooks.map(webhook =>
        this.deliverWebhook(webhook, eventName, data)
      )

      await Promise.allSettled(deliveryPromises)
    } catch (error) {
      console.error('Error triggering webhook event:', error)
    }
  }

  /**
   * Deliver webhook to a specific endpoint
   */
  private async deliverWebhook(webhook: any, eventName: string, data: any): Promise<void> {
    // Create delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: eventName,
        payload: JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          data,
          metadata: {
            webhookId: webhook.id,
            deliveryId: crypto.randomUUID()
          }
        }),
        status: 'PENDING'
      }
    })

    try {
      await this.sendWebhookRequest(webhook, delivery, eventName, data)
    } catch (error) {
      console.error(`Failed to deliver webhook ${webhook.id}:`, error)

      // Update delivery with error
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          nextRetryAt: this.calculateNextRetry(1, webhook.retryCount)
        }
      })
    }
  }

  /**
   * Send the actual HTTP request to webhook endpoint
   */
  private async sendWebhookRequest(
    webhook: any,
    delivery: any,
    eventName: string,
    data: any
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        webhookId: webhook.id,
        deliveryId: delivery.id
      }
    }

    const payloadString = JSON.stringify(payload)

    // Generate signature if secret is provided
    let signature: string | undefined
    if (webhook.secret) {
      signature = this.generateSignature(payloadString, webhook.secret)
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Capsul-Webhook/1.0',
      'X-Webhook-Event': eventName,
      'X-Webhook-Delivery': delivery.id
    }

    if (signature) {
      headers['X-Webhook-Signature-256'] = signature
    }

    // Add custom headers if provided
    if (webhook.headers) {
      try {
        const customHeaders = JSON.parse(webhook.headers)
        Object.assign(headers, customHeaders)
      } catch (error) {
        console.warn('Invalid custom headers in webhook:', webhook.id)
      }
    }

    // Make the request
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), webhook.timeout * 1000)

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeout)

      const responseText = await response.text()

      // Update delivery record
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'SUCCESS' : 'FAILED',
          responseCode: response.status,
          response: responseText.substring(0, 1000), // Limit response size
          deliveredAt: response.ok ? new Date() : undefined,
          nextRetryAt: !response.ok ? this.calculateNextRetry(1, webhook.retryCount) : undefined
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`)
      }

      console.log(`✅ Webhook delivered successfully to ${webhook.url} (${response.status})`)

    } catch (error) {
      clearTimeout(timeout)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
          nextRetryAt: this.calculateNextRetry(1, webhook.retryCount)
        }
      })

      throw error
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload, 'utf8')
    return `sha256=${hmac.digest('hex')}`
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attempt: number, maxAttempts: number): Date | null {
    if (attempt >= maxAttempts) {
      return null
    }

    // Exponential backoff: 2^attempt minutes
    const delayMinutes = Math.pow(2, attempt)
    return new Date(Date.now() + delayMinutes * 60 * 1000)
  }

  /**
   * Retry failed webhook deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    console.log('🔄 Checking for failed webhook deliveries to retry...')

    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'FAILED',
        nextRetryAt: {
          lte: new Date()
        }
      },
      include: {
        webhook: true
      },
      take: 50 // Limit to avoid overwhelming
    })

    console.log(`Found ${failedDeliveries.length} failed deliveries to retry`)

    for (const delivery of failedDeliveries) {
      if (!delivery.webhook.active) {
        continue
      }

      if (delivery.attempt >= delivery.webhook.retryCount) {
        // Mark as permanently failed
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            nextRetryAt: null
          }
        })
        continue
      }

      try {
        const payload = JSON.parse(delivery.payload)

        // Update delivery attempt
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            attempt: delivery.attempt + 1,
            status: 'PENDING'
          }
        })

        await this.sendWebhookRequest(
          delivery.webhook,
          delivery,
          delivery.event,
          payload.data
        )

      } catch (error) {
        console.error(`Retry failed for delivery ${delivery.id}:`, error)

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Retry failed',
            nextRetryAt: this.calculateNextRetry(delivery.attempt + 1, delivery.webhook.retryCount)
          }
        })
      }
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(webhookId?: string, timeRange?: { from: Date; to: Date }) {
    const whereClause: any = {}

    if (webhookId) {
      whereClause.webhookId = webhookId
    }

    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.from,
        lte: timeRange.to
      }
    }

    const [total, successful, failed, pending] = await Promise.all([
      prisma.webhookDelivery.count({ where: whereClause }),
      prisma.webhookDelivery.count({ where: { ...whereClause, status: 'SUCCESS' } }),
      prisma.webhookDelivery.count({ where: { ...whereClause, status: 'FAILED' } }),
      prisma.webhookDelivery.count({ where: { ...whereClause, status: 'PENDING' } })
    ])

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? (successful / total) * 100 : 0
    }
  }

  /**
   * Validate webhook URL
   */
  async validateWebhookUrl(url: string, secret?: string): Promise<boolean> {
    try {
      const testPayload: WebhookPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: { test: true },
        metadata: {
          webhookId: 'test',
          deliveryId: 'test'
        }
      }

      const payloadString = JSON.stringify(testPayload)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Capsul-Webhook/1.0',
        'X-Webhook-Event': 'webhook.test'
      }

      if (secret) {
        headers['X-Webhook-Signature-256'] = this.generateSignature(payloadString, secret)
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeout)

      return response.status >= 200 && response.status < 300

    } catch (error) {
      console.error('Webhook validation failed:', error)
      return false
    }
  }
}

// Singleton instance
export const webhookService = new WebhookService()

// Convenience functions for opportunity events
export const opportunityWebhooks = {
  created: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_CREATED, data),
  updated: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_UPDATED, data),
  stageChanged: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_STAGE_CHANGED, data),
  won: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_WON, data),
  lost: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_LOST, data),
  deleted: (data: any) => webhookService.triggerEvent(WebhookService.EVENTS.OPPORTUNITY_DELETED, data)
}