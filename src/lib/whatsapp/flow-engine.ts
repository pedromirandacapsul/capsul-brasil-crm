import { EventEmitter } from 'events'
import { prisma } from '@/lib/prisma'

export interface FlowStepData {
  id: string
  flowId: string
  stepOrder: number
  stepType: 'MESSAGE' | 'DELAY' | 'CONDITION' | 'ACTION'
  messageType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  content?: string
  mediaUrl?: string
  delayMinutes: number
  conditions?: any
  actions?: any
}

export interface FlowExecutionContext {
  executionId: string
  flowId: string
  conversationId: string
  accountId: string
  contactNumber: string
  contactName?: string
  variables: Record<string, any>
  currentStepId?: string
}

export interface TriggerData {
  type: 'KEYWORD' | 'NEW_CONTACT' | 'TIME_BASED' | 'MANUAL'
  value?: string
  conversationId: string
  accountId: string
  messageContent?: string
}

class FlowEngine extends EventEmitter {
  private activeExecutions = new Map<string, FlowExecutionContext>()
  private scheduledTasks = new Map<string, NodeJS.Timeout>()

  constructor() {
    super()
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Listen for new messages to trigger flows
    this.on('message:received', this.handleMessageReceived.bind(this))
    this.on('contact:new', this.handleNewContact.bind(this))
    this.on('flow:manual', this.handleManualTrigger.bind(this))
  }

  // Main trigger handler
  async handleTrigger(triggerData: TriggerData): Promise<void> {
    try {
      console.log('🎯 Handling trigger:', triggerData.type, triggerData.value)

      // Find active flows that match this trigger
      const flows = await this.findMatchingFlows(triggerData)

      for (const flow of flows) {
        await this.startFlowExecution(flow.id, triggerData.conversationId, triggerData.accountId)
      }
    } catch (error) {
      console.error('❌ Error handling trigger:', error)
    }
  }

  // Find flows that match the trigger criteria
  private async findMatchingFlows(triggerData: TriggerData) {
    const whereConditions: any = {
      isActive: true
    }

    // Add trigger-specific conditions
    if (triggerData.type === 'KEYWORD' && triggerData.value) {
      whereConditions.OR = [
        {
          triggerType: 'KEYWORD',
          triggerValue: triggerData.value.toLowerCase()
        },
        {
          triggers: {
            some: {
              triggerType: 'KEYWORD',
              triggerValue: triggerData.value.toLowerCase(),
              isActive: true
            }
          }
        }
      ]
    } else {
      whereConditions.triggerType = triggerData.type
    }

    return await prisma.messageFlow.findMany({
      where: whereConditions,
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        triggers: true
      }
    })
  }

  // Start a new flow execution
  async startFlowExecution(flowId: string, conversationId: string, accountId: string): Promise<string> {
    try {
      // Check if there's already an active execution for this conversation
      const existingExecution = await prisma.flowExecution.findFirst({
        where: {
          flowId,
          conversationId,
          status: 'RUNNING'
        }
      })

      if (existingExecution) {
        console.log('⚠️ Flow already running for conversation:', conversationId)
        return existingExecution.id
      }

      // Get conversation details
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId }
      })

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Create flow execution
      const execution = await prisma.flowExecution.create({
        data: {
          flowId,
          conversationId,
          accountId,
          status: 'RUNNING',
          data: JSON.stringify({
            contactNumber: conversation.contactNumber,
            contactName: conversation.contactName,
            variables: {}
          })
        }
      })

      // Create execution context
      const context: FlowExecutionContext = {
        executionId: execution.id,
        flowId,
        conversationId,
        accountId,
        contactNumber: conversation.contactNumber,
        contactName: conversation.contactName,
        variables: {}
      }

      this.activeExecutions.set(execution.id, context)

      // Start executing the first step
      await this.executeNextStep(execution.id)

      console.log('✅ Flow execution started:', execution.id)
      return execution.id

    } catch (error) {
      console.error('❌ Error starting flow execution:', error)
      throw error
    }
  }

  // Execute the next step in a flow
  async executeNextStep(executionId: string): Promise<void> {
    try {
      const context = this.activeExecutions.get(executionId)
      if (!context) {
        console.error('❌ Execution context not found:', executionId)
        return
      }

      // Get execution from database
      const execution = await prisma.flowExecution.findUnique({
        where: { id: executionId },
        include: {
          flow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          }
        }
      })

      if (!execution || execution.status !== 'RUNNING') {
        console.log('⚠️ Execution not running:', executionId)
        this.activeExecutions.delete(executionId)
        return
      }

      // Find current step
      let currentStepIndex = 0
      if (execution.currentStepId) {
        currentStepIndex = execution.flow.steps.findIndex(step => step.id === execution.currentStepId) + 1
      }

      // Check if we've reached the end
      if (currentStepIndex >= execution.flow.steps.length) {
        await this.completeFlowExecution(executionId)
        return
      }

      const currentStep = execution.flow.steps[currentStepIndex]

      // Update current step in database
      await prisma.flowExecution.update({
        where: { id: executionId },
        data: { currentStepId: currentStep.id }
      })

      console.log(`🔄 Executing step ${currentStep.stepOrder}: ${currentStep.stepType}`)

      // Execute the step based on its type
      await this.executeStep(context, currentStep)

    } catch (error) {
      console.error('❌ Error executing next step:', error)
      await this.failFlowExecution(executionId, error.message)
    }
  }

  // Execute a specific step
  private async executeStep(context: FlowExecutionContext, step: FlowStepData): Promise<void> {
    switch (step.stepType) {
      case 'MESSAGE':
        await this.executeMessageStep(context, step)
        break
      case 'DELAY':
        await this.executeDelayStep(context, step)
        break
      case 'CONDITION':
        await this.executeConditionStep(context, step)
        break
      case 'ACTION':
        await this.executeActionStep(context, step)
        break
      default:
        console.error('❌ Unknown step type:', step.stepType)
        await this.executeNextStep(context.executionId)
    }
  }

  // Execute a message step
  private async executeMessageStep(context: FlowExecutionContext, step: FlowStepData): Promise<void> {
    try {
      const { mockWhatsAppService } = await import('./mock-whatsapp-service')
      const { simulateHumanTyping } = await import('./typing-simulation')

      // Replace variables in content
      const content = this.replaceVariables(step.content || '', context.variables)

      console.log(`📤 Sending ${step.messageType} message:`, content)

      // For TEXT messages, simulate typing first
      if (step.messageType === 'TEXT' && content) {
        console.log('⌨️ Simulating human typing...')
        await simulateHumanTyping(context.conversationId, context.accountId, content, 'casual')
      }

      // Send message
      const result = await mockWhatsAppService.sendMessage(context.accountId, {
        to: context.contactNumber,
        type: step.messageType?.toLowerCase() || 'text',
        content,
        mediaUrl: step.mediaUrl
      })

      if (result.success) {
        console.log('✅ Message sent successfully')
        // Continue to next step immediately for messages
        await this.executeNextStep(context.executionId)
      } else {
        throw new Error(result.error || 'Failed to send message')
      }

    } catch (error) {
      console.error('❌ Error executing message step:', error)
      throw error
    }
  }

  // Execute a delay step
  private async executeDelayStep(context: FlowExecutionContext, step: FlowStepData): Promise<void> {
    const delayMs = step.delayMinutes * 60 * 1000
    console.log(`⏳ Delaying for ${step.delayMinutes} minutes`)

    const timeoutId = setTimeout(() => {
      this.scheduledTasks.delete(context.executionId)
      this.executeNextStep(context.executionId)
    }, delayMs)

    this.scheduledTasks.set(context.executionId, timeoutId)
  }

  // Execute a condition step
  private async executeConditionStep(context: FlowExecutionContext, step: FlowStepData): Promise<void> {
    try {
      const conditions = step.conditions || {}
      let conditionMet = true

      // Simple condition evaluation (can be extended)
      if (conditions.hasTag) {
        const hasTag = await this.checkContactTag(context.conversationId, conditions.hasTag)
        conditionMet = conditionMet && hasTag
      }

      if (conditions.messageContains) {
        // Check recent messages for content
        const hasContent = await this.checkRecentMessageContent(context.conversationId, conditions.messageContains)
        conditionMet = conditionMet && hasContent
      }

      if (conditionMet) {
        console.log('✅ Condition met, continuing flow')
        await this.executeNextStep(context.executionId)
      } else {
        console.log('❌ Condition not met, ending flow')
        await this.completeFlowExecution(context.executionId)
      }

    } catch (error) {
      console.error('❌ Error executing condition step:', error)
      throw error
    }
  }

  // Execute an action step
  private async executeActionStep(context: FlowExecutionContext, step: FlowStepData): Promise<void> {
    try {
      const actions = step.actions || {}

      // Add tags
      if (actions.addTags && Array.isArray(actions.addTags)) {
        for (const tag of actions.addTags) {
          await this.addContactTag(context.conversationId, tag)
        }
      }

      // Set variables
      if (actions.setVariables) {
        Object.assign(context.variables, actions.setVariables)
      }

      // Assign to user
      if (actions.assignToUser) {
        await prisma.whatsAppConversation.update({
          where: { id: context.conversationId },
          data: { assignedUserId: actions.assignToUser }
        })
      }

      console.log('✅ Action step completed')
      await this.executeNextStep(context.executionId)

    } catch (error) {
      console.error('❌ Error executing action step:', error)
      throw error
    }
  }

  // Helper methods
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
    // Replace common variables
    result = result.replace(/{{name}}/g, variables.contactName || variables.contactNumber || 'Cliente')
    result = result.replace(/{{time}}/g, new Date().toLocaleTimeString('pt-BR'))
    return result
  }

  private async checkContactTag(conversationId: string, tag: string): Promise<boolean> {
    const contactTag = await prisma.contactTag.findUnique({
      where: {
        conversationId_tag: {
          conversationId,
          tag
        }
      }
    })
    return !!contactTag
  }

  private async addContactTag(conversationId: string, tag: string): Promise<void> {
    await prisma.contactTag.upsert({
      where: {
        conversationId_tag: {
          conversationId,
          tag
        }
      },
      update: {},
      create: {
        conversationId,
        tag
      }
    })
  }

  private async checkRecentMessageContent(conversationId: string, searchContent: string): Promise<boolean> {
    const recentMessages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId,
        direction: 'INBOUND'
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    })

    return recentMessages.some(msg =>
      msg.content?.toLowerCase().includes(searchContent.toLowerCase())
    )
  }

  // Complete flow execution
  private async completeFlowExecution(executionId: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    this.activeExecutions.delete(executionId)

    // Clear any scheduled tasks
    const timeoutId = this.scheduledTasks.get(executionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledTasks.delete(executionId)
    }

    console.log('✅ Flow execution completed:', executionId)
  }

  // Fail flow execution
  private async failFlowExecution(executionId: string, error: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        data: JSON.stringify({ error })
      }
    })

    this.activeExecutions.delete(executionId)

    // Clear any scheduled tasks
    const timeoutId = this.scheduledTasks.get(executionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledTasks.delete(executionId)
    }

    console.error('❌ Flow execution failed:', executionId, error)
  }

  // Event handlers
  private async handleMessageReceived(data: { conversationId: string, accountId: string, content: string }) {
    // Check for keyword triggers
    const keywords = await this.extractKeywords(data.content)
    for (const keyword of keywords) {
      await this.handleTrigger({
        type: 'KEYWORD',
        value: keyword,
        conversationId: data.conversationId,
        accountId: data.accountId,
        messageContent: data.content
      })
    }
  }

  private async handleNewContact(data: { conversationId: string, accountId: string }) {
    await this.handleTrigger({
      type: 'NEW_CONTACT',
      conversationId: data.conversationId,
      accountId: data.accountId
    })
  }

  private async handleManualTrigger(data: { flowId: string, conversationId: string, accountId: string }) {
    await this.startFlowExecution(data.flowId, data.conversationId, data.accountId)
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction - can be improved with NLP
    const words = content.toLowerCase().split(/\s+/)
    const commonKeywords = ['oi', 'olá', 'hello', 'ajuda', 'help', 'informação', 'preço', 'produto']
    return words.filter(word => commonKeywords.includes(word))
  }

  // Public methods for external usage
  async pauseExecution(executionId: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { status: 'PAUSED' }
    })

    // Clear scheduled tasks
    const timeoutId = this.scheduledTasks.get(executionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledTasks.delete(executionId)
    }

    this.activeExecutions.delete(executionId)
  }

  async resumeExecution(executionId: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' }
    })

    await this.executeNextStep(executionId)
  }

  async stopExecution(executionId: string): Promise<void> {
    await this.completeFlowExecution(executionId)
  }

  // Get active executions for monitoring
  getActiveExecutions(): FlowExecutionContext[] {
    return Array.from(this.activeExecutions.values())
  }
}

// Global instance
export const flowEngine = new FlowEngine()

// Integration with existing WhatsApp service
export function initializeFlowEngine() {
  console.log('🚀 Initializing Flow Engine...')

  // This will be called when the WhatsApp service receives messages
  // to trigger flows based on keywords or new contacts
  return flowEngine
}