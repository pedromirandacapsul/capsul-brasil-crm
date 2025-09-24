'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointer,
  Eye,
  XCircle,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MetricCard {
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<any>
  color: string
}

interface CampaignPerformance {
  id: string
  name: string
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  unsubscribedCount: number
  openRate: number
  clickRate: number
  bounceRate: number
  createdAt: string
}

interface TimeSeriesData {
  date: string
  sent: number
  opened: number
  clicked: number
  bounced: number
}

interface HourlyData {
  hour: number
  opens: number
  clicks: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function EmailAnalyticsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')

  // Estados dos dados
  const [overallMetrics, setOverallMetrics] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])

  // Verificar permissões
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.EMAIL_MARKETING)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)

      // Calcular período baseado no dateRange
      const endDate = new Date()
      const startDate = subDays(endDate, parseInt(dateRange))

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        campaign: selectedCampaign
      })

      const [metricsRes, campaignsRes, timeSeriesRes] = await Promise.all([
        fetch('/api/email-marketing/analytics/overview?' + params),
        fetch('/api/email-marketing/analytics/campaigns?' + params),
        fetch('/api/email-marketing/analytics/timeseries?' + params)
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setOverallMetrics(metricsData)
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData.campaigns || [])
      }

      if (timeSeriesRes.ok) {
        const timeSeriesRes_data = await timeSeriesRes.json()
        setTimeSeriesData(timeSeriesRes_data.timeSeries || [])
        setHourlyData(timeSeriesRes_data.hourlyData || [])
      }

    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, selectedCampaign])

  const metricCards: MetricCard[] = overallMetrics ? [
    {
      title: 'Emails Enviados',
      value: overallMetrics.totalSent?.toLocaleString() || '0',
      change: overallMetrics.sentGrowth || 0,
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      title: 'Taxa de Abertura',
      value: `${overallMetrics.avgOpenRate?.toFixed(1) || '0'}%`,
      change: overallMetrics.openRateGrowth || 0,
      icon: Eye,
      color: 'text-green-600'
    },
    {
      title: 'Taxa de Clique',
      value: `${overallMetrics.avgClickRate?.toFixed(1) || '0'}%`,
      change: overallMetrics.clickRateGrowth || 0,
      icon: MousePointer,
      color: 'text-purple-600'
    },
    {
      title: 'Taxa de Bounce',
      value: `${overallMetrics.avgBounceRate?.toFixed(1) || '0'}%`,
      change: overallMetrics.bounceRateGrowth || 0,
      icon: XCircle,
      color: 'text-red-600'
    }
  ] : []

  const exportData = () => {
    const data = {
      metrics: overallMetrics,
      campaigns: campaigns,
      timeSeries: timeSeriesData,
      hourly: hourlyData,
      exportedAt: new Date().toISOString(),
      period: `${dateRange} dias`
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Email Marketing</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Email Marketing</h1>
          <p className="text-muted-foreground">
            Insights detalhados sobre performance das suas campanhas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {campaigns.slice(0, 10).map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : metric.change < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                ) : null}
                {metric.change !== 0 && (
                  <span className={metric.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                )}
                <span className="ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de Tendência */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendência de Envios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="opened" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="clicked" stackId="1" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opens" stroke="#8884d8" name="Aberturas" />
                <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Cliques" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance das Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance das Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Campanha</th>
                  <th className="text-right p-2">Enviados</th>
                  <th className="text-right p-2">Taxa Abertura</th>
                  <th className="text-right p-2">Taxa Clique</th>
                  <th className="text-right p-2">Taxa Bounce</th>
                  <th className="text-right p-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 10).map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{campaign.name}</td>
                    <td className="p-2 text-right">{campaign.sentCount.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        campaign.openRate > 25 ? 'bg-green-100 text-green-800' :
                        campaign.openRate > 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.openRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        campaign.clickRate > 5 ? 'bg-green-100 text-green-800' :
                        campaign.clickRate > 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.clickRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        campaign.bounceRate < 2 ? 'bg-green-100 text-green-800' :
                        campaign.bounceRate < 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.bounceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-gray-500">
                      {format(new Date(campaign.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">✅ Pontos Fortes</h4>
              {overallMetrics?.insights?.strengths?.map((insight: string, index: number) => (
                <p key={index} className="text-sm text-gray-600">• {insight}</p>
              )) || (
                <p className="text-sm text-gray-600">• Dados sendo analisados...</p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-orange-600">🔧 Oportunidades</h4>
              {overallMetrics?.insights?.opportunities?.map((insight: string, index: number) => (
                <p key={index} className="text-sm text-gray-600">• {insight}</p>
              )) || (
                <p className="text-sm text-gray-600">• Análises em desenvolvimento...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}