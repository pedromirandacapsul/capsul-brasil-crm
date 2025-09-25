'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays, Mail, User, Play, AlertCircle, CheckCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react'

interface WorkflowExecution {
  id: string
  leadId: string
  workflowId: string
  stepOrder: number
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | 'RUNNING'
  scheduledAt: string
  executedAt?: string
  error?: string
  logs?: string
  nextAction?: {
    scheduledFor: string
    hoursRemaining: number
    description: string
  }
  lead: {
    name: string
    email: string
    company?: string
  }
  workflow: {
    name: string
  }
  step?: {
    template: {
      name: string
      subject: string
    }
  }
}

export default function WorkflowExecutionsPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    pending: 0,
    sent: 0,
    failed: 0,
    total: 0
  })

  useEffect(() => {
    fetchExecutions()
  }, [])

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/email-marketing/workflows/executions')
      const data = await response.json()

      if (data.success) {
        setExecutions(data.executions)

        // Calcular estatísticas
        const stats = data.executions.reduce((acc: any, execution: WorkflowExecution) => {
          acc.total++
          acc[execution.status.toLowerCase()]++
          return acc
        }, { pending: 0, sent: 0, failed: 0, skipped: 0, total: 0 })

        setStats(stats)
      }
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <CalendarDays className="h-4 w-4" />
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CalendarDays className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'SENT':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'SKIPPED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleRowExpansion = (executionId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId)
    } else {
      newExpanded.add(executionId)
    }
    setExpandedRows(newExpanded)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      console.warn('Data inválida:', date)
      return 'Data inválida'
    }

    return parsedDate.toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Execuções de Workflows</h1>
            <p className="text-muted-foreground">
              Acompanhe o status das execuções de workflows
            </p>
          </div>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Execuções de Workflows</h1>
          <p className="text-muted-foreground">
            Acompanhe o status das execuções de workflows de email
          </p>
        </div>
        <Button onClick={fetchExecutions} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <CalendarDays className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhuma execução encontrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                As execuções de workflows aparecerão aqui quando forem agendadas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Agendado</TableHead>
                  <TableHead>Executado</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <>
                    <TableRow
                      key={execution.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRowExpansion(execution.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRowExpansion(execution.id)
                          }}
                        >
                          {expandedRows.has(execution.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(execution.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(execution.status)}
                            {execution.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{execution.lead.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {execution.lead.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {execution.workflow.name}
                      </TableCell>
                      <TableCell>
                        {execution.step?.template ? (
                          <div>
                            <div className="font-medium">{execution.step.template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {execution.step.template.subject}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{execution.stepOrder}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(execution.scheduledAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {execution.executedAt ? formatDate(execution.executedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {execution.error ? (
                          <div className="text-red-600 max-w-xs truncate" title={execution.error}>
                            {execution.error}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Linha expansível com detalhes */}
                    {expandedRows.has(execution.id) && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/20 p-0">
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Informações adicionais */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Detalhes do Lead
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Nome:</strong> {execution.lead.name}</div>
                                  <div><strong>Email:</strong> {execution.lead.email}</div>
                                  {execution.lead.company && (
                                    <div><strong>Empresa:</strong> {execution.lead.company}</div>
                                  )}
                                  <div><strong>ID:</strong> {execution.leadId}</div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Informações da Execução
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>ID da Execução:</strong> {execution.id}</div>
                                  <div><strong>Workflow ID:</strong> {execution.workflowId}</div>
                                  <div><strong>Step Atual:</strong> {execution.stepOrder}</div>
                                  <div><strong>Status:</strong> <Badge className={getStatusColor(execution.status)}>{execution.status}</Badge></div>
                                  {execution.nextAction && (
                                    <div className="pt-2 border-t">
                                      <strong>Próxima Ação:</strong>
                                      <div className="text-blue-600 font-medium">{execution.nextAction.description}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Agendado para: {formatDate(execution.nextAction.scheduledFor)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Seção de Logs */}
                            {execution.logs && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Logs de Execução
                                </h4>
                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-60">
                                  {(() => {
                                    try {
                                      const logs = JSON.parse(execution.logs)
                                      return (
                                        <div className="space-y-2">
                                          {logs.map((log: any, index: number) => (
                                            <div key={index} className="border-l-2 border-blue-500 pl-3">
                                              <div className="flex items-center gap-2 text-blue-300">
                                                <span className="text-white">[{new Date(log.timestamp).toLocaleString('pt-BR')}]</span>
                                                <span className="font-semibold">{log.action}</span>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                  log.status === 'SUCCESS' ? 'bg-green-800 text-green-200' :
                                                  log.status === 'FAILED' ? 'bg-red-800 text-red-200' :
                                                  'bg-yellow-800 text-yellow-200'
                                                }`}>
                                                  {log.status}
                                                </span>
                                              </div>
                                              {log.template && <div className="text-gray-300">Template: {log.template}</div>}
                                              {log.recipient && <div className="text-gray-300">Para: {log.recipient}</div>}
                                              {log.error && <div className="text-red-300">Erro: {log.error}</div>}
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    } catch {
                                      return <pre>{execution.logs}</pre>
                                    }
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Seção de Erro Detalhado */}
                            {execution.error && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                                  <AlertCircle className="h-4 w-4" />
                                  Erro Detalhado
                                </h4>
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                  <pre className="text-sm text-red-800 whitespace-pre-wrap">{execution.error}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}