'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  Clock,
  Edit,
  CheckSquare
} from 'lucide-react'
import { TaskSubtasksManager } from '@/components/tasks/task-subtasks-manager'
import { TaskCategoryEmojiDisplay } from '@/components/tasks/task-category-badge'
import { TaskUrgencyIndicator } from '@/components/tasks/task-urgency-indicator'
import { format } from 'date-fns'
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
}

export default function TaskDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTask(data.data)
      } else {
        setError(data.error || 'Erro ao carregar tarefa')
      }
    } catch (err) {
      console.error('Error fetching task:', err)
      setError('Erro ao carregar tarefa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
  }, [taskId])

  const handleSubtasksChange = (subtasks: any[]) => {
    if (task) {
      setTask({ ...task, subtasks })
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente'
      case 'IN_PROGRESS': return 'Em Progresso'
      case 'COMPLETED': return 'Concluída'
      case 'CANCELLED': return 'Cancelada'
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Baixa'
      case 'MEDIUM': return 'Média'
      case 'HIGH': return 'Alta'
      case 'URGENT': return 'Urgente'
      default: return priority
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar tarefa</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchTask} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600">Detalhes da tarefa</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/tasks/${task.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TaskCategoryEmojiDisplay category={task.category as any} />
                <span>{task.title}</span>
                <TaskUrgencyIndicator
                  priority={task.priority as any}
                  status={task.status as any}
                  dueAt={task.dueAt}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <Badge
                    className={
                      task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Prioridade</h4>
                  <Badge
                    className={
                      task.priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <TaskSubtasksManager
            taskId={task.id}
            subtasks={task.subtasks || []}
            onSubtasksChange={handleSubtasksChange}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{task.assignee.name}</p>
                    <p className="text-sm text-gray-500">{task.assignee.email}</p>
                  </div>
                </div>
              )}

              {task.lead && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{task.lead.name}</p>
                    {task.lead.company && (
                      <p className="text-sm text-gray-500">{task.lead.company}</p>
                    )}
                  </div>
                </div>
              )}

              {task.dueAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Vencimento</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(task.dueAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Criada em</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {task.creator && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Criada por</p>
                    <p className="text-sm text-gray-500">{task.creator.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Summary */}
          {task.subtasks && task.subtasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  Progresso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%
                  </div>
                  <p className="text-sm text-gray-500">
                    {task.subtasks.filter(s => s.completed).length} de {task.subtasks.length} concluídas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}