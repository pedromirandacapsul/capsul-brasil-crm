import { CheckCircle, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Obrigado!
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Sua mensagem foi enviada com sucesso. Nossa equipe de especialistas
            entrará em contato em breve para entender melhor suas necessidades
            e propor as melhores soluções para o seu negócio.
          </p>

          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                O que acontece agora?
              </h2>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-800">
                    Nossa equipe analisará sua solicitação em até 2 horas
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-800">
                    Entraremos em contato via WhatsApp ou telefone
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-800">
                    Agenendaremos uma reunião para diagnóstico gratuito
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <a
                href="https://wa.me/5511999999999?text=Olá! Acabei de enviar uma mensagem pelo site da Capsul Brasil e gostaria de acelerar o processo de contato."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chamar no WhatsApp
              </a>
            </Button>

            <Button variant="outline" size="lg" asChild>
              <Link href="/">
                <ArrowRight className="mr-2 h-5 w-5" />
                Voltar ao Site
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Enquanto isso...
            </h3>
            <p className="text-gray-600 mb-4">
              Que tal conhecer mais sobre nossos casos de sucesso e como
              ajudamos outras empresas a alcançar seus objetivos?
            </p>
            <Button variant="outline" asChild>
              <Link href="/#sobre">
                Conhecer Mais Sobre Nós
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}