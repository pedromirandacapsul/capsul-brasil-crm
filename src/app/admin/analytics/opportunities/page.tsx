'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Award,
  Clock,
  Users,
  AlertTriangle,
  PieChart,
  Activity,
  Timer,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import { motion } from 'framer-motion'
import TargetsModal from '@/components/analytics/targets-modal'

interface OpportunityAnalyticsData {
  overview: {
    totalOpportunities: number
    newOpportunities: number
    wonOpportunities: number
    lostOpportunities: number
    winRate: number
    totalPipelineValue: number
    weightedPipelineValue: number
    wonValue: number
    avgDealSize: number
    avgSalesCycle: number
  }
  trends: {
    opportunitiesPerWeek: { week: string; count: number }[]
    revenuePerWeek: { week: string; revenue: number }[]
    stageDistribution: { stage: string; count: number; value: number; percentage: number }[]
    sourceBreakdown: { source: string; count: number; value: number; percentage: number }[]
  }
  performance: {
    topPerformers: {
      userId: string
      userName: string
      opportunitiesWon: number
      totalOpportunities: number
      winRate: number
      revenue: number
    }[]
  }
  lossAnalysis: {
    lossReasons: { reason: string; count: number; value: number; percentage: number }[]
    totalLostValue: number
  }
  forecast: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
  stageAnalysis: {
    avgStageTimings: { stage: string; avgHours: number; count: number }[]
    totalStages: number
  }
  sourceAnalysis: {
    sources: {
      source: string
      count: number
      totalValue: number
      avgTicket: number
      wonCount: number
      wonValue: number
      conversionRate: number
      percentage: number
    }[]
    totalSources: number
  }
  targets: {
    currentMonth: string
    totalTarget: number
    actualRevenue: number
    progressPercentage: number
    remaining: number
    status: 'achieved' | 'on-track' | 'at-risk'
    userBreakdown: {
      userId: string
      userName: string
      userRole: string
      target: number
      actual: number
      percentage: number
      remaining: number
      status: 'achieved' | 'on-track' | 'at-risk'
    }[]
    daysInMonth: number
    daysPassed: number
    projectedRevenue: number
  }
}

const stageColors: Record<string, string> = {
  NEW: '#3B82F6',
  QUALIFICATION: '#F59E0B',
  DISCOVERY: '#8B5CF6',
  PROPOSAL: '#F97316',
  NEGOTIATION: '#EF4444',
  WON: '#059669',
  LOST: '#6B7280',
}

const stageLabels: Record<string, string> = {
  NEW: 'Novos',
  QUALIFICATION: 'Qualificação',
  DISCOVERY: 'Descoberta',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  WON: 'Ganhos',
  LOST: 'Perdidos',
}

const lossReasonLabels: Record<string, string> = {
  SEM_BUDGET: 'Sem Budget',
  SEM_FIT: 'Sem Fit',
  CONCORRENCIA: 'Concorrência',
  TIMING: 'Timing Inadequado',
  NAO_RESPONDE: 'Não Responde',
  OUTROS: 'Outros',
}

export default function OpportunityAnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<OpportunityAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [targetsModalOpen, setTargetsModalOpen] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/opportunities?period=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching opportunities analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours.toFixed(0)}h`
  }

  const exportData = () => {
    // TODO: Implement export functionality
    console.log('Export opportunities analytics data')
  }

  if (!session) return null

  const userRole = session.user.role

  if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
          />
        </div>
      </AnimatedDashboardContainer>
    )
  }

  if (!analytics) {
    return (
      <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao Carregar</h1>
          <p className="text-gray-600">Não foi possível carregar os dados de analytics de oportunidades.</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </AnimatedDashboardContainer>
    )
  }

  return (
    <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedDashboardItem>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics de Oportunidades</h1>
              <p className="text-gray-600">
                Insights detalhados sobre performance de vendas e pipeline
              </p>
            </div>
            <div className="flex space-x-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={refreshAnalytics}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </AnimatedDashboardItem>

        {/* Quick Overview Cards */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Oportunidades</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalOpportunities}</p>
                </div>
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.overview.winRate.toFixed(1)}%
                  </p>
                </div>
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(analytics.overview.totalPipelineValue)}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(analytics.overview.wonValue)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg p-4 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ciclo Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.overview.avgSalesCycle.toFixed(0)}d
                  </p>
                </div>
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </motion.div>
          </div>
        </AnimatedDashboardItem>

        {/* Tabs Section */}
        <AnimatedDashboardItem>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="loss" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Perdas</span>
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Forecast</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="stages" className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span>Estágios</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Fontes</span>
              </TabsTrigger>
              <TabsTrigger value="targets" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Metas</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stage Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Estágio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.trends.stageDistribution.map((stage) => (
                        <div key={stage.stage} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stageColors[stage.stage] }}
                              />
                              <span className="text-sm font-medium">
                                {stageLabels[stage.stage]}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-600">{stage.count}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({stage.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Valor: {formatCurrency(stage.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">Pipeline Ponderado</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(analytics.overview.weightedPipelineValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Ticket Médio</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(analytics.overview.avgDealSize)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm font-medium">Revenue Fechado</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(analytics.overview.wonValue)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trends Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Oportunidades por Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.trends.opportunitiesPerWeek.map((week) => (
                        <div key={week.week} className="flex items-center space-x-4">
                          <div className="w-16 text-xs text-gray-600">{week.week}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(week.count / Math.max(...analytics.trends.opportunitiesPerWeek.map(w => w.count), 1)) * 100}%`
                              }}
                            />
                          </div>
                          <div className="w-8 text-sm font-medium text-right">{week.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Receita por Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.trends.revenuePerWeek.map((week) => (
                        <div key={week.week} className="flex items-center space-x-4">
                          <div className="w-16 text-xs text-gray-600">{week.week}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(week.revenue / Math.max(...analytics.trends.revenuePerWeek.map(w => w.revenue), 1)) * 100}%`
                              }}
                            />
                          </div>
                          <div className="w-20 text-xs font-medium text-right">
                            {formatCurrency(week.revenue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Loss Analysis Tab */}
            <TabsContent value="loss" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Motivos de Perda</CardTitle>
                    <p className="text-sm text-gray-600">
                      Valor total perdido: {formatCurrency(analytics.lossAnalysis.totalLostValue)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.lossAnalysis.lossReasons.map((reason, index) => (
                        <div key={reason.reason} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${index * 45 + 15}, 65%, 55%)`
                                }}
                              />
                              <span className="text-sm font-medium">
                                {lossReasonLabels[reason.reason] || reason.reason}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-600">{reason.count}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({reason.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Valor perdido: {formatCurrency(reason.value)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: `hsl(${index * 45 + 15}, 65%, 55%)`,
                                width: `${reason.percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Insights de Marketing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Principais Oportunidades</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {analytics.lossAnalysis.lossReasons
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 3)
                            .map((reason) => (
                              <li key={reason.reason}>
                                • {lossReasonLabels[reason.reason]} - {reason.count} casos
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Recomendações</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Revisar processo de qualificação</li>
                          <li>• Melhorar comunicação de valor</li>
                          <li>• Analisar positioning vs concorrência</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Forecast Tab */}
            <TabsContent value="forecast" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Próximos 30 Dias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(analytics.forecast.next30Days)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Receita Ponderada Prevista</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Próximos 60 Dias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(analytics.forecast.next60Days)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Receita Ponderada Prevista</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Próximos 90 Dias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(analytics.forecast.next90Days)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Receita Ponderada Prevista</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Crescimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="font-medium">Crescimento 30→60 dias</span>
                      <span className={`font-bold ${
                        analytics.forecast.next60Days > analytics.forecast.next30Days
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {analytics.forecast.next30Days > 0
                          ? `${(((analytics.forecast.next60Days - analytics.forecast.next30Days) / analytics.forecast.next30Days) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="font-medium">Crescimento 60→90 dias</span>
                      <span className={`font-bold ${
                        analytics.forecast.next90Days > analytics.forecast.next60Days
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {analytics.forecast.next60Days > 0
                          ? `${(((analytics.forecast.next90Days - analytics.forecast.next60Days) / analytics.forecast.next60Days) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Performance por Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.performance.topPerformers.map((performer, index) => (
                      <motion.div
                        key={performer.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.userName}</p>
                            <p className="text-sm text-gray-600">
                              {performer.opportunitiesWon}/{performer.totalOpportunities} oportunidades
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(performer.revenue)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {performer.winRate.toFixed(1)}% conversão
                          </div>
                          <div className="text-xs text-gray-500">
                            Ticket: {formatCurrency(performer.totalOpportunities > 0 ? performer.revenue / performer.opportunitiesWon : 0)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stage Analysis Tab */}
            <TabsContent value="stages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo Médio por Estágio</CardTitle>
                  <p className="text-sm text-gray-600">
                    Identifique gargalos no processo de vendas
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.stageAnalysis.avgStageTimings
                      .sort((a, b) => b.avgHours - a.avgHours)
                      .map((stage, index) => (
                        <div key={stage.stage} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: stageColors[stage.stage] || '#6B7280' }}
                              />
                              <span className="font-medium">{stageLabels[stage.stage] || stage.stage}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-gray-900">
                                {formatHours(stage.avgHours)}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({stage.count} amostras)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: stageColors[stage.stage] || '#6B7280',
                                width: `${(stage.avgHours / Math.max(...analytics.stageAnalysis.avgStageTimings.map(s => s.avgHours), 1)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Source Analysis Tab */}
            <TabsContent value="sources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada por Fonte</CardTitle>
                  <p className="text-sm text-gray-600">
                    Compare qualidade e performance por origem
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analytics.sourceAnalysis.sources
                      .sort((a, b) => b.avgTicket - a.avgTicket)
                      .map((source, index) => (
                        <div key={source.source} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                                }}
                              />
                              <span className="font-medium text-lg">{source.source}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {source.percentage.toFixed(1)}% do volume
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-600">Volume</p>
                              <p className="text-xl font-bold text-blue-600">{source.count}</p>
                            </div>

                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-600">Ticket Médio</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(source.avgTicket)}
                              </p>
                            </div>

                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-600">Taxa Conversão</p>
                              <p className="text-xl font-bold text-purple-600">
                                {source.conversionRate.toFixed(1)}%
                              </p>
                            </div>

                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-600">Revenue Total</p>
                              <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(source.wonValue)}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>{source.wonCount} oportunidades fechadas</span>
                            <span>de {source.count} total</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Targets Tab */}
            <TabsContent value="targets" className="space-y-6">
              {analytics.targets && (
                <div className="space-y-6">
                  {/* Progress Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Meta vs Receita Atual - {analytics.targets.currentMonth}</span>
                        <div className="flex items-center space-x-3">
                          {session?.user?.role === 'ADMIN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTargetsModalOpen(true)}
                              className="flex items-center space-x-2"
                            >
                              <Target className="h-4 w-4" />
                              <span>Configurar Metas</span>
                            </Button>
                          )}
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            analytics.targets.status === 'achieved'
                              ? 'bg-green-100 text-green-800'
                              : analytics.targets.status === 'on-track'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {analytics.targets.status === 'achieved' ? '✅ Meta Atingida'
                             : analytics.targets.status === 'on-track' ? '🎯 No Caminho'
                             : '⚠️ Em Risco'}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso atual: {analytics.targets.progressPercentage.toFixed(1)}%</span>
                            <span>{formatCurrency(analytics.targets.actualRevenue)} / {formatCurrency(analytics.targets.totalTarget)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full transition-all duration-500 ${
                                analytics.targets.progressPercentage >= 100
                                  ? 'bg-green-500'
                                  : analytics.targets.progressPercentage >= 80
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(analytics.targets.progressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Receita Atual</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(analytics.targets.actualRevenue)}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Meta Total</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(analytics.targets.totalTarget)}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Restante</p>
                            <p className="text-xl font-bold text-orange-600">
                              {formatCurrency(analytics.targets.remaining)}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Projeção</p>
                            <p className="text-xl font-bold text-purple-600">
                              {formatCurrency(analytics.targets.projectedRevenue)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Base: {analytics.targets.daysPassed}/{analytics.targets.daysInMonth} dias
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Performance */}
                  {analytics.targets.userBreakdown.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Individual</CardTitle>
                        <p className="text-sm text-gray-600">
                          Acompanhe o progresso de cada membro da equipe
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.targets.userBreakdown
                            .sort((a, b) => b.percentage - a.percentage)
                            .map((user, index) => (
                              <div key={user.userId} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      user.status === 'achieved' ? 'bg-green-500'
                                      : user.status === 'on-track' ? 'bg-blue-500'
                                      : 'bg-red-500'
                                    }`} />
                                    <div>
                                      <p className="font-medium">{user.userName}</p>
                                      <p className="text-sm text-gray-500">{user.userRole}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-lg">{user.percentage.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-500">
                                      {formatCurrency(user.actual)} / {formatCurrency(user.target)}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        user.percentage >= 100 ? 'bg-green-500'
                                        : user.percentage >= 80 ? 'bg-blue-500'
                                        : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(user.percentage, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Restante: {formatCurrency(user.remaining)}</span>
                                    <span>{user.status === 'achieved' ? 'Meta atingida!'
                                           : user.status === 'on-track' ? 'No caminho'
                                           : 'Precisa acelerar'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </AnimatedDashboardItem>
      </div>

      {/* Targets Configuration Modal */}
      <TargetsModal
        isOpen={targetsModalOpen}
        onClose={() => setTargetsModalOpen(false)}
        onSave={() => {
          setTargetsModalOpen(false)
          fetchAnalytics() // Refresh data after saving
        }}
      />
    </AnimatedDashboardContainer>
  )
}