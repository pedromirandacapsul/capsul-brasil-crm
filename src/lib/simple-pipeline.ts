import { prisma } from '@/lib/prisma'

export interface SimplePipelineStageData {
  id: string
  name: string
  position: number
  probability: number
  color: string
  active: boolean
}

export interface SimplePipelineAnalytics {
  totalValue: number
  weightedValue: number
  stageDistribution: Array<{
    stage: string
    count: number
    value: number
    probability: number
  }>
  conversionRates: Array<{
    fromStage: string
    toStage: string
    rate: number
    count: number
  }>
  averageTimeInStage: Array<{
    stage: string
    averageDays: number
  }>
  forecastRevenue: {
    thisMonth: number
    nextMonth: number
    thisQuarter: number
  }
}

export class SimplePipelineService {
  /**
   * Lista estágios padrão simplificados (baseados nos status do Lead)
   */
  static async getStages(): Promise<SimplePipelineStageData[]> {
    // Estágios padrão baseados no status do Lead
    return [
      { id: '1', name: 'NEW', position: 1, probability: 10, color: '#3B82F6', active: true },
      { id: '2', name: 'CONTACTED', position: 2, probability: 25, color: '#8B5CF6', active: true },
      { id: '3', name: 'QUALIFIED', position: 3, probability: 40, color: '#06B6D4', active: true },
      { id: '4', name: 'PROPOSAL', position: 4, probability: 65, color: '#F59E0B', active: true },
      { id: '5', name: 'WON', position: 5, probability: 100, color: '#10B981', active: true },
      { id: '6', name: 'LOST', position: 6, probability: 0, color: '#EF4444', active: true },
    ]
  }

  /**
   * Analytics com dados reais do banco
   */
  static async getAnalytics(timeframe: '30d' | '90d' | '1y' = '30d'): Promise<SimplePipelineAnalytics> {
    try {
      const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)

      const stages = await this.getStages()

      // 1. Buscar todos os leads do período
      const leads = await prisma.lead.findMany({
        where: {
          createdAt: { gte: dateFrom },
        },
        include: {
          activities: {
            where: {
              type: { in: ['STAGE_CHANGED', 'STATUS_CHANGED'] },
              createdAt: { gte: dateFrom },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      // 2. Calcular valor total e ponderado
      const totalValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0)
      const weightedValue = leads.reduce((sum, lead) => {
        const stage = stages.find(s => s.name === lead.status)
        const probability = stage?.probability || 0
        return sum + (lead.dealValue || 0) * (probability / 100)
      }, 0)

      // 3. Distribuição por estágio
      const stageDistribution = stages.map(stage => {
        const stageLeads = leads.filter(lead => lead.status === stage.name)
        return {
          stage: stage.name,
          count: stageLeads.length,
          value: stageLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0),
          probability: stage.probability,
        }
      })

      // 4. Taxa de conversão entre estágios (simplificada)
      const conversionRates = this.calculateConversionRates(leads, stages)

      // 5. Tempo médio em cada estágio
      const averageTimeInStage = this.calculateAverageTimeInStage(leads, stages)

      // 6. Previsão de receita
      const forecastRevenue = this.calculateRevenueForecast(leads, stages)

      return {
        totalValue: Math.round(totalValue),
        weightedValue: Math.round(weightedValue),
        stageDistribution,
        conversionRates,
        averageTimeInStage,
        forecastRevenue,
      }
    } catch (error) {
      console.error('Erro ao buscar analytics do pipeline:', error)

      // Fallback para dados mock em caso de erro
      return {
        totalValue: 0,
        weightedValue: 0,
        stageDistribution: [
          { stage: 'NEW', count: 0, value: 0, probability: 10 },
          { stage: 'CONTACTED', count: 0, value: 0, probability: 25 },
          { stage: 'QUALIFIED', count: 0, value: 0, probability: 40 },
          { stage: 'PROPOSAL', count: 0, value: 0, probability: 65 },
          { stage: 'WON', count: 0, value: 0, probability: 100 },
          { stage: 'LOST', count: 0, value: 0, probability: 0 },
        ],
        conversionRates: [],
        averageTimeInStage: [
          { stage: 'NEW', averageDays: 0 },
          { stage: 'CONTACTED', averageDays: 0 },
          { stage: 'QUALIFIED', averageDays: 0 },
          { stage: 'PROPOSAL', averageDays: 0 },
          { stage: 'WON', averageDays: 0 },
          { stage: 'LOST', averageDays: 0 },
        ],
        forecastRevenue: {
          thisMonth: 0,
          nextMonth: 0,
          thisQuarter: 0,
        },
      }
    }
  }

  /**
   * Calcula taxas de conversão entre estágios
   */
  private static calculateConversionRates(leads: any[], stages: SimplePipelineStageData[]) {
    const conversions: Record<string, { total: number; converted: number }> = {}

    // Inicializar contadores para conversões entre estágios adjacentes
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i].name
      const toStage = stages[i + 1].name
      const key = `${fromStage}->${toStage}`
      conversions[key] = { total: 0, converted: 0 }
    }

    // Analisar movimentações através de activities
    leads.forEach(lead => {
      let lastStage = 'NEW'

      lead.activities.forEach((activity: any) => {
        try {
          const payload = activity.payload ? JSON.parse(activity.payload) : {}
          if (payload.fromStage && payload.toStage) {
            const key = `${payload.fromStage}->${payload.toStage}`
            if (conversions[key]) {
              conversions[key].converted++
            }
          }
        } catch (error) {
          // Ignora activities com payload inválido
        }
      })

      // Contabilizar leads que estão em cada estágio
      stages.forEach(stage => {
        if (lead.status === stage.name) {
          // Incrementar total para estágios anteriores (simulação)
          const stageIndex = stages.findIndex(s => s.name === stage.name)
          for (let i = 0; i < stageIndex; i++) {
            const key = `${stages[i].name}->${stages[i + 1]?.name}`
            if (conversions[key]) {
              conversions[key].total++
            }
          }
        }
      })
    })

    return Object.entries(conversions).map(([key, data]) => {
      const [fromStage, toStage] = key.split('->')
      const rate = data.total > 0 ? (data.converted / data.total) * 100 : 0

      return {
        fromStage,
        toStage,
        rate: Math.round(rate * 100) / 100,
        count: data.converted,
      }
    })
  }

  /**
   * Calcula tempo médio em cada estágio
   */
  private static calculateAverageTimeInStage(leads: any[], stages: SimplePipelineStageData[]) {
    const stageTimes: Record<string, number[]> = {}

    stages.forEach(stage => {
      stageTimes[stage.name] = []
    })

    leads.forEach(lead => {
      if (lead.stageEnteredAt && lead.status) {
        const timeInCurrentStage = (new Date().getTime() - new Date(lead.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
        if (stageTimes[lead.status]) {
          stageTimes[lead.status].push(timeInCurrentStage)
        }
      }

      // Analisar tempo em estágios através de activities
      let lastStageTime = new Date(lead.createdAt)

      lead.activities.forEach((activity: any) => {
        try {
          const payload = activity.payload ? JSON.parse(activity.payload) : {}
          if (payload.fromStage && stageTimes[payload.fromStage]) {
            const timeInStage = (new Date(activity.createdAt).getTime() - lastStageTime.getTime()) / (1000 * 60 * 60 * 24)
            stageTimes[payload.fromStage].push(timeInStage)
            lastStageTime = new Date(activity.createdAt)
          }
        } catch (error) {
          // Ignora activities com payload inválido
        }
      })
    })

    return stages.map(stage => {
      const times = stageTimes[stage.name]
      const averageDays = times.length > 0
        ? times.reduce((sum, time) => sum + time, 0) / times.length
        : 0

      return {
        stage: stage.name,
        averageDays: Math.round(averageDays * 100) / 100,
      }
    })
  }

  /**
   * Calcula previsão de receita
   */
  private static calculateRevenueForecast(leads: any[], stages: SimplePipelineStageData[]) {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const thisQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

    let thisMonthRevenue = 0
    let nextMonthRevenue = 0
    let thisQuarterRevenue = 0

    leads.forEach(lead => {
      const stage = stages.find(s => s.name === lead.status)
      if (!stage || !lead.dealValue) return

      const weightedValue = lead.dealValue * (stage.probability / 100)

      // Estimativa baseada na data de entrada no estágio ou criação
      const stageEnteredAt = lead.stageEnteredAt ? new Date(lead.stageEnteredAt) : new Date(lead.createdAt)
      const avgTimeToClose = 30 // Simplificado: 30 dias em média para fechar

      const expectedCloseDate = new Date(stageEnteredAt)
      expectedCloseDate.setDate(expectedCloseDate.getDate() + avgTimeToClose)

      if (expectedCloseDate >= thisMonth && expectedCloseDate < nextMonth) {
        thisMonthRevenue += weightedValue
      } else if (expectedCloseDate >= nextMonth) {
        nextMonthRevenue += weightedValue
      }

      if (expectedCloseDate >= thisQuarter) {
        thisQuarterRevenue += weightedValue
      }
    })

    return {
      thisMonth: Math.round(thisMonthRevenue),
      nextMonth: Math.round(nextMonthRevenue),
      thisQuarter: Math.round(thisQuarterRevenue),
    }
  }
}