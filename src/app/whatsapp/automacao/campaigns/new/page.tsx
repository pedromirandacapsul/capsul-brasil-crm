'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Send,
  Users,
  Calendar,
  MessageSquare,
  Upload,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  category: string
  content: string
  variables?: string
  status: string
}

interface WhatsAppAccount {
  id: string
  phoneNumber: string
  displayName?: string
  status: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
    templateId: '',
    accountId: '',
    targetType: 'MANUAL' as 'MANUAL' | 'SEGMENTED' | 'ALL_CONTACTS',
    targetNumbers: '',
    scheduleType: 'IMMEDIATE' as 'IMMEDIATE' | 'SCHEDULED',
    scheduledAt: '',
    variables: {} as Record<string, string>
  })

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewContent, setPreviewContent] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find(t => t.id === formData.templateId)
      setSelectedTemplate(template || null)
      generatePreview(template)
    }
  }, [formData.templateId, formData.variables, templates])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)

      // Load templates
      const templatesResponse = await fetch('/api/whatsapp/templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setTemplates(templatesData.templates || [])
      } else {
        // Mock templates for development
        setTemplates([
          {
            id: '1',
            name: 'template_boas_vindas',
            category: 'PERSONAL',
            content: 'Olá {1}! 👋\n\nSeja muito bem-vindo(a)! Estamos felizes em tê-lo(a) conosco.\n\nSe tiver alguma dúvida, estarei aqui para ajudar!',
            variables: JSON.stringify([{ name: 'nome', example: 'João' }]),
            status: 'ACTIVE'
          },
          {
            id: '2',
            name: 'template_promocao',
            category: 'BUSINESS',
            content: '🔥 Oferta Especial!\n\nOlá {1}!\n\nApenas hoje: {2}% OFF em todos os produtos!\n\nNão perca essa oportunidade!',
            variables: JSON.stringify([
              { name: 'nome', example: 'Maria' },
              { name: 'desconto', example: '30' }
            ]),
            status: 'ACTIVE'
          }
        ])
      }

      // Load WhatsApp accounts
      const accountsResponse = await fetch('/api/whatsapp/accounts')
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        setAccounts(accountsData.accounts || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setLoadingData(false)
    }
  }

  const generatePreview = (template: Template | undefined) => {
    if (!template) {
      setPreviewContent('')
      return
    }

    let content = template.content

    // Replace variables with form values or examples
    try {
      const variables = JSON.parse(template.variables || '[]')
      variables.forEach((variable: any, index: number) => {
        const placeholder = `{${index + 1}}`
        const value = formData.variables[variable.name] || variable.example || placeholder
        content = content.replace(new RegExp(`\\{${index + 1}\\}`, 'g'), value)
      })
    } catch (error) {
      console.error('Erro ao processar variáveis:', error)
    }

    setPreviewContent(content)
  }

  const handleVariableChange = (variableName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.campaignName || !formData.templateId || !formData.accountId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.targetType === 'MANUAL' && !formData.targetNumbers.trim()) {
      toast.error('Digite pelo menos um número de telefone')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          targetNumbers: formData.targetType === 'MANUAL'
            ? formData.targetNumbers.split('\n').map(n => n.trim()).filter(n => n)
            : []
        })
      })

      if (response.ok) {
        toast.success('Campanha criada com sucesso!')
        router.push('/whatsapp/automacao/campaigns')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar campanha')
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const parseTemplateVariables = (template: Template | null) => {
    if (!template || !template.variables) return []

    try {
      return JSON.parse(template.variables)
    } catch {
      return []
    }
  }

  const connectedAccounts = accounts.filter(acc => acc.status === 'CONNECTED')

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/whatsapp/automacao/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Campanha</h1>
          <p className="text-gray-600">Configure uma nova campanha de mensagens em massa</p>
        </div>
      </div>

      {/* Alert para contas conectadas */}
      {connectedAccounts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma conta WhatsApp conectada encontrada.
            <Link href="/admin/whatsapp" className="ml-1 text-blue-600 hover:underline">
              Conecte uma conta primeiro
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações da Campanha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Configurações da Campanha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Nome da Campanha *</Label>
                <Input
                  id="campaignName"
                  placeholder="Ex: Campanha Black Friday"
                  value={formData.campaignName}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo desta campanha..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Conta WhatsApp *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.phoneNumber} {account.displayName && `(${account.displayName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Template de Mensagem *</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Link href="/whatsapp/automacao/templates" className="text-blue-600 hover:underline">
                      Crie templates primeiro
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview do Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview da Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* Variáveis do template */}
                  {parseTemplateVariables(selectedTemplate).length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Variáveis do Template:</Label>
                      {parseTemplateVariables(selectedTemplate).map((variable: any, index: number) => (
                        <div key={index}>
                          <Label className="text-xs text-gray-600">
                            {variable.name} (exemplo: {variable.example})
                          </Label>
                          <Input
                            placeholder={variable.example}
                            value={formData.variables[variable.name] || ''}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview da mensagem */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="bg-white rounded-lg shadow-sm p-3">
                      <div className="text-sm whitespace-pre-wrap">
                        {previewContent || selectedTemplate.content}
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Preview da mensagem no WhatsApp</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Selecione um template para ver o preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuração de Público */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Público-Alvo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Público</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, targetType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">
                    <div>
                      <div className="font-medium">Manual</div>
                      <div className="text-xs text-gray-500">Digite os números manualmente</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="SEGMENTED">
                    <div>
                      <div className="font-medium">Segmentado</div>
                      <div className="text-xs text-gray-500">Baseado em filtros (em desenvolvimento)</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ALL_CONTACTS">
                    <div>
                      <div className="font-medium">Todos os Contatos</div>
                      <div className="text-xs text-gray-500">Todos os contatos da base</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.targetType === 'MANUAL' && (
              <div>
                <Label htmlFor="targetNumbers">
                  Números de Telefone *
                  <span className="text-xs text-gray-500 ml-2">(um por linha, com código do país)</span>
                </Label>
                <Textarea
                  id="targetNumbers"
                  placeholder="37991737234&#10;5511999999999&#10;5511888888888"
                  value={formData.targetNumbers}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetNumbers: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total de números: {formData.targetNumbers.split('\n').filter(n => n.trim()).length}
                </p>
              </div>
            )}

            {formData.targetType === 'SEGMENTED' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Funcionalidade de segmentação em desenvolvimento. Use "Manual" por enquanto.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Quando enviar</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Enviar Agora</div>
                        <div className="text-xs text-gray-500">Inicia imediatamente após criação</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="SCHEDULED">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Agendar</div>
                        <div className="text-xs text-gray-500">Escolha data e hora específica</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scheduleType === 'SCHEDULED' && (
              <div>
                <Label htmlFor="scheduledAt">Data e Hora do Envio</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Link href="/whatsapp/automacao/campaigns">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || connectedAccounts.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Campanha
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}