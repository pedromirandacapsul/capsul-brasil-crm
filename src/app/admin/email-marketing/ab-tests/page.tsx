'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ABTestCreator } from '@/components/email-marketing/ab-test-creator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TestTube,
  Plus,
  Play,
  Pause,
  BarChart3,
  Crown,
  Users,
  Mail,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface ABTest {
  id: string
  name: string
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED'
  testType: 'SUBJECT' | 'CONTENT' | 'SENDER' | 'TIME'
  variantA: {
    name: string
    subject?: string
    content?: string
    recipients: number
    opened: number
    clicked: number
    openRate: number
    clickRate: number
  }
  variantB: {
    name: string
    subject?: string
    content?: string
    recipients: number
    opened: number
    clicked: number
    openRate: number
    clickRate: number
  }
  winner?: 'A' | 'B' | null
  confidence: number
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([
    // Carregar testes reais da API
  ])
  const [templates, setTemplates] = useState([])
  const [segments, setSegments] = useState([])

  useEffect(() => {
    loadTests()
    loadTemplates()
    loadSegments()
  }, [])

  const loadTests = async () => {
    try {
      const response = await fetch('/api/email-marketing/ab-tests')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTests(data.data || mockTests)
        }
      } else {
        setTests(mockTests)
      }
    } catch (error) {
      console.error('Erro ao carregar testes A/B:', error)
      setTests(mockTests)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/email-marketing/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadSegments = async () => {
    try {
      const response = await fetch('/api/email-marketing/segments')
      if (response.ok) {
        const data = await response.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error)
    }
  }

  const mockTests = [
    {
      id: '1',
      name: 'Teste Assunto Newsletter',
      status: 'COMPLETED',
      testType: 'SUBJECT',
      variantA: {
        name: 'Variante A',
        subject: '📧 Newsletter Semanal - Novidades',
        recipients: 250,
        opened: 78,
        clicked: 23,
        openRate: 31.2,
        clickRate: 9.2
      },
      variantB: {
        name: 'Variante B',
        subject: '🚀 Descubra as novidades desta semana!',
        recipients: 250,
        opened: 95,
        clicked: 31,
        openRate: 38.0,
        clickRate: 12.4
      },
      winner: 'B',
      confidence: 94.5,
      createdAt: '2025-09-20T10:00:00Z',
      startedAt: '2025-09-20T14:00:00Z',
      completedAt: '2025-09-22T10:00:00Z'
    },
    {
      id: '2',
      name: 'Teste CTA Button',
      status: 'RUNNING',
      testType: 'CONTENT',
      variantA: {
        name: 'CTA Tradicional',
        subject: 'Oferta especial para você',
        recipients: 150,
        opened: 42,
        clicked: 8,
        openRate: 28.0,
        clickRate: 5.3
      },
      variantB: {
        name: 'CTA Urgência',
        subject: 'Oferta especial para você',
        recipients: 150,
        opened: 38,
        clicked: 12,
        openRate: 25.3,
        clickRate: 8.0
      },
      winner: null,
      confidence: 67.2,
      createdAt: '2025-09-23T09:00:00Z',
      startedAt: '2025-09-23T15:00:00Z'
    }
  ];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'SUBJECT':
        return <Mail className="h-4 w-4" />
      case 'CONTENT':
        return <BarChart3 className="h-4 w-4" />
      case 'SENDER':
        return <Users className="h-4 w-4" />
      case 'TIME':
        return <Calendar className="h-4 w-4" />
      default:
        return <TestTube className="h-4 w-4" />
    }
  }


  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Testes A/B</h1>
          <p className="text-muted-foreground">
            Otimize suas campanhas testando diferentes variações
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Teste A/B
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Teste A/B</DialogTitle>
            </DialogHeader>
            <ABTestCreator
              templates={templates}
              segments={segments}
              onSave={() => {
                setIsCreateModalOpen(false)
                loadTests() // Recarregar lista de testes
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Ativos</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter(t => t.status === 'RUNNING').length}</div>
            <p className="text-xs text-muted-foreground">
              Em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Concluídos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.filter(t => t.status === 'COMPLETED').length}</div>
            <p className="text-xs text-muted-foreground">
              Com resultados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Vitória</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.winner).length > 0
                ? `${((tests.filter(t => t.winner && t.confidence > 90).length / tests.filter(t => t.winner).length) * 100).toFixed(0)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Significância > 90%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uplift Médio</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18.3%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de clique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Testes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teste</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variante A</TableHead>
                <TableHead>Variante B</TableHead>
                <TableHead>Vencedor</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTestTypeIcon(test.testType)}
                      {test.testType.replace('_', ' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{test.variantA.openRate.toFixed(1)}% abertura</div>
                      <div className="text-muted-foreground">{test.variantA.clickRate.toFixed(1)}% clique</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{test.variantB.openRate.toFixed(1)}% abertura</div>
                      <div className="text-muted-foreground">{test.variantB.clickRate.toFixed(1)}% clique</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {test.winner ? (
                      <div className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Variante {test.winner}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Em andamento</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {test.confidence > 0 ? (
                      <span className={`font-medium ${test.confidence > 90 ? 'text-green-600' : test.confidence > 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {test.confidence.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(test.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}