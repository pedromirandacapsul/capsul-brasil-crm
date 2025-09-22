'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { OpportunitiesKanban } from '@/components/kanban/opportunities-kanban'
import { AnimatedDashboardContainer, AnimatedDashboardItem } from '@/components/dashboard/animated-dashboard-container'
import { ArrowLeft, Plus, Filter, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Opportunity {
  id: string
  stage: string
  amountBr: number | null
  probability: number
  expectedCloseAt: string | null
  discountPct: number | null
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

export default function KanbanPage() {
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

  const handleOpportunityUpdate = async (opportunityId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: newStage
        }),
      })

      if (response.ok) {
        // Atualizar a oportunidade local
        setOpportunities(prevOpportunities =>
          prevOpportunities.map(opportunity =>
            opportunity.id === opportunityId
              ? { ...opportunity, stage: newStage }
              : opportunity
          )
        )
      }
    } catch (error) {
      console.error('Error updating opportunity:', error)
    }
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

        {/* Estatísticas Rápidas */}
        <AnimatedDashboardItem>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
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
                label: 'Fechados',
                count: opportunities.filter(o => o.stage === 'WON').length,
                value: opportunities.filter(o => o.stage === 'WON').reduce((sum, o) => sum + (o.amountBr || 0), 0),
                color: 'bg-green-500'
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-4 border shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.count}</p>
                    <p className="text-xs text-green-600 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedDashboardItem>

        {/* Kanban Board */}
        <AnimatedDashboardItem>
          <OpportunitiesKanban opportunities={opportunities} onOpportunityUpdate={handleOpportunityUpdate} />
        </AnimatedDashboardItem>
      </div>
    </AnimatedDashboardContainer>
  )
}