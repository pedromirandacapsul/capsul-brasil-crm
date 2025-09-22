/**
 * Typing Simulation Service for Humanized WhatsApp Interactions
 * Simulates realistic typing behavior to make automated messages feel more natural
 */

import { EventEmitter } from 'events'

export interface TypingOptions {
  message: string
  typingSpeed?: 'slow' | 'normal' | 'fast' | 'custom'
  customSpeed?: number // characters per second
  minDelay?: number // minimum delay in ms
  maxDelay?: number // maximum delay in ms
  pauseOnPunctuation?: boolean
  randomVariation?: boolean
  showTypingIndicator?: boolean
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop' | 'message_send'
  conversationId: string
  accountId: string
  progress?: number
  estimatedTime?: number
}

// Predefined typing speeds (characters per second)
const TYPING_SPEEDS = {
  slow: 2,      // 2 chars/sec (like elderly or careful typing)
  normal: 4,    // 4 chars/sec (average human typing)
  fast: 7,      // 7 chars/sec (fast typist)
  custom: 5     // default for custom
}

class TypingSimulation extends EventEmitter {
  private activeSimulations = new Map<string, NodeJS.Timeout>()

  constructor() {
    super()
  }

  /**
   * Simulate typing for a message with realistic delays and patterns
   */
  async simulateTyping(
    conversationId: string,
    accountId: string,
    options: TypingOptions
  ): Promise<void> {
    const simulationId = `${conversationId}_${Date.now()}`

    try {
      console.log(`⌨️ Starting typing simulation for: "${options.message.substring(0, 30)}..."`)

      // Calculate timing parameters
      const timing = this.calculateTypingTiming(options)

      // Emit typing start event
      this.emit('typing_event', {
        type: 'typing_start',
        conversationId,
        accountId,
        estimatedTime: timing.totalTime
      })

      // Show typing indicator if enabled
      if (options.showTypingIndicator !== false) {
        await this.showTypingIndicator(conversationId, accountId, true)
      }

      // Simulate the actual typing process
      await this.performTypingSimulation(simulationId, timing, conversationId, accountId)

      // Hide typing indicator
      if (options.showTypingIndicator !== false) {
        await this.showTypingIndicator(conversationId, accountId, false)
      }

      // Emit typing complete event
      this.emit('typing_event', {
        type: 'typing_stop',
        conversationId,
        accountId
      })

      console.log(`✅ Typing simulation completed for conversation: ${conversationId}`)

    } catch (error) {
      console.error('❌ Error in typing simulation:', error)
      // Clean up on error
      await this.stopTypingSimulation(simulationId)
      throw error
    }
  }

  /**
   * Calculate realistic typing timing based on message content
   */
  private calculateTypingTiming(options: TypingOptions): {
    totalTime: number
    charDelays: number[]
    pausePositions: number[]
  } {
    const message = options.message
    const speed = options.typingSpeed || 'normal'
    const baseSpeed = options.customSpeed || TYPING_SPEEDS[speed]

    const charDelays: number[] = []
    const pausePositions: number[] = []

    let totalTime = 0

    for (let i = 0; i < message.length; i++) {
      const char = message[i]
      let delay = 1000 / baseSpeed // Base delay in ms

      // Add variations for different characters
      if (char === ' ') {
        delay *= 0.8 // Spaces are faster
      } else if (/[A-Z]/.test(char)) {
        delay *= 1.2 // Capital letters slower (shift key)
      } else if (/[0-9]/.test(char)) {
        delay *= 1.1 // Numbers slightly slower
      } else if (/[.,;:!?]/.test(char)) {
        delay *= 1.3 // Punctuation slower
        if (options.pauseOnPunctuation !== false) {
          pausePositions.push(i)
        }
      }

      // Add random variation if enabled
      if (options.randomVariation !== false) {
        const variation = 0.3 // ±30% variation
        const randomFactor = 1 + (Math.random() - 0.5) * variation
        delay *= randomFactor
      }

      // Apply min/max constraints
      if (options.minDelay) {
        delay = Math.max(delay, options.minDelay)
      }
      if (options.maxDelay) {
        delay = Math.min(delay, options.maxDelay)
      }

      charDelays.push(delay)
      totalTime += delay
    }

    // Add pauses for punctuation
    pausePositions.forEach(pos => {
      const pauseDelay = 300 + Math.random() * 700 // 300-1000ms pause
      charDelays[pos] += pauseDelay
      totalTime += pauseDelay
    })

    return { totalTime, charDelays, pausePositions }
  }

  /**
   * Perform the actual typing simulation with delays
   */
  private async performTypingSimulation(
    simulationId: string,
    timing: { totalTime: number, charDelays: number[] },
    conversationId: string,
    accountId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let currentIndex = 0
      const totalChars = timing.charDelays.length

      const typeNextChar = () => {
        if (currentIndex >= totalChars) {
          resolve()
          return
        }

        const delay = timing.charDelays[currentIndex]
        const progress = (currentIndex + 1) / totalChars

        // Emit progress event
        this.emit('typing_progress', {
          conversationId,
          accountId,
          progress,
          currentIndex
        })

        const timeoutId = setTimeout(() => {
          this.activeSimulations.delete(simulationId)
          currentIndex++
          typeNextChar()
        }, delay)

        this.activeSimulations.set(simulationId, timeoutId)
      }

      typeNextChar()
    })
  }

  /**
   * Show or hide typing indicator (implementation depends on WhatsApp service)
   */
  private async showTypingIndicator(
    conversationId: string,
    accountId: string,
    show: boolean
  ): Promise<void> {
    // This would integrate with WhatsApp Web.js or Business API
    // to show actual typing indicators
    console.log(`💬 ${show ? 'Showing' : 'Hiding'} typing indicator for ${conversationId}`)

    // For now, just emit an event that can be caught by the UI
    this.emit('typing_indicator', {
      conversationId,
      accountId,
      visible: show
    })
  }

  /**
   * Stop a typing simulation
   */
  async stopTypingSimulation(simulationId: string): Promise<void> {
    const timeoutId = this.activeSimulations.get(simulationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.activeSimulations.delete(simulationId)
      console.log(`⏹️ Stopped typing simulation: ${simulationId}`)
    }
  }

  /**
   * Stop all active simulations
   */
  async stopAllSimulations(): Promise<void> {
    for (const [simulationId, timeoutId] of this.activeSimulations.entries()) {
      clearTimeout(timeoutId)
    }
    this.activeSimulations.clear()
    console.log('⏹️ Stopped all typing simulations')
  }

  /**
   * Get realistic typing duration estimate
   */
  estimateTypingDuration(message: string, speed: 'slow' | 'normal' | 'fast' = 'normal'): number {
    const baseSpeed = TYPING_SPEEDS[speed]
    const baseTime = (message.length / baseSpeed) * 1000

    // Add time for punctuation pauses
    const punctuationCount = (message.match(/[.,;:!?]/g) || []).length
    const punctuationTime = punctuationCount * 500 // 500ms average pause

    // Add random variation
    const variation = baseTime * 0.2 // ±20%
    const randomTime = Math.random() * variation

    return Math.round(baseTime + punctuationTime + randomTime)
  }

  /**
   * Create typing pattern based on personality
   */
  createPersonalityTypingOptions(personality: 'professional' | 'casual' | 'excited' | 'careful'): Partial<TypingOptions> {
    switch (personality) {
      case 'professional':
        return {
          typingSpeed: 'normal',
          pauseOnPunctuation: true,
          randomVariation: false,
          minDelay: 50,
          maxDelay: 200
        }

      case 'casual':
        return {
          typingSpeed: 'fast',
          pauseOnPunctuation: false,
          randomVariation: true,
          minDelay: 30,
          maxDelay: 300
        }

      case 'excited':
        return {
          typingSpeed: 'fast',
          pauseOnPunctuation: false,
          randomVariation: true,
          minDelay: 20,
          maxDelay: 150
        }

      case 'careful':
        return {
          typingSpeed: 'slow',
          pauseOnPunctuation: true,
          randomVariation: false,
          minDelay: 100,
          maxDelay: 500
        }

      default:
        return {
          typingSpeed: 'normal',
          pauseOnPunctuation: true,
          randomVariation: true
        }
    }
  }

  /**
   * Simulate multiple messages with realistic gaps
   */
  async simulateMessageSequence(
    conversationId: string,
    accountId: string,
    messages: string[],
    options: {
      typingOptions?: Partial<TypingOptions>
      messageGapMin?: number // min gap between messages in ms
      messageGapMax?: number // max gap between messages in ms
      onMessageReady?: (messageIndex: number, message: string) => Promise<void>
    } = {}
  ): Promise<void> {
    const {
      typingOptions = {},
      messageGapMin = 1000,
      messageGapMax = 3000,
      onMessageReady
    } = options

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]

      // Simulate typing for this message
      await this.simulateTyping(conversationId, accountId, {
        message,
        ...typingOptions
      })

      // Callback when message is ready to send
      if (onMessageReady) {
        await onMessageReady(i, message)
      }

      // Add gap before next message (except for last message)
      if (i < messages.length - 1) {
        const gap = messageGapMin + Math.random() * (messageGapMax - messageGapMin)
        await new Promise(resolve => setTimeout(resolve, gap))
      }
    }
  }

  /**
   * Get active simulations count
   */
  getActiveSimulationsCount(): number {
    return this.activeSimulations.size
  }

  /**
   * Check if a conversation has active typing simulation
   */
  isTypingActive(conversationId: string): boolean {
    for (const simulationId of this.activeSimulations.keys()) {
      if (simulationId.startsWith(conversationId)) {
        return true
      }
    }
    return false
  }
}

// Export singleton instance
export const typingSimulation = new TypingSimulation()

/**
 * Helper function for simple typing simulation
 */
export async function simulateHumanTyping(
  conversationId: string,
  accountId: string,
  message: string,
  personality: 'professional' | 'casual' | 'excited' | 'careful' = 'casual'
): Promise<void> {
  const personalityOptions = typingSimulation.createPersonalityTypingOptions(personality)

  return typingSimulation.simulateTyping(conversationId, accountId, {
    message,
    ...personalityOptions
  })
}