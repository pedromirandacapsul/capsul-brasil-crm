'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Clock,
  User,
  MessageCircle,
  Edit,
  Save,
  X,
  Activity,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  roleTitle: string | null
  status: string
  score: number
  source: string | null
  interest: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string | null
  owner: {
    id: string
    name: string
    email: string
  } | null
  activities: Array<{
    id: string
    type: string
    payload: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: string
    priority: string
    dueDate: string | null
    createdAt: string
    assignee: {
      id: string
      name: string
      email: string
    } | null
    creator: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    activities: number
    tasks: number
  }
}

const statusOptions = [
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'PROPOSAL', label: 'Proposta' },
  { value: 'WON', label: 'Ganho' },
  { value: 'LOST', label: 'Perdido' },
]

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  WON: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-red-100 text-red-800',
}

export default function LeadDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    roleTitle: '',
    status: '',
    score: 0,
    interest: '',
    notes: '',
  })

  const fetchLead = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data.data)
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          company: data.data.company || '',
          roleTitle: data.data.roleTitle || '',
          status: data.data.status || '',
          score: data.data.score || 0,
          interest: data.data.interest || '',
          notes: data.data.notes || '',
        })
      } else {
        router.push('/admin/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      router.push('/admin/leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchLead()
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating lead:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        roleTitle: lead.roleTitle || '',
        status: lead.status || '',
        score: lead.score || 0,
        interest: lead.interest || '',
        notes: lead.notes || '',
      })
    }
    setEditing(false)
  }

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  if (!session) return null

  const userRole = session.user.role
  const canEdit = hasPermission(userRole, PERMISSIONS.LEADS_UPDATE)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lead não encontrado</h1>
          <Button onClick={() => router.push('/admin/leads')} className="mt-4">
            Voltar para Leads
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/leads')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600">Detalhes do lead</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusColors[lead.status]}>
            {statusOptions.find(s => s.value === lead.status)?.label}
          </Badge>
          {canEdit && !editing && (
            <Button onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {editing && (
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{lead.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="roleTitle">Cargo</Label>
                {editing ? (
                  <Input
                    id="roleTitle"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{lead.roleTitle || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{lead.email || '-'}</span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{lead.phone || '-'}</span>
                    </div>
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 p-1 rounded"
                        title="Contatar via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="company">Empresa</Label>
              {editing ? (
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              ) : (
                <div className="flex items-center space-x-2 mt-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{lead.company || '-'}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                {editing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={statusColors[lead.status]}>
                      {statusOptions.find(s => s.value === lead.status)?.label}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="score">Score</Label>
                {editing ? (
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">{lead.score}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="interest">Interesse</Label>
              {editing ? (
                <Input
                  id="interest"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{lead.interest || '-'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              {editing ? (
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{lead.notes || '-'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata and Activities */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Origem</Label>
                  <p className="text-sm text-gray-900 mt-1">{lead.source || '-'}</p>
                </div>
                <div>
                  <Label>Responsável</Label>
                  {lead.owner ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{lead.owner.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">-</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Criado em</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Última atividade</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {lead.lastActivityAt
                        ? new Date(lead.lastActivityAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Atividades</Label>
                  <p className="text-sm text-gray-900 mt-1">{lead._count.activities}</p>
                </div>
                <div>
                  <Label>Tarefas</Label>
                  <p className="text-sm text-gray-900 mt-1">{lead._count.tasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length > 0 ? (
                <div className="space-y-3">
                  {lead.activities.slice(0, 5).map((activity) => {
                    const payload = JSON.parse(activity.payload)
                    return (
                      <div key={activity.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{payload.message}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">{activity.user.name}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma atividade registrada</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}