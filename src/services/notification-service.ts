import { prisma } from '@/lib/prisma'

export interface NotificationConfig {
  slack?: {
    enabled: boolean
    webhookUrl?: string
    channel?: string
    username?: string
  }
  email?: {
    enabled: boolean
    recipients: string[]
    fromEmail?: string
  }
  inApp?: {
    enabled: boolean
    persistInDatabase: boolean
  }
}

export interface NotificationPayload {
  type: 'opportunity_created' | 'opportunity_stage_changed' | 'lead_converted' | 'high_value_deal'
  title: string
  message: string
  data?: any
  urgency?: 'low' | 'medium' | 'high'
  userId?: string
  leadId?: string
  opportunityId?: string
}

export class NotificationService {
  private static instance: NotificationService
  private config: NotificationConfig = {
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#vendas',
      username: 'CRM Capsul Bot'
    },
    email: {
      enabled: false, // Desabilitado por enquanto
      recipients: ['admin@capsul.com.br'],
      fromEmail: 'noreply@capsul.com.br'
    },
    inApp: {
      enabled: true,
      persistInDatabase: true
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Enviar notificação para todos os canais configurados
   */
  async send(payload: NotificationPayload): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = []

    console.log(`📢 Sending notification: ${payload.type}`, {
      title: payload.title,
      urgency: payload.urgency
    })

    try {
      // 1. Slack Notification
      if (this.config.slack?.enabled && this.config.slack.webhookUrl) {
        try {
          const slackResult = await this.sendToSlack(payload)
          results.push({ channel: 'slack', success: true, data: slackResult })
        } catch (error) {
          console.error('Slack notification failed:', error)
          results.push({ channel: 'slack', success: false, error: error.message })
        }
      }

      // 2. In-App Notification
      if (this.config.inApp?.enabled) {
        try {
          const inAppResult = await this.saveInApp(payload)
          results.push({ channel: 'in-app', success: true, data: inAppResult })
        } catch (error) {
          console.error('In-app notification failed:', error)
          results.push({ channel: 'in-app', success: false, error: error.message })
        }
      }

      // 3. Email Notification (placeholder for future implementation)
      if (this.config.email?.enabled) {
        try {
          const emailResult = await this.sendEmail(payload)
          results.push({ channel: 'email', success: true, data: emailResult })
        } catch (error) {
          console.error('Email notification failed:', error)
          results.push({ channel: 'email', success: false, error: error.message })
        }
      }

      const successCount = results.filter(r => r.success).length
      return {
        success: successCount > 0,
        results
      }

    } catch (error) {
      console.error('Notification service error:', error)
      return {
        success: false,
        results: [{ error: error.message }]
      }
    }
  }

  /**
   * Enviar para Slack
   */
  private async sendToSlack(payload: NotificationPayload): Promise<any> {
    if (!this.config.slack?.webhookUrl) {
      throw new Error('Slack webhook URL not configured')
    }

    const urgencyColors = {
      low: '#36a64f',      // Verde
      medium: '#ff9500',   // Laranja
      high: '#ff4444'      // Vermelho
    }

    const urgencyEmojis = {
      low: '💚',
      medium: '🟡',
      high: '🔴'
    }

    const emoji = urgencyEmojis[payload.urgency || 'medium']
    const color = urgencyColors[payload.urgency || 'medium']

    const slackPayload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username,
      icon_emoji: ':moneybag:',
      attachments: [
        {
          color: color,
          title: `${emoji} ${payload.title}`,
          text: payload.message,
          fields: this.buildSlackFields(payload),
          footer: 'CRM Capsul Brasil',
          footer_icon: 'https://capsul.com.br/favicon.ico',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }

    const response = await fetch(this.config.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload)
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }

    return await response.text()
  }

  /**
   * Construir campos para Slack baseado no tipo de notificação
   */
  private buildSlackFields(payload: NotificationPayload): any[] {
    const fields: any[] = []

    switch (payload.type) {
      case 'opportunity_created':
        if (payload.data?.leadName) {
          fields.push({
            title: 'Lead',
            value: payload.data.leadName,
            short: true
          })
        }
        if (payload.data?.stage) {
          fields.push({
            title: 'Estágio',
            value: payload.data.stage,
            short: true
          })
        }
        if (payload.data?.amount && payload.data.amount > 0) {
          fields.push({
            title: 'Valor',
            value: `R$ ${payload.data.amount.toLocaleString('pt-BR')}`,
            short: true
          })
        }
        if (payload.data?.ownerName) {
          fields.push({
            title: 'Responsável',
            value: payload.data.ownerName,
            short: true
          })
        }
        break

      case 'opportunity_stage_changed':
        if (payload.data?.stageFrom && payload.data?.stageTo) {
          fields.push({
            title: 'Mudança de Estágio',
            value: `${payload.data.stageFrom} → ${payload.data.stageTo}`,
            short: false
          })
        }
        break

      case 'high_value_deal':
        if (payload.data?.amount) {
          fields.push({
            title: 'Valor Alto',
            value: `💰 R$ ${payload.data.amount.toLocaleString('pt-BR')}`,
            short: false
          })
        }
        break
    }

    return fields
  }

  /**
   * Salvar notificação in-app no banco
   */
  private async saveInApp(payload: NotificationPayload): Promise<any> {
    if (!this.config.inApp?.persistInDatabase) {
      return { saved: false, reason: 'Database persistence disabled' }
    }

    try {
      // Se temos leadId, criar como activity do lead
      if (payload.leadId) {
        const notification = await prisma.activity.create({
          data: {
            leadId: payload.leadId,
            type: 'NOTIFICATION',
            payload: JSON.stringify({
              notificationType: payload.type,
              title: payload.title,
              message: payload.message,
              urgency: payload.urgency,
              data: payload.data
            }),
            ...(payload.userId && { userId: payload.userId })
          }
        })
        return { saved: true, notificationId: notification.id }
      }

      // Caso contrário, apenas log (futuramente podemos criar uma tabela específica para notificações)
      console.log('📱 In-app notification:', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        urgency: payload.urgency
      })

      return {
        saved: true,
        method: 'logged',
        reason: 'No leadId provided - logged to console'
      }
    } catch (error) {
      console.error('Failed to save in-app notification:', error)
      return { saved: false, error: error.message }
    }
  }

  /**
   * Placeholder para email (implementação futura)
   */
  private async sendEmail(payload: NotificationPayload): Promise<any> {
    // TODO: Implementar envio de email
    // Pode usar SendGrid, AWS SES, Nodemailer, etc.
    console.log('📧 Email notification would be sent:', {
      to: this.config.email?.recipients,
      subject: payload.title,
      body: payload.message
    })

    return { sent: false, reason: 'Email implementation pending' }
  }

  /**
   * Criar notificação para oportunidade criada
   */
  async notifyOpportunityCreated(opportunityData: {
    id: string
    leadName: string
    stage: string
    amount?: number
    ownerName: string
    ownerId: string
    leadId: string
  }): Promise<void> {
    const urgency = opportunityData.amount && opportunityData.amount > 50000 ? 'high' : 'medium'

    const payload: NotificationPayload = {
      type: 'opportunity_created',
      title: '🎯 Nova Oportunidade Criada!',
      message: `Uma nova oportunidade foi criada para ${opportunityData.leadName}`,
      urgency,
      userId: opportunityData.ownerId,
      leadId: opportunityData.leadId,
      opportunityId: opportunityData.id,
      data: opportunityData
    }

    await this.send(payload)
  }

  /**
   * Criar notificação para mudança de estágio
   */
  async notifyStageChanged(stageData: {
    opportunityId: string
    leadName: string
    stageFrom: string
    stageTo: string
    ownerName: string
    ownerId: string
    amount?: number
  }): Promise<void> {
    const urgency = stageData.stageTo === 'WON' ? 'high' : 'medium'
    const isWon = stageData.stageTo === 'WON'
    const emoji = isWon ? '🎉' : '📈'

    const payload: NotificationPayload = {
      type: 'opportunity_stage_changed',
      title: `${emoji} ${isWon ? 'Negócio Fechado!' : 'Estágio Atualizado'}`,
      message: isWon
        ? `Parabéns! ${stageData.leadName} fechou o negócio!`
        : `${stageData.leadName} avançou no pipeline`,
      urgency,
      userId: stageData.ownerId,
      opportunityId: stageData.opportunityId,
      data: stageData
    }

    await this.send(payload)
  }

  /**
   * Notificação para negócio de alto valor
   */
  async notifyHighValueDeal(dealData: {
    opportunityId: string
    leadName: string
    amount: number
    stage: string
    ownerName: string
    ownerId: string
  }): Promise<void> {
    if (dealData.amount < 50000) return // Só notificar valores altos

    const payload: NotificationPayload = {
      type: 'high_value_deal',
      title: '💎 Negócio de Alto Valor!',
      message: `${dealData.leadName} tem uma oportunidade de R$ ${dealData.amount.toLocaleString('pt-BR')}`,
      urgency: 'high',
      userId: dealData.ownerId,
      opportunityId: dealData.opportunityId,
      data: dealData
    }

    await this.send(payload)
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Obter configuração atual
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }
}

export const notificationService = NotificationService.getInstance()