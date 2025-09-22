'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Square,
  BarChart3,
  Calendar,
  Users,
  Send,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  campaignName: string
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
  content?: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED' | 'PAUSED'
  targetCount: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  scheduledAt?: string
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500',
  SCHEDULED: 'bg-blue-500',
  SENDING: 'bg-yellow-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
  PAUSED: 'bg-orange-500'
}

const STATUS_LABELS = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  SENDING: 'Enviando',
  COMPLETED: 'Concluída',
  FAILED: 'Falhou',
  PAUSED: 'Pausada'
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Campaign['status']>('all')
  const [loading, setLoading] = useState(true)
  const [actionCampaign, setActionCampaign] = useState<{ campaign: Campaign; action: string } | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, searchTerm, filterStatus])

  const loadCampaigns = async () => {
    try {
      setLoading(true)

      // Real API call
      const response = await fetch('/api/whatsapp/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        console.error('Failed to load campaigns')
        // Fallback to mock data
        const mockCampaigns: Campaign[] = [
        {
          id: '1',
          campaignName: 'Promoção Black Friday 2024',
          messageType: 'TEXT',
          content: 'Oferta especial! 50% de desconto em todos os produtos até meia-noite! 🔥',
          status: 'COMPLETED',
          targetCount: 1500,
          sentCount: 1500,
          deliveredCount: 1487,
          readCount: 1203,
          failedCount: 13,
          scheduledAt: '2024-01-20T09:00:00Z',
          createdAt: '2024-01-19T14:30:00Z',
          updatedAt: '2024-01-20T11:45:00Z'
        },
        {
          id: '2',
          campaignName: 'Lançamento Produto Novo',
          messageType: 'IMAGE',
          content: 'Conheça nosso novo produto revolucionário!',
          status: 'SENDING',
          targetCount: 800,
          sentCount: 320,
          deliveredCount: 315,
          readCount: 89,
          failedCount: 5,
          scheduledAt: '2024-01-21T10:00:00Z',
          createdAt: '2024-01-20T16:20:00Z',
          updatedAt: '2024-01-21T10:30:00Z'
        },
        {
          id: '3',
          campaignName: 'Follow-up Carrinho Abandonado',
          messageType: 'TEXT',
          content: 'Você esqueceu algo no seu carrinho! Finalize sua compra agora 🛒',
          status: 'SCHEDULED',
          targetCount: 450,
          sentCount: 0,
          deliveredCount: 0,
          readCount: 0,
          failedCount: 0,
          scheduledAt: '2024-01-22T15:00:00Z',
          createdAt: '2024-01-21T11:15:00Z',
          updatedAt: '2024-01-21T11:15:00Z'
        },
        {
          id: '4',
          campaignName: 'Pesquisa de Satisfação',
          messageType: 'TEXT',
          content: 'Como foi sua experiência conosco? Sua opinião é muito importante! ⭐',
          status: 'DRAFT',
          targetCount: 0,
          sentCount: 0,
          deliveredCount: 0,
          readCount: 0,
          failedCount: 0,
          createdAt: '2024-01-21T14:45:00Z',
          updatedAt: '2024-01-21T14:45:00Z'
        }
      ]

        setCampaigns(mockCampaigns)
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCampaigns = () => {
    let filtered = campaigns

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === filterStatus)
    }

    setFilteredCampaigns(filtered)
  }

  const handleCampaignAction = async (campaign: Campaign, action: string) => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaign.id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        if (action === 'pause') {
          setCampaigns(prev => prev.map(c =>
            c.id === campaign.id ? { ...c, status: 'PAUSED' as const } : c
          ))
        } else if (action === 'resume') {
          setCampaigns(prev => prev.map(c =>
            c.id === campaign.id ? { ...c, status: 'SENDING' as const } : c
          ))
        } else if (action === 'stop') {
          setCampaigns(prev => prev.map(c =>
            c.id === campaign.id ? { ...c, status: 'FAILED' as const } : c
          ))
        }
      } else {
        console.error('Failed to execute campaign action')
      }

      setActionCampaign(null)
    } catch (error) {
      console.error('Erro ao executar ação:', error)
    }
  }

  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.targetCount === 0) return 0
    return Math.round((campaign.sentCount / campaign.targetCount) * 100)
  }

  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0
    return Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
  }

  const getReadRate = (campaign: Campaign) => {
    if (campaign.deliveredCount === 0) return 0
    return Math.round((campaign.readCount / campaign.deliveredCount) * 100)
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
          <p className="mt-2 text-sm text-gray-600">Carregando campanhas...</p>
        </div>
      </div>
    )
  }

  const totalStats = campaigns.reduce(
    (acc, campaign) => ({
      sent: acc.sent + campaign.sentCount,
      delivered: acc.delivered + campaign.deliveredCount,
      read: acc.read + campaign.readCount,
      failed: acc.failed + campaign.failedCount
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campanhas de Marketing</h1>
          <p className="text-gray-600 mt-1">Gerencie mensagens em massa e remarketing</p>
        </div>
        <Link href="/whatsapp/automacao/campaigns/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold">{totalStats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold">
                  {totalStats.sent > 0 ? Math.round((totalStats.delivered / totalStats.sent) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Leitura</p>
                <p className="text-2xl font-bold">
                  {totalStats.delivered > 0 ? Math.round((totalStats.read / totalStats.delivered) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-2xl font-bold">{totalStats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === 'SENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('SENDING')}
              >
                Enviando
              </Button>
              <Button
                variant={filterStatus === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('COMPLETED')}
              >
                Concluídas
              </Button>
              <Button
                variant={filterStatus === 'SCHEDULED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('SCHEDULED')}
              >
                Agendadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.campaignName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{campaign.messageType}</Badge>
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {campaign.content}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="default"
                      style={{ backgroundColor: STATUS_COLORS[campaign.status] }}
                    >
                      {STATUS_LABELS[campaign.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{campaign.sentCount}/{campaign.targetCount}</span>
                        <span>{getProgressPercentage(campaign)}%</span>
                      </div>
                      <Progress
                        value={getProgressPercentage(campaign)}
                        className="w-full"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Entrega:</span>
                        <span className="font-medium">{getDeliveryRate(campaign)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Leitura:</span>
                        <span className="font-medium">{getReadRate(campaign)}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {campaign.scheduledAt ? (
                      <div className="text-sm">
                        <p>{formatDate(campaign.scheduledAt)}</p>
                      </div>
                    ) : (
                      <Badge variant="secondary">Não agendada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <Link href={`/whatsapp/automacao/campaigns/${campaign.id}/analytics`}>
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Ver Analytics
                          </DropdownMenuItem>
                        </Link>

                        {campaign.status === 'SENDING' && (
                          <DropdownMenuItem
                            onClick={() => setActionCampaign({ campaign, action: 'pause' })}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </DropdownMenuItem>
                        )}

                        {campaign.status === 'PAUSED' && (
                          <DropdownMenuItem
                            onClick={() => setActionCampaign({ campaign, action: 'resume' })}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Retomar
                          </DropdownMenuItem>
                        )}

                        {['SENDING', 'PAUSED'].includes(campaign.status) && (
                          <DropdownMenuItem
                            onClick={() => setActionCampaign({ campaign, action: 'stop' })}
                            className="text-red-600"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Parar
                          </DropdownMenuItem>
                        )}

                        {campaign.status === 'DRAFT' && (
                          <Link href={`/whatsapp/automacao/campaigns/${campaign.id}/edit`}>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          </Link>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira campanha de marketing.'}
              </p>
              {!searchTerm && (
                <Link href="/whatsapp/automacao/campaigns/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Campanha
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionCampaign} onOpenChange={() => setActionCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
            <DialogDescription>
              {actionCampaign && (
                <>
                  Tem certeza que deseja {actionCampaign.action === 'pause' ? 'pausar' :
                    actionCampaign.action === 'resume' ? 'retomar' : 'parar'} a campanha
                  "{actionCampaign.campaign.campaignName}"?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionCampaign(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => actionCampaign && handleCampaignAction(actionCampaign.campaign, actionCampaign.action)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}