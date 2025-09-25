'use client'

import { useState } from 'react'
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
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Re-engajamento Leads Inativos',
      trigger: 'Não abriu email há 30 dias',
      description: 'Série de 3 emails para reativar leads que não abrem emails',
      isActive: true,
      leads: 284,
      triggered: 89,
      opened: 31,
      clicked: 8,
      openRate: 34.8,
      clickRate: 9.0,
      createdAt: '2025-09-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Abandono de Carrinho',
      trigger: 'Visitou página de preços sem converter',
      description: 'Email de follow-up 2h após visitar página de preços',
      isActive: true,
      leads: 156,
      triggered: 42,
      opened: 28,
      clicked: 12,
      openRate: 66.7,
      clickRate: 28.6,
      createdAt: '2025-09-18T14:30:00Z'
    },
    {
      id: '3',
      name: 'Aniversário de Lead',
      trigger: 'Data de aniversário',
      description: 'Email personalizado no aniversário do lead',
      isActive: false,
      leads: 512,
      triggered: 23,
      opened: 19,
      clicked: 7,
      openRate: 82.6,
      clickRate: 30.4,
      createdAt: '2025-09-15T09:00:00Z'
    },
    {
      id: '4',
      name: 'Lead Score Alto',
      trigger: 'Score ≥ 80 pontos',
      description: 'Notificação imediata para vendas quando lead fica quente',
      isActive: true,
      leads: 78,
      triggered: 15,
      opened: 13,
      clicked: 9,
      openRate: 86.7,
      clickRate: 60.0,
      createdAt: '2025-09-22T11:15:00Z'
    },
    {
      id: '5',
      name: 'Conteúdo Educativo',
      trigger: 'Download de material',
      description: 'Sequência de 5 emails educativos após download',
      isActive: true,
      leads: 234,
      triggered: 67,
      opened: 45,
      clicked: 18,
      openRate: 67.2,
      clickRate: 26.9,
      createdAt: '2025-09-16T16:45:00Z'
    }
  ])

  const toggleAutomation = (id: string) => {
    setAutomations(automations.map(automation =>
      automation.id === id
        ? { ...automation, isActive: !automation.isActive }
        : automation
    ))
  }

  const getTriggerIcon = (trigger: string) => {
    if (trigger.includes('30 dias')) return <Clock className="h-4 w-4 text-orange-500" />
    if (trigger.includes('preços')) return <Eye className="h-4 w-4 text-blue-500" />
    if (trigger.includes('aniversário')) return <Heart className="h-4 w-4 text-pink-500" />
    if (trigger.includes('Score')) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trigger.includes('Download')) return <MousePointer className="h-4 w-4 text-purple-500" />
    return <Zap className="h-4 w-4 text-gray-500" />
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

  const activeAutomations = automations.filter(a => a.isActive)
  const totalTriggered = automations.reduce((sum, a) => sum + a.triggered, 0)
  const avgOpenRate = automations.length > 0
    ? automations.reduce((sum, a) => sum + a.openRate, 0) / automations.length
    : 0
  const avgClickRate = automations.length > 0
    ? automations.reduce((sum, a) => sum + a.clickRate, 0) / automations.length
    : 0

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
        <Button>
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
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
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
              <Button variant="outline" size="sm">
                Criar Automação
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🎯 Segmentação Dinâmica</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Move leads automaticamente entre segmentos baseado em comportamento
              </p>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📱 Cross-channel</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Integração com WhatsApp para leads que não abrem emails
              </p>
              <Button variant="outline" size="sm">
                Integrar
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">⏰ Horário Otimizado</h4>
              <p className="text-sm text-muted-foreground mb-3">
                IA para determinar melhor horário de envio por lead
              </p>
              <Button variant="outline" size="sm">
                Ativar IA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}