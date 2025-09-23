// Serviço temporário simplificado para testar o menu sem erros de schema

export interface SimpleKPIMetrics {
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

export interface SimpleUserPerformance {
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

export class SimpleDashboardService {
  static async getKPIMetrics(): Promise<SimpleKPIMetrics> {
    // Dados mock para testar
    return {
      totalLeads: 150,
      totalOpportunities: 45,
      totalRevenue: 250000,
      conversionRate: 30,
      averageDealSize: 5556,
      totalClosedWon: 15,
      totalClosedLost: 8,
      winRate: 65.2,
      pipelineValue: 180000,
      averageSalesTime: 14
    }
  }

  static async getUserPerformance(): Promise<SimpleUserPerformance[]> {
    // Dados mock para testar
    return [
      {
        userId: '1',
        userName: 'Pedro Miranda',
        leadsCreated: 45,
        opportunitiesCreated: 15,
        dealsWon: 8,
        dealsLost: 3,
        totalRevenue: 85000,
        winRate: 72.7,
        averageDealSize: 10625,
        conversionRate: 33.3
      },
      {
        userId: '2',
        userName: 'Ana Silva',
        leadsCreated: 38,
        opportunitiesCreated: 12,
        dealsWon: 5,
        dealsLost: 4,
        totalRevenue: 65000,
        winRate: 55.6,
        averageDealSize: 13000,
        conversionRate: 31.6
      },
      {
        userId: '3',
        userName: 'Carlos Santos',
        leadsCreated: 42,
        opportunitiesCreated: 18,
        dealsWon: 2,
        dealsLost: 1,
        totalRevenue: 100000,
        winRate: 66.7,
        averageDealSize: 50000,
        conversionRate: 42.9
      }
    ]
  }

  static async getPipelineAnalytics() {
    return [
      { stage: 'NEW', count: 12, totalValue: 60000, averageValue: 5000, averageTimeInStage: 3, conversionRate: 85 },
      { stage: 'QUALIFICATION', count: 8, totalValue: 80000, averageValue: 10000, averageTimeInStage: 5, conversionRate: 75 },
      { stage: 'DISCOVERY', count: 6, totalValue: 90000, averageValue: 15000, averageTimeInStage: 7, conversionRate: 70 },
      { stage: 'PROPOSAL', count: 4, totalValue: 120000, averageValue: 30000, averageTimeInStage: 10, conversionRate: 80 },
      { stage: 'NEGOTIATION', count: 2, totalValue: 80000, averageValue: 40000, averageTimeInStage: 8, conversionRate: 90 },
      { stage: 'WON', count: 15, totalValue: 250000, averageValue: 16667, averageTimeInStage: 0, conversionRate: 100 },
    ]
  }

  static async getPerformanceAlerts() {
    return [
      {
        type: 'low_conversion' as const,
        severity: 'medium' as const,
        title: 'Taxa de Conversão Atenção',
        message: 'Alguns usuários com conversão abaixo de 25%',
        recommendation: 'Revisar processo de qualificação de leads'
      },
      {
        type: 'high_value_deal' as const,
        severity: 'high' as const,
        title: 'Negócio Alto Valor',
        message: '2 negócios acima de R$ 50.000 no pipeline',
        recommendation: 'Priorizar atenção especial para fechar'
      }
    ]
  }
}