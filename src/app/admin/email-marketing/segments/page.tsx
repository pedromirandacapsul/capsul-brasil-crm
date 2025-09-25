'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Plus,
  Filter,
  Target,
  TrendingUp,
  Eye,
  Calendar,
  Building,
  MapPin,
  Mail,
  Trash2,
  Edit
} from 'lucide-react'

interface Segment {
  id: string
  name: string
  description: string
  leadCount: number
  criteria: SegmentCriteria[]
  createdAt: string
  lastUpdated: string
  engagement: {
    openRate: number
    clickRate: number
  }
}

interface SegmentCriteria {
  field: string
  operator: string
  value: string
  label: string
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([
    {
      id: '1',
      name: 'Clientes Premium',
      description: 'Leads com alto valor de negócio e boa taxa de engajamento',
      leadCount: 142,
      criteria: [
        { field: 'dealValue', operator: 'gte', value: '10000', label: 'Valor do negócio ≥ R$ 10.000' },
        { field: 'status', operator: 'in', value: 'QUALIFIED,WON', label: 'Status: Qualificado ou Ganho' }
      ],
      createdAt: '2025-09-15T10:00:00Z',
      lastUpdated: '2025-09-24T15:30:00Z',
      engagement: { openRate: 45.2, clickRate: 12.8 }
    },
    {
      id: '2',
      name: 'Leads Inativos',
      description: 'Leads que não abrem emails há mais de 30 dias',
      leadCount: 284,
      criteria: [
        { field: 'lastEmailOpen', operator: 'lt', value: '30', label: 'Última abertura há mais de 30 dias' },
        { field: 'status', operator: 'ne', value: 'LOST', label: 'Status não é Perdido' }
      ],
      createdAt: '2025-09-10T14:00:00Z',
      lastUpdated: '2025-09-24T08:15:00Z',
      engagement: { openRate: 8.3, clickRate: 1.2 }
    },
    {
      id: '3',
      name: 'Empresas de Tecnologia',
      description: 'Leads do setor de tecnologia em São Paulo',
      leadCount: 97,
      criteria: [
        { field: 'company', operator: 'contains', value: 'tech,software,TI', label: 'Empresa contém: tech, software, TI' },
        { field: 'city', operator: 'eq', value: 'São Paulo', label: 'Cidade: São Paulo' }
      ],
      createdAt: '2025-09-18T09:00:00Z',
      lastUpdated: '2025-09-23T16:45:00Z',
      engagement: { openRate: 32.1, clickRate: 8.7 }
    }
  ])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    criteria: [{ field: 'status', operator: 'eq', value: '', label: '' }]
  })

  const fieldOptions = [
    { value: 'status', label: 'Status do Lead', type: 'select' },
    { value: 'dealValue', label: 'Valor do Negócio', type: 'number' },
    { value: 'source', label: 'Fonte', type: 'text' },
    { value: 'company', label: 'Empresa', type: 'text' },
    { value: 'city', label: 'Cidade', type: 'text' },
    { value: 'createdAt', label: 'Data de Criação', type: 'date' },
    { value: 'lastActivityAt', label: 'Última Atividade', type: 'date' },
    { value: 'lastEmailOpen', label: 'Última Abertura de Email', type: 'date' },
    { value: 'tags', label: 'Tags', type: 'text' }
  ]

  const operatorOptions = {
    text: [
      { value: 'eq', label: 'Igual a' },
      { value: 'ne', label: 'Diferente de' },
      { value: 'contains', label: 'Contém' },
      { value: 'startswith', label: 'Começa com' },
      { value: 'endswith', label: 'Termina com' }
    ],
    number: [
      { value: 'eq', label: 'Igual a' },
      { value: 'ne', label: 'Diferente de' },
      { value: 'gt', label: 'Maior que' },
      { value: 'gte', label: 'Maior ou igual' },
      { value: 'lt', label: 'Menor que' },
      { value: 'lte', label: 'Menor ou igual' }
    ],
    date: [
      { value: 'eq', label: 'Igual a' },
      { value: 'gt', label: 'Depois de' },
      { value: 'lt', label: 'Antes de' },
      { value: 'between', label: 'Entre' }
    ],
    select: [
      { value: 'eq', label: 'Igual a' },
      { value: 'ne', label: 'Diferente de' },
      { value: 'in', label: 'Em' }
    ]
  }

  const statusOptions = [
    'NEW', 'NOT_ANSWERED_1', 'NOT_ANSWERED_2', 'CONTACTED',
    'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'
  ]

  const addCriteria = () => {
    setNewSegment({
      ...newSegment,
      criteria: [...newSegment.criteria, { field: 'status', operator: 'eq', value: '', label: '' }]
    })
  }

  const updateCriteria = (index: number, field: keyof SegmentCriteria, value: string) => {
    const updatedCriteria = [...newSegment.criteria]
    updatedCriteria[index] = { ...updatedCriteria[index], [field]: value }

    // Auto-generate label
    if (field === 'field' || field === 'operator' || field === 'value') {
      const criteria = updatedCriteria[index]
      const fieldLabel = fieldOptions.find(f => f.value === criteria.field)?.label || criteria.field
      const operatorLabel = Object.values(operatorOptions)
        .flat()
        .find(o => o.value === criteria.operator)?.label || criteria.operator
      updatedCriteria[index].label = `${fieldLabel} ${operatorLabel} ${criteria.value}`
    }

    setNewSegment({ ...newSegment, criteria: updatedCriteria })
  }

  const removeCriteria = (index: number) => {
    const updatedCriteria = newSegment.criteria.filter((_, i) => i !== index)
    setNewSegment({ ...newSegment, criteria: updatedCriteria })
  }

  const createSegment = async () => {
    const segment: Segment = {
      id: Date.now().toString(),
      name: newSegment.name,
      description: newSegment.description,
      leadCount: Math.floor(Math.random() * 200) + 50, // Mock count
      criteria: newSegment.criteria.filter(c => c.value),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      engagement: {
        openRate: Math.random() * 40 + 15,
        clickRate: Math.random() * 10 + 2
      }
    }

    setSegments([segment, ...segments])
    setIsCreateModalOpen(false)

    // Reset form
    setNewSegment({
      name: '',
      description: '',
      criteria: [{ field: 'status', operator: 'eq', value: '', label: '' }]
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getEngagementColor = (rate: number, type: 'open' | 'click') => {
    const threshold = type === 'open' ? 25 : 5
    if (rate >= threshold) return 'text-green-600'
    if (rate >= threshold * 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Segmentação de Leads</h1>
          <p className="text-muted-foreground">
            Crie segmentos personalizados para campanhas mais eficazes
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Segmento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Segmento</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Segmento</Label>
                  <Input
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    placeholder="Ex: Clientes Premium"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newSegment.description}
                    onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                    placeholder="Descrição do segmento"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-medium">Critérios de Segmentação</Label>
                  <Button variant="outline" size="sm" onClick={addCriteria}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Critério
                  </Button>
                </div>

                <div className="space-y-4">
                  {newSegment.criteria.map((criteria, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Campo</Label>
                        <Select value={criteria.field} onValueChange={(value) => updateCriteria(index, 'field', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Label>Operador</Label>
                        <Select value={criteria.operator} onValueChange={(value) => updateCriteria(index, 'operator', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(operatorOptions[fieldOptions.find(f => f.value === criteria.field)?.type as keyof typeof operatorOptions] || operatorOptions.text).map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4">
                        <Label>Valor</Label>
                        {criteria.field === 'status' ? (
                          <Select value={criteria.value} onValueChange={(value) => updateCriteria(index, 'value', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={criteria.value}
                            onChange={(e) => updateCriteria(index, 'value', e.target.value)}
                            placeholder="Valor do critério"
                          />
                        )}
                      </div>

                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCriteria(index)}
                          disabled={newSegment.criteria.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {criteria.value && (
                        <div className="col-span-12 text-sm text-muted-foreground mt-2">
                          Critério: {criteria.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createSegment} disabled={!newSegment.name || !newSegment.criteria.some(c => c.value)}>
                  Criar Segmento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Segmentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Segmentados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.reduce((sum, segment) => sum + segment.leadCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.length > 0
                ? (segments.reduce((sum, s) => sum + s.engagement.openRate, 0) / segments.length).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de abertura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Segmento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.length > 0
                ? Math.max(...segments.map(s => s.engagement.clickRate)).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de clique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Segmentos Criados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segmento</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Critérios</TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      <div className="text-sm text-muted-foreground">{segment.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {segment.leadCount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {segment.criteria.slice(0, 2).map((criteria, index) => (
                        <div key={index} className="text-muted-foreground">
                          • {criteria.label}
                        </div>
                      ))}
                      {segment.criteria.length > 2 && (
                        <div className="text-muted-foreground">
                          +{segment.criteria.length - 2} critérios
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className={getEngagementColor(segment.engagement.openRate, 'open')}>
                        {segment.engagement.openRate.toFixed(1)}% abertura
                      </div>
                      <div className={getEngagementColor(segment.engagement.clickRate, 'click')}>
                        {segment.engagement.clickRate.toFixed(1)}% clique
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(segment.lastUpdated)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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