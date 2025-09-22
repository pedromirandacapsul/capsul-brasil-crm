'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Transforme seu{' '}
              <span className="text-blue-600">negócio</span> com soluções
              inovadoras
            </h1>
            <p className="text-xl text-gray-600 mt-6 leading-relaxed">
              Consultoria empresarial especializada em gestão, transformação
              digital e eficiência operacional. Potencialize seus resultados
              com estratégias personalizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="text-lg" asChild>
                <a href="#contato">
                  Fale Conosco
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <a href="#sobre">Saiba Mais</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-lg border border-blue-100"
              >
                <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Crescimento
                </h3>
                <p className="text-gray-600 text-sm">
                  Estratégias comprovadas para acelerar o crescimento do seu
                  negócio
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white p-6 rounded-lg shadow-lg border border-purple-100 mt-8"
              >
                <Users className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Equipes</h3>
                <p className="text-gray-600 text-sm">
                  Desenvolvimento e treinamento de equipes de alta performance
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white p-6 rounded-lg shadow-lg border border-green-100 -mt-4"
              >
                <Zap className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Eficiência
                </h3>
                <p className="text-gray-600 text-sm">
                  Otimização de processos para máxima produtividade
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-lg shadow-lg text-white"
              >
                <div className="text-2xl font-bold mb-2">200+</div>
                <p className="text-blue-100 text-sm">
                  Empresas transformadas com nossas soluções
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}