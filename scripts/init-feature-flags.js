const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initializeFeatureFlags() {
  console.log('🚀 Inicializando Feature Flags...')

  const defaultFlags = [
    {
      name: 'ads_integration',
      description: 'Integração com Meta CAPI e Google Ads para tracking de conversões',
      enabled: false,
      config: JSON.stringify({
        meta_pixel_id: '',
        meta_access_token: '',
        google_ads_customer_id: '',
        google_ads_conversion_action_id: '',
      }),
    },
    {
      name: 'auto_lead_scoring',
      description: 'Sistema automático de pontuação de leads',
      enabled: false,
      config: JSON.stringify({
        source_multipliers: {
          'Google Ads': 1.2,
          'Facebook Ads': 1.1,
          'Website': 1.0,
          'Referral': 1.3,
        },
      }),
    },
    {
      name: 'advanced_pipeline',
      description: 'Pipeline avançado com probabilidades e valores ponderados',
      enabled: false,
      config: null,
    },
    {
      name: 'inbox_whatsapp',
      description: 'Inbox nativo para WhatsApp Business API',
      enabled: false,
      config: JSON.stringify({
        whatsapp_business_account_id: '',
        whatsapp_phone_number_id: '',
        whatsapp_access_token: '',
      }),
    },
    {
      name: 'inbox_email',
      description: 'Inbox nativo para e-mails',
      enabled: false,
      config: JSON.stringify({
        smtp_host: 'localhost',
        smtp_port: 1025,
        smtp_user: '',
        smtp_pass: '',
      }),
    },
    {
      name: 'workflow_automation',
      description: 'Workflows visuais para automação de marketing',
      enabled: false,
      config: null,
    },
    {
      name: 'calendar_integration',
      description: 'Calendário com integração Google Meet',
      enabled: false,
      config: JSON.stringify({
        google_calendar_api_key: '',
        google_calendar_client_id: '',
      }),
    },
    {
      name: 'heatmap_tracking',
      description: 'Heatmap e análise de comportamento de usuário',
      enabled: false,
      config: null,
    },
    {
      name: 'internal_chat',
      description: 'Chat interno para colaboração da equipe',
      enabled: false,
      config: null,
    },
    {
      name: 'email_campaigns',
      description: 'Sistema de campanhas de e-mail (Mini-ActiveCampaign)',
      enabled: false,
      config: null,
    },
    {
      name: 'sales_celebration',
      description: 'Mini-game de celebração pós-venda',
      enabled: false,
      config: null,
    },
  ]

  try {
    for (const flag of defaultFlags) {
      const existing = await prisma.featureFlag.findUnique({
        where: { name: flag.name },
      })

      if (!existing) {
        await prisma.featureFlag.create({
          data: flag,
        })
        console.log(`✅ Feature flag '${flag.name}' created`)
      } else {
        console.log(`⚠️  Feature flag '${flag.name}' already exists`)
      }
    }

    console.log('🎉 Feature flags initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing feature flags:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initializeFeatureFlags()