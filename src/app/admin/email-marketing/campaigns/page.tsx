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
  const [showRecipientsModal, setShowRecipientsModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [recipients, setRecipients] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
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

  const handleAddRecipients = async () => {
    if (!selectedCampaign || !recipients.trim()) return

    try {
      const emailList = recipients.split('\n').map(email => email.trim()).filter(email => email)
      const response = await fetch(`/api/email/campaigns/${selectedCampaign.id}/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailList }),
      })

      const result = await response.json()
      if (result.success) {
        // Atualizar campanha na lista
        setCampaigns(campaigns.map(c =>
          c.id === selectedCampaign.id
            ? { ...c, totalRecipients: c.totalRecipients + emailList.length }
            : c
        ))
        setShowRecipientsModal(false)
        setRecipients('')
        setSelectedCampaign(null)
      } else {
        alert('Erro ao adicionar recipients: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao adicionar recipients:', error)
      alert('Erro ao adicionar recipients')
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja enviar esta campanha?')) return

    try {
      const response = await fetch(`/api/email/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const result = await response.json()
      if (result.success) {
        alert('Campanha enviada com sucesso!')
        fetchCampaigns() // Recarregar lista
      } else {
        alert('Erro ao enviar campanha: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao enviar campanha:', error)
      alert('Erro ao enviar campanha')
    }
  }

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign)
    setEditFormData({
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: '', // Será carregado da API
      type: campaign.type,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
    })
    setShowEditModal(true)
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign) return

    try {
      const response = await fetch(`/api/email/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          scheduledAt: editFormData.scheduledAt ? new Date(editFormData.scheduledAt).toISOString() : undefined
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Atualizar campanha na lista
        setCampaigns(campaigns.map(c =>
          c.id === selectedCampaign.id
            ? { ...c, ...editFormData, scheduledAt: editFormData.scheduledAt }
            : c
        ))
        setShowEditModal(false)
        setSelectedCampaign(null)
        setEditFormData({
          name: '',
          subject: '',
          htmlContent: '',
          type: 'MARKETING',
          scheduledAt: ''
        })
        alert('Campanha atualizada com sucesso!')
      } else {
        alert('Erro ao atualizar campanha: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
      alert('Erro ao atualizar campanha')
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
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setShowRecipientsModal(true)
                      }}
                      className="text-gray-400 hover:text-blue-600 p-2"
                      title="Adicionar Recipients"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert('Funcionalidade de visualização em desenvolvimento')}
                      className="text-gray-400 hover:text-green-600 p-2"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      className="text-gray-400 hover:text-yellow-600 p-2"
                      title="Editar"
                      disabled={campaign.status !== 'DRAFT'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendCampaign(campaign.id)}
                        className="text-gray-400 hover:text-purple-600 p-2"
                        title="Enviar Campanha"
                      >
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

        {/* Modal de Recipients */}
        {showRecipientsModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Adicionar Recipients - {selectedCampaign.name}
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Recipients atuais: <strong>{selectedCampaign.totalRecipients}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emails (um por linha)
                </label>
                <textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="pedro@grupocapsul.com.br
joao@exemplo.com
maria@teste.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Cole uma lista de emails, um por linha. Emails inválidos serão ignorados.
                </p>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => setRecipients('pedro@grupocapsul.com.br')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  📧 Usar email teste (pedro@grupocapsul.com.br)
                </button>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipientsModal(false)
                    setSelectedCampaign(null)
                    setRecipients('')
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddRecipients}
                  disabled={!recipients.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar Recipients
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {showEditModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Editar Campanha: {selectedCampaign.name}
              </h2>

              <form onSubmit={handleUpdateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Campanha</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Newsletter Dezembro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
                  <input
                    type="text"
                    required
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Novidades de dezembro - Capsul"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo HTML</label>
                  <textarea
                    value={editFormData.htmlContent}
                    onChange={(e) => setEditFormData({...editFormData, htmlContent: e.target.value})}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="<h1>Olá!</h1><p>Conteúdo da sua campanha...</p>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Use HTML para criar emails mais atraentes. Variáveis: {"{nome}"}, {"{email}"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
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
                    value={editFormData.scheduledAt}
                    onChange={(e) => setEditFormData({...editFormData, scheduledAt: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center text-blue-800 mb-2">
                    <span className="font-medium">📊 Estatísticas Atuais:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                    <div>Recipients: {selectedCampaign.totalRecipients}</div>
                    <div>Status: {selectedCampaign.status}</div>
                    <div>Enviados: {selectedCampaign.sentCount}</div>
                    <div>Abertos: {selectedCampaign.openedCount}</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedCampaign(null)
                      setEditFormData({
                        name: '',
                        subject: '',
                        htmlContent: '',
                        type: 'MARKETING',
                        scheduledAt: ''
                      })
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salvar Alterações
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