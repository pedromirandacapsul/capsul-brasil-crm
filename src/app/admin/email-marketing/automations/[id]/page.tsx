'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Activity,
  Eye,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface Automation {
  id: string
  name: string
  description: string
  triggerType: string
  active: boolean
  steps: any[]
  executions: any[]
}

interface LogEntry {
  id: string
  leadName: string
  leadEmail: string
  status: string
  createdAt: string
  logs: {
    timestamp: string
    action: string
    status: string
    message: string
    details: any
  }[]
}

export default function AutomationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [logFilter, setLogFilter] = useState('all')

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: false
  })

  useEffect(() => {
    if (params.id) {
      fetchAutomation()
      fetchLogs()
    }
  }, [params.id])

  const fetchAutomation = async () => {
    try {
      const response = await fetch(`/api/email-marketing/automations/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setAutomation(data.data)
        setFormData({
          name: data.data.name,
          description: data.data.description || '',
          active: data.data.active
        })
      }
    } catch (error) {
      console.error('Erro ao carregar automação:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/email-marketing/automations/${params.id}/logs?status=${logFilter}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data.executions)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/email-marketing/automations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert('Automação atualizada com sucesso!')
        fetchAutomation()
      } else {
        alert('Erro ao atualizar: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao atualizar automação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/email-marketing/automations/${params.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Automação excluída com sucesso!')
        router.push('/admin/email-marketing/automations')
      } else {
        alert('Erro ao excluir: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao excluir automação')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Activity className="h-4 w-4 text-blue-500" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!automation) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Automação não encontrada</h1>
          <Link href="/admin/email-marketing/automations">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Automações
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/email-marketing/automations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{automation.name}</h1>
              <p className="text-gray-600">{automation.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={automation.active ? 'default' : 'secondary'}>
              {automation.active ? 'Ativa' : 'Pausada'}
            </Badge>
            <Button variant="outline" onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{automation.executions?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Steps Configurados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{automation.steps?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {automation.active ? 'Ativa' : 'Pausada'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steps Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Steps da Automação</CardTitle>
              </CardHeader>
              <CardContent>
                {automation.steps?.length > 0 ? (
                  <div className="space-y-4">
                    {automation.steps.map((step: any, index: number) => (
                      <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.stepType}</div>
                          <div className="text-sm text-gray-600">
                            {step.template ? step.template.name : 'Template não configurado'}
                          </div>
                        </div>
                        {step.delayHours > 0 && (
                          <div className="text-sm text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {step.delayHours}h
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum step configurado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Editar Automação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da automação"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da automação"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Automação ativa</Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Logs de Execução</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="logFilter">Filtrar por status:</Label>
                    <Select value={logFilter} onValueChange={(value) => {
                      setLogFilter(value)
                      fetchLogs()
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="running">Em execução</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="failed">Falharam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logs.length > 0 ? (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{log.leadName}</div>
                              <div className="text-sm text-gray-600">{log.leadEmail}</div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </Badge>
                        </div>

                        {/* Log entries */}
                        <div className="space-y-2">
                          {log.logs.map((entry, index) => (
                            <div key={index} className="flex items-start space-x-3 text-sm">
                              <div className="w-4 h-4 mt-0.5">
                                {entry.status === 'ERROR' ?
                                  <XCircle className="h-4 w-4 text-red-500" /> :
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                }
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{entry.message}</div>
                                <div className="text-gray-500">{formatDate(entry.timestamp)}</div>
                                {entry.details && Object.keys(entry.details).length > 0 && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    {JSON.stringify(entry.details, null, 2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum log encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}