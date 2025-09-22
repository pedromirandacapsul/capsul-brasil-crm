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
  const [emailProvider, setEmailProvider] = useState('smtp')
  const [smtpHost, setSmtpHost] = useState('localhost')
  const [smtpPort, setSmtpPort] = useState('1025')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')

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
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
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

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Configurações em Desenvolvimento</h3>
            <p className="text-blue-800 text-sm mt-1">
              Esta página está em desenvolvimento. As configurações mostradas são exemplos
              e não afetam o sistema atual. A funcionalidade completa será implementada em
              versões futuras.
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Configurações de Email</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-provider">Provedor de Email</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Personalizado</SelectItem>
                    <SelectItem value="mailhog">MailHog (Desenvolvimento)</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input
                    id="smtp-host"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta SMTP</Label>
                  <Input
                    id="smtp-port"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário SMTP</Label>
                  <Input
                    id="smtp-user"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="usuario@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Senha SMTP</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">MailHog Configurado</h4>
                    <p className="text-yellow-800 text-sm mt-1">
                      O sistema está configurado para usar MailHog em desenvolvimento.
                      Acesse http://localhost:8025 para ver os emails enviados.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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