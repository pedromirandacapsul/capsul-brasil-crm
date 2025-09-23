import { prisma } from '@/lib/prisma'

export interface KPIMetrics {
  totalLeads: number
  totalOpportunities: number
  totalRevenue: number
  conversionRate: number
  averageDealSize: number
  totalClosedWon: number
  totalClosedLost: number
  winRate: number
  pipelineValue: number
  averageSalesTime: number
}

export interface UserPerformance {
  userId: string
  userName: string
  leadsCreated: number
  opportunitiesCreated: number
  dealsWon: number
  dealsLost: number
  totalRevenue: number
  winRate: number
  averageDealSize: number
  conversionRate: number
}

export interface PerformanceAlert {
  type: 'low_conversion' | 'high_value_deal' | 'pipeline_stale' | 'quota_achievement'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  userId?: string
  value?: number
  threshold?: number
  recommendation?: string
}

export interface PipelineAnalytics {
  stage: string
  count: number
  totalValue: number
  averageValue: number
  averageTimeInStage: number
  conversionRate: number
}

export interface TrendData {
  period: string
  ownedLeads: number
  opportunities: number
  revenue: number
  conversionRate: number
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService()
    }
    return AdvancedAnalyticsService.instance
  }

  /**
   * Calcular KPIs principais do sistema
   */
  async getKPIMetrics(dateFrom?: Date, dateTo?: Date): Promise<KPIMetrics> {
    const whereClause = this.buildDateFilter(dateFrom, dateTo)

    // Buscar dados em paralelo para melhor performance
    const [
      totalLeads,
      totalOpportunities,
      opportunitiesWithRevenue,
      closedWonOpportunities,
      closedLostOpportunities,
      pipelineOpportunities
    ] = await Promise.all([
      prisma.lead.count({ where: whereClause }),
      prisma.opportunity.count({ where: whereClause }),
      prisma.opportunity.findMany({
        where: { ...whereClause, amountBr: { gt: 0 } },
        select: { amountBr: true, stage: true, createdAt: true, lead: { select: { createdAt: true } } }
      }),
      prisma.opportunity.findMany({
        where: { ...whereClause, stage: 'WON' },
        select: { amountBr: true, createdAt: true, lead: { select: { createdAt: true } } }
      }),
      prisma.opportunity.findMany({
        where: { ...whereClause, stage: 'LOST' },
        select: { amountBr: true }
      }),
      prisma.opportunity.findMany({
        where: {
          ...whereClause,
          stage: { in: ['NEW', 'QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'] }
        },
        select: { amountBr: true }
      })
    ])

    // Calcular métricas
    const totalRevenue = closedWonOpportunities.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)
    const pipelineValue = pipelineOpportunities.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)

    const totalClosedWon = closedWonOpportunities.length
    const totalClosedLost = closedLostOpportunities.length
    const totalClosed = totalClosedWon + totalClosedLost

    const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0
    const winRate = totalClosed > 0 ? (totalClosedWon / totalClosed) * 100 : 0
    const averageDealSize = totalClosedWon > 0 ? totalRevenue / totalClosedWon : 0

    // Calcular tempo médio de venda (em dias)
    const averageSalesTime = this.calculateAverageSalesTime(closedWonOpportunities)

    return {
      totalLeads,
      totalOpportunities,
      totalRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageDealSize: Math.round(averageDealSize),
      totalClosedWon,
      totalClosedLost,
      winRate: Math.round(winRate * 100) / 100,
      pipelineValue,
      averageSalesTime
    }
  }

  /**
   * Obter performance por usuário
   */
  async getUserPerformance(dateFrom?: Date, dateTo?: Date): Promise<UserPerformance[]> {
    const whereClause = this.buildDateFilter(dateFrom, dateTo)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        ownedLeads: {
          where: whereClause,
          select: {
            id: true,
            opportunities: {
              select: {
                id: true,
                stage: true,
                amountBr: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    return users.map(user => {
      const leadsCreated = user.ownedLeads.length
      const opportunities = user.ownedLeads.flatMap(lead => lead.opportunities)
      const opportunitiesCreated = opportunities.length

      const dealsWon = opportunities.filter(opp => opp.stage === 'WON').length
      const dealsLost = opportunities.filter(opp => opp.stage === 'LOST').length
      const totalRevenue = opportunities
        .filter(opp => opp.stage === 'WON')
        .reduce((sum, opp) => sum + (opp.amountBr || 0), 0)

      const totalClosed = dealsWon + dealsLost
      const winRate = totalClosed > 0 ? (dealsWon / totalClosed) * 100 : 0
      const averageDealSize = dealsWon > 0 ? totalRevenue / dealsWon : 0
      const conversionRate = leadsCreated > 0 ? (opportunitiesCreated / leadsCreated) * 100 : 0

      return {
        userId: user.id,
        userName: user.name || 'Usuário sem nome',
        leadsCreated,
        opportunitiesCreated,
        dealsWon,
        dealsLost,
        totalRevenue,
        winRate: Math.round(winRate * 100) / 100,
        averageDealSize: Math.round(averageDealSize),
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    })
  }

  /**
   * Análise de pipeline por estágio
   */
  async getPipelineAnalytics(dateFrom?: Date, dateTo?: Date): Promise<PipelineAnalytics[]> {
    const whereClause = this.buildDateFilter(dateFrom, dateTo)

    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      select: {
        stage: true,
        amountBr: true,
        createdAt: true,
        updatedAt: true,
        activities: {
          select: {
            createdAt: true,
            payload: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    const stageGroups = opportunities.reduce((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = []
      }
      acc[opp.stage].push(opp)
      return acc
    }, {} as Record<string, typeof opportunities>)

    return Object.entries(stageGroups).map(([stage, opps]) => {
      const count = opps.length
      const totalValue = opps.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)
      const averageValue = count > 0 ? totalValue / count : 0

      // Calcular tempo médio no estágio (simplificado)
      const averageTimeInStage = this.calculateAverageTimeInStage(opps)

      // Taxa de conversão do estágio (placeholder - requer lógica mais complexa)
      const conversionRate = this.calculateStageConversionRate(stage, opps)

      return {
        stage,
        count,
        totalValue,
        averageValue: Math.round(averageValue),
        averageTimeInStage,
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    })
  }

  /**
   * Obter dados de tendência por período
   */
  async getTrendData(dateFrom: Date, dateTo: Date, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<TrendData[]> {
    const trends: TrendData[] = []
    const periods = this.generatePeriods(dateFrom, dateTo, period)

    for (const periodInfo of periods) {
      const whereClause = {
        createdAt: {
          gte: periodInfo.start,
          lte: periodInfo.end
        }
      }

      const [leads, opportunities] = await Promise.all([
        prisma.lead.count({ where: whereClause }),
        prisma.opportunity.findMany({
          where: whereClause,
          select: { stage: true, amountBr: true }
        })
      ])

      const revenue = opportunities
        .filter(opp => opp.stage === 'WON')
        .reduce((sum, opp) => sum + (opp.amountBr || 0), 0)

      const conversionRate = leads > 0 ? (opportunities.length / leads) * 100 : 0

      trends.push({
        period: periodInfo.label,
        ownedLeads: leads,
        opportunities: opportunities.length,
        revenue,
        conversionRate: Math.round(conversionRate * 100) / 100
      })
    }

    return trends
  }

  /**
   * Detectar alertas de performance
   */
  async getPerformanceAlerts(dateFrom?: Date, dateTo?: Date): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = []
    const kpis = await this.getKPIMetrics(dateFrom, dateTo)
    const userPerformance = await this.getUserPerformance(dateFrom, dateTo)

    // Alerta: Taxa de conversão baixa
    if (kpis.conversionRate < 15) {
      alerts.push({
        type: 'low_conversion',
        severity: 'high',
        title: 'Taxa de Conversão Baixa',
        message: `Taxa de conversão de ${kpis.conversionRate}% está abaixo do esperado (15%+)`,
        value: kpis.conversionRate,
        threshold: 15,
        recommendation: 'Revise a qualificação de leads e melhore o processo de nutrição'
      })
    }

    // Alerta: Negócios de alto valor no pipeline
    const highValueDeals = await prisma.opportunity.count({
      where: {
        amountBr: { gte: 100000 },
        stage: { in: ['PROPOSAL', 'NEGOTIATION'] },
        ...(dateFrom && dateTo ? {
          createdAt: { gte: dateFrom, lte: dateTo }
        } : {})
      }
    })

    if (highValueDeals > 0) {
      alerts.push({
        type: 'high_value_deal',
        severity: 'medium',
        title: 'Negócios de Alto Valor',
        message: `${highValueDeals} negócios acima de R$ 100.000 no pipeline`,
        value: highValueDeals,
        recommendation: 'Priorize atenção especial para fechar estes negócios'
      })
    }

    // Alertas por usuário: Performance baixa
    userPerformance.forEach(user => {
      if (user.conversionRate < 10 && user.leadsCreated > 5) {
        alerts.push({
          type: 'low_conversion',
          severity: 'medium',
          title: `Performance de ${user.userName}`,
          message: `Taxa de conversão de ${user.conversionRate}% está baixa`,
          userId: user.userId,
          value: user.conversionRate,
          threshold: 10,
          recommendation: 'Considere treinamento adicional ou revisão de estratégia'
        })
      }
    })

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * Métodos auxiliares privados
   */
  private buildDateFilter(dateFrom?: Date, dateTo?: Date) {
    if (!dateFrom && !dateTo) return {}

    const filter: any = {}
    if (dateFrom) filter.gte = dateFrom
    if (dateTo) filter.lte = dateTo

    return { createdAt: filter }
  }

  private calculateAverageSalesTime(closedWonOpportunities: any[]): number {
    if (closedWonOpportunities.length === 0) return 0

    const totalDays = closedWonOpportunities.reduce((sum, opp) => {
      const leadCreated = new Date(opp.lead.createdAt)
      const oppClosed = new Date(opp.createdAt)
      const daysDiff = Math.ceil((oppClosed.getTime() - leadCreated.getTime()) / (1000 * 60 * 60 * 24))
      return sum + daysDiff
    }, 0)

    return Math.round(totalDays / closedWonOpportunities.length)
  }

  private calculateAverageTimeInStage(opportunities: any[]): number {
    // Simplificado: diferença entre criação e atualização
    if (opportunities.length === 0) return 0

    const totalDays = opportunities.reduce((sum, opp) => {
      const created = new Date(opp.createdAt)
      const updated = new Date(opp.updatedAt)
      const daysDiff = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return sum + Math.max(daysDiff, 1) // Mínimo 1 dia
    }, 0)

    return Math.round(totalDays / opportunities.length)
  }

  private calculateStageConversionRate(stage: string, opportunities: any[]): number {
    // Placeholder: lógica simplificada baseada no estágio
    const conversionRates = {
      'PROSPECT': 65,
      'QUALIFIED': 80,
      'PROPOSAL': 85,
      'NEGOTIATION': 90,
      'WON': 100,
      'LOST': 0
    }

    return conversionRates[stage as keyof typeof conversionRates] || 50
  }

  private generatePeriods(dateFrom: Date, dateTo: Date, period: 'daily' | 'weekly' | 'monthly') {
    const periods: Array<{ start: Date; end: Date; label: string }> = []

    if (period === 'monthly') {
      let current = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1)

      while (current <= dateTo) {
        const end = new Date(current.getFullYear(), current.getMonth() + 1, 0)
        periods.push({
          start: new Date(current),
          end: end > dateTo ? dateTo : end,
          label: current.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        })
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      }
    }

    // Implementar daily e weekly se necessário

    return periods
  }
}

export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance()