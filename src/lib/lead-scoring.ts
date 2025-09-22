import { prisma } from '@/lib/prisma'
import { FeatureFlagService } from '@/lib/feature-flags'

export interface LeadScoringConfig {
  source_multipliers: Record<string, number>
  utm_source_points: Record<string, number>
  activity_points: Record<string, number>
  time_decay_factor: number
  max_score: number
}

export interface ScoringFactors {
  sourceScore: number
  utmScore: number
  activityScore: number
  timeDecayScore: number
  totalScore: number
  breakdown: {
    source: string
    sourceMultiplier: number
    utmSource?: string
    utmPoints: number
    activities: number
    timeFactor: number
  }
}

export class LeadScoringService {
  private static defaultConfig: LeadScoringConfig = {
    source_multipliers: {
      'Google Ads': 1.2,
      'Facebook Ads': 1.1,
      'Website': 1.0,
      'Referral': 1.3,
      'Direct': 0.8,
      'Email': 1.1,
      'Social Media': 0.9,
    },
    utm_source_points: {
      'google': 15,
      'facebook': 12,
      'instagram': 10,
      'linkedin': 18,
      'email': 8,
      'direct': 5,
      'referral': 20,
    },
    activity_points: {
      'CREATED': 10,
      'CONTACTED': 15,
      'EMAIL_SENT': 5,
      'EMAIL_OPENED': 8,
      'CALL_MADE': 20,
      'MEETING_SCHEDULED': 25,
      'PROPOSAL_SENT': 30,
      'CONTRACT_SIGNED': 50,
    },
    time_decay_factor: 0.95, // 5% decay per week
    max_score: 100,
  }

  /**
   * Calcula o score de um lead baseado em suas características e atividades
   */
  static async calculateLeadScore(leadId: string): Promise<ScoringFactors> {
    const isEnabled = await FeatureFlagService.isEnabled('auto_lead_scoring')
    if (!isEnabled) {
      return this.getDefaultScore()
    }

    const config = await FeatureFlagService.getConfig<LeadScoringConfig>('auto_lead_scoring')
    const scoringConfig = { ...this.defaultConfig, ...config }

    // Busca dados do lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Considera apenas as 50 atividades mais recentes
        },
      },
    })

    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`)
    }

    // 1. Score baseado na fonte (source)
    const sourceScore = this.calculateSourceScore(lead.source, scoringConfig)

    // 2. Score baseado em UTM source
    const utmScore = this.calculateUtmScore(lead.utmSource, scoringConfig)

    // 3. Score baseado em atividades
    const activityScore = this.calculateActivityScore(lead.activities, scoringConfig)

    // 4. Fator de decaimento por tempo
    const timeDecayScore = this.calculateTimeDecay(lead.createdAt, scoringConfig)

    // Score total (com limite máximo)
    const rawTotal = (sourceScore + utmScore + activityScore) * timeDecayScore
    const totalScore = Math.min(rawTotal, scoringConfig.max_score)

    return {
      sourceScore,
      utmScore,
      activityScore,
      timeDecayScore,
      totalScore: Math.round(totalScore),
      breakdown: {
        source: lead.source || 'Unknown',
        sourceMultiplier: scoringConfig.source_multipliers[lead.source || ''] || 1.0,
        utmSource: lead.utmSource || undefined,
        utmPoints: scoringConfig.utm_source_points[lead.utmSource || ''] || 0,
        activities: lead.activities.length,
        timeFactor: timeDecayScore,
      },
    }
  }

  /**
   * Atualiza o score de um lead no banco de dados
   */
  static async updateLeadScore(leadId: string): Promise<{ oldScore: number; newScore: number }> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { score: true },
    })

    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`)
    }

    const scoringResult = await this.calculateLeadScore(leadId)

    await prisma.lead.update({
      where: { id: leadId },
      data: { score: scoringResult.totalScore },
    })

    return {
      oldScore: lead.score,
      newScore: scoringResult.totalScore,
    }
  }

  /**
   * Recalcula scores de todos os leads (para execução em background)
   */
  static async recalculateAllScores(): Promise<{ updated: number; errors: number }> {
    const isEnabled = await FeatureFlagService.isEnabled('auto_lead_scoring')
    if (!isEnabled) {
      console.log('Lead scoring está desabilitado')
      return { updated: 0, errors: 0 }
    }

    const leads = await prisma.lead.findMany({
      select: { id: true },
    })

    let updated = 0
    let errors = 0

    for (const lead of leads) {
      try {
        await this.updateLeadScore(lead.id)
        updated++
      } catch (error) {
        console.error(`Erro ao atualizar score do lead ${lead.id}:`, error)
        errors++
      }
    }

    console.log(`Lead scoring: ${updated} atualizados, ${errors} erros`)
    return { updated, errors }
  }

  /**
   * Calcula score baseado na fonte do lead
   */
  private static calculateSourceScore(source: string | null, config: LeadScoringConfig): number {
    if (!source) return 0

    const multiplier = config.source_multipliers[source] || 1.0
    const baseScore = 10 // Score base para ter uma fonte

    return baseScore * multiplier
  }

  /**
   * Calcula score baseado no UTM source
   */
  private static calculateUtmScore(utmSource: string | null, config: LeadScoringConfig): number {
    if (!utmSource) return 0

    return config.utm_source_points[utmSource.toLowerCase()] || 0
  }

  /**
   * Calcula score baseado nas atividades do lead
   */
  private static calculateActivityScore(activities: any[], config: LeadScoringConfig): number {
    let totalActivityScore = 0

    for (const activity of activities) {
      const points = config.activity_points[activity.type] || 0
      totalActivityScore += points
    }

    return totalActivityScore
  }

  /**
   * Calcula fator de decaimento baseado no tempo desde a criação
   */
  private static calculateTimeDecay(createdAt: Date, config: LeadScoringConfig): number {
    const now = new Date()
    const weeksSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)
    )

    // Aplica decaimento exponencial
    return Math.pow(config.time_decay_factor, weeksSinceCreation)
  }

  /**
   * Retorna score padrão quando o sistema está desabilitado
   */
  private static getDefaultScore(): ScoringFactors {
    return {
      sourceScore: 0,
      utmScore: 0,
      activityScore: 0,
      timeDecayScore: 1,
      totalScore: 0,
      breakdown: {
        source: 'Unknown',
        sourceMultiplier: 1,
        utmPoints: 0,
        activities: 0,
        timeFactor: 1,
      },
    }
  }

  /**
   * Busca leads com score alto (para priorização)
   */
  static async getHighScoreLeads(limit: number = 10) {
    return prisma.lead.findMany({
      where: {
        score: { gt: 50 }, // Score maior que 50
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })
  }

  /**
   * Estatísticas de scoring para dashboard
   */
  static async getScoringStats() {
    const [
      totalLeads,
      highScoreLeads,
      mediumScoreLeads,
      lowScoreLeads,
      averageScore,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { score: { gte: 70 } } }),
      prisma.lead.count({ where: { score: { gte: 30, lt: 70 } } }),
      prisma.lead.count({ where: { score: { lt: 30 } } }),
      prisma.lead.aggregate({ _avg: { score: true } }),
    ])

    return {
      totalLeads,
      highScoreLeads,
      mediumScoreLeads,
      lowScoreLeads,
      averageScore: Math.round(averageScore._avg.score || 0),
      distribution: {
        high: Math.round((highScoreLeads / totalLeads) * 100),
        medium: Math.round((mediumScoreLeads / totalLeads) * 100),
        low: Math.round((lowScoreLeads / totalLeads) * 100),
      },
    }
  }
}