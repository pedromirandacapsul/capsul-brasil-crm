'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import {
  ArrowLeft,
  Save,
  User,
  Building,
  DollarSign,
  Calendar,
  Target,
  Loader2
} from 'lucide-react'

interface Opportunity {
  id: string
  stage: string
  amountBr: number | null
  probability: number
  expectedCloseAt: string | null
  discountPct: number | null
  costEstimatedBr: number | null
  createdAt: string
  closedAt: string | null
  lostReason: string | null
  lead: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    source: string | null
  }
  owner: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function EditOpportunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const opportunityId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    ownerId: '',
    stage: '',
    amountBr: '',
    expectedCloseAt: '',
    discountPct: '',
    costEstimatedBr: '',
    lostReason: ''
  })

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity()
      fetchUsers()
    }
  }, [opportunityId])

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`)
      if (response.ok) {
        const data = await response.json()
        const opp = data.data
        setOpportunity(opp)
        setFormData({
          ownerId: opp.owner.id,
          stage: opp.stage,
          amountBr: opp.amountBr?.toString() || '',
          expectedCloseAt: opp.expectedCloseAt ? new Date(opp.expectedCloseAt).toISOString().split('T')[0] : '',
          discountPct: opp.discountPct?.toString() || '',
          costEstimatedBr: opp.costEstimatedBr?.toString() || '',
          lostReason: opp.lostReason || ''
        })
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data?.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = {
        ownerId: formData.ownerId,
        stage: formData.stage,
        amountBr: formData.amountBr ? parseFloat(formData.amountBr) : null,
        expectedCloseAt: formData.expectedCloseAt || null,
        discountPct: formData.discountPct ? parseFloat(formData.discountPct) : null,
        costEstimatedBr: formData.costEstimatedBr ? parseFloat(formData.costEstimatedBr) : null,
        lostReason: formData.stage === 'LOST' ? formData.lostReason : null
      }

      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push(`/admin/opportunities/${opportunityId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar oportunidade')
      }
    } catch (error) {
      console.error('Error updating opportunity:', error)
      alert('Erro ao atualizar oportunidade')
    } finally {
      setSaving(false)
    }
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'NEW': 'Novo',
      'QUALIFICATION': 'Qualificação',
      'DISCOVERY': 'Descoberta',
      'PROPOSAL': 'Proposta',
      'NEGOTIATION': 'Negociação',
      'WON': 'Ganho',
      'LOST': 'Perdido'
    }
    return labels[stage] || stage
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oportunidade não encontrada</h2>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  return (
    <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedDashboardItem>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Oportunidade</h1>
              <p className="text-gray-600">Editar oportunidade de {opportunity.lead.name}</p>
            </div>
          </div>
        </AnimatedDashboardItem>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Information */}
              <AnimatedDashboardItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Informações do Lead</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-sm">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{opportunity.lead.name}</span>
                        {opportunity.lead.company && (
                          <span className="text-gray-600">• {opportunity.lead.company}</span>
                        )}
                      </div>
                      {opportunity.lead.email && (
                        <p className="text-xs text-gray-600 mt-1">{opportunity.lead.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ownerId">Responsável</Label>
                      <Select
                        value={formData.ownerId}
                        onValueChange={(value) => handleInputChange('ownerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">{user.role}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedDashboardItem>

              {/* Opportunity Details */}
              <AnimatedDashboardItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Detalhes da Oportunidade</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="stage">Estágio</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => handleInputChange('stage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">Novo</SelectItem>
                          <SelectItem value="QUALIFICATION">Qualificação</SelectItem>
                          <SelectItem value="DISCOVERY">Descoberta</SelectItem>
                          <SelectItem value="PROPOSAL">Proposta</SelectItem>
                          <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                          <SelectItem value="WON">Ganho</SelectItem>
                          <SelectItem value="LOST">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amountBr">Valor (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="amountBr"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={formData.amountBr}
                            onChange={(e) => handleInputChange('amountBr', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="discountPct">Desconto (%)</Label>
                        <Input
                          id="discountPct"
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={formData.discountPct}
                          onChange={(e) => handleInputChange('discountPct', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expectedCloseAt">Data Prevista de Fechamento</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="expectedCloseAt"
                            type="date"
                            value={formData.expectedCloseAt}
                            onChange={(e) => handleInputChange('expectedCloseAt', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="costEstimatedBr">Custo Estimado (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="costEstimatedBr"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={formData.costEstimatedBr}
                            onChange={(e) => handleInputChange('costEstimatedBr', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.stage === 'LOST' && (
                      <div>
                        <Label htmlFor="lostReason">Motivo da Perda</Label>
                        <Textarea
                          id="lostReason"
                          placeholder="Descreva o motivo da perda desta oportunidade..."
                          value={formData.lostReason}
                          onChange={(e) => handleInputChange('lostReason', e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedDashboardItem>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary */}
              <AnimatedDashboardItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lead:</span>
                      <span className="text-sm font-medium">
                        {opportunity.lead.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estágio:</span>
                      <span className="text-sm font-medium">
                        {getStageLabel(formData.stage)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formData.amountBr
                          ? `R$ ${parseFloat(formData.amountBr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'R$ 0,00'
                        }
                      </span>
                    </div>
                    {formData.expectedCloseAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fechamento:</span>
                        <span className="text-sm font-medium">
                          {new Date(formData.expectedCloseAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedDashboardItem>

              {/* Actions */}
              <AnimatedDashboardItem>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => router.back()}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedDashboardItem>

              {/* Business Rules */}
              <AnimatedDashboardItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Regras de Negócio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>• Valor é obrigatório para estágios Proposta e Negociação</p>
                      <p>• Probabilidade será recalculada automaticamente</p>
                      <p>• Mudanças de estágio são registradas no histórico</p>
                      <p>• Motivo é obrigatório para status "Perdido"</p>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedDashboardItem>
            </div>
          </div>
        </form>
      </div>
    </AnimatedDashboardContainer>
  )
}