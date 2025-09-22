'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Cog,
  Users,
  Lightbulb,
  Shield,
  Clock,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Análise Estratégica',
    description:
      'Diagnóstico completo do seu negócio com análise de dados e identificação de oportunidades de melhoria.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Cog,
    title: 'Otimização de Processos',
    description:
      'Reestruturação de processos internos para maior eficiência operacional e redução de custos.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Users,
    title: 'Desenvolvimento de Equipes',
    description:
      'Treinamento e capacitação de colaboradores para formar equipes de alta performance.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Lightbulb,
    title: 'Inovação Digital',
    description:
      'Implementação de tecnologias e ferramentas digitais para modernizar suas operações.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Shield,
    title: 'Gestão de Riscos',
    description:
      'Identificação e mitigação de riscos empresariais com protocolos de segurança robustos.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: Clock,
    title: 'Resultados Rápidos',
    description:
      'Metodologias ágeis que garantem resultados tangíveis em prazos otimizados.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
]

export function Features() {
  return (
    <section id="servicos" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Nossas Soluções
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oferecemos um conjunto completo de serviços especializados para
            transformar e otimizar o seu negócio
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-gray-200 h-full">
                <div
                  className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}