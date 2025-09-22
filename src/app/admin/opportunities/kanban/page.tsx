'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { OpportunitiesKanban } from '@/components/kanban/opportunities-kanban'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import { ArrowLeft, Plus, Filter, Download, TrendingUp, DollarSign, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

export default function OpportunitiesKanbanPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchOpportunities()
    }
  }, [session])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/opportunities?limit=100')
      const data = await response.json()

      if (data.success) {
        setOpportunities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageTo: newStage
        }),
      })

      if (response.ok) {
        // Atualizar a oportunidade local
        setOpportunities(prevOpportunities =>
          prevOpportunities.map(opp =>
            opp.id === opportunityId
              ? { ...opp, stage: newStage }
              : opp
          )
        )
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao alterar estágio')
      }
    } catch (error) {
      console.error('Error changing stage:', error)
      alert('Erro ao alterar estágio')
    }
  }

  const handleOpportunityUpdate = () => {
    fetchOpportunities() // Refresh the list
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStageStats = () => {
    return [
      {
        label: 'Novos',
        count: opportunities.filter(o => o.stage === 'NEW').length,
        value: opportunities.filter(o => o.stage === 'NEW').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-blue-500'
      },
      {
        label: 'Qualificação',
        count: opportunities.filter(o => o.stage === 'QUALIFICATION').length,
        value: opportunities.filter(o => o.stage === 'QUALIFICATION').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-yellow-500'
      },
      {
        label: 'Descoberta',
        count: opportunities.filter(o => o.stage === 'DISCOVERY').length,
        value: opportunities.filter(o => o.stage === 'DISCOVERY').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-purple-500'
      },
      {
        label: 'Proposta',
        count: opportunities.filter(o => o.stage === 'PROPOSAL').length,
        value: opportunities.filter(o => o.stage === 'PROPOSAL').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-orange-500'
      },
      {
        label: 'Negociação',
        count: opportunities.filter(o => o.stage === 'NEGOTIATION').length,
        value: opportunities.filter(o => o.stage === 'NEGOTIATION').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-red-500'
      },
      {
        label: 'Ganhos',
        count: opportunities.filter(o => o.stage === 'WON').length,
        value: opportunities.filter(o => o.stage === 'WON').reduce((sum, o) => sum + (o.amountBr || 0), 0),
        color: 'bg-green-500'
      }
    ]
  }

  const getTotalPipelineValue = () => {
    return opportunities
      .filter(o => !['WON', 'LOST'].includes(o.stage))
      .reduce((sum, o) => sum + (o.amountBr || 0), 0)
  }

  const getWeightedPipelineValue = () => {
    return opportunities
      .filter(o => !['WON', 'LOST'].includes(o.stage))
      .reduce((sum, o) => sum + ((o.amountBr || 0) * (o.probability / 100)), 0)
  }

  const getWonValue = () => {
    return opportunities
      .filter(o => o.stage === 'WON')
      .reduce((sum, o) => sum + (o.amountBr || 0), 0)
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

  const stageStats = getStageStats()

  return (
    <AnimatedDashboardContainer className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <AnimatedDashboardItem>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pipeline de Oportunidades</h1>
                <p className="text-gray-600">Visualize e gerencie suas oportunidades de venda</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => router.push('/admin/opportunities/new')} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </div>
          </div>
        </AnimatedDashboardItem>

        {/* Resumo Financeiro */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPipelineValue())}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Ponderado</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(getWeightedPipelineValue())}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vendas Fechadas</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(getWonValue())}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Oportunidades</p>
                  <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatedDashboardItem>

        {/* Estatísticas por Estágio */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {stageStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-4 border shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                </div>
                <p className="text-lg font-bold text-gray-900">{stat.count}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stat.value)}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedDashboardItem>

        {/* Kanban Board */}
        <AnimatedDashboardItem>
          <OpportunitiesKanban
            opportunities={opportunities}
            onStageChange={handleStageChange}
            onOpportunityUpdate={handleOpportunityUpdate}
          />
        </AnimatedDashboardItem>
      </div>
    </AnimatedDashboardContainer>
  )
}