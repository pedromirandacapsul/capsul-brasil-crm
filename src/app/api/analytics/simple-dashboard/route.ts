import { NextRequest, NextResponse } from 'next/server'
import { SimpleDashboardService } from '@/services/simple-dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    console.log('📊 Simple Dashboard API called:', { type })

    switch (type) {
      case 'overview': {
        const [kpis, userPerformance, pipelineAnalytics, alerts] = await Promise.all([
          SimpleDashboardService.getKPIMetrics(),
          SimpleDashboardService.getUserPerformance(),
          SimpleDashboardService.getPipelineAnalytics(),
          SimpleDashboardService.getPerformanceAlerts()
        ])

        return NextResponse.json({
          success: true,
          data: {
            kpis,
            userPerformance: userPerformance.slice(0, 10),
            pipelineAnalytics,
            alerts: alerts.slice(0, 5)
          }
        })
      }

      case 'users': {
        const userPerformance = await SimpleDashboardService.getUserPerformance()
        return NextResponse.json({
          success: true,
          data: { userPerformance }
        })
      }

      case 'kpis': {
        const kpis = await SimpleDashboardService.getKPIMetrics()
        return NextResponse.json({
          success: true,
          data: { kpis }
        })
      }

      case 'pipeline': {
        const pipelineAnalytics = await SimpleDashboardService.getPipelineAnalytics()
        return NextResponse.json({
          success: true,
          data: { pipelineAnalytics }
        })
      }

      case 'alerts': {
        const alerts = await SimpleDashboardService.getPerformanceAlerts()
        return NextResponse.json({
          success: true,
          data: { alerts }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Simple Dashboard API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}