import { LeadStatus, OpportunityStage } from '@prisma/client'

export interface AutomationTriggerConfig {
  status: LeadStatus
  stage: OpportunityStage
  enabled: boolean
  requiresValue: boolean
  description: string
  priority: number
}

export class AutomationConfigService {
  private static instance: AutomationConfigService
  private triggerConfigs: AutomationTriggerConfig[] = [
    // Status principais obrigatórios
    {
      status: 'QUALIFIED',
      stage: 'QUALIFICATION',
      enabled: true,
      requiresValue: false,
      description: 'Lead qualificado automaticamente vira oportunidade',
      priority: 1
    },
    {
      status: 'PROPOSAL',
      stage: 'PROPOSAL',
      enabled: true,
      requiresValue: true,
      description: 'Proposta com valor obrigatório',
      priority: 2
    },
    {
      status: 'WON',
      stage: 'WON',
      enabled: true,
      requiresValue: false,
      description: 'Negócio fechado com sucesso',
      priority: 3
    },
    {
      status: 'LOST',
      stage: 'LOST',
      enabled: true,
      requiresValue: false,
      description: 'Oportunidade perdida',
      priority: 4
    },
    // Novos status opcionais configuráveis
    {
      status: 'CONTACTED',
      stage: 'NEW',
      enabled: true, // ✅ NOVO: Ativo por padrão
      requiresValue: false,
      description: 'Lead contatado pode virar oportunidade automaticamente',
      priority: 5
    },
    {
      status: 'INTERESTED',
      stage: 'DISCOVERY',
      enabled: true, // ✅ NOVO: Ativo por padrão
      requiresValue: false,
      description: 'Lead interessado entra em descoberta automaticamente',
      priority: 6
    },
    // Status básicos (por enquanto desabilitados)
    {
      status: 'NEW',
      stage: 'NEW',
      enabled: false,
      requiresValue: false,
      description: 'Lead novo (normalmente não cria oportunidade)',
      priority: 7
    }
  ]

  public static getInstance(): AutomationConfigService {
    if (!AutomationConfigService.instance) {
      AutomationConfigService.instance = new AutomationConfigService()
    }
    return AutomationConfigService.instance
  }

  /**
   * Verifica se um status deve triggerar criação de oportunidade
   */
  shouldCreateOpportunity(status: LeadStatus): boolean {
    const config = this.triggerConfigs.find(c => c.status === status)
    return config?.enabled || false
  }

  /**
   * Obtém configuração para um status específico
   */
  getTriggerConfig(status: LeadStatus): AutomationTriggerConfig | null {
    return this.triggerConfigs.find(c => c.status === status) || null
  }

  /**
   * Obtém o stage mapeado para um status
   */
  getStageForStatus(status: LeadStatus): OpportunityStage {
    const config = this.getTriggerConfig(status)
    return config?.stage || 'NEW'
  }

  /**
   * Verifica se status requer valor obrigatório
   */
  requiresValue(status: LeadStatus): boolean {
    const config = this.getTriggerConfig(status)
    return config?.requiresValue || false
  }

  /**
   * Lista todas as configurações ativas
   */
  getActiveTriggers(): AutomationTriggerConfig[] {
    return this.triggerConfigs
      .filter(c => c.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Lista todas as configurações (ativas e inativas)
   */
  getAllTriggers(): AutomationTriggerConfig[] {
    return [...this.triggerConfigs].sort((a, b) => a.priority - b.priority)
  }

  /**
   * Atualiza configuração de um trigger
   */
  updateTriggerConfig(status: LeadStatus, updates: Partial<AutomationTriggerConfig>): boolean {
    const index = this.triggerConfigs.findIndex(c => c.status === status)
    if (index === -1) return false

    this.triggerConfigs[index] = {
      ...this.triggerConfigs[index],
      ...updates
    }
    return true
  }

  /**
   * Habilita/desabilita um trigger específico
   */
  toggleTrigger(status: LeadStatus, enabled?: boolean): boolean {
    const config = this.getTriggerConfig(status)
    if (!config) return false

    const newEnabled = enabled !== undefined ? enabled : !config.enabled
    return this.updateTriggerConfig(status, { enabled: newEnabled })
  }

  /**
   * Obtém estatísticas das configurações
   */
  getConfigStats() {
    const total = this.triggerConfigs.length
    const active = this.triggerConfigs.filter(c => c.enabled).length
    const requireValue = this.triggerConfigs.filter(c => c.enabled && c.requiresValue).length

    return {
      total,
      active,
      inactive: total - active,
      requireValue,
      optionalValue: active - requireValue
    }
  }

  /**
   * Obtém mapeamento legado para compatibilidade
   */
  getLegacyStageMapping(): Record<LeadStatus, OpportunityStage> {
    const mapping: Record<string, OpportunityStage> = {}

    this.triggerConfigs.forEach(config => {
      if (config.enabled) {
        mapping[config.status] = config.stage
      }
    })

    return mapping as Record<LeadStatus, OpportunityStage>
  }

  /**
   * Valida se a configuração está consistente
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Verificar se status principais estão habilitados
    const criticalStatuses: LeadStatus[] = ['QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

    criticalStatuses.forEach(status => {
      const config = this.getTriggerConfig(status)
      if (!config?.enabled) {
        errors.push(`Status crítico ${status} não está habilitado`)
      }
    })

    // Verificar se PROPOSAL requer valor
    const proposalConfig = this.getTriggerConfig('PROPOSAL')
    if (proposalConfig?.enabled && !proposalConfig.requiresValue) {
      errors.push('Status PROPOSAL deve requerer valor obrigatório')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export const automationConfig = AutomationConfigService.getInstance()