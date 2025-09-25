import { NextRequest, NextResponse } from 'next/server';
import { emailMarketingService } from '@/services/email-marketing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get('campaignId') || undefined;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const exportFormat = searchParams.get('export');

    let dateRange: { from: Date; to: Date } | undefined;
    if (fromParam && toParam) {
      dateRange = {
        from: new Date(fromParam),
        to: new Date(toParam)
      };
    }

    // Se solicitou exportação, retornar CSV
    if (exportFormat === 'csv') {
      const analytics = await emailMarketingService.getDetailedAnalytics(campaignId, dateRange);

      // Gerar CSV
      const csvHeader = 'Métrica,Valor\n';
      const csvData = [
        `Campanhas,${analytics.campaigns}`,
        `Emails Enviados,${analytics.emailsSent}`,
        `Entregues,${analytics.delivered}`,
        `Aberturas,${analytics.opens}`,
        `Cliques,${analytics.clicks}`,
        `Descadastros,${analytics.unsubscribes}`,
        `Rejeições,${analytics.bounces}`,
        `Taxa de Abertura,${analytics.openRate.toFixed(2)}%`,
        `Taxa de Cliques,${analytics.clickRate.toFixed(2)}%`,
        `Taxa de Descadastro,${analytics.unsubscribeRate.toFixed(2)}%`,
        `Taxa de Rejeição,${analytics.bounceRate.toFixed(2)}%`
      ].join('\n');

      return new NextResponse(csvHeader + csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=email-analytics.csv'
        }
      });
    }

    // Retornar dados JSON normalmente
    const analytics = await emailMarketingService.getDetailedAnalytics(campaignId, dateRange);

    return NextResponse.json({
      success: true,
      ...analytics
    });

  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de analytics' },
      { status: 500 }
    );
  }
}