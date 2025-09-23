import { NextRequest, NextResponse } from 'next/server'
import { SimpleDashboardService } from '@/services/simple-dashboard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const type = searchParams.get('type') || 'overview'

    console.log('📊 Analytics Dashboard API called:', { type, dateFrom, dateTo })

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
            userPerformance: userPerformance.slice(0, 10), // Top 10 usuários
            pipelineAnalytics,
            alerts: alerts.slice(0, 5) // Top 5 alertas
          }
        })
      }

      case 'kpis': {
        const kpis = await SimpleDashboardService.getKPIMetrics()
        return NextResponse.json({
          success: true,
          data: { kpis }
        })
      }

      case 'users': {
        const userPerformance = await SimpleDashboardService.getUserPerformance()
        return NextResponse.json({
          success: true,
          data: { userPerformance }
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

      case 'trends': {
        // Simplified trends for testing
        return NextResponse.json({
          success: true,
          data: {
            trends: [
              { period: 'Jan 2024', ownedLeads: 45, opportunities: 12, revenue: 85000, conversionRate: 26.7 },
              { period: 'Fev 2024', ownedLeads: 52, opportunities: 18, revenue: 120000, conversionRate: 34.6 },
              { period: 'Mar 2024', ownedLeads: 38, opportunities: 15, revenue: 95000, conversionRate: 39.5 }
            ]
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics Dashboard API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}