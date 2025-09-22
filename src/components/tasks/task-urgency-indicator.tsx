'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface TaskUrgencyIndicatorProps {
  priority: TaskPriority
  status: TaskStatus
  dueAt: string | null
  className?: string
}

export function TaskUrgencyIndicator({
  priority,
  status,
  dueAt,
  className
}: TaskUrgencyIndicatorProps) {
  const now = new Date()
  const dueDate = dueAt ? new Date(dueAt) : null

  // Calculate urgency
  const isOverdue = dueDate && dueDate < now && status !== 'COMPLETED'
  const isDueToday = dueDate &&
    dueDate.toDateString() === now.toDateString() &&
    status !== 'COMPLETED'
  const isDueTomorrow = dueDate &&
    new Date(dueDate.getTime() - 24 * 60 * 60 * 1000).toDateString() === now.toDateString() &&
    status !== 'COMPLETED'

  // Get visual config based on urgency
  const getUrgencyConfig = () => {
    if (status === 'COMPLETED') {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Concluída',
        animate: false
      }
    }

    if (status === 'CANCELLED') {
      return {
        icon: XCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: 'Cancelada',
        animate: false
      }
    }

    if (isOverdue && priority === 'URGENT') {
      return {
        icon: AlertTriangle,
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-400',
        label: 'CRÍTICO - Atrasada',
        animate: true,
        urgency: 'critical',
        pulse: true
      }
    }

    if (isOverdue) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        label: 'Atrasada',
        animate: true,
        urgency: 'high'
      }
    }

    if (isDueToday && priority === 'URGENT') {
      return {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        label: 'Urgente - Hoje',
        animate: true,
        urgency: 'high'
      }
    }

    if (isDueToday) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        label: 'Vence Hoje',
        animate: true,
        urgency: 'medium'
      }
    }

    if (isDueTomorrow && priority === 'URGENT') {
      return {
        icon: Clock,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Urgente - Amanhã',
        animate: false
      }
    }

    if (priority === 'URGENT') {
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Urgente',
        animate: false
      }
    }

    return null
  }

  const config = getUrgencyConfig()

  if (!config) return null

  const Icon = config.icon

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8]
  }

  const criticalPulseAnimation = {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    boxShadow: [
      '0 0 0 0 rgba(239, 68, 68, 0.7)',
      '0 0 0 10px rgba(239, 68, 68, 0)',
      '0 0 0 0 rgba(239, 68, 68, 0)'
    ]
  }

  return (
    <motion.div
      animate={config.animate ? (config.pulse ? criticalPulseAnimation : pulseAnimation) : {}}
      transition={config.animate ? {
        duration: config.pulse ? 1.5 : 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
      className={cn("inline-flex", className)}
    >
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1.5 font-medium border-2',
          config.color,
          config.bgColor,
          config.borderColor,
          config.urgency === 'critical' && 'shadow-lg shadow-red-200',
          config.urgency === 'high' && 'shadow-md shadow-orange-200'
        )}
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs font-semibold">{config.label}</span>
      </Badge>
    </motion.div>
  )
}

export function TaskRowUrgencyHighlight({
  priority,
  status,
  dueAt,
  children,
  className
}: TaskUrgencyIndicatorProps & { children: React.ReactNode }) {
  const now = new Date()
  const dueDate = dueAt ? new Date(dueAt) : null

  const isOverdue = dueDate && dueDate < now && status !== 'COMPLETED'
  const isDueToday = dueDate &&
    dueDate.toDateString() === now.toDateString() &&
    status !== 'COMPLETED'

  const getRowHighlight = () => {
    if (isOverdue && priority === 'URGENT') {
      return 'bg-red-25 border-l-4 border-red-500 shadow-sm'
    }
    if (isOverdue) {
      return 'bg-red-15 border-l-4 border-red-400'
    }
    if (isDueToday && priority === 'URGENT') {
      return 'bg-orange-25 border-l-4 border-orange-500'
    }
    if (isDueToday) {
      return 'bg-yellow-25 border-l-2 border-yellow-400'
    }
    return ''
  }

  return (
    <div className={cn(getRowHighlight(), className)}>
      {children}
    </div>
  )
}