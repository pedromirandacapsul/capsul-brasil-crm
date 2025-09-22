'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  User,
  Clock,
  Target,
  Award,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Building
} from 'lucide-react'

interface Opportunity {
  id: string
  stage: string
  amountBr: number | null
  probability: number
  expectedCloseAt: string | null
  discountPct: number | null
  createdAt: string
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

interface KanbanColumn {
  id: string
  title: string
  stage: string
  color: string
  icon: React.ReactNode
  opportunities: Opportunity[]
}

interface OpportunitiesKanbanProps {
  opportunities: Opportunity[]
  onStageChange?: (opportunityId: string, newStage: string) => void
  onOpportunityUpdate?: (opportunityId: string) => void
}

export function OpportunitiesKanban({
  opportunities,
  onStageChange,
  onOpportunityUpdate
}: OpportunitiesKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])

  const columnConfig = [
    {
      id: 'new',
      title: 'Novos',
      stage: 'NEW',
      color: 'bg-blue-50 border-blue-200',
      icon: <User className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'qualification',
      title: 'Qualificação',
      stage: 'QUALIFICATION',
      color: 'bg-yellow-50 border-yellow-200',
      icon: <Target className="h-5 w-5 text-yellow-600" />
    },
    {
      id: 'discovery',
      title: 'Descoberta',
      stage: 'DISCOVERY',
      color: 'bg-purple-50 border-purple-200',
      icon: <Clock className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'proposal',
      title: 'Proposta',
      stage: 'PROPOSAL',
      color: 'bg-orange-50 border-orange-200',
      icon: <DollarSign className="h-5 w-5 text-orange-600" />
    },
    {
      id: 'negotiation',
      title: 'Negociação',
      stage: 'NEGOTIATION',
      color: 'bg-red-50 border-red-200',
      icon: <ArrowRight className="h-5 w-5 text-red-600" />
    },
    {
      id: 'won',
      title: 'Ganhos',
      stage: 'WON',
      color: 'bg-green-50 border-green-200',
      icon: <Award className="h-5 w-5 text-green-600" />
    }
  ]

  useEffect(() => {
    const organizedColumns = columnConfig.map(config => ({
      ...config,
      opportunities: opportunities.filter(opp => opp.stage === config.stage)
    }))
    setColumns(organizedColumns)
  }, [opportunities])

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sem valor'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'bg-green-100 text-green-800'
    if (probability >= 60) return 'bg-yellow-100 text-yellow-800'
    if (probability >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getColumnTotal = (opportunities: Opportunity[]) => {
    const total = opportunities.reduce((sum, opp) => sum + (opp.amountBr || 0), 0)
    return formatCurrency(total)
  }

  const getWeightedValue = (opportunities: Opportunity[]) => {
    const weighted = opportunities.reduce((sum, opp) => {
      return sum + ((opp.amountBr || 0) * (opp.probability / 100))
    }, 0)
    return formatCurrency(weighted)
  }

  const handleStageTransition = (opportunityId: string, currentStage: string) => {
    const stageOrder = ['NEW', 'QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON']
    const currentIndex = stageOrder.indexOf(currentStage)

    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1]
      if (onStageChange) {
        onStageChange(opportunityId, nextStage)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline de Oportunidades</h2>
          <p className="text-gray-600">Acompanhe o progresso das suas vendas</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <TrendingUp className="h-4 w-4 mr-2" />
          Relatório de Pipeline
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 min-h-[700px]"
      >
        {columns.map((column, columnIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: columnIndex * 0.1 }}
            className="space-y-4"
          >
            <Card className={`${column.color} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {column.icon}
                    <span>{column.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {column.opportunities.length}
                  </Badge>
                </CardTitle>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Total: {getColumnTotal(column.opportunities)}</div>
                  <div>Ponderado: {getWeightedValue(column.opportunities)}</div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              <AnimatePresence>
                {column.opportunities.map((opportunity, oppIndex) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: oppIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card className="bg-white border shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {opportunity.lead.name}
                              </h4>
                              {opportunity.lead.company && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Building className="h-3 w-3" />
                                  <span className="truncate">{opportunity.lead.company}</span>
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Amount and Probability */}
                          <div className="space-y-2">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(opportunity.amountBr)}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs ${getProbabilityColor(opportunity.probability)}`}>
                                {opportunity.probability}% prob.
                              </Badge>
                              {opportunity.discountPct && (
                                <Badge variant="outline" className="text-xs">
                                  -{opportunity.discountPct}% desc.
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Expected Close Date */}
                          {opportunity.expectedCloseAt && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                <Calendar className="h-3 w-3" />
                                <span>Fechamento: {formatDate(opportunity.expectedCloseAt)}</span>
                              </div>
                            </div>
                          )}

                          {/* Contact Info */}
                          <div className="space-y-1">
                            {opportunity.lead.email && (
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{opportunity.lead.email}</span>
                              </div>
                            )}
                            {opportunity.lead.phone && (
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{opportunity.lead.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Owner */}
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            <span className="truncate">{opportunity.owner.name}</span>
                          </div>

                          {/* Stage Transition Button */}
                          {opportunity.stage !== 'WON' && opportunity.stage !== 'LOST' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7"
                              onClick={() => handleStageTransition(opportunity.id, opportunity.stage)}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Avançar Estágio
                            </Button>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                            <span>{opportunity.lead.source || 'N/A'}</span>
                            <span>{formatDate(opportunity.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {column.opportunities.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-400"
                >
                  <div className="space-y-2">
                    {column.icon}
                    <p className="text-sm">Nenhuma oportunidade</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}