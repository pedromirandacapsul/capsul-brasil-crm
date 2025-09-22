import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock TTS audio generations
    const mockAudios = [
      {
        id: 'audio-1',
        text: 'Olá! Bem-vindo ao nosso atendimento automatizado. Como posso ajudar você hoje?',
        voice: 'pt-BR-Wavenet-A',
        status: 'COMPLETED',
        duration: 8,
        audioUrl: '/audio/tts/welcome.mp3',
        createdAt: '2024-01-20T10:30:00Z',
        completedAt: '2024-01-20T10:30:15Z'
      },
      {
        id: 'audio-2',
        text: 'Obrigado pelo seu contato! Nossa equipe entrará em contato em breve.',
        voice: 'pt-BR-Wavenet-B',
        status: 'COMPLETED',
        duration: 6,
        audioUrl: '/audio/tts/thanks.mp3',
        createdAt: '2024-01-20T11:15:00Z',
        completedAt: '2024-01-20T11:15:10Z'
      },
      {
        id: 'audio-3',
        text: 'Este é um teste de geração de áudio com uma mensagem mais longa para verificar como funciona o sistema de TTS com textos extensos.',
        voice: 'pt-BR-Standard-A',
        status: 'GENERATING',
        duration: null,
        audioUrl: null,
        createdAt: '2024-01-21T09:45:00Z'
      },
      {
        id: 'audio-4',
        text: 'Mensagem de erro para teste do sistema.',
        voice: 'pt-BR-Wavenet-A',
        status: 'FAILED',
        duration: null,
        audioUrl: null,
        createdAt: '2024-01-21T10:00:00Z'
      }
    ]

    return NextResponse.json({
      audios: mockAudios,
      total: mockAudios.length
    })

  } catch (error) {
    console.error('Error fetching TTS audios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch TTS audios' },
      { status: 500 }
    )
  }
}