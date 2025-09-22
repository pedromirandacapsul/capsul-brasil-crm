'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Save,
  AlertCircle,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PipelineStage {
  id: string
  name: string
  position: number
  probability: number
  color: string
  active: boolean
}

interface PipelineAnalytics {
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

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchData()
  }, [timeframe])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stagesResponse, analyticsResponse] = await Promise.all([
        fetch('/api/pipeline?action=stages'),
        fetch(`/api/pipeline?action=analytics&timeframe=${timeframe}`),
      ])

      if (stagesResponse.ok) {
        const stagesData = await stagesResponse.json()
        setStages(stagesData.data)
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do pipeline')
    } finally {
      setLoading(false)
    }
  }

  const initializeStages = async () => {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initialize-stages' }),
      })

      if (response.ok) {
        toast.success('Estágios padrão criados com sucesso')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao inicializar estágios')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const saveStages = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update-stages', stages }),
      })

      if (response.ok) {
        toast.success('Estágios salvos com sucesso')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar estágios')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setSaving(false)
    }
  }

  const addStage = () => {
    const newStage: PipelineStage = {
      id: '',
      name: 'Novo Estágio',
      position: stages.length + 1,
      probability: 50,
      color: '#3B82F6',
      active: true,
    }
    setStages([...stages, newStage])
  }

  const updateStage = (index: number, field: keyof PipelineStage, value: any) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setStages(newStages)
  }

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index)
    setStages(newStages)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Avançado</h1>
          <p className="text-muted-foreground">
            Gerencie estágios, probabilidades e analise a performance do seu funil de vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {stages.length === 0 && (
            <Button onClick={initializeStages} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Estágios Padrão
            </Button>
          )}
        </div>
      </div>

      {stages.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum estágio configurado. Clique em "Criar Estágios Padrão" para começar ou configure manualmente.
          </AlertDescription>
        </Alert>
      )}

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Ponderado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics.weightedValue)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Previsão Este Mês</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(analytics.forecastRevenue.thisMonth)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Previsão Trimestre</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(analytics.forecastRevenue.thisQuarter)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stages">Configurar Estágios</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Distribuição por Estágio</CardTitle>
                      <CardDescription>
                        Quantidade e valor dos leads em cada estágio
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={timeframe === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeframe('30d')}
                      >
                        30 dias
                      </Button>
                      <Button
                        variant={timeframe === '90d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeframe('90d')}
                      >
                        90 dias
                      </Button>
                      <Button
                        variant={timeframe === '1y' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeframe('1y')}
                      >
                        1 ano
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.stageDistribution.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stages.find(s => s.name === stage.stage)?.color || '#3B82F6' }}
                          />
                          <span className="font-medium">{stage.stage}</span>
                          <Badge variant="secondary">
                            {stage.probability}% prob.
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{stage.count} leads</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(stage.value)}
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={(stage.count / analytics.stageDistribution.reduce((sum, s) => sum + s.count, 0)) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configurar Estágios do Pipeline</CardTitle>
                  <CardDescription>
                    Defina os estágios, probabilidades e cores do seu pipeline
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addStage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Estágio
                  </Button>
                  <Button onClick={saveStages} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                  <div className="col-span-1">
                    <Label>Posição</Label>
                    <Input
                      type="number"
                      value={stage.position}
                      onChange={(e) => updateStage(index, 'position', parseInt(e.target.value))}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Nome do Estágio</Label>
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Probabilidade (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stage.probability}
                      onChange={(e) => updateStage(index, 'probability', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={stage.color}
                        onChange={(e) => updateStage(index, 'color', e.target.value)}
                        className="w-12 h-10"
                      />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Status</Label>
                    <Badge variant={stage.active ? 'default' : 'secondary'}>
                      {stage.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStage(index)}
                      className="w-full"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo Médio por Estágio</CardTitle>
                  <CardDescription>
                    Quantos dias os leads passam em cada estágio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.averageTimeInStage.map((stage, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{stage.averageDays.toFixed(1)} dias</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Previsão de Receita</CardTitle>
                  <CardDescription>
                    Baseada nas probabilidades e valores dos deals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Este Mês</span>
                      <span className="text-green-600 font-bold">
                        {formatCurrency(analytics.forecastRevenue.thisMonth)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Próximo Mês</span>
                      <span className="text-blue-600 font-bold">
                        {formatCurrency(analytics.forecastRevenue.nextMonth)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Este Trimestre</span>
                      <span className="text-purple-600 font-bold">
                        {formatCurrency(analytics.forecastRevenue.thisQuarter)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}