'use client'

import { useState, useEffect } from 'react'
import { Plus, Mail, TrendingUp, Users, Send, TestTube, CheckCircle, XCircle, Zap } from 'lucide-react'
import Link from 'next/link'

interface EmailMetrics {
  totalCampaigns: number
  totalEmailsSent: number
  avgOpenRate: number
  avgClickRate: number
  activeTemplates: number
}

export default function EmailMarketingPage() {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalCampaigns: 0,
    totalEmailsSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    activeTemplates: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/email/metrics')
      const result = await response.json()
      if (result.success) {
        setMetrics(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Marketing</h1>
          <p className="text-gray-600">Gerencie campanhas, templates e acompanhe as métricas dos seus envios</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCampaigns}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalEmailsSent.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Abertura</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgOpenRate.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Clique</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgClickRate.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeTemplates}</p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/email-marketing/templates"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Crie e gerencie templates de email reutilizáveis</p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              Gerenciar Templates
            </div>
          </Link>

          <Link
            href="/admin/email-marketing/campaigns"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campanhas</h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Send className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Configure e envie campanhas de email marketing</p>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              Nova Campanha
            </div>
          </Link>

          <Link
            href="/admin/email-marketing/workflows"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Crie automações inteligentes para leads</p>
            <div className="flex items-center text-orange-600 text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              Gerenciar Workflows
            </div>
          </Link>

          <Link
            href="/admin/email-marketing/analytics"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Acompanhe métricas detalhadas das suas campanhas</p>
            <div className="flex items-center text-purple-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              Ver Analytics
            </div>
          </Link>

          <Link
            href="/admin/sales/scheduled-emails"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Automação de Vendas</h3>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Monitore emails automáticos e atividades de vendas</p>
            <div className="flex items-center text-yellow-600 text-sm font-medium">
              <Zap className="w-4 h-4 mr-1" />
              Ver Dashboard
            </div>
          </Link>

          <Link
            href="/admin/sales/templates"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Templates de Vendas</h3>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-gray-600 mb-4">Gerencie templates para propostas e follow-ups</p>
            <div className="flex items-center text-red-600 text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />
              Gerenciar Templates
            </div>
          </Link>
        </div>

        {/* Status do Sistema */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">API de Email: Operacional</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Base de Dados: Conectada</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Templates: {metrics.activeTemplates} ativos</span>
            </div>
          </div>

          {/* Teste de Configuração SMTP */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">🧪 Teste de Configuração SMTP</h4>
            <TestEmailConfiguration />
          </div>
        </div>
      </div>
    </div>
  )
}

function TestEmailConfiguration() {
  const [email, setEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult({
        success: data.success,
        message: data.success ? data.message : data.error
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao realizar teste'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleTest} className="flex gap-2">
        <input
          type="email"
          placeholder="seu-email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={testing || !email}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Testando...
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4" />
              Testar Envio
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`p-3 rounded-md flex items-center gap-2 ${
          result.success
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm">{result.message}</span>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>💡 <strong>Dica:</strong> Configure um provedor SMTP real (Gmail, SendGrid) para envios em produção.</p>
        <p>📧 Para desenvolvimento, use Mailhog em localhost:1025</p>
      </div>
    </div>
  )
}