'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ABTestConfig {
  name: string;
  templateId: string;
  segmentIds: string[];
  variants: {
    A: {
      subject: string;
      preheader?: string;
      fromName?: string;
    };
    B: {
      subject: string;
      preheader?: string;
      fromName?: string;
    };
  };
  settings: {
    testSize: number; // Percentual da audiência para teste
    winnerCriteria: 'opens' | 'clicks' | 'conversions';
    testDuration: number; // Horas
    autoSendWinner: boolean;
  };
}

interface ABTestCreatorProps {
  templates: Array<{ id: string; name: string; subject: string }>;
  segments: Array<{ id: string; name: string }>;
  onSave: () => void;
}

export function ABTestCreator({ templates, segments, onSave }: ABTestCreatorProps) {
  const [config, setConfig] = useState<ABTestConfig>({
    name: '',
    templateId: '',
    segmentIds: [],
    variants: {
      A: { subject: '', preheader: '', fromName: 'Capsul Brasil' },
      B: { subject: '', preheader: '', fromName: 'Capsul Brasil' }
    },
    settings: {
      testSize: 20,
      winnerCriteria: 'opens',
      testDuration: 24,
      autoSendWinner: true
    }
  });

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/email-marketing/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('Teste A/B criado com sucesso!');
        onSave();
      } else {
        toast.error('Erro ao criar teste A/B');
      }
    } catch (error) {
      toast.error('Erro ao criar teste A/B');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Teste A/B</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome do teste */}
        <div>
          <Label htmlFor="name">Nome do Teste</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="Ex: Teste de Subject Line - Black Friday"
          />
        </div>

        {/* Template base */}
        <div>
          <Label htmlFor="template">Template Base</Label>
          <Select
            value={config.templateId}
            onValueChange={(value) => setConfig({ ...config, templateId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variantes */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variante A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  placeholder="Assunto A"
                  value={config.variants.A.subject}
                  onChange={(e) => setConfig({
                    ...config,
                    variants: {
                      ...config.variants,
                      A: { ...config.variants.A, subject: e.target.value }
                    }
                  })}
                />
                <Input
                  placeholder="Preheader A (opcional)"
                  value={config.variants.A.preheader}
                  onChange={(e) => setConfig({
                    ...config,
                    variants: {
                      ...config.variants,
                      A: { ...config.variants.A, preheader: e.target.value }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variante B</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  placeholder="Assunto B"
                  value={config.variants.B.subject}
                  onChange={(e) => setConfig({
                    ...config,
                    variants: {
                      ...config.variants,
                      B: { ...config.variants.B, subject: e.target.value }
                    }
                  })}
                />
                <Input
                  placeholder="Preheader B (opcional)"
                  value={config.variants.B.preheader}
                  onChange={(e) => setConfig({
                    ...config,
                    variants: {
                      ...config.variants,
                      B: { ...config.variants.B, preheader: e.target.value }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configurações do teste */}
        <div className="space-y-4">
          <div>
            <Label>Tamanho do Teste: {config.settings.testSize}%</Label>
            <Slider
              value={[config.settings.testSize]}
              onValueChange={([value]) => setConfig({
                ...config,
                settings: { ...config.settings, testSize: value }
              })}
              min={10}
              max={50}
              step={5}
            />
            <p className="text-sm text-gray-500 mt-1">
              {config.settings.testSize}% receberá o teste, {100 - config.settings.testSize}% receberá o vencedor
            </p>
          </div>

          <div>
            <Label>Critério de Vitória</Label>
            <Select
              value={config.settings.winnerCriteria}
              onValueChange={(value: any) => setConfig({
                ...config,
                settings: { ...config.settings, winnerCriteria: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opens">Taxa de Abertura</SelectItem>
                <SelectItem value="clicks">Taxa de Cliques</SelectItem>
                <SelectItem value="conversions">Taxa de Conversão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duração do Teste (horas): {config.settings.testDuration}</Label>
            <Slider
              value={[config.settings.testDuration]}
              onValueChange={([value]) => setConfig({
                ...config,
                settings: { ...config.settings, testDuration: value }
              })}
              min={1}
              max={72}
              step={1}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Criar Teste A/B
        </Button>
      </CardContent>
    </Card>
  );
}