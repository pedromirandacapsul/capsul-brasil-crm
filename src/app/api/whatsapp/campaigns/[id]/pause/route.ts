import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaignId = id

    // Mock pause action
    console.log(`Pausing campaign: ${campaignId}`)

    return NextResponse.json({
      success: true,
      message: 'Campaign paused successfully',
      campaignId,
      status: 'PAUSED'
    })

  } catch (error) {
    console.error('Error pausing campaign:', error)
    return NextResponse.json(
      { error: 'Failed to pause campaign' },
      { status: 500 }
    )
  }
}