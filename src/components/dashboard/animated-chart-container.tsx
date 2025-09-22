'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedChartContainerProps {
  children: ReactNode
  title: string
  className?: string
}

export function AnimatedChartContainer({ children, title, className }: AnimatedChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}
    >
      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        {title}
      </motion.h3>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}