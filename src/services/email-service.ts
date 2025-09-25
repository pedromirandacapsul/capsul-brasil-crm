import nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import { prisma } from '@/lib/prisma';

interface EmailOptions {
  leadId?: string;
  campaignId?: string;
  workflowExecutionId?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private provider: 'ses' | 'smtp';

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER === 'smtp' ? 'smtp' : 'ses';
    this.setupTransporter();
  }

  private setupTransporter() {
    if (this.provider === 'ses') {
      // Configuração AWS SES
      const ses = new aws.SES({
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      this.transporter = nodemailer.createTransporter({
        SES: { ses, aws },
      });

      console.log('🔧 Configurando SMTP:', {
        provider: 'ses',
        host: `email-smtp.${process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
        port: '587',
        from: process.env.EMAIL_FROM
      });
    } else {
      // Configuração SMTP tradicional
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log('🔧 Configurando SMTP:', {
        provider: 'smtp',
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.EMAIL_FROM
      });
    }
  }

  // Função para remover HTML e converter para texto
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string,
    options?: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Configuração do email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
        headers: {
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe>`,
          'X-Campaign-ID': options?.campaignId || '',
          'X-Lead-ID': options?.leadId || ''
        }
      };

      console.log('📧 Enviando email:', {
        to,
        subject: subject.substring(0, 50) + '...',
        provider: this.provider
      });

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email enviado:', {
        messageId: info.messageId,
        to,
        provider: this.provider
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao enviar email'
      };
    }
  }

  async sendBulkEmail(
    recipients: Array<{
      email: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      leadId?: string;
    }>,
    campaignId?: string
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    console.log(`📨 Iniciando envio em lote: ${recipients.length} emails`);

    // Rate limiting - 1 email por segundo para SES Sandbox
    const delay = this.provider === 'ses' ? 1000 : 100;

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(
          recipient.email,
          recipient.subject,
          recipient.htmlContent,
          recipient.textContent,
          { leadId: recipient.leadId, campaignId }
        );

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            email: recipient.email,
            error: result.error || 'Erro desconhecido'
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message || 'Erro desconhecido'
        });
      }

      // Delay entre emails
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`📊 Resultado do envio em lote:`, {
      total: recipients.length,
      sent: results.sent,
      failed: results.failed
    });

    return results;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexão de email verificada');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão de email:', error);
      return false;
    }
  }
}

// Instância singleton
export const emailService = new EmailService();