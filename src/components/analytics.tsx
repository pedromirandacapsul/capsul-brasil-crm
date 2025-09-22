'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

export function Analytics() {
  useEffect(() => {
    // Mock analytics in development
    if (process.env.NODE_ENV === 'development' || process.env.ANALYTICS_MOCK === '1') {
      // Mock GTM/GA4
      window.gtag = (...args) => {
        console.log('🔍 [Analytics Mock] GTM/GA4:', args)
      }

      // Mock Meta Pixel
      window.fbq = (...args) => {
        console.log('🔍 [Analytics Mock] Meta Pixel:', args)
      }

      return
    }

    // Production analytics setup would go here
    // GTM/GA4 setup
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID
    if (gtmId) {
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gtmId}`
      script.async = true
      document.head.appendChild(script)

      window.dataLayer = window.dataLayer || []
      window.gtag = function() {
        window.dataLayer?.push(arguments)
      }
      window.gtag('js', new Date())
      window.gtag('config', gtmId)
    }

    // Meta Pixel setup
    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (metaPixelId) {
      const script = document.createElement('script')
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `
      document.head.appendChild(script)
    }
  }, [])

  return null
}

// Analytics helper functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // GTM/GA4
    if (window.gtag) {
      window.gtag('event', eventName, properties)
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', eventName, properties)
    }

    // Save to local analytics table in development
    if (process.env.NODE_ENV === 'development') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error)
    }
  }
}

export const trackLeadCreated = (leadData: Record<string, any>) => {
  trackEvent('lead_created', {
    source: leadData.source,
    utm_source: leadData.utmSource,
    utm_medium: leadData.utmMedium,
    utm_campaign: leadData.utmCampaign,
  })
}

export const trackFormSubmission = (formName: string, formData?: Record<string, any>) => {
  trackEvent('form_submission', {
    form_name: formName,
    ...formData,
  })
}