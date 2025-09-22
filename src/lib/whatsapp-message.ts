import { prisma } from '@/lib/prisma'

export class WhatsAppMessageService {
  private static instance: WhatsAppMessageService

  private constructor() {}

  static getInstance(): WhatsAppMessageService {
    if (!WhatsAppMessageService.instance) {
      WhatsAppMessageService.instance = new WhatsAppMessageService()
    }
    return WhatsAppMessageService.instance
  }

  // Enviar mensagem via WhatsApp
  async sendMessage(accountId: string, toNumber: string, content: string, messageType: 'TEXT' | 'MEDIA' = 'TEXT') {
    try {
      console.log(`📤 Enviando mensagem para ${toNumber} via conta ${accountId}`)

      // Buscar a conta do WhatsApp
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId }
      })

      if (!account) {
        throw new Error(`Conta WhatsApp ${accountId} não encontrada`)
      }

      if (account.status !== 'CONNECTED') {
        throw new Error(`Conta WhatsApp ${accountId} não está conectada (status: ${account.status})`)
      }

      // Buscar ou criar conversa
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: {
          accountId,
          contactNumber: toNumber
        }
      })

      if (!conversation) {
        // Criar nova conversa
        conversation = await prisma.whatsAppConversation.create({
          data: {
            accountId,
            contactNumber: toNumber,
            contactName: toNumber, // Por padrão usar o número como nome
            status: 'ACTIVE',
            lastMessageAt: new Date(),
            unreadCount: 0
          }
        })

        console.log(`➕ Nova conversa criada: ${conversation.id}`)
      }

      // Criar registro da mensagem no banco
      const message = await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          messageType,
          content,
          status: 'PENDING',
          fromNumber: account.phoneNumber,
          toNumber,
          timestamp: new Date()
        }
      })

      // Aqui você integraria com a API real do WhatsApp
      // Por enquanto, vamos simular o envio
      console.log(`✅ Mensagem simulada enviada:`)
      console.log(`   De: ${account.phoneNumber}`)
      console.log(`   Para: ${toNumber}`)
      console.log(`   Conteúdo: ${content}`)

      // Simular sucesso após um delay
      setTimeout(async () => {
        try {
          await prisma.whatsAppMessage.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              timestamp: new Date()
            }
          })

          // Atualizar lastMessageAt da conversa
          await prisma.whatsAppConversation.update({
            where: { id: conversation!.id },
            data: { lastMessageAt: new Date() }
          })

          console.log(`✅ Mensagem ${message.id} marcada como enviada`)
        } catch (error) {
          console.error(`❌ Erro ao atualizar status da mensagem ${message.id}:`, error)
        }
      }, 1000) // Simula delay de 1 segundo

      return {
        success: true,
        messageId: message.id,
        conversationId: conversation.id
      }

    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${toNumber}:`, error)
      throw error
    }
  }

  // Enviar mensagem com mídia
  async sendMediaMessage(accountId: string, toNumber: string, mediaUrl: string, caption?: string) {
    try {
      console.log(`📷 Enviando mídia para ${toNumber}: ${mediaUrl}`)

      // Por enquanto, tratamos como mensagem de texto com o link
      const content = caption ? `${caption}\n\n${mediaUrl}` : mediaUrl

      return await this.sendMessage(accountId, toNumber, content, 'MEDIA')

    } catch (error) {
      console.error(`❌ Erro ao enviar mídia para ${toNumber}:`, error)
      throw error
    }
  }

  // Buscar mensagens de uma conversa
  async getConversationMessages(conversationId: string, limit: number = 50) {
    try {
      const messages = await prisma.whatsAppMessage.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        take: limit
      })

      return messages.reverse() // Retornar em ordem cronológica
    } catch (error) {
      console.error(`❌ Erro ao buscar mensagens da conversa ${conversationId}:`, error)
      throw error
    }
  }

  // Marcar conversa como lida
  async markConversationAsRead(conversationId: string) {
    try {
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 }
      })

      console.log(`✅ Conversa ${conversationId} marcada como lida`)
    } catch (error) {
      console.error(`❌ Erro ao marcar conversa ${conversationId} como lida:`, error)
      throw error
    }
  }

  // Obter estatísticas de mensagens
  async getMessageStats(accountId: string, days: number = 30) {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)

      const stats = await prisma.whatsAppMessage.groupBy({
        by: ['status'],
        where: {
          accountId,
          timestamp: { gte: since }
        },
        _count: {
          id: true
        }
      })

      const result = {
        period: `${days} dias`,
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0
      }

      stats.forEach(stat => {
        result.total += stat._count.id
        switch (stat.status) {
          case 'SENT':
          case 'DELIVERED':
          case 'READ':
            result.sent += stat._count.id
            break
          case 'PENDING':
            result.pending += stat._count.id
            break
          case 'FAILED':
            result.failed += stat._count.id
            break
        }
      })

      return result
    } catch (error) {
      console.error(`❌ Erro ao obter estatísticas de mensagens:`, error)
      throw error
    }
  }

  // Verificar status da conta
  async getAccountStatus(accountId: string) {
    try {
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          phoneNumber: true,
          status: true,
          lastHeartbeat: true
        }
      })

      if (!account) {
        return { connected: false, error: 'Conta não encontrada' }
      }

      return {
        connected: account.status === 'CONNECTED',
        phoneNumber: account.phoneNumber,
        status: account.status,
        lastHeartbeat: account.lastHeartbeat
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar status da conta ${accountId}:`, error)
      return { connected: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  // Simular recebimento de mensagem (para testes)
  async simulateIncomingMessage(accountId: string, fromNumber: string, content: string) {
    try {
      console.log(`📥 Simulando mensagem recebida de ${fromNumber}: ${content}`)

      // Buscar ou criar conversa
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: {
          accountId,
          contactNumber: fromNumber
        }
      })

      if (!conversation) {
        conversation = await prisma.whatsAppConversation.create({
          data: {
            accountId,
            contactNumber: fromNumber,
            contactName: fromNumber,
            status: 'ACTIVE',
            lastMessageAt: new Date(),
            unreadCount: 1
          }
        })
      } else {
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 }
          }
        })
      }

      // Criar mensagem recebida
      const message = await prisma.whatsAppMessage.create({
        data: {
          accountId,
          conversationId: conversation.id,
          direction: 'INBOUND',
          messageType: 'TEXT',
          content,
          status: 'RECEIVED',
          fromNumber,
          toNumber: '', // Será preenchido com o número da conta
          timestamp: new Date()
        }
      })

      console.log(`✅ Mensagem simulada recebida: ${message.id}`)

      return {
        success: true,
        messageId: message.id,
        conversationId: conversation.id
      }

    } catch (error) {
      console.error(`❌ Erro ao simular mensagem recebida:`, error)
      throw error
    }
  }
}