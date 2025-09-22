import { prisma } from '@/lib/prisma'

export interface WhatsAppNotification {
  id: string
  type: 'new_message' | 'connection_status' | 'message_status'
  title: string
  message: string
  accountId?: string
  conversationId?: string
  messageId?: string
  userId: string
  read: boolean
  createdAt: Date
}

export class WhatsAppNotificationService {
  private static instance: WhatsAppNotificationService
  private listeners: Map<string, (notification: WhatsAppNotification) => void> = new Map()

  private constructor() {}

  static getInstance(): WhatsAppNotificationService {
    if (!WhatsAppNotificationService.instance) {
      WhatsAppNotificationService.instance = new WhatsAppNotificationService()
    }
    return WhatsAppNotificationService.instance
  }

  // Subscribe to notifications for a specific user
  subscribe(userId: string, callback: (notification: WhatsAppNotification) => void) {
    this.listeners.set(userId, callback)
  }

  // Unsubscribe from notifications
  unsubscribe(userId: string) {
    this.listeners.delete(userId)
  }

  // Notify a specific user
  async notify(userId: string, notification: Omit<WhatsAppNotification, 'id' | 'userId' | 'read' | 'createdAt'>) {
    const fullNotification: WhatsAppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      read: false,
      createdAt: new Date(),
    }

    // Store notification in database (optional, for persistence)
    try {
      // In a real implementation, you might want to store notifications
      // await prisma.notification.create({ data: fullNotification })
    } catch (error) {
      console.error('Error storing notification:', error)
    }

    // Send to subscribed listener
    const listener = this.listeners.get(userId)
    if (listener) {
      listener(fullNotification)
    }

    return fullNotification
  }

  // Notify about new incoming message
  async notifyNewMessage(userId: string, accountId: string, conversationId: string, messageContent: string, fromNumber: string) {
    return this.notify(userId, {
      type: 'new_message',
      title: 'Nova mensagem WhatsApp',
      message: `Mensagem de ${fromNumber}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
      accountId,
      conversationId,
    })
  }

  // Notify about connection status changes
  async notifyConnectionStatus(userId: string, accountId: string, phoneNumber: string, status: string) {
    const statusMessages = {
      CONNECTED: 'conectado com sucesso',
      DISCONNECTED: 'foi desconectado',
      ERROR: 'encontrou um erro na conexão',
      CONNECTING: 'está conectando',
    }

    const message = statusMessages[status as keyof typeof statusMessages] || `mudou para ${status}`

    return this.notify(userId, {
      type: 'connection_status',
      title: 'Status WhatsApp alterado',
      message: `${phoneNumber} ${message}`,
      accountId,
    })
  }

  // Notify about message delivery status
  async notifyMessageStatus(userId: string, messageId: string, status: string, toNumber: string) {
    if (status === 'DELIVERED' || status === 'READ') {
      const statusText = status === 'READ' ? 'lida' : 'entregue'

      return this.notify(userId, {
        type: 'message_status',
        title: `Mensagem ${statusText}`,
        message: `Sua mensagem para ${toNumber} foi ${statusText}`,
        messageId,
      })
    }
  }

  // Get unread notifications count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // In a real implementation, you would query the database
      // return await prisma.notification.count({
      //   where: { userId, read: false }
      // })
      return 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Mark notifications as read
  async markAsRead(userId: string, notificationIds: string[]) {
    try {
      // In a real implementation, you would update the database
      // await prisma.notification.updateMany({
      //   where: { userId, id: { in: notificationIds } },
      //   data: { read: true }
      // })
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }
}

// Global instance
export const whatsappNotifications = WhatsAppNotificationService.getInstance()

// Webhook handler for processing WhatsApp events
export async function processWhatsAppWebhook(payload: any) {
  try {
    const event = payload.event
    const data = payload.data

    switch (event) {
      case 'message':
        await handleIncomingMessage(data)
        break
      case 'message_status':
        await handleMessageStatus(data)
        break
      case 'connection_status':
        await handleConnectionStatus(data)
        break
      default:
        console.log('Unknown webhook event:', event)
    }
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
  }
}

async function handleIncomingMessage(data: any) {
  try {
    const { accountId, fromNumber, toNumber, content, messageType } = data

    // Find the account
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
      include: { user: true }
    })

    if (!account) return

    // Find or create conversation
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        accountId,
        contactNumber: fromNumber,
      }
    })

    const isNewContact = !conversation

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          accountId,
          contactNumber: fromNumber,
          contactName: fromNumber, // You might want to fetch contact name from WhatsApp
          status: 'ACTIVE',
          lastMessageAt: new Date(),
          unreadCount: 1,
        }
      })

      // Process new contact triggers
      await processNewContactTriggers(conversation.id, account.userId)
    } else {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        }
      })
    }

    // Create message record
    await prisma.whatsAppMessage.create({
      data: {
        accountId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        messageType: messageType || 'TEXT',
        content,
        status: 'RECEIVED',
        fromNumber,
        toNumber,
        timestamp: new Date(),
      }
    })

    // Process keyword triggers (only for text messages)
    if (messageType === 'TEXT' || !messageType) {
      await processKeywordTriggers(content, conversation.id, account.userId)
    }

    // Send notification to user
    await whatsappNotifications.notifyNewMessage(
      account.userId,
      accountId,
      conversation.id,
      content,
      fromNumber
    )
  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleMessageStatus(data: any) {
  try {
    const { messageId, status, toNumber } = data

    // Update message status
    const message = await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: { status },
      include: {
        account: { include: { user: true } }
      }
    })

    if (message && message.account.user) {
      await whatsappNotifications.notifyMessageStatus(
        message.account.user.id,
        messageId,
        status,
        toNumber
      )
    }
  } catch (error) {
    console.error('Error handling message status:', error)
  }
}

async function handleConnectionStatus(data: any) {
  try {
    const { accountId, status } = data

    // Update account status
    const account = await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        status,
        lastHeartbeat: status === 'CONNECTED' ? new Date() : null
      },
      include: { user: true }
    })

    if (account && account.user) {
      await whatsappNotifications.notifyConnectionStatus(
        account.user.id,
        accountId,
        account.phoneNumber,
        status
      )
    }
  } catch (error) {
    console.error('Error handling connection status:', error)
  }
}

// Process keyword triggers when a message is received
async function processKeywordTriggers(messageText: string, conversationId: string, userId: string) {
  try {
    // Buscar todos os gatilhos de palavra-chave ativos do usuário
    const keywordTriggers = await prisma.flowTrigger.findMany({
      where: {
        triggerType: 'KEYWORD',
        isActive: true,
        flow: {
          isActive: true,
          userId: userId
        }
      },
      include: {
        flow: true
      }
    })

    if (keywordTriggers.length === 0) return

    const messageWords = messageText.toLowerCase().split(/\s+/)

    for (const trigger of keywordTriggers) {
      try {
        const config = trigger.config ? JSON.parse(trigger.config) : {}
        const keywords = config.keywords || []

        // Verificar se alguma palavra-chave está presente na mensagem
        const hasKeyword = keywords.some((keyword: string) =>
          messageWords.some(word => word.includes(keyword.toLowerCase()))
        )

        if (hasKeyword) {
          // Verificar se já existe uma execução recente (evitar spam)
          const recentExecution = await prisma.flowExecution.findFirst({
            where: {
              flowId: trigger.flowId,
              conversationId: conversationId,
              triggerType: 'KEYWORD',
              startedAt: {
                gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
              }
            }
          })

          if (!recentExecution) {
            // Criar nova execução do fluxo
            const execution = await prisma.flowExecution.create({
              data: {
                flowId: trigger.flowId,
                conversationId: conversationId,
                accountId: accountId,
                status: 'PENDING',
                triggerType: 'KEYWORD',
                startedAt: new Date(),
                currentStep: 1,
                metadata: JSON.stringify({
                  triggerId: trigger.id,
                  triggerName: trigger.name,
                  matchedKeyword: keywords.find((k: string) =>
                    messageWords.some(word => word.includes(k.toLowerCase()))
                  ),
                  originalMessage: messageText
                })
              }
            })

            console.log(`Keyword trigger activated: ${trigger.name} for conversation ${conversationId}`)

            // Aqui você pode adicionar lógica para processar o fluxo imediatamente
            // ou adicionar a execução em uma fila de processamento
            await processFlowExecution(execution.id)
          }
        }
      } catch (error) {
        console.error(`Error processing keyword trigger ${trigger.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error processing keyword triggers:', error)
  }
}

// Process new contact triggers when a conversation is created
async function processNewContactTriggers(conversationId: string, userId: string) {
  try {
    // Buscar todos os gatilhos de novo contato ativos do usuário
    const newContactTriggers = await prisma.flowTrigger.findMany({
      where: {
        triggerType: 'EVENT',
        isActive: true,
        flow: {
          isActive: true,
          userId: userId
        }
      },
      include: {
        flow: true
      }
    })

    for (const trigger of newContactTriggers) {
      try {
        const config = trigger.config ? JSON.parse(trigger.config) : {}

        if (config.eventType === 'new_contact') {
          // Criar execução do fluxo para novo contato
          const execution = await prisma.flowExecution.create({
            data: {
              flowId: trigger.flowId,
              conversationId: conversationId,
              accountId: accountId,
              status: 'PENDING',
              triggerType: 'EVENT',
              startedAt: new Date(),
              currentStep: 1,
              metadata: JSON.stringify({
                triggerId: trigger.id,
                triggerName: trigger.name,
                eventType: 'new_contact'
              })
            }
          })

          console.log(`New contact trigger activated: ${trigger.name} for conversation ${conversationId}`)

          // Processar fluxo imediatamente
          await processFlowExecution(execution.id)
        }
      } catch (error) {
        console.error(`Error processing new contact trigger ${trigger.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error processing new contact triggers:', error)
  }
}

// Process a flow execution (placeholder for actual flow processing logic)
async function processFlowExecution(executionId: string) {
  try {
    const execution = await prisma.flowExecution.findUnique({
      where: { id: executionId },
      include: {
        flow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        conversation: true
      }
    })

    if (!execution || !execution.flow.steps.length) {
      console.log(`No steps found for execution ${executionId}`)
      return
    }

    // Marcar execução como em andamento
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' }
    })

    // Processar primeiro passo (implementar lógica real aqui)
    const firstStep = execution.flow.steps[0]
    console.log(`Processing step ${firstStep.stepOrder} of flow ${execution.flow.name}`)

    // Placeholder: marcar como completado
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    console.log(`Flow execution ${executionId} completed`)
  } catch (error) {
    console.error(`Error processing flow execution ${executionId}:`, error)

    // Marcar execução como com erro
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }).catch(console.error)
  }
}