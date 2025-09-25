'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Mail, User, AlertCircle } from 'lucide-react'

interface ScheduledEmail {
  id: string
  to: string
  subject: string
  html: string
  scheduledAt: string
  status: string
  attempts: number
  lastAttempt: string | null
  createdAt: string
  opportunity?: {
    id: string
    stage: string
    lead: {
      name: string
      company: string
    }
  }
}

interface SalesActivity {
  id: string
  opportunityId: string
  type: string
  description: string
  createdAt: string
  opportunity: {
    lead: {
      name: string
      company: string
    }
    stage: string
  }
}

export default function ScheduledEmailsPage() {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [salesActivities, setSalesActivities] = useState<SalesActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar emails agendados
      const emailsResponse = await fetch('/api/sales/scheduled-emails')
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json()
        setScheduledEmails(emailsData.data || [])
      }

      // Buscar atividades de vendas
      const activitiesResponse = await fetch('/api/sales/activities')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setSalesActivities(activitiesData.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados de automação...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automação de Vendas</h1>
          <p className="text-gray-600">Emails agendados e atividades de automação</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {scheduledEmails.filter(e => e.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
                <p className="text-2xl font-bold text-green-600">
                  {scheduledEmails.filter(e => e.status === 'SENT').length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-2xl font-bold text-red-600">
                  {scheduledEmails.filter(e => e.status === 'FAILED').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automações</p>
                <p className="text-2xl font-bold text-blue-600">
                  {salesActivities.filter(a => a.type === 'STAGE_AUTOMATION').length}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emails Agendados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Emails Agendados ({scheduledEmails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum email agendado encontrado</p>
              <p className="text-sm text-gray-400">Execute uma automação para ver emails aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledEmails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{email.to}</span>
                        <Badge className={getStatusColor(email.status)}>
                          {email.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{email.subject}</p>
                      {email.opportunity && (
                        <p className="text-sm text-gray-600 mb-2">
                          {email.opportunity.lead.name} - {email.opportunity.lead.company}
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            {email.opportunity.stage}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Agendado: {formatDate(email.scheduledAt)}
                        </div>
                        <div>Tentativas: {email.attempts}</div>
                        {email.lastAttempt && (
                          <div>Última tentativa: {formatDate(email.lastAttempt)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividades de Automação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Atividades de Automação ({salesActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesActivities.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma atividade de automação encontrada</p>
              <p className="text-sm text-gray-400">Mude o estágio de uma oportunidade para gerar atividades</p>
            </div>
          ) : (
            <div className="space-y-4">
              {salesActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{activity.type}</Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{activity.description}</p>
                      <p className="text-sm text-gray-600">
                        {activity.opportunity.lead.name} - {activity.opportunity.lead.company}
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {activity.opportunity.stage}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}