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

    // Mock stop action
    console.log(`Stopping campaign: ${campaignId}`)

    return NextResponse.json({
      success: true,
      message: 'Campaign stopped successfully',
      campaignId,
      status: 'FAILED'
    })

  } catch (error) {
    console.error('Error stopping campaign:', error)
    return NextResponse.json(
      { error: 'Failed to stop campaign' },
      { status: 500 }
    )
  }
}