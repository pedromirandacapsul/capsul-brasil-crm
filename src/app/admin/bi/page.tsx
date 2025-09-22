'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  BarChart3,
  TrendingUp,
  Database,
  Settings,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export default function BIDashboardPage() {
  const { data: session } = useSession()

  if (!session) return null

  const userRole = session.user.role

  if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_VIEW)) {
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
          <h1 className="text-3xl font-bold text-gray-900">BI Dashboard</h1>
          <p className="text-gray-600">
            Business Intelligence e relatórios avançados com Metabase
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar Dados
          </Button>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Metabase
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Metabase</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Pause className="mr-1 h-3 w-3" />
                Configuração Pendente
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Metabase não está configurado ainda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dashboards Disponíveis</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhum dashboard criado ainda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Nunca sincronizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Metabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              O que é o Metabase?
            </h3>
            <p className="text-blue-800 text-sm">
              Metabase é uma ferramenta open-source de Business Intelligence que permite
              criar dashboards interativos, relatórios e análises avançadas dos seus dados
              de CRM de forma visual e intuitiva.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Passos para Configuração:</h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Iniciar o Docker Compose</p>
                  <p className="text-xs text-gray-600">
                    Execute <code className="bg-gray-100 px-1 rounded">pnpm docker:up</code> para iniciar o Metabase
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Acessar Metabase</p>
                  <p className="text-xs text-gray-600">
                    Acesse <code className="bg-gray-100 px-1 rounded">http://localhost:3001</code> no seu navegador
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Configurar Conexão com Banco</p>
                  <p className="text-xs text-gray-600">
                    Configure a conexão com o banco SQLite localizado em <code className="bg-gray-100 px-1 rounded">./dev.db</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                  4
                </div>
                <div>
                  <p className="font-medium text-sm">Criar Dashboards</p>
                  <p className="text-xs text-gray-600">
                    Use as tabelas do CRM para criar dashboards personalizados
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Tabelas Disponíveis:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="outline">leads</Badge>
              <Badge variant="outline">users</Badge>
              <Badge variant="outline">tasks</Badge>
              <Badge variant="outline">activities</Badge>
              <Badge variant="outline">analytics_events</Badge>
              <Badge variant="outline">audit_logs</Badge>
              <Badge variant="outline">webhook_events</Badge>
              <Badge variant="outline">team_kpis</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Dashboards */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboards Sugeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Sales Performance</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Acompanhe conversões, pipeline de vendas e performance da equipe
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Taxa de conversão por período</li>
                <li>• Leads por fonte de origem</li>
                <li>• Performance por vendedor</li>
                <li>• Funil de vendas</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Operational Analytics</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Monitore atividades, tarefas e eficiência operacional
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Tarefas completadas vs. criadas</li>
                <li>• Tempo médio de resposta</li>
                <li>• Atividades por usuário</li>
                <li>• Distribuição de workload</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">Customer Journey</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Analise o percurso dos leads desde a captura até a conversão
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Tempo médio no pipeline</li>
                <li>• Pontos de abandono</li>
                <li>• Jornada por segmento</li>
                <li>• Análise de cohort</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium">System Health</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Monitore a saúde e uso do sistema CRM
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Eventos de analytics</li>
                <li>• Logs de auditoria</li>
                <li>• Usuários ativos</li>
                <li>• Performance do sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}