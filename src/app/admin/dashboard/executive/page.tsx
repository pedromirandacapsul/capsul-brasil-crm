'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { exportService } from '@/services/export-service'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  Download,
  Calendar,
  RefreshCw,
  Award,
  Zap,
  PieChart,
  Activity
} from 'lucide-react'

interface KPIMetrics {
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

interface UserPerformance {
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

interface PerformanceAlert {
  type: 'low_conversion' | 'high_value_deal' | 'pipeline_stale' | 'quota_achievement'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  userId?: string
  value?: number
  threshold?: number
  recommendation?: string
}

interface PipelineAnalytics {
  stage: string
  count: number
  totalValue: number
  averageValue: number
  averageTimeInStage: number
  conversionRate: number
}

export default function ExecutiveDashboardPage() {
  const [kpis, setKpis] = useState<KPIMetrics | null>(null)
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([])
  const [pipelineAnalytics, setPipelineAnalytics] = useState<PipelineAnalytics[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/analytics/dashboard?type=overview')
      const data = await response.json()

      if (data.success) {
        setKpis(data.data.kpis)
        setUserPerformance(data.data.userPerformance)
        setPipelineAnalytics(data.data.pipelineAnalytics)
        setAlerts(data.data.alerts)
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar dados do dashboard',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    toast({
      title: '✅ Atualizado',
      description: 'Dados do dashboard atualizados com sucesso'
    })
  }

  const handleExport = async () => {
    try {
      if (!kpis || !userPerformance || !pipelineAnalytics || !alerts) {
        toast({
          title: '❌ Erro',
          description: 'Dados não carregados para exportação',
          variant: 'destructive'
        })
        return
      }

      await exportService.exportExecutiveDashboard(
        kpis,
        userPerformance,
        pipelineAnalytics,
        alerts
      )

      toast({
        title: '✅ Exportado',
        description: 'Dashboard executivo exportado com sucesso!'
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao exportar dashboard',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageColor = (stage: string) => {
    const colors = {
      'PROSPECT': 'bg-gray-100 text-gray-800',
      'QUALIFIED': 'bg-blue-100 text-blue-800',
      'PROPOSAL': 'bg-yellow-100 text-yellow-800',
      'NEGOTIATION': 'bg-orange-100 text-orange-800',
      'WON': 'bg-green-100 text-green-800',
      'LOST': 'bg-red-100 text-red-800'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Dashboard Executivo
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral de performance e KPIs principais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      {kpis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(kpis.totalRevenue)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {kpis.totalClosedWon} negócios fechados
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {kpis.conversionRate}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">
                  {kpis.totalOpportunities}/{kpis.totalLeads} leads
                </span>
                {kpis.conversionRate >= 20 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                <Target className="h-4 w-4" />
                Taxa de Ganho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {kpis.winRate}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {kpis.totalClosedWon}W / {kpis.totalClosedLost}L
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-600">
                <Activity className="h-4 w-4" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(kpis.averageDealSize)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">
                  {kpis.averageSalesTime} dias médios
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Análise de Pipeline
              </CardTitle>
              <CardDescription>
                Distribuição de oportunidades por estágio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipelineAnalytics.map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getStageColor(stage.stage)}>
                      {stage.stage}
                    </Badge>
                    <div>
                      <div className="font-medium">{stage.count} oportunidades</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(stage.totalValue)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">
                      {stage.conversionRate}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {stage.averageTimeInStage}d médio
                    </div>
                  </div>
                </motion.div>
              ))}

              {kpis && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Pipeline Total</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(kpis.pipelineValue)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Melhores performances do período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPerformance.slice(0, 5).map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-sm text-gray-600">
                        {user.dealsWon} negócios fechados
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(user.totalRevenue)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.winRate}% win rate
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertas de Performance */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas de Performance
              </CardTitle>
              <CardDescription>
                Pontos de atenção e oportunidades de melhoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{alert.title}</div>
                      <div className="text-sm mb-2">{alert.message}</div>
                      {alert.recommendation && (
                        <div className="text-xs opacity-80">
                          💡 {alert.recommendation}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-3">
                      {alert.severity}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}