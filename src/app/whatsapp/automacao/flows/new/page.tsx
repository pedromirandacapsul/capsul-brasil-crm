'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Clock,
  GitBranch,
  Settings,
  Plus,
  Trash2,
  Save,
  Play,
  ArrowRight,
  Mic,
  Image,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FlowStep {
  id: string
  type: 'MESSAGE' | 'DELAY' | 'CONDITION' | 'ACTION'
  order: number
  config: {
    messageType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    content?: string
    mediaUrl?: string
    delayMinutes?: number
    conditions?: any
    actions?: any
  }
}

interface FlowData {
  name: string
  description: string
  triggerType: 'KEYWORD' | 'NEW_CONTACT' | 'TIME_BASED' | 'MANUAL'
  triggerValue?: string
  steps: FlowStep[]
}

const STEP_TYPES = [
  {
    type: 'MESSAGE',
    label: 'Enviar Mensagem',
    icon: MessageSquare,
    description: 'Enviar texto, áudio, imagem ou outro tipo de mídia',
    color: 'bg-blue-500'
  },
  {
    type: 'DELAY',
    label: 'Aguardar',
    icon: Clock,
    description: 'Pausar o fluxo por um período determinado',
    color: 'bg-yellow-500'
  },
  {
    type: 'CONDITION',
    label: 'Condição',
    icon: GitBranch,
    description: 'Tomar decisão baseada em condições',
    color: 'bg-purple-500'
  },
  {
    type: 'ACTION',
    label: 'Ação',
    icon: Settings,
    description: 'Executar ação como adicionar tag ou atribuir usuário',
    color: 'bg-green-500'
  }
]

const MESSAGE_TYPES = [
  { value: 'TEXT', label: 'Texto', icon: MessageSquare },
  { value: 'AUDIO', label: 'Áudio', icon: Mic },
  { value: 'IMAGE', label: 'Imagem', icon: Image },
  { value: 'DOCUMENT', label: 'Documento', icon: FileText }
]

export default function NewFlowPage() {
  const router = useRouter()
  const [flowData, setFlowData] = useState<FlowData>({
    name: '',
    description: '',
    triggerType: 'KEYWORD',
    triggerValue: '',
    steps: []
  })

  const [editingStep, setEditingStep] = useState<FlowStep | null>(null)
  const [showStepTypes, setShowStepTypes] = useState(false)
  const [saving, setSaving] = useState(false)

  const addStep = (type: FlowStep['type']) => {
    const newStep: FlowStep = {
      id: Date.now().toString(),
      type,
      order: flowData.steps.length + 1,
      config: {}
    }

    setFlowData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))

    setEditingStep(newStep)
    setShowStepTypes(false)
  }

  const updateStep = (stepId: string, config: any) => {
    setFlowData(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, config: { ...step.config, ...config } } : step
      )
    }))
  }

  const removeStep = (stepId: string) => {
    setFlowData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 }))
    }))
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const steps = [...flowData.steps]
    const currentIndex = steps.findIndex(step => step.id === stepId)

    if (direction === 'up' && currentIndex > 0) {
      [steps[currentIndex], steps[currentIndex - 1]] = [steps[currentIndex - 1], steps[currentIndex]]
    } else if (direction === 'down' && currentIndex < steps.length - 1) {
      [steps[currentIndex], steps[currentIndex + 1]] = [steps[currentIndex + 1], steps[currentIndex]]
    }

    // Reorder steps
    const reorderedSteps = steps.map((step, index) => ({ ...step, order: index + 1 }))

    setFlowData(prev => ({ ...prev, steps: reorderedSteps }))
  }

  const saveFlow = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!flowData.name || !flowData.triggerType) {
        alert('Nome e tipo de trigger são obrigatórios')
        return
      }

      if (flowData.triggerType === 'KEYWORD' && !flowData.triggerValue) {
        alert('Palavra-chave é obrigatória para trigger de palavra-chave')
        return
      }

      // Prepare flow data for API
      const flowPayload = {
        name: flowData.name,
        description: flowData.description,
        triggerType: flowData.triggerType,
        triggerValue: flowData.triggerValue,
        isActive: true,
        steps: flowData.steps.map((step, index) => ({
          stepOrder: index + 1,
          stepType: step.type,
          messageType: step.config.messageType || 'TEXT',
          content: step.config.content || '',
          mediaUrl: step.config.mediaUrl || null,
          delayMinutes: step.config.delayMinutes || 0
        }))
      }

      console.log('Saving flow:', flowPayload)

      // Make API call
      const response = await fetch('/api/whatsapp/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar fluxo')
      }

      const result = await response.json()
      console.log('Flow saved successfully:', result)

      router.push('/whatsapp/automacao/flows')
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error)
      alert('Erro ao salvar fluxo')
    } finally {
      setSaving(false)
    }
  }

  const getStepIcon = (type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type)
    return stepType ? stepType.icon : MessageSquare
  }

  const getStepColor = (type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type)
    return stepType ? stepType.color : 'bg-gray-500'
  }

  const renderStepConfig = (step: FlowStep) => {
    switch (step.type) {
      case 'MESSAGE':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Mensagem</Label>
              <Select
                value={step.config.messageType || 'TEXT'}
                onValueChange={(value) => updateStep(step.id, { messageType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {step.config.messageType === 'TEXT' && (
              <div>
                <Label>Conteúdo da Mensagem</Label>
                <Textarea
                  placeholder="Digite o conteúdo da mensagem..."
                  value={step.config.content || ''}
                  onChange={(e) => updateStep(step.id, { content: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variáveis como {'{name}'}, {'{time}'}, etc.
                </p>
              </div>
            )}

            {step.config.messageType === 'AUDIO' && (
              <div>
                <Label>Texto para TTS</Label>
                <Textarea
                  placeholder="Digite o texto que será convertido em áudio..."
                  value={step.config.content || ''}
                  onChange={(e) => updateStep(step.id, { content: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {['IMAGE', 'DOCUMENT'].includes(step.config.messageType || '') && (
              <div className="space-y-2">
                <div>
                  <Label>URL da Mídia</Label>
                  <Input
                    placeholder="https://exemplo.com/arquivo.jpg"
                    value={step.config.mediaUrl || ''}
                    onChange={(e) => updateStep(step.id, { mediaUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Legenda (opcional)</Label>
                  <Input
                    placeholder="Legenda da mídia..."
                    value={step.config.content || ''}
                    onChange={(e) => updateStep(step.id, { content: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'DELAY':
        return (
          <div>
            <Label>Tempo de Espera (minutos)</Label>
            <Input
              type="number"
              placeholder="5"
              value={step.config.delayMinutes || ''}
              onChange={(e) => updateStep(step.id, { delayMinutes: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-gray-500 mt-1">
              O fluxo será pausado por este período antes de continuar
            </p>
          </div>
        )

      case 'CONDITION':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Condição</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_tag">Contato tem tag</SelectItem>
                  <SelectItem value="message_contains">Mensagem contém texto</SelectItem>
                  <SelectItem value="time_based">Baseado em horário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor da Condição</Label>
              <Input placeholder="Digite o valor..." />
            </div>
          </div>
        )

      case 'ACTION':
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Ação</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add_tag">Adicionar tag</SelectItem>
                  <SelectItem value="remove_tag">Remover tag</SelectItem>
                  <SelectItem value="assign_user">Atribuir usuário</SelectItem>
                  <SelectItem value="set_variable">Definir variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Configuração da Ação</Label>
              <Input placeholder="Digite a configuração..." />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Fluxo</h1>
          <p className="text-gray-600 mt-1">Configure triggers e sequências de mensagens automáticas</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={saveFlow} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Fluxo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Configure o nome e trigger do fluxo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do Fluxo</Label>
                <Input
                  placeholder="Ex: Boas-vindas para novos contatos"
                  value={flowData.name}
                  onChange={(e) => setFlowData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o objetivo deste fluxo..."
                  value={flowData.description}
                  onChange={(e) => setFlowData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Trigger</Label>
                  <Select
                    value={flowData.triggerType}
                    onValueChange={(value: any) => setFlowData(prev => ({ ...prev, triggerType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEYWORD">Palavra-chave</SelectItem>
                      <SelectItem value="NEW_CONTACT">Novo contato</SelectItem>
                      <SelectItem value="TIME_BASED">Baseado em tempo</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {flowData.triggerType === 'KEYWORD' && (
                  <div>
                    <Label>Palavra-chave</Label>
                    <Input
                      placeholder="Ex: oi, olá, ajuda"
                      value={flowData.triggerValue}
                      onChange={(e) => setFlowData(prev => ({ ...prev, triggerValue: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Flow Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Passos do Fluxo</CardTitle>
                  <CardDescription>Arraste e configure os passos da sequência</CardDescription>
                </div>
                <Button onClick={() => setShowStepTypes(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Passo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {flowData.steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum passo adicionado</h3>
                  <p className="text-gray-600 mb-4">Comece adicionando o primeiro passo do seu fluxo</p>
                  <Button onClick={() => setShowStepTypes(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Passo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {flowData.steps.map((step, index) => {
                    const StepIcon = getStepIcon(step.type)
                    return (
                      <div key={step.id} className="flex items-start space-x-4">
                        {/* Step Number and Icon */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full ${getStepColor(step.type)} flex items-center justify-center text-white font-bold`}>
                            {index + 1}
                          </div>
                          {index < flowData.steps.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1">
                          <Card className="border-l-4" style={{ borderLeftColor: getStepColor(step.type).replace('bg-', '#') }}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <StepIcon className="h-5 w-5" />
                                  <Badge variant="outline">{step.type}</Badge>
                                  {step.config.messageType && (
                                    <Badge variant="secondary">{step.config.messageType}</Badge>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveStep(step.id, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveStep(step.id, 'down')}
                                    disabled={index === flowData.steps.length - 1}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingStep(step)}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStep(step.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Step Preview */}
                              <div className="text-sm text-gray-700">
                                {step.type === 'MESSAGE' && (
                                  <p>{step.config.content || 'Mensagem não configurada'}</p>
                                )}
                                {step.type === 'DELAY' && (
                                  <p>Aguardar {step.config.delayMinutes || 0} minuto(s)</p>
                                )}
                                {step.type === 'CONDITION' && (
                                  <p>Condição não configurada</p>
                                )}
                                {step.type === 'ACTION' && (
                                  <p>Ação não configurada</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Templates and Help */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>Use templates aprovados do WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/whatsapp/automacao/templates">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Gerenciar Templates
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Templates Rápidos:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const welcomeStep: FlowStep = {
                      id: Date.now().toString(),
                      type: 'MESSAGE',
                      order: flowData.steps.length + 1,
                      config: {
                        messageType: 'TEXT',
                        content: 'Olá {{name}}! 👋\n\nSeja muito bem-vindo(a)! Estamos felizes em tê-lo(a) conosco.\n\nSe tiver alguma dúvida, estarei aqui para ajudar!'
                      }
                    }
                    setFlowData(prev => ({
                      ...prev,
                      steps: [...prev.steps, welcomeStep]
                    }))
                  }}
                >
                  + Boas-vindas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const followUpStep: FlowStep = {
                      id: Date.now().toString(),
                      type: 'MESSAGE',
                      order: flowData.steps.length + 1,
                      config: {
                        messageType: 'TEXT',
                        content: 'Olá {{name}}! 📞\n\nEspero que esteja bem! Gostaria de saber como posso ajudá-lo(a) hoje.\n\nTem alguma dúvida sobre nossos produtos/serviços?'
                      }
                    }
                    setFlowData(prev => ({
                      ...prev,
                      steps: [...prev.steps, followUpStep]
                    }))
                  }}
                >
                  + Follow-up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const supportStep: FlowStep = {
                      id: Date.now().toString(),
                      type: 'MESSAGE',
                      order: flowData.steps.length + 1,
                      config: {
                        messageType: 'TEXT',
                        content: '🔧 Suporte Técnico\n\nOlá! Como posso ajudá-lo(a)?\n\nPor favor, descreva sua dúvida ou problema e nosso time técnico irá auxiliá-lo(a).'
                      }
                    }
                    setFlowData(prev => ({
                      ...prev,
                      steps: [...prev.steps, supportStep]
                    }))
                  }}
                >
                  + Suporte
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variáveis Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">{'{name}'}</code>
                <span className="ml-2 text-gray-600">Nome do contato</span>
              </div>
              <div className="text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">{'{time}'}</code>
                <span className="ml-2 text-gray-600">Horário atual</span>
              </div>
              <div className="text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">{'{date}'}</code>
                <span className="ml-2 text-gray-600">Data atual</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Step Types Dialog */}
      <Dialog open={showStepTypes} onOpenChange={setShowStepTypes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Passo</DialogTitle>
            <DialogDescription>Escolha o tipo de passo para adicionar ao fluxo</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STEP_TYPES.map(stepType => {
              const Icon = stepType.icon
              return (
                <Card
                  key={stepType.type}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addStep(stepType.type as FlowStep['type'])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${stepType.color} flex items-center justify-center text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{stepType.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{stepType.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Passo</DialogTitle>
            <DialogDescription>
              Configure as opções para este passo do fluxo
            </DialogDescription>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              {renderStepConfig(editingStep)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Cancelar
            </Button>
            <Button onClick={() => setEditingStep(null)}>
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}