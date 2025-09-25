'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function UnsubscribePage() {
  const params = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [leadInfo, setLeadInfo] = useState<any>(null);

  useEffect(() => {
    // Verificar token e buscar informações do lead
    fetchLeadInfo();
  }, []);

  const fetchLeadInfo = async () => {
    try {
      const response = await fetch(`/api/unsubscribe/verify/${params.token}`);
      if (response.ok) {
        const data = await response.json();
        setLeadInfo(data.lead);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
    }
  };

  const handleUnsubscribe = async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token })
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-center">Descadastro Confirmado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Você foi removido com sucesso de nossa lista de emails.
              Sentiremos sua falta! 😢
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Se isso foi um erro, você pode se cadastrar novamente a qualquer momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-center">Erro no Descadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Ocorreu um erro ao processar seu descadastro.
              Por favor, tente novamente ou entre em contato conosco.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Descadastrar Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Tem certeza que deseja parar de receber nossos emails?
            </p>

            {leadInfo && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">Email:</p>
                <p className="font-medium">{leadInfo.email}</p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleUnsubscribe}
                className="w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Processando...' : 'Confirmar Descadastro'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.close()}
              >
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Você pode se cadastrar novamente a qualquer momento visitando nosso site.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}