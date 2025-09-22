'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Play,
  Pause,
  BarChart3,
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Target
} from 'lucide-react'

interface Flow {
  id: string
  name: string
  description: string
  triggerType: 'KEYWORD' | 'NEW_CONTACT' | 'TIME_BASED' | 'MANUAL'
  triggerValue?: string
  isActive: boolean
  executionCount: number
  lastExecutedAt?: string
  createdAt: string
  updatedAt: string
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [filteredFlows, setFilteredFlows] = useState<Flow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [deleteFlow, setDeleteFlow] = useState<Flow | null>(null)

  useEffect(() => {
    loadFlows()
  }, [])

  useEffect(() => {
    filterFlows()
  }, [flows, searchTerm, filterStatus])

  const loadFlows = async () => {
    try {
      const response = await fetch('/api/whatsapp/flows')

      if (response.ok) {
        const data = await response.json()
        setFlows(data.flows || [])
      } else {
        // Mock data for testing
        const mockFlows = [
          {
            id: 'flow-1',
            name: 'Boas-vindas Automáticas',
            description: 'Mensagem de boas-vindas para novos contatos',
            triggerType: 'NEW_CONTACT' as const,
            triggerValue: undefined,
            isActive: true,
            executionCount: 142,
            lastExecutedAt: '2024-01-22T09:15:00Z',
            createdAt: '2024-01-10T14:30:00Z',
            updatedAt: '2024-01-22T09:15:00Z'
          },
          {
            id: 'flow-2',
            name: 'Suporte Técnico',
            description: 'Fluxo automático para dúvidas técnicas',
            triggerType: 'KEYWORD' as const,
            triggerValue: 'suporte',
            isActive: true,
            executionCount: 67,
            lastExecutedAt: '2024-01-21T16:45:00Z',
            createdAt: '2024-01-08T10:20:00Z',
            updatedAt: '2024-01-21T16:45:00Z'
          },
          {
            id: 'flow-3',
            name: 'Promoções Semanais',
            description: 'Envio de promoções toda segunda-feira',
            triggerType: 'TIME_BASED' as const,
            triggerValue: 'weekly_monday',
            isActive: false,
            executionCount: 28,
            lastExecutedAt: '2024-01-20T16:20:00Z',
            createdAt: '2024-01-05T13:45:00Z',
            updatedAt: '2024-01-20T16:20:00Z'
          }
        ]
        setFlows(mockFlows)
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFlows = () => {
    let filtered = flows

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flow.triggerValue?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(flow =>
        filterStatus === 'active' ? flow.isActive : !flow.isActive
      )
    }

    setFilteredFlows(filtered)
  }

  const toggleFlowStatus = async (flowId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        setFlows(prev => prev.map(flow =>
          flow.id === flowId ? { ...flow, isActive: !currentStatus } : flow
        ))
      } else {
        console.error('Failed to toggle flow status')
      }
    } catch (error) {
      console.error('Erro ao alterar status do fluxo:', error)
    }
  }

  const handleDeleteFlow = async (flow: Flow) => {
    try {
      const response = await fetch(`/api/whatsapp/flows/${flow.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFlows(prev => prev.filter(f => f.id !== flow.id))
        setDeleteFlow(null)
      } else {
        console.error('Failed to delete flow')
      }
    } catch (error) {
      console.error('Erro ao deletar fluxo:', error)
    }
  }

  const duplicateFlow = async (flow: Flow) => {
    try {
      const response = await fetch(`/api/whatsapp/flows/${flow.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${flow.name} (Cópia)`
        })
      })

      if (response.ok) {
        const newFlow = await response.json()
        setFlows(prev => [newFlow, ...prev])
      } else {
        console.error('Failed to duplicate flow')
        // Fallback to local duplication
        const newFlow = {
          ...flow,
          id: Date.now().toString(),
          name: `${flow.name} (Cópia)`,
          isActive: false,
          executionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setFlows(prev => [newFlow, ...prev])
      }
    } catch (error) {
      console.error('Erro ao duplicar fluxo:', error)
    }
  }

  const getTriggerLabel = (type: string, value?: string) => {
    switch (type) {
      case 'KEYWORD':
        return `Palavra: "${value}"`
      case 'NEW_CONTACT':
        return 'Novo contato'
      case 'TIME_BASED':
        return 'Tempo'
      case 'MANUAL':
        return 'Manual'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando fluxos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxos de Automação</h1>
          <p className="text-gray-600">Gerencie seus fluxos automáticos de mensagens</p>
        </div>
        <div className="flex gap-2">
          <Link href="/whatsapp/automacao/flows/editor">
            <Button variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Editor Visual
            </Button>
          </Link>
          <Link href="/whatsapp/automacao/flows/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fluxo
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar fluxos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Flows List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Fluxos ({filteredFlows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFlows.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum fluxo encontrado' : 'Nenhum fluxo criado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro fluxo automático.'}
              </p>
              {!searchTerm && (
                <Link href="/whatsapp/automacao/flows/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Fluxo
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFlows.map((flow) => (
                <div key={flow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{flow.name}</h3>
                        <Badge variant={flow.isActive ? 'default' : 'secondary'}>
                          {flow.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTriggerLabel(flow.triggerType, flow.triggerValue)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{flow.description}</p>
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {flow.executionCount} execuções
                        </div>
                        {flow.lastExecutedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Última: {formatDate(flow.lastExecutedAt)}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Criado: {formatDate(flow.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={flow.isActive ? "destructive" : "default"}
                        onClick={() => toggleFlowStatus(flow.id, flow.isActive)}
                      >
                        {flow.isActive ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/whatsapp/automacao/flows/${flow.id}/view`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/whatsapp/automacao/flows/${flow.id}`}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/whatsapp/automacao/flows/${flow.id}/triggers`}>
                              <Target className="h-4 w-4 mr-2" />
                              Gatilhos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateFlow(flow)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteFlow(flow)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteFlow} onOpenChange={() => setDeleteFlow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Fluxo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o fluxo "{deleteFlow?.name}"?
              Esta ação não pode ser desfeita e todas as execuções ativas serão interrompidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFlow(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteFlow && handleDeleteFlow(deleteFlow)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}