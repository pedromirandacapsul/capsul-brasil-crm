import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const audioId = id

    // Mock status check
    console.log(`Checking TTS status: ${audioId}`)

    // Simulate completed audio
    return NextResponse.json({
      id: audioId,
      status: 'COMPLETED',
      audioUrl: `/audio/tts/${audioId}.mp3`,
      duration: 8,
      completedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error checking TTS status:', error)
    return NextResponse.json(
      { error: 'Failed to check TTS status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const audioId = id

    // Mock delete action
    console.log(`Deleting TTS audio: ${audioId}`)

    return NextResponse.json({
      success: true,
      message: 'Audio deleted successfully',
      audioId
    })

  } catch (error) {
    console.error('Error deleting TTS audio:', error)
    return NextResponse.json(
      { error: 'Failed to delete TTS audio' },
      { status: 500 }
    )
  }
}