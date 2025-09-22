/**
 * EMPTY Mock WhatsApp Service - NÃO FAZ NADA
 * Este arquivo existe apenas para evitar erros de import
 * MAS NÃO ENVIA MENSAGENS AUTOMÁTICAS
 */

export interface SendMessageOptions {
  to: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  content?: string
  mediaUrl?: string
  caption?: string
  templateName?: string
  templateParams?: string[]
}

class EmptyMockWhatsAppService {
  constructor() {
    console.log('[DISABLED] Mock WhatsApp Service - NÃO faz nada')
  }

  async sendMessage(accountId: string, options: SendMessageOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[DISABLED] Mock service called but DISABLED - no message sent')
    return {
      success: false,
      error: 'Mock service disabled - use real WhatsApp only'
    }
  }

  async getAccountStatus(accountId: string) {
    return { status: 'DISCONNECTED' }
  }

  async createConnection(accountId: string) {
    return { success: false, error: 'Mock disabled' }
  }
}

// Export disabled mock
export const mockWhatsAppService = new EmptyMockWhatsAppService()