'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Filter,
  Search,
  X,
  Calendar as CalendarIcon,
  Users,
  Tag,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getAllCategories, TaskCategory } from '@/lib/task-categories'

export interface TaskFilters {
  search: string
  status: string
  priority: string
  category: string
  assigneeId: string
  dueDateFilter: 'all' | 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'custom'
  customDateFrom?: Date
  customDateTo?: Date
}

interface User {
  id: string
  name: string
  email: string
}

interface TaskAdvancedFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  users: User[]
  className?: string
}

export function TaskAdvancedFilters({
  filters,
  onFiltersChange,
  users,
  className
}: TaskAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  const categories = getAllCategories()

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      assigneeId: 'ALL',
      dueDateFilter: 'all'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status && filters.status !== 'ALL') count++
    if (filters.priority && filters.priority !== 'ALL') count++
    if (filters.category && filters.category !== 'ALL') count++
    if (filters.assigneeId && filters.assigneeId !== 'ALL') count++
    if (filters.dueDateFilter && filters.dueDateFilter !== 'all') count++
    return count
  }

  const getFilterLabels = () => {
    const labels = []
    if (filters.search) labels.push(`Busca: "${filters.search}"`)
    if (filters.status && filters.status !== 'ALL') {
      const statusLabels = {
        PENDING: 'Pendente',
        IN_PROGRESS: 'Em Progresso',
        COMPLETED: 'Concluída',
        CANCELLED: 'Cancelada'
      }
      labels.push(`Status: ${statusLabels[filters.status as keyof typeof statusLabels]}`)
    }
    if (filters.priority && filters.priority !== 'ALL') {
      const priorityLabels = {
        LOW: 'Baixa',
        MEDIUM: 'Média',
        HIGH: 'Alta',
        URGENT: 'Urgente'
      }
      labels.push(`Prioridade: ${priorityLabels[filters.priority as keyof typeof priorityLabels]}`)
    }
    if (filters.category && filters.category !== 'ALL') {
      const categoryConfig = categories.find(c => c.value === filters.category)
      if (categoryConfig) {
        labels.push(`Categoria: ${categoryConfig.config.label}`)
      }
    }
    if (filters.assigneeId && filters.assigneeId !== 'ALL') {
      const user = users.find(u => u.id === filters.assigneeId)
      if (user) {
        labels.push(`Responsável: ${user.name}`)
      }
    }
    if (filters.dueDateFilter && filters.dueDateFilter !== 'all') {
      const dueDateLabels = {
        today: 'Hoje',
        tomorrow: 'Amanhã',
        this_week: 'Esta Semana',
        overdue: 'Atrasadas',
        custom: 'Data Personalizada'
      }
      labels.push(`Vencimento: ${dueDateLabels[filters.dueDateFilter]}`)
    }
    return labels
  }

  const activeCount = getActiveFiltersCount()
  const filterLabels = getFilterLabels()

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Buscar tarefas por título, descrição ou lead..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters & Advanced Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.dueDateFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('dueDateFilter', filters.dueDateFilter === 'today' ? 'all' : 'today')}
            className="text-xs"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Hoje
          </Button>
          <Button
            variant={filters.dueDateFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('dueDateFilter', filters.dueDateFilter === 'overdue' ? 'all' : 'overdue')}
            className="text-xs"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasadas
          </Button>
          <Button
            variant={filters.priority === 'URGENT' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('priority', filters.priority === 'URGENT' ? 'ALL' : 'URGENT')}
            className="text-xs"
          >
            Urgentes
          </Button>
        </div>

        {/* Advanced Filters Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
              {activeCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Avançados</h4>
                {activeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os status</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                    <SelectItem value="COMPLETED">Concluída</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as prioridades</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as categorias</SelectItem>
                    {categories.map(({ value, config }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span>{config.emoji}</span>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={filters.assigneeId} onValueChange={(value) => updateFilter('assigneeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os responsáveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os responsáveis</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Filter */}
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Select value={filters.dueDateFilter} onValueChange={(value) => updateFilter('dueDateFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as datas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as datas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="tomorrow">Amanhã</SelectItem>
                    <SelectItem value="this_week">Esta Semana</SelectItem>
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {filters.dueDateFilter === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>De</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.customDateFrom ? format(filters.customDateFrom, 'dd/MM', { locale: ptBR }) : 'Data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateFrom}
                          onSelect={(date) => {
                            updateFilter('customDateFrom', date)
                            setDateFromOpen(false)
                          }}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Até</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filters.customDateTo ? format(filters.customDateTo, 'dd/MM', { locale: ptBR }) : 'Data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateTo}
                          onSelect={(date) => {
                            updateFilter('customDateTo', date)
                            setDateToOpen(false)
                          }}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {filterLabels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filterLabels.map((label, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {label}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}