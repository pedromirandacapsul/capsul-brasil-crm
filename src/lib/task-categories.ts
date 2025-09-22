import {
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  FileText,
  Briefcase,
  LucideIcon
} from 'lucide-react'

export type TaskCategory = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'DOCUMENT' | 'GENERAL'

export interface TaskCategoryConfig {
  label: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  emoji: string
}

export const TASK_CATEGORIES: Record<TaskCategory, TaskCategoryConfig> = {
  CALL: {
    label: 'Chamada',
    icon: Phone,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    emoji: '📞'
  },
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    emoji: '💬'
  },
  EMAIL: {
    label: 'Email',
    icon: Mail,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    emoji: '✉️'
  },
  MEETING: {
    label: 'Reunião',
    icon: Calendar,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    emoji: '📅'
  },
  DOCUMENT: {
    label: 'Documento',
    icon: FileText,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    emoji: '📄'
  },
  GENERAL: {
    label: 'Geral',
    icon: Briefcase,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    emoji: '💼'
  }
}

export const getCategoryConfig = (category: TaskCategory): TaskCategoryConfig => {
  return TASK_CATEGORIES[category] || TASK_CATEGORIES.GENERAL
}

export const getAllCategories = (): { value: TaskCategory; config: TaskCategoryConfig }[] => {
  return Object.entries(TASK_CATEGORIES).map(([value, config]) => ({
    value: value as TaskCategory,
    config
  }))
}