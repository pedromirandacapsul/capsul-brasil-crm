'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  Settings,
  Bot,
  Zap,
  BarChart3,
  Bell,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react'

interface TriggerConfig {
  status: string
  stage: string
  enabled: boolean
  requiresValue: boolean
  description: string
  priority: number
}

interface NotificationConfig {
  slack?: {
    enabled: boolean
    channel?: string
    username?: string
  }
  email?: {
    enabled: boolean
    recipients: string[]
    fromEmail?: string
  }
  inApp?: {
    enabled: boolean
    persistInDatabase: boolean
  }
}

export default function AutomationSettingsPage() {
  const [triggers, setTriggers] = useState<TriggerConfig[]>([])
  const [notifications, setNotifications] = useState<NotificationConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      setLoading(true)

      // Carregar configurações de automação
      const automationResponse = await fetch('/api/automation/config')
      const automationData = await automationResponse.json()

      if (automationData.success) {
        setTriggers(automationData.data.triggers.all || [])
      }

      // Carregar configurações de notificação
      const notificationResponse = await fetch('/api/notifications/config')
      const notificationData = await notificationResponse.json()

      if (notificationData.success) {
        setNotifications(notificationData.data.config || {})
      }

    } catch (error) {
      console.error('Error loading configurations:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar configurações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleTrigger = async (status: string, enabled: boolean) => {
    try {
      setSaving(true)

      const response = await fetch('/api/automation/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          status,
          enabled
        })
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar estado local
        setTriggers(prev => prev.map(trigger =>
          trigger.status === status
            ? { ...trigger, enabled }
            : trigger
        ))

        toast({
          title: '✅ Sucesso',
          description: `Trigger ${status} ${enabled ? 'ativado' : 'desativado'}`
        })
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Error toggling trigger:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao atualizar trigger',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationConfig = async (config: Partial<NotificationConfig>) => {
    try {
      setSaving(true)

      const response = await fetch('/api/notifications/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: { ...notifications, ...config }
        })
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => ({ ...prev, ...config }))
        toast({
          title: '✅ Sucesso',
          description: 'Configuração de notificação atualizada'
        })
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Error updating notification config:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao atualizar notificações',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async () => {
    try {
      setTesting(true)

      const response = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          testData: {
            leadName: 'Lead de Teste',
            amount: 25000,
            stage: 'PROPOSAL'
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: '🧪 Teste Enviado',
          description: 'Notificação de teste enviada com sucesso!'
        })
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Error testing notification:', error)
      toast({
        title: '❌ Erro',
        description: 'Falha ao enviar teste',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const activeTriggers = triggers.filter(t => t.enabled).length
  const totalTriggers = triggers.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Configurações de Automação
          </h1>
          <p className="text-gray-600 mt-2">
            Configure triggers de automação e notificações do sistema
          </p>
        </div>
        <Button onClick={loadConfigurations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      {/* Status Geral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-600" />
              Triggers Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeTriggers}/{totalTriggers}
            </div>
            <p className="text-xs text-gray-500">configurações ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {notifications?.slack?.enabled && (
                <Badge variant="secondary">Slack</Badge>
              )}
              {notifications?.inApp?.enabled && (
                <Badge variant="secondary">In-App</Badge>
              )}
              {notifications?.email?.enabled && (
                <Badge variant="secondary">Email</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Status Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Configurações de Triggers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Triggers de Automação
            </CardTitle>
            <CardDescription>
              Configure quais status de lead devem criar oportunidades automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {triggers.map((trigger, index) => (
              <motion.div
                key={trigger.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={trigger.enabled ? "default" : "secondary"}
                      className="font-mono"
                    >
                      {trigger.status}
                    </Badge>
                    <span className="text-sm text-gray-600">→</span>
                    <Badge variant="outline">{trigger.stage}</Badge>
                    {trigger.requiresValue && (
                      <Badge variant="destructive" className="text-xs">
                        Valor Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{trigger.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={trigger.enabled}
                    onCheckedChange={(enabled) => toggleTrigger(trigger.status, enabled)}
                    disabled={saving}
                  />
                  {trigger.enabled ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Configurações de Notificações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Configurações de Notificação
            </CardTitle>
            <CardDescription>
              Configure como e onde receber notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slack */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  Slack
                </Label>
                <Switch
                  checked={notifications?.slack?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateNotificationConfig({
                      slack: { ...notifications.slack, enabled }
                    })
                  }
                  disabled={saving}
                />
              </div>
              {notifications?.slack?.enabled && (
                <div className="ml-5 space-y-2 text-sm text-gray-600">
                  <div>Canal: <code>{notifications.slack.channel || '#vendas'}</code></div>
                  <div>Bot: <code>{notifications.slack.username || 'CRM Capsul Bot'}</code></div>
                </div>
              )}
            </div>

            <Separator />

            {/* In-App */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  Notificações In-App
                </Label>
                <Switch
                  checked={notifications?.inApp?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateNotificationConfig({
                      inApp: { ...notifications.inApp, enabled }
                    })
                  }
                  disabled={saving}
                />
              </div>
              {notifications?.inApp?.enabled && (
                <div className="ml-5 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notifications.inApp.persistInDatabase || false}
                      onCheckedChange={(persistInDatabase) =>
                        updateNotificationConfig({
                          inApp: { ...notifications.inApp, persistInDatabase }
                        })
                      }
                      disabled={saving}
                      size="sm"
                    />
                    <span>Salvar no banco de dados</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  Email
                  <Badge variant="outline" className="text-xs">Em breve</Badge>
                </Label>
                <Switch
                  checked={notifications?.email?.enabled || false}
                  onCheckedChange={(enabled) =>
                    updateNotificationConfig({
                      email: { ...notifications.email, enabled }
                    })
                  }
                  disabled={true} // Desabilitado por enquanto
                />
              </div>
            </div>

            <Separator />

            {/* Teste de Notificação */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Testar Notificações</div>
                  <div className="text-sm text-blue-700">
                    Envie uma notificação de teste para verificar as configurações
                  </div>
                </div>
              </div>
              <Button
                onClick={testNotification}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                {testing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Testar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Informações do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              • <strong>Triggers críticos:</strong> QUALIFIED, PROPOSAL, WON, LOST devem permanecer ativos
            </div>
            <div>
              • <strong>Valor obrigatório:</strong> PROPOSAL requer valor para criar oportunidade
            </div>
            <div>
              • <strong>Notificações:</strong> Slack requer webhook configurado no .env
            </div>
            <div>
              • <strong>Performance:</strong> Sistema processa automações em tempo real
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}