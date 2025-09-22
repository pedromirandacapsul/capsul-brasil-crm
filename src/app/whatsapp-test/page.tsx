'use client'

import { useState } from 'react'
import WhatsAppConnection from '@/components/whatsapp/WhatsAppConnection'
import WhatsAppInbox from '@/components/whatsapp/WhatsAppInbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Zap,
  CheckCircle,
  Smartphone
} from 'lucide-react'

export default function WhatsAppTestPage() {
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null)

  const handleAccountConnected = (accountId: string) => {
    setConnectedAccountId(accountId)
    console.log(`WhatsApp conectado! Account ID: ${accountId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" />
              Sistema WhatsApp Automatizado
            </CardTitle>
            <CardDescription className="text-green-700 text-lg">
              Conecte seu WhatsApp e comece a automatizar suas conversas
            </CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Produção Ativa
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                <Smartphone className="w-3 h-3 mr-1" />
                WhatsApp Web
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <MessageSquare className="w-3 h-3 mr-1" />
                Tempo Real
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Sistema de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-green-800">Backend API</h3>
              <p className="text-sm text-green-600">Funcionando</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-blue-800">WhatsApp Web</h3>
              <p className="text-sm text-blue-600">Pronto para conectar</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-purple-800">Interface</h3>
              <p className="text-sm text-purple-600">100% Funcional</p>
            </CardContent>
          </Card>
        </div>

        {/* Área Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conexão WhatsApp */}
          <div>
            <WhatsAppConnection onAccountConnected={handleAccountConnected} />
          </div>

          {/* Inbox (apenas se conectado) */}
          <div>
            {connectedAccountId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Inbox WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Suas conversas em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WhatsAppInbox accountId={connectedAccountId} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Conecte seu WhatsApp
                  </h3>
                  <p className="text-gray-600">
                    Para acessar suas conversas, primeiro conecte sua conta WhatsApp ao lado.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Como Usar o Sistema</CardTitle>
            <CardDescription>
              Guia passo a passo para usar a automação WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">1. Conectar WhatsApp</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Digite seu número de telefone</li>
                  <li>• Clique em "Conectar"</li>
                  <li>• Escaneie o QR Code com seu WhatsApp</li>
                  <li>• Aguarde a confirmação de conexão</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">2. Usar a Automação</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Visualize suas conversas em tempo real</li>
                  <li>• Envie e receba mensagens</li>
                  <li>• Configure automações de resposta</li>
                  <li>• Monitore o status das mensagens</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">🔧 Informações de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Servidor:</span>
                <span className="ml-2 font-mono">http://localhost:3000</span>
              </div>
              <div>
                <span className="text-gray-600">API Endpoint:</span>
                <span className="ml-2 font-mono">/api/whatsapp/test-init</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 text-green-600">✅ Online</span>
              </div>
              <div>
                <span className="text-gray-600">Conectado:</span>
                <span className="ml-2">{connectedAccountId ? '✅ Sim' : '❌ Não'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}