'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Zap,
  User,
  Hash,
  PlayCircle,
  Save,
  AlertTriangle,
  BarChart3,
  History
} from 'lucide-react'

interface FlowStep {
  id: string
  stepOrder: number
  stepType: 'MESSAGE' | 'DELAY' | 'CONDITION'
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
  content: string
  delayMinutes: number
  conditions?: any
}

interface Flow {
  id: string
  name: string
  description: string
  triggerType: string
  triggerValue?: string
  isActive: boolean
  executionCount: number
  lastExecutedAt?: string
  createdAt: string
  updatedAt: string
  steps: FlowStep[]
  triggers: any[]
  executions?: any[]
}

export default function EditFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flow, setFlow] = useState<Flow | null>(null)
  const [flowId, setFlowId] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: '',
    triggerValue: '',
    isActive: false
  })

  const [steps, setSteps] = useState<FlowStep[]>([])

  const triggerTypes = [
    {
      value: 'NEW_CONTACT',
      label: 'Novo Contato',
      description: 'Ativa quando um novo contato envia mensagem',
      icon: User,
      requiresValue: false
    },
    {
      value: 'KEYWORD',
      label: 'Palavra-chave',
      description: 'Ativa quando alguém envia uma palavra específica',
      icon: Hash,
      requiresValue: true,
      placeholder: 'Ex: suporte, preço, info'
    },
    {
      value: 'TIME_BASED',
      label: 'Baseado em Tempo',
      description: 'Ativa em horários específicos',
      icon: Clock,
      requiresValue: true,
      placeholder: 'Ex: daily_9am, weekly_monday'
    },
    {
      value: 'MANUAL',
      label: 'Manual',
      description: 'Ativa manualmente quando necessário',
      icon: PlayCircle,
      requiresValue: false
    }
  ]

  useEffect(() => {
    params.then(({ id }) => {
      setFlowId(id)
    })
  }, [params])

  useEffect(() => {
    if (flowId) {
      loadFlow()
    }
  }, [flowId])

  const loadFlow = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/whatsapp/flows/${flowId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Fluxo não encontrado')
        } else {
          throw new Error('Erro ao carregar fluxo')
        }
        return
      }

      const result = await response.json()

      if (result.success && result.flow) {
        const flowData = result.flow
        setFlow(flowData)

        setFormData({
          name: flowData.name,
          description: flowData.description || '',
          triggerType: flowData.triggerType,
          triggerValue: flowData.triggerValue || '',
          isActive: flowData.isActive
        })

        setSteps(flowData.steps.map((step: any) => ({
          id: step.id,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          messageType: step.messageType || 'TEXT',
          content: step.content || '',
          delayMinutes: step.delayMinutes || 0,
          conditions: step.conditions
        })))
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    const newStep: FlowStep = {
      id: `new-${Date.now()}`,
      stepOrder: steps.length + 1,
      stepType: 'MESSAGE',
      messageType: 'TEXT',
      content: '',
      delayMinutes: 0
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (stepId: string, field: string, value: any) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, [field]: value } : step
    ))
  }

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!formData.name || !formData.triggerType) {
        throw new Error('Nome e tipo de gatilho são obrigatórios')
      }

      const selectedTrigger = triggerTypes.find(t => t.value === formData.triggerType)
      if (selectedTrigger?.requiresValue && !formData.triggerValue) {
        throw new Error(`${selectedTrigger.label} requer um valor`)
      }

      const response = await fetch(`/api/whatsapp/flows/${flowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          triggerType: formData.triggerType,
          triggerValue: formData.triggerValue,
          isActive: formData.isActive,
          steps: steps.map((step, index) => ({
            stepOrder: index + 1,
            stepType: step.stepType,
            messageType: step.messageType,
            content: step.content,
            delayMinutes: step.delayMinutes,
            conditions: step.conditions
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar fluxo')
      }

      const result = await response.json()

      if (result.success) {
        router.push('/whatsapp/automacao/flows')
      } else {
        throw new Error(result.error || 'Erro ao atualizar fluxo')
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedTrigger = triggerTypes.find(t => t.value === formData.triggerType)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando fluxo...</p>
        </div>
      </div>
    )
  }

  if (error && !flow) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/whatsapp/automacao/flows">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Fluxos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/whatsapp/automacao/flows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Fluxo</h1>
            <p className="text-gray-600">Modifique as configurações do fluxo automático</p>
          </div>
        </div>
        {flow && (
          <div className="flex items-center gap-4">
            <Badge variant={formData.isActive ? 'default' : 'secondary'}>
              {formData.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className="text-sm text-gray-500">
              {flow.executionCount} execuções
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Flow Stats */}
      {flow && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total de Execuções</p>
                  <p className="text-2xl font-bold">{flow.executionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Passos Configurados</p>
                  <p className="text-2xl font-bold">{steps.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Criado em</p>
                  <p className="text-sm font-medium">
                    {new Date(flow.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Informações Básicas
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ativo</span>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Fluxo *
              </label>
              <Input
                placeholder="Ex: Boas-vindas Automáticas"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Textarea
                placeholder="Descreva o objetivo deste fluxo..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PlayCircle className="h-5 w-5 mr-2" />
              Gatilho de Ativação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quando este fluxo deve ser ativado? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {triggerTypes.map((trigger) => {
                  const Icon = trigger.icon
                  return (
                    <div
                      key={trigger.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        formData.triggerType === trigger.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        triggerType: trigger.value,
                        triggerValue: trigger.requiresValue ? prev.triggerValue : ''
                      }))}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">{trigger.label}</h4>
                          <p className="text-sm text-gray-600">{trigger.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedTrigger?.requiresValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Gatilho *
                </label>
                <Input
                  placeholder={selectedTrigger.placeholder}
                  value={formData.triggerValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggerValue: e.target.value }))}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Passos do Fluxo ({steps.length})
              </div>
              <Button type="button" onClick={addStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Passo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum passo adicionado</p>
                <p className="text-sm">Clique em "Adicionar Passo" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">Passo {index + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo do Passo
                        </label>
                        <Select
                          value={step.stepType}
                          onValueChange={(value) => updateStep(step.id, 'stepType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MESSAGE">Enviar Mensagem</SelectItem>
                            <SelectItem value="DELAY">Aguardar</SelectItem>
                            <SelectItem value="CONDITION">Condição</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {step.stepType === 'MESSAGE' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Mensagem
                          </label>
                          <Select
                            value={step.messageType}
                            onValueChange={(value) => updateStep(step.id, 'messageType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEXT">Texto</SelectItem>
                              <SelectItem value="AUDIO">Áudio</SelectItem>
                              <SelectItem value="IMAGE">Imagem</SelectItem>
                              <SelectItem value="VIDEO">Vídeo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {step.stepType === 'DELAY' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aguardar (minutos)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delayMinutes}
                            onChange={(e) => updateStep(step.id, 'delayMinutes', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>

                    {step.stepType === 'MESSAGE' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Conteúdo da Mensagem
                        </label>
                        <Textarea
                          placeholder="Digite a mensagem que será enviada..."
                          value={step.content}
                          onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/whatsapp/automacao/flows">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}