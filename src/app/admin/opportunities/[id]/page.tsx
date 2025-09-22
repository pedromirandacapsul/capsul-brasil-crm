'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building,
  Target,
  TrendingUp,
  Clock,
  History,
  Package,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface Opportunity {
  id: string
  stage: string
  amountBr: number | null
  probability: number
  expectedCloseAt: string | null
  discountPct: number | null
  createdAt: string
  closedAt: string | null
  lostReason: string | null
  lead: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    source: string | null
  }
  owner: {
    id: string
    name: string
    email: string
  }
  items?: Array<{
    id: string
    productName: string
    qty: number
    unitPriceBr: number
    subtotalBr: number
  }>
  stageHistory?: Array<{
    id: string
    stageFrom: string | null
    stageTo: string
    changedAt: string
    user: {
      id: string
      name: string
    }
  }>
}

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOpportunity()
    }
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/opportunities/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOpportunity(data.data)
      } else {
        router.push('/admin/opportunities')
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      router.push('/admin/opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleStageTransition = async () => {
    if (!opportunity) return

    const stageOrder = ['NEW', 'QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON']
    const currentIndex = stageOrder.indexOf(opportunity.stage)

    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1]

      setActionLoading(true)
      try {
        const response = await fetch(`/api/opportunities/${params.id}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stageTo: nextStage
          }),
        })

        if (response.ok) {
          fetchOpportunity() // Refresh data
        } else {
          const error = await response.json()
          alert(error.error || 'Erro ao alterar estágio')
        }
      } catch (error) {
        console.error('Error changing stage:', error)
        alert('Erro ao alterar estágio')
      } finally {
        setActionLoading(false)
      }
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sem valor'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'NEW': 'Novo',
      'QUALIFICATION': 'Qualificação',
      'DISCOVERY': 'Descoberta',
      'PROPOSAL': 'Proposta',
      'NEGOTIATION': 'Negociação',
      'WON': 'Ganho',
      'LOST': 'Perdido'
    }
    return labels[stage] || stage
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'NEW': 'bg-blue-100 text-blue-800',
      'QUALIFICATION': 'bg-yellow-100 text-yellow-800',
      'DISCOVERY': 'bg-purple-100 text-purple-800',
      'PROPOSAL': 'bg-orange-100 text-orange-800',
      'NEGOTIATION': 'bg-red-100 text-red-800',
      'WON': 'bg-green-100 text-green-800',
      'LOST': 'bg-gray-100 text-gray-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
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

  if (!opportunity) {
    return (
      <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oportunidade não encontrada</h1>
          <Button onClick={() => router.push('/admin/opportunities')}>
            Voltar para Oportunidades
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{opportunity.lead.name}</h1>
                <p className="text-gray-600">
                  {opportunity.lead.company && `${opportunity.lead.company} • `}
                  Criado em {formatDate(opportunity.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {opportunity.stage !== 'WON' && opportunity.stage !== 'LOST' && (
                <Button
                  onClick={handleStageTransition}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Avançar Estágio
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/opportunities/${opportunity.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AnimatedDashboardItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Visão Geral</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Badge className={`mb-2 ${getStageColor(opportunity.stage)}`}>
                        {getStageLabel(opportunity.stage)}
                      </Badge>
                      <p className="text-2xl font-bold text-gray-900">{opportunity.probability}%</p>
                      <p className="text-sm text-gray-600">Probabilidade</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(opportunity.amountBr)}
                      </p>
                      <p className="text-sm text-gray-600">Valor da Oportunidade</p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-gray-900">
                        {opportunity.expectedCloseAt
                          ? new Date(opportunity.expectedCloseAt).toLocaleDateString('pt-BR')
                          : 'Não definido'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Fechamento Previsto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>

            {/* Lead Information */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Informações do Lead</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <p className="text-lg font-semibold">{opportunity.lead.name}</p>
                      </div>
                      {opportunity.lead.company && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Empresa</label>
                          <p className="text-lg font-semibold">{opportunity.lead.company}</p>
                        </div>
                      )}
                      {opportunity.lead.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-sm">{opportunity.lead.email}</p>
                        </div>
                      )}
                      {opportunity.lead.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Telefone</label>
                          <p className="text-sm">{opportunity.lead.phone}</p>
                        </div>
                      )}
                      {opportunity.lead.source && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Origem</label>
                          <p className="text-sm">{opportunity.lead.source}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>

            {/* Stage History */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Histórico de Estágios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {opportunity.stageHistory && opportunity.stageHistory.length > 0 ? (
                      opportunity.stageHistory.map((history, index) => (
                        <motion.div
                          key={history.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {history.stageFrom && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {getStageLabel(history.stageFrom)}
                                  </Badge>
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                </>
                              )}
                              <Badge className={`text-xs ${getStageColor(history.stageTo)}`}>
                                {getStageLabel(history.stageTo)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {formatDate(history.changedAt)} • {history.user.name}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum histórico de mudanças ainda
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Responsável</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{opportunity.owner.name}</p>
                      <p className="text-sm text-gray-600">{opportunity.owner.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>

            {/* Financial Details */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Detalhes Financeiros</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Base:</span>
                    <span className="font-semibold">{formatCurrency(opportunity.amountBr)}</span>
                  </div>
                  {opportunity.discountPct && opportunity.discountPct > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Desconto:</span>
                      <span className="font-semibold text-red-600">{opportunity.discountPct}%</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Probabilidade:</span>
                    <span className="font-semibold">{opportunity.probability}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Valor Ponderado:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency((opportunity.amountBr || 0) * (opportunity.probability / 100))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>

            {/* Timeline */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Criado:</span>
                    <span className="text-sm font-medium">
                      {new Date(opportunity.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {opportunity.expectedCloseAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Previsão:</span>
                      <span className="text-sm font-medium">
                        {new Date(opportunity.expectedCloseAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {opportunity.closedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fechado:</span>
                      <span className="text-sm font-medium">
                        {new Date(opportunity.closedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedDashboardItem>

            {/* Quick Actions */}
            <AnimatedDashboardItem>
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/opportunities/kanban')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Pipeline
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/admin/analytics/opportunities')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </CardContent>
              </Card>
            </AnimatedDashboardItem>
          </div>
        </div>
      </div>
    </AnimatedDashboardContainer>
  )
}