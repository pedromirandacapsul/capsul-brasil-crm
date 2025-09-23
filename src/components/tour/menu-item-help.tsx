'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HelpCircle,
  Info,
  Target,
  Lightbulb,
  ExternalLink,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface MenuItemData {
  name: string
  description: string
  quickTip: string
  features: string[]
  useCases: string[]
  tips: string[]
  route: string
}

const menuItemsData: Record<string, MenuItemData> = {
  'Dashboard': {
    name: 'Dashboard Principal',
    description: 'Centro de controle com visão geral de todas as métricas importantes do seu negócio',
    quickTip: 'Acompanhe leads, conversões e atividades em tempo real',
    features: [
      'Métricas de leads e conversões em tempo real',
      'Gráficos de performance da equipe',
      'Lista de atividades recentes',
      'Resumo de tarefas pendentes e atrasadas'
    ],
    useCases: [
      'Monitoramento diário da performance',
      'Identificação rápida de problemas',
      'Acompanhamento de metas'
    ],
    tips: [
      'Verifique o dashboard todas as manhãs',
      'Use as métricas para definir prioridades do dia'
    ],
    route: '/admin'
  },
  'Dashboard Executivo': {
    name: 'Dashboard Executivo',
    description: 'Análises estratégicas e KPIs executivos para tomada de decisão',
    quickTip: 'KPIs avançados e insights estratégicos para gestores',
    features: [
      'KPIs estratégicos de conversão e vendas',
      'Análise de performance por usuário',
      'Métricas de pipeline e previsões',
      'Alertas automáticos de performance'
    ],
    useCases: [
      'Reuniões executivas semanais',
      'Análise de tendências mensais',
      'Tomada de decisões estratégicas'
    ],
    tips: [
      'Use filtros de data para comparar períodos',
      'Exporte dados para apresentações'
    ],
    route: '/admin/dashboard/executive'
  },
  'Relatórios': {
    name: 'Relatórios de Performance',
    description: 'Relatórios detalhados com rankings e exportação de dados',
    quickTip: 'Gere relatórios profissionais e rankings da equipe',
    features: [
      'Relatórios de performance individual',
      'Rankings de vendas e conversões',
      'Exportação para Excel e PDF',
      'Filtros avançados por período e usuário'
    ],
    useCases: [
      'Avaliações de performance',
      'Relatórios para diretoria',
      'Análise de comissões'
    ],
    tips: [
      'Use rankings para motivar a equipe',
      'Exporte relatórios mensais automaticamente'
    ],
    route: '/admin/reports/users'
  },
  'Leads': {
    name: 'Gestão de Leads',
    description: 'Centro completo para gerenciar todos os seus leads e prospectos',
    quickTip: 'Gerencie leads com filtros avançados e automações',
    features: [
      'Lista completa com filtros poderosos',
      'Criação e edição rápida de leads',
      'Atribuição automática por regras',
      'Histórico completo de interações'
    ],
    useCases: [
      'Importação de leads de campanhas',
      'Qualificação e distribuição',
      'Follow-up organizado'
    ],
    tips: [
      'Use status para organizar o funil',
      'Configure automações para follow-ups'
    ],
    route: '/admin/leads'
  },
  'Kanban': {
    name: 'Kanban de Leads',
    description: 'Visualização visual do fluxo de leads através dos estágios de venda',
    quickTip: 'Arraste leads entre colunas para atualizar status',
    features: [
      'Interface drag-and-drop intuitiva',
      'Visão clara do pipeline',
      'Contadores automáticos por estágio',
      'Atualização em tempo real'
    ],
    useCases: [
      'Gestão visual do pipeline',
      'Identificação de gargalos',
      'Reuniões de acompanhamento'
    ],
    tips: [
      'Arraste cards para mover rapidamente',
      'Use cores para priorizar leads'
    ],
    route: '/admin/leads/kanban'
  },
  'Oportunidades': {
    name: 'Gestão de Oportunidades',
    description: 'Controle completo de oportunidades de venda com valores e probabilidades',
    quickTip: 'Gerencie negócios com valores e previsões de fechamento',
    features: [
      'Criação de oportunidades com valores',
      'Probabilidades de fechamento',
      'Histórico de negociações',
      'Integração automática com leads'
    ],
    useCases: [
      'Acompanhamento de negócios grandes',
      'Previsão de vendas',
      'Gestão de propostas'
    ],
    tips: [
      'Atualize probabilidades regularmente',
      'Use datas de fechamento realistas'
    ],
    route: '/admin/opportunities'
  },
  'Pipeline': {
    name: 'Pipeline de Vendas',
    description: 'Análise visual do funil de vendas com métricas de conversão',
    quickTip: 'Visualize seu funil e identifique pontos de melhoria',
    features: [
      'Funil visual com métricas',
      'Taxa de conversão por estágio',
      'Tempo médio no pipeline',
      'Identificação de gargalos'
    ],
    useCases: [
      'Otimização do processo de vendas',
      'Análise de conversões',
      'Treinamento da equipe'
    ],
    tips: [
      'Foque em estágios com baixa conversão',
      'Analise tempo médio por estágio'
    ],
    route: '/admin/pipeline'
  },
  'Tarefas': {
    name: 'Sistema de Tarefas',
    description: 'Gestão completa de tarefas, lembretes e follow-ups',
    quickTip: 'Organize follow-ups e nunca perca uma oportunidade',
    features: [
      'Criação de tarefas com prazos',
      'Atribuição para equipe',
      'Lembretes automáticos',
      'Integração com leads e oportunidades'
    ],
    useCases: [
      'Follow-ups programados',
      'Gestão de atividades da equipe',
      'Lembretes de reuniões'
    ],
    tips: [
      'Defina prazos realistas',
      'Use prioridades para organizar'
    ],
    route: '/admin/tasks'
  },
  'Analytics': {
    name: 'Analytics Avançado',
    description: 'Análises detalhadas com gráficos interativos e métricas personalizáveis',
    quickTip: 'Gráficos interativos para análises profundas',
    features: [
      'Gráficos interativos de performance',
      'Análises de tendências temporais',
      'Comparativos por período',
      'Métricas customizáveis'
    ],
    useCases: [
      'Análises de tendências',
      'Comparação de períodos',
      'Identificação de padrões'
    ],
    tips: [
      'Use filtros para focar em dados específicos',
      'Compare períodos para ver evolução'
    ],
    route: '/admin/analytics'
  },
  'WhatsApp': {
    name: 'Integração WhatsApp',
    description: 'Sistema completo de comunicação via WhatsApp com automações',
    quickTip: 'Automatize comunicação e acompanhe conversas',
    features: [
      'Envio de mensagens automáticas',
      'Templates personalizáveis',
      'Histórico de conversas',
      'Integração com leads'
    ],
    useCases: [
      'Follow-up automático',
      'Comunicação em massa',
      'Atendimento personalizado'
    ],
    tips: [
      'Use templates para padronizar',
      'Monitore taxa de resposta'
    ],
    route: '/admin/whatsapp'
  },
  'Configurações': {
    name: 'Configurações do Sistema',
    description: 'Centro de configurações, automações e personalizações',
    quickTip: 'Configure automações e personalize o sistema',
    features: [
      'Configurações de automação',
      'Gestão de usuários e permissões',
      'Personalizações do sistema',
      'Integrações externas'
    ],
    useCases: [
      'Configuração inicial do sistema',
      'Criação de automações',
      'Gestão de equipe'
    ],
    tips: [
      'Configure automações desde o início',
      'Revise permissões regularmente'
    ],
    route: '/admin/settings'
  }
}

interface MenuItemHelpProps {
  itemName: string
  children: React.ReactNode
  showTooltip?: boolean
  showHelpIcon?: boolean
}

export function MenuItemHelp({
  itemName,
  children,
  showTooltip = true,
  showHelpIcon = true
}: MenuItemHelpProps) {
  const [showModal, setShowModal] = useState(false)
  const itemData = menuItemsData[itemName]

  if (!itemData) {
    return <>{children}</>
  }

  const handleHelpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const TooltipWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!showTooltip) return <>{children}</>

    return (
      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="text-center">
              <p className="font-medium">{itemData.name}</p>
              <p className="text-xs text-gray-500 mt-1">{itemData.quickTip}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      <TooltipWrapper>
        <div className="flex items-center justify-between group w-full">
          <div className="flex-1">
            {children}
          </div>
          {showHelpIcon && (
            <button
              onClick={handleHelpClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded"
              title={`Ajuda: ${itemData.name}`}
            >
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-blue-600" />
            </button>
          )}
        </div>
      </TooltipWrapper>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              {itemData.name}
            </DialogTitle>
            <DialogDescription>
              {itemData.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Funcionalidades Principais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Funcionalidades Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {itemData.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Casos de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Quando Usar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {itemData.useCases.map((useCase, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{useCase}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <Lightbulb className="h-4 w-4" />
                  Dicas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {itemData.tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.6 }}
                    >
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setShowModal(false)
                window.location.href = itemData.route
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar {itemData.name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}