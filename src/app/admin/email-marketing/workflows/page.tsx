'use client'

/**
 * Página principal de workflows de email marketing
 */

import { useState, useEffect } from 'react'
import { Plus, Play, Pause, Trash2, Settings, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
// import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface Workflow {
  id: string
  name: string
  description?: string
  triggerType: string
  active: boolean
  createdAt: string
  steps: any[]
  createdBy: {
    name: string
    email: string
  }
  _count: {
    executions: number
  }
}

interface WorkflowStats {
  total: number
  running: number
  completed: number
  paused: number
  failed: number
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, WorkflowStats>>({})
  // const { toast } = useToast()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/email-marketing/workflows')
      const data = await response.json()

      if (data.success) {
        setWorkflows(data.workflows)

        // Carregar estatísticas para cada workflow
        for (const workflow of data.workflows) {
          loadWorkflowStats(workflow.id)
        }
      } else {
        console.error('Erro ao carregar workflows:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar workflows:', error)
      console.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflowStats = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/email-marketing/workflows/${workflowId}`)
      const data = await response.json()

      if (data.success && data.stats) {
        setStats(prev => ({
          ...prev,
          [workflowId]: data.stats
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const toggleWorkflow = async (workflowId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/email-marketing/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      })

      const data = await response.json()

      if (data.success) {
        setWorkflows(prev =>
          prev.map(w => w.id === workflowId ? { ...w, active } : w)
        )

        console.log(`Workflow ${active ? 'ativado' : 'desativado'} com sucesso`)
      } else {
        console.error('Erro ao alterar status:', data.error)
      }
    } catch (error) {
      console.error('Erro ao alterar workflow:', error)
      console.error('Erro de conexão')
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Tem certeza que deseja deletar este workflow? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/email-marketing/workflows/${workflowId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId))
        console.log('Workflow deletado com sucesso')
      } else {
        console.error('Erro ao deletar workflow:', data.error)
      }
    } catch (error) {
      console.error('Erro ao deletar workflow:', error)
      console.error('Erro de conexão')
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

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando workflows...</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflows de Email</h1>
              <p className="text-gray-600 mt-2">
                Gerencie automações de email marketing
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/email-marketing/workflows/executions">
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Execuções
                </Button>
              </Link>
              <Link href="/admin/email-marketing/workflows/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Workflow
                </Button>
              </Link>
            </div>
          </div>

          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum workflow criado
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Crie seu primeiro workflow de automação de email marketing
                </p>
                <Link href="/admin/email-marketing/workflows/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Workflow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {workflows.map((workflow) => {
                const workflowStats = stats[workflow.id]

                return (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{workflow.name}</CardTitle>
                            <Badge
                              className={getTriggerColor(workflow.triggerType)}
                            >
                              {getTriggerLabel(workflow.triggerType)}
                            </Badge>
                            {workflow.active ? (
                              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                          {workflow.description && (
                            <CardDescription>{workflow.description}</CardDescription>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span>{workflow.steps.length} steps</span>
                            <span>{workflow._count.executions} execuções</span>
                            <span>Criado por {workflow.createdBy.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={workflow.active}
                            onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                          />
                          <Link href={`/admin/email-marketing/workflows/${workflow.id}`}>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {workflowStats && (
                      <CardContent className="pt-0">
                        <div className="flex gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {workflowStats.running}
                            </div>
                            <div className="text-sm text-gray-600">Em Execução</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {workflowStats.completed}
                            </div>
                            <div className="text-sm text-gray-600">Completos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {workflowStats.paused}
                            </div>
                            <div className="text-sm text-gray-600">Pausados</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {workflowStats.failed}
                            </div>
                            <div className="text-sm text-gray-600">Falhas</div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}