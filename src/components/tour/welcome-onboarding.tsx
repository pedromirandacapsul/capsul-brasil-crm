'use client'

import { useState, useEffect } from 'react'
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
  Rocket,
  ChevronRight,
  Star,
  Users,
  Target,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'
import { GuidedTour } from './guided-tour'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  features: string[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao CRM Capsul Brasil! 🎉',
    description: 'Sua plataforma completa para gestão de leads, vendas e relacionamento com clientes',
    icon: Rocket,
    features: [
      'Gestão completa de leads e oportunidades',
      'Dashboard executivo com métricas em tempo real',
      'Automação de WhatsApp e follow-ups',
      'Relatórios avançados e analytics'
    ]
  },
  {
    id: 'quick-start',
    title: 'Configuração Rápida',
    description: 'Vamos te ajudar a começar da melhor forma',
    icon: Zap,
    features: [
      'Complete seu perfil de usuário',
      'Configure suas automações',
      'Importe seus primeiros leads',
      'Explore as funcionalidades principais'
    ]
  },
  {
    id: 'features',
    title: 'Principais Funcionalidades',
    description: 'Conheça o que o sistema pode fazer por você',
    icon: Star,
    features: [
      'Dashboard com métricas e KPIs',
      'Kanban visual para gestão de leads',
      'Sistema completo de tarefas',
      'Integração nativa com WhatsApp'
    ]
  }
]

interface WelcomeOnboardingProps {
  userName?: string
  onComplete?: () => void
}

export function WelcomeOnboarding({ userName = 'Usuário', onComplete }: WelcomeOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já viu o onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      // Delay para mostrar após o carregamento da página
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setIsOpen(false)
    onComplete?.()
  }

  const handleStartTour = () => {
    handleComplete()
    setShowTour(true)
  }

  const currentOnboardingStep = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl" hideClose>
          <DialogHeader>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <DialogTitle className="text-2xl font-bold text-blue-600 mb-2">
                Olá, {userName}! 👋
              </DialogTitle>
              <DialogDescription className="text-lg">
                Vamos começar sua jornada no CRM Capsul Brasil
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <div className="py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 border-blue-100">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <currentOnboardingStep.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">
                      {currentOnboardingStep.title}
                    </CardTitle>
                    <p className="text-gray-600">
                      {currentOnboardingStep.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        O que você pode fazer:
                      </h4>
                      <ul className="space-y-3">
                        {currentOnboardingStep.features.map((feature, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicadores de progresso */}
          <div className="flex justify-center gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Botões de navegação */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-500">
              Passo {currentStep + 1} de {onboardingSteps.length}
            </div>

            <div className="flex gap-3">
              {!isLastStep ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                  >
                    Pular Introdução
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              ) : (
                <div className="space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                  >
                    Explorar por Conta
                  </Button>
                  <Button
                    onClick={handleStartTour}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Tour Guiado
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour guiado que abre após onboarding */}
      {showTour && (
        <GuidedTour
          trigger={
            <div style={{ display: 'none' }}>
              Tour trigger
            </div>
          }
        />
      )}
    </>
  )
}

// Hook para resetar o onboarding (útil para desenvolvimento)
export function useResetOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding')
    window.location.reload()
  }

  return { resetOnboarding }
}