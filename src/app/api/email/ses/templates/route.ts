/**
 * API para gestão de templates do AWS SES
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awsSESService } from '@/services/aws-ses-service'

// GET - Listar templates do SES
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('📝 Listando templates AWS SES...')

    const result = await awsSESService.listTemplates()

    if (result.success) {
      return NextResponse.json({
        success: true,
        templates: result.templates
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao listar templates SES:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// POST - Criar template no SES
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { templateName, subject, htmlPart, textPart } = await request.json()

    if (!templateName || !subject) {
      return NextResponse.json(
        { success: false, error: 'Nome do template e assunto são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('📝 Criando template AWS SES:', templateName)

    const result = await awsSESService.createTemplate({
      templateName,
      subject,
      htmlPart,
      textPart
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Template '${templateName}' criado com sucesso no AWS SES`
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao criar template SES:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template no SES
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { templateName, subject, htmlPart, textPart } = await request.json()

    if (!templateName || !subject) {
      return NextResponse.json(
        { success: false, error: 'Nome do template e assunto são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('✏️ Atualizando template AWS SES:', templateName)

    const result = await awsSESService.updateTemplate({
      templateName,
      subject,
      htmlPart,
      textPart
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Template '${templateName}' atualizado com sucesso no AWS SES`
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao atualizar template SES:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remover template do SES
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateName = searchParams.get('templateName')

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'Nome do template é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🗑️ Removendo template AWS SES:', templateName)

    const result = await awsSESService.deleteTemplate(templateName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Template '${templateName}' removido com sucesso do AWS SES`
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao remover template SES:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}