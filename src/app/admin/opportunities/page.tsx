'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Building,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Kanban
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
}

export default function OpportunitiesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    stage: 'all',
    owner: ''
  })

  useEffect(() => {
    if (session) {
      fetchOpportunities()
    }
  }, [session])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.stage && filters.stage !== 'all') params.append('stage', filters.stage)
      if (filters.owner) params.append('owner_id', filters.owner)

      const response = await fetch(`/api/opportunities?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setOpportunities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchOpportunities()
    }
  }, [filters, session])

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sem valor'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR')
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

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600'
    if (probability >= 60) return 'text-yellow-600'
    if (probability >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const searchLower = filters.search.toLowerCase()
    return (
      opp.lead.name.toLowerCase().includes(searchLower) ||
      opp.lead.company?.toLowerCase().includes(searchLower) ||
      opp.owner.name.toLowerCase().includes(searchLower)
    )
  })

  const getStats = () => {
    return {
      total: opportunities.length,
      totalValue: opportunities.reduce((sum, o) => sum + (o.amountBr || 0), 0),
      pipelineValue: opportunities.filter(o => !['WON', 'LOST'].includes(o.stage))
        .reduce((sum, o) => sum + (o.amountBr || 0), 0),
      wonValue: opportunities.filter(o => o.stage === 'WON')
        .reduce((sum, o) => sum + (o.amountBr || 0), 0),
      weightedValue: opportunities.filter(o => !['WON', 'LOST'].includes(o.stage))
        .reduce((sum, o) => sum + ((o.amountBr || 0) * (o.probability / 100)), 0)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const stats = getStats()

  return (
    <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedDashboardItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Oportunidades</h1>
              <p className="text-gray-600">Gerencie suas oportunidades de venda</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/opportunities/kanban')}
              >
                <Kanban className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => router.push('/admin/opportunities/new')} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </div>
          </div>
        </AnimatedDashboardItem>

        {/* Stats Cards */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.pipelineValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ponderado</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.weightedValue)}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ganhos</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.wonValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Valor</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </motion.div>
          </div>
        </AnimatedDashboardItem>

        {/* Filters */}
        <AnimatedDashboardItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, empresa..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.stage}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estágios</SelectItem>
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="QUALIFICATION">Qualificação</SelectItem>
                    <SelectItem value="DISCOVERY">Descoberta</SelectItem>
                    <SelectItem value="PROPOSAL">Proposta</SelectItem>
                    <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                    <SelectItem value="WON">Ganho</SelectItem>
                    <SelectItem value="LOST">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ search: '', stage: 'all', owner: '' })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedDashboardItem>

        {/* Opportunities List */}
        <AnimatedDashboardItem>
          <Card>
            <CardHeader>
              <CardTitle>Lista de Oportunidades ({filteredOpportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-4">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {opportunity.lead.name}
                          </h3>
                          <Badge className={`text-xs ${getStageColor(opportunity.stage)}`}>
                            {getStageLabel(opportunity.stage)}
                          </Badge>
                          <span className={`text-sm font-medium ${getProbabilityColor(opportunity.probability)}`}>
                            {opportunity.probability}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          {opportunity.lead.company && (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>{opportunity.lead.company}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{opportunity.owner.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(opportunity.amountBr)}
                            </span>
                          </div>
                          {opportunity.expectedCloseAt && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Previsão: {formatDate(opportunity.expectedCloseAt)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Criado: {formatDate(opportunity.createdAt)}</span>
                          {opportunity.closedAt && (
                            <span>Fechado: {formatDate(opportunity.closedAt)}</span>
                          )}
                          {opportunity.lead.source && (
                            <span>Fonte: {opportunity.lead.source}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/opportunities/${opportunity.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/opportunities/${opportunity.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma oportunidade encontrada
                    </h3>
                    <p className="text-gray-600">
                      {opportunities.length === 0
                        ? 'Comece criando sua primeira oportunidade'
                        : 'Tente ajustar os filtros de busca'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </AnimatedDashboardItem>
      </div>
    </AnimatedDashboardContainer>
  )
}