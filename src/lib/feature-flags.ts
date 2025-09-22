import { prisma } from '@/lib/prisma'
import { FeatureFlagName, FeatureFlagConfig } from '@/types/feature-flags'

// Cache para feature flags (cache em memória por 5 minutos)
const flagCache = new Map<string, { value: boolean; config: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export class FeatureFlagService {
  /**
   * Verifica se uma feature flag está habilitada
   */
  static async isEnabled(name: FeatureFlagName): Promise<boolean> {
    try {
      const cached = flagCache.get(name)
      if (cached && cached.expires > Date.now()) {
        return cached.value
      }

      const flag = await prisma.featureFlag.findUnique({
        where: { name },
      })

      const enabled = flag?.enabled ?? false
      const config = flag?.config ? JSON.parse(flag.config) : null

      // Cache o resultado
      flagCache.set(name, {
        value: enabled,
        config,
        expires: Date.now() + CACHE_TTL,
      })

      return enabled
    } catch (error) {
      console.error(`Error checking feature flag ${name}:`, error)
      return false // Fail safe - se der erro, desabilita a feature
    }
  }

  /**
   * Pega a configuração de uma feature flag
   */
  static async getConfig<T = any>(name: FeatureFlagName): Promise<T | null> {
    try {
      const cached = flagCache.get(name)
      if (cached && cached.expires > Date.now()) {
        return cached.config
      }

      const flag = await prisma.featureFlag.findUnique({
        where: { name },
      })

      const config = flag?.config ? JSON.parse(flag.config) : null

      // Cache o resultado
      flagCache.set(name, {
        value: flag?.enabled ?? false,
        config,
        expires: Date.now() + CACHE_TTL,
      })

      return config
    } catch (error) {
      console.error(`Error getting feature flag config ${name}:`, error)
      return null
    }
  }

  /**
   * Lista todas as feature flags
   */
  static async getAll() {
    try {
      const flags = await prisma.featureFlag.findMany({
        orderBy: { name: 'asc' },
      })

      return flags.map(flag => ({
        ...flag,
        config: flag.config ? JSON.parse(flag.config) : null,
      }))
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      return []
    }
  }

  /**
   * Cria ou atualiza uma feature flag
   */
  static async upsert(
    name: FeatureFlagName,
    enabled: boolean,
    config?: FeatureFlagConfig,
    description?: string
  ) {
    try {
      const flag = await prisma.featureFlag.upsert({
        where: { name },
        create: {
          name,
          enabled,
          config: config ? JSON.stringify(config) : null,
          description,
        },
        update: {
          enabled,
          config: config ? JSON.stringify(config) : null,
          description,
          updatedAt: new Date(),
        },
      })

      // Limpa o cache para essa flag
      flagCache.delete(name)

      return {
        ...flag,
        config: flag.config ? JSON.parse(flag.config) : null,
      }
    } catch (error) {
      console.error(`Error upserting feature flag ${name}:`, error)
      throw error
    }
  }

  /**
   * Limpa o cache de feature flags
   */
  static clearCache() {
    flagCache.clear()
  }

  /**
   * Inicializa as feature flags padrão do sistema
   */
  static async initializeDefaults() {
    const defaultFlags: Array<{
      name: FeatureFlagName
      description: string
      enabled: boolean
      config?: FeatureFlagConfig
    }> = [
      {
        name: 'ads_integration',
        description: 'Integração com Meta CAPI e Google Ads para tracking de conversões',
        enabled: false,
        config: {
          meta_pixel_id: '',
          meta_access_token: '',
          google_ads_customer_id: '',
          google_ads_conversion_action_id: '',
        },
      },
      {
        name: 'auto_lead_scoring',
        description: 'Sistema automático de pontuação de leads',
        enabled: false,
        config: {
          source_multipliers: {
            'Google Ads': 1.2,
            'Facebook Ads': 1.1,
            'Website': 1.0,
            'Referral': 1.3,
          },
        },
      },
      {
        name: 'advanced_pipeline',
        description: 'Pipeline avançado com probabilidades e valores ponderados',
        enabled: false,
      },
      {
        name: 'inbox_whatsapp',
        description: 'Inbox nativo para WhatsApp Business API',
        enabled: false,
        config: {
          whatsapp_business_account_id: '',
          whatsapp_phone_number_id: '',
          whatsapp_access_token: '',
        },
      },
      {
        name: 'inbox_email',
        description: 'Inbox nativo para e-mails',
        enabled: false,
        config: {
          smtp_host: 'localhost',
          smtp_port: 1025,
          smtp_user: '',
          smtp_pass: '',
        },
      },
      {
        name: 'workflow_automation',
        description: 'Workflows visuais para automação de marketing',
        enabled: false,
      },
      {
        name: 'calendar_integration',
        description: 'Calendário com integração Google Meet',
        enabled: false,
        config: {
          google_calendar_api_key: '',
          google_calendar_client_id: '',
        },
      },
      {
        name: 'heatmap_tracking',
        description: 'Heatmap e análise de comportamento de usuário',
        enabled: false,
      },
      {
        name: 'internal_chat',
        description: 'Chat interno para colaboração da equipe',
        enabled: false,
      },
      {
        name: 'email_campaigns',
        description: 'Sistema de campanhas de e-mail (Mini-ActiveCampaign)',
        enabled: false,
      },
      {
        name: 'sales_celebration',
        description: 'Mini-game de celebração pós-venda',
        enabled: false,
      },
    ]

    try {
      for (const flag of defaultFlags) {
        const existing = await prisma.featureFlag.findUnique({
          where: { name: flag.name },
        })

        if (!existing) {
          await this.upsert(flag.name, flag.enabled, flag.config, flag.description)
          console.log(`✅ Feature flag '${flag.name}' initialized`)
        }
      }
    } catch (error) {
      console.error('Error initializing feature flags:', error)
    }
  }
}

// Hook para usar em componentes React
export function useFeatureFlag(name: FeatureFlagName) {
  // Em desenvolvimento, pode usar um state/effect aqui
  // Por agora, retorna uma função para verificar server-side
  return {
    isEnabled: () => FeatureFlagService.isEnabled(name),
    getConfig: () => FeatureFlagService.getConfig(name),
  }
}

// Middleware para verificar feature flags em rotas API
export function withFeatureFlag(name: FeatureFlagName) {
  return async function (handler: Function) {
    return async function (req: any, res: any) {
      const isEnabled = await FeatureFlagService.isEnabled(name)

      if (!isEnabled) {
        return res.status(404).json({
          success: false,
          error: 'Feature not available',
          code: 'FEATURE_DISABLED',
        })
      }

      return handler(req, res)
    }
  }
}