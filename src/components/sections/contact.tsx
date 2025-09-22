'use client'

import { motion } from 'framer-motion'
import { ContactForm } from '@/components/forms/contact-form'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'contato@capsul.com.br',
    href: 'mailto:contato@capsul.com.br',
  },
  {
    icon: Phone,
    label: 'Telefone',
    value: '(11) 9999-9999',
    href: 'tel:+5511999999999',
  },
  {
    icon: MapPin,
    label: 'Endereço',
    value: 'São Paulo, SP - Brasil',
    href: '#',
  },
  {
    icon: Clock,
    label: 'Horário',
    value: 'Seg - Sex: 9h às 18h',
    href: '#',
  },
]

export function Contact() {
  return (
    <section id="contato" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Fale Conosco
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pronto para transformar seu negócio? Entre em contato conosco e
            descubra como podemos ajudar sua empresa a alcançar novos patamares
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Entre em Contato
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Nossa equipe de especialistas está pronta para entender suas
                necessidades e propor soluções personalizadas para o seu
                negócio. Agende uma conversa sem compromisso.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-4"
                >
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <info.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      {info.label}
                    </div>
                    {info.href === '#' ? (
                      <div className="text-gray-900 font-medium">
                        {info.value}
                      </div>
                    ) : (
                      <a
                        href={info.href}
                        className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                      >
                        {info.value}
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-2">
                Diagnóstico Gratuito
              </h4>
              <p className="text-gray-600 text-sm">
                Oferecemos uma análise inicial gratuita para identificar
                oportunidades de melhoria no seu negócio. Sem compromisso,
                apenas valor agregado.
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Solicite um Contato
              </h3>
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}