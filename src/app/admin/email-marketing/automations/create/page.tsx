'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Mail,
  Clock,
  Zap,
  Users,
  Calendar,
  MousePointer,
  TrendingUp,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  subject: string
}

interface Step {
  id: string
  type: string
  templateId: string
  delayHours: number
  conditions: any
}

export default function CreateAutomationPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: '',
    conditions: {},
    steps: [] as Step[]
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const addStep = () => {
    const newStep: Step = {
      id: `step_${Date.now()}`,
      type: 'EMAIL',
      templateId: '',
      delayHours: 0,
      conditions: {}
    }
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const removeStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }))
  }

  const updateStep = (stepId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.triggerType) {
      alert('Por favor, preencha nome e tipo de trigger')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/email-marketing/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          triggerType: formData.triggerType,
          conditions: formData.conditions,
          steps: formData.steps.map((step, index) => ({
            type: step.type,
            templateId: step.templateId || null,
            delayHours: step.delayHours,
            conditions: step.conditions
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Automação criada com sucesso!')
        router.push('/admin/email-marketing/automations')
      } else {
        alert('Erro ao criar automação: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao criar automação')
    } finally {
      setSaving(false)
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'LEAD_CREATED': return <Users className="h-4 w-4" />
      case 'STATUS_CHANGED': return <TrendingUp className="h-4 w-4" />
      case 'TAG_ADDED': return <Zap className="h-4 w-4" />
      case 'DATE_BASED': return <Calendar className="h-4 w-4" />
      case 'MANUAL': return <MousePointer className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/email-marketing/automations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nova Automação</h1>
              <p className="text-gray-600">Crie uma automação comportamental personalizada</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Automação *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Re-engajamento Leads Inativos"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo desta automação..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="triggerType">Tipo de Trigger *</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, triggerType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gatilho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_CREATED">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Novo Lead Criado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="STATUS_CHANGED">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Mudança de Status</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="TAG_ADDED">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Tag Adicionada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="DATE_BASED">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Baseado em Data</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MANUAL">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="h-4 w-4" />
                      <span>Trigger Manual</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Steps da Automação</CardTitle>
              <Button onClick={addStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.steps.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhum step configurado</p>
                <Button onClick={addStep} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Step
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h4 className="font-medium">Step {index + 1}</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Template de Email</Label>
                        <Select
                          value={step.templateId}
                          onValueChange={(value) => updateStep(step.id, 'templateId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} - {template.subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Delay (horas)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delayHours}
                          onChange={(e) => updateStep(step.id, 'delayHours', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/email-marketing/automations">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Criando...' : 'Criar Automação'}
          </Button>
        </div>
      </div>
    </div>
  )
}