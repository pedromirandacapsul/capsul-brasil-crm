'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  Play,
  Pause,
  Settings,
  BarChart3,
  Bot,
  Mic,
  Send,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface AutomationStats {
  activeFlows: number
  totalExecutions: number
  activeCampaigns: number
  messagesAutomated: number
  audioGenerated: number
}

interface Flow {
  id: string
  name: string
  description: string
  isActive: boolean
  triggerType: string
  executionCount: number
  createdAt: string
}

interface Campaign {
  id: string
  campaignName: string
  status: string
  sentCount: number
  deliveredCount: number
  targetCount: number
  createdAt: string
}

export default function AutomationPage() {
  const [stats, setStats] = useState<AutomationStats>({
    activeFlows: 0,
    totalExecutions: 0,
    activeCampaigns: 0,
    messagesAutomated: 0,
    audioGenerated: 0
  })

  const [recentFlows, setRecentFlows] = useState<Flow[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAutomationData()
  }, [])

  const loadAutomationData = async () => {
    try {
      setLoading(true)

      // Mock data for now - replace with actual API calls
      setStats({
        activeFlows: 3,
        totalExecutions: 127,
        activeCampaigns: 2,
        messagesAutomated: 1543,
        audioGenerated: 45
      })

      setRecentFlows([
        {
          id: '1',
          name: 'Boas-vindas Novos Contatos',
          description: 'Sequência automática para novos leads',
          isActive: true,
          triggerType: 'NEW_CONTACT',
          executionCount: 45,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Follow-up Vendas',
          description: 'Acompanhamento pós-proposta',
          isActive: true,
          triggerType: 'KEYWORD',
          executionCount: 32,
          createdAt: '2024-01-10'
        }
      ])

      setRecentCampaigns([
        {
          id: '1',
          campaignName: 'Promoção Black Friday',
          status: 'COMPLETED',
          sentCount: 850,
          deliveredCount: 823,
          targetCount: 850,
          createdAt: '2024-01-20'
        }
      ])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando automação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automação WhatsApp</h1>
          <p className="text-gray-600 mt-1">Gerencie fluxos automáticos, campanhas e recursos avançados</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/whatsapp/automacao/monitor">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Monitor
            </Button>
          </Link>
          <Link href="/whatsapp/automacao/flows/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Fluxo
            </Button>
          </Link>
          <Link href="/whatsapp/automacao/campaigns/new">
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxos Ativos</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFlows}</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções</CardTitle>
            <Bot className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">+18 hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">2 programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Msgs Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesAutomated}</div>
            <p className="text-xs text-muted-foreground">+127 hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áudios TTS</CardTitle>
            <Mic className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.audioGenerated}</div>
            <p className="text-xs text-muted-foreground">+8 esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/whatsapp/automacao/flows">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Fluxos de Mensagens
              </CardTitle>
              <CardDescription>
                Crie sequências automáticas com triggers inteligentes
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/whatsapp/automacao/campaigns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Send className="h-5 w-5 mr-2 text-purple-600" />
                Campanhas
              </CardTitle>
              <CardDescription>
                Mensagens em massa com segmentação avançada
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/whatsapp/automacao/audio">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Mic className="h-5 w-5 mr-2 text-red-600" />
                Áudios TTS
              </CardTitle>
              <CardDescription>
                Geração automática de mensagens de voz
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/whatsapp/automacao/templates">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                Templates
              </CardTitle>
              <CardDescription>
                Gerencie templates de mensagem aprovados
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Flows */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fluxos Recentes</CardTitle>
              <Link href="/whatsapp/automacao/flows">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFlows.map((flow) => (
                <div key={flow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{flow.name}</h4>
                      <Badge variant={flow.isActive ? "default" : "secondary"}>
                        {flow.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {flow.executionCount} execuções • Trigger: {flow.triggerType}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      {flow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campanhas Recentes</CardTitle>
              <Link href="/whatsapp/automacao/campaigns">
                <Button variant="ghost" size="sm">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{campaign.campaignName}</h4>
                      <Badge variant={campaign.status === 'COMPLETED' ? "default" : "secondary"}>
                        {campaign.status === 'COMPLETED' ? 'Concluída' : campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {campaign.sentCount}/{campaign.targetCount} enviadas
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(campaign.sentCount / campaign.targetCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}