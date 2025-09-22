'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ExternalLink,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DrillDownData {
  opportunities: {
    id: string
    stage: string
    amountBr: number | null
    createdAt: string
    updatedAt: string
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
  }[]
  summary: {
    total: number
    totalValue: number
    avgValue: number
    wonCount: number
    lostCount: number
    conversionRate: number
    type: string
    value: string
  }
}

interface DrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'loss' | 'source' | null
  value: string | null
  period: string
}

const stageColors: Record<string, string> = {
  NEW: '#3B82F6',
  QUALIFICATION: '#F59E0B',
  DISCOVERY: '#8B5CF6',
  PROPOSAL: '#F97316',
  NEGOTIATION: '#EF4444',
  WON: '#059669',
  LOST: '#6B7280',
}

const stageLabels: Record<string, string> = {
  NEW: 'Novo',
  QUALIFICATION: 'Qualificação',
  DISCOVERY: 'Descoberta',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
}

const lossReasonLabels: Record<string, string> = {
  SEM_BUDGET: 'Sem Budget',
  SEM_FIT: 'Sem Fit',
  CONCORRENCIA: 'Concorrência',
  TIMING: 'Timing Inadequado',
  NAO_RESPONDE: 'Não Responde',
  OUTROS: 'Outros',
}

export default function DrillDownModal({ isOpen, onClose, type, value, period }: DrillDownModalProps) {
  const [data, setData] = useState<DrillDownData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && type && value) {
      fetchDrillDownData()
    }
  }, [isOpen, type, value, period])

  const fetchDrillDownData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/opportunities/drill-down?type=${type}&value=${encodeURIComponent(value!)}&period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching drill-down data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTitle = () => {
    if (type === 'loss') {
      return `Oportunidades Perdidas: ${lossReasonLabels[value!] || value}`
    } else if (type === 'source') {
      return `Oportunidades da Fonte: ${value}`
    }
    return 'Drill-down'
  }

  const openOpportunity = (opportunityId: string) => {
    window.open(`/admin/opportunities/${opportunityId}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {getTitle()}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
            />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold">{data.summary.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(data.summary.totalValue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ticket Médio</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(data.summary.avgValue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Taxa Conversão</p>
                      <p className="text-lg font-bold text-orange-600">
                        {data.summary.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opportunities List */}
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades ({data.opportunities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {data.opportunities.map((opportunity, index) => (
                      <motion.div
                        key={opportunity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openOpportunity(opportunity.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: stageColors[opportunity.stage],
                                  color: stageColors[opportunity.stage]
                                }}
                              >
                                {stageLabels[opportunity.stage]}
                              </Badge>

                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{opportunity.lead.name}</span>
                              </div>

                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              {opportunity.lead.company && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-3 w-3" />
                                  <span>{opportunity.lead.company}</span>
                                </div>
                              )}

                              {opportunity.lead.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{opportunity.lead.email}</span>
                                </div>
                              )}

                              {opportunity.lead.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{opportunity.lead.phone}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-500">
                                    Criado: {formatDate(opportunity.createdAt)}
                                  </span>
                                </div>

                                <span className="text-gray-500">
                                  Responsável: {opportunity.owner.name}
                                </span>

                                {opportunity.lead.source && (
                                  <span className="text-gray-500">
                                    Fonte: {opportunity.lead.source}
                                  </span>
                                )}
                              </div>

                              {opportunity.lostReason && (
                                <Badge variant="destructive" className="text-xs">
                                  {lossReasonLabels[opportunity.lostReason] || opportunity.lostReason}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(opportunity.amountBr || 0)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum dado encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}