'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  MessageCircle,
  Phone,
  Users,
  Activity,
  Settings,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WhatsAppAccount {
  id: string
  name: string
  phone: string
  status: string
  isConnected: boolean
  lastActivity: string | null
  createdAt: string
  _count?: {
    conversations: number
    messages: number
  }
}

interface Conversation {
  id: string
  contactName: string
  contactNumber: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  status: string
}

const statusColors: Record<string, string> = {
  CONNECTED: 'bg-green-100 text-green-800',
  DISCONNECTED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  PENDING: 'Pendente',
  ERROR: 'Erro',
}

export default function WhatsAppPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'accounts' | 'conversations'>('accounts')

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/accounts')

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setAccounts(data.accounts || [])
      } else {
        setError(data.error || 'Erro ao carregar contas WhatsApp')
      }
    } catch (err) {
      console.error('Error fetching WhatsApp accounts:', err)
      setError('Erro ao carregar contas WhatsApp. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/whatsapp/conversations')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConversations(data.conversations || [])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  useEffect(() => {
    fetchAccounts()
    fetchConversations()
  }, [])

  const handleNewAccount = () => {
    router.push('/admin/whatsapp/new')
  }

  const handleConnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/connect`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchAccounts() // Refresh accounts
      }
    } catch (error) {
      console.error('Error connecting account:', error)
    }
  }

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/disconnect`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchAccounts() // Refresh accounts
      }
    } catch (error) {
      console.error('Error disconnecting account:', error)
    }
  }

  const handleViewAccount = (account: WhatsAppAccount) => {
    router.push(`/admin/whatsapp/${account.id}`)
  }

  const handleViewConversation = (conversation: Conversation) => {
    router.push(`/admin/whatsapp/conversations/${conversation.id}`)
  }

  const getStatusIcon = (status: string, isConnected: boolean) => {
    if (isConnected) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === 'ERROR') return <XCircle className="h-4 w-4 text-red-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const connectedAccounts = accounts.filter(acc => acc.isConnected)
  const totalMessages = accounts.reduce((sum, acc) => sum + (acc._count?.messages || 0), 0)
  const totalConversations = accounts.reduce((sum, acc) => sum + (acc._count?.conversations || 0), 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAccounts} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas contas e conversas do WhatsApp</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/admin/whatsapp/templates')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={handleNewAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contas Conectadas</p>
                <p className="text-2xl font-bold text-green-600">{connectedAccounts.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contas</p>
                <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{totalMessages}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                <p className="text-2xl font-bold text-orange-600">{totalConversations}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-2 px-1 font-medium text-sm ${
            activeTab === 'accounts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contas WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`pb-2 px-1 font-medium text-sm ${
            activeTab === 'conversations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Conversas Recentes
        </button>
      </div>

      {/* Content */}
      {activeTab === 'accounts' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Contas WhatsApp</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar contas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta configurada</h3>
                <p className="text-gray-600 mb-4">
                  Conecte uma conta do WhatsApp para começar a receber e enviar mensagens
                </p>
                <Button onClick={handleNewAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar WhatsApp
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagens</TableHead>
                      <TableHead>Conversas</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts
                      .filter(account =>
                        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        account.phone.includes(searchTerm)
                      )
                      .map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(account.status, account.isConnected)}
                              <div>
                                <p className="font-medium text-gray-900">{account.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">{account.phone}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[account.status] || 'bg-gray-100 text-gray-800'}>
                              {statusLabels[account.status] || account.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {account._count?.messages || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {account._count?.conversations || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {account.lastActivity
                                ? new Date(account.lastActivity).toLocaleDateString('pt-BR')
                                : 'Nunca'
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAccount(account)}
                                title="Ver detalhes da conta"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/whatsapp/${account.id}/settings`)}
                                title="Configurações"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              {account.isConnected ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDisconnectAccount(account.id)}
                                  title="Desconectar"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConnectAccount(account.id)}
                                  title="Conectar"
                                >
                                  <QrCode className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'conversations' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Conversas Recentes</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar conversas..."
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa</h3>
                <p className="text-gray-600">
                  As conversas aparecerão aqui quando você conectar uma conta do WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{conversation.contactName}</p>
                        <p className="text-sm text-gray-600">{conversation.contactNumber}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.lastMessageAt).toLocaleDateString('pt-BR')}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-green-100 text-green-800 mt-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}