'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Eye,
  FileText,
  Mic,
  Image,
  Video,
  Smartphone
} from 'lucide-react'

interface WhatsAppTemplate {
  id: string
  name: string
  category: 'PERSONAL' | 'BUSINESS' | 'SUPPORT'
  language: string
  content: string
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerContent?: string
  footerText?: string
  buttons?: string
  variables?: string
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
}

const CATEGORIES = [
  { value: 'PERSONAL', label: 'Pessoal', color: 'bg-blue-500' },
  { value: 'BUSINESS', label: 'Negócios', color: 'bg-green-500' },
  { value: 'SUPPORT', label: 'Suporte', color: 'bg-purple-500' }
]

const HEADER_TYPES = [
  { value: 'TEXT', label: 'Texto', icon: FileText },
  { value: 'IMAGE', label: 'Imagem', icon: Image },
  { value: 'VIDEO', label: 'Vídeo', icon: Video },
  { value: 'DOCUMENT', label: 'Documento', icon: FileText }
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<WhatsAppTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | WhatsAppTemplate['category']>('all')
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<WhatsAppTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'PERSONAL' as WhatsAppTemplate['category'],
    content: '',
    headerType: 'TEXT' as WhatsAppTemplate['headerType'],
    headerContent: '',
    footerText: '',
    variables: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, filterCategory])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/templates')

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        // Mock data for development
        const mockTemplates: WhatsAppTemplate[] = [
          {
            id: '1',
            name: 'Boas-vindas',
            category: 'PERSONAL',
            language: 'pt_BR',
            content: 'Olá {{1}}! 👋\n\nSeja muito bem-vindo(a)! Estamos felizes em tê-lo(a) conosco.\n\nSe tiver alguma dúvida, estarei aqui para ajudar!',
            headerType: 'TEXT',
            headerContent: '🎉 Bem-vindo!',
            footerText: 'Equipe de Atendimento',
            variables: JSON.stringify([{ name: 'nome', example: 'João' }]),
            status: 'ACTIVE',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            createdBy: { id: '1', name: 'Admin' }
          },
          {
            id: '2',
            name: 'Promoção Especial',
            category: 'BUSINESS',
            language: 'pt_BR',
            content: '🔥 *OFERTA ESPECIAL* 🔥\n\nOlá {{1}}!\n\nApenas hoje: *{{2}}% OFF* em todos os produtos!\n\nCódigo: {{3}}\nVálido até meia-noite! ⏰',
            headerType: 'IMAGE',
            headerContent: 'https://exemplo.com/promocao.jpg',
            footerText: 'Não perca essa oportunidade!',
            variables: JSON.stringify([
              { name: 'nome', example: 'Maria' },
              { name: 'desconto', example: '50' },
              { name: 'codigo', example: 'PROMO50' }
            ]),
            status: 'DRAFT',
            createdAt: '2024-01-20T14:20:00Z',
            updatedAt: '2024-01-20T14:20:00Z',
            createdBy: { id: '1', name: 'Admin' }
          },
          {
            id: '3',
            name: 'Suporte Técnico',
            category: 'SUPPORT',
            language: 'pt_BR',
            content: '🔧 *Suporte Técnico*\n\nOlá {{1}}!\n\nRecebemos sua solicitação de suporte nº {{2}}.\n\nNosso time técnico irá analisar e responder em até 24 horas.',
            footerText: 'Estamos aqui para ajudar',
            variables: JSON.stringify([
              { name: 'nome', example: 'Carlos' },
              { name: 'ticket', example: '12345' }
            ]),
            status: 'ACTIVE',
            createdAt: '2024-01-18T09:15:00Z',
            updatedAt: '2024-01-18T09:15:00Z',
            createdBy: { id: '1', name: 'Admin' }
          }
        ]
        setTemplates(mockTemplates)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(template => template.category === filterCategory)
    }

    setFilteredTemplates(filtered)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'PERSONAL',
      content: '',
      headerType: 'TEXT',
      headerContent: '',
      footerText: '',
      variables: ''
    })
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language: 'pt_BR'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(prev => [data.template, ...prev])
        setShowCreateDialog(false)
        resetForm()
      } else {
        const error = await response.json()
        alert('Erro ao criar template: ' + error.error)
      }
    } catch (error) {
      console.error('Erro ao criar template:', error)
      alert('Erro ao criar template')
    }
  }

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      headerType: template.headerType || 'TEXT',
      headerContent: template.headerContent || '',
      footerText: template.footerText || '',
      variables: template.variables || ''
    })
    setShowCreateDialog(true)
  }

  const duplicateTemplate = (template: WhatsAppTemplate) => {
    setFormData({
      name: `${template.name} (Cópia)`,
      category: template.category,
      content: template.content,
      headerType: template.headerType || 'TEXT',
      headerContent: template.headerContent || '',
      footerText: template.footerText || '',
      variables: template.variables || ''
    })
    setShowCreateDialog(true)
  }

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-500'
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  const renderVariableExamples = (variablesJson: string) => {
    try {
      const variables = JSON.parse(variablesJson)
      return variables.map((v: any, i: number) => (
        <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
          {`{{${i + 1}}} = ${v.example}`}
        </span>
      ))
    } catch {
      return null
    }
  }

  const renderTemplatePreview = (template: WhatsAppTemplate) => {
    let content = template.content

    // Replace variables with examples
    try {
      const variables = JSON.parse(template.variables || '[]')
      variables.forEach((v: any, i: number) => {
        content = content.replace(new RegExp(`{{${i + 1}}}`, 'g'), v.example)
      })
    } catch {
      // Ignore parsing errors
    }

    return (
      <div className="bg-gray-100 rounded-lg p-4 max-w-sm mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {template.headerType && template.headerContent && (
            <div className="bg-green-500 text-white p-3 text-sm font-medium">
              {template.headerType === 'TEXT' ? template.headerContent : `[${template.headerType}]`}
            </div>
          )}
          <div className="p-4">
            <div className="whitespace-pre-wrap text-sm">{content}</div>
          </div>
          {template.footerText && (
            <div className="px-4 pb-3 text-xs text-gray-500">
              {template.footerText}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="text-gray-600 mt-1">Gerencie templates de mensagem para automação</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
              >
                Todos
              </Button>
              {CATEGORIES.map(category => (
                <Button
                  key={category.value}
                  variant={filterCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category.value as any)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="default"
                    className={getCategoryColor(template.category)}
                  >
                    {getCategoryLabel(template.category)}
                  </Badge>
                  <Badge
                    variant={template.status === 'ACTIVE' ? 'default' :
                            template.status === 'DRAFT' ? 'secondary' : 'destructive'}
                  >
                    {template.status === 'ACTIVE' ? 'Ativo' :
                     template.status === 'DRAFT' ? 'Rascunho' : 'Inativo'}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setPreviewTemplate(template)
                      setShowPreviewDialog(true)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteTemplate(template)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </p>
                  {template.variables && (
                    <div className="flex flex-wrap gap-1">
                      {renderVariableExamples(template.variables)}
                    </div>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Criado por {template.createdBy.name}</span>
                <span>{new Date(template.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template criado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro template de mensagem.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) {
          setEditingTemplate(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure o template de mensagem para envio automático
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Template</Label>
                <Input
                  placeholder="Ex: promocao_black_friday"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Cabeçalho</Label>
                <Select
                  value={formData.headerType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, headerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEADER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conteúdo do Cabeçalho</Label>
                <Input
                  placeholder={formData.headerType === 'TEXT' ? 'Texto do cabeçalho' : 'URL da mídia'}
                  value={formData.headerContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, headerContent: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Conteúdo da Mensagem</Label>
              <Textarea
                placeholder="Digite o conteúdo da mensagem... Use {1}, {2} para variáveis"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variáveis como {'{1}'}, {'{2}'}, etc. para personalização
              </p>
            </div>

            <div>
              <Label>Texto do Rodapé (opcional)</Label>
              <Input
                placeholder="Texto pequeno no final da mensagem"
                value={formData.footerText}
                onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
              />
            </div>

            <div>
              <Label>Variáveis (JSON)</Label>
              <Textarea
                placeholder='[{"name": "nome", "example": "João"}, {"name": "desconto", "example": "50"}]'
                value={formData.variables}
                onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Defina as variáveis em formato JSON com nome e exemplo
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate}>
              {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visualizar Template</DialogTitle>
            <DialogDescription>
              Como a mensagem aparecerá no WhatsApp
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="py-4">
              {renderTemplatePreview(previewTemplate)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o template "{deleteTemplate?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplate(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => {
              // TODO: Implement delete API call
              setDeleteTemplate(null)
            }}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}