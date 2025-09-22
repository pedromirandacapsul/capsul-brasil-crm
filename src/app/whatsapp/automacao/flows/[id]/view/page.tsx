'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Clock,
  GitBranch,
  Settings,
  Edit3,
  Play,
  Pause,
  BarChart3,
  ArrowLeft,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface FlowStep {
  id: string
  stepOrder: number
  stepType: 'MESSAGE' | 'DELAY' | 'CONDITION' | 'ACTION'
  messageType?: string
  content?: string
  mediaUrl?: string
  delayMinutes?: number
  conditions?: string
  actions?: string
}

interface FlowExecution {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
  currentStep: number
  conversation: {
    contactName?: string
    contactNumber: string
  }
}

interface FlowDetails {
  id: string
  name: string
  description: string
  triggerType: string
  triggerValue?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  steps: FlowStep[]
  executions: FlowExecution[]
  _count: {
    executions: number
  }
}

const STEP_ICONS = {
  MESSAGE: MessageSquare,
  DELAY: Clock,
  CONDITION: GitBranch,
  ACTION: Settings
}

const STEP_COLORS = {
  MESSAGE: '#3b82f6',
  DELAY: '#eab308',
  CONDITION: '#8b5cf6',
  ACTION: '#10b981'
}

export default function FlowViewPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params.id as string

  const [flow, setFlow] = useState<FlowDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (flowId) {
      loadFlow()
    }
  }, [flowId])

  const loadFlow = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/whatsapp/flows/${flowId}`)

      if (response.ok) {
        const data = await response.json()
        setFlow(data.flow)
      } else {
        // Mock data for development
        const mockFlow: FlowDetails = {
          id: flowId,
          name: 'Boas-vindas Automáticas',
          description: 'Sequência de mensagens de boas-vindas para novos contatos que chegam através do site ou redes sociais',
          triggerType: 'NEW_CONTACT',
          triggerValue: undefined,
          isActive: true,
          createdAt: '2024-01-10T14:30:00Z',
          updatedAt: '2024-01-22T09:15:00Z',
          steps: [
            {
              id: 'step-1',
              stepOrder: 1,
              stepType: 'MESSAGE',
              messageType: 'TEXT',
              content: '👋 Olá! Seja muito bem-vindo(a) à *Capsul Brasil*!\n\nEstamos felizes em tê-lo(a) conosco. Meu nome é Ana e estarei aqui para ajudá-lo(a) no que precisar.',
            },
            {
              id: 'step-2',
              stepOrder: 2,
              stepType: 'DELAY',
              delayMinutes: 3
            },
            {
              id: 'step-3',
              stepOrder: 3,
              stepType: 'MESSAGE',
              messageType: 'TEXT',
              content: '🤔 Como posso ajudá-lo(a) hoje?\n\n📋 Temos soluções personalizadas para:\n✅ CRM e automação de vendas\n✅ Gestão de leads\n✅ WhatsApp Business\n\nSe tiver alguma dúvida, é só me perguntar! 😊',
            },
            {
              id: 'step-4',
              stepOrder: 4,
              stepType: 'CONDITION',
              conditions: JSON.stringify({
                type: 'response_received',
                timeout: 1440, // 24 hours
                action_if_no_response: 'send_reminder'
              })
            },
            {
              id: 'step-5',
              stepOrder: 5,
              stepType: 'ACTION',
              actions: JSON.stringify({
                type: 'assign_user',
                userId: 'auto',
                department: 'sales'
              })
            }
          ],
          executions: [
            {
              id: 'exec-1',
              status: 'COMPLETED',
              startedAt: '2024-01-22T10:15:00Z',
              completedAt: '2024-01-22T10:45:00Z',
              currentStep: 5,
              conversation: {
                contactName: 'João Silva',
                contactNumber: '5511999999999'
              }
            },
            {
              id: 'exec-2',
              status: 'RUNNING',
              startedAt: '2024-01-22T11:30:00Z',
              currentStep: 3,
              conversation: {
                contactName: 'Maria Santos',
                contactNumber: '5511888888888'
              }
            },
            {
              id: 'exec-3',
              status: 'COMPLETED',
              startedAt: '2024-01-22T09:00:00Z',
              completedAt: '2024-01-22T09:20:00Z',
              currentStep: 5,
              conversation: {
                contactNumber: '5511777777777'
              }
            }
          ],
          _count: {
            executions: 142
          }
        }
        setFlow(mockFlow)
      }
    } catch (error) {
      console.error('Erro ao carregar fluxo:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFlowStatus = async () => {
    if (!flow) return

    try {
      const response = await fetch(`/api/whatsapp/flows/${flowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !flow.isActive })
      })

      if (response.ok) {
        setFlow(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const getStepIcon = (type: string) => {
    return STEP_ICONS[type as keyof typeof STEP_ICONS] || MessageSquare
  }

  const getStepColor = (type: string) => {
    return STEP_COLORS[type as keyof typeof STEP_COLORS] || '#6b7280'
  }

  const getStepDescription = (step: FlowStep) => {
    switch (step.stepType) {
      case 'MESSAGE':
        return step.content?.substring(0, 150) + (step.content && step.content.length > 150 ? '...' : '') || 'Mensagem não configurada'
      case 'DELAY':
        return `Aguardar ${step.delayMinutes || 0} minuto(s) antes de continuar`
      case 'CONDITION':
        try {
          const conditions = JSON.parse(step.conditions || '{}')
          if (conditions.type === 'response_received') {
            return `Aguardar resposta do contato (timeout: ${conditions.timeout || 30} min)`
          }
          return 'Condição personalizada configurada'
        } catch {
          return 'Condição configurada'
        }
      case 'ACTION':
        try {
          const actions = JSON.parse(step.actions || '{}')
          if (actions.type === 'assign_user') {
            return `Atribuir conversa ao ${actions.department || 'usuário'}`
          }
          return 'Ação personalizada configurada'
        } catch {
          return 'Ação configurada'
        }
      default:
        return 'Passo não configurado'
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600'
      case 'RUNNING': return 'text-blue-600'
      case 'FAILED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'RUNNING': return Zap
      case 'FAILED': return XCircle
      default: return AlertCircle
    }
  }

  const getTriggerLabel = (type: string, value?: string) => {
    switch (type) {
      case 'NEW_CONTACT':
        return 'Novo Contato'
      case 'KEYWORD':
        return `Palavra-chave: "${value}"`
      case 'TIME_BASED':
        return 'Baseado em Tempo'
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
          <p className="mt-2 text-sm text-gray-600">Carregando fluxo...</p>
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fluxo não encontrado</h3>
          <p className="text-gray-600 mb-4">O fluxo solicitado não existe ou foi removido.</p>
          <Link href="/whatsapp/automacao/flows">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Fluxos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedExecutions = flow.executions.filter(e => e.status === 'COMPLETED').length
  const runningExecutions = flow.executions.filter(e => e.status === 'RUNNING').length
  const successRate = flow._count.executions > 0 ? Math.round((completedExecutions / flow._count.executions) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/whatsapp/automacao/flows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{flow.name}</h1>
              <Badge variant={flow.isActive ? 'default' : 'secondary'} className="text-sm">
                {flow.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{flow.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Criado em {formatDate(flow.createdAt)}</span>
              <span>•</span>
              <span>Trigger: {getTriggerLabel(flow.triggerType, flow.triggerValue)}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={flow.isActive ? "destructive" : "default"}
            onClick={toggleFlowStatus}
          >
            {flow.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ativar
              </>
            )}
          </Button>
          <Link href={`/whatsapp/automacao/flows/${flowId}`}>
            <Button variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Execuções</p>
                <p className="text-2xl font-bold">{flow._count.executions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Em Execução</p>
                <p className="text-2xl font-bold">{runningExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Passos</p>
                <p className="text-2xl font-bold">{flow.steps.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Fluxo Visual
              </CardTitle>
              <CardDescription>Sequência de passos do fluxo de automação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Trigger */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs">
                    START
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">TRIGGER</Badge>
                        <span className="font-medium text-sm">
                          {getTriggerLabel(flow.triggerType, flow.triggerValue)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Fluxo ativado automaticamente quando o trigger é acionado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connection Line */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                </div>

                {/* Steps */}
                {flow.steps.map((step, index) => {
                  const StepIcon = getStepIcon(step.stepType)
                  const stepColor = getStepColor(step.stepType)

                  return (
                    <div key={step.id}>
                      <div className="flex items-start space-x-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: stepColor }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Card className="border-l-4" style={{ borderLeftColor: stepColor }}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <StepIcon className="h-4 w-4" />
                                  <Badge variant="outline" className="text-xs">
                                    {step.stepType}
                                  </Badge>
                                  {step.messageType && (
                                    <Badge variant="secondary" className="text-xs">
                                      {step.messageType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-700">
                                <p className="break-words">{getStepDescription(step)}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Connection Line */}
                      {index < flow.steps.length - 1 && (
                        <div className="flex justify-center my-4">
                          <div className="w-0.5 h-6 bg-gray-300"></div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Connection Line to End */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                </div>

                {/* End */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
                    END
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                          FINALIZADO
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Fluxo concluído com sucesso
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Executions */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Execuções Recentes</CardTitle>
                  <CardDescription>Últimas atividades do fluxo</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {flow.executions.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Nenhuma execução ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flow.executions.slice(0, 5).map((execution) => {
                    const StatusIcon = getExecutionStatusIcon(execution.status)
                    return (
                      <div key={execution.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusIcon className={`h-4 w-4 ${getExecutionStatusColor(execution.status)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {execution.conversation.contactName || execution.conversation.contactNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Passo {execution.currentStep} de {flow.steps.length}</span>
                            <Badge
                              variant={execution.status === 'COMPLETED' ? 'default' :
                                      execution.status === 'RUNNING' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {execution.status === 'COMPLETED' ? 'Concluído' :
                               execution.status === 'RUNNING' ? 'Executando' : 'Falhou'}
                            </Badge>
                          </div>
                          <p>Iniciado: {formatDate(execution.startedAt)}</p>
                          {execution.completedAt && (
                            <p>Concluído: {formatDate(execution.completedAt)}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}