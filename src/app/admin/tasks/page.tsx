'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Download,
  Plus,
  Eye,
  Edit,
  ExternalLink,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Kanban,
  Table as TableIcon,
  User as UserIcon,
} from 'lucide-react'
import { TaskAnalyticsPanel } from '@/components/tasks/task-analytics-panel'
import { TaskAdvancedFilters, TaskFilters } from '@/components/tasks/task-advanced-filters'
import { TaskCategoryBadge, TaskCategoryEmojiDisplay } from '@/components/tasks/task-category-badge'
import { TaskUrgencyIndicator, TaskRowUrgencyHighlight } from '@/components/tasks/task-urgency-indicator'
import { TaskKanbanView } from '@/components/tasks/task-kanban-view'
import { TaskPriorityReport } from '@/components/tasks/task-priority-report'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string
  dueAt: string | null
  createdAt: string
  updatedAt: string
  statusChangedAt: string
  lead?: {
    id: string
    name: string
    company: string | null
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  _count?: {
    subtasks: number
  }
}

interface User {
  id: string
  name: string
  email: string
}

export default function TasksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [showPriorityReport, setShowPriorityReport] = useState(false)

  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    assigneeId: 'ALL',
    dueDateFilter: 'all'
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
      if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority)
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category)
      if (filters.assigneeId && filters.assigneeId !== 'ALL') params.append('assigneeId', filters.assigneeId)
      if (filters.dueDateFilter && filters.dueDateFilter !== 'all') {
        params.append('dueDateFilter', filters.dueDateFilter)
        if (filters.customDateFrom) params.append('customDateFrom', filters.customDateFrom.toISOString())
        if (filters.customDateTo) params.append('customDateTo', filters.customDateTo.toISOString())
      }

      const response = await fetch(`/api/tasks?${params}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTasks(data.data.tasks)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error || 'Erro ao carregar tarefas')
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Erro ao carregar tarefas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data.users)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [currentPage, filters])

  const handleNewTask = () => {
    router.push('/admin/tasks/new')
  }

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update the task in the local state
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, statusChangedAt: new Date().toISOString() }
            : task
        ))
      } else {
        console.error('Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleTaskClick = (task: Task) => {
    router.push(`/admin/tasks/${task.id}`)
  }

  const handleTaskEdit = (task: Task) => {
    router.push(`/admin/tasks/${task.id}/edit`)
  }

  const handleLeadClick = (leadId: string) => {
    router.push(`/admin/leads/${leadId}`)
  }

  const handleShowPriorityReport = () => {
    setShowPriorityReport(true)
  }

  const handlePriorityFilter = (priority: string) => {
    setFilters(prev => ({ ...prev, priority }))
    setShowPriorityReport(false)
  }

  const handleMetricFilter = (filter: { status?: string; priority?: string; overdue?: boolean; category?: string }) => {
    setFilters(prev => {
      const newFilters = { ...prev }

      // Se for limpar todos os filtros (Total clicado)
      if (Object.keys(filter).length === 0) {
        return {
          search: '',
          status: 'ALL',
          priority: 'ALL',
          category: 'ALL',
          assigneeId: 'ALL',
          dueDateFilter: 'all',
          customDateFrom: null,
          customDateTo: null,
        }
      }

      // Aplicar filtros específicos
      if (filter.status !== undefined) {
        newFilters.status = filter.status
      }
      if (filter.priority !== undefined) {
        newFilters.priority = filter.priority
      }
      if (filter.category !== undefined) {
        newFilters.category = filter.category
      }
      if (filter.overdue) {
        newFilters.dueDateFilter = 'overdue'
      }

      return newFilters
    })

    // Fechar relatório de prioridade se estiver aberto
    setShowPriorityReport(false)
  }

  const handleExport = async () => {
    try {
      // Build export URL with current filters
      const params = new URLSearchParams()

      if (filters.search) params.append('search', filters.search)
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status)
      if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority)
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category)
      if (filters.assigneeId && filters.assigneeId !== 'ALL') params.append('assigneeId', filters.assigneeId)
      if (filters.dueDateFilter && filters.dueDateFilter !== 'all') {
        params.append('dueDateFilter', filters.dueDateFilter)
        if (filters.customDateFrom) params.append('customDateFrom', filters.customDateFrom.toISOString())
        if (filters.customDateTo) params.append('customDateTo', filters.customDateTo.toISOString())
      }

      const response = await fetch(`/api/tasks/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `tasks-${new Date().toISOString().split('T')[0]}.csv`

        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting tasks:', error)
    }
  }

  const handleViewTask = (task: Task) => {
    router.push(`/admin/tasks/${task.id}`)
  }

  const handleEditTask = (task: Task) => {
    router.push(`/admin/tasks/${task.id}/edit`)
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/admin/leads/${leadId}`)
  }

  const handleViewKanban = (leadId: string) => {
    router.push(`/admin/leads/kanban?lead=${leadId}`)
  }

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return '-'
    const date = new Date(dueAt)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className="text-red-600 font-medium">
          Atrasado ({Math.abs(diffDays)} dia{Math.abs(diffDays) > 1 ? 's' : ''})
        </span>
      )
    }
    if (diffDays === 0) return <span className="text-orange-600 font-medium">Hoje</span>
    if (diffDays === 1) return <span className="text-yellow-600 font-medium">Amanhã</span>
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  const formatLastUpdate = (updatedAt: string) => {
    return formatDistanceToNow(new Date(updatedAt), {
      addSuffix: true,
      locale: ptBR
    })
  }

  const getSubtaskProgress = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const completed = task.subtasks.filter(s => s.completed).length
    const total = task.subtasks.length
    const percentage = (completed / total) * 100

    return { completed, total, percentage }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchTasks} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-600">Sistema avançado de gerenciamento de tarefas</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="px-3"
            >
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            title="Exportar tarefas com filtros aplicados"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </motion.div>

      {/* Analytics Panel */}
      {!showPriorityReport && (
        <TaskAnalyticsPanel
          tasks={tasks}
          onShowPriorityReport={handleShowPriorityReport}
          onApplyFilter={handleMetricFilter}
        />
      )}

      {/* Priority Report */}
      {showPriorityReport && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setShowPriorityReport(false)}
            >
              ← Voltar aos Analytics
            </Button>
          </div>
          <TaskPriorityReport
            tasks={tasks}
            onPriorityFilter={handlePriorityFilter}
          />
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <TaskAdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              users={users}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tasks View */}
      <motion.div variants={itemVariants}>
        {viewMode === 'kanban' ? (
          <TaskKanbanView
            tasks={tasks}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            onTaskEdit={handleTaskEdit}
            onLeadClick={handleLeadClick}
          />
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Tipo</TableHead>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {tasks.map((task, index) => {
                      const subtaskProgress = getSubtaskProgress(task)

                      return (
                        <motion.tr
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-gray-50"
                        >
                          <TableCell>
                            <TaskRowUrgencyHighlight
                              priority={task.priority as any}
                              status={task.status as any}
                              dueAt={task.dueAt}
                            >
                              <div className="flex items-center gap-2">
                                <TaskCategoryEmojiDisplay category={task.category as any} />
                                <TaskUrgencyIndicator
                                  priority={task.priority as any}
                                  status={task.status as any}
                                  dueAt={task.dueAt}
                                />
                              </div>
                            </TaskRowUrgencyHighlight>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="font-medium text-gray-900 truncate">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-gray-600 truncate">{task.description}</p>
                              )}
                              {subtaskProgress && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                                      style={{ width: `${subtaskProgress.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {subtaskProgress.completed}/{subtaskProgress.total}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.lead ? (
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-sm font-medium">{task.lead.name}</p>
                                  {task.lead.company && (
                                    <p className="text-xs text-gray-500">{task.lead.company}</p>
                                  )}
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewLead(task.lead!.id)}
                                    title="Ver lead"
                                  >
                                    <UserIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewKanban(task.lead!.id)}
                                    title="Ver no Kanban"
                                  >
                                    <Kanban className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.assignee ? (
                              <span className="text-sm">{task.assignee.name}</span>
                            ) : (
                              <span className="text-gray-400">Não atribuída</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {task.status === 'PENDING' ? 'Pendente' :
                               task.status === 'IN_PROGRESS' ? 'Em Progresso' :
                               task.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                task.priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
                                task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {task.priority === 'LOW' ? 'Baixa' :
                               task.priority === 'MEDIUM' ? 'Média' :
                               task.priority === 'HIGH' ? 'Alta' : 'Urgente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDueDate(task.dueAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatLastUpdate(task.updatedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewTask(task)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {task.lead && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewLead(task.lead!.id)}>
                                      <UserIcon className="h-4 w-4 mr-2" />
                                      Ver Lead
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewKanban(task.lead!.id)}>
                                      <Kanban className="h-4 w-4 mr-2" />
                                      Ver no Kanban
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  )
}