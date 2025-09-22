'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  Send,
  Paperclip,
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  CheckCheck,
  Check,
  Clock,
  User,
  MessageCircle,
  Image as ImageIcon,
  FileText,
  Mic
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface WhatsAppMessage {
  id: string
  direction: 'INBOUND' | 'OUTBOUND'
  messageType: string
  content?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  status: string
  timestamp: string
  fromNumber: string
  toNumber: string
}

interface WhatsAppConversation {
  id: string
  contactNumber: string
  contactName?: string
  status: string
  lastMessageAt?: string
  unreadCount: number
  lead?: {
    id: string
    name: string
    email?: string
  }
}

interface WhatsAppAccount {
  id: string
  phoneNumber: string
  displayName?: string
  status: string
}

export default function WhatsAppMessagesPage() {
  const { data: session } = useSession()
  const params = useParams()
  const accountId = params.id as string

  const [account, setAccount] = useState<WhatsAppAccount | null>(null)
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (accountId) {
      fetchAccount()
      fetchConversations()
    }
  }, [accountId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAccount = async () => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}`)
      if (response.ok) {
        const data = await response.json()
        setAccount(data.account)
      }
    } catch (error) {
      console.error('Error fetching account:', error)
    }
  }

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'TEXT',
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation.id)
        fetchConversations() // Update conversation list
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Check className="h-4 w-4 text-gray-400" />
      case 'DELIVERED':
        return <CheckCheck className="h-4 w-4 text-gray-400" />
      case 'READ':
        return <CheckCheck className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4" />
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />
      case 'AUDIO':
        return <Mic className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.contactNumber.includes(searchTerm) ||
    conversation.lead?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!session) {
    return null
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar with conversations */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/whatsapp">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {account && (
            <div className="flex items-center space-x-3 mb-4">
              <Avatar>
                <AvatarImage src={account.displayName} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{account.displayName || account.phoneNumber}</h2>
                <Badge variant={account.status === 'CONNECTED' ? 'default' : 'secondary'}>
                  {account.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </div>
          )}

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

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation)
                  fetchMessages(conversation.id)
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.contactName?.[0]?.toUpperCase() ||
                         conversation.contactNumber.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conversation.contactName || conversation.contactNumber}
                      </p>
                      {conversation.lead && (
                        <p className="text-xs text-gray-500 truncate">
                          Lead: {conversation.lead.name}
                        </p>
                      )}
                      {conversation.lastMessageAt && (
                        <p className="text-xs text-gray-400">
                          {formatDate(conversation.lastMessageAt)} às{' '}
                          {formatTime(conversation.lastMessageAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="default" className="ml-2">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation.contactName?.[0]?.toUpperCase() ||
                       selectedConversation.contactNumber.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.contactName || selectedConversation.contactNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedConversation.contactNumber}</p>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.direction === 'OUTBOUND'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {message.messageType !== 'TEXT' && (
                      <div className="flex items-center space-x-2 mb-2">
                        {getMessageTypeIcon(message.messageType)}
                        <span className="text-sm font-medium">
                          {message.messageType === 'IMAGE' && 'Imagem'}
                          {message.messageType === 'DOCUMENT' && 'Documento'}
                          {message.messageType === 'AUDIO' && 'Áudio'}
                        </span>
                      </div>
                    )}

                    {message.content && (
                      <p className="text-sm">{message.content}</p>
                    )}

                    {message.caption && (
                      <p className="text-sm mt-1 opacity-90">{message.caption}</p>
                    )}

                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.direction === 'OUTBOUND' && getMessageStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={sending}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa na barra lateral para começar a enviar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}