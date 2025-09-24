/**
 * API para obter quota e estatísticas do AWS SES
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awsSESService } from '@/services/aws-ses-service'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('📊 Obtendo quota e estatísticas AWS SES...')

    // Obter quota e estatísticas em paralelo
    const [quotaResult, statsResult, verifiedEmailsResult] = await Promise.all([
      awsSESService.getQuota(),
      awsSESService.getStatistics(),
      awsSESService.listVerifiedEmails()
    ])

    if (!quotaResult.success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao obter quota: ' + quotaResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        quota: quotaResult.quota,
        statistics: statsResult.success ? statsResult.statistics : [],
        verifiedEmails: verifiedEmailsResult.success ? verifiedEmailsResult.emails : [],
        errors: {
          statistics: statsResult.success ? null : statsResult.error,
          verifiedEmails: verifiedEmailsResult.success ? null : verifiedEmailsResult.error
        }
      }
    })
  } catch (error: any) {
    console.error('Erro ao obter dados AWS SES:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}