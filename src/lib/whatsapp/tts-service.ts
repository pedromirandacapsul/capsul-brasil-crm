/**
 * Text-to-Speech Service for WhatsApp Audio Generation
 * Supports multiple TTS providers and voice options
 */

import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

export interface TTSOptions {
  text: string
  voice: string
  speed?: number
  pitch?: number
  language?: string
}

export interface TTSResult {
  success: boolean
  audioUrl?: string
  duration?: number
  error?: string
}

// Voice options for different providers
export const VOICE_OPTIONS = {
  'pt-BR': {
    'female': 'pt-BR-Wavenet-A',
    'male': 'pt-BR-Wavenet-B',
    'casual-female': 'pt-BR-Standard-A',
    'casual-male': 'pt-BR-Standard-B'
  },
  'en-US': {
    'female': 'en-US-Wavenet-C',
    'male': 'en-US-Wavenet-D',
    'casual-female': 'en-US-Standard-C',
    'casual-male': 'en-US-Standard-D'
  }
}

class TTSService {
  private audioDirectory: string

  constructor() {
    this.audioDirectory = path.join(process.cwd(), 'public', 'audio', 'tts')
    this.ensureAudioDirectory()
  }

  private async ensureAudioDirectory() {
    try {
      await fs.mkdir(this.audioDirectory, { recursive: true })
    } catch (error) {
      console.error('Error creating audio directory:', error)
    }
  }

  /**
   * Generate audio from text using available TTS providers
   */
  async generateAudio(accountId: string, options: TTSOptions): Promise<TTSResult> {
    try {
      console.log('🔊 Generating TTS audio:', options.text.substring(0, 50) + '...')

      // Create generation record
      const generation = await prisma.audioGeneration.create({
        data: {
          accountId,
          text: options.text,
          voice: options.voice,
          status: 'GENERATING'
        }
      })

      let result: TTSResult

      // Try different TTS providers in order of preference
      if (await this.isGoogleTTSAvailable()) {
        result = await this.generateWithGoogleTTS(options)
      } else if (await this.isWebSpeechAPIAvailable()) {
        result = await this.generateWithWebSpeechAPI(options)
      } else {
        // Fallback to mock TTS for development
        result = await this.generateMockAudio(options)
      }

      // Update generation record
      await prisma.audioGeneration.update({
        where: { id: generation.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          audioUrl: result.audioUrl,
          duration: result.duration,
          completedAt: new Date()
        }
      })

      return result

    } catch (error) {
      console.error('❌ Error generating TTS audio:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Google Cloud Text-to-Speech integration
   */
  private async generateWithGoogleTTS(options: TTSOptions): Promise<TTSResult> {
    try {
      // This would require Google Cloud TTS API key
      // For now, we'll return a mock implementation
      console.log('🔊 Using Google TTS (Mock implementation)')

      const audioFileName = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      const audioPath = path.join(this.audioDirectory, audioFileName)
      const audioUrl = `/audio/tts/${audioFileName}`

      // In a real implementation, you would:
      // 1. Call Google Cloud TTS API
      // 2. Save the audio file
      // 3. Return the URL

      // Mock: Create a placeholder file
      await fs.writeFile(audioPath, 'mock-audio-data')

      return {
        success: true,
        audioUrl,
        duration: Math.ceil(options.text.length / 10) // Estimate duration
      }

    } catch (error) {
      console.error('❌ Google TTS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Web Speech API integration (browser-based)
   */
  private async generateWithWebSpeechAPI(options: TTSOptions): Promise<TTSResult> {
    try {
      console.log('🔊 Using Web Speech API (Mock implementation)')

      // This would be implemented on the client-side
      // Server can't directly use Web Speech API

      return {
        success: false,
        error: 'Web Speech API not available on server'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Mock TTS for development and testing
   */
  private async generateMockAudio(options: TTSOptions): Promise<TTSResult> {
    try {
      console.log('🔊 Using Mock TTS for development')

      const audioFileName = `mock_tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      const audioPath = path.join(this.audioDirectory, audioFileName)
      const audioUrl = `/audio/tts/${audioFileName}`

      // Create a mock audio file (in real implementation, this would be actual audio)
      const mockAudioContent = Buffer.from('mock-audio-data-' + options.text.substring(0, 100))
      await fs.writeFile(audioPath, mockAudioContent)

      // Estimate duration based on text length (assuming ~150 words per minute)
      const words = options.text.split(' ').length
      const estimatedDuration = Math.ceil((words / 150) * 60)

      console.log(`✅ Mock audio generated: ${audioUrl} (${estimatedDuration}s)`)

      return {
        success: true,
        audioUrl,
        duration: estimatedDuration
      }

    } catch (error) {
      console.error('❌ Mock TTS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if Google TTS is available
   */
  private async isGoogleTTSAvailable(): Promise<boolean> {
    // Check if Google Cloud credentials are configured
    return !!process.env.GOOGLE_CLOUD_TTS_API_KEY
  }

  /**
   * Check if Web Speech API is available
   */
  private async isWebSpeechAPIAvailable(): Promise<boolean> {
    // Web Speech API is browser-only
    return false
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language: string = 'pt-BR'): string[] {
    return Object.values(VOICE_OPTIONS[language] || VOICE_OPTIONS['pt-BR'])
  }

  /**
   * Clean up old audio files
   */
  async cleanupOldAudioFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.audioDirectory)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(this.audioDirectory, file)
        const stats = await fs.stat(filePath)

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath)
          console.log(`🗑️ Cleaned up old audio file: ${file}`)
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up audio files:', error)
    }
  }

  /**
   * Get generation history for an account
   */
  async getGenerationHistory(accountId: string, limit: number = 20) {
    return await prisma.audioGeneration.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Estimate audio duration from text
   */
  estimateDuration(text: string, wordsPerMinute: number = 150): number {
    const words = text.split(' ').length
    return Math.ceil((words / wordsPerMinute) * 60)
  }

  /**
   * Validate text for TTS
   */
  validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' }
    }

    if (text.length > 5000) {
      return { valid: false, error: 'Text is too long (max 5000 characters)' }
    }

    // Check for potentially problematic characters
    const problematicChars = /[<>{}[\]]/g
    if (problematicChars.test(text)) {
      return { valid: false, error: 'Text contains unsupported characters' }
    }

    return { valid: true }
  }

  /**
   * Process text for better TTS pronunciation
   */
  preprocessText(text: string): string {
    return text
      // Replace common abbreviations
      .replace(/\bdr\./gi, 'doutor')
      .replace(/\bdra\./gi, 'doutora')
      .replace(/\bsr\./gi, 'senhor')
      .replace(/\bsra\./gi, 'senhora')
      .replace(/\betc\./gi, 'etcetera')
      // Add pauses for better flow
      .replace(/\./g, '. ')
      .replace(/,/g, ', ')
      .replace(/;/g, '; ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  }
}

// Export singleton instance
export const ttsService = new TTSService()

/**
 * Helper function to generate audio with default options
 */
export async function generateTTSAudio(
  accountId: string,
  text: string,
  voice: string = 'pt-BR-Wavenet-A'
): Promise<TTSResult> {
  const validation = ttsService.validateText(text)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    }
  }

  const processedText = ttsService.preprocessText(text)

  return await ttsService.generateAudio(accountId, {
    text: processedText,
    voice,
    speed: 1.0,
    pitch: 0,
    language: 'pt-BR'
  })
}