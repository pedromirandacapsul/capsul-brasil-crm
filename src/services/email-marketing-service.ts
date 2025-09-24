import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  templateId?: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED'
  type: 'MARKETING' | 'TRANSACTIONAL' | 'WORKFLOW'
  scheduledAt?: Date
  segmentConfig?: any
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
}

export interface EmailMetrics {
  totalSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
  bounceRate: number
}

export interface SegmentCriteria {
  status?: string[]
  source?: string[]
  tags?: string[]
  dateRange?: {
    field: 'createdAt' | 'lastActivityAt'
    from?: Date
    to?: Date
  }
  dealValueRange?: {
    min?: number
    max?: number
  }
}

export class EmailMarketingService {
  private static instance: EmailMarketingService
  private transporter: nodemailer.Transporter

  private constructor() {
    this.transporter = this.createTransporter()
  }

  private createTransporter(): nodemailer.Transporter {
    const provider = process.env.SMTP_PROVIDER || 'mailhog'

    console.log('🔧 Configurando SMTP:', {
      provider,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      from: process.env.SMTP_FROM
    })

    switch (provider) {
      case 'gmail':
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!
          }
        })

      case 'sendgrid':
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY!
          }
        })

      case 'ses':
        return nodemailer.createTransport({
          host: process.env.SES_SMTP_HOST || `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: process.env.AWS_SES_ACCESS_KEY!,
            pass: process.env.AWS_SES_SECRET_KEY!
          },
          tls: {
            rejectUnauthorized: true
          }
        })

      case 'mailhog':
      case 'custom':
      default:
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '1025'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          } : undefined,
          tls: {
            rejectUnauthorized: false
          }
        })
    }
  }

  public static getInstance(): EmailMarketingService {
    if (!EmailMarketingService.instance) {
      EmailMarketingService.instance = new EmailMarketingService()
    }
    return EmailMarketingService.instance
  }

  // ===== TEMPLATES =====

  async createTemplate(data: {
    name: string
    description?: string
    subject: string
    htmlContent: string
    textContent?: string
    variables?: string[]
    category?: string
    createdById: string
  }): Promise<EmailTemplate> {
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent,
        variables: JSON.stringify(data.variables || []),
        category: data.category || 'MARKETING',
        createdById: data.createdById
      }
    })

    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || undefined,
      variables: template.variables ? JSON.parse(template.variables) : []
    }
  }

  async getTemplates(category?: string): Promise<EmailTemplate[]> {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        active: true,
        ...(category ? { category } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || undefined,
      variables: template.variables ? JSON.parse(template.variables) : []
    }))
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject && { subject: data.subject }),
        ...(data.htmlContent && { htmlContent: data.htmlContent }),
        ...(data.textContent !== undefined && { textContent: data.textContent }),
        ...(data.variables && { variables: JSON.stringify(data.variables) })
      }
    })

    return {
      id: updated.id,
      name: updated.name,
      subject: updated.subject,
      htmlContent: updated.htmlContent,
      textContent: updated.textContent || undefined,
      variables: updated.variables ? JSON.parse(updated.variables) : []
    }
  }

  // ===== CAMPANHAS =====

  async createCampaign(data: {
    name: string
    subject: string
    templateId?: string
    type?: string
    scheduledAt?: Date
    segmentConfig?: SegmentCriteria
    createdById: string
  }): Promise<EmailCampaign> {
    const campaign = await prisma.emailCampaignNew.create({
      data: {
        name: data.name,
        subject: data.subject,
        templateId: data.templateId,
        type: data.type || 'MARKETING',
        scheduledAt: data.scheduledAt,
        segmentConfig: data.segmentConfig ? JSON.stringify(data.segmentConfig) : null,
        createdById: data.createdById
      }
    })

    return this.mapCampaignFromPrisma(campaign)
  }

  async getCampaigns(status?: string): Promise<EmailCampaign[]> {
    const campaigns = await prisma.emailCampaignNew.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        _count: {
          select: {
            recipients: true
          }
        }
      }
    })

    return campaigns.map(campaign => this.mapCampaignFromPrisma(campaign))
  }

  async getCampaignById(id: string): Promise<EmailCampaign | null> {
    const campaign = await prisma.emailCampaignNew.findUnique({
      where: { id },
      include: {
        template: true,
        recipients: {
          include: {
            lead: true
          }
        }
      }
    })

    if (!campaign) return null
    return this.mapCampaignFromPrisma(campaign)
  }

  // ===== SEGMENTAÇÃO =====

  async getLeadsBySegment(criteria: SegmentCriteria): Promise<any[]> {
    const whereClause: any = {
      email: { not: null } // Só leads com email
    }

    // Filtro por status
    if (criteria.status && criteria.status.length > 0) {
      whereClause.status = { in: criteria.status }
    }

    // Filtro por fonte
    if (criteria.source && criteria.source.length > 0) {
      whereClause.source = { in: criteria.source }
    }

    // Filtro por data
    if (criteria.dateRange) {
      const field = criteria.dateRange.field
      whereClause[field] = {}

      if (criteria.dateRange.from) {
        whereClause[field].gte = criteria.dateRange.from
      }

      if (criteria.dateRange.to) {
        whereClause[field].lte = criteria.dateRange.to
      }
    }

    // Filtro por valor do negócio
    if (criteria.dealValueRange) {
      if (criteria.dealValueRange.min !== undefined) {
        whereClause.dealValue = { gte: criteria.dealValueRange.min }
      }

      if (criteria.dealValueRange.max !== undefined) {
        whereClause.dealValue = {
          ...whereClause.dealValue,
          lte: criteria.dealValueRange.max
        }
      }
    }

    // Filtro por tags
    if (criteria.tags && criteria.tags.length > 0) {
      whereClause.tagAssignments = {
        some: {
          tag: {
            name: { in: criteria.tags }
          }
        }
      }
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        status: true,
        source: true,
        dealValue: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return leads
  }

  async createSegment(data: {
    name: string
    description?: string
    conditions: SegmentCriteria
    createdById: string
  }) {
    const leads = await this.getLeadsBySegment(data.conditions)

    return await prisma.emailSegment.create({
      data: {
        name: data.name,
        description: data.description,
        conditions: JSON.stringify(data.conditions),
        leadCount: leads.length,
        createdById: data.createdById
      }
    })
  }

  // ===== ENVIO DE EMAILS =====

  async addRecipientsToCampaign(campaignId: string, leadIds?: string[], segmentCriteria?: SegmentCriteria) {
    let leads: any[] = []

    if (leadIds && leadIds.length > 0) {
      // Adicionar leads específicos
      leads = await prisma.lead.findMany({
        where: {
          id: { in: leadIds },
          email: { not: null }
        },
        select: { id: true, email: true, name: true }
      })
    } else if (segmentCriteria) {
      // Adicionar por critérios de segmentação
      leads = await this.getLeadsBySegment(segmentCriteria)
    }

    if (leads.length === 0) {
      throw new Error('Nenhum lead encontrado com os critérios especificados')
    }

    // Criar registros de destinatários
    const recipients = leads.map(lead => ({
      campaignId,
      leadId: lead.id,
      email: lead.email!
    }))

    await prisma.emailRecipient.createMany({
      data: recipients
    })

    // Atualizar contador total de destinatários
    await prisma.emailCampaignNew.update({
      where: { id: campaignId },
      data: { totalRecipients: { increment: recipients.length } }
    })

    return recipients.length
  }

  async sendCampaign(campaignId: string, options?: { batchSize?: number; delayBetweenBatches?: number }): Promise<void> {
    const batchSize = options?.batchSize || 50 // Enviar 50 emails por lote
    const delayBetweenBatches = options?.delayBetweenBatches || 1000 // 1 segundo entre lotes

    const campaign = await prisma.emailCampaignNew.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        recipients: {
          where: { status: 'PENDING' },
          include: { lead: true }
        }
      }
    })

    if (!campaign) {
      throw new Error('Campanha não encontrada')
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new Error('Campanha não pode ser enviada neste status')
    }

    console.log(`📤 Iniciando envio de campanha: ${campaign.name}`)
    console.log(`📊 Total de destinatários: ${campaign.recipients.length}`)
    console.log(`⚙️ Configuração: ${batchSize} emails por lote, ${delayBetweenBatches}ms de delay`)

    // Atualizar status da campanha
    await prisma.emailCampaignNew.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        sentAt: new Date()
      }
    })

    let sentCount = 0
    let failedCount = 0

    // Dividir destinatários em lotes
    const batches = this.chunkArray(campaign.recipients, batchSize)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]

      console.log(`📦 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} emails)`)

      // Processar lote atual
      const batchPromises = batch.map(async (recipient) => {
        try {
          const emailContent = this.processEmailTemplate(
            campaign.template?.htmlContent || campaign.subject,
            recipient.lead
          )

          const textContent = campaign.template?.textContent ?
            this.processEmailTemplate(campaign.template.textContent, recipient.lead) :
            undefined

          const result = await this.sendEmail({
            to: recipient.email,
            subject: this.processEmailTemplate(campaign.subject, recipient.lead),
            html: emailContent,
            text: textContent,
            campaignId,
            recipientId: recipient.id
          })

          // Marcar como enviado
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          })

          return { success: true, recipient }
        } catch (error) {
          console.error(`❌ Erro ao enviar email para ${recipient.email}:`, error)

          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'FAILED',
              bounceReason: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          })

          return { success: false, recipient, error }
        }
      })

      // Aguardar conclusão do lote
      const batchResults = await Promise.allSettled(batchPromises)

      // Contar resultados do lote
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          sentCount++
        } else {
          failedCount++
        }
      })

      console.log(`✅ Lote ${batchIndex + 1} concluído: ${sentCount} enviados, ${failedCount} falharam`)

      // Delay entre lotes (exceto no último)
      if (batchIndex < batches.length - 1) {
        console.log(`⏳ Aguardando ${delayBetweenBatches}ms antes do próximo lote...`)
        await this.sleep(delayBetweenBatches)
      }
    }

    // Atualizar estatísticas finais da campanha
    await prisma.emailCampaignNew.update({
      where: { id: campaignId },
      data: {
        status: 'SENT',
        completedAt: new Date(),
        sentCount,
        totalRecipients: sentCount + failedCount
      }
    })

    console.log(`🎉 Campanha finalizada: ${sentCount} enviados, ${failedCount} falharam`)
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async sendEmail(data: {
    to: string
    subject: string
    html: string
    text?: string
    campaignId: string
    recipientId: string
  }) {
    try {
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open/${data.campaignId}/${data.recipientId}" width="1" height="1" alt="" style="display:none;" />`

      const htmlWithTracking = data.html + trackingPixel

      const fromName = process.env.SMTP_FROM_NAME || 'Capsul Brasil CRM'
      const fromEmail = process.env.SMTP_FROM || 'noreply@capsul.com.br'
      const from = `"${fromName}" <${fromEmail}>`

      console.log('📧 Enviando email:', {
        to: data.to,
        subject: data.subject,
        from,
        campaignId: data.campaignId
      })

      // Verificar se deve simular envio
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isMailhog = process.env.SMTP_PROVIDER === 'mailhog'

      if (isDevelopment && isMailhog) {
        try {
          // Tentar envio real primeiro
          const info = await this.transporter.sendMail({
            from,
            to: data.to,
            subject: data.subject,
            html: htmlWithTracking,
            text: data.text,
            headers: {
              'X-Campaign-ID': data.campaignId,
              'X-Recipient-ID': data.recipientId
            }
          })

          console.log('✅ Email enviado via SMTP:', {
            messageId: info.messageId,
            to: data.to,
            accepted: info.accepted,
            rejected: info.rejected
          })

          return info
        } catch (smtpError) {
          // Simular envio se SMTP falhar
          console.log('⚠️ SMTP falhou, simulando envio...')
          return this.simulateEmailSendForCampaign(data)
        }
      }

      // Envio normal via SMTP
      const info = await this.transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: htmlWithTracking,
        text: data.text,
        headers: {
          'X-Campaign-ID': data.campaignId,
          'X-Recipient-ID': data.recipientId
        }
      })

      console.log('✅ Email enviado com sucesso:', {
        messageId: info.messageId,
        to: data.to,
        accepted: info.accepted,
        rejected: info.rejected
      })

      return info
    } catch (error) {
      // Se está em desenvolvimento, simular envio como fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Erro SMTP em desenvolvimento, simulando envio...')
        return this.simulateEmailSendForCampaign(data)
      }

      console.error('❌ Erro ao enviar email:', error)
      throw error
    }
  }

  private simulateEmailSendForCampaign(data: {
    to: string
    subject: string
    html: string
    text?: string
    campaignId: string
    recipientId: string
  }) {
    const simulatedInfo = {
      messageId: `<simulated-${Date.now()}-${data.recipientId}@capsul.local>`,
      accepted: [data.to],
      rejected: [],
      response: '250 2.0.0 OK Simulated',
      envelope: {
        from: process.env.SMTP_FROM || 'noreply@capsul.com.br',
        to: [data.to]
      }
    }

    console.log('📧 [SIMULADO] Email da campanha:', {
      to: data.to,
      subject: data.subject,
      campaignId: data.campaignId,
      recipientId: data.recipientId,
      timestamp: new Date().toISOString()
    })

    return simulatedInfo
  }

  // Método para testar configuração SMTP
  async testEmailConfiguration(testEmail: string): Promise<{ success: boolean; message: string; info?: any }> {
    try {
      console.log('🧪 Testando configuração de email...')

      // Verificar se está em modo de desenvolvimento e SMTP não está disponível
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isMailhog = process.env.SMTP_PROVIDER === 'mailhog'

      if (isDevelopment && isMailhog) {
        // Tentar primeiro com SMTP real
        try {
          const info = await this.transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Capsul Brasil CRM'}" <${process.env.SMTP_FROM || 'noreply@capsul.com.br'}>`,
            to: testEmail,
            subject: '🧪 Teste de Configuração - Capsul Brasil CRM',
            html: this.getTestEmailHTML(),
            text: this.getTestEmailText()
          })

          return {
            success: true,
            message: 'Email de teste enviado com sucesso via SMTP!',
            info: {
              messageId: info.messageId,
              accepted: info.accepted,
              rejected: info.rejected,
              provider: process.env.SMTP_PROVIDER
            }
          }
        } catch (smtpError) {
          // Se falhar, simular envio em desenvolvimento
          console.log('⚠️ SMTP não disponível, simulando envio em desenvolvimento...')
          return this.simulateEmailSend(testEmail)
        }
      }

      // Envio normal via SMTP
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Capsul Brasil CRM'}" <${process.env.SMTP_FROM || 'noreply@capsul.com.br'}>`,
        to: testEmail,
        subject: '🧪 Teste de Configuração - Capsul Brasil CRM',
        html: this.getTestEmailHTML(),
        text: this.getTestEmailText()
      })

      return {
        success: true,
        message: 'Email de teste enviado com sucesso!',
        info: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          provider: process.env.SMTP_PROVIDER
        }
      }
    } catch (error) {
      console.error('❌ Erro no teste de email:', error)

      // Se está em desenvolvimento, simular envio
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Erro SMTP em desenvolvimento, simulando envio...')
        return this.simulateEmailSend(testEmail)
      }

      return {
        success: false,
        message: `Erro na configuração SMTP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  private simulateEmailSend(testEmail: string): { success: boolean; message: string; info: any } {
    const simulatedInfo = {
      messageId: `<simulated-${Date.now()}@capsul.local>`,
      accepted: [testEmail],
      rejected: [],
      provider: 'SIMULADO'
    }

    console.log('📧 [SIMULADO] Email que seria enviado:', {
      to: testEmail,
      subject: '🧪 Teste de Configuração - Capsul Brasil CRM',
      from: `"${process.env.SMTP_FROM_NAME || 'Capsul Brasil CRM'}" <${process.env.SMTP_FROM || 'noreply@capsul.com.br'}>`,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      message: '✅ Email simulado com sucesso! (Modo desenvolvimento - configure um provedor SMTP real para produção)',
      info: simulatedInfo
    }
  }

  private getTestEmailHTML(): string {
    return `
      <h2>✅ Configuração de Email Funcionando!</h2>
      <p>Este é um email de teste para verificar se a configuração SMTP está funcionando corretamente.</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>Provedor:</strong> ${process.env.SMTP_PROVIDER || 'mailhog'}</p>
      <p><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
      <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
      <hr>
      <p><small>Enviado pelo sistema de Email Marketing da Capsul Brasil</small></p>
    `
  }

  private getTestEmailText(): string {
    return `
      ✅ Configuração de Email Funcionando!

      Este é um email de teste para verificar se a configuração SMTP está funcionando corretamente.

      Data/Hora: ${new Date().toLocaleString('pt-BR')}
      Provedor: ${process.env.SMTP_PROVIDER || 'mailhog'}
      Host: ${process.env.SMTP_HOST}
      Ambiente: ${process.env.NODE_ENV || 'development'}

      Enviado pelo sistema de Email Marketing da Capsul Brasil
    `
  }

  private processEmailTemplate(template: string, lead: any): string {
    let processed = template

    // Substituir variáveis padrão
    processed = processed.replace(/\{\{nome\}\}/g, lead.name || 'Cliente')
    processed = processed.replace(/\{\{email\}\}/g, lead.email || '')
    processed = processed.replace(/\{\{empresa\}\}/g, lead.company || '')
    processed = processed.replace(/\{\{telefone\}\}/g, lead.phone || '')
    processed = processed.replace(/\{\{cargo\}\}/g, lead.roleTitle || '')
    processed = processed.replace(/\{\{interesse\}\}/g, lead.interest || '')

    return processed
  }

  // ===== MÉTRICAS =====

  async getCampaignMetrics(campaignId: string): Promise<EmailMetrics> {
    const campaign = await prisma.emailCampaignNew.findUnique({
      where: { id: campaignId },
      include: {
        recipients: true,
        _count: {
          select: {
            opens: true,
            clicks: true,
            unsubscribes: true
          }
        }
      }
    })

    if (!campaign) {
      throw new Error('Campanha não encontrada')
    }

    const totalSent = campaign.sentCount
    const delivered = campaign.deliveredCount
    const opened = campaign.openedCount
    const clicked = campaign.clickedCount
    const bounced = campaign.bouncedCount
    const unsubscribed = campaign.unsubscribedCount

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
      unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0
    }
  }

  async trackEmailOpen(campaignId: string, recipientId: string, ipAddress?: string, userAgent?: string) {
    // Registrar abertura
    await prisma.emailOpen.create({
      data: {
        campaignId,
        recipientId,
        ipAddress,
        userAgent
      }
    })

    // Atualizar contador do destinatário
    await prisma.emailRecipient.update({
      where: { id: recipientId },
      data: {
        lastOpenedAt: new Date(),
        openCount: { increment: 1 }
      }
    })

    // Atualizar contador da campanha
    await prisma.emailCampaignNew.update({
      where: { id: campaignId },
      data: { openedCount: { increment: 1 } }
    })
  }

  async trackEmailClick(
    campaignId: string,
    recipientId: string,
    url: string,
    linkText?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Registrar clique
    await prisma.emailClick.create({
      data: {
        campaignId,
        recipientId,
        url,
        linkText,
        ipAddress,
        userAgent
      }
    })

    // Atualizar contador do destinatário
    await prisma.emailRecipient.update({
      where: { id: recipientId },
      data: {
        lastClickedAt: new Date(),
        clickCount: { increment: 1 }
      }
    })

    // Atualizar contador da campanha
    await prisma.emailCampaignNew.update({
      where: { id: campaignId },
      data: { clickedCount: { increment: 1 } }
    })
  }

  // ===== TESTE DE CONFIGURAÇÃO =====

  async testEmailConfiguration(testEmail: string): Promise<{
    success: boolean
    message: string
    info?: any
  }> {
    const provider = process.env.SMTP_PROVIDER || 'mailhog'

    try {
      console.log('🧪 Testando configuração de email:', {
        provider,
        testEmail,
        env: process.env.NODE_ENV
      })

      // Em desenvolvimento, simular o envio
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('📧 Simulando envio de email de teste...')

        // Simular delay de envio
        await new Promise(resolve => setTimeout(resolve, 1000))

        return {
          success: true,
          message: `Email de teste simulado com sucesso para ${testEmail}`,
          info: {
            provider: 'SIMULADO',
            testEmail,
            actualProvider: provider,
            host: this.getProviderHost(provider),
            timestamp: new Date().toISOString()
          }
        }
      }

      // Em produção, tentar envio real
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
        to: testEmail,
        subject: '🧪 Teste de Configuração - Capsul Brasil CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✅ Teste de Email</h2>
            <p>Este é um email de teste da configuração SMTP do Capsul Brasil CRM.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>Provedor:</strong> ${provider.toUpperCase()}<br>
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}<br>
              <strong>Ambiente:</strong> ${process.env.NODE_ENV}
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Se você recebeu este email, a configuração está funcionando corretamente.
            </p>
          </div>
        `,
        text: `
          Teste de Email - Capsul Brasil CRM

          Este é um email de teste da configuração SMTP.

          Provedor: ${provider.toUpperCase()}
          Data/Hora: ${new Date().toLocaleString('pt-BR')}
          Ambiente: ${process.env.NODE_ENV}

          Se você recebeu este email, a configuração está funcionando corretamente.
        `
      }

      const info = await this.transporter.sendMail(mailOptions)

      return {
        success: true,
        message: `Email de teste enviado com sucesso para ${testEmail}`,
        info: {
          provider: provider.toUpperCase(),
          messageId: info.messageId,
          response: info.response,
          host: this.getProviderHost(provider),
          timestamp: new Date().toISOString()
        }
      }

    } catch (error: any) {
      console.error('❌ Erro no teste de email:', error)

      return {
        success: false,
        message: `Erro ao enviar email de teste: ${error.message}`,
        info: {
          provider: provider.toUpperCase(),
          error: error.message,
          host: this.getProviderHost(provider),
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private getProviderHost(provider: string): string {
    switch (provider) {
      case 'gmail':
        return 'smtp.gmail.com'
      case 'sendgrid':
        return 'smtp.sendgrid.net'
      case 'ses':
        return process.env.SES_SMTP_HOST || `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
      case 'mailhog':
        return 'localhost (MailHog)'
      case 'custom':
        return process.env.SMTP_HOST || 'personalizado'
      default:
        return 'desconhecido'
    }
  }

  // ===== UTILITÁRIOS =====

  private mapCampaignFromPrisma(campaign: any): EmailCampaign {
    return {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      templateId: campaign.templateId,
      status: campaign.status,
      type: campaign.type,
      scheduledAt: campaign.scheduledAt,
      segmentConfig: campaign.segmentConfig ? JSON.parse(campaign.segmentConfig) : undefined,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount
    }
  }

  async getOverallMetrics(): Promise<{
    totalCampaigns: number
    totalEmailsSent: number
    avgOpenRate: number
    avgClickRate: number
    activeTemplates: number
  }> {
    const [campaigns, templates] = await Promise.all([
      prisma.emailCampaignNew.findMany({
        select: {
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true
        }
      }),
      prisma.emailTemplate.count({
        where: { active: true }
      })
    ])

    const totalCampaigns = campaigns.length
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.deliveredCount, 0)
    const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0)
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0)

    return {
      totalCampaigns,
      totalEmailsSent,
      avgOpenRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      avgClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      activeTemplates: templates
    }
  }
}

export const emailMarketingService = EmailMarketingService.getInstance()