import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class EmailTrackingService {
  // Gerar ID único para cada envio
  generateTrackingId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // Injetar pixel de tracking no HTML
  injectTrackingPixel(html: string, trackingId: string): string {
    const pixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open/${trackingId}" width="1" height="1" style="display:none;border:0;" alt="" />`;

    // Adicionar antes do </body> se existir, senão no final
    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixel}</body>`);
    }
    return html + pixel;
  }

  // Rastrear todos os links no email
  trackLinks(html: string, trackingId: string): string {
    // Regex para encontrar todos os links
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;

    return html.replace(linkRegex, (match, url) => {
      // Não rastrear links mailto, tel, ou âncoras
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
        return match;
      }

      // Criar URL de tracking
      const trackedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;

      return match.replace(url, trackedUrl);
    });
  }

  // Adicionar link de unsubscribe
  addUnsubscribeLink(html: string, leadId: string): string {
    const unsubToken = crypto.createHash('sha256')
      .update(`${leadId}-${process.env.NEXTAUTH_SECRET}`)
      .digest('hex');

    const unsubLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${unsubToken}`;

    const unsubscribeHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #888;">
        <p>Você está recebendo este email porque se cadastrou em nosso site.</p>
        <p><a href="${unsubLink}" style="color: #888; text-decoration: underline;">Descadastrar</a></p>
      </div>
    `;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${unsubscribeHtml}</body>`);
    }
    return html + unsubscribeHtml;
  }

  // Processar email completo antes de enviar
  async prepareEmailForSending(
    html: string,
    leadId: string,
    campaignId?: string,
    workflowExecutionId?: string
  ): Promise<{ html: string; trackingId: string }> {
    // Criar registro de tracking
    const tracking = await prisma.emailTracking.create({
      data: {
        leadId,
        campaignId,
        workflowExecutionId,
        status: 'PENDING'
      }
    });

    let processedHtml = html;

    // 1. Adicionar pixel de tracking
    processedHtml = this.injectTrackingPixel(processedHtml, tracking.id);

    // 2. Rastrear links
    processedHtml = this.trackLinks(processedHtml, tracking.id);

    // 3. Adicionar unsubscribe
    processedHtml = this.addUnsubscribeLink(processedHtml, leadId);

    return {
      html: processedHtml,
      trackingId: tracking.id
    };
  }

  // Método auxiliar para gerar ID de tracking
  private generateTrackId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  // Método para remover HTML tags
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  // Método para validar URL
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}