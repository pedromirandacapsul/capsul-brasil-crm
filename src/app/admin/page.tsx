'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardMetrics {
  overview: {
    totalLeads: number
    leadsToday: number
    leadsThisWeek: number
    leadsThisMonth: number
    leadsGrowth: number
    qualifiedLeads: number
    qualifiedGrowth: number
    conversionRate: number
    conversionGrowth: number
    pendingTasks: number
    overdueTasks: number
  }
  leadsByStatus: Array<{ status: string; count: number }>
  recentActivities: Array<{
    id: string
    type: string
    leadName: string
    leadCompany?: string
    userName: string
    createdAt: string
  }>
  userPerformance: Array<{
    id: string
    name: string
    totalLeads: number
    wonLeads: number
    conversionRate: number
  }>
}

const statusLabels: Record<string, string> = {
  NEW: 'Novos',
  CONTACTED: 'Contatados',
  QUALIFIED: 'Qualificados',
  PROPOSAL: 'Proposta',
  WON: 'Ganhos',
  LOST: 'Perdidos'
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMetrics(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatGrowth = (growth: number) => {
    const formatted = Math.abs(growth).toFixed(1)
    const icon = growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
    const color = growth >= 0 ? 'text-green-600' : 'text-red-600'
    const sign = growth >= 0 ? '+' : '-'

    return (
      <div className={`flex items-center ${color}`}>
        {icon}
        <span className="ml-1">{sign}{formatted}%</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {session?.user.name || 'Usuário'}!
        </h1>
        <p className="text-gray-600">
          Aqui está um resumo das atividades recentes do seu negócio.
        </p>
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                  <p className="text-3xl font-bold text-blue-600">{metrics.overview.totalLeads}</p>
                  {formatGrowth(metrics.overview.leadsGrowth)}
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {metrics.overview.leadsToday} hoje • {metrics.overview.leadsThisWeek} esta semana
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leads Qualificados</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.overview.qualifiedLeads}</p>
                  {formatGrowth(metrics.overview.qualifiedGrowth)}
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-purple-600">{metrics.overview.conversionRate.toFixed(1)}%</p>
                  {formatGrowth(metrics.overview.conversionGrowth)}
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks Pendentes</p>
                  <p className="text-3xl font-bold text-orange-600">{metrics.overview.pendingTasks}</p>
                  {metrics.overview.overdueTasks > 0 && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {metrics.overview.overdueTasks} atrasadas
                    </div>
                  )}
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribução por Status - Simples sem gráficos */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Leads por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.leadsByStatus.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{statusLabels[item.status] || item.status}</span>
                    <span className="text-lg font-bold text-blue-600">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.userPerformance.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">
                        {user.totalLeads} leads • {user.wonLeads} vendas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {user.conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">conversão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Atividades Recentes */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.type} - {activity.leadName}
                    </p>
                    <p className="text-xs text-gray-600">
                      por {activity.userName} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>Modo Simplificado:</strong> Gráficos desabilitados temporariamente para evitar problemas de performance.
          <br />
          <a href="/admin/analytics" className="text-blue-600 underline">Acesse a página de Analytics</a> para visualizações completas.
        </p>
      </div>
    </div>
  )
}