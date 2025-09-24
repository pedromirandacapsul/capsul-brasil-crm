/**
 * AWS SES Service - Integração avançada via AWS SDK
 * Oferece recursos mais poderosos que o SMTP tradicional
 */

import { SESClient, SendEmailCommand, GetSendQuotaCommand, GetSendStatisticsCommand, ListVerifiedEmailAddressesCommand, VerifyEmailIdentityCommand, DeleteVerifiedEmailAddressCommand, CreateTemplateCommand, UpdateTemplateCommand, DeleteTemplateCommand, ListTemplatesCommand, SendTemplatedEmailCommand, SendBulkTemplatedEmailCommand } from '@aws-sdk/client-ses'
import { SESv2Client, GetAccountCommand, GetConfigurationSetCommand, PutConfigurationSetCommand, PutConfigurationSetEventDestinationCommand, SendBulkEmailCommand } from '@aws-sdk/client-sesv2'
import { prisma } from '@/lib/prisma'

interface SESConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

interface SESQuota {
  max24HourSend: number
  maxSendRate: number
  sentLast24Hours: number
}

interface SESStatistics {
  timestamp: Date
  deliveryAttempts: number
  bounces: number
  complaints: number
  rejects: number
}

interface SESTemplate {
  templateName: string
  subject: string
  htmlPart?: string
  textPart?: string
}

export class AWSSESService {
  private static instance: AWSSESService
  private sesClient: SESClient
  private sesv2Client: SESv2Client
  private config: SESConfig

  private constructor() {
    this.config = this.loadConfig()
    this.sesClient = new SESClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    })
    this.sesv2Client = new SESv2Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    })
  }

  private loadConfig(): SESConfig {
    const region = process.env.AWS_REGION || 'us-east-1'
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY
    const secretAccessKey = process.env.AWS_SES_SECRET_KEY

    // Em desenvolvimento, permitir credenciais vazias e simular
    if (!accessKeyId || !secretAccessKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ AWS SES credentials não configuradas, usando modo simulado em desenvolvimento')
        return {
          region,
          accessKeyId: 'MOCK_ACCESS_KEY',
          secretAccessKey: 'MOCK_SECRET_KEY'
        }
      } else {
        throw new Error('AWS SES credentials não configuradas. Configure AWS_SES_ACCESS_KEY e AWS_SES_SECRET_KEY.')
      }
    }

    return {
      region,
      accessKeyId,
      secretAccessKey
    }
  }

  public static getInstance(): AWSSESService {
    if (!AWSSESService.instance) {
      AWSSESService.instance = new AWSSESService()
    }
    return AWSSESService.instance
  }

  // ===== ENVIO DE EMAILS =====

  async sendEmail(params: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    htmlBody?: string
    textBody?: string
    fromEmail?: string
    fromName?: string
    replyTo?: string[]
    tags?: Record<string, string>
  }): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const fromEmail = params.fromEmail || process.env.SMTP_FROM!
      const fromName = params.fromName || process.env.SMTP_FROM_NAME
      const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail

      const command = new SendEmailCommand({
        Source: source,
        Destination: {
          ToAddresses: params.to,
          CcAddresses: params.cc,
          BccAddresses: params.bcc
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: params.htmlBody ? {
              Data: params.htmlBody,
              Charset: 'UTF-8'
            } : undefined,
            Text: params.textBody ? {
              Data: params.textBody,
              Charset: 'UTF-8'
            } : undefined
          }
        },
        ReplyToAddresses: params.replyTo,
        Tags: params.tags ? Object.entries(params.tags).map(([name, value]) => ({
          Name: name,
          Value: value
        })) : undefined
      })

      const result = await this.sesClient.send(command)

      console.log('📧 Email enviado via SES API:', {
        messageId: result.MessageId,
        to: params.to,
        subject: params.subject
      })

      return {
        success: true,
        messageId: result.MessageId
      }
    } catch (error: any) {
      console.error('❌ Erro no envio via SES API:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async sendBulkEmail(params: {
    template?: string
    destinations: Array<{
      email: string
      replacementData?: Record<string, string>
    }>
    subject?: string
    htmlBody?: string
    textBody?: string
    fromEmail?: string
    fromName?: string
    tags?: Record<string, string>
  }): Promise<{
    success: boolean
    results: Array<{
      email: string
      messageId?: string
      error?: string
    }>
  }> {
    try {
      const fromEmail = params.fromEmail || process.env.SMTP_FROM!
      const fromName = params.fromName || process.env.SMTP_FROM_NAME
      const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail

      if (params.template) {
        // Usar template do SES
        const command = new SendBulkTemplatedEmailCommand({
          Source: source,
          Template: params.template,
          Destinations: params.destinations.map(dest => ({
            Destination: {
              ToAddresses: [dest.email]
            },
            ReplacementTemplateData: JSON.stringify(dest.replacementData || {})
          })),
          Tags: params.tags ? Object.entries(params.tags).map(([name, value]) => ({
            Name: name,
            Value: value
          })) : undefined
        })

        const result = await this.sesClient.send(command)

        return {
          success: true,
          results: result.Status?.map((status, index) => ({
            email: params.destinations[index].email,
            messageId: status.MessageId,
            error: status.Status === 'Success' ? undefined : status.Status
          })) || []
        }
      } else {
        // Envio em lote tradicional usando SESv2
        const command = new SendBulkEmailCommand({
          FromEmailAddress: source,
          Destinations: params.destinations.map(dest => ({
            Destination: {
              ToAddresses: [dest.email]
            },
            ReplacementEmailContent: dest.replacementData ? {
              ReplacementTemplateData: JSON.stringify(dest.replacementData)
            } : undefined
          })),
          DefaultContent: {
            Simple: {
              Subject: {
                Data: params.subject!,
                Charset: 'UTF-8'
              },
              Body: {
                Html: params.htmlBody ? {
                  Data: params.htmlBody,
                  Charset: 'UTF-8'
                } : undefined,
                Text: params.textBody ? {
                  Data: params.textBody,
                  Charset: 'UTF-8'
                } : undefined
              }
            }
          },
          DefaultEmailTags: params.tags ? Object.entries(params.tags).map(([name, value]) => ({
            Name: name,
            Value: value
          })) : undefined
        })

        const result = await this.sesv2Client.send(command)

        return {
          success: true,
          results: result.MessageId ? params.destinations.map((dest, index) => ({
            email: dest.email,
            messageId: result.MessageId,
            error: undefined
          })) : params.destinations.map(dest => ({
            email: dest.email,
            error: 'Envio falhou'
          }))
        }
      }
    } catch (error: any) {
      console.error('❌ Erro no envio em lote via SES API:', error)
      return {
        success: false,
        results: params.destinations.map(dest => ({
          email: dest.email,
          error: error.message
        }))
      }
    }
  }

  // ===== GESTÃO DE TEMPLATES =====

  async createTemplate(template: SESTemplate): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const command = new CreateTemplateCommand({
        Template: {
          TemplateName: template.templateName,
          SubjectPart: template.subject,
          HtmlPart: template.htmlPart,
          TextPart: template.textPart
        }
      })

      await this.sesClient.send(command)

      console.log('📝 Template SES criado:', template.templateName)

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao criar template SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateTemplate(template: SESTemplate): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const command = new UpdateTemplateCommand({
        Template: {
          TemplateName: template.templateName,
          SubjectPart: template.subject,
          HtmlPart: template.htmlPart,
          TextPart: template.textPart
        }
      })

      await this.sesClient.send(command)

      console.log('✏️ Template SES atualizado:', template.templateName)

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar template SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteTemplate(templateName: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const command = new DeleteTemplateCommand({
        TemplateName: templateName
      })

      await this.sesClient.send(command)

      console.log('🗑️ Template SES removido:', templateName)

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao remover template SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async listTemplates(): Promise<{
    success: boolean
    templates?: string[]
    error?: string
  }> {
    try {
      const command = new ListTemplatesCommand({})
      const result = await this.sesClient.send(command)

      return {
        success: true,
        templates: result.TemplatesMetadata?.map(t => t.Name!) || []
      }
    } catch (error: any) {
      console.error('❌ Erro ao listar templates SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ===== MÉTRICAS E QUOTAS =====

  async getQuota(): Promise<{
    success: boolean
    quota?: SESQuota
    error?: string
  }> {
    try {
      const command = new GetSendQuotaCommand({})
      const result = await this.sesClient.send(command)

      return {
        success: true,
        quota: {
          max24HourSend: result.Max24HourSend || 0,
          maxSendRate: result.MaxSendRate || 0,
          sentLast24Hours: result.SentLast24Hours || 0
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao obter quota SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getStatistics(): Promise<{
    success: boolean
    statistics?: SESStatistics[]
    error?: string
  }> {
    try {
      const command = new GetSendStatisticsCommand({})
      const result = await this.sesClient.send(command)

      return {
        success: true,
        statistics: result.SendDataPoints?.map(point => ({
          timestamp: point.Timestamp!,
          deliveryAttempts: point.DeliveryAttempts || 0,
          bounces: point.Bounces || 0,
          complaints: point.Complaints || 0,
          rejects: point.Rejects || 0
        })) || []
      }
    } catch (error: any) {
      console.error('❌ Erro ao obter estatísticas SES:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ===== VERIFICAÇÃO DE IDENTIDADES =====

  async listVerifiedEmails(): Promise<{
    success: boolean
    emails?: string[]
    error?: string
  }> {
    try {
      const command = new ListVerifiedEmailAddressesCommand({})
      const result = await this.sesClient.send(command)

      return {
        success: true,
        emails: result.VerifiedEmailAddresses || []
      }
    } catch (error: any) {
      console.error('❌ Erro ao listar emails verificados:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async verifyEmail(email: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: email
      })

      await this.sesClient.send(command)

      console.log('✅ Solicitação de verificação enviada para:', email)

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao solicitar verificação:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteVerifiedEmail(email: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const command = new DeleteVerifiedEmailAddressCommand({
        EmailAddress: email
      })

      await this.sesClient.send(command)

      console.log('🗑️ Email removido das identidades verificadas:', email)

      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao remover email verificado:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ===== TESTE DE CONFIGURAÇÃO =====

  async testConfiguration(testEmail: string): Promise<{
    success: boolean
    message: string
    details?: any
  }> {
    try {
      // Em desenvolvimento com credenciais mock, simular
      if (this.config.accessKeyId === 'MOCK_ACCESS_KEY') {
        console.log('📧 Simulando teste AWS SES API em desenvolvimento...')

        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        return {
          success: true,
          message: `Teste AWS SES API simulado com sucesso para ${testEmail}`,
          details: {
            method: 'AWS SES API (SIMULADO)',
            region: this.config.region,
            messageId: 'sim-' + Date.now(),
            quota: {
              max24HourSend: 200,
              maxSendRate: 1,
              sentLast24Hours: 0
            },
            timestamp: new Date().toISOString()
          }
        }
      }

      // Primeiro, verificar quota
      const quotaResult = await this.getQuota()
      if (!quotaResult.success) {
        return {
          success: false,
          message: 'Erro ao verificar quota SES: ' + quotaResult.error
        }
      }

      // Tentar enviar email de teste
      const emailResult = await this.sendEmail({
        to: [testEmail],
        subject: '🧪 Teste AWS SES API - Capsul Brasil CRM',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✅ Teste AWS SES API</h2>
            <p>Este email foi enviado via <strong>AWS SES API</strong> (não SMTP).</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>Método:</strong> AWS SDK v3<br>
              <strong>Região:</strong> ${this.config.region}<br>
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}<br>
              <strong>Quota diária:</strong> ${quotaResult.quota?.max24HourSend} emails<br>
              <strong>Taxa máxima:</strong> ${quotaResult.quota?.maxSendRate} emails/seg
            </div>
            <p style="color: #16a34a; font-weight: bold;">
              ✅ AWS SES API funcionando perfeitamente!
            </p>
          </div>
        `,
        textBody: `
          Teste AWS SES API - Capsul Brasil CRM

          Este email foi enviado via AWS SES API (não SMTP).

          Método: AWS SDK v3
          Região: ${this.config.region}
          Data/Hora: ${new Date().toLocaleString('pt-BR')}
          Quota diária: ${quotaResult.quota?.max24HourSend} emails
          Taxa máxima: ${quotaResult.quota?.maxSendRate} emails/seg

          ✅ AWS SES API funcionando perfeitamente!
        `,
        tags: {
          tipo: 'teste',
          sistema: 'capsul-crm'
        }
      })

      if (emailResult.success) {
        return {
          success: true,
          message: `Email de teste AWS SES enviado com sucesso para ${testEmail}`,
          details: {
            messageId: emailResult.messageId,
            method: 'AWS SES API',
            region: this.config.region,
            quota: quotaResult.quota
          }
        }
      } else {
        return {
          success: false,
          message: 'Erro no envio via AWS SES: ' + emailResult.error
        }
      }
    } catch (error: any) {
      console.error('❌ Erro no teste AWS SES:', error)
      return {
        success: false,
        message: 'Erro na configuração AWS SES: ' + error.message
      }
    }
  }
}

export const awsSESService = AWSSESService.getInstance()