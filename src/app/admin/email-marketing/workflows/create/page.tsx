'use client'

/**
 * Página de criação de workflows de email marketing
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Clock, Filter, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: string
}

interface WorkflowStep {
  templateId: string
  delayHours: number
  conditions?: {
    leadStatus?: string[]
    leadTags?: string[]
    leadSource?: string[]
  }
}

interface WorkflowTrigger {
  type: 'LEAD_CREATED' | 'STATUS_CHANGED' | 'TAG_ADDED' | 'DATE_BASED' | 'MANUAL'
  config?: {
    status?: string
    tag?: string
    dateField?: string
    daysAfter?: number
  }
}

export default function CreateWorkflowPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'LEAD_CREATED' })
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true)
      const response = await fetch('/api/email-marketing/templates')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar templates',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  const addStep = () => {
    setSteps([...steps, {
      templateId: '',
      delayHours: 0,
      conditions: {}
    }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }

  const createWorkflow = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do workflow é obrigatório',
        variant: 'destructive'
      })
      return
    }

    if (steps.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um step ao workflow',
        variant: 'destructive'
      })
      return
    }

    // Validar steps
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].templateId) {
        toast({
          title: 'Erro',
          description: `Template é obrigatório no step ${i + 1}`,
          variant: 'destructive'
        })
        return
      }
    }

    try {
      setLoading(true)
      const response = await fetch('/api/email-marketing/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          trigger,
          steps
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Workflow criado com sucesso'
        })
        router.push('/admin/email-marketing/workflows')
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao criar workflow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao criar workflow:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTriggerDescription = () => {
    switch (trigger.type) {
      case 'LEAD_CREATED':
        return 'Disparado automaticamente quando um novo lead é criado'
      case 'STATUS_CHANGED':
        return `Disparado quando o status do lead muda para: ${trigger.config?.status || 'não configurado'}`
      case 'TAG_ADDED':
        return `Disparado quando a tag "${trigger.config?.tag || 'não configurada'}" é adicionada ao lead`
      case 'DATE_BASED':
        return `Disparado ${trigger.config?.daysAfter || 0} dias após ${trigger.config?.dateField || 'não configurado'}`
      case 'MANUAL':
        return 'Disparado manualmente pelo usuário'
      default:
        return 'Configurar trigger'
    }
  }

  const getTemplateById = (templateId: string) => {
    return templates.find(t => t.id === templateId)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/email-marketing/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Workflow</h1>
          <p className="text-gray-600 mt-2">
            Configure uma automação de email marketing
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Nome e descrição do workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Workflow</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boas-vindas para novos leads"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo deste workflow"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trigger */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger (Gatilho)</CardTitle>
            <CardDescription>
              Quando este workflow deve ser executado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Trigger</Label>
              <Select
                value={trigger.type}
                onValueChange={(value) =>
                  setTrigger({ type: value as WorkflowTrigger['type'], config: {} })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_CREATED">Lead Criado</SelectItem>
                  <SelectItem value="STATUS_CHANGED">Status Alterado</SelectItem>
                  <SelectItem value="TAG_ADDED">Tag Adicionada</SelectItem>
                  <SelectItem value="DATE_BASED">Baseado em Data</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configurações específicas do trigger */}
            {trigger.type === 'STATUS_CHANGED' && (
              <div>
                <Label>Status do Lead</Label>
                <Select
                  value={trigger.config?.status || ''}
                  onValueChange={(value) =>
                    setTrigger({ ...trigger, config: { ...trigger.config, status: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                    <SelectItem value="PROPOSAL">Proposta</SelectItem>
                    <SelectItem value="WON">Ganho</SelectItem>
                    <SelectItem value="LOST">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {trigger.type === 'TAG_ADDED' && (
              <div>
                <Label>Nome da Tag</Label>
                <Input
                  value={trigger.config?.tag || ''}
                  onChange={(e) =>
                    setTrigger({ ...trigger, config: { ...trigger.config, tag: e.target.value } })
                  }
                  placeholder="Nome da tag"
                />
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {getTriggerDescription()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Steps do Workflow</CardTitle>
                <CardDescription>
                  Sequência de emails que serão enviados
                </CardDescription>
              </div>
              <Button onClick={addStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum step adicionado ainda</p>
                <p className="text-sm">Clique em "Adicionar Step" para começar</p>
              </div>
            ) : (
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        {index > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {step.delayHours}h depois
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Template de Email</Label>
                        <Select
                          value={step.templateId}
                          onValueChange={(value) => updateStep(index, 'templateId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templatesLoading ? (
                              <SelectItem value="" disabled>Carregando...</SelectItem>
                            ) : (
                              templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {step.templateId && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Assunto:</strong> {getTemplateById(step.templateId)?.subject}
                          </div>
                        )}
                      </div>

                      {index > 0 && (
                        <div>
                          <Label>Delay (horas)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={step.delayHours}
                            onChange={(e) => updateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                            placeholder="Tempo de espera em horas"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/email-marketing/workflows">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button
            onClick={createWorkflow}
            disabled={loading || !name.trim() || steps.length === 0}
          >
            {loading ? 'Criando...' : 'Criar Workflow'}
          </Button>
        </div>
      </div>
    </div>
  )
}