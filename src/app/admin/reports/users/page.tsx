'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { exportService } from '@/services/export-service'
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Search,
  Download,
  Filter,
  RefreshCw,
  Medal,
  Award,
  Star
} from 'lucide-react'

interface UserPerformance {
  userId: string
  userName: string
  leadsCreated: number
  opportunitiesCreated: number
  dealsWon: number
  dealsLost: number
  totalRevenue: number
  winRate: number
  averageDealSize: number
  conversionRate: number
}

export default function UserReportsPage() {
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('totalRevenue')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadUserPerformance()
  }, [])

  useEffect(() => {
    filterAndSortUsers()
  }, [userPerformance, searchTerm, sortBy])

  const loadUserPerformance = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('type', 'users')
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/analytics/dashboard?${params}`)
      const data = await response.json()

      if (data.success) {
        setUserPerformance(data.data.userPerformance)
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Error loading user performance:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar dados de performance',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortUsers = () => {
    let filtered = userPerformance

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalRevenue':
          return b.totalRevenue - a.totalRevenue
        case 'winRate':
          return b.winRate - a.winRate
        case 'conversionRate':
          return b.conversionRate - a.conversionRate
        case 'dealsWon':
          return b.dealsWon - a.dealsWon
        case 'leadsCreated':
          return b.leadsCreated - a.leadsCreated
        case 'userName':
          return a.userName.localeCompare(b.userName)
        default:
          return b.totalRevenue - a.totalRevenue
      }
    })

    setFilteredUsers(filtered)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadUserPerformance()
    setRefreshing(false)
    toast({
      title: '✅ Atualizado',
      description: 'Dados de performance atualizados com sucesso'
    })
  }

  const applyDateFilter = () => {
    loadUserPerformance()
  }

  const handleExport = async () => {
    try {
      if (filteredUsers.length === 0) {
        toast({
          title: '❌ Erro',
          description: 'Nenhum dado para exportar',
          variant: 'destructive'
        })
        return
      }

      const dateRange = dateFrom && dateTo ? {
        from: new Date(dateFrom),
        to: new Date(dateTo)
      } : undefined

      await exportService.exportUserPerformance(filteredUsers, dateRange)

      toast({
        title: '✅ Exportado',
        description: 'Relatório de performance exportado com sucesso!'
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao exportar relatório',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1: return <Medal className="h-5 w-5 text-gray-400" />
      case 2: return <Award className="h-5 w-5 text-orange-500" />
      default: return <Star className="h-5 w-5 text-gray-300" />
    }
  }

  const getPerformanceColor = (value: number, type: 'revenue' | 'rate') => {
    if (type === 'revenue') {
      if (value >= 100000) return 'text-green-600'
      if (value >= 50000) return 'text-blue-600'
      return 'text-gray-600'
    }

    if (type === 'rate') {
      if (value >= 70) return 'text-green-600'
      if (value >= 50) return 'text-yellow-600'
      return 'text-red-600'
    }

    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Relatório de Performance por Usuário
          </h1>
          <p className="text-gray-600 mt-2">
            Análise detalhada de performance individual dos usuários
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar Usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ordenar Por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalRevenue">Receita Total</SelectItem>
                  <SelectItem value="winRate">Taxa de Ganho</SelectItem>
                  <SelectItem value="conversionRate">Taxa de Conversão</SelectItem>
                  <SelectItem value="dealsWon">Negócios Fechados</SelectItem>
                  <SelectItem value="leadsCreated">Leads Criados</SelectItem>
                  <SelectItem value="userName">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <Button onClick={applyDateFilter} size="sm">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredUsers.length}</div>
                <div className="text-sm text-gray-600">Usuários Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredUsers.reduce((sum, user) => sum + user.totalRevenue, 0))}
                </div>
                <div className="text-sm text-gray-600">Receita Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredUsers.reduce((sum, user) => sum + user.dealsWon, 0)}
                </div>
                <div className="text-sm text-gray-600">Negócios Fechados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    filteredUsers.reduce((sum, user) => sum + user.conversionRate, 0) /
                    Math.max(filteredUsers.length, 1)
                  )}%
                </div>
                <div className="text-sm text-gray-600">Conversão Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Detalhada</CardTitle>
          <CardDescription>
            Ranking de performance com métricas detalhadas por usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index)}
                    <span className="font-bold text-lg">#{index + 1}</span>
                  </div>

                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-600">
                      {user.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <div className="font-medium text-lg">{user.userName}</div>
                    <div className="text-sm text-gray-600">
                      {user.leadsCreated} leads • {user.opportunitiesCreated} oportunidades
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(user.totalRevenue, 'revenue')}`}>
                      {formatCurrency(user.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">Receita</div>
                  </div>

                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(user.winRate, 'rate')}`}>
                      {user.winRate}%
                    </div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>

                  <div>
                    <div className={`text-lg font-bold ${getPerformanceColor(user.conversionRate, 'rate')}`}>
                      {user.conversionRate}%
                    </div>
                    <div className="text-xs text-gray-500">Conversão</div>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-gray-700">
                      {user.dealsWon}/{user.dealsLost}
                    </div>
                    <div className="text-xs text-gray-500">Won/Lost</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {user.totalRevenue >= 100000 && (
                    <Badge variant="default" className="text-xs">
                      Top Performer
                    </Badge>
                  )}
                  {user.winRate >= 80 && (
                    <Badge variant="secondary" className="text-xs">
                      High Win Rate
                    </Badge>
                  )}
                  {user.conversionRate >= 25 && (
                    <Badge variant="outline" className="text-xs">
                      High Conversion
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}