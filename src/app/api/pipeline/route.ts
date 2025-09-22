import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PipelineService } from '@/lib/pipeline'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, PERMISSIONS.LEADS_VIEW)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stages':
        const stages = await PipelineService.getStages()
        return NextResponse.json({
          success: true,
          data: stages,
        })

      case 'analytics':
        const timeframe = searchParams.get('timeframe') as '30d' | '90d' | '1y' || '30d'
        const analytics = await PipelineService.getAnalytics(timeframe)
        return NextResponse.json({
          success: true,
          data: analytics,
        })

      default:
        return NextResponse.json(
          { error: 'Action parameter required (stages, analytics)' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in pipeline API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, PERMISSIONS.LEADS_EDIT)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'update-stages':
        if (!hasPermission(session.user.role, PERMISSIONS.ADMIN)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { stages } = body
        if (!stages || !Array.isArray(stages)) {
          return NextResponse.json(
            { error: 'stages array is required' },
            { status: 400 }
          )
        }

        const updatedStages = await PipelineService.upsertStages(stages)
        return NextResponse.json({
          success: true,
          message: 'Pipeline stages updated successfully',
          data: updatedStages,
        })

      case 'move-lead':
        const { leadId, newStage } = body
        if (!leadId || !newStage) {
          return NextResponse.json(
            { error: 'leadId and newStage are required' },
            { status: 400 }
          )
        }

        const updatedLead = await PipelineService.moveLeadToStage(
          leadId,
          newStage,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Lead moved successfully',
          data: updatedLead,
        })

      case 'initialize-stages':
        if (!hasPermission(session.user.role, PERMISSIONS.ADMIN)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        await PipelineService.initializeDefaultStages()
        return NextResponse.json({
          success: true,
          message: 'Default pipeline stages initialized',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action (update-stages, move-lead, initialize-stages)' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in pipeline API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}