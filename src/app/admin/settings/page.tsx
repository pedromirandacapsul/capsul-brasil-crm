'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Settings,
  Mail,
  Database,
  Shield,
  Bell,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Bot,
  TestTube,
  XCircle,
  Eye,
  EyeOff,
  HelpCircle,
  Zap,
  Loader2,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // General Settings
  const [companyName, setCompanyName] = useState('Capsul Brasil')
  const [companyEmail, setCompanyEmail] = useState('contato@grupocapsul.com.br')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [language, setLanguage] = useState('pt-BR')

  // Email Settings
  const [emailProvider, setEmailProvider] = useState('mailhog')
  const [smtpHost, setSmtpHost] = useState('localhost')
  const [smtpPort, setSmtpPort] = useState('1025')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [smtpFrom, setSmtpFrom] = useState('noreply@capsul.com.br')
  const [smtpFromName, setSmtpFromName] = useState('Capsul Brasil CRM')
  const [sendgridApiKey, setSendgridApiKey] = useState('')
  const [awsRegion, setAwsRegion] = useState('us-east-1')
  const [awsSesAccessKey, setAwsSesAccessKey] = useState('')
  const [awsSesSecretKey, setAwsSesSecretKey] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [leadNotifications, setLeadNotifications] = useState(true)
  const [taskNotifications, setTaskNotifications] = useState(true)
  const [systemNotifications, setSystemNotifications] = useState(false)

  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState('24')
  const [passwordPolicy, setPasswordPolicy] = useState('medium')
  const [auditLogs, setAuditLogs] = useState(true)
  const [ipWhitelist, setIpWhitelist] = useState('')

  // System Settings
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [dataRetention, setDataRetention] = useState('365')
  const [backupFrequency, setBackupFrequency] = useState('daily')

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simular salvamento das configurações
      const emailSettings = {
        provider: emailProvider,
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        password: smtpPassword,
        secure: smtpSecure,
        from: smtpFrom,
        fromName: smtpFromName,
        sendgridApiKey: sendgridApiKey,
        awsRegion: awsRegion,
        awsSesAccessKey: awsSesAccessKey,
        awsSesSecretKey: awsSesSecretKey
      }

      // Em uma implementação real, você salvaria no banco de dados
      console.log('Salvando configurações de email:', emailSettings)

      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) return

    setTestLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao realizar teste'
      })
    } finally {
      setTestLoading(false)
    }
  }

  if (!session) return null

  const userRole = session.user.role

  if (!hasPermission(userRole, PERMISSIONS.SYSTEM_ADMIN)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">
            Gerencie as configurações do sistema e preferências
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Quick Access to Automation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configurações de Automação
              </h3>
              <p className="text-sm text-blue-700">Configure triggers automáticos, notificações e fluxos de trabalho</p>
            </div>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <a href="/admin/settings/automation">Configurar</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Configurações em Desenvolvimento</h3>
            <p className="text-blue-800 text-sm mt-1">
              ✅ <strong>Automação:</strong> Totalmente funcional com triggers dinâmicos e notificações<br/>
              ⚠️ <strong>Outras configurações:</strong> Em desenvolvimento - funcionalidade completa será implementada em versões futuras.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Email da Empresa</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-6">
            {/* Configuração Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Configurações de Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provedor de Email */}
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Provedor de Email</Label>
                  <Select value={emailProvider} onValueChange={setEmailProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mailhog">MailHog (Desenvolvimento)</SelectItem>
                      <SelectItem value="ses">Amazon SES SMTP</SelectItem>
                      <SelectItem value="ses-api">Amazon SES API (Avançado)</SelectItem>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="custom">SMTP Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Informações do Remetente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from">Email do Remetente</Label>
                    <Input
                      id="smtp-from"
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      placeholder="noreply@suaempresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-name">Nome do Remetente</Label>
                    <Input
                      id="smtp-from-name"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      placeholder="Sua Empresa CRM"
                    />
                  </div>
                </div>

                {/* Configurações específicas por provedor */}
                {emailProvider === 'gmail' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Configuração Gmail
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gmail-user">Email do Gmail</Label>
                        <Input
                          id="gmail-user"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="seuemail@gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gmail-password">Senha de App</Label>
                        <div className="relative">
                          <Input
                            id="gmail-password"
                            type={showPassword ? "text" : "password"}
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder="••••••••••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p><strong>⚠️ Importante:</strong> Use uma "Senha de App", não sua senha normal do Gmail.</p>
                      <p><strong>📖 Como criar:</strong> <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">Guia do Google</a></p>
                    </div>
                  </div>
                )}

                {emailProvider === 'ses' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-orange-900 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Configuração Amazon SES (SMTP)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aws-region">Região AWS</Label>
                        <Select value={awsRegion} onValueChange={setAwsRegion}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                            <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aws-ses-access-key">Access Key ID</Label>
                        <Input
                          id="aws-ses-access-key"
                          value={awsSesAccessKey}
                          onChange={(e) => setAwsSesAccessKey(e.target.value)}
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="aws-ses-secret-key">Secret Access Key</Label>
                        <div className="relative">
                          <Input
                            id="aws-ses-secret-key"
                            type={showPassword ? "text" : "password"}
                            value={awsSesSecretKey}
                            onChange={(e) => setAwsSesSecretKey(e.target.value)}
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-orange-700 space-y-2">
                      <p><strong>🚀 Por que SES:</strong> Melhor deliverability, alta capacidade (200 emails/seg), baixo custo ($0.10/1000 emails)</p>
                      <p><strong>📖 Como configurar:</strong> <a href="https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html" target="_blank" rel="noopener noreferrer" className="underline">Guia AWS SES</a></p>
                      <p><strong>⚠️ Importante:</strong> Crie credenciais SMTP específicas no painel SES, não use credenciais IAM normais</p>
                    </div>
                  </div>
                )}

                {emailProvider === 'ses-api' && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-orange-900 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Configuração Amazon SES API (Avançado)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aws-api-region">Região AWS</Label>
                        <Select value={awsRegion} onValueChange={setAwsRegion}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                            <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aws-api-access-key">Access Key ID</Label>
                        <Input
                          id="aws-api-access-key"
                          value={awsSesAccessKey}
                          onChange={(e) => setAwsSesAccessKey(e.target.value)}
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="aws-api-secret-key">Secret Access Key</Label>
                        <div className="relative">
                          <Input
                            id="aws-api-secret-key"
                            type={showPassword ? "text" : "password"}
                            value={awsSesSecretKey}
                            onChange={(e) => setAwsSesSecretKey(e.target.value)}
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-orange-700 space-y-2">
                      <p><strong>🚀 Recursos Avançados:</strong> Templates nativos, gestão de bounces, estatísticas detalhadas, alta performance</p>
                      <p><strong>⚡ Performance:</strong> Envio via API REST (mais rápido que SMTP), rate limiting automático</p>
                      <p><strong>📊 Analytics:</strong> Métricas em tempo real, tracking de bounces/complaints integrado</p>
                      <p><strong>📖 Documentação:</strong> <a href="https://docs.aws.amazon.com/ses/latest/APIReference/" target="_blank" rel="noopener noreferrer" className="underline">API Reference AWS SES</a></p>
                    </div>

                    {/* Botão de teste específico para SES API */}
                    <div className="border-t border-orange-200 pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="seu-email@exemplo.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={async () => {
                            if (!testEmail) return
                            setTestLoading(true)
                            try {
                              const response = await fetch('/api/email/ses/test', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: testEmail })
                              })
                              const result = await response.json()
                              setTestResult(result)
                            } catch (error) {
                              setTestResult({ success: false, message: 'Erro na requisição' })
                            } finally {
                              setTestLoading(false)
                            }
                          }}
                          disabled={testLoading || !testEmail}
                          variant="outline"
                          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none hover:from-orange-600 hover:to-amber-600"
                        >
                          {testLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testando API...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Testar SES API
                            </>
                          )}
                        </Button>
                      </div>
                      {testResult && (
                        <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          <p className="text-sm">{testResult.message}</p>
                          {testResult.data && (
                            <div className="mt-2 text-xs">
                              <p>Método: {testResult.data.method}</p>
                              {testResult.data.quota && (
                                <p>Quota: {testResult.data.quota.sentLast24Hours}/{testResult.data.quota.max24HourSend} enviados</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {emailProvider === 'sendgrid' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-purple-900 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Configuração SendGrid
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="sendgrid-api-key">API Key do SendGrid</Label>
                      <div className="relative">
                        <Input
                          id="sendgrid-api-key"
                          type={showPassword ? "text" : "password"}
                          value={sendgridApiKey}
                          onChange={(e) => setSendgridApiKey(e.target.value)}
                          placeholder="SG.xxxxxxxxxxxxxxxx"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-purple-700">
                      <p><strong>📖 Como obter:</strong> <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="underline">Painel do SendGrid</a></p>
                    </div>
                  </div>
                )}

                {emailProvider === 'custom' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Configuração SMTP Personalizada
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-host">Servidor SMTP</Label>
                        <Input
                          id="custom-host"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.seuproveedor.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-port">Porta</Label>
                        <Input
                          id="custom-port"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          placeholder="587"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-user">Usuário</Label>
                        <Input
                          id="custom-user"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="usuario@dominio.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="custom-password"
                            type={showPassword ? "text" : "password"}
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp-secure"
                        checked={smtpSecure}
                        onCheckedChange={setSmtpSecure}
                      />
                      <Label htmlFor="smtp-secure">Conexão segura (SSL)</Label>
                    </div>
                  </div>
                )}

                {emailProvider === 'mailhog' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">MailHog - Ambiente de Desenvolvimento</h4>
                        <p className="text-yellow-800 text-sm mt-1">
                          MailHog é ideal para desenvolvimento. Os emails não são enviados de verdade.<br/>
                          <strong>Interface:</strong> <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:8025</a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teste de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5" />
                  <span>Teste de Configuração</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="seu-email@exemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestEmail}
                    disabled={testLoading || !testEmail}
                    className="flex items-center gap-2"
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        Testar Envio
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-md flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>💡 <strong>Dica:</strong> Configure um provedor SMTP real (Gmail, SendGrid) para envios em produção.</p>
                  <p>🔧 <strong>Desenvolvimento:</strong> Use MailHog em localhost:1025 para testar sem envio real.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notificações por Email</Label>
                    <p className="text-sm text-gray-600">Receber notificações importantes por email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lead-notifications">Notificações de Leads</Label>
                    <p className="text-sm text-gray-600">Alertas quando novos leads são capturados</p>
                  </div>
                  <Switch
                    id="lead-notifications"
                    checked={leadNotifications}
                    onCheckedChange={setLeadNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="task-notifications">Notificações de Tarefas</Label>
                    <p className="text-sm text-gray-600">Lembretes de tarefas vencendo ou atrasadas</p>
                  </div>
                  <Switch
                    id="task-notifications"
                    checked={taskNotifications}
                    onCheckedChange={setTaskNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-notifications">Notificações do Sistema</Label>
                    <p className="text-sm text-gray-600">Alertas de manutenção e atualizações</p>
                  </div>
                  <Switch
                    id="system-notifications"
                    checked={systemNotifications}
                    onCheckedChange={setSystemNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Segurança</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Timeout de Sessão (horas)</Label>
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="8">8 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="168">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-policy">Política de Senhas</Label>
                  <Select value={passwordPolicy} onValueChange={setPasswordPolicy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básica (6+ caracteres)</SelectItem>
                      <SelectItem value="medium">Média (8+ chars, números)</SelectItem>
                      <SelectItem value="strong">Forte (12+ chars, símbolos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip-whitelist">Lista de IPs Permitidos</Label>
                <Textarea
                  id="ip-whitelist"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  placeholder="192.168.1.0/24&#10;10.0.0.1"
                  rows={3}
                />
                <p className="text-sm text-gray-600">
                  Um IP ou range por linha. Deixe vazio para permitir todos.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audit-logs">Logs de Auditoria</Label>
                  <p className="text-sm text-gray-600">Registrar todas as ações importantes do sistema</p>
                </div>
                <Switch
                  id="audit-logs"
                  checked={auditLogs}
                  onCheckedChange={setAuditLogs}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Retenção de Dados (dias)</Label>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="180">6 meses</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="1095">3 anos</SelectItem>
                      <SelectItem value="-1">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Frequência de Backup</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics-enabled">Analytics Habilitado</Label>
                  <p className="text-sm text-gray-600">Coletar dados de uso para melhorar o sistema</p>
                </div>
                <Switch
                  id="analytics-enabled"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Informações do Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Versão</p>
                    <Badge variant="outline">v1.0.0-beta</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ambiente</p>
                    <Badge variant="outline">Desenvolvimento</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Banco de Dados</p>
                    <Badge variant="outline">SQLite</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Node.js</p>
                    <Badge variant="outline">v20.x</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}