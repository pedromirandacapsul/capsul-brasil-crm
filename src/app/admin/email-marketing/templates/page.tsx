'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'MARKETING'
  })
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdById: 'user_id_placeholder' // TODO: pegar do contexto de auth
        }),
      })

      const result = await response.json()
      if (result.success) {
        setTemplates([...templates, result.data])
        setShowCreateModal(false)
        setFormData({
          name: '',
          description: '',
          subject: '',
          htmlContent: '',
          textContent: '',
          category: 'MARKETING'
        })
      }
    } catch (error) {
      console.error('Erro ao criar template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const response = await fetch(`/api/email/templates/${templateId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setTemplates(templates.filter(t => t.id !== templateId))
        alert('Template excluído com sucesso!')
      } else {
        alert('Erro ao excluir template: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: '',
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || '',
      category: 'MARKETING'
    })
    setShowCreateModal(true)
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    // Copiar o template para a área de transferência ou redirecionar para criar campanha
    if (navigator.clipboard) {
      navigator.clipboard.writeText(template.htmlContent)
      alert('Conteúdo HTML do template copiado para a área de transferência!')
    } else {
      alert(`Template: ${template.name}\nAssunto: ${template.subject}\n\nUse este template ao criar uma nova campanha.`)
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
            <h1 className="text-3xl font-bold text-gray-900">Templates de Email</h1>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Gerencie seus templates reutilizáveis</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </button>
          </div>
        </div>

        {/* Lista de Templates */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro template de email para começar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar Template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Excluir Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Prévia do conteúdo:</div>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {template.htmlContent.replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </div>
                </div>

                {template.variables.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Variáveis disponíveis:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Template ID: {template.id.substring(0, 8)}...</span>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    title="Copiar conteúdo do template"
                  >
                    Usar Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Welcome Email"
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
                    placeholder="Ex: Bem-vindo à Capsul!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo HTML</label>
                  <textarea
                    required
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({...formData, htmlContent: e.target.value})}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="<h1>Olá {{nome}}!</h1><p>Bem-vindo à nossa plataforma...</p>"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo Texto (opcional)</label>
                  <textarea
                    value={formData.textContent}
                    onChange={(e) => setFormData({...formData, textContent: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Versão em texto puro do email..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingTemplate(null)
                      setFormData({
                        name: '',
                        description: '',
                        subject: '',
                        htmlContent: '',
                        textContent: '',
                        category: 'MARKETING'
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
                    {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
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