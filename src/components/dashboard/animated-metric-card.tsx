'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedMetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray'
  onClick?: () => void
  isActive?: boolean
  className?: string
}

const colorVariants = {
  blue: {
    bg: 'from-blue-50 to-blue-100/50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-900',
    accent: 'text-blue-600'
  },
  green: {
    bg: 'from-green-50 to-green-100/50',
    border: 'border-green-200',
    icon: 'text-green-600',
    text: 'text-green-900',
    accent: 'text-green-600'
  },
  purple: {
    bg: 'from-purple-50 to-purple-100/50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-900',
    accent: 'text-purple-600'
  },
  red: {
    bg: 'from-red-50 to-red-100/50',
    border: 'border-red-200',
    icon: 'text-red-600',
    text: 'text-red-900',
    accent: 'text-red-600'
  },
  orange: {
    bg: 'from-orange-50 to-orange-100/50',
    border: 'border-orange-200',
    icon: 'text-orange-600',
    text: 'text-orange-900',
    accent: 'text-orange-600'
  },
  gray: {
    bg: 'from-gray-50 to-gray-100/50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    text: 'text-gray-900',
    accent: 'text-gray-600'
  }
}

export function AnimatedMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  isActive = false,
  className
}: AnimatedMetricCardProps) {
  const variant = colorVariants[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-200 cursor-pointer",
        variant.bg,
        variant.border,
        isActive && "ring-2 ring-offset-2",
        isActive && `ring-${color}-400`,
        onClick && "hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", variant.text)}>
              {title}
            </p>
            <motion.p
              className={cn("text-3xl font-bold", variant.text)}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {value}
            </motion.p>
          </div>

          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={cn(
              "rounded-full p-3 bg-white/50 backdrop-blur-sm",
              variant.icon
            )}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center space-x-1"
          >
            <motion.span
              className={cn(
                "text-sm font-medium",
                trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-gray-600"
              )}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                delay: 0.5,
                duration: 0.5,
                repeat: 1
              }}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </motion.span>
            <span className={cn("text-sm", variant.text)}>
              {trend.label}
            </span>
          </motion.div>
        )}

        {/* Active indicator */}
        {isActive && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className={cn("absolute bottom-0 left-0 h-1 rounded-full", `bg-${color}-400`)}
          />
        )}

        {/* Sparkle effect on hover */}
        <motion.div
          className="absolute top-2 right-2 pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          whileHover={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 0.6 }}
        >
          <div className={cn("w-2 h-2 rounded-full", `bg-${color}-400`)} />
        </motion.div>
      </div>
    </motion.div>
  )
}