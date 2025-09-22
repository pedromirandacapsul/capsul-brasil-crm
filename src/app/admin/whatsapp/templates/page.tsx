'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Copy,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface WhatsAppTemplate {
  id: string
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  content: string
  headerType?: string
  headerContent?: string
  footerText?: string
  buttons?: string
  variables?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  whatsappId?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
}

export default function WhatsAppTemplatesPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY' as const,
    language: 'pt_BR',
    content: '',
    headerType: '',
    headerContent: '',
    footerText: '',
    variables: '[]',
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Nome e conteúdo são obrigatórios')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          headerType: formData.headerType || undefined,
          headerContent: formData.headerContent || undefined,
          footerText: formData.footerText || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Template criado com sucesso')
        setShowCreateDialog(false)
        resetForm()
        fetchTemplates()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar template')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'UTILITY',
      language: 'pt_BR',
      content: '',
      headerType: '',
      headerContent: '',
      footerText: '',
      variables: '[]',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      MARKETING: 'bg-blue-100 text-blue-800',
      UTILITY: 'bg-gray-100 text-gray-800',
      AUTHENTICATION: 'bg-purple-100 text-purple-800',
    }

    return (
      <Badge className={colors[category as keyof typeof colors] || colors.UTILITY}>
        {category}
      </Badge>
    )
  }

  const renderTemplatePreview = (template: WhatsAppTemplate) => {
    let content = template.content

    // Replace variables with sample data
    if (template.variables) {
      try {
        const variables = JSON.parse(template.variables)
        variables.forEach((variable: any, index: number) => {
          const placeholder = `{{${index + 1}}}`
          const sampleValue = variable.sample || variable.name || `Variável ${index + 1}`
          content = content.replace(new RegExp(placeholder, 'g'), sampleValue)
        })
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return (
      <div className="border rounded-lg p-4 bg-gray-50 max-w-sm">
        {/* Header */}
        {template.headerType && template.headerContent && (
          <div className="mb-3">
            {template.headerType === 'TEXT' && (
              <div className="font-semibold text-gray-900">{template.headerContent}</div>
            )}
            {template.headerType === 'IMAGE' && (
              <div className="bg-gray-200 rounded h-32 flex items-center justify-center">
                <span className="text-gray-500">Imagem</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="text-gray-800 whitespace-pre-wrap mb-3">
          {content}
        </div>

        {/* Footer */}
        {template.footerText && (
          <div className="text-xs text-gray-500 border-t pt-2">
            {template.footerText}
          </div>
        )}

        {/* Buttons */}
        {template.buttons && (
          <div className="mt-3 space-y-2">
            {(() => {
              try {
                const buttons = JSON.parse(template.buttons)
                return buttons.map((button: any, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    {button.text}
                  </Button>
                ))
              } catch (e) {
                return null
              }
            })()}
          </div>
        )}
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie templates de mensagens para automatização
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Template</DialogTitle>
                <DialogDescription>
                  Crie um template de mensagem para usar em automações
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: boas_vindas"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTILITY">Utilitário</SelectItem>
                          <SelectItem value="MARKETING">Marketing</SelectItem>
                          <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt_BR">Português (BR)</SelectItem>
                          <SelectItem value="en_US">English (US)</SelectItem>
                          <SelectItem value="es_ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo da Mensagem</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Olá {{1}}! Bem-vindo à nossa empresa..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{1}}'}, {'{{2}}'}, etc. para variáveis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footerText">Texto do Rodapé (opcional)</Label>
                    <Input
                      id="footerText"
                      value={formData.footerText}
                      onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                      placeholder="Ex: Esta é uma mensagem automatizada"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createTemplate} disabled={creating}>
                      {creating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Template'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Pré-visualização</Label>
                    <div className="mt-2">
                      {renderTemplatePreview({
                        ...formData,
                        id: '',
                        status: 'PENDING',
                        whatsappId: undefined,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        createdBy: { id: '', name: 'Você' },
                      } as WhatsAppTemplate)}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum template encontrado. Crie seu primeiro template para começar a automatizar mensagens.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(template.status)}
                    {getCategoryBadge(template.category)}
                  </div>
                </div>
                <CardDescription>
                  Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 line-clamp-3">
                  {template.content}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(template.content)
                      toast.success('Template copiado!')
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-visualização: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Veja como o template aparecerá no WhatsApp
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="flex justify-center">
              {renderTemplatePreview(previewTemplate)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}