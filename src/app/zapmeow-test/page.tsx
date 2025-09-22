'use client'

import { useState, useEffect } from 'react'

interface ZapMeowStatus {
  connected: boolean
  phone?: string
  lastSeen?: string
}

interface QRCodeData {
  qrcode: string
}

export default function ZapMeowTestPage() {
  const [instanceId, setInstanceId] = useState('MINHA_INSTANCIA')
  const [status, setStatus] = useState<ZapMeowStatus | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [qrCodeImage, setQrCodeImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Formulário de teste
  const [testForm, setTestForm] = useState({
    phone: '5537991361002',
    text: 'Teste ZapMeow funcionando! 🚀'
  })

  // Buscar status da instância
  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8900/api/${instanceId}/status`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        setResults({ type: 'status', data: data })
      } else {
        setStatus({ connected: false })
        setResults({ type: 'status', data: { connected: false, error: 'Falha ao conectar' } })
      }
    } catch (error) {
      console.error('Erro buscando status:', error)
      setStatus({ connected: false })
      setResults({ type: 'error', data: { error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  // Buscar QR Code
  const fetchQRCode = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8900/api/${instanceId}/qrcode`)
      if (response.ok) {
        const data: QRCodeData = await response.json()
        const qrString = data.qrcode || ''
        setQrCode(qrString)
        setResults({ type: 'qrcode', data: { qrcode: qrString.substring(0, 100) + '...' } })

        // Gerar QR Code visual (simples)
        if (qrString) {
          try {
            // Dynamic import para evitar problemas SSR
            const QRCode = await import('qrcode')
            const qrDataURL = await QRCode.toDataURL(qrString, {
              width: 300,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            setQrCodeImage(qrDataURL)
          } catch (qrError) {
            console.error('Erro gerando QR visual:', qrError)
            setQrCodeImage('')
          }
        }
      }
    } catch (error) {
      console.error('Erro buscando QR code:', error)
      setResults({ type: 'error', data: { error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  // Disparar funil de teste
  const triggerTestFunnel = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8900/api/${instanceId}/funnel/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testForm.phone,
          funnelId: 'teste_frontend',
          funnelData: {
            funnelId: 'teste_frontend',
            instanceId: instanceId
          },
          leadData: {
            nome: 'Teste Frontend',
            origem: 'Página de Teste ZapMeow'
          }
        })
      })

      const result = await response.json()
      setResults({ type: 'funnel_trigger', data: result })
    } catch (error) {
      console.error('Erro disparando funil:', error)
      setResults({ type: 'error', data: { error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  // Enviar mensagem de teste
  const sendTestMessage = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8900/api/${instanceId}/funnel/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testForm.phone,
          text: testForm.text,
          funnelId: 'teste_frontend',
          stepId: 'etapa_teste',
          messageType: 'text'
        })
      })

      const result = await response.json()
      setResults({ type: 'message_send', data: result })
    } catch (error) {
      console.error('Erro enviando mensagem:', error)
      setResults({ type: 'error', data: { error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ZapMeow - Teste Frontend</h1>
              <p className="text-gray-600">Interface de teste para o sistema ZapMeow</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {status?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Backend: http://localhost:8900
            </div>
          </div>
        </div>

        {/* Configuração */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuração da Instância</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID da Instância
              </label>
              <input
                type="text"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MINHA_INSTANCIA"
              />
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Verificar Status'}
            </button>
          </div>
        </div>

        {/* Testes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* QR Code */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">QR Code para WhatsApp</h3>
            <button
              onClick={fetchQRCode}
              disabled={loading}
              className="w-full mb-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Gerar QR Code'}
            </button>

            {qrCodeImage && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img src={qrCodeImage} alt="QR Code" className="max-w-48 max-h-48" />
              </div>
            )}
          </div>

          {/* Formulário de Teste */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Testes de Mensagem</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone de Teste
                </label>
                <input
                  type="text"
                  value={testForm.phone}
                  onChange={(e) => setTestForm({...testForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5537991361002"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Teste
                </label>
                <textarea
                  value={testForm.text}
                  onChange={(e) => setTestForm({...testForm, text: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Mensagem de teste..."
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={triggerTestFunnel}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Disparar Funil'}
                </button>

                <button
                  onClick={sendTestMessage}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              Resultado: {results.type === 'error' ? '❌ Erro' : '✅ Sucesso'}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Info do Sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-blue-800">ZapMeow Backend:</strong>
              <span className="ml-2">http://localhost:8900</span>
            </div>
            <div>
              <strong className="text-blue-800">Next.js Frontend:</strong>
              <span className="ml-2">http://localhost:3005</span>
            </div>
            <div>
              <strong className="text-blue-800">Webhook URL:</strong>
              <span className="ml-2">http://localhost:3003/api/whatsapp/webhook</span>
            </div>
            <div>
              <strong className="text-blue-800">Status Integration:</strong>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">
                🎉 Funcionando
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}