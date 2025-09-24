import { NextRequest, NextResponse } from 'next/server'
import { emailMarketingService } from '@/services/email-marketing-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    console.log('🧪 Testando envio de email para:', email)

    const result = await emailMarketingService.testEmailConfiguration(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.info
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro no teste de email:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}