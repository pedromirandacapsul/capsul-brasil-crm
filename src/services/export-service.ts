import * as XLSX from 'xlsx'

export interface ExportableData {
  fileName: string
  worksheets: {
    name: string
    data: any[]
    headers?: string[]
  }[]
}

export interface PDFExportOptions {
  title: string
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'A4' | 'A3' | 'Letter'
  includeCharts?: boolean
}

export class ExportService {
  private static instance: ExportService

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  /**
   * Exportar dados para Excel (.xlsx)
   */
  async exportToExcel(data: ExportableData): Promise<void> {
    try {
      console.log('📊 Exporting to Excel:', data.fileName)

      // Criar workbook
      const workbook = XLSX.utils.book_new()

      // Adicionar cada worksheet
      data.worksheets.forEach(worksheet => {
        let ws: XLSX.WorkSheet

        if (worksheet.headers && worksheet.data.length > 0) {
          // Criar worksheet com headers customizados
          ws = XLSX.utils.json_to_sheet(worksheet.data, {
            header: worksheet.headers
          })
        } else {
          // Criar worksheet padrão
          ws = XLSX.utils.json_to_sheet(worksheet.data)
        }

        // Adicionar formatação básica
        this.formatExcelWorksheet(ws, worksheet.data.length)

        // Adicionar ao workbook
        XLSX.utils.book_append_sheet(workbook, ws, worksheet.name)
      })

      // Fazer download
      XLSX.writeFile(workbook, `${data.fileName}.xlsx`)

      console.log('✅ Excel export completed')
    } catch (error) {
      console.error('❌ Excel export failed:', error)
      throw new Error('Falha ao exportar para Excel')
    }
  }

  /**
   * Exportar relatório de performance de usuários
   */
  async exportUserPerformance(userPerformance: any[], dateRange?: { from: Date, to: Date }): Promise<void> {
    const exportData: ExportableData = {
      fileName: `relatorio-performance-usuarios-${this.getDateString()}`,
      worksheets: [
        {
          name: 'Performance por Usuário',
          headers: [
            'Usuário',
            'Leads Criados',
            'Oportunidades',
            'Negócios Fechados',
            'Negócios Perdidos',
            'Receita Total (R$)',
            'Taxa de Ganho (%)',
            'Ticket Médio (R$)',
            'Taxa de Conversão (%)'
          ],
          data: userPerformance.map(user => ({
            'Usuário': user.userName,
            'Leads Criados': user.leadsCreated,
            'Oportunidades': user.opportunitiesCreated,
            'Negócios Fechados': user.dealsWon,
            'Negócios Perdidos': user.dealsLost,
            'Receita Total (R$)': user.totalRevenue,
            'Taxa de Ganho (%)': user.winRate,
            'Ticket Médio (R$)': user.averageDealSize,
            'Taxa de Conversão (%)': user.conversionRate
          }))
        },
        {
          name: 'Resumo Geral',
          data: [
            {
              'Métrica': 'Total de Usuários',
              'Valor': userPerformance.length
            },
            {
              'Métrica': 'Receita Total (R$)',
              'Valor': userPerformance.reduce((sum, user) => sum + user.totalRevenue, 0)
            },
            {
              'Métrica': 'Leads Criados',
              'Valor': userPerformance.reduce((sum, user) => sum + user.leadsCreated, 0)
            },
            {
              'Métrica': 'Oportunidades Criadas',
              'Valor': userPerformance.reduce((sum, user) => sum + user.opportunitiesCreated, 0)
            },
            {
              'Métrica': 'Negócios Fechados',
              'Valor': userPerformance.reduce((sum, user) => sum + user.dealsWon, 0)
            },
            {
              'Métrica': 'Taxa de Conversão Média (%)',
              'Valor': Math.round(
                userPerformance.reduce((sum, user) => sum + user.conversionRate, 0) /
                Math.max(userPerformance.length, 1)
              )
            }
          ]
        }
      ]
    }

    // Adicionar informações de período se fornecido
    if (dateRange) {
      exportData.worksheets[1].data.unshift(
        {
          'Métrica': 'Período - Início',
          'Valor': dateRange.from.toLocaleDateString('pt-BR')
        },
        {
          'Métrica': 'Período - Fim',
          'Valor': dateRange.to.toLocaleDateString('pt-BR')
        },
        { 'Métrica': '', 'Valor': '' } // Linha vazia
      )
    }

    await this.exportToExcel(exportData)
  }

  /**
   * Exportar KPIs e dashboard executivo
   */
  async exportExecutiveDashboard(
    kpis: any,
    userPerformance: any[],
    pipelineAnalytics: any[],
    alerts: any[]
  ): Promise<void> {
    const exportData: ExportableData = {
      fileName: `dashboard-executivo-${this.getDateString()}`,
      worksheets: [
        {
          name: 'KPIs Principais',
          data: [
            { 'Métrica': 'Total de Leads', 'Valor': kpis.totalLeads },
            { 'Métrica': 'Total de Oportunidades', 'Valor': kpis.totalOpportunities },
            { 'Métrica': 'Receita Total (R$)', 'Valor': kpis.totalRevenue },
            { 'Métrica': 'Taxa de Conversão (%)', 'Valor': kpis.conversionRate },
            { 'Métrica': 'Ticket Médio (R$)', 'Valor': kpis.averageDealSize },
            { 'Métrica': 'Negócios Fechados', 'Valor': kpis.totalClosedWon },
            { 'Métrica': 'Negócios Perdidos', 'Valor': kpis.totalClosedLost },
            { 'Métrica': 'Taxa de Ganho (%)', 'Valor': kpis.winRate },
            { 'Métrica': 'Valor do Pipeline (R$)', 'Valor': kpis.pipelineValue },
            { 'Métrica': 'Tempo Médio de Venda (dias)', 'Valor': kpis.averageSalesTime }
          ]
        },
        {
          name: 'Top Performers',
          headers: [
            'Ranking',
            'Usuário',
            'Receita (R$)',
            'Negócios Fechados',
            'Taxa de Ganho (%)',
            'Taxa de Conversão (%)'
          ],
          data: userPerformance.slice(0, 10).map((user, index) => ({
            'Ranking': index + 1,
            'Usuário': user.userName,
            'Receita (R$)': user.totalRevenue,
            'Negócios Fechados': user.dealsWon,
            'Taxa de Ganho (%)': user.winRate,
            'Taxa de Conversão (%)': user.conversionRate
          }))
        },
        {
          name: 'Pipeline por Estágio',
          headers: [
            'Estágio',
            'Quantidade',
            'Valor Total (R$)',
            'Valor Médio (R$)',
            'Tempo Médio (dias)',
            'Taxa de Conversão (%)'
          ],
          data: pipelineAnalytics.map(stage => ({
            'Estágio': stage.stage,
            'Quantidade': stage.count,
            'Valor Total (R$)': stage.totalValue,
            'Valor Médio (R$)': stage.averageValue,
            'Tempo Médio (dias)': stage.averageTimeInStage,
            'Taxa de Conversão (%)': stage.conversionRate
          }))
        },
        {
          name: 'Alertas de Performance',
          headers: [
            'Tipo',
            'Severidade',
            'Título',
            'Mensagem',
            'Recomendação'
          ],
          data: alerts.map(alert => ({
            'Tipo': alert.type,
            'Severidade': alert.severity,
            'Título': alert.title,
            'Mensagem': alert.message,
            'Recomendação': alert.recommendation || 'N/A'
          }))
        }
      ]
    }

    await this.exportToExcel(exportData)
  }

  /**
   * Exportar pipeline analytics
   */
  async exportPipelineAnalytics(pipelineData: any[]): Promise<void> {
    const exportData: ExportableData = {
      fileName: `pipeline-analytics-${this.getDateString()}`,
      worksheets: [
        {
          name: 'Análise de Pipeline',
          headers: [
            'Estágio',
            'Quantidade de Oportunidades',
            'Valor Total (R$)',
            'Valor Médio (R$)',
            'Tempo Médio no Estágio (dias)',
            'Taxa de Conversão (%)'
          ],
          data: pipelineData.map(stage => ({
            'Estágio': stage.stage,
            'Quantidade de Oportunidades': stage.count,
            'Valor Total (R$)': stage.totalValue,
            'Valor Médio (R$)': stage.averageValue,
            'Tempo Médio no Estágio (dias)': stage.averageTimeInStage,
            'Taxa de Conversão (%)': stage.conversionRate
          }))
        },
        {
          name: 'Resumo',
          data: [
            {
              'Métrica': 'Total de Oportunidades',
              'Valor': pipelineData.reduce((sum, stage) => sum + stage.count, 0)
            },
            {
              'Métrica': 'Valor Total do Pipeline (R$)',
              'Valor': pipelineData.reduce((sum, stage) => sum + stage.totalValue, 0)
            },
            {
              'Métrica': 'Valor Médio por Oportunidade (R$)',
              'Valor': Math.round(
                pipelineData.reduce((sum, stage) => sum + stage.totalValue, 0) /
                Math.max(pipelineData.reduce((sum, stage) => sum + stage.count, 0), 1)
              )
            }
          ]
        }
      ]
    }

    await this.exportToExcel(exportData)
  }

  /**
   * Métodos auxiliares privados
   */
  private formatExcelWorksheet(ws: XLSX.WorkSheet, dataLength: number): void {
    // Definir largura das colunas
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const columns: XLSX.ColInfo[] = []

    for (let C = range.s.c; C <= range.e.c; ++C) {
      columns.push({ width: 15 })
    }

    ws['!cols'] = columns

    // Adicionar auto-filtro
    ws['!autofilter'] = { ref: ws['!ref'] || 'A1' }
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Preparar dados para CSV (fallback se Excel falhar)
   */
  async exportToCSV(data: any[], filename: string, headers?: string[]): Promise<void> {
    try {
      let csvContent = ''

      // Adicionar headers se fornecidos
      if (headers) {
        csvContent += headers.join(',') + '\n'
      }

      // Adicionar dados
      data.forEach(row => {
        const values = Object.values(row).map(value => {
          // Escapar valores que contêm vírgulas ou aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent += values.join(',') + '\n'
      })

      // Criar download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('✅ CSV export completed')
    } catch (error) {
      console.error('❌ CSV export failed:', error)
      throw new Error('Falha ao exportar para CSV')
    }
  }
}

export const exportService = ExportService.getInstance()