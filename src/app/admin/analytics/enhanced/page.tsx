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
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  LabelList
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  Clock,
  Zap,
  Award,
  Activity,
  TrendingUpIcon,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EnhancedAnalyticsData {
  overview: {
    totalLeads: number
    newLeads: number
    convertedLeads: number
    conversionRate: number
    totalTasks: number
    completedTasks: number
    averageResponseTime: number
    totalRevenue: number
    avgTicket: number
    pipelineValue: number
  }
  funnel: {
    stage: string
    value: number
    conversion: number
    label: string
  }[]
  speedMetrics: {
    firstContactSLA: number
    avgQualificationTime: number
    avgNegotiationTime: number
    avgClosingTime: number
    slaCompliance: number
  }
  sourceQuality: {
    source: string
    volume: number
    conversionRate: number
    avgTicket: number
    quality: 'high' | 'medium' | 'low'
  }[]
  lossReasons: {
    reason: string
    count: number
    percentage: number
  }[]
  salesmanPerformance: {
    userId: string
    userName: string
    conversionRate: number
    avgTicket: number
    avgClosingTime: number
    leadsConverted: number
    tasksCompleted: number
    revenue: number
  }[]
  teamEngagement: {
    userId: string
    userName: string
    callsMade: number
    whatsappSent: number
    emailsSent: number
    score: number
  }[]
  forecast: {
    expectedLeads: number
    expectedRevenue: number
    probability: number
    period: string
  }[]
  financialPipeline: {
    wonRevenue: number
    pipelineValue: number
    lostValue: number
    projectedRevenue: number
  }
  cohortAnalysis: {
    month: string
    totalLeads: number
    convertedNext: number
    conversionRate: number
    maturationDays: number
  }[]
  clvAnalysis: {
    averageClv: number
    clvBySource: {
      source: string
      avgClv: number
      totalCustomers: number
      totalValue: number
    }[]
    clvTrend: { month: string; clv: number }[]
  }
  cacAnalysis: {
    averageCac: number
    cacBySource: {
      source: string
      cac: number
      volume: number
      efficiency: number
    }[]
    cacTrend: { month: string; cac: number }[]
  }
  pipelineHealth: {
    avgTimePerStage: Record<string, number>
    bottlenecks: {
      stage: string
      avgDays: number
      stuckDeals: number
      impact: 'low' | 'medium' | 'high'
    }[]
    stageConversion: {
      stage: string
      conversionToNext: number
      dropOffRate: number
    }[]
  }
  smartAlerts: {
    id: number
    type: 'success' | 'warning' | 'critical'
    title: string
    message: string
    severity: 'low' | 'medium' | 'high'
    actionable: boolean
    suggestions?: string[]
  }[]
  trends: {
    leadsPerWeek: { week: string; count: number }[]
    revenuePerWeek: { week: string; revenue: number }[]
    conversionPerWeek: { week: string; rate: number }[]
    sourceBreakdown: { source: string; count: number; percentage: number }[]
    statusDistribution: { status: string; count: number; percentage: number }[]
  }
  performance: {
    topPerformers: {
      userId: string
      userName: string
      leadsConverted: number
      conversionRate: number
      tasksCompleted: number
    }[]
    teamMetrics: {
      totalUsers: number
      activeUsers: number
      averageLeadsPerUser: number
      averageTasksPerUser: number
    }
  }
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
  teal: '#14B8A6',
  orange: '#F97316'
}

const statusColors: Record<string, string> = {
  NEW: COLORS.primary,
  CONTACTED: COLORS.warning,
  QUALIFIED: COLORS.teal,
  PROPOSAL: COLORS.purple,
  WON: COLORS.success,
  LOST: COLORS.danger,
}

const statusLabels: Record<string, string> = {
  NEW: 'Novos',
  CONTACTED: 'Contatados',
  QUALIFIED: 'Qualificados',
  PROPOSAL: 'Proposta',
  WON: 'Ganhos',
  LOST: 'Perdidos',
}

export default function EnhancedAnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<EnhancedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedView, setSelectedView] = useState<'overview' | 'funnel' | 'performance' | 'forecast' | 'advanced'>('overview')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/enhanced?period=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  const exportData = () => {
    if (!analytics) return

    const exportContent = [
      `Relatório de Analytics - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      `Período: Últimos ${dateRange} dias`,
      '',
      '=== VISÃO GERAL ===',
      `Total de Leads: ${analytics.overview.totalLeads}`,
      `Novos Leads: ${analytics.overview.newLeads}`,
      `Taxa de Conversão: ${analytics.overview.conversionRate.toFixed(1)}%`,
      `Receita Total: R$ ${analytics.overview.totalRevenue.toLocaleString('pt-BR')}`,
      `Ticket Médio: R$ ${analytics.overview.avgTicket.toLocaleString('pt-BR')}`,
      '',
      '=== FUNIL DE VENDAS ===',
      ...analytics.funnel.map(stage =>
        `${stage.label}: ${stage.value} leads (${stage.conversion.toFixed(1)}%)`
      ),
      '',
      '=== TOP PERFORMERS ===',
      ...analytics.salesmanPerformance.slice(0, 5).map((perf, index) =>
        `${index + 1}. ${perf.userName}: ${perf.conversionRate.toFixed(1)}% conversão, R$ ${perf.revenue.toLocaleString('pt-BR')} receita`
      )
    ].join('\n')

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao Carregar</h1>
          <p className="text-gray-600">Não foi possível carregar os dados de analytics.</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Enhanced</h1>
          <p className="text-gray-600">
            Dashboard executivo com insights estratégicos
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
      </motion.div>

      {/* View Selector */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <Button
          variant={selectedView === 'overview' ? 'default' : 'outline'}
          onClick={() => setSelectedView('overview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visão Geral
        </Button>
        <Button
          variant={selectedView === 'funnel' ? 'default' : 'outline'}
          onClick={() => setSelectedView('funnel')}
        >
          <Target className="h-4 w-4 mr-2" />
          Funil & Pipeline
        </Button>
        <Button
          variant={selectedView === 'performance' ? 'default' : 'outline'}
          onClick={() => setSelectedView('performance')}
        >
          <Award className="h-4 w-4 mr-2" />
          Performance
        </Button>
        <Button
          variant={selectedView === 'forecast' ? 'default' : 'outline'}
          onClick={() => setSelectedView('forecast')}
        >
          <TrendingUpIcon className="h-4 w-4 mr-2" />
          Forecast
        </Button>
        <Button
          variant={selectedView === 'advanced' ? 'default' : 'outline'}
          onClick={() => setSelectedView('advanced')}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          CRM Futuro
        </Button>
      </motion.div>

      <div>
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Enhanced Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{analytics.overview.totalLeads}</div>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics.overview.newLeads} novos
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.overview.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-600">
                      {analytics.overview.convertedLeads} convertidos
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {(analytics.overview.totalRevenue / 1000).toFixed(0)}K
                    </div>
                    <p className="text-xs text-gray-600">
                      Ticket: R$ {analytics.overview.avgTicket.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
                    <Activity className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      R$ {(analytics.overview.pipelineValue / 1000).toFixed(0)}K
                    </div>
                    <p className="text-xs text-gray-600">
                      Em negociação
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">SLA 1º Contato</CardTitle>
                    <Clock className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-600">
                      {analytics.speedMetrics.slaCompliance.toFixed(0)}%
                    </div>
                    <p className="text-xs text-gray-600">
                      {analytics.speedMetrics.firstContactSLA.toFixed(1)}h médio
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quality by Source */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Qualidade por Fonte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.sourceQuality}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'conversionRate' ? `${value}%` : value,
                            name === 'conversionRate' ? 'Taxa Conversão' : 'Volume'
                          ]}
                        />
                        <Bar yAxisId="left" dataKey="volume" fill={COLORS.primary} name="Volume" />
                        <Bar yAxisId="right" dataKey="conversionRate" fill={COLORS.success} name="Conversão %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {selectedView === 'funnel' && (
          <div className="space-y-6">
            {/* Sales Funnel */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Funil de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analytics.funnel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={120} />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'conversion' ? `${Number(value).toFixed(1)}%` : value,
                            name === 'conversion' ? 'Conversão' : 'Leads'
                          ]}
                        />
                        <Bar dataKey="value" fill={COLORS.primary} name="Leads">
                          <LabelList
                            dataKey="conversion"
                            position="right"
                            formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Pipeline Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-800 font-medium">Receita Fechada</span>
                        <span className="text-2xl font-bold text-green-600">
                          R$ {analytics.financialPipeline.wonRevenue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-800 font-medium">Pipeline Ativo</span>
                        <span className="text-2xl font-bold text-blue-600">
                          R$ {analytics.financialPipeline.pipelineValue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-red-800 font-medium">Receita Perdida</span>
                        <span className="text-2xl font-bold text-red-600">
                          R$ {analytics.financialPipeline.lostValue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <span className="text-purple-800 font-medium">Projeção 30d</span>
                        <span className="text-2xl font-bold text-purple-600">
                          R$ {analytics.financialPipeline.projectedRevenue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Loss Reasons Analysis */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Motivos de Perda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.lossReasons}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {analytics.lossReasons.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name, props: any) => [
                            `${value} (${props.payload.percentage.toFixed(1)}%)`,
                            props.payload.reason
                          ]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {analytics.lossReasons.map((reason, index) => (
                        <div key={reason.reason} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                            />
                            <span>{reason.reason}</span>
                          </div>
                          <span className="font-medium">{reason.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {selectedView === 'performance' && (
          <div className="space-y-6">
            {/* Enhanced Salesman Performance */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Performance Individual Detalhada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.salesmanPerformance.slice(0, 8).map((performer, index) => (
                      <motion.div
                        key={performer.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{performer.userName}</h4>
                            <p className="text-sm text-gray-600">
                              {performer.leadsConverted} conversões • {performer.tasksCompleted} tarefas
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {performer.conversionRate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500">Conversão</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              R$ {performer.avgTicket.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-500">Ticket Médio</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {performer.avgClosingTime.toFixed(1)}d
                            </div>
                            <p className="text-xs text-gray-500">Tempo Fechamento</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            R$ {(performer.revenue / 1000).toFixed(0)}K
                          </div>
                          <p className="text-xs text-gray-500">Receita Total</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Engagement Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-teal-600" />
                      Heatmap de Engajamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.teamEngagement.slice(0, 6).map((member, index) => (
                        <div key={member.userId} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{member.userName}</span>
                            <span className="text-xs text-gray-500">Score: {member.score}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-lg font-bold text-blue-600">{member.callsMade}</div>
                              <div className="text-xs text-blue-600">Calls</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-lg font-bold text-green-600">{member.whatsappSent}</div>
                              <div className="text-xs text-green-600">WhatsApp</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="text-lg font-bold text-purple-600">{member.emailsSent}</div>
                              <div className="text-xs text-purple-600">Emails</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${member.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Speed Metrics */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Métricas de Velocidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">1º Contato SLA</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-teal-600">
                            {analytics.speedMetrics.firstContactSLA.toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-500">
                            {analytics.speedMetrics.slaCompliance.toFixed(0)}% compliance
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tempo Qualificação</span>
                        <div className="text-lg font-bold text-blue-600">
                          {analytics.speedMetrics.avgQualificationTime.toFixed(1)}h
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tempo Negociação</span>
                        <div className="text-lg font-bold text-orange-600">
                          {analytics.speedMetrics.avgNegotiationTime.toFixed(1)}d
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Tempo Fechamento</span>
                        <div className="text-lg font-bold text-purple-600">
                          {analytics.speedMetrics.avgClosingTime.toFixed(1)}d
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {((analytics.speedMetrics.firstContactSLA + analytics.speedMetrics.avgQualificationTime) / 2).toFixed(1)}h
                          </div>
                          <p className="text-sm text-gray-600">Tempo Médio de Resposta</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {selectedView === 'forecast' && (
          <div className="space-y-6">
            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.forecast.map((forecast, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-3xl opacity-10" />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                        {forecast.period}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Leads Esperados</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {forecast.expectedLeads}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Receita Projetada</span>
                          <span className="text-2xl font-bold text-green-600">
                            R$ {(forecast.expectedRevenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Probabilidade</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-orange-600">
                              {forecast.probability}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${forecast.probability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Revenue Trends */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Tendência de Receita vs Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trends.leadsPerWeek.map((week, index) => ({
                        ...week,
                        revenue: analytics.trends.revenuePerWeek[index]?.revenue || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'revenue' ? `R$ ${Number(value).toLocaleString('pt-BR')}` : value,
                            name === 'revenue' ? 'Receita' : 'Leads'
                          ]}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={3} name="Leads" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={COLORS.success} strokeWidth={3} name="Receita" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Conversion Trends */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Evolução da Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.trends.conversionPerWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Conversão']} />
                        <Area
                          type="monotone"
                          dataKey="rate"
                          stroke={COLORS.purple}
                          fill={COLORS.purple}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {selectedView === 'advanced' && (
          <div className="space-y-6">
            {/* Smart Alerts */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Alertas Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.smartAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.type === 'critical'
                            ? 'bg-red-50 border-red-500'
                            : alert.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-green-50 border-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className={`font-semibold ${
                              alert.type === 'critical'
                                ? 'text-red-800'
                                : alert.type === 'warning'
                                ? 'text-yellow-800'
                                : 'text-green-800'
                            }`}>
                              {alert.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              alert.type === 'critical'
                                ? 'text-red-600'
                                : alert.type === 'warning'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {alert.message}
                            </p>
                            {alert.suggestions && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Sugestões:</p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {alert.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cohort Analysis & CLV Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort Analysis */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Análise de Cohort
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.cohortAnalysis.map((cohort, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{cohort.month}</h4>
                            <p className="text-sm text-gray-600">{cohort.totalLeads} leads gerados</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {cohort.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {cohort.convertedNext} convertidos
                            </div>
                            <div className="text-xs text-gray-400">
                              ~{cohort.maturationDays.toFixed(0)} dias
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* CLV Analysis */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Customer Lifetime Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          R$ {analytics.clvAnalysis.averageClv.toLocaleString('pt-BR')}
                        </div>
                        <p className="text-sm text-green-700">CLV Médio</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">CLV por Fonte</h4>
                        {analytics.clvAnalysis.clvBySource.slice(0, 4).map((source, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{source.source}</span>
                            <span className="font-medium">
                              R$ {source.avgClv.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* CAC Analysis & Pipeline Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CAC Analysis */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Custo de Aquisição (CAC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">
                          R$ {analytics.cacAnalysis.averageCac.toLocaleString('pt-BR')}
                        </div>
                        <p className="text-sm text-orange-700">CAC Médio</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Eficiência por Fonte</h4>
                        {analytics.cacAnalysis.cacBySource.slice(0, 4).map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{source.source}</span>
                              <div className="text-xs text-gray-500">
                                CAC: R$ {source.cac.toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <div className={`px-2 py-1 text-xs rounded ${
                              source.efficiency > 10
                                ? 'bg-green-100 text-green-800'
                                : source.efficiency > 5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {source.efficiency.toFixed(1)}x ROI
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pipeline Health */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Saúde do Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Gargalos Críticos</h4>
                        {analytics.pipelineHealth.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className={`p-3 rounded-lg mb-2 ${
                            bottleneck.impact === 'high'
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{bottleneck.stage}</span>
                                <div className="text-sm text-gray-600">
                                  {bottleneck.stuckDeals} deals travados
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  bottleneck.impact === 'high' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {bottleneck.avgDays.toFixed(1)}d
                                </div>
                                <div className="text-xs text-gray-500">tempo médio</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tempo por Estágio</h4>
                        <div className="space-y-1">
                          {Object.entries(analytics.pipelineHealth.avgTimePerStage).map(([stage, days]) => (
                            <div key={stage} className="flex justify-between text-sm">
                              <span className="text-gray-600">{stage}</span>
                              <span className="font-medium">{Number(days).toFixed(1)}d</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}