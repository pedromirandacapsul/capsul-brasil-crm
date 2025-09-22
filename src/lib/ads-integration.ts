import { FeatureFlagService } from '@/lib/feature-flags'

interface MetaConversionEvent {
  event_name: 'Lead' | 'CompleteRegistration' | 'Purchase'
  event_time: number
  action_source: 'website'
  user_data: {
    em?: string // email hash
    ph?: string // phone hash
    fn?: string // first name hash
    ln?: string // last name hash
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string // Facebook click ID
    fbp?: string // Facebook browser ID
  }
  custom_data: {
    currency?: string
    value?: number
    content_name?: string
    content_category?: string
  }
  event_source_url?: string
}

interface GoogleAdsConversion {
  conversion_action: string
  conversion_date_time: string
  conversion_value?: number
  currency_code?: string
  order_id?: string
  gclid?: string // Google Click ID
}

export class AdsIntegrationService {
  /**
   * Envia evento de conversão para Meta CAPI
   */
  static async sendMetaConversion(leadData: {
    email?: string
    phone?: string
    name?: string
    value?: number
    eventType: 'Lead' | 'CompleteRegistration' | 'Purchase'
    sourceUrl?: string
    userAgent?: string
    clientIp?: string
    fbc?: string
    fbp?: string
  }) {
    try {
      const isEnabled = await FeatureFlagService.isEnabled('ads_integration')
      if (!isEnabled) {
        console.log('Meta CAPI integration disabled via feature flag')
        return { success: false, reason: 'feature_disabled' }
      }

      const config = await FeatureFlagService.getConfig<{
        meta_pixel_id: string
        meta_access_token: string
      }>('ads_integration')

      if (!config?.meta_pixel_id || !config?.meta_access_token) {
        console.log('Meta CAPI not configured')
        return { success: false, reason: 'not_configured' }
      }

      // Hash dos dados pessoais (SHA-256)
      const hashData = (data: string) => {
        if (typeof window !== 'undefined') {
          // No browser, usar Web Crypto API
          return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.toLowerCase().trim()))
            .then(buffer => Array.from(new Uint8Array(buffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(''))
        } else {
          // No servidor, usar crypto do Node.js
          const crypto = require('crypto')
          return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex')
        }
      }

      const event: MetaConversionEvent = {
        event_name: leadData.eventType,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {},
        custom_data: {},
      }

      // Hash dos dados do usuário
      if (leadData.email) {
        event.user_data.em = await hashData(leadData.email)
      }
      if (leadData.phone) {
        event.user_data.ph = await hashData(leadData.phone.replace(/[^\d]/g, ''))
      }
      if (leadData.name) {
        const nameParts = leadData.name.split(' ')
        event.user_data.fn = await hashData(nameParts[0])
        if (nameParts.length > 1) {
          event.user_data.ln = await hashData(nameParts[nameParts.length - 1])
        }
      }

      if (leadData.clientIp) event.user_data.client_ip_address = leadData.clientIp
      if (leadData.userAgent) event.user_data.client_user_agent = leadData.userAgent
      if (leadData.fbc) event.user_data.fbc = leadData.fbc
      if (leadData.fbp) event.user_data.fbp = leadData.fbp

      // Dados customizados
      if (leadData.value) {
        event.custom_data.value = leadData.value
        event.custom_data.currency = 'BRL'
      }

      if (leadData.sourceUrl) {
        event.event_source_url = leadData.sourceUrl
      }

      // Enviar para Meta
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.meta_pixel_id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.meta_access_token}`,
        },
        body: JSON.stringify({
          data: [event],
          test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        console.log('Meta CAPI event sent successfully:', result)
        return { success: true, data: result }
      } else {
        console.error('Meta CAPI error:', result)
        return { success: false, error: result }
      }
    } catch (error) {
      console.error('Error sending Meta CAPI event:', error)
      return { success: false, error }
    }
  }

  /**
   * Envia conversão offline para Google Ads
   */
  static async sendGoogleAdsConversion(conversionData: {
    gclid?: string
    conversionValue?: number
    orderId?: string
    conversionDateTime?: Date
  }) {
    try {
      const isEnabled = await FeatureFlagService.isEnabled('ads_integration')
      if (!isEnabled) {
        console.log('Google Ads integration disabled via feature flag')
        return { success: false, reason: 'feature_disabled' }
      }

      const config = await FeatureFlagService.getConfig<{
        google_ads_customer_id: string
        google_ads_conversion_action_id: string
      }>('ads_integration')

      if (!config?.google_ads_customer_id || !config?.google_ads_conversion_action_id) {
        console.log('Google Ads not configured')
        return { success: false, reason: 'not_configured' }
      }

      if (!conversionData.gclid) {
        console.log('No GCLID provided for Google Ads conversion')
        return { success: false, reason: 'no_gclid' }
      }

      // Em produção, aqui você usaria a Google Ads API
      // Por enquanto, apenas logamos
      console.log('Google Ads conversion (would be sent in production):', {
        customer_id: config.google_ads_customer_id,
        conversion_action: config.google_ads_conversion_action_id,
        gclid: conversionData.gclid,
        conversion_value: conversionData.conversionValue,
        conversion_date_time: conversionData.conversionDateTime?.toISOString(),
        order_id: conversionData.orderId,
      })

      // TODO: Implementar Google Ads API quando em produção
      return { success: true, data: 'logged_for_development' }
    } catch (error) {
      console.error('Error sending Google Ads conversion:', error)
      return { success: false, error }
    }
  }

  /**
   * Processa conversão de lead automaticamente
   */
  static async processLeadConversion(leadId: string, eventType: 'Lead' | 'CompleteRegistration' | 'Purchase') {
    try {
      const { prisma } = await import('@/lib/prisma')

      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      })

      if (!lead) {
        throw new Error('Lead not found')
      }

      const conversionValue = eventType === 'Purchase' ? lead.dealValue : (eventType === 'CompleteRegistration' ? 50 : 25)

      // Enviar para Meta CAPI
      const metaResult = await this.sendMetaConversion({
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        name: lead.name,
        value: conversionValue || undefined,
        eventType,
        sourceUrl: lead.utmSource ? `https://example.com?utm_source=${lead.utmSource}` : undefined,
      })

      // Enviar para Google Ads (se houver GCLID)
      let googleResult = null
      if (lead.adCampaignId?.startsWith('gclid_')) {
        const gclid = lead.adCampaignId.replace('gclid_', '')
        googleResult = await this.sendGoogleAdsConversion({
          gclid,
          conversionValue: conversionValue || undefined,
          orderId: leadId,
          conversionDateTime: new Date(),
        })
      }

      // Atualizar lead como tracked
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          conversionTracked: true,
          conversionValue: conversionValue || lead.conversionValue,
        },
      })

      return {
        success: true,
        meta: metaResult,
        google: googleResult,
      }
    } catch (error) {
      console.error('Error processing lead conversion:', error)
      return { success: false, error }
    }
  }

  /**
   * Captura UTMs e dados de tracking do request
   */
  static extractTrackingData(request: Request) {
    const url = new URL(request.url)
    const headers = request.headers

    return {
      utmSource: url.searchParams.get('utm_source'),
      utmMedium: url.searchParams.get('utm_medium'),
      utmCampaign: url.searchParams.get('utm_campaign'),
      utmTerm: url.searchParams.get('utm_term'),
      utmContent: url.searchParams.get('utm_content'),
      gclid: url.searchParams.get('gclid'),
      fbclid: url.searchParams.get('fbclid'),
      referrer: headers.get('referer'),
      userAgent: headers.get('user-agent'),
      clientIp: headers.get('x-forwarded-for') || headers.get('x-real-ip'),
    }
  }
}