'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Send, CheckCircle } from 'lucide-react'
import { trackFormSubmission, trackLeadCreated } from '@/components/analytics'

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres'),
  roleTitle: z.string().optional(),
  interest: z.string().min(10, 'Descreva brevemente seu interesse'),
  consentLGPD: z.boolean().refine(val => val, 'Você deve aceitar os termos'),
  honeypot: z.string().max(0, 'Spam detectado'), // Anti-spam field
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      honeypot: '', // Hidden field for spam detection
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      // Track form submission attempt
      trackFormSubmission('contact_form', {
        has_company: !!data.company,
        has_role: !!data.roleTitle,
        interest_length: data.interest.length,
      })

      // Get UTM parameters and referrer from URL
      const urlParams = new URLSearchParams(window.location.search)
      const referrer = document.referrer

      const leadData = {
        ...data,
        source: 'Website',
        utmSource: urlParams.get('utm_source') || undefined,
        utmMedium: urlParams.get('utm_medium') || undefined,
        utmCampaign: urlParams.get('utm_campaign') || undefined,
        utmTerm: urlParams.get('utm_term') || undefined,
        utmContent: urlParams.get('utm_content') || undefined,
        referrer: referrer || undefined,
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar formulário')
      }

      const result = await response.json()

      // Track successful lead creation
      trackLeadCreated({
        source: leadData.source,
        utmSource: leadData.utmSource,
        utmMedium: leadData.utmMedium,
        utmCampaign: leadData.utmCampaign,
        company: data.company,
      })

      setIsSubmitted(true)
      reset()

      // Redirect to thank you page after 2 seconds
      setTimeout(() => {
        window.location.href = '/obrigado'
      }, 2000)
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      alert('Erro ao enviar formulário. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Mensagem Enviada!
          </h3>
          <p className="text-green-700">
            Obrigado pelo seu interesse. Nossa equipe entrará em contato em
            breve.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <input
        {...register('honeypot')}
        type="text"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <Input
            {...register('name')}
            id="name"
            type="text"
            placeholder="Seu nome completo"
            className={errors.name ? 'border-red-300' : ''}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            placeholder="seu@email.com"
            className={errors.email ? 'border-red-300' : ''}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp/Telefone *
          </label>
          <Input
            {...register('phone')}
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            className={errors.phone ? 'border-red-300' : ''}
          />
          {errors.phone && (
            <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Empresa *
          </label>
          <Input
            {...register('company')}
            id="company"
            type="text"
            placeholder="Nome da sua empresa"
            className={errors.company ? 'border-red-300' : ''}
          />
          {errors.company && (
            <p className="text-red-600 text-sm mt-1">{errors.company.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="roleTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Cargo/Função
        </label>
        <Input
          {...register('roleTitle')}
          id="roleTitle"
          type="text"
          placeholder="Ex: CEO, Diretor, Gerente..."
        />
      </div>

      <div>
        <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">
          Como podemos ajudar? *
        </label>
        <textarea
          {...register('interest')}
          id="interest"
          rows={4}
          placeholder="Descreva brevemente seu interesse ou necessidade..."
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.interest ? 'border-red-300' : ''
          }`}
        />
        {errors.interest && (
          <p className="text-red-600 text-sm mt-1">{errors.interest.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-3">
        <input
          {...register('consentLGPD')}
          id="consentLGPD"
          type="checkbox"
          className="mt-1"
        />
        <label htmlFor="consentLGPD" className="text-sm text-gray-600">
          Eu concordo com o tratamento dos meus dados pessoais de acordo com a{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Política de Privacidade
          </a>{' '}
          e autorizo o contato para fins comerciais. *
        </label>
      </div>
      {errors.consentLGPD && (
        <p className="text-red-600 text-sm">{errors.consentLGPD.message}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Enviar Mensagem
          </>
        )}
      </Button>
    </form>
  )
}