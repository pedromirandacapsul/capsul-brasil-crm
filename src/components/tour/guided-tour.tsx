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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  PieChart,
  FileText,
  Users,
  Kanban,
  DollarSign,
  GitBranch,
  CheckSquare,
  BarChart3,
  MessageCircle,
  Settings,
  Star,
  Target,
  TrendingUp,
  Mail
} from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  route: string
  features: string[]
  tips: string[]
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    description: 'Visão geral das métricas e atividades do seu CRM',
    icon: Home,
    route: '/admin',
    features: [
      'Métricas em tempo real de leads e conversões',
      'Gráficos de performance da equipe',
      'Atividades recentes do sistema',
      'Resumo de tarefas pendentes'
    ],
    tips: [
      'Use as métricas para acompanhar o progresso diário',
      'Clique nos gráficos para ver detalhes específicos'
    ]
  },
  {
    id: 'executive-dashboard',
    title: 'Dashboard Executivo',
    description: 'Análises avançadas e KPIs estratégicos para tomada de decisão',
    icon: PieChart,
    route: '/admin/dashboard/executive',
    features: [
      'KPIs estratégicos e métricas de conversão',
      'Análise de performance por usuário',
      'Insights de pipeline e vendas',
      'Alertas de performance automáticos'
    ],
    tips: [
      'Ideal para reuniões executivas e relatórios',
      'Use os filtros de data para análises específicas'
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios',
    description: 'Relatórios detalhados de performance e exportação de dados',
    icon: FileText,
    route: '/admin/reports/users',
    features: [
      'Relatórios de performance por usuário',
      'Rankings e comparativos de vendas',
      'Exportação para Excel e PDF',
      'Filtros avançados por período'
    ],
    tips: [
      'Exporte relatórios para apresentações',
      'Use os rankings para motivar a equipe'
    ]
  },
  {
    id: 'leads',
    title: 'Gestão de Leads',
    description: 'Centro de controle para todos os seus leads e prospectos',
    icon: Users,
    route: '/admin/leads',
    features: [
      'Lista completa de leads com filtros',
      'Criação e edição de leads',
      'Atribuição automática de leads',
      'Histórico completo de atividades'
    ],
    tips: [
      'Use os filtros para encontrar leads específicos',
      'Atualize o status regularmente para melhor conversão'
    ]
  },
  {
    id: 'kanban',
    title: 'Kanban de Leads',
    description: 'Visualização visual do fluxo de leads por estágio',
    icon: Kanban,
    route: '/admin/leads/kanban',
    features: [
      'Arraste leads entre estágios',
      'Visualização clara do pipeline',
      'Contadores por estágio',
      'Atualização em tempo real'
    ],
    tips: [
      'Arraste os cards para mover leads rapidamente',
      'Use cores para identificar prioridades'
    ]
  },
  {
    id: 'opportunities',
    title: 'Oportunidades',
    description: 'Gestão completa de oportunidades de venda',
    icon: DollarSign,
    route: '/admin/opportunities',
    features: [
      'Criação e gestão de oportunidades',
      'Valores e probabilidades de fechamento',
      'Histórico de negociações',
      'Integração com leads'
    ],
    tips: [
      'Mantenha valores e datas atualizados',
      'Use probabilidades para previsões precisas'
    ]
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing',
    description: 'Sistema completo de campanhas e automação de email',
    icon: Mail,
    route: '/admin/email-marketing',
    features: [
      'Criação e gestão de templates de email',
      'Campanhas de marketing segmentadas',
      'Automação de envios baseada em triggers',
      'Métricas de abertura, cliques e conversões',
      'Segmentação avançada de leads',
      'Rastreamento de performance em tempo real'
    ],
    tips: [
      'Use templates para padronizar comunicação',
      'Segmente campanhas para maior efetividade',
      'Monitore métricas para otimizar resultados',
      'Teste diferentes assuntos para melhor abertura'
    ]
  },
  {
    id: 'pipeline',
    title: 'Pipeline de Vendas',
    description: 'Visualização do funil de vendas e oportunidades',
    icon: GitBranch,
    route: '/admin/pipeline',
    features: [
      'Funil visual de vendas',
      'Métricas por estágio',
      'Tempo médio no pipeline',
      'Taxa de conversão por etapa'
    ],
    tips: [
      'Identifique gargalos no processo',
      'Otimize estágios com baixa conversão'
    ]
  },
  {
    id: 'tasks',
    title: 'Tarefas',
    description: 'Sistema completo de gestão de tarefas e follow-ups',
    icon: CheckSquare,
    route: '/admin/tasks',
    features: [
      'Criação e atribuição de tarefas',
      'Prazos e notificações',
      'Integração com leads e oportunidades',
      'Relatórios de produtividade'
    ],
    tips: [
      'Use lembretes para não perder follow-ups',
      'Priorize tarefas por urgência'
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Análises detalhadas e métricas de performance',
    icon: BarChart3,
    route: '/admin/analytics',
    features: [
      'Gráficos interativos de performance',
      'Análises de tendências',
      'Comparativos por período',
      'Métricas personalizáveis'
    ],
    tips: [
      'Compare períodos para identificar tendências',
      'Use para definir metas da equipe'
    ]
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Integration',
    description: 'Integração completa com WhatsApp para comunicação',
    icon: MessageCircle,
    route: '/admin/whatsapp',
    features: [
      'Envio de mensagens automáticas',
      'Templates personalizáveis',
      'Histórico de conversas',
      'Integração com leads'
    ],
    tips: [
      'Use templates para padronizar comunicação',
      'Monitore taxa de resposta das mensagens'
    ]
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Configurações do sistema e personalizações',
    icon: Settings,
    route: '/admin/settings',
    features: [
      'Configurações de automação',
      'Gestão de usuários e permissões',
      'Personalizações do sistema',
      'Integrações externas'
    ],
    tips: [
      'Configure automações para aumentar eficiência',
      'Revise permissões regularmente'
    ]
  }
]

interface GuidedTourProps {
  trigger?: React.ReactNode
}

export function GuidedTour({ trigger }: GuidedTourProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const currentTourStep = tourSteps[currentStep]

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
      onClick={() => setIsOpen(true)}
    >
      <HelpCircle className="h-4 w-4" />
      Guia do Sistema
    </Button>
  )

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        defaultTrigger
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Guia do Sistema CRM Capsul Brasil
            </DialogTitle>
            <DialogDescription>
              Aprenda a usar todas as funcionalidades do sistema de forma eficiente
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-6 h-[70vh]">
            {/* Menu lateral com lista de passos */}
            <div className="w-1/3 border-r pr-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Funcionalidades</h3>
              <div className="space-y-2">
                {tourSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentStep
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => handleStepClick(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <step.icon className={`h-5 w-5 ${
                        index === currentStep ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <div>
                        <div className={`font-medium text-sm ${
                          index === currentStep ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <currentTourStep.icon className="h-6 w-6 text-blue-600" />
                        {currentTourStep.title}
                      </CardTitle>
                      <p className="text-gray-600">{currentTourStep.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Funcionalidades */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          Principais Funcionalidades
                        </h4>
                        <ul className="space-y-2">
                          {currentTourStep.features.map((feature, index) => (
                            <motion.li
                              key={index}
                              className="flex items-start gap-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Dicas */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-yellow-600" />
                          Dicas de Uso
                        </h4>
                        <ul className="space-y-2">
                          {currentTourStep.tips.map((tip, index) => (
                            <motion.li
                              key={index}
                              className="flex items-start gap-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                            >
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{tip}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Botão para acessar a funcionalidade */}
                      <div className="pt-4">
                        <Button
                          className="w-full"
                          onClick={() => {
                            setIsOpen(false)
                            window.location.href = currentTourStep.route
                          }}
                        >
                          Acessar {currentTourStep.title}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navegação inferior */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {tourSteps.length}
              </span>
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentStep === tourSteps.length - 1}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}