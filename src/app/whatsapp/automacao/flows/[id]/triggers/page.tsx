'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Target,
  MessageSquare,
  Clock,
  Send,
  Plus,
  X,
  Users,
  Zap,
  Play,
  Settings,
  Trash2,
  Edit3
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Flow {
  id: string
  name: string
  description: string
  isActive: boolean
}

interface Trigger {
  id: string
  type: 'KEYWORD' | 'MANUAL' | 'SCHEDULE' | 'EVENT'
  name: string
  isActive: boolean
  config: any
}

interface Contact {
  id: string
  contactName: string
  contactNumber: string
  lastMessageAt?: string
}

export default function FlowTriggersPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params.id as string

  const [flow, setFlow] = useState<Flow | null>(null)
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para novo gatilho por palavra-chave
  const [newKeywordTrigger, setNewKeywordTrigger] = useState({
    name: '',
    keywords: '',
    isActive: true
  })

  // Estados para disparo manual
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showManualDialog, setShowManualDialog] = useState(false)

  // Estados para novo gatilho
  const [showNewTriggerDialog, setShowNewTriggerDialog] = useState(false)
  const [newTriggerType, setNewTriggerType] = useState<'KEYWORD' | 'SCHEDULE' | 'EVENT'>('KEYWORD')

  // Estados para gatilho por horário
  const [newScheduleTrigger, setNewScheduleTrigger] = useState({
    name: '',
    scheduleType: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    date: '',
    time: '',
    dayOfWeek: '',
    dayOfMonth: '',
    isActive: true
  })
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  // Estados para gatilho por evento
  const [newEventTrigger, setNewEventTrigger] = useState({
    name: '',
    eventType: 'new_contact' as 'new_contact' | 'inactive_contact' | 'birthday',
    daysInactive: '',
    isActive: true
  })
  const [showEventDialog, setShowEventDialog] = useState(false)

  useEffect(() => {
    loadFlowData()
    loadTriggers()
    loadContacts()
  }, [flowId])

  const loadFlowData = async () => {
    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/triggers`)
      if (response.ok) {
        const data = await response.json()
        setFlow(data.flow)
        setTriggers(data.triggers)
      } else {
        // Fallback para dados mock
        setFlow({
          id: flowId,
          name: 'Fluxo de Boas-vindas',
          description: 'Fluxo automático para novos contatos',
          isActive: true
        })
        setTriggers([])
      }
    } catch (error) {
      console.error('Erro ao carregar fluxo:', error)
      // Fallback para dados mock
      setFlow({
        id: flowId,
        name: 'Fluxo de Boas-vindas',
        description: 'Fluxo automático para novos contatos',
        isActive: true
      })
      setTriggers([])
    } finally {
      setLoading(false)
    }
  }

  const loadTriggers = async () => {
    // Esta função agora é chamada dentro de loadFlowData
  }

  const loadContacts = async () => {
    try {
      // Carregar contatos reais da API
      const response = await fetch('/api/whatsapp/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      } else {
        // Mock data
        setContacts([
          { id: '1', contactName: 'João Silva', contactNumber: '5511999999999' },
          { id: '2', contactName: 'Maria Santos', contactNumber: '5511888888888' },
          { id: '3', contactName: 'Pedro Costa', contactNumber: '5511777777777' }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      // Mock data como fallback
      setContacts([
        { id: '1', contactName: 'João Silva', contactNumber: '5511999999999' },
        { id: '2', contactName: 'Maria Santos', contactNumber: '5511888888888' },
        { id: '3', contactName: 'Pedro Costa', contactNumber: '5511777777777' }
      ])
    }
  }

  const createKeywordTrigger = async () => {
    console.log('createKeywordTrigger called with:', newKeywordTrigger)

    if (!newKeywordTrigger.name || !newKeywordTrigger.keywords) {
      console.log('Validation failed: missing name or keywords')
      toast.error('Preencha todos os campos')
      return
    }

    const keywordList = newKeywordTrigger.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)

    console.log('Processed keywords:', keywordList)

    if (keywordList.length === 0) {
      console.log('No valid keywords found')
      toast.error('Adicione pelo menos uma palavra-chave')
      return
    }

    const requestBody = {
      type: 'KEYWORD',
      name: newKeywordTrigger.name,
      isActive: newKeywordTrigger.isActive,
      config: { keywords: keywordList }
    }

    console.log('Making API request to:', `/api/whatsapp/flows/${flowId}/triggers`)
    console.log('Request body:', requestBody)

    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Success response:', data)
        setTriggers(prev => [...prev, data.trigger])
        setNewKeywordTrigger({ name: '', keywords: '', isActive: true })
        setShowNewTriggerDialog(false)
        toast.success(`Gatilho "${data.trigger.name}" criado com sucesso!`)
      } else {
        const errorText = await response.text()
        console.log('Error response text:', errorText)

        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: errorText }
        }

        console.log('Error response:', error)
        toast.error(error.error || 'Erro ao criar gatilho')
      }
    } catch (error) {
      console.error('Network/fetch error:', error)
      toast.error('Erro de rede ao criar gatilho')
    }
  }

  const createScheduleTrigger = async () => {
    if (!newScheduleTrigger.name || !newScheduleTrigger.time) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Validações específicas por tipo de agendamento
    if (newScheduleTrigger.scheduleType === 'once' && !newScheduleTrigger.date) {
      toast.error('Para agendamento único, selecione uma data')
      return
    }

    if (newScheduleTrigger.scheduleType === 'weekly' && !newScheduleTrigger.dayOfWeek) {
      toast.error('Para agendamento semanal, selecione o dia da semana')
      return
    }

    if (newScheduleTrigger.scheduleType === 'monthly' && !newScheduleTrigger.dayOfMonth) {
      toast.error('Para agendamento mensal, selecione o dia do mês')
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'SCHEDULE',
          name: newScheduleTrigger.name,
          isActive: newScheduleTrigger.isActive,
          config: {
            scheduleType: newScheduleTrigger.scheduleType,
            time: newScheduleTrigger.time,
            date: newScheduleTrigger.date || null,
            dayOfWeek: newScheduleTrigger.dayOfWeek || null,
            dayOfMonth: newScheduleTrigger.dayOfMonth || null
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTriggers(prev => [...prev, data.trigger])
        setNewScheduleTrigger({
          name: '',
          scheduleType: 'once',
          date: '',
          time: '',
          dayOfWeek: '',
          dayOfMonth: '',
          isActive: true
        })
        setShowScheduleDialog(false)
        toast.success(`Agendamento "${data.trigger.name}" criado com sucesso!`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar agendamento')
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast.error('Erro ao criar agendamento')
    }
  }

  const createEventTrigger = async () => {
    if (!newEventTrigger.name) {
      toast.error('Preencha o nome do gatilho')
      return
    }

    // Validação específica para contato inativo
    if (newEventTrigger.eventType === 'inactive_contact' && (!newEventTrigger.daysInactive || parseInt(newEventTrigger.daysInactive) <= 0)) {
      toast.error('Para contato inativo, especifique o número de dias')
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'EVENT',
          name: newEventTrigger.name,
          isActive: newEventTrigger.isActive,
          config: {
            eventType: newEventTrigger.eventType,
            daysInactive: newEventTrigger.eventType === 'inactive_contact' ? parseInt(newEventTrigger.daysInactive) : null
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTriggers(prev => [...prev, data.trigger])
        setNewEventTrigger({
          name: '',
          eventType: 'new_contact',
          daysInactive: '',
          isActive: true
        })
        setShowEventDialog(false)
        toast.success(`Gatilho de evento "${data.trigger.name}" criado com sucesso!`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar gatilho de evento')
      }
    } catch (error) {
      console.error('Erro ao criar gatilho de evento:', error)
      toast.error('Erro ao criar gatilho de evento')
    }
  }

  const toggleTrigger = async (triggerId: string) => {
    setTriggers(prev => prev.map(trigger =>
      trigger.id === triggerId
        ? { ...trigger, isActive: !trigger.isActive }
        : trigger
    ))
    toast.success('Status do gatilho atualizado')
  }

  const deleteTrigger = async (triggerId: string) => {
    setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId))
    toast.success('Gatilho removido')
  }

  const executeManualTrigger = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato')
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactIds: selectedContacts,
          triggerType: 'MANUAL'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Fluxo disparado para ${data.executionsCreated} contato(s)!`)
        setSelectedContacts([])
        setShowManualDialog(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao disparar fluxo')
      }
    } catch (error) {
      console.error('Erro ao executar disparo manual:', error)
      toast.error('Erro ao disparar fluxo')
    }
  }

  const formatKeywords = (keywords: string[]) => {
    return keywords.map(keyword => `"${keyword}"`).join(', ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando gatilhos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/whatsapp/automacao/flows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Gatilhos do Fluxo
          </h1>
          <p className="text-gray-600">
            {flow?.name} - Configure quando este fluxo será ativado
          </p>
        </div>
      </div>

      <Tabs defaultValue="keyword" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keyword" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Palavra-chave
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Agendamento
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Disparo Manual
          </TabsTrigger>
        </TabsList>

        {/* Aba Palavra-chave */}
        <TabsContent value="keyword" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Gatilhos por Palavra-chave
                </CardTitle>
                <Button onClick={() => setShowNewTriggerDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Gatilho
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggers.filter(t => t.type === 'KEYWORD').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum gatilho por palavra-chave configurado</p>
                  <p className="text-sm">Clique em "Novo Gatilho" para começar</p>
                </div>
              ) : (
                triggers.filter(t => t.type === 'KEYWORD').map(trigger => (
                  <div key={trigger.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{trigger.name}</h3>
                          <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                            {trigger.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Palavras-chave:</strong> {formatKeywords(trigger.config.keywords)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fluxo será ativado quando cliente digitar uma dessas palavras
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.isActive}
                          onCheckedChange={() => toggleTrigger(trigger.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrigger(trigger.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Agendamento */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Gatilhos por Horário
                </CardTitle>
                <Button onClick={() => setShowScheduleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggers.filter(t => t.type === 'SCHEDULE').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum agendamento configurado</p>
                  <p className="text-sm">Clique em "Novo Agendamento" para começar</p>
                </div>
              ) : (
                triggers.filter(t => t.type === 'SCHEDULE').map(trigger => (
                  <div key={trigger.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{trigger.name}</h3>
                          <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                            {trigger.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trigger.config.scheduleType === 'once' && 'Única vez'}
                            {trigger.config.scheduleType === 'daily' && 'Diário'}
                            {trigger.config.scheduleType === 'weekly' && 'Semanal'}
                            {trigger.config.scheduleType === 'monthly' && 'Mensal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Horário:</strong> {trigger.config.time}
                          {trigger.config.date && ` - ${new Date(trigger.config.date).toLocaleDateString('pt-BR')}`}
                          {trigger.config.dayOfWeek && ` - ${trigger.config.dayOfWeek}`}
                          {trigger.config.dayOfMonth && ` - Dia ${trigger.config.dayOfMonth}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fluxo será ativado automaticamente no horário configurado
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.isActive}
                          onCheckedChange={() => toggleTrigger(trigger.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrigger(trigger.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Eventos */}
        <TabsContent value="event" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Gatilhos por Evento
                </CardTitle>
                <Button onClick={() => setShowEventDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggers.filter(t => t.type === 'EVENT').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum gatilho por evento configurado</p>
                  <p className="text-sm">Clique em "Novo Evento" para começar</p>
                </div>
              ) : (
                triggers.filter(t => t.type === 'EVENT').map(trigger => (
                  <div key={trigger.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{trigger.name}</h3>
                          <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                            {trigger.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trigger.config.eventType === 'new_contact' && 'Novo contato'}
                            {trigger.config.eventType === 'inactive_contact' && `Inativo ${trigger.config.daysInactive} dias`}
                            {trigger.config.eventType === 'birthday' && 'Aniversário'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Evento:</strong>
                          {trigger.config.eventType === 'new_contact' && ' Será ativado quando um novo contato for adicionado'}
                          {trigger.config.eventType === 'inactive_contact' && ` Será ativado quando contato ficar ${trigger.config.daysInactive} dias sem enviar mensagem`}
                          {trigger.config.eventType === 'birthday' && ' Será ativado no aniversário do contato'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fluxo será ativado automaticamente quando o evento ocorrer
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.isActive}
                          onCheckedChange={() => toggleTrigger(trigger.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrigger(trigger.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Disparo Manual */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Disparo Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 mb-4">
                    Selecione contatos específicos para disparar este fluxo imediatamente.
                  </p>
                  <Button
                    onClick={() => setShowManualDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Selecionar Contatos e Disparar
                  </Button>
                </div>

                {/* Histórico de disparos manuais */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Últimos Disparos Manuais</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">3 contatos</p>
                        <p className="text-xs text-gray-500">Hoje às 14:30</p>
                      </div>
                      <Badge variant="outline">Enviado</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">1 contato</p>
                        <p className="text-xs text-gray-500">Ontem às 16:45</p>
                      </div>
                      <Badge variant="outline">Enviado</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para novo gatilho por palavra-chave */}
      <Dialog open={showNewTriggerDialog} onOpenChange={setShowNewTriggerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Gatilho por Palavra-chave</DialogTitle>
            <DialogDescription>
              Configure palavras que ativarão automaticamente este fluxo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Gatilho</label>
              <Input
                placeholder="Ex: Saudações, Suporte, Preços..."
                value={newKeywordTrigger.name}
                onChange={(e) => setNewKeywordTrigger(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Palavras-chave</label>
              <Textarea
                placeholder="Digite as palavras separadas por vírgula. Ex: oi, olá, hello, bom dia"
                value={newKeywordTrigger.keywords}
                onChange={(e) => setNewKeywordTrigger(prev => ({ ...prev, keywords: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separe as palavras com vírgulas. Não diferencia maiúsculas/minúsculas.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newKeywordTrigger.isActive}
                onCheckedChange={(checked) => setNewKeywordTrigger(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Ativar gatilho imediatamente</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTriggerDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createKeywordTrigger}>
              Criar Gatilho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para novo agendamento */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Configure horários específicos para disparar este fluxo automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Agendamento</label>
              <Input
                placeholder="Ex: Campanha Segunda-feira, Lembrete Mensal..."
                value={newScheduleTrigger.name}
                onChange={(e) => setNewScheduleTrigger(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Agendamento</label>
              <Select
                value={newScheduleTrigger.scheduleType}
                onValueChange={(value: 'once' | 'daily' | 'weekly' | 'monthly') =>
                  setNewScheduleTrigger(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Única vez</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Horário</label>
              <Input
                type="time"
                value={newScheduleTrigger.time}
                onChange={(e) => setNewScheduleTrigger(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            {newScheduleTrigger.scheduleType === 'once' && (
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={newScheduleTrigger.date}
                  onChange={(e) => setNewScheduleTrigger(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {newScheduleTrigger.scheduleType === 'weekly' && (
              <div>
                <label className="text-sm font-medium">Dia da Semana</label>
                <Select
                  value={newScheduleTrigger.dayOfWeek}
                  onValueChange={(value) => setNewScheduleTrigger(prev => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Domingo</SelectItem>
                    <SelectItem value="Monday">Segunda-feira</SelectItem>
                    <SelectItem value="Tuesday">Terça-feira</SelectItem>
                    <SelectItem value="Wednesday">Quarta-feira</SelectItem>
                    <SelectItem value="Thursday">Quinta-feira</SelectItem>
                    <SelectItem value="Friday">Sexta-feira</SelectItem>
                    <SelectItem value="Saturday">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newScheduleTrigger.scheduleType === 'monthly' && (
              <div>
                <label className="text-sm font-medium">Dia do Mês</label>
                <Select
                  value={newScheduleTrigger.dayOfMonth}
                  onValueChange={(value) => setNewScheduleTrigger(prev => ({ ...prev, dayOfMonth: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={newScheduleTrigger.isActive}
                onCheckedChange={(checked) => setNewScheduleTrigger(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Ativar agendamento imediatamente</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createScheduleTrigger}>
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para novo gatilho por evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Gatilho por Evento</DialogTitle>
            <DialogDescription>
              Configure eventos que ativarão automaticamente este fluxo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Gatilho</label>
              <Input
                placeholder="Ex: Boas-vindas, Reativação, Aniversário..."
                value={newEventTrigger.name}
                onChange={(e) => setNewEventTrigger(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Evento</label>
              <Select
                value={newEventTrigger.eventType}
                onValueChange={(value: 'new_contact' | 'inactive_contact' | 'birthday') =>
                  setNewEventTrigger(prev => ({ ...prev, eventType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_contact">Novo contato adicionado</SelectItem>
                  <SelectItem value="inactive_contact">Contato inativo há X dias</SelectItem>
                  <SelectItem value="birthday">Aniversário do contato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newEventTrigger.eventType === 'inactive_contact' && (
              <div>
                <label className="text-sm font-medium">Dias sem atividade</label>
                <Input
                  type="number"
                  placeholder="Ex: 7, 15, 30..."
                  value={newEventTrigger.daysInactive}
                  onChange={(e) => setNewEventTrigger(prev => ({ ...prev, daysInactive: e.target.value }))}
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fluxo será ativado quando o contato ficar este número de dias sem enviar mensagem
                </p>
              </div>
            )}

            {newEventTrigger.eventType === 'new_contact' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-900">
                  Este gatilho será ativado sempre que um novo contato for adicionado à sua lista do WhatsApp
                </p>
              </div>
            )}

            {newEventTrigger.eventType === 'birthday' && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-900">
                  Este gatilho será ativado no aniversário dos contatos que possuem data de nascimento cadastrada
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={newEventTrigger.isActive}
                onCheckedChange={(checked) => setNewEventTrigger(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Ativar gatilho imediatamente</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createEventTrigger}>
              Criar Gatilho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para disparo manual */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disparo Manual do Fluxo</DialogTitle>
            <DialogDescription>
              Selecione os contatos que receberão este fluxo imediatamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {contacts.map(contact => (
                <div
                  key={contact.id}
                  className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                    selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => {
                    setSelectedContacts(prev =>
                      prev.includes(contact.id)
                        ? prev.filter(id => id !== contact.id)
                        : [...prev, contact.id]
                    )
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{contact.contactName}</p>
                    <p className="text-sm text-gray-500">{contact.contactNumber}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedContacts.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {selectedContacts.length} contato(s) selecionado(s)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={executeManualTrigger}
              disabled={selectedContacts.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Disparar Fluxo ({selectedContacts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}