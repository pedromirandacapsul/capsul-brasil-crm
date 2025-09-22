'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getCategoryConfig, TaskCategory } from '@/lib/task-categories'

interface TaskCategoryBadgeProps {
  category: TaskCategory
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
}

export function TaskCategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className
}: TaskCategoryBadgeProps) {
  const config = getCategoryConfig(category)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border-2',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && config.label}
    </Badge>
  )
}

interface TaskCategorySelectProps {
  value: TaskCategory
  onValueChange: (value: TaskCategory) => void
  placeholder?: string
}

export function TaskCategoryEmojiDisplay({ category }: { category: TaskCategory }) {
  const config = getCategoryConfig(category)

  return (
    <span className="text-lg" title={config.label}>
      {config.emoji}
    </span>
  )
}