'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, CheckCircle, Target } from 'lucide-react'

interface Task {
  id: string
  status: string
  priority: string
  category: string
  createdAt: string
  completedAt?: string | null
  assignee?: {
    id: string
    name: string
  }
  dueAt: string | null
}

interface TaskAnalyticsPanelProps {
  tasks: Task[]
  onShowPriorityReport?: () => void
  onApplyFilter?: (filter: { status?: string; priority?: string; overdue?: boolean; category?: string }) => void
}

export function TaskAnalyticsPanel({ tasks, onShowPriorityReport, onApplyFilter }: TaskAnalyticsPanelProps) {
  // Preparar dados para gráficos
  const statusData = [
    { name: 'Pendentes', value: tasks.filter(t => t.status === 'PENDING').length, color: '#fbbf24' },
    { name: 'Em Progresso', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'Concluídas', value: tasks.filter(t => t.status === 'COMPLETED').length, color: '#10b981' },
    { name: 'Canceladas', value: tasks.filter(t => t.status === 'CANCELLED').length, color: '#ef4444' }
  ].filter(item => item.value > 0)

  const priorityData = [
    { name: 'Baixa', value: tasks.filter(t => t.priority === 'LOW').length, color: '#6b7280' },
    { name: 'Média', value: tasks.filter(t => t.priority === 'MEDIUM').length, color: '#fbbf24' },
    { name: 'Alta', value: tasks.filter(t => t.priority === 'HIGH').length, color: '#f97316' },
    { name: 'Urgente', value: tasks.filter(t => t.priority === 'URGENT').length, color: '#dc2626' }
  ].filter(item => item.value > 0)

  // Dados por responsável com breakdown por status
  const assigneeData = tasks.reduce((acc, task) => {
    if (task.assignee) {
      const name = task.assignee.name.split(' ')[0] // Primeiro nome
      if (!acc[name]) {
        acc[name] = {
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          total: 0
        }
      }

      acc[name].total += 1

      switch (task.status) {
        case 'PENDING':
          acc[name].pending += 1
          break
        case 'IN_PROGRESS':
          acc[name].inProgress += 1
          break
        case 'COMPLETED':
          acc[name].completed += 1
          break
        case 'CANCELLED':
          acc[name].cancelled += 1
          break
      }
    }
    return acc
  }, {} as Record<string, { pending: number; inProgress: number; completed: number; cancelled: number; total: number }>)

  const assigneeChartData = Object.entries(assigneeData)
    .map(([name, data]) => ({
      name,
      Pendentes: data.pending,
      'Em Progresso': data.inProgress,
      Concluídas: data.completed,
      Canceladas: data.cancelled,
      total: data.total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6) // Top 6

  // Dados por categoria
  const categoryData = [
    { name: 'Chamadas', value: tasks.filter(t => t.category === 'CALL').length, color: '#3b82f6' },
    { name: 'WhatsApp', value: tasks.filter(t => t.category === 'WHATSAPP').length, color: '#10b981' },
    { name: 'Emails', value: tasks.filter(t => t.category === 'EMAIL').length, color: '#8b5cf6' },
    { name: 'Reuniões', value: tasks.filter(t => t.category === 'MEETING').length, color: '#f97316' },
    { name: 'Documentos', value: tasks.filter(t => t.category === 'DOCUMENT').length, color: '#6366f1' },
    { name: 'Geral', value: tasks.filter(t => t.category === 'GENERAL').length, color: '#6b7280' }
  ].filter(item => item.value > 0)

  // Estatísticas rápidas
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => {
      if (!t.dueAt || t.status === 'COMPLETED') return false
      return new Date(t.dueAt) < new Date()
    }).length
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : '0'

  // Métricas avançadas
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')

  // SLA médio (tempo entre criação e conclusão)
  const avgSLA = completedTasks.length > 0 ?
    completedTasks.reduce((acc, task) => {
      if (task.completedAt) {
        const created = new Date(task.createdAt)
        const completed = new Date(task.completedAt)
        const diffDays = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        return acc + diffDays
      }
      return acc
    }, 0) / completedTasks.length : 0

  // Tarefas concluídas no prazo
  const completedOnTime = completedTasks.filter(task => {
    if (!task.dueAt || !task.completedAt) return true // Se não tem prazo, considera no prazo
    return new Date(task.completedAt) <= new Date(task.dueAt)
  }).length

  const onTimeRate = completedTasks.length > 0 ?
    (completedOnTime / completedTasks.length * 100).toFixed(1) : '0'

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
    >
      {/* Status Distribution */}
      <motion.div variants={itemVariants}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Tarefas']}
                    labelStyle={{ color: '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tasks by Assignee */}
      <motion.div variants={itemVariants}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Tarefas por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="Pendentes" stackId="status" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Em Progresso" stackId="status" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Concluídas" stackId="status" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Canceladas" stackId="status" fill="#ef4444" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Métricas Principais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Total de Tarefas - Remove todos os filtros */}
              <button
                onClick={() => onApplyFilter?.({})}
                className="text-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para ver todas as tarefas"
              >
                <div className="text-2xl font-bold text-blue-600 group-hover:text-blue-700">{stats.total}</div>
                <div className="text-sm text-blue-600 group-hover:text-blue-700">Total</div>
              </button>

              {/* Concluídas - Filtra por status COMPLETED */}
              <button
                onClick={() => onApplyFilter?.({ status: 'COMPLETED' })}
                className="text-center p-3 bg-green-50 rounded-lg hover:bg-green-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para ver tarefas concluídas"
              >
                <div className="text-2xl font-bold text-green-600 group-hover:text-green-700">{completionRate}%</div>
                <div className="text-sm text-green-600 group-hover:text-green-700">Concluídas</div>
              </button>

              {/* SLA Médio - Mostra relatório de prioridade */}
              <button
                onClick={onShowPriorityReport}
                className="text-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para ver relatório detalhado"
              >
                <div className="text-2xl font-bold text-indigo-600 group-hover:text-indigo-700">{avgSLA.toFixed(1)}</div>
                <div className="text-xs text-indigo-600 group-hover:text-indigo-700">SLA médio (dias)</div>
              </button>

              {/* No Prazo - Mostra relatório de prioridade */}
              <button
                onClick={onShowPriorityReport}
                className="text-center p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para análise de pontualidade"
              >
                <div className="text-2xl font-bold text-emerald-600 group-hover:text-emerald-700">{onTimeRate}%</div>
                <div className="text-xs text-emerald-600 group-hover:text-emerald-700">No prazo</div>
              </button>

              {/* Pendentes - Filtra por status PENDING */}
              <button
                onClick={() => onApplyFilter?.({ status: 'PENDING' })}
                className="text-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para ver tarefas pendentes"
              >
                <div className="text-xl font-bold text-yellow-600 group-hover:text-yellow-700">{stats.pending}</div>
                <div className="text-xs text-yellow-600 group-hover:text-yellow-700">Pendentes</div>
              </button>

              {/* Atrasadas - Filtra por tarefas atrasadas */}
              <button
                onClick={() => onApplyFilter?.({ overdue: true })}
                className="text-center p-3 bg-red-50 rounded-lg hover:bg-red-100 hover:scale-105 transition-all duration-200 cursor-pointer group"
                title="Clique para ver tarefas atrasadas"
              >
                <div className="text-xl font-bold text-red-600 group-hover:text-red-700">{stats.overdue}</div>
                <div className="text-xs text-red-600 group-hover:text-red-700">Atrasadas</div>
              </button>
            </div>

            {/* Category breakdown - Clicáveis */}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Por Categoria:</h4>
              <div className="space-y-1">
                {categoryData.slice(0, 4).map((item, index) => {
                  const categoryMap = {
                    'Chamadas': 'CALL',
                    'WhatsApp': 'WHATSAPP',
                    'Emails': 'EMAIL',
                    'Reuniões': 'MEETING',
                    'Documentos': 'DOCUMENT',
                    'Geral': 'GENERAL'
                  }
                  const categoryKey = categoryMap[item.name as keyof typeof categoryMap]

                  return (
                    <button
                      key={index}
                      onClick={() => onApplyFilter?.({ category: categoryKey })}
                      className="w-full flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50 transition-colors duration-150 group"
                      title={`Clique para filtrar por ${item.name.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600 group-hover:text-gray-800">{item.name}</span>
                      </div>
                      <span className="font-medium group-hover:text-gray-800">{item.value}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority Report Button */}
            {onShowPriorityReport && (
              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowPriorityReport}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Ver Relatório de Prioridade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}