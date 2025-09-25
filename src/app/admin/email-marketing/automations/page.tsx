'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Zap,
  Clock,
  Users,
  Mail,
  TrendingUp,
  Eye,
  MousePointer,
  Calendar,
  Heart,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react'

interface Automation {
  id: string
  name: string
  trigger: string
  description: string
  isActive: boolean
  leads: number
  triggered: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
  createdAt: string
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      const response = await fetch('/api/email-marketing/automations')
      const data = await response.json()

      if (data.success) {
        // Mapear dados da API para o formato esperado pelo componente
        const mappedAutomations = data.data.map((automation: any) => ({
          id: automation.id,
          name: automation.name,
          trigger: automation.trigger || 'Manual',
          description: automation.description || '',
          isActive: automation.isActive,
          leads: automation.leads || 0,
          triggered: automation.triggered || 0,
          opened: automation.opened || 0,
          clicked: automation.clicked || 0,
          openRate: automation.openRate || 0,
          clickRate: automation.clickRate || 0,
          createdAt: automation.createdAt
        }))
        setAutomations(mappedAutomations)
      }
    } catch (error) {
      console.error('Erro ao carregar automações:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (!automation) return

    try {
      const response = await fetch(`/api/email-marketing/automations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: automation.name,
          description: automation.description,
          active: !automation.isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        setAutomations(automations.map(automation =>
          automation.id === id
            ? { ...automation, isActive: !automation.isActive }
            : automation
        ))
      } else {
        console.error('Erro ao alterar status:', data.error)
      }
    } catch (error) {
      console.error('Erro ao alterar status da automação:', error)
    }
  }

  const getTriggerIcon = (trigger: string) => {
    const lowerTrigger = trigger.toLowerCase()
    if (lowerTrigger.includes('lead_created') || lowerTrigger.includes('novo lead')) return <Users className="h-4 w-4 text-blue-500" />
    if (lowerTrigger.includes('status_changed') || lowerTrigger.includes('status')) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (lowerTrigger.includes('tag_added') || lowerTrigger.includes('tag')) return <Zap className="h-4 w-4 text-purple-500" />
    if (lowerTrigger.includes('date_based') || lowerTrigger.includes('data')) return <Calendar className="h-4 w-4 text-orange-500" />
    if (lowerTrigger.includes('manual')) return <MousePointer className="h-4 w-4 text-gray-500" />
    if (lowerTrigger.includes('aniversário')) return <Heart className="h-4 w-4 text-pink-500" />
    return <Eye className="h-4 w-4 text-gray-500" />
  }

  const getPerformanceColor = (rate: number, type: 'open' | 'click') => {
    const threshold = type === 'open' ? 40 : 10
    if (rate >= threshold) return 'text-green-600'
    if (rate >= threshold * 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  // Handlers para os botões
  const handleNewAutomation = () => {
    window.location.href = '/admin/email-marketing/automations/create'
  }

  const handleEditAutomation = (automationId: string) => {
    window.location.href = `/admin/email-marketing/automations/${automationId}`
  }

  const handleViewLogs = (automationId: string) => {
    window.location.href = `/admin/email-marketing/automations/${automationId}?tab=logs`
  }

  const handleCreateSuggestion = (suggestionType: string) => {
    // Para sugestões, pode manter como desenvolvimento futuro ou implementar
    alert(`Funcionalidade em desenvolvimento: ${suggestionType}`)
  }

  const activeAutomations = automations.filter(a => a.isActive)
  const totalTriggered = automations.reduce((sum, a) => sum + a.triggered, 0)
  const avgOpenRate = automations.length > 0
    ? automations.reduce((sum, a) => sum + a.openRate, 0) / automations.length
    : 0
  const avgClickRate = automations.length > 0
    ? automations.reduce((sum, a) => sum + a.clickRate, 0) / automations.length
    : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Automações Comportamentais</h1>
            <p className="text-muted-foreground">
              Carregando automações...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Automações Comportamentais</h1>
          <p className="text-muted-foreground">
            Emails automáticos baseados no comportamento dos leads
          </p>
        </div>
        <Button onClick={handleNewAutomation}>
          <Zap className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automações Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAutomations.length}</div>
            <p className="text-xs text-muted-foreground">
              de {automations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Disparados</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriggered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Abertura Média</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {avgOpenRate > 40 ? '🎉 Excelente' : avgOpenRate > 25 ? '👍 Boa' : '📈 Pode melhorar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Clique Média</CardTitle>
            <MousePointer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {avgClickRate > 15 ? '🎉 Excelente' : avgClickRate > 8 ? '👍 Boa' : '📈 Pode melhorar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {automations.map((automation) => (
          <Card key={automation.id} className={`${automation.isActive ? 'border-green-200' : 'border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTriggerIcon(automation.trigger)}
                  <div>
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{automation.trigger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                    {automation.isActive ? 'Ativa' : 'Pausada'}
                  </Badge>
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {automation.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Leads Elegíveis</div>
                  <div className="text-2xl font-bold">{automation.leads.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Emails Enviados</div>
                  <div className="text-2xl font-bold">{automation.triggered.toLocaleString()}</div>
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Taxa Abertura</div>
                  <div className={`text-lg font-bold ${getPerformanceColor(automation.openRate, 'open')}`}>
                    {automation.openRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {automation.opened} de {automation.triggered}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Taxa Clique</div>
                  <div className={`text-lg font-bold ${getPerformanceColor(automation.clickRate, 'click')}`}>
                    {automation.clickRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {automation.clicked} de {automation.triggered}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Criada em {formatDate(automation.createdAt)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAutomation(automation.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewLogs(automation.id)}
                  >
                    Ver Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Sugestões de Automações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📊 Follow-up Proposta</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Email automático 3 dias após envio de proposta sem resposta
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateSuggestion('Criar Follow-up Proposta')}
              >
                Criar Automação
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🎯 Segmentação Dinâmica</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Move leads automaticamente entre segmentos baseado em comportamento
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateSuggestion('Configurar Segmentação Dinâmica')}
              >
                Configurar
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📱 Cross-channel</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Integração com WhatsApp para leads que não abrem emails
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateSuggestion('Integrar Cross-channel WhatsApp')}
              >
                Integrar
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">⏰ Horário Otimizado</h4>
              <p className="text-sm text-muted-foreground mb-3">
                IA para determinar melhor horário de envio por lead
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateSuggestion('Ativar IA Horário Otimizado')}
              >
                Ativar IA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}