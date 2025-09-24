'use client'

import { useState, useEffect } from 'react'
import { Plus, Send, Eye, Edit, Calendar, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: string
  type: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  scheduledAt?: string
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    type: 'MARKETING',
    scheduledAt: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/email/campaigns')
      const result = await response.json()
      if (result.success) {
        setCampaigns(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
          createdById: 'user_id_placeholder' // TODO: pegar do contexto de auth
        }),
      })

      const result = await response.json()
      if (result.success) {
        setCampaigns([...campaigns, result.data])
        setShowCreateModal(false)
        setFormData({
          name: '',
          subject: '',
          type: 'MARKETING',
          scheduledAt: ''
        })
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'SENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-orange-100 text-orange-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho'
      case 'SCHEDULED': return 'Agendada'
      case 'SENDING': return 'Enviando'
      case 'SENT': return 'Enviada'
      case 'PAUSED': return 'Pausada'
      case 'CANCELLED': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/admin/email-marketing" className="mr-4">
              <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Campanhas de Email</h1>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Gerencie suas campanhas de email marketing</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </button>
          </div>
        </div>

        {/* Lista de Campanhas */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando campanhas...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira campanha de email para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Campanha
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">{campaign.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{campaign.subject}</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Destinatários</div>
                        <div className="text-sm font-medium text-gray-900">{campaign.totalRecipients}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Enviados</div>
                        <div className="text-sm font-medium text-gray-900">{campaign.sentCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Entregues</div>
                        <div className="text-sm font-medium text-gray-900">{campaign.deliveredCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Abertos</div>
                        <div className="text-sm font-medium text-gray-900">{campaign.openedCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Cliques</div>
                        <div className="text-sm font-medium text-gray-900">{campaign.clickedCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button className="text-gray-400 hover:text-blue-600 p-2">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-green-600 p-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    {campaign.status === 'DRAFT' && (
                      <button className="text-gray-400 hover:text-purple-600 p-2">
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {campaign.scheduledAt && (
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendada para: {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Criar Nova Campanha</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Campanha</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Newsletter Dezembro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Novidades de dezembro - Capsul"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="TRANSACTIONAL">Transacional</option>
                    <option value="WORKFLOW">Workflow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agendar para (opcional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar Campanha
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}