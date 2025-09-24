/**
 * Hook simples para toasts/notificações
 */

import { useCallback } from 'react'

export interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    // Por enquanto apenas log no console
    // Em uma implementação real, você integraria com uma biblioteca de toast
    if (variant === 'destructive') {
      console.error(`❌ ${title}`, description)
    } else {
      console.log(`✅ ${title}`, description)
    }
  }, [])

  return { toast }
}