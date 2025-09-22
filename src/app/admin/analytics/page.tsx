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
  ExternalLink,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

interface AnalyticsData {
  overview: {
    totalLeads: number
    newLeads: number
    convertedLeads: number
    conversionRate: number
    totalTasks: number
    completedTasks: number
    averageResponseTime: number
    // Métricas de Oportunidades
    totalOpportunities: number
    pipelineValue: number
    wonValue: number
    averageTicket: number
  }
  trends: {
    leadsPerWeek: { week: string; count: number }[]
    conversionPerWeek: { week: string; rate: number }[]
    sourceBreakdown: { source: string; count: number; percentage: number }[]
    statusDistribution: { status: string; count: number; percentage: number }[]
    // Oportunidades
    opportunitiesPerWeek: { week: string; count: number; value: number }[]
    stageDistribution: { stage: string; count: number; value: number; percentage: number }[]
  }
  performance: {
    topPerformers: {
      userId: string
      userName: string
      leadsConverted: number
      conversionRate: number
      tasksCompleted: number
      // Métricas de Oportunidades
      opportunitiesWon: number
      totalSalesValue: number
      averageTicket: number
    }[]
    teamMetrics: {
      totalUsers: number
      activeUsers: number
      averageLeadsPerUser: number
      averageTasksPerUser: number
      averageOpportunitiesPerUser: number
      averageSalesPerUser: number
    }
  }
}

const statusColors: Record<string, string> = {
  NEW: '#3B82F6',
  CONTACTED: '#F59E0B',
  QUALIFIED: '#10B981',
  PROPOSAL: '#8B5CF6',
  WON: '#059669',
  LOST: '#EF4444',
}

const statusLabels: Record<string, string> = {
  NEW: 'Novos',
  CONTACTED: 'Contatados',
  QUALIFIED: 'Qualificados',
  PROPOSAL: 'Proposta',
  WON: 'Ganhos',
  LOST: 'Perdidos',
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?period=${dateRange}`)
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
    // TODO: Implement export functionality
    console.log('Export analytics data')
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
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Insights e métricas de performance do CRM
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => window.open('/admin/analytics/opportunities', '_blank')}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Analytics de Oportunidades
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.overview.newLeads} novos este período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.convertedLeads} leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Completadas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.completedTasks}/{analytics.overview.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {((analytics.overview.completedTasks / analytics.overview.totalTasks) * 100).toFixed(1)}% taxa de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.averageResponseTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio entre criação e primeiro contato
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.trends.sourceBreakdown.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                    />
                    <span className="text-sm font-medium">{source.source || 'Direto'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{source.count}</span>
                    <span className="text-xs text-gray-500">
                      ({source.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.trends.statusDistribution.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[status.status] }}
                    />
                    <span className="text-sm font-medium">
                      {statusLabels[status.status]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{status.count}</span>
                    <span className="text-xs text-gray-500">
                      ({status.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.topPerformers.map((performer, index) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{performer.userName}</p>
                      <p className="text-xs text-gray-600">
                        {performer.leadsConverted} conversões • {performer.tasksCompleted} tarefas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {performer.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500">taxa de conversão</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usuários Ativos</span>
                <span className="text-lg font-bold">
                  {analytics.performance.teamMetrics.activeUsers}/
                  {analytics.performance.teamMetrics.totalUsers}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Leads por Usuário</span>
                <span className="text-lg font-bold">
                  {analytics.performance.teamMetrics.averageLeadsPerUser.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tarefas por Usuário</span>
                <span className="text-lg font-bold">
                  {analytics.performance.teamMetrics.averageTasksPerUser.toFixed(1)}
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(analytics.performance.teamMetrics.activeUsers / analytics.performance.teamMetrics.totalUsers * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">Engajamento da Equipe</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Chart Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Leads por Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.trends.leadsPerWeek.map((week, index) => (
              <div key={week.week} className="flex items-center space-x-4">
                <div className="w-16 text-xs text-gray-600">{week.week}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(week.count / Math.max(...analytics.trends.leadsPerWeek.map(w => w.count))) * 100}%`
                    }}
                  />
                </div>
                <div className="w-8 text-sm font-medium text-right">{week.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}