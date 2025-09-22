'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  QrCode,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react'

interface WhatsAppAccount {
  id: string
  phoneNumber: string
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  displayName?: string
  qrCode?: string
  lastHeartbeat?: string
}

interface WhatsAppConnectionProps {
  onAccountConnected?: (accountId: string) => void
}

export default function WhatsAppConnection({ onAccountConnected }: WhatsAppConnectionProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [currentQR, setCurrentQR] = useState<string | null>(null)
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)
  const [monitoring, setMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/whatsapp/test-init')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const initializeWhatsApp = async () => {
    if (!phoneNumber.trim()) {
      setError('Por favor, insira um número de telefone')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentQR(null)

    try {
      const response = await fetch('/api/whatsapp/test-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na inicialização')
      }

      if (data.success) {
        setCurrentAccountId(data.accountId)
        setCurrentQR(data.qrCode)
        setMonitoring(true)

        // Iniciar monitoramento da conexão
        startConnectionMonitoring(data.accountId)

        // Atualizar lista
        await loadAccounts()
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const startConnectionMonitoring = (accountId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/debug/qr?accountId=${accountId}`)
        if (response.ok) {
          const data = await response.json()

          if (data.account?.status === 'CONNECTED') {
            setMonitoring(false)
            setCurrentQR(null)
            await loadAccounts()
            onAccountConnected?.(accountId)
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Erro no monitoramento:', error)
      }
    }, 2000)

    // Limpar depois de 5 minutos
    setTimeout(() => {
      clearInterval(interval)
      setMonitoring(false)
    }, 300000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
      case 'CONNECTING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Conectando</Badge>
      case 'DISCONNECTED':
        return <Badge variant="secondary"><WifiOff className="w-3 h-3 mr-1" />Desconectado</Badge>
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>
            Conecte seu WhatsApp Web para começar a usar a automação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Digite seu número (ex: 37991737234)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || monitoring}
            />
            <Button
              onClick={initializeWhatsApp}
              disabled={loading || monitoring}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </div>

          {currentQR && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <CardTitle className="text-green-800 flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Gerado!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Escaneie este QR Code com seu WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={currentQR}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 border border-green-300 rounded-lg shadow-sm"
                  />
                </div>

                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Como escanear:</h4>
                  <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Vá em Menu {'>'} Dispositivos conectados</li>
                    <li>Toque em "Conectar um dispositivo"</li>
                    <li>Escaneie este QR Code</li>
                  </ol>
                </div>

                {monitoring && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Aguardando conexão...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Contas WhatsApp
              </span>
              <Button variant="outline" size="sm" onClick={loadAccounts}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Status das suas conexões WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{formatPhoneNumber(account.phoneNumber)}</div>
                      {account.displayName && (
                        <div className="text-sm text-gray-600">{account.displayName}</div>
                      )}
                      {account.lastHeartbeat && (
                        <div className="text-xs text-gray-500">
                          Último ping: {new Date(account.lastHeartbeat).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(account.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}