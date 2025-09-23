'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  X,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  Bell,
  BellOff,
  Minimize2,
  Maximize2
} from 'lucide-react'

interface PerformanceAlert {
  id?: string
  type: 'low_conversion' | 'high_value_deal' | 'pipeline_stale' | 'quota_achievement'
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  userId?: string
  value?: number
  threshold?: number
  recommendation?: string
  createdAt?: Date
  dismissed?: boolean
}

interface PerformanceAlertsProps {
  refreshInterval?: number // em milissegundos, padrão 30 segundos
  showDismissed?: boolean
  maxAlerts?: number
  position?: 'fixed' | 'relative'
}

export function PerformanceAlerts({
  refreshInterval = 30000,
  showDismissed = false,
  maxAlerts = 5,
  position = 'relative'
}: PerformanceAlertsProps) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  useEffect(() => {
    if (alertsEnabled) {
      loadAlerts()
      const interval = setInterval(loadAlerts, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [alertsEnabled, refreshInterval])

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard?type=alerts')
      const data = await response.json()

      if (data.success) {
        const alertsWithId = data.data.alerts.map((alert: PerformanceAlert, index: number) => ({
          ...alert,
          id: `alert-${Date.now()}-${index}`,
          createdAt: new Date()
        }))

        // Filtrar alertas já dispensados
        const activeAlerts = alertsWithId.filter((alert: PerformanceAlert) =>
          !dismissedAlerts.includes(alert.id!)
        )

        setAlerts(activeAlerts.slice(0, maxAlerts))

        // Notificar novos alertas críticos
        const criticalAlerts = activeAlerts.filter((alert: PerformanceAlert) =>
          alert.severity === 'high' && !alerts.some(existing => existing.title === alert.title)
        )

        if (criticalAlerts.length > 0) {
          toast({
            title: '🚨 Alerta Crítico',
            description: `${criticalAlerts.length} alerta(s) de performance detectado(s)`,
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))

    toast({
      title: '✅ Alerta Dispensado',
      description: 'O alerta foi removido da lista'
    })
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          badgeVariant: 'destructive' as const
        }
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: TrendingDown,
          iconColor: 'text-yellow-600',
          badgeVariant: 'secondary' as const
        }
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: TrendingUp,
          iconColor: 'text-blue-600',
          badgeVariant: 'outline' as const
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertTriangle,
          iconColor: 'text-gray-600',
          badgeVariant: 'outline' as const
        }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_conversion': return Users
      case 'high_value_deal': return DollarSign
      case 'pipeline_stale': return Clock
      case 'quota_achievement': return Target
      default: return AlertTriangle
    }
  }

  if (!alertsEnabled) {
    return (
      <div className={`${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}`}>
        <Button
          onClick={() => setAlertsEnabled(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-md"
        >
          <BellOff className="h-4 w-4 mr-2" />
          Ativar Alertas
        </Button>
      </div>
    )
  }

  if (loading) {
    return null
  }

  if (alerts.length === 0) {
    return (
      <div className={`${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}`}>
        <Card className="w-80 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-green-800">Sistema OK</div>
                <div className="text-sm text-green-600">Nenhum alerta ativo</div>
              </div>
              <Button
                onClick={() => setAlertsEnabled(false)}
                variant="ghost"
                size="sm"
              >
                <BellOff className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''} space-y-3`}>
      {/* Header de Controle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            {alerts.length} Alerta(s) Ativo(s)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => setAlertsEnabled(false)}
            variant="ghost"
            size="sm"
          >
            <BellOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de Alertas */}
      <AnimatePresence>
        {!isMinimized && alerts.map((alert, index) => {
          const severityConfig = getSeverityConfig(alert.severity)
          const TypeIcon = getTypeIcon(alert.type)
          const SeverityIcon = severityConfig.icon

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`w-80 ${severityConfig.color} border-2 shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/50`}>
                        <SeverityIcon className={`h-4 w-4 ${severityConfig.iconColor}`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{alert.title}</div>
                        <Badge variant={severityConfig.badgeVariant} className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => dismissAlert(alert.id!)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm mb-2">{alert.message}</p>

                    {alert.value && alert.threshold && (
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          <span>Atual: {alert.value}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>Meta: {alert.threshold}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {alert.recommendation && (
                    <div className="bg-white/30 rounded p-2 text-xs">
                      <div className="font-medium mb-1">💡 Recomendação:</div>
                      <div>{alert.recommendation}</div>
                    </div>
                  )}

                  {alert.createdAt && (
                    <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.createdAt.toLocaleTimeString('pt-BR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Indicador de Mais Alertas */}
      {alerts.length >= maxAlerts && (
        <Card className="w-80 bg-gray-100 border-gray-200">
          <CardContent className="p-3 text-center">
            <div className="text-sm text-gray-600">
              + alertas disponíveis no dashboard completo
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}