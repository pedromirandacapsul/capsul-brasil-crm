'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Target,
  Users,
  Calendar,
  Zap
} from 'lucide-react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  category: string
  dueAt: string | null
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    name: string
  }
}

interface TaskPriorityReportProps {
  tasks: Task[]
  onPriorityFilter: (priority: string) => void
}

export function TaskPriorityReport({ tasks, onPriorityFilter }: TaskPriorityReportProps) {
  // Priority analysis
  const priorityAnalysis = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
    const priorityTasks = tasks.filter(t => t.priority === priority)
    const completed = priorityTasks.filter(t => t.status === 'COMPLETED').length
    const overdue = priorityTasks.filter(t => {
      if (!t.dueAt || t.status === 'COMPLETED') return false
      return new Date(t.dueAt) < new Date()
    }).length
    const inProgress = priorityTasks.filter(t => t.status === 'IN_PROGRESS').length

    return {
      priority,
      total: priorityTasks.length,
      completed,
      overdue,
      inProgress,
      pending: priorityTasks.filter(t => t.status === 'PENDING').length,
      completionRate: priorityTasks.length > 0 ? (completed / priorityTasks.length * 100) : 0,
      overdueRate: priorityTasks.length > 0 ? (overdue / priorityTasks.length * 100) : 0
    }
  })

  // Priority colors
  const priorityColors = {
    URGENT: '#dc2626',
    HIGH: '#f97316',
    MEDIUM: '#fbbf24',
    LOW: '#6b7280'
  }

  // Priority labels
  const priorityLabels = {
    URGENT: 'Urgente',
    HIGH: 'Alta',
    MEDIUM: 'Média',
    LOW: 'Baixa'
  }

  // Trend analysis (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  })

  const trendData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t =>
      format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr
    )

    return {
      date: format(day, 'dd/MM', { locale: ptBR }),
      fullDate: dayStr,
      urgent: dayTasks.filter(t => t.priority === 'URGENT').length,
      high: dayTasks.filter(t => t.priority === 'HIGH').length,
      medium: dayTasks.filter(t => t.priority === 'MEDIUM').length,
      low: dayTasks.filter(t => t.priority === 'LOW').length,
      total: dayTasks.length
    }
  })

  // Response time analysis by priority
  const responseTimeAnalysis = priorityAnalysis.map(p => {
    const priorityTasks = tasks.filter(t => t.priority === p.priority && t.status === 'COMPLETED')
    if (priorityTasks.length === 0) return { ...p, avgResponseTime: 0 }

    const avgTime = priorityTasks.reduce((acc, task) => {
      const created = new Date(task.createdAt)
      const updated = new Date(task.updatedAt)
      const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60)
      return acc + diffHours
    }, 0) / priorityTasks.length

    return { ...p, avgResponseTime: avgTime }
  })

  // Priority distribution for pie chart
  const pieData = priorityAnalysis
    .filter(p => p.total > 0)
    .map(p => ({
      name: priorityLabels[p.priority as keyof typeof priorityLabels],
      value: p.total,
      color: priorityColors[p.priority as keyof typeof priorityColors]
    }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Relatório por Prioridade
          </h2>
          <p className="text-gray-600">Análise detalhada do desempenho por nível de prioridade</p>
        </div>
      </motion.div>

      {/* Priority Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {priorityAnalysis.map((priority) => (
          <Card
            key={priority.priority}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPriorityFilter(priority.priority)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  style={{
                    backgroundColor: priorityColors[priority.priority as keyof typeof priorityColors],
                    color: 'white'
                  }}
                >
                  {priorityLabels[priority.priority as keyof typeof priorityLabels]}
                </Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold">{priority.total}</div>
                  <div className="text-xs text-gray-500">tarefas</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Concluídas</span>
                  <span className="font-medium">{priority.completed} ({priority.completionRate.toFixed(1)}%)</span>
                </div>
                <Progress value={priority.completionRate} className="h-2" />

                {priority.overdue > 0 && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{priority.overdue} atrasadas</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Em progresso: {priority.inProgress}</span>
                  <span>Pendentes: {priority.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Distribuição por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
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
                {pieData.map((item, index) => (
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

        {/* Trend Analysis */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Tendência (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      labelStyle={{ color: '#374151' }}
                      formatter={(value: number, name: string) => [value, priorityLabels[name as keyof typeof priorityLabels] || name]}
                    />
                    <Line type="monotone" dataKey="urgent" stroke="#dc2626" strokeWidth={2} name="URGENT" />
                    <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="HIGH" />
                    <Line type="monotone" dataKey="medium" stroke="#fbbf24" strokeWidth={2} name="MEDIUM" />
                    <Line type="monotone" dataKey="low" stroke="#6b7280" strokeWidth={2} name="LOW" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Response Time Analysis */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Tempo de Resposta por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeAnalysis} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="priority"
                    type="category"
                    width={80}
                    tickFormatter={(value) => priorityLabels[value as keyof typeof priorityLabels]}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}h`, 'Tempo médio']}
                    labelFormatter={(label) => priorityLabels[label as keyof typeof priorityLabels]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar
                    dataKey="avgResponseTime"
                    fill={(entry: any) => priorityColors[entry.priority as keyof typeof priorityColors]}
                    radius={[0, 4, 4, 0]}
                  >
                    {responseTimeAnalysis.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={priorityColors[entry.priority as keyof typeof priorityColors]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Insights */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Insights Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Highest Priority Alert */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Tarefas Urgentes</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {priorityAnalysis.find(p => p.priority === 'URGENT')?.total || 0}
                </div>
                <div className="text-sm text-red-600">
                  {priorityAnalysis.find(p => p.priority === 'URGENT')?.overdue || 0} atrasadas
                </div>
              </div>

              {/* Best Performance */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Melhor Performance</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...priorityAnalysis.map(p => p.completionRate)).toFixed(1)}%
                </div>
                <div className="text-sm text-green-600">
                  Taxa de conclusão
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Tempo Médio</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {(responseTimeAnalysis.reduce((acc, p) => acc + p.avgResponseTime, 0) / responseTimeAnalysis.length).toFixed(1)}h
                </div>
                <div className="text-sm text-blue-600">
                  Resolução geral
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}