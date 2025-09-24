'use client'

/**
 * Página de execuções de workflows
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Filter, Clock, User, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WorkflowExecution {
  id: string
  currentStep: number
  status: string
  startedAt: string
  completedAt?: string
  nextStepAt?: string
  workflow: {
    name: string
  }
  lead: {
    name: string
    email: string
    company?: string
  }
}

export default function WorkflowExecutionsPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })
  const { toast } = useToast()

  useEffect(() => {
    loadExecutions()
  }, [statusFilter, pagination.offset])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/email-marketing/workflows/executions?${params}`)
      const data = await response.json()

      if (data.success) {
        setExecutions(data.executions)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        }))
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao carregar execuções',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const controlExecution = async (executionId: string, action: 'pause' | 'resume') => {
    try {
      const response = await fetch('/api/email-marketing/workflows/executions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ executionId, action })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: data.message
        })
        loadExecutions() // Recarregar lista
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao controlar execução',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao controlar execução:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'RUNNING': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'PAUSED': 'bg-orange-100 text-orange-800',
      'FAILED': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'RUNNING': 'Em Execução',
      'COMPLETED': 'Concluído',
      'PAUSED': 'Pausado',
      'FAILED': 'Falha'
    }
    return labels[status as keyof typeof labels] || status
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const nextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando execuções...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/email-marketing/workflows">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Execuções de Workflows</h1>
              <p className="text-gray-600 mt-2">
                Acompanhe o status das automações em andamento
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Status:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="RUNNING">Em Execução</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="PAUSED">Pausado</SelectItem>
                  <SelectItem value="FAILED">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Execuções */}
        {executions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma execução encontrada
              </h3>
              <p className="text-gray-600 text-center">
                {statusFilter === 'all'
                  ? 'Ainda não há execuções de workflows'
                  : `Nenhuma execução com status "${getStatusLabel(statusFilter)}" encontrada`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <Card key={execution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {execution.workflow.name}
                        </h3>
                        <Badge className={getStatusColor(execution.status)}>
                          {getStatusLabel(execution.status)}
                        </Badge>
                        <Badge variant="outline">
                          Step {execution.currentStep}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{execution.lead.name}</div>
                            <div className="text-sm">{execution.lead.email}</div>
                            {execution.lead.company && (
                              <div className="text-sm">{execution.lead.company}</div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Iniciado: {formatDate(execution.startedAt)}</span>
                          </div>

                          {execution.completedAt && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Concluído: {formatDate(execution.completedAt)}</span>
                            </div>
                          )}

                          {execution.nextStepAt && execution.status === 'RUNNING' && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Próximo step: {formatDate(execution.nextStepAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {execution.status === 'RUNNING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlExecution(execution.id, 'pause')}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}

                      {execution.status === 'PAUSED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlExecution(execution.id, 'resume')}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Paginação */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} execuções
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={pagination.offset === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={!pagination.hasMore}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}