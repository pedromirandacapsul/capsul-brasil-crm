'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TagSelector, TagManager } from '@/components/leads/tag-selector'
import { Tag } from '@/components/ui/tag'
import { ScheduleFollowUpModal } from '@/components/leads/schedule-followup-modal'
import { DisqualifyLeadModal } from '@/components/leads/disqualify-lead-modal'
import { SendToKanbanModal } from '@/components/leads/send-to-kanban-modal'

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

// Função para calcular o indicador de última interação
const getInteractionIndicator = (lastInteractionAt: string | null) => {
  if (!lastInteractionAt) {
    return { color: 'bg-gray-100 text-gray-600', text: 'Nunca', priority: 'low' }
  }

  const now = new Date()
  const lastInteraction = new Date(lastInteractionAt)
  const diffHours = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60)

  if (diffHours <= 24) {
    return { color: 'bg-green-100 text-green-600', text: 'Recente', priority: 'high' }
  } else if (diffHours <= 72) {
    return { color: 'bg-yellow-100 text-yellow-600', text: 'Atenção', priority: 'medium' }
  } else {
    return { color: 'bg-red-100 text-red-600', text: 'Urgente', priority: 'low' }
  }
}

// Função para formatar próxima ação
const formatNextAction = (nextActionAt: string | null, nextActionType: string | null, nextActionNotes: string | null) => {
  if (!nextActionAt) return null

  const actionDate = new Date(nextActionAt)
  const now = new Date()
  const isOverdue = actionDate < now

  const actionTypeLabels: Record<string, string> = {
    CALL: 'Ligação',
    WHATSAPP: 'WhatsApp',
    EMAIL: 'E-mail',
    MEETING: 'Reunião'
  }

  return {
    date: actionDate.toLocaleDateString('pt-BR'),
    time: actionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    type: actionTypeLabels[nextActionType || ''] || nextActionType,
    notes: nextActionNotes,
    isOverdue
  }
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await fetch(`/api/leads?${params}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLeads(data.data.leads)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error || 'Erro ao carregar leads')
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError('Erro ao carregar leads. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [currentPage, searchTerm, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLeads()
  }

  const handleNewLead = () => {
    router.push('/admin/leads/new')
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

  const handleActionCompleted = () => {
    fetchLeads() // Recarregar a lista após qualquer ação
  }

  // Função para filtrar leads baseado nos critérios dos cards
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

  // Função para aplicar filtro do card
  const handleCardClick = (filterType: string) => {
    if (activeFilter === filterType) {
      // Se já está ativo, remove o filtro
      setActiveFilter(null)
    } else {
      // Aplica o novo filtro
      setActiveFilter(filterType)
    }
  }

  // Função para detectar leads com alerta (parados há muito tempo)
  const hasAlert = (lead: any) => {
    if (!lead.lastInteractionAt) return true // Nunca contatado

    const now = new Date()
    const lastInteraction = new Date(lead.lastInteractionAt)
    const daysSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)

    // Alerta se > 5 dias sem contato e status ativo
    return daysSince > 5 && !['WON', 'LOST'].includes(lead.status)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchLeads} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Gerencie todos os seus leads</p>
        </div>
        <div className="flex space-x-2">
          <TagManager onTagCreated={() => window.location.reload()} />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleNewLead}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'NEW' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleCardClick('NEW')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {leads.filter(l => l.status === 'NEW').length}
                </p>
                {activeFilter === 'NEW' && (
                  <p className="text-xs text-blue-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'QUALIFIED' ? 'ring-2 ring-green-500 bg-green-50' : ''
          }`}
          onClick={() => handleCardClick('QUALIFIED')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualificados</p>
                <p className="text-2xl font-bold text-green-600">
                  {leads.filter(l => l.status === 'QUALIFIED').length}
                </p>
                {activeFilter === 'QUALIFIED' && (
                  <p className="text-xs text-green-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'WON' ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''
          }`}
          onClick={() => handleCardClick('WON')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {leads.filter(l => l.status === 'WON').length}
                </p>
                {activeFilter === 'WON' && (
                  <p className="text-xs text-emerald-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nova linha de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'NOT_ANSWERED' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
          }`}
          onClick={() => handleCardClick('NOT_ANSWERED')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Atendidos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {leads.filter(l => l.status === 'NOT_ANSWERED_1' || l.status === 'NOT_ANSWERED_2').length}
                </p>
                <p className="text-xs text-gray-500">
                  Precisam de atenção
                </p>
                {activeFilter === 'NOT_ANSWERED' && (
                  <p className="text-xs text-orange-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'NO_CONTACT_48H' ? 'ring-2 ring-red-500 bg-red-50' : ''
          }`}
          onClick={() => handleCardClick('NO_CONTACT_48H')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sem Contato {'>'}48h</p>
                <p className="text-2xl font-bold text-red-600">
                  {(() => {
                    const now = new Date()
                    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
                    return leads.filter(l =>
                      !l.lastInteractionAt || new Date(l.lastInteractionAt) < twoDaysAgo
                    ).length
                  })()}
                </p>
                <p className="text-xs text-gray-500">
                  Urgente
                </p>
                {activeFilter === 'NO_CONTACT_48H' && (
                  <p className="text-xs text-red-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'ACTIONS_TODAY' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleCardClick('ACTIONS_TODAY')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximas Ações Hoje</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const today = new Date().toDateString()
                    return leads.filter(l =>
                      l.nextActionAt && new Date(l.nextActionAt).toDateString() === today
                    ).length
                  })()}
                </p>
                <p className="text-xs text-gray-500">
                  Agendadas para hoje
                </p>
                {activeFilter === 'ACTIONS_TODAY' && (
                  <p className="text-xs text-blue-600 font-medium">Filtro ativo</p>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Filtro Ativo */}
      {activeFilter && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Filtro ativo: {
                    activeFilter === 'NEW' ? 'Leads Novos' :
                    activeFilter === 'QUALIFIED' ? 'Leads Qualificados' :
                    activeFilter === 'WON' ? 'Leads Convertidos' :
                    activeFilter === 'NOT_ANSWERED' ? 'Leads Não Atendidos' :
                    activeFilter === 'NO_CONTACT_48H' ? 'Sem Contato >48h' :
                    activeFilter === 'ACTIONS_TODAY' ? 'Ações Agendadas Hoje' :
                    'Filtro Ativo'
                  }
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  {getFilteredLeads().length} resultados
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(null)}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
                Limpar filtro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, email, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="NEW">Novo</SelectItem>
                <SelectItem value="NOT_ANSWERED_1">Não Atendido (1ª)</SelectItem>
                <SelectItem value="NOT_ANSWERED_2">Não Atendido (2ª)</SelectItem>
                <SelectItem value="CONTACTED">Contatado</SelectItem>
                <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                <SelectItem value="PROPOSAL">Proposta</SelectItem>
                <SelectItem value="WON">Ganho</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Última Interação</TableHead>
                  <TableHead>Próxima Ação</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredLeads().map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            {hasAlert(lead) && (
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded ml-1">
                                  URGENTE
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          {lead.roleTitle && (
                            <p className="text-xs text-gray-500">{lead.roleTitle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{lead.score}</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(lead.score, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const indicator = getInteractionIndicator(lead.lastInteractionAt)
                        return (
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${indicator.color}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {indicator.text}
                            </div>
                            {lead.lastInteractionAt && (
                              <div className="text-xs text-gray-500">
                                {new Date(lead.lastInteractionAt).toLocaleDateString('pt-BR')}
                                {lead.lastInteractionType && (
                                  <span className="ml-1">
                                    ({lead.lastInteractionType === 'CALL' ? 'Ligação' :
                                      lead.lastInteractionType === 'WHATSAPP' ? 'WhatsApp' :
                                      lead.lastInteractionType === 'EMAIL' ? 'E-mail' :
                                      lead.lastInteractionType})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const nextAction = formatNextAction(lead.nextActionAt, lead.nextActionType, lead.nextActionNotes)
                        if (!nextAction) {
                          return (
                            <div className="text-xs text-gray-400">
                              Nenhuma ação agendada
                            </div>
                          )
                        }
                        return (
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              nextAction.isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {nextAction.type}
                            </div>
                            <div className="text-xs text-gray-500">
                              {nextAction.date} às {nextAction.time}
                              {nextAction.isOverdue && (
                                <span className="text-red-500 ml-1">(Atrasado)</span>
                              )}
                            </div>
                            {nextAction.notes && (
                              <div className="text-xs text-gray-400 truncate max-w-24" title={nextAction.notes}>
                                {nextAction.notes}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {lead.tagAssignments?.slice(0, 3).map((assignment) => (
                            <Tag
                              key={assignment.id}
                              color={assignment.tag.color}
                              size="sm"
                            >
                              {assignment.tag.name}
                            </Tag>
                          ))}
                          {(lead.tagAssignments?.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(lead.tagAssignments?.length || 0) - 3} mais
                            </span>
                          )}
                        </div>
                        <TagSelector
                          leadId={lead.id}
                          selectedTags={lead.tagAssignments?.map(a => a.tag) || []}
                          onTagsChange={() => fetchLeads()}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">{lead.source || '-'}</span>
                        {lead.sourceDetails && (
                          <div className="text-xs text-gray-400">{lead.sourceDetails}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Primeira linha de ações */}
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/leads/${lead.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCall(lead)}
                            disabled={!lead.phone}
                            title={lead.phone ? `Ligar para ${lead.phone}` : 'Telefone não disponível'}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(lead)}
                            disabled={!lead.phone}
                            title={lead.phone ? `WhatsApp para ${lead.phone}` : 'Telefone não disponível'}
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmail(lead)}
                            disabled={!lead.email}
                            title={lead.email ? `Enviar email para ${lead.email}` : 'Email não disponível'}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Segunda linha de ações */}
                        <div className="flex space-x-1 w-full">
                          <ScheduleFollowUpModal
                            leadId={lead.id}
                            leadName={lead.name}
                            onFollowUpScheduled={handleActionCompleted}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Agendar follow-up"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </ScheduleFollowUpModal>

                          <SendToKanbanModal
                            leadId={lead.id}
                            leadName={lead.name}
                            currentStatus={lead.status}
                            onLeadMoved={handleActionCompleted}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Mover no pipeline"
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </SendToKanbanModal>

                          {lead.status !== 'LOST' && (
                            <DisqualifyLeadModal
                              leadId={lead.id}
                              leadName={lead.name}
                              onLeadDisqualified={handleActionCompleted}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Desqualificar lead"
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </DisqualifyLeadModal>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}