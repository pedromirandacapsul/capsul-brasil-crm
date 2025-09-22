'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

interface Lead {
  id: string
  name: string
  email: string | null
  company: string | null
  source: string | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function NewOpportunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    leadId: '',
    ownerId: '',
    stage: 'NEW',
    amountBr: '',
    expectedCloseAt: '',
    discountPct: '',
    costEstimatedBr: '',
    notes: ''
  })

  useEffect(() => {
    fetchLeads()
    fetchUsers()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=100')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
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
    setLoading(true)

    try {
      const submitData = {
        leadId: formData.leadId,
        ownerId: formData.ownerId || session?.user?.id,
        stage: formData.stage,
        amountBr: formData.amountBr ? parseFloat(formData.amountBr) : null,
        expectedCloseAt: formData.expectedCloseAt || null,
        discountPct: formData.discountPct ? parseFloat(formData.discountPct) : null,
        costEstimatedBr: formData.costEstimatedBr ? parseFloat(formData.costEstimatedBr) : null,
      }

      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/admin/opportunities/${result.data.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar oportunidade')
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      alert('Erro ao criar oportunidade')
    } finally {
      setLoading(false)
    }
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'NEW': 'Novo',
      'QUALIFICATION': 'Qualificação',
      'DISCOVERY': 'Descoberta',
      'PROPOSAL': 'Proposta',
      'NEGOTIATION': 'Negociação'
    }
    return labels[stage] || stage
  }

  const selectedLead = leads.find(lead => lead.id === formData.leadId)

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
              <h1 className="text-3xl font-bold text-gray-900">Nova Oportunidade</h1>
              <p className="text-gray-600">Crie uma nova oportunidade de venda</p>
            </div>
          </div>
        </AnimatedDashboardItem>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Selection */}
              <AnimatedDashboardItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Informações do Lead</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="leadId">Lead *</Label>
                      <Select
                        value={formData.leadId}
                        onValueChange={(value) => handleInputChange('leadId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(leads) ? leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{lead.name}</span>
                                {lead.company && (
                                  <span className="text-xs text-gray-500">{lead.company}</span>
                                )}
                              </div>
                            </SelectItem>
                          )) : (
                            <SelectItem value="loading" disabled>Carregando leads...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedLead && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center space-x-2 text-sm">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{selectedLead.name}</span>
                          {selectedLead.company && (
                            <span className="text-gray-600">• {selectedLead.company}</span>
                          )}
                        </div>
                        {selectedLead.email && (
                          <p className="text-xs text-gray-600 mt-1">{selectedLead.email}</p>
                        )}
                      </motion.div>
                    )}

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
                          {Array.isArray(users) ? users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">{user.role}</span>
                              </div>
                            </SelectItem>
                          )) : (
                            <SelectItem value="loading" disabled>Carregando usuários...</SelectItem>
                          )}
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
                        {selectedLead?.name || 'Não selecionado'}
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
                        disabled={loading || !formData.leadId}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Criar Oportunidade
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => router.back()}
                        disabled={loading}
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
                      <p>• Probabilidade será calculada automaticamente</p>
                      <p>• Histórico de mudanças será registrado</p>
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