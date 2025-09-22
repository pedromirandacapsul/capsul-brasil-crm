'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// ScrollArea removido temporariamente
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Phone,
  Video,
  CheckCheck,
  Check,
  Clock,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

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

interface WhatsAppInboxProps {
  accountId: string
}

export default function WhatsAppInbox({ accountId }: WhatsAppInboxProps) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sistema de tempo real
  const { isConnected, forceSync } = useWhatsAppRealTime({
    accountId,
    onNewMessage: (message) => {
      // Se a mensagem é da conversa selecionada, adicionar à lista
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, message])
      }
      // Atualizar lista de conversas
      loadConversations()
    },
    onMessageStatusUpdate: (messageId, status) => {
      // Atualizar status da mensagem na lista atual
      setMessages(prev =>
        prev.map(msg =>
          msg.whatsappId === messageId || msg.id === messageId
            ? { ...msg, status: status as any }
            : msg
        )
      )
    },
    onConversationUpdate: (conversation) => {
      // Atualizar conversa na lista
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversation.id
            ? { ...conversation, lastMessage: conversation.messages?.[0] }
            : conv
        )
      )
    }
  })

  // Carregar conversas
  useEffect(() => {
    loadConversations()
  }, [accountId])

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // OBRIGATÓRIO: Função para carregar conversas diretamente do WhatsApp Web
  const loadChats = async () => {
    try {
      console.log('🔄 Carregando conversas do WhatsApp Web...')
      setLoading(true)

      const response = await fetch('/api/whatsapp/chats')
      const data = await response.json()

      if (data.chats && data.chats.length > 0) {
        console.log(`✅ ${data.chats.length} conversas carregadas do WhatsApp Web`)

        // Converter formato das conversas do WhatsApp Web para o formato do componente
        const formattedConversations = data.chats.map((chat: any) => ({
          id: chat.id, // ID da conversa no banco
          accountId: data.accountId,
          contactNumber: chat.contactNumber || chat.id, // Número do contato
          contactName: chat.name,
          isGroup: chat.isGroup,
          lastMessageAt: new Date(chat.timestamp),
          unreadCount: chat.unreadCount || 0,
          profilePicture: chat.profilePicUrl,
          status: 'ACTIVE' as const
        }))

        setConversations(formattedConversations)
        console.log('📱 Conversas exibidas no frontend')
      } else {
        console.log('⚠️ Nenhuma conversa encontrada no WhatsApp Web')
        setConversations([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas do WhatsApp Web:', error)

      // Fallback: tentar carregar do banco de dados
      console.log('🔄 Tentando carregar conversas do banco de dados...')
      try {
        const response = await fetch(`/api/whatsapp/accounts/${accountId}/conversations`)
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
          console.log('📊 Conversas carregadas do banco de dados')
        }
      } catch (dbError) {
        console.error('❌ Erro ao carregar do banco também:', dbError)
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar conversas manualmente
  const refreshChats = async () => {
    console.log('🔄 Atualizando conversas manualmente...')
    await loadChats()
  }

  // Manter função original como fallback
  const loadConversations = async () => {
    await loadChats()
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])

        // Marcar como lida
        await fetch(`/api/whatsapp/conversations/${conversationId}/read`, {
          method: 'POST'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: selectedConversation.contactNumber,
          type: 'text',
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        // Recarregar mensagens
        await loadMessages(selectedConversation.id)
        // Recarregar conversas para atualizar última mensagem
        await loadConversations()
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation)
    loadMessages(conversation.id)
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'PENDING':
        return <Clock className="h-3 w-3 text-gray-400" />
      default:
        return null
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contactNumber.includes(searchTerm)
  )

  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    })
  }

  const getContactInitials = (name?: string, number?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
    return number?.substring(0, 2).toUpperCase() || '??'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 mt-1">
                Modo Desenvolvimento
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" title="Modo Desenvolvimento - Mock Service" />
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshChats}
                disabled={loading}
                title="🔄 Atualizar Conversas"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.profilePicture || ''} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {getContactInitials(conversation.contactName, conversation.contactNumber)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contactName || conversation.contactNumber}
                        </span>
                        {conversation.isGroup && (
                          <Badge variant="secondary" className="text-xs">Grupo</Badge>
                        )}
                      </div>
                      {conversation.lastMessageAt && (
                        <p className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'Sem mensagens'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-white text-xs rounded-full px-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.profilePicture || ''} />
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {getContactInitials(selectedConversation.contactName, selectedConversation.contactNumber)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.contactName || selectedConversation.contactNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.isGroup ? 'Grupo' : 'Contato Individual'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.direction === 'OUTBOUND'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.direction === 'OUTBOUND' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.direction === 'OUTBOUND' && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Web</h3>
              <p className="text-gray-600">Selecione uma conversa para começar a mensagem</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}