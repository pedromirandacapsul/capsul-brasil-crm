'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Settings, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface FeatureFlag {
  id: string
  name: string
  description: string | null
  enabled: boolean
  config: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/feature-flags')
      if (response.ok) {
        const data = await response.json()
        setFlags(data.data)
      } else {
        toast.error('Erro ao carregar feature flags')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const toggleFlag = async (flagName: string, enabled: boolean) => {
    setUpdating(flagName)
    try {
      const flag = flags.find(f => f.name === flagName)
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flagName,
          enabled,
          description: flag?.description,
          config: flag?.config,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFlags(prev =>
          prev.map(f => f.name === flagName ? data.data : f)
        )
        toast.success(data.message)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar feature flag')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setUpdating(null)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_cache' }),
      })

      if (response.ok) {
        toast.success('Cache limpo com sucesso')
      } else {
        toast.error('Erro ao limpar cache')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const getFlagIcon = (name: string) => {
    const icons = {
      ads_integration: '📊',
      auto_lead_scoring: '🎯',
      advanced_pipeline: '🔄',
      inbox_whatsapp: '💬',
      inbox_email: '📧',
      workflow_automation: '⚡',
      calendar_integration: '📅',
      heatmap_tracking: '🔥',
      internal_chat: '💬',
      email_campaigns: '📮',
      sales_celebration: '🎉',
    }
    return icons[name as keyof typeof icons] || '⚙️'
  }

  const getCategoryFlags = (category: string) => {
    const categories = {
      integrations: ['ads_integration', 'calendar_integration'],
      lead_management: ['auto_lead_scoring', 'advanced_pipeline'],
      communication: ['inbox_whatsapp', 'inbox_email', 'email_campaigns'],
      automation: ['workflow_automation'],
      analytics: ['heatmap_tracking'],
      collaboration: ['internal_chat'],
      gamification: ['sales_celebration'],
    }

    return flags.filter(flag =>
      categories[category as keyof typeof categories]?.includes(flag.name)
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">
            Controle as funcionalidades do sistema de forma segura
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCache}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Cache
          </Button>
          <Button onClick={fetchFlags}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          As feature flags permitem ativar/desativar funcionalidades sem deploy.
          Mudanças têm cache de 5 minutos.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="lead_management">Leads</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
          <TabsTrigger value="gamification">Gamificação</TabsTrigger>
        </TabsList>

        {['integrations', 'lead_management', 'communication', 'automation', 'analytics', 'collaboration', 'gamification'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getCategoryFlags(category).map((flag) => (
                <Card key={flag.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getFlagIcon(flag.name)}</span>
                        <div>
                          <CardTitle className="text-lg">
                            {flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </CardTitle>
                          <Badge variant={flag.enabled ? 'default' : 'secondary'} className="mt-1">
                            {flag.enabled ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Ativa
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Inativa
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        disabled={updating === flag.name}
                        onCheckedChange={(checked) => toggleFlag(flag.name, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {flag.description || 'Sem descrição disponível'}
                    </CardDescription>
                    {flag.config && (
                      <div className="mt-3 p-2 bg-muted rounded text-xs">
                        <strong>Config:</strong> {Object.keys(flag.config).length} parâmetros
                      </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizada: {new Date(flag.updatedAt).toLocaleString('pt-BR')}
                    </div>
                  </CardContent>
                  {updating === flag.name && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Resumo das funcionalidades ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {flags.filter(f => f.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {flags.filter(f => !f.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Inativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {flags.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}