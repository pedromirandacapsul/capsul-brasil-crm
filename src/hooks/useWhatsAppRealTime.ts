'use client'

import { useState, useEffect, useCallback } from 'react'

interface WhatsAppMessage {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT'
  content?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  fromNumber: string
  toNumber: string
  timestamp: Date
  whatsappId?: string
}

interface WhatsAppConversation {
  id: string
  accountId: string
  contactNumber: string
  contactName?: string
  profilePicture?: string
  isGroup: boolean
  lastMessageAt?: Date
  unreadCount: number
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'
  assignedUserId?: string
  messages?: WhatsAppMessage[]
  lastMessage?: WhatsAppMessage
}

interface UseWhatsAppRealTimeProps {
  accountId: string
  onNewMessage?: (message: WhatsAppMessage) => void
  onMessageStatusUpdate?: (messageId: string, status: string) => void
  onConversationUpdate?: (conversation: WhatsAppConversation) => void
}

export function useWhatsAppRealTime({
  accountId,
  onNewMessage,
  onMessageStatusUpdate,
  onConversationUpdate
}: UseWhatsAppRealTimeProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  // Polling para verificar novas mensagens e atualizações
  const pollUpdates = useCallback(async () => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/updates?since=${lastHeartbeat?.toISOString() || ''}`)

      if (response.ok) {
        const data = await response.json()

        // Processar novas mensagens
        if (data.newMessages && data.newMessages.length > 0) {
          data.newMessages.forEach((message: WhatsAppMessage) => {
            onNewMessage?.(message)
          })
        }

        // Processar atualizações de status
        if (data.statusUpdates && data.statusUpdates.length > 0) {
          data.statusUpdates.forEach((update: { messageId: string; status: string }) => {
            onMessageStatusUpdate?.(update.messageId, update.status)
          })
        }

        // Processar atualizações de conversas
        if (data.conversationUpdates && data.conversationUpdates.length > 0) {
          data.conversationUpdates.forEach((conversation: WhatsAppConversation) => {
            onConversationUpdate?.(conversation)
          })
        }

        setLastHeartbeat(new Date())
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error polling updates:', error)
      setIsConnected(false)
    }
  }, [accountId, lastHeartbeat, onNewMessage, onMessageStatusUpdate, onConversationUpdate])

  // Iniciar polling quando o componente for montado
  useEffect(() => {
    if (!accountId) return

    // Primeiro poll imediato
    pollUpdates()

    // Configurar intervalo de polling (a cada 3 segundos)
    const interval = setInterval(pollUpdates, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [accountId, pollUpdates])

  // Função para forçar sincronização
  const forceSync = useCallback(async () => {
    await pollUpdates()
  }, [pollUpdates])

  return {
    isConnected,
    lastHeartbeat,
    forceSync
  }
}