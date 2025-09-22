'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SchedulerStatus {
  totalJobs: number
  activeJobs: number
  jobs: Array<{
    triggerId: string
    cronExpression: string
    isRunning: boolean
  }>
}

interface ExecutionStats {
  total: number
  pending: number
  running: number
  completed: number
  error: number
  recentExecutions: Array<{
    id: string
    flowName: string
    triggerName: string
    status: string
    startedAt: string
    completedAt: string | null
    conversationId: string
    contactName: string
  }>
}

export default function MonitorPage() {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [executionStats, setExecutionStats] = useState<ExecutionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    if (!refreshing) setLoading(true)

    try {
      // Carregar status do scheduler
      const schedulerResponse = await fetch('/api/system/scheduler')
      if (schedulerResponse.ok) {
        const schedulerData = await schedulerResponse.json()
        setSchedulerStatus(schedulerData.scheduler)
      }

      // Carregar estatísticas de execuções
      const statsResponse = await fetch('/api/whatsapp/executions/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setExecutionStats(statsData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados do monitor:', error)
      toast.error('Erro ao carregar dados do monitor')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const handleSchedulerAction = async (action: string) => {
    try {
      const response = await fetch('/api/system/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao executar ação')
      }
    } catch (error) {
      console.error('Erro ao executar ação no scheduler:', error)
      toast.error('Erro ao executar ação')
    }
  }

  const initializeSystem = async () => {
    try {
      const response = await fetch('/api/system/init', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Sistema inicializado com sucesso')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao inicializar sistema')
      }
    } catch (error) {
      console.error('Erro ao inicializar sistema:', error)
      toast.error('Erro ao inicializar sistema')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'RUNNING':
        return <Badge variant="default"><Play className="w-3 h-3 mr-1" />Executando</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/whatsapp/automacao">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Monitor do Sistema</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando dados do sistema...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/whatsapp/automacao">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Monitor do Sistema</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={initializeSystem}
          >
            <Activity className="w-4 h-4 mr-2" />
            Inicializar Sistema
          </Button>
        </div>
      </div>

      {/* Status do Scheduler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Agendados</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedulerStatus?.totalJobs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedulerStatus?.activeJobs || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Totais</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executionStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {executionStats?.pending || 0} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executionStats?.total ?
                Math.round((executionStats.completed / executionStats.total) * 100) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              {executionStats?.completed || 0} concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles do Scheduler */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Controles do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSchedulerAction('restart')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reiniciar Scheduler
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSchedulerAction('stop_all')}
            >
              <Pause className="w-4 h-4 mr-2" />
              Parar Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Agendados */}
      {schedulerStatus && schedulerStatus.jobs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Jobs Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedulerStatus.jobs.map((job, index) => (
                <div key={job.triggerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${job.isRunning ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium text-sm">Trigger {job.triggerId.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{job.cronExpression}</p>
                    </div>
                  </div>
                  <Badge variant={job.isRunning ? "default" : "secondary"}>
                    {job.isRunning ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execuções Recentes */}
      {executionStats && executionStats.recentExecutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Execuções Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executionStats.recentExecutions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{execution.flowName}</p>
                      <p className="text-xs text-muted-foreground">
                        {execution.triggerName} → {execution.contactName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(execution.startedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(execution.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {(!schedulerStatus || schedulerStatus.totalJobs === 0) &&
       (!executionStats || executionStats.total === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Sistema Não Inicializado</h3>
            <p className="text-muted-foreground mb-4">
              O sistema de automação ainda não foi inicializado. Clique no botão abaixo para começar.
            </p>
            <Button onClick={initializeSystem}>
              <Activity className="w-4 h-4 mr-2" />
              Inicializar Sistema
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}