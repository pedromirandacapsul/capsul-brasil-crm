'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Phone,
  Mail,
  Building,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AnimatedMetricCard } from '@/components/dashboard/animated-metric-card'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import { AnimatedChartContainer } from '@/components/dashboard/animated-chart-container'
import { EnhancedScheduleFollowUpModal } from '@/components/forms/enhanced-schedule-followup-modal'
import { EnhancedDisqualifyLeadModal } from '@/components/forms/enhanced-disqualify-lead-modal'
import { EnhancedSendToKanbanModal } from '@/components/forms/enhanced-send-to-kanban-modal'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { TagSelector, TagManager } from '@/components/leads/tag-selector'
import { Tag } from '@/components/ui/tag'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  roleTitle: string | null
  status: string
  score: number
  source: string | null
  sourceDetails: string | null
  createdAt: string
  lastInteractionAt: string | null
  lastInteractionType: string | null
  nextActionAt: string | null
  nextActionType: string | null
  nextActionNotes: string | null
  lossReason: string | null
  lossDetails: string | null
  owner?: {
    id: string
    name: string
    email: string
  } | null
  tagAssignments?: {
    id: string
    tag: {
      id: string
      name: string
      color: string
      category?: string
    }
  }[]
  _count?: {
    activities: number
    tasks: number
  }
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  NOT_ANSWERED_1: 'bg-orange-100 text-orange-800',
  NOT_ANSWERED_2: 'bg-red-100 text-red-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  WON: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  NEW: 'Novo',
  NOT_ANSWERED_1: 'Não Atendido (1ª)',
  NOT_ANSWERED_2: 'Não Atendido (2ª)',
  CONTACTED: 'Contatado',
  QUALIFIED: 'Qualificado',
  PROPOSAL: 'Proposta',
  WON: 'Ganho',
  LOST: 'Perdido',
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Mock data para os gráficos (em produção seria vindo da API)
  const chartData = [
    { month: 'Jan', leads: 45, converted: 12, conversionRate: 26.7 },
    { month: 'Fev', leads: 52, converted: 15, conversionRate: 28.8 },
    { month: 'Mar', leads: 48, converted: 18, conversionRate: 37.5 },
    { month: 'Abr', leads: 61, converted: 22, conversionRate: 36.1 },
    { month: 'Mai', leads: 55, converted: 20, conversionRate: 36.4 },
    { month: 'Jun', leads: 67, converted: 25, conversionRate: 37.3 },
  ]

  const sourceData = [
    { source: 'Website', count: 45, converted: 10, conversionRate: 22.2 },
    { source: 'Referência', count: 32, converted: 16, conversionRate: 50.0 },
    { source: 'Social Media', count: 28, converted: 6, conversionRate: 21.4 },
    { source: 'Email Marketing', count: 22, converted: 8, conversionRate: 36.4 },
    { source: 'Outros', count: 15, converted: 3, conversionRate: 20.0 },
  ]

  // Métricas de tempo
  const timeMetrics = {
    avgFirstContact: 2.3, // horas
    avgConversion: 14.7,  // dias
    responseRate: 95.2,   // %
  }

  useEffect(() => {
    if (session) {
      fetchLeads()
    }
  }, [session, currentPage, searchTerm, statusFilter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      })

      const response = await fetch(`/api/leads?${params}`)
      const data = await response.json()

      if (data.success) {
        setLeads(data.data.leads || [])
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLeads()
  }

  const handleActionCompleted = () => {
    fetchLeads()
  }

  const handleCall = (lead: Lead) => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`)
    }
  }

  const handleEmail = (lead: Lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`)
    }
  }

  const handleWhatsApp = (lead: Lead) => {
    if (lead.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '')
      const message = encodeURIComponent(`Olá ${lead.name}, tudo bem?`)
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`)
    }
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/admin/leads/${leadId}`)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/leads/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting leads:', error)
    }
  }

  const getFilteredLeads = () => {
    if (!activeFilter) return leads

    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const today = new Date().toDateString()

    switch (activeFilter) {
      case 'NEW':
        return leads.filter(l => l.status === 'NEW')
      case 'QUALIFIED':
        return leads.filter(l => l.status === 'QUALIFIED')
      case 'WON':
        return leads.filter(l => l.status === 'WON')
      case 'NOT_ANSWERED':
        return leads.filter(l => l.status === 'NOT_ANSWERED_1' || l.status === 'NOT_ANSWERED_2')
      case 'NO_CONTACT_48H':
        return leads.filter(l => !l.lastInteractionAt || new Date(l.lastInteractionAt) < twoDaysAgo)
      case 'ACTIONS_TODAY':
        return leads.filter(l => l.nextActionAt && new Date(l.nextActionAt).toDateString() === today)
      default:
        return leads
    }
  }

  const handleCardClick = (filterType: string) => {
    if (activeFilter === filterType) {
      setActiveFilter(null)
    } else {
      setActiveFilter(filterType)
    }
  }

  const hasAlert = (lead: Lead) => {
    if (!lead.lastInteractionAt) return true

    const now = new Date()
    const lastInteraction = new Date(lead.lastInteractionAt)
    const daysSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)

    return daysSince > 5
  }

  // Métricas calculadas
  const metrics = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'NEW').length,
    qualifiedLeads: leads.filter(l => l.status === 'QUALIFIED').length,
    wonLeads: leads.filter(l => l.status === 'WON').length,
    notAnswered: leads.filter(l => l.status === 'NOT_ANSWERED_1' || l.status === 'NOT_ANSWERED_2').length,
    noContact48h: leads.filter(l => {
      if (!l.lastInteractionAt) return true
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      return new Date(l.lastInteractionAt) < twoDaysAgo
    }).length,
    actionsToday: leads.filter(l => {
      if (!l.nextActionAt) return false
      const today = new Date().toDateString()
      return new Date(l.nextActionAt).toDateString() === today
    }).length,
  }

  // Dados do funil de conversão
  const funnelData = [
    { stage: 'Leads', count: metrics.totalLeads, percentage: 100 },
    { stage: 'Qualificados', count: metrics.qualifiedLeads, percentage: metrics.totalLeads > 0 ? (metrics.qualifiedLeads / metrics.totalLeads) * 100 : 0 },
    { stage: 'Propostas', count: Math.floor(metrics.qualifiedLeads * 0.6), percentage: metrics.totalLeads > 0 ? (Math.floor(metrics.qualifiedLeads * 0.6) / metrics.totalLeads) * 100 : 0 },
    { stage: 'Convertidos', count: metrics.wonLeads, percentage: metrics.totalLeads > 0 ? (metrics.wonLeads / metrics.totalLeads) * 100 : 0 },
  ]

  const filteredLeads = getFilteredLeads()

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

  return (
    <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedDashboardItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
              <p className="text-gray-600">Painel completo para gerenciar seus leads</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Tabela
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                onClick={() => setViewMode('kanban')}
                size="sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => router.push('/admin/leads/new')} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>
        </AnimatedDashboardItem>

        {/* Métricas Cards */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <AnimatedMetricCard
              title="Total de Leads"
              value={metrics.totalLeads}
              icon={Users}
              color="blue"
              onClick={() => handleCardClick('ALL')}
              isActive={activeFilter === 'ALL'}
              trend={{ value: 12, label: "este mês" }}
            />
            <AnimatedMetricCard
              title="Novos Leads"
              value={metrics.newLeads}
              icon={Target}
              color="green"
              onClick={() => handleCardClick('NEW')}
              isActive={activeFilter === 'NEW'}
              trend={{ value: 8, label: "esta semana" }}
            />
            <AnimatedMetricCard
              title="Qualificados"
              value={metrics.qualifiedLeads}
              icon={CheckCircle}
              color="purple"
              onClick={() => handleCardClick('QUALIFIED')}
              isActive={activeFilter === 'QUALIFIED'}
              trend={{ value: 15, label: "este mês" }}
            />
            <AnimatedMetricCard
              title="Convertidos"
              value={metrics.wonLeads}
              icon={TrendingUp}
              color="green"
              onClick={() => handleCardClick('WON')}
              isActive={activeFilter === 'WON'}
              trend={{ value: 22, label: "este mês" }}
            />
            <AnimatedMetricCard
              title="Não Atendidos"
              value={metrics.notAnswered}
              icon={AlertTriangle}
              color="orange"
              onClick={() => handleCardClick('NOT_ANSWERED')}
              isActive={activeFilter === 'NOT_ANSWERED'}
              trend={{ value: -5, label: "melhoria" }}
            />
            <AnimatedMetricCard
              title="Sem Contato >48h"
              value={metrics.noContact48h}
              icon={Clock}
              color="red"
              onClick={() => handleCardClick('NO_CONTACT_48H')}
              isActive={activeFilter === 'NO_CONTACT_48H'}
              trend={{ value: -10, label: "redução" }}
            />
            <AnimatedMetricCard
              title="Ações Hoje"
              value={metrics.actionsToday}
              icon={Calendar}
              color="blue"
              onClick={() => handleCardClick('ACTIONS_TODAY')}
              isActive={activeFilter === 'ACTIONS_TODAY'}
              trend={{ value: 5, label: "agendadas" }}
            />
          </div>
        </AnimatedDashboardItem>

        {/* Gráficos */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedChartContainer title="Performance Mensal">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis yAxisId="left" stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'conversionRate') return [`${value}%`, 'Taxa de Conversão']
                      if (name === 'leads') return [value, 'Leads Captados']
                      if (name === 'converted') return [value, 'Leads Convertidos']
                      return [value, name]
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={3} name="Leads Captados" />
                  <Line yAxisId="left" type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={3} name="Leads Convertidos" />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Taxa de Conversão %" />
                </LineChart>
              </ResponsiveContainer>
            </AnimatedChartContainer>

            <AnimatedChartContainer title="Fontes de Leads - Captação vs Conversão">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="source" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    formatter={(value, name, props) => {
                      const rate = props.payload.conversionRate
                      if (name === 'count') return [value, `Leads Captados`]
                      if (name === 'converted') return [value, `Convertidos (${rate}%)`]
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Leads Captados" />
                  <Bar dataKey="converted" fill="#10b981" radius={[4, 4, 0, 0]} name="Leads Convertidos" />
                </BarChart>
              </ResponsiveContainer>
            </AnimatedChartContainer>
          </div>
        </AnimatedDashboardItem>

        {/* Funil de Conversão e Métricas de Tempo */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funil de Conversão */}
            <div className="lg:col-span-2">
              <AnimatedChartContainer title="Funil de Conversão">
                <div className="space-y-4 p-4">
                  {funnelData.map((stage, index) => (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                          <span className="text-sm text-gray-500 ml-2">({stage.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.2 }}
                          className={`h-6 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-purple-500' :
                            index === 2 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {stage.count} leads
                          </span>
                        </div>
                      </div>
                      {index < funnelData.length - 1 && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400"></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </AnimatedChartContainer>
            </div>

            {/* Métricas de Tempo */}
            <div className="space-y-4">
              <AnimatedChartContainer title="Métricas de Tempo">
                <div className="space-y-6 p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{timeMetrics.avgFirstContact}h</div>
                    <div className="text-sm text-gray-600">Tempo médio para primeiro contato</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Meta: 3h</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{timeMetrics.avgConversion}d</div>
                    <div className="text-sm text-gray-600">Tempo médio para conversão</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Meta: 21d</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{timeMetrics.responseRate}%</div>
                    <div className="text-sm text-gray-600">Taxa de resposta</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Meta: 90%</div>
                  </div>
                </div>
              </AnimatedChartContainer>
            </div>
          </div>
        </AnimatedDashboardItem>

        {/* Filtro Ativo */}
        {activeFilter && (
          <AnimatedDashboardItem>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <span className="text-purple-700 font-medium">
                  Mostrando {filteredLeads.length} de {leads.length} leads
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(null)}
                className="text-purple-600 hover:text-purple-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtro
              </Button>
            </motion.div>
          </AnimatedDashboardItem>
        )}

        {/* Conteúdo Principal */}
        <AnimatedDashboardItem>
          {viewMode === 'kanban' ? (
            <KanbanBoard leads={filteredLeads} onLeadUpdate={handleActionCompleted} />
          ) : (
            <Card className="bg-white shadow-sm border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lista de Leads</CardTitle>
                  <div className="flex items-center space-x-2">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                      <Input
                        placeholder="Buscar leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                      <Button type="submit" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead>Última Interação</TableHead>
                        <TableHead>Próxima Ação</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead, index) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {hasAlert(lead) && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </motion.div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{lead.name}</div>
                                {lead.company && (
                                  <div className="text-sm text-gray-500">{lead.company}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium">{lead.score}</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(lead.score, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[lead.status]}>
                              {statusLabels[lead.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{lead.source || 'N/A'}</div>
                              {lead.sourceDetails && (
                                <div className="text-gray-500 text-xs">{lead.sourceDetails}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.lastInteractionAt ? (
                              <div className="text-sm">
                                <div>{new Date(lead.lastInteractionAt).toLocaleDateString('pt-BR')}</div>
                                <div className="text-gray-500 text-xs">{lead.lastInteractionType}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Nunca contatado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.nextActionAt ? (
                              <div className="text-sm">
                                <div>{new Date(lead.nextActionAt).toLocaleDateString('pt-BR')}</div>
                                <div className="text-gray-500 text-xs">{lead.nextActionType}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Sem ação agendada</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {lead.tagAssignments?.slice(0, 2).map((assignment) => (
                                <Tag
                                  key={assignment.id}
                                  color={assignment.tag.color}
                                  size="sm"
                                >
                                  {assignment.tag.name}
                                </Tag>
                              ))}
                              {(lead.tagAssignments?.length || 0) > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{(lead.tagAssignments?.length || 0) - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {/* Visualizar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLead(lead.id)}
                                title="Visualizar lead"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {/* Telefone */}
                              {lead.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCall(lead)}
                                  title="Ligar"
                                >
                                  <Phone className="h-4 w-4 text-green-600" />
                                </Button>
                              )}

                              {/* Email */}
                              {lead.email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEmail(lead)}
                                  title="Enviar email"
                                >
                                  <Mail className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}

                              {/* WhatsApp */}
                              {lead.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWhatsApp(lead)}
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}

                              {/* Agendar Follow-up */}
                              <EnhancedScheduleFollowUpModal
                                leadId={lead.id}
                                leadName={lead.name}
                                onFollowUpScheduled={handleActionCompleted}
                              >
                                <Button variant="ghost" size="sm" title="Agendar follow-up">
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                </Button>
                              </EnhancedScheduleFollowUpModal>

                              {/* Mover para Kanban */}
                              <EnhancedSendToKanbanModal
                                leadId={lead.id}
                                leadName={lead.name}
                                currentStatus={lead.status}
                                onLeadMoved={handleActionCompleted}
                              >
                                <Button variant="ghost" size="sm" title="Mover pipeline">
                                  <ArrowRight className="h-4 w-4 text-orange-600" />
                                </Button>
                              </EnhancedSendToKanbanModal>

                              {/* Desqualificar */}
                              <EnhancedDisqualifyLeadModal
                                leadId={lead.id}
                                leadName={lead.name}
                                onLeadDisqualified={handleActionCompleted}
                              >
                                <Button variant="ghost" size="sm" title="Desqualificar">
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </EnhancedDisqualifyLeadModal>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </AnimatedDashboardItem>
      </div>
    </AnimatedDashboardContainer>
  )
}