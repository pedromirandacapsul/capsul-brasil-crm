'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Target, Award, Briefcase } from 'lucide-react'

const stats = [
  { number: '200+', label: 'Empresas Atendidas' },
  { number: '95%', label: 'Taxa de Satisfação' },
  { number: '50+', label: 'Projetos Entregues' },
  { number: '10+', label: 'Anos de Experiência' },
]

const values = [
  {
    icon: Target,
    title: 'Foco em Resultados',
    description: 'Orientamos todas as estratégias para gerar resultados mensuráveis e sustentáveis.',
  },
  {
    icon: Award,
    title: 'Excelência',
    description: 'Compromisso com a qualidade em cada projeto e relacionamento com nossos clientes.',
  },
  {
    icon: Briefcase,
    title: 'Experiência',
    description: 'Equipe especializada com vasta experiência em diferentes setores e segmentos.',
  },
]

export function About() {
  return (
    <section id="sobre" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Sobre a Capsul Brasil
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Somos uma consultoria empresarial especializada em transformação
              organizacional e otimização de negócios. Nossa missão é
              potencializar o crescimento das empresas através de soluções
              inovadoras e estratégias personalizadas.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Com uma abordagem centrada em resultados, combinamos expertise
              técnica com visão estratégica para entregar soluções que geram
              impacto real no desempenho das organizações.
            </p>

            <div className="space-y-4">
              {[
                'Diagnóstico completo e personalizado',
                'Implementação de melhorias estruturais',
                'Acompanhamento contínuo de resultados',
                'Suporte especializado em transformação digital',
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center"
                >
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Values */}
            <div className="space-y-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <value.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{value.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}