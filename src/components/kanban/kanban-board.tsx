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
  TrendingUp
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string | null
  phone?: string | null
  company?: string | null
  status: string
  source: string | null
  value?: number
  nextActionAt?: string | null
  nextActionType?: string | null
  lastInteractionAt?: string | null
  createdAt: string
  tags?: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  icon: React.ReactNode
  leads: Lead[]
}

interface KanbanBoardProps {
  leads: Lead[]
  onLeadUpdate?: (leadId: string, newStatus: string) => void
}

export function KanbanBoard({ leads, onLeadUpdate }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])

  const columnConfig = [
    {
      id: 'new',
      title: 'Novos Leads',
      status: 'NEW',
      color: 'bg-blue-50 border-blue-200',
      icon: <User className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'contacted',
      title: 'Contatados',
      status: 'CONTACTED',
      color: 'bg-yellow-50 border-yellow-200',
      icon: <Phone className="h-5 w-5 text-yellow-600" />
    },
    {
      id: 'qualified',
      title: 'Qualificados',
      status: 'QUALIFIED',
      color: 'bg-purple-50 border-purple-200',
      icon: <Target className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'proposal',
      title: 'Proposta',
      status: 'PROPOSAL',
      color: 'bg-orange-50 border-orange-200',
      icon: <Clock className="h-5 w-5 text-orange-600" />
    },
    {
      id: 'won',
      title: 'Convertidos',
      status: 'WON',
      color: 'bg-green-50 border-green-200',
      icon: <Award className="h-5 w-5 text-green-600" />
    }
  ]

  useEffect(() => {
    const organizedColumns = columnConfig.map(config => ({
      ...config,
      leads: leads.filter(lead => lead.status === config.status)
    }))
    setColumns(organizedColumns)
  }, [leads])

  const formatCurrency = (value: number | undefined) => {
    if (!value) return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getActionTypeIcon = (type: string | undefined) => {
    switch (type) {
      case 'CALL':
        return <Phone className="h-3 w-3" />
      case 'EMAIL':
        return <Mail className="h-3 w-3" />
      case 'MEETING':
        return <Calendar className="h-3 w-3" />
      default:
        return <Phone className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h2>
          <p className="text-gray-600">Acompanhe o progresso dos seus leads</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <TrendingUp className="h-4 w-4 mr-2" />
          Relatório
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-[600px]"
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
                    {column.leads.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              <AnimatePresence>
                {column.leads.map((lead, leadIndex) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: leadIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card className="bg-white border shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {lead.name}
                              </h4>
                              {lead.company && (
                                <p className="text-xs text-gray-500 truncate">
                                  {lead.company}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Value */}
                          {lead.value && (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(lead.value)}
                            </div>
                          )}

                          {/* Next Action */}
                          {lead.nextActionAt && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                {getActionTypeIcon(lead.nextActionType)}
                                <span>Próxima ação: {formatDate(lead.nextActionAt)}</span>
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.slice(0, 2).map((tagAssignment) => (
                                <Badge
                                  key={tagAssignment.tag.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${tagAssignment.tag.color}20`,
                                    color: tagAssignment.tag.color,
                                    borderColor: `${tagAssignment.tag.color}40`
                                  }}
                                >
                                  {tagAssignment.tag.name}
                                </Badge>
                              ))}
                              {lead.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{lead.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                            <span>{lead.source || 'N/A'}</span>
                            <span>{formatDate(lead.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {column.leads.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-400"
                >
                  <div className="space-y-2">
                    {column.icon}
                    <p className="text-sm">Nenhum lead nesta etapa</p>
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