import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LeadScoringService } from '@/lib/lead-scoring'
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
      case 'stats':
        const stats = await LeadScoringService.getScoringStats()
        return NextResponse.json({
          success: true,
          data: stats,
        })

      case 'high-score':
        const limit = parseInt(searchParams.get('limit') || '10')
        const highScoreLeads = await LeadScoringService.getHighScoreLeads(limit)
        return NextResponse.json({
          success: true,
          data: highScoreLeads,
        })

      default:
        return NextResponse.json(
          { error: 'Action parameter required (stats, high-score)' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in lead scoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { leadId, action } = body

    switch (action) {
      case 'calculate':
        if (!leadId) {
          return NextResponse.json(
            { error: 'leadId is required' },
            { status: 400 }
          )
        }

        const scoringResult = await LeadScoringService.calculateLeadScore(leadId)
        return NextResponse.json({
          success: true,
          data: scoringResult,
        })

      case 'update':
        if (!leadId) {
          return NextResponse.json(
            { error: 'leadId is required' },
            { status: 400 }
          )
        }

        const updateResult = await LeadScoringService.updateLeadScore(leadId)
        return NextResponse.json({
          success: true,
          message: 'Lead score updated successfully',
          data: updateResult,
        })

      case 'recalculate-all':
        // Apenas admins podem recalcular todos os scores
        if (!hasPermission(session.user.role, PERMISSIONS.ADMIN)) {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const recalcResult = await LeadScoringService.recalculateAllScores()
        return NextResponse.json({
          success: true,
          message: `Recalculated scores for ${recalcResult.updated} leads`,
          data: recalcResult,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action (calculate, update, recalculate-all)' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in lead scoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}