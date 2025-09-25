'use client'

/**
 * Página de detalhes/configuração do workflow
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, Settings, Users, BarChart3, Play, Pause, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WorkflowStep {
  id: string
  stepOrder: number
  delayHours: number
  template: {
    id: string
    name: string
    subject: string
  } | null
  conditions?: string
  active: boolean
}

interface Workflow {
  id: string
  name: string
  description?: string
  triggerType: string
  triggerConfig?: string
  active: boolean
  createdAt: string
  updatedAt: string
  steps: WorkflowStep[]
  createdBy: {
    name: string
    email: string
  }
}

interface WorkflowStats {
  total: number
  running: number
  completed: number
  paused: number
  failed: number
}

export default function WorkflowDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()

  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflow()
  }, [params.id])

  const loadWorkflow = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/email-marketing/workflows/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setWorkflow(data.workflow)
        setStats(data.stats)
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao carregar workflow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar workflow:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (active: boolean) => {
    try {
      const response = await fetch(`/api/email-marketing/workflows/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      })

      const data = await response.json()

      if (data.success) {
        setWorkflow(prev => prev ? { ...prev, active } : null)
        toast({
          title: 'Sucesso',
          description: `Workflow ${active ? 'ativado' : 'desativado'} com sucesso`
        })
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao alterar status',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao alterar workflow:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    }
  }

  const deleteWorkflow = async () => {
    if (!confirm('Tem certeza que deseja deletar este workflow? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/email-marketing/workflows/${params.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Workflow deletado com sucesso'
        })
        router.push('/admin/email-marketing/workflows')
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao deletar workflow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao deletar workflow:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const labels = {
      'LEAD_CREATED': 'Lead Criado',
      'STATUS_CHANGED': 'Status Alterado',
      'TAG_ADDED': 'Tag Adicionada',
      'DATE_BASED': 'Baseado em Data',
      'MANUAL': 'Manual'
    }
    return labels[triggerType as keyof typeof labels] || triggerType
  }

  const getTriggerColor = (triggerType: string) => {
    const colors = {
      'LEAD_CREATED': 'bg-green-100 text-green-800',
      'STATUS_CHANGED': 'bg-blue-100 text-blue-800',
      'TAG_ADDED': 'bg-purple-100 text-purple-800',
      'DATE_BASED': 'bg-orange-100 text-orange-800',
      'MANUAL': 'bg-gray-100 text-gray-800'
    }
    return colors[triggerType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando workflow...</div>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workflow não encontrado</h1>
          <Link href="/admin/email-marketing/workflows">
            <Button variant="outline">Voltar para Workflows</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/email-marketing/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
          {workflow.description && (
            <p className="text-gray-600 mt-2">{workflow.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={workflow.active}
            onCheckedChange={toggleWorkflow}
          />
          <Badge className={workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {workflow.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Informações Principais */}
        <div className="md:col-span-2 space-y-6">
          {/* Trigger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Trigger (Gatilho)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge className={getTriggerColor(workflow.triggerType)}>
                  {getTriggerLabel(workflow.triggerType)}
                </Badge>
                {workflow.triggerConfig && (
                  <span className="text-sm text-gray-600">
                    {JSON.stringify(JSON.parse(workflow.triggerConfig), null, 2)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Steps do Workflow ({workflow.steps.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Step {step.stepOrder}</Badge>
                        {step.delayHours > 0 && (
                          <span className="text-sm text-gray-600">
                            {step.delayHours}h de delay
                          </span>
                        )}
                        <Badge className={step.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {step.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {step.template ? (
                        <div>
                          <div className="font-medium">{step.template.name}</div>
                          <div className="text-sm text-gray-600">
                            Assunto: {step.template.subject}
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-600">Template não encontrado</div>
                      )}
                      {step.conditions && (
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                          <strong>Condições:</strong> {step.conditions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estatísticas */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
                    <div className="text-sm text-gray-600">Em Execução</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-gray-600">Completos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.paused}</div>
                    <div className="text-sm text-gray-600">Pausados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-sm text-gray-600">Falhas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Criado por</div>
                <div className="text-sm text-gray-600">{workflow.createdBy.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Criado em</div>
                <div className="text-sm text-gray-600">
                  {new Date(workflow.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Última atualização</div>
                <div className="text-sm text-gray-600">
                  {new Date(workflow.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/email-marketing/workflows/${workflow.id}/edit`} className="block">
                <Button className="w-full" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Workflow
                </Button>
              </Link>
              <Button
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                variant="outline"
                onClick={deleteWorkflow}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Workflow
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}