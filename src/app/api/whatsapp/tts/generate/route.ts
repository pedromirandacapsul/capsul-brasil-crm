import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTTSAudio, ttsService } from '@/lib/whatsapp/tts-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, voice, language = 'pt-BR' } = body

    if (!text) {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }

    // Mock TTS generation
    const audioId = `audio-${Date.now()}`
    console.log(`Generating TTS audio: ${audioId} - "${text.substring(0, 50)}..."`)

    // Simulate processing time
    const estimatedDuration = Math.ceil(text.length / 10)

    return NextResponse.json({
      success: true,
      id: audioId,
      status: 'GENERATING',
      text,
      voice: voice || 'pt-BR-Wavenet-A',
      estimatedDuration,
      message: 'Audio generation started'
    })

  } catch (error) {
    console.error('Error generating TTS audio:', error)
    return NextResponse.json(
      { error: 'Failed to generate TTS audio' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const language = searchParams.get('language') || 'pt-BR'

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Verify account ownership
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get available voices
    const availableVoices = ttsService.getAvailableVoices(language)

    // Get generation history
    const history = await ttsService.getGenerationHistory(accountId, 10)

    return NextResponse.json({
      availableVoices,
      history,
      supportedLanguages: ['pt-BR', 'en-US']
    })

  } catch (error) {
    console.error('Error fetching TTS data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch TTS data' },
      { status: 500 }
    )
  }
}