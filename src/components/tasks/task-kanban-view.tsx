'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MoreHorizontal,
  Clock,
  User,
  ExternalLink,
  Eye,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskCategoryEmojiDisplay } from './task-category-badge'
import { TaskUrgencyIndicator } from './task-urgency-indicator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string
  dueAt: string | null
  createdAt: string
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
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
}

interface TaskKanbanViewProps {
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: string) => void
  onTaskClick: (task: Task) => void
  onTaskEdit: (task: Task) => void
  onLeadClick: (leadId: string) => void
}

const COLUMNS = [
  {
    id: 'PENDING',
    title: 'Pendentes',
    color: 'border-yellow-200 bg-yellow-50',
    headerColor: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'IN_PROGRESS',
    title: 'Em Progresso',
    color: 'border-blue-200 bg-blue-50',
    headerColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'COMPLETED',
    title: 'Concluídas',
    color: 'border-green-200 bg-green-50',
    headerColor: 'bg-green-100 text-green-800'
  },
  {
    id: 'CANCELLED',
    title: 'Canceladas',
    color: 'border-red-200 bg-red-50',
    headerColor: 'bg-red-100 text-red-800'
  }
]

export function TaskKanbanView({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskEdit,
  onLeadClick
}: TaskKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const handleDragStart = (result: any) => {
    setDraggedTask(result.draggableId)
  }

  const handleDragEnd = (result: DropResult) => {
    setDraggedTask(null)

    if (!result.destination) return

    const taskId = result.draggableId
    const newStatus = result.destination.droppableId

    onTaskMove(taskId, newStatus)
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return null
    const date = new Date(dueAt)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d atraso`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Hoje', color: 'text-orange-600' }
    if (diffDays === 1) return { text: 'Amanhã', color: 'text-yellow-600' }
    return { text: format(date, 'dd/MM', { locale: ptBR }), color: 'text-gray-600' }
  }

  const getSubtaskProgress = (task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) return null
    const completed = task.subtasks.filter(s => s.completed).length
    const total = task.subtasks.length
    const percentage = (completed / total) * 100
    return { completed, total, percentage }
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id)

          return (
            <div key={column.id} className="flex flex-col h-full">
              <div className={cn(
                'rounded-t-lg p-4 border-b-2',
                column.headerColor
              )}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.title}</h3>
                  <Badge variant="secondary" className="bg-white/80">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 p-4 space-y-3 min-h-[400px] border-2 border-t-0 rounded-b-lg transition-colors',
                      column.color,
                      snapshot.isDraggingOver && 'bg-opacity-80 border-opacity-60'
                    )}
                  >
                    <AnimatePresence>
                      {columnTasks.map((task, index) => {
                        const dueDate = formatDueDate(task.dueAt)
                        const subtaskProgress = getSubtaskProgress(task)
                        const isDragging = draggedTask === task.id

                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={task.status === 'COMPLETED'}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  scale: snapshot.isDragging ? 1.02 : 1,
                                  rotate: snapshot.isDragging ? 2 : 0
                                }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  'transform transition-transform',
                                  snapshot.isDragging && 'shadow-2xl z-50'
                                )}
                              >
                                <Card className={cn(
                                  'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
                                  task.status === 'COMPLETED' && 'opacity-80',
                                  snapshot.isDragging && 'shadow-2xl ring-2 ring-blue-400'
                                )}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Header com categoria e urgência */}
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <TaskCategoryEmojiDisplay category={task.category as any} />
                                          <TaskUrgencyIndicator
                                            priority={task.priority as any}
                                            status={task.status as any}
                                            dueAt={task.dueAt}
                                          />
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onTaskClick(task)}>
                                              <Eye className="h-4 w-4 mr-2" />
                                              Ver detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                                              <Edit className="h-4 w-4 mr-2" />
                                              Editar
                                            </DropdownMenuItem>
                                            {task.lead && (
                                              <DropdownMenuItem onClick={() => onLeadClick(task.lead!.id)}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Ver Lead
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      {/* Título e descrição */}
                                      <div>
                                        <h4 className="font-medium text-gray-900 leading-tight">
                                          {task.title}
                                        </h4>
                                        {task.description && (
                                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {task.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Progresso de subtarefas */}
                                      {subtaskProgress && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Subtarefas</span>
                                            <span className="text-xs text-gray-500">
                                              {subtaskProgress.completed}/{subtaskProgress.total}
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                                              style={{ width: `${subtaskProgress.percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Lead */}
                                      {task.lead && (
                                        <div className="text-sm">
                                          <p className="font-medium text-gray-700">{task.lead.name}</p>
                                          {task.lead.company && (
                                            <p className="text-gray-500 text-xs">{task.lead.company}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Footer com responsável, prioridade e data */}
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3 text-gray-400" />
                                          <span className="text-gray-600">
                                            {task.assignee ? task.assignee.name.split(' ')[0] : 'Sem responsável'}
                                          </span>
                                        </div>
                                        {dueDate && (
                                          <div className={cn('flex items-center gap-1', dueDate.color)}>
                                            <Clock className="h-3 w-3" />
                                            <span>{dueDate.text}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Prioridade */}
                                      <Badge
                                        size="sm"
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
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}
                          </Draggable>
                        )
                      })}
                    </AnimatePresence>
                    {provided.placeholder}

                    {/* Empty state */}
                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        Nenhuma tarefa
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}