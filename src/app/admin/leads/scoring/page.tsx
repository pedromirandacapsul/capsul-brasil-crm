'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Star,
  Calculator,
  BarChart3,
  Clock,
  Zap,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ScoringStats {
  totalLeads: number
  highScoreLeads: number
  mediumScoreLeads: number
  lowScoreLeads: number
  averageScore: number
  distribution: {
    high: number
    medium: number
    low: number
  }
}

interface HighScoreLead {
  id: string
  name: string
  email: string
  company: string
  score: number
  source: string
  createdAt: string
  owner?: {
    id: string
    name: string
    email: string
  }
  activities: Array<{
    id: string
    type: string
    createdAt: string
  }>
}

export default function LeadScoringPage() {
  const [stats, setStats] = useState<ScoringStats | null>(null)
  const [highScoreLeads, setHighScoreLeads] = useState<HighScoreLead[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsResponse, leadsResponse] = await Promise.all([
        fetch('/api/leads/scoring?action=stats'),
        fetch('/api/leads/scoring?action=high-score&limit=10'),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setHighScoreLeads(leadsData.data)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados de scoring')
    } finally {
      setLoading(false)
    }
  }

  const recalculateAllScores = async () => {
    setRecalculating(true)
    try {
      const response = await fetch('/api/leads/scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'recalculate-all' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao recalcular scores')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setRecalculating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50'
    if (score >= 30) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <Star className="h-4 w-4" />
    if (score >= 30) return <TrendingUp className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Lead Scoring</h1>
          <p className="text-muted-foreground">
            Sistema automático de pontuação e priorização de leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={recalculateAllScores}
            disabled={recalculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {recalculating ? 'Recalculando...' : 'Recalcular Tudo'}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          O lead scoring é calculado automaticamente baseado na fonte, UTMs, atividades e tempo.
          Scores altos (70+) indicam leads prioritários para contato.
        </AlertDescription>
      </Alert>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Score Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
                  <p className="text-2xl font-bold text-green-600">{stats.highScoreLeads}</p>
                  <p className="text-xs text-gray-500">{stats.distribution.high}% do total</p>
                </div>
                <Star className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Baixa Prioridade</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowScoreLeads}</p>
                  <p className="text-xs text-gray-500">{stats.distribution.low}% do total</p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="high-score">Leads Prioritários</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Scores</CardTitle>
                  <CardDescription>
                    Como seus leads estão distribuídos por faixa de pontuação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Alta Prioridade (70-100)</span>
                      </div>
                      <span className="text-sm text-gray-600">{stats.highScoreLeads} leads</span>
                    </div>
                    <Progress value={stats.distribution.high} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Média Prioridade (30-69)</span>
                      </div>
                      <span className="text-sm text-gray-600">{stats.mediumScoreLeads} leads</span>
                    </div>
                    <Progress value={stats.distribution.medium} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Baixa Prioridade (0-29)</span>
                      </div>
                      <span className="text-sm text-gray-600">{stats.lowScoreLeads} leads</span>
                    </div>
                    <Progress value={stats.distribution.low} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="high-score" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads Prioritários</CardTitle>
              <CardDescription>
                Os 10 leads com maior pontuação que merecem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highScoreLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {lead.activities.length} atividades
                        </span>
                        {lead.owner && (
                          <span className="text-xs text-gray-500">
                            Responsável: {lead.owner.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getScoreColor(lead.score)} border-0`}>
                        {getScoreIcon(lead.score)}
                        <span className="ml-1">{lead.score}</span>
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Lead
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fatores de Pontuação</CardTitle>
                <CardDescription>
                  Como os scores são calculados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fonte do Lead</span>
                    <Badge variant="secondary">0-13 pontos</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">UTM Source</span>
                    <Badge variant="secondary">0-20 pontos</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Atividades</span>
                    <Badge variant="secondary">0-∞ pontos</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Decaimento Temporal</span>
                    <Badge variant="secondary">5%/semana</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Recomendadas</CardTitle>
                <CardDescription>
                  Como agir baseado no score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Star className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Score 70+ (Alta)</p>
                      <p className="text-xs text-gray-600">Contato imediato, prioridade máxima</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Score 30-69 (Média)</p>
                      <p className="text-xs text-gray-600">Nutrição e qualificação</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Score 0-29 (Baixa)</p>
                      <p className="text-xs text-gray-600">Automação e follow-up</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}