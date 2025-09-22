import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'

interface ZapMeowWebhookPayload {
  event: string
  instanceId: string
  phone: string
  message: string
  messageId: string
  timestamp: string
  isFromMe: boolean
  funnelData?: {
    funnelId?: string
    stepId?: string
    [key: string]: any
  }
  leadData?: {
    [key: string]: any
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Webhook ZapMeow recebido')

    const payload: ZapMeowWebhookPayload = await request.json()
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))

    // Validar dados obrigatórios
    if (!payload.event || !payload.instanceId || !payload.phone) {
      console.log('❌ Dados obrigatórios faltando')
      return NextResponse.json({
        error: 'Dados obrigatórios faltando: event, instanceId, phone'
      }, { status: 400 })
    }

    // Processar baseado no tipo de evento
    switch (payload.event) {
      case 'message_received':
        await handleMessageReceived(payload)
        break

      case 'message_sent':
        await handleMessageSent(payload)
        break

      case 'funnel_trigger':
        await handleFunnelTrigger(payload)
        break

      default:
        console.log('⚠️ Evento não reconhecido:', payload.event)
        return NextResponse.json({
          error: 'Evento não reconhecido: ' + payload.event
        }, { status: 400 })
    }

    console.log('✅ Webhook processado com sucesso')
    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro processando webhook:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Processar mensagem recebida
async function handleMessageReceived(payload: ZapMeowWebhookPayload) {
  console.log('📨 Processando mensagem recebida:', payload.phone)

  try {
    // Encontrar conta WhatsApp
    let account = await prisma.whatsAppAccount.findFirst({
      where: {
        // Assumindo que instanceId corresponde ao ID da conta
        // Você pode ajustar esta lógica conforme sua implementação
        phoneNumber: payload.instanceId
      }
    })

    if (!account) {
      console.log('⚠️ Conta WhatsApp não encontrada para instanceId:', payload.instanceId)
      console.log('🚨 Webhook recebido mas conta não existe no sistema')
      console.log('💡 Isso é normal - ZapMeow enviou webhook mas ainda não criamos a conta')

      // Por enquanto, só registrar o evento sem criar conta
      // A conta deve ser criada através da interface admin do Next.js
      console.log('⏭️ Pulando processamento até conta ser criada')
      return
    }

    // Encontrar ou criar conversa
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        accountId: account.id,
        contactNumber: payload.phone
      }
    })

    if (!conversation) {
      console.log('📝 Criando nova conversa para:', payload.phone)
      conversation = await prisma.whatsAppConversation.create({
        data: {
          accountId: account.id,
          contactNumber: payload.phone,
          contactName: payload.phone.split('@')[0],
          isGroup: payload.phone.includes('@g.us'),
          status: 'ACTIVE',
          lastMessageAt: new Date(),
          unreadCount: 1
        }
      })
    } else {
      // Atualizar conversa existente
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 }
        }
      })
    }

    // Salvar mensagem
    await prisma.whatsAppMessage.create({
      data: {
        accountId: account.id,
        conversationId: conversation.id,
        whatsappId: payload.messageId,
        direction: 'INBOUND',
        messageType: 'TEXT',
        content: payload.message,
        status: 'RECEIVED',
        fromNumber: payload.phone,
        toNumber: account.phoneNumber,
        timestamp: new Date(payload.timestamp)
      }
    })

    // TODO: Aqui você pode adicionar lógica para disparar funis automaticamente
    // com base na mensagem recebida
    console.log('💡 TODO: Verificar se deve disparar funil automático')

  } catch (error) {
    console.error('❌ Erro salvando mensagem recebida:', error)
    throw error
  }
}

// Processar mensagem enviada
async function handleMessageSent(payload: ZapMeowWebhookPayload) {
  console.log('📤 Processando mensagem enviada:', payload.phone)

  try {
    // Lógica similar ao recebimento, mas para mensagens enviadas
    // Marcar como enviada, não incrementar unreadCount, etc.

    // Encontrar conta
    const account = await prisma.whatsAppAccount.findFirst({
      where: { phoneNumber: payload.instanceId }
    })

    if (!account) {
      console.log('⚠️ Conta não encontrada para mensagem enviada')
      return
    }

    // Encontrar conversa
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        accountId: account.id,
        contactNumber: payload.phone
      }
    })

    if (conversation) {
      // Salvar mensagem enviada
      await prisma.whatsAppMessage.create({
        data: {
          accountId: account.id,
          conversationId: conversation.id,
          whatsappId: payload.messageId,
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          content: payload.message,
          status: 'SENT',
          fromNumber: account.phoneNumber,
          toNumber: payload.phone,
          timestamp: new Date(payload.timestamp)
        }
      })

      // Atualizar última mensagem da conversa
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      })
    }

  } catch (error) {
    console.error('❌ Erro salvando mensagem enviada:', error)
    throw error
  }
}

// Processar trigger de funil
async function handleFunnelTrigger(payload: ZapMeowWebhookPayload) {
  console.log('🎯 Processando trigger de funil:', payload.funnelData?.funnelId)

  try {
    // TODO: Implementar lógica de execução de funil
    // 1. Encontrar o funil pelo ID
    // 2. Iniciar execução do funil
    // 3. Salvar estado da execução

    console.log('💡 TODO: Implementar execução de funil')
    console.log('📞 Telefone:', payload.phone)
    console.log('🔗 Funil ID:', payload.funnelData?.funnelId)
    console.log('📊 Dados do Lead:', payload.leadData)

  } catch (error) {
    console.error('❌ Erro processando trigger de funil:', error)
    throw error
  }
}