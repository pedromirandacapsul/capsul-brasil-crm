/**
 * API para testar configuração AWS SES via SDK
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awsSESService } from '@/services/aws-ses-service'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (pular em desenvolvimento se configurado)
    if (process.env.SKIP_AUTH_IN_DEVELOPMENT !== 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        )
      }
    }

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

    console.log('🧪 Testando AWS SES API para:', email)

    const result = await awsSESService.testConfiguration(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.details
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro no teste AWS SES API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}