import { prisma } from '@/lib/prisma'
import { FeatureFlagService } from '@/lib/feature-flags'

export interface PipelineStageData {
  id?: string
  name: string
  position: number
  probability: number
  color: string
  active: boolean
}

export interface PipelineAnalytics {
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

export interface LeadMovement {
  leadId: string
  fromStage?: string
  toStage: string
  probability: number
  value: number
  movedAt: Date
}

export class PipelineService {
  /**
   * Cria ou atualiza estágios do pipeline
   */
  static async upsertStages(stages: PipelineStageData[]) {
    const isEnabled = await FeatureFlagService.isEnabled('advanced_pipeline')
    if (!isEnabled) {
      throw new Error('Pipeline avançado não está habilitado')
    }

    try {
      // Deletar estágios removidos
      const currentStages = await prisma.pipelineStage.findMany()
      const newStageIds = stages.filter(s => s.id).map(s => s.id)
      const stagesToDelete = currentStages.filter(s => !newStageIds.includes(s.id))

      for (const stage of stagesToDelete) {
        await prisma.pipelineStage.delete({ where: { id: stage.id } })
      }

      // Criar ou atualizar estágios
      const upsertPromises = stages.map(stage => {
        if (stage.id) {
          return prisma.pipelineStage.update({
            where: { id: stage.id },
            data: {
              name: stage.name,
              position: stage.position,
              probability: stage.probability,
              color: stage.color,
              active: stage.active,
            },
          })
        } else {
          return prisma.pipelineStage.create({
            data: {
              name: stage.name,
              position: stage.position,
              probability: stage.probability,
              color: stage.color,
              active: stage.active,
            },
          })
        }
      })

      const result = await Promise.all(upsertPromises)
      return result
    } catch (error) {
      console.error('Erro ao atualizar estágios do pipeline:', error)
      throw error
    }
  }

  /**
   * Lista todos os estágios do pipeline
   */
  static async getStages() {
    return prisma.pipelineStage.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    })
  }

  /**
   * Move um lead para um novo estágio
   */
  static async moveLeadToStage(leadId: string, newStage: string, userId: string) {
    const stages = await this.getStages()
    const stage = stages.find(s => s.name === newStage)

    if (!stage) {
      throw new Error(`Estágio ${newStage} não encontrado`)
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true, dealValue: true },
    })

    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`)
    }

    // Atualiza o lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: stage.name,
        probability: stage.probability,
        stageEnteredAt: new Date(),
        lastActivityAt: new Date(),
      },
    })

    // Registra a atividade
    await prisma.activity.create({
      data: {
        leadId,
        userId,
        type: 'STAGE_CHANGED',
        payload: JSON.stringify({
          fromStage: lead.status,
          toStage: stage.name,
          probability: stage.probability,
        }),
      },
    })

    return updatedLead
  }

  /**
   * Calcula analytics do pipeline
   */
  static async getAnalytics(timeframe: '30d' | '90d' | '1y' = '30d'): Promise<PipelineAnalytics> {
    const isEnabled = await FeatureFlagService.isEnabled('advanced_pipeline')
    if (!isEnabled) {
      throw new Error('Pipeline avançado não está habilitado')
    }

    const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const [stages, leads, activities] = await Promise.all([
      this.getStages(),
      prisma.lead.findMany({
        where: {
          createdAt: { gte: dateFrom },
        },
        include: {
          activities: {
            where: {
              type: 'STAGE_CHANGED',
              createdAt: { gte: dateFrom },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.activity.findMany({
        where: {
          type: 'STAGE_CHANGED',
          createdAt: { gte: dateFrom },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // 1. Valor total e ponderado
    const totalValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0)
    const weightedValue = leads.reduce((sum, lead) => {
      const stage = stages.find(s => s.name === lead.status)
      const probability = stage?.probability || 0
      return sum + (lead.dealValue || 0) * (probability / 100)
    }, 0)

    // 2. Distribuição por estágio
    const stageDistribution = stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.status === stage.name)
      return {
        stage: stage.name,
        count: stageLeads.length,
        value: stageLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0),
        probability: stage.probability,
      }
    })

    // 3. Taxa de conversão entre estágios
    const conversionRates = this.calculateConversionRates(activities, stages)

    // 4. Tempo médio em cada estágio
    const averageTimeInStage = this.calculateAverageTimeInStage(leads, stages)

    // 5. Previsão de receita
    const forecastRevenue = this.calculateRevenueForecast(leads, stages)

    return {
      totalValue,
      weightedValue,
      stageDistribution,
      conversionRates,
      averageTimeInStage,
      forecastRevenue,
    }
  }

  /**
   * Calcula taxas de conversão entre estágios
   */
  private static calculateConversionRates(activities: any[], stages: any[]) {
    const conversions: Record<string, { total: number; converted: number }> = {}

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i].name
      const toStage = stages[i + 1].name
      const key = `${fromStage}->${toStage}`

      conversions[key] = { total: 0, converted: 0 }
    }

    // Analisa as movimentações
    activities.forEach(activity => {
      try {
        const payload = JSON.parse(activity.payload)
        const key = `${payload.fromStage}->${payload.toStage}`

        if (conversions[key]) {
          conversions[key].converted++
        }
      } catch (error) {
        // Ignora atividades com payload inválido
      }
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
  private static calculateAverageTimeInStage(leads: any[], stages: any[]) {
    const stageTimes: Record<string, number[]> = {}

    stages.forEach(stage => {
      stageTimes[stage.name] = []
    })

    leads.forEach(lead => {
      let lastStageTime = lead.createdAt

      lead.activities.forEach((activity: any) => {
        try {
          const payload = JSON.parse(activity.payload)
          if (payload.fromStage && stageTimes[payload.fromStage]) {
            const timeInStage = (new Date(activity.createdAt).getTime() - lastStageTime.getTime()) / (1000 * 60 * 60 * 24)
            stageTimes[payload.fromStage].push(timeInStage)
          }
          lastStageTime = new Date(activity.createdAt)
        } catch (error) {
          // Ignora atividades com payload inválido
        }
      })

      // Tempo no estágio atual
      if (lead.stageEnteredAt && stageTimes[lead.status]) {
        const timeInCurrentStage = (new Date().getTime() - new Date(lead.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
        stageTimes[lead.status].push(timeInCurrentStage)
      }
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
  private static calculateRevenueForecast(leads: any[], stages: any[]) {
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

      // Estimativa baseada no tempo médio no estágio
      const stageEnteredAt = lead.stageEnteredAt ? new Date(lead.stageEnteredAt) : lead.createdAt
      const avgTimeInStage = 30 // Simplificado: 30 dias em média por estágio

      const expectedCloseDate = new Date(stageEnteredAt)
      expectedCloseDate.setDate(expectedCloseDate.getDate() + avgTimeInStage)

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

  /**
   * Inicializa estágios padrão do pipeline
   */
  static async initializeDefaultStages() {
    const existing = await prisma.pipelineStage.count()
    if (existing > 0) return

    const defaultStages: PipelineStageData[] = [
      { name: 'Novo Lead', position: 1, probability: 10, color: '#3B82F6', active: true },
      { name: 'Qualificado', position: 2, probability: 25, color: '#8B5CF6', active: true },
      { name: 'Conectado', position: 3, probability: 40, color: '#06B6D4', active: true },
      { name: 'Proposta', position: 4, probability: 65, color: '#F59E0B', active: true },
      { name: 'Negociação', position: 5, probability: 80, color: '#F97316', active: true },
      { name: 'Fechado', position: 6, probability: 100, color: '#10B981', active: true },
      { name: 'Perdido', position: 7, probability: 0, color: '#EF4444', active: true },
    ]

    await this.upsertStages(defaultStages)
    console.log('✅ Estágios padrão do pipeline criados')
  }
}