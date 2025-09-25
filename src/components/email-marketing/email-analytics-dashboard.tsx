'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  TrendingUp,
  Eye,
  MousePointer,
  UserX,
  AlertTriangle,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsData {
  campaigns: number;
  emailsSent: number;
  delivered: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  topCampaigns: Array<{
    id: string;
    name: string;
    sent: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  }>;
  recentActivity: Array<{
    id: string;
    leadEmail: string;
    eventType: string;
    eventData: string;
    createdAt: string;
  }>;
}

interface EmailAnalyticsDashboardProps {
  campaignId?: string;
}

export function EmailAnalyticsDashboard({ campaignId }: EmailAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedCampaign, setSelectedCampaign] = useState(campaignId || '');

  // Estados para filtros
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadAnalytics();
    loadCampaigns();
  }, [dateRange, selectedCampaign]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedCampaign) params.append('campaignId', selectedCampaign);
      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const fromDate = startOfDay(subDays(new Date(), days));
        const toDate = endOfDay(new Date());
        params.append('from', fromDate.toISOString());
        params.append('to', toDate.toISOString());
      }

      const response = await fetch(`/api/email-marketing/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/email-marketing/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCampaign) params.append('campaignId', selectedCampaign);
      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const fromDate = startOfDay(subDays(new Date(), days));
        const toDate = endOfDay(new Date());
        params.append('from', fromDate.toISOString());
        params.append('to', toDate.toISOString());
      }
      params.append('export', 'csv');

      const response = await fetch(`/api/email-marketing/analytics?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard de Email Marketing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p>Erro ao carregar dados de analytics</p>
        <Button onClick={loadAnalytics} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Dashboard de Email Marketing</h2>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as campanhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as campanhas</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
                <p className="text-2xl font-bold">{analytics.emailsSent.toLocaleString()}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Abertura</p>
                <p className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${Math.min(analytics.openRate, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Cliques</p>
                <p className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min(analytics.clickRate, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Rejeição</p>
                <p className="text-2xl font-bold">{analytics.bounceRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${Math.min(analytics.bounceRate, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold">{analytics.campaigns}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Cliques</p>
                <p className="text-2xl font-bold">{analytics.clicks.toLocaleString()}</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Descadastros</p>
                <p className="text-2xl font-bold">{analytics.unsubscribes}</p>
              </div>
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campanhas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCampaigns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma campanha encontrada
                </p>
              ) : (
                analytics.topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="font-medium">{campaign.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {campaign.sent} enviados • {campaign.opens} aberturas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {campaign.openRate.toFixed(1)}% abertura
                      </div>
                      <div className="text-sm text-purple-600">
                        {campaign.clickRate.toFixed(1)}% cliques
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div>
                      <div className="font-medium">{activity.leadEmail}</div>
                      <div className="text-sm text-gray-600">
                        {activity.eventType === 'OPENED' && 'Abriu o email'}
                        {activity.eventType === 'CLICKED' && 'Clicou em um link'}
                        {activity.eventType === 'UNSUBSCRIBED' && 'Cancelou a inscrição'}
                        {activity.eventType === 'BOUNCED' && 'Email rejeitado'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        activity.eventType === 'OPENED' ? 'default' :
                        activity.eventType === 'CLICKED' ? 'secondary' :
                        activity.eventType === 'UNSUBSCRIBED' ? 'destructive' :
                        'outline'
                      }>
                        {activity.eventType}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}