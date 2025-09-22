import { prisma } from '@/lib/prisma'
import { WhatsAppMessageService } from '@/lib/whatsapp-message'

export interface FlowStep {
  id: string
  stepOrder: number
  stepType: 'MESSAGE' | 'WAIT' | 'CONDITION' | 'ACTION'
  content?: string
  config?: any
}

export interface FlowExecution {
  id: string
  flowId: string
  conversationId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR' | 'PAUSED'
  currentStep: number
  metadata?: any
}

export class FlowProcessor {
  private static instance: FlowProcessor
  private whatsappService: WhatsAppMessageService
  private processingQueue: Map<string, boolean> = new Map()

  private constructor() {
    this.whatsappService = WhatsAppMessageService.getInstance()
  }

  static getInstance(): FlowProcessor {
    if (!FlowProcessor.instance) {
      FlowProcessor.instance = new FlowProcessor()
    }
    return FlowProcessor.instance
  }

  // Processar uma execução de fluxo
  async processExecution(executionId: string) {
    // Evitar processamento duplicado
    if (this.processingQueue.get(executionId)) {
      console.log(`⚠️ Execução ${executionId} já está sendo processada`)
      return
    }

    this.processingQueue.set(executionId, true)

    try {
      console.log(`🔄 Iniciando processamento da execução ${executionId}`)

      const execution = await this.getExecutionWithDetails(executionId)
      if (!execution) {
        console.log(`❌ Execução ${executionId} não encontrada`)
        return
      }

      if (execution.status === 'COMPLETED' || execution.status === 'ERROR') {
        console.log(`⚠️ Execução ${executionId} já foi finalizada (status: ${execution.status})`)
        return
      }

      // Marcar como em execução
      await this.updateExecutionStatus(executionId, 'RUNNING')

      // Processar passos sequencialmente
      await this.processSteps(execution)

      console.log(`✅ Execução ${executionId} processada com sucesso`)

    } catch (error) {
      console.error(`❌ Erro ao processar execução ${executionId}:`, error)
      await this.handleExecutionError(executionId, error)
    } finally {
      this.processingQueue.delete(executionId)
    }
  }

  // Obter execução com todos os detalhes necessários
  private async getExecutionWithDetails(executionId: string) {
    return await prisma.flowExecution.findUnique({
      where: { id: executionId },
      include: {
        flow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        conversation: {
          include: {
            account: {
              select: {
                id: true,
                phoneNumber: true,
                status: true
              }
            }
          }
        }
      }
    })
  }

  // Processar todos os passos do fluxo
  private async processSteps(execution: any) {
    const steps = execution.flow.steps
    if (!steps || steps.length === 0) {
      console.log(`⚠️ Fluxo ${execution.flowId} não possui passos`)
      await this.updateExecutionStatus(execution.id, 'COMPLETED')
      return
    }

    console.log(`📋 Processando ${steps.length} passos do fluxo "${execution.flow.name}"`)

    for (let i = execution.currentStep - 1; i < steps.length; i++) {
      const step = steps[i]
      console.log(`📍 Processando passo ${step.stepOrder}: ${step.stepType}`)

      // Atualizar passo atual
      await this.updateCurrentStep(execution.id, step.stepOrder)

      try {
        // Processar o passo específico
        await this.processStep(execution, step)

        // Delay entre passos (se configurado)
        const delay = this.getStepDelay(step)
        if (delay > 0) {
          console.log(`⏱️ Aguardando ${delay}ms antes do próximo passo`)
          await this.delay(delay)
        }

      } catch (error) {
        console.error(`❌ Erro no passo ${step.stepOrder}:`, error)
        throw error
      }
    }

    // Marcar como completo
    await this.updateExecutionStatus(execution.id, 'COMPLETED', new Date())
    console.log(`✅ Todos os passos do fluxo foram executados`)
  }

  // Processar um passo específico
  private async processStep(execution: any, step: FlowStep) {
    switch (step.stepType) {
      case 'MESSAGE':
        await this.processMessageStep(execution, step)
        break

      case 'WAIT':
        await this.processWaitStep(execution, step)
        break

      case 'CONDITION':
        await this.processConditionStep(execution, step)
        break

      case 'ACTION':
        await this.processActionStep(execution, step)
        break

      default:
        console.warn(`⚠️ Tipo de passo não suportado: ${step.stepType}`)
    }
  }

  // Processar passo de mensagem
  private async processMessageStep(execution: any, step: FlowStep) {
    if (!step.content) {
      console.warn(`⚠️ Passo de mensagem ${step.id} não possui conteúdo`)
      return
    }

    const account = execution.conversation.account
    const contactNumber = execution.conversation.contactNumber

    if (account.status !== 'CONNECTED') {
      throw new Error(`Conta WhatsApp ${account.id} não está conectada`)
    }

    console.log(`📤 Enviando mensagem para ${contactNumber}`)

    // Processar variáveis na mensagem
    const processedContent = this.processMessageVariables(step.content, execution)

    // Enviar mensagem
    const result = await this.whatsappService.sendMessage(
      account.id,
      contactNumber,
      processedContent
    )

    console.log(`✅ Mensagem enviada: ${result.messageId}`)

    // Registrar na metadata da execução
    await this.addExecutionLog(execution.id, {
      stepId: step.id,
      stepType: 'MESSAGE',
      action: 'message_sent',
      messageId: result.messageId,
      content: processedContent,
      timestamp: new Date()
    })
  }

  // Processar passo de espera
  private async processWaitStep(execution: any, step: FlowStep) {
    const config = step.config ? JSON.parse(step.config) : {}
    const waitTime = config.waitTime || 5000 // 5 segundos por padrão

    console.log(`⏳ Aguardando ${waitTime}ms (passo de espera)`)
    await this.delay(waitTime)

    await this.addExecutionLog(execution.id, {
      stepId: step.id,
      stepType: 'WAIT',
      action: 'wait_completed',
      waitTime,
      timestamp: new Date()
    })
  }

  // Processar passo de condição
  private async processConditionStep(execution: any, step: FlowStep) {
    const config = step.config ? JSON.parse(step.config) : {}

    console.log(`🔍 Avaliando condição: ${config.condition || 'nenhuma'}`)

    // Por enquanto, apenas registrar - implementar lógica de condição depois
    await this.addExecutionLog(execution.id, {
      stepId: step.id,
      stepType: 'CONDITION',
      action: 'condition_evaluated',
      condition: config.condition,
      result: true, // Placeholder
      timestamp: new Date()
    })
  }

  // Processar passo de ação
  private async processActionStep(execution: any, step: FlowStep) {
    const config = step.config ? JSON.parse(step.config) : {}

    console.log(`⚡ Executando ação: ${config.action || 'nenhuma'}`)

    // Por enquanto, apenas registrar - implementar ações específicas depois
    await this.addExecutionLog(execution.id, {
      stepId: step.id,
      stepType: 'ACTION',
      action: 'action_executed',
      actionType: config.action,
      timestamp: new Date()
    })
  }

  // Processar variáveis na mensagem
  private processMessageVariables(content: string, execution: any): string {
    let processedContent = content

    // Variáveis básicas
    const variables = {
      '{{contact_name}}': execution.conversation.contactName || execution.conversation.contactNumber,
      '{{contact_number}}': execution.conversation.contactNumber,
      '{{flow_name}}': execution.flow.name,
      '{{current_time}}': new Date().toLocaleString('pt-BR'),
      '{{current_date}}': new Date().toLocaleDateString('pt-BR')
    }

    // Substituir variáveis
    for (const [variable, value] of Object.entries(variables)) {
      processedContent = processedContent.replace(new RegExp(variable, 'g'), value)
    }

    return processedContent
  }

  // Obter delay configurado para o passo
  private getStepDelay(step: FlowStep): number {
    const config = step.config ? JSON.parse(step.config) : {}
    return config.delay || 1000 // 1 segundo por padrão entre passos
  }

  // Delay utilitário
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Atualizar status da execução
  private async updateExecutionStatus(executionId: string, status: string, completedAt?: Date) {
    const updateData: any = { status }
    if (completedAt) {
      updateData.completedAt = completedAt
    }

    await prisma.flowExecution.update({
      where: { id: executionId },
      data: updateData
    })
  }

  // Atualizar passo atual
  private async updateCurrentStep(executionId: string, stepOrder: number) {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { currentStep: stepOrder }
    })
  }

  // Adicionar log na metadata da execução
  private async addExecutionLog(executionId: string, logEntry: any) {
    const execution = await prisma.flowExecution.findUnique({
      where: { id: executionId },
      select: { metadata: true }
    })

    let metadata = {}
    if (execution?.metadata) {
      try {
        metadata = JSON.parse(execution.metadata)
      } catch (error) {
        console.warn('Erro ao fazer parse da metadata:', error)
      }
    }

    // Adicionar log
    if (!metadata.logs) {
      metadata.logs = []
    }
    metadata.logs.push(logEntry)

    // Limitar logs para evitar crescimento excessivo
    if (metadata.logs.length > 100) {
      metadata.logs = metadata.logs.slice(-50) // Manter apenas os últimos 50
    }

    await prisma.flowExecution.update({
      where: { id: executionId },
      data: { metadata: JSON.stringify(metadata) }
    })
  }

  // Lidar com erro na execução
  private async handleExecutionError(executionId: string, error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'ERROR',
        errorMessage: errorMessage
      }
    })

    console.error(`❌ Execução ${executionId} marcada como erro: ${errorMessage}`)
  }

  // Pausar execução
  async pauseExecution(executionId: string) {
    await this.updateExecutionStatus(executionId, 'PAUSED')
    console.log(`⏸️ Execução ${executionId} pausada`)
  }

  // Retomar execução
  async resumeExecution(executionId: string) {
    await this.updateExecutionStatus(executionId, 'PENDING')
    await this.processExecution(executionId)
    console.log(`▶️ Execução ${executionId} retomada`)
  }

  // Cancelar execução
  async cancelExecution(executionId: string) {
    await this.updateExecutionStatus(executionId, 'ERROR')
    await this.addExecutionLog(executionId, {
      action: 'execution_cancelled',
      timestamp: new Date()
    })
    console.log(`🚫 Execução ${executionId} cancelada`)
  }

  // Obter estatísticas do processador
  getProcessorStats() {
    return {
      activeExecutions: this.processingQueue.size,
      processingQueue: Array.from(this.processingQueue.keys())
    }
  }

  // Processar execuções pendentes
  async processPendingExecutions() {
    try {
      const pendingExecutions = await prisma.flowExecution.findMany({
        where: {
          status: 'PENDING'
        },
        select: { id: true },
        take: 10 // Processar até 10 por vez
      })

      console.log(`📋 Encontradas ${pendingExecutions.length} execuções pendentes`)

      for (const execution of pendingExecutions) {
        // Processar em paralelo mas com limite
        this.processExecution(execution.id).catch(error => {
          console.error(`❌ Erro ao processar execução ${execution.id}:`, error)
        })
      }

    } catch (error) {
      console.error('❌ Erro ao buscar execuções pendentes:', error)
    }
  }
}

export const flowProcessor = FlowProcessor.getInstance()