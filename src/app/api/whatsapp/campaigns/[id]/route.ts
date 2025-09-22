import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { massMessagingService } from '@/lib/whatsapp/mass-messaging-service'

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

    const campaign = await prisma.campaignMessage.findFirst({
      where: {
        id,
        account: {
          userId: session.user.id
        }
      },
      include: {
        account: {
          select: {
            phoneNumber: true,
            displayName: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get progress information
    const progress = await massMessagingService.getCampaignProgress(id)

    return NextResponse.json({
      campaign,
      progress
    })

  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()
    const { action, ...updateData } = body

    // Verify campaign ownership
    const campaign = await prisma.campaignMessage.findFirst({
      where: {
        id,
        account: {
          userId: session.user.id
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Handle actions
    if (action) {
      switch (action) {
        case 'stop':
          const stopResult = await massMessagingService.stopCampaign(id)
          if (!stopResult.success) {
            return NextResponse.json({ error: stopResult.error }, { status: 400 })
          }
          break

        case 'start':
          // This would require recreating the campaign with stored targets
          return NextResponse.json({ error: 'Manual start not implemented' }, { status: 501 })

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    }

    // Handle updates
    const allowedUpdates = ['campaignName', 'scheduledAt', 'status']
    const filteredUpdates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length > 0) {
      await prisma.campaignMessage.update({
        where: { id },
        data: {
          ...filteredUpdates,
          updatedAt: new Date()
        }
      })
    }

    // Fetch updated campaign
    const updatedCampaign = await prisma.campaignMessage.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            phoneNumber: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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

    // Verify campaign ownership
    const campaign = await prisma.campaignMessage.findFirst({
      where: {
        id,
        account: {
          userId: session.user.id
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Stop campaign if it's running
    await massMessagingService.stopCampaign(id)

    // Delete campaign
    await prisma.campaignMessage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}