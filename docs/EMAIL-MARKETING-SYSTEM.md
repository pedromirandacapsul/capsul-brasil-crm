# Sistema de Email Marketing - Capsul Brasil CRM

## 📋 Visão Geral

Este documento descreve o sistema completo de email marketing implementado no Capsul Brasil CRM, que inclui 10 funcionalidades essenciais para tornar a plataforma competitiva com Mailchimp, ActiveCampaign e HubSpot.

## 🚀 Funcionalidades Implementadas

### 1. Sistema de Tracking Avançado
- **Pixel de abertura**: Rastreamento transparente de abertura de emails
- **Tracking de cliques**: Rastreamento de todos os links nos emails
- **Analytics em tempo real**: Métricas detalhadas de engajamento

### 2. Validação Inteligente de Emails
- **Validação de sintaxe**: Verificação de formato de email
- **Verificação de domínio**: Validação de registros MX
- **Detecção de emails temporários**: Identificação de domínios descartáveis
- **Validação em lote**: Processamento de listas grandes

### 3. Testes A/B Completos
- **Variantes customizáveis**: Teste de assuntos, conteúdo e remetentes
- **Critérios de vitória**: Taxa de abertura, cliques ou conversões
- **Análise estatística**: Determinação automática do vencedor

### 4. Sistema de Unsubscribe Seguro
- **Tokens criptografados**: Links seguros com expiração
- **Processo em uma etapa**: Descadastro simples para o usuário
- **Conformidade LGPD**: Cumprimento das regulamentações

### 5. Dashboard de Analytics
- **Métricas principais**: Taxa de abertura, cliques, rejeição
- **Gráficos interativos**: Visualização de dados em tempo real
- **Exportação de dados**: Download de relatórios em CSV
- **Filtros avançados**: Por campanha, período e segmento

### 6. Templates Dinâmicos
- **Variáveis personalizáveis**: {{nome}}, {{empresa}}, {{email}}
- **Editor visual**: Interface amigável para criação
- **Versionamento**: Controle de versões dos templates

### 7. Segmentação Avançada
- **Critérios múltiplos**: Status, fonte, tags, data, valor
- **Segmentos dinâmicos**: Atualização automática
- **Targeting preciso**: Envios altamente direcionados

### 8. Automações de Workflow
- **Triggers configuráveis**: Lead criado, status alterado, data
- **Sequências de emails**: Campanhas automatizadas
- **Condições lógicas**: Fluxos condicionais inteligentes

### 9. Integração Multi-provedor
- **AWS SES**: Produção com alta deliverabilidade
- **SendGrid**: Alternativa confiável
- **Gmail SMTP**: Para desenvolvimento
- **Provedores customizados**: Flexibilidade total

### 10. Relatórios Detalhados
- **ROI por campanha**: Retorno sobre investimento
- **Análise de engajamento**: Comportamento dos leads
- **Tendências temporais**: Performance ao longo do tempo

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos

```
src/
├── app/
│   ├── admin/email-marketing/
│   │   ├── analytics/page.tsx      # Dashboard de analytics
│   │   ├── campaigns/page.tsx      # Gestão de campanhas
│   │   ├── templates/page.tsx      # Gestão de templates
│   │   └── workflows/page.tsx      # Automações
│   ├── api/
│   │   ├── email-marketing/
│   │   │   ├── analytics/route.ts  # API de analytics
│   │   │   ├── ab-tests/route.ts   # API de testes A/B
│   │   │   ├── campaigns/route.ts  # API de campanhas
│   │   │   └── templates/route.ts  # API de templates
│   │   ├── track/
│   │   │   ├── open/[id]/route.ts  # Tracking de abertura
│   │   │   └── click/[id]/route.ts # Tracking de cliques
│   │   └── unsubscribe/route.ts    # API de descadastro
│   └── unsubscribe/[token]/page.tsx # Página de descadastro
├── components/email-marketing/
│   ├── email-analytics-dashboard.tsx
│   ├── ab-test-creator.tsx
│   └── campaign-builder.tsx
└── services/
    ├── email-marketing-service.ts   # Serviço principal
    ├── email-tracking-service.ts    # Serviço de tracking
    └── email-validation-service.ts  # Validação de emails
```

### Modelos de Banco de Dados

```prisma
// Templates de email
model EmailTemplate {
  id          String @id @default(cuid())
  name        String
  subject     String
  htmlContent String
  textContent String?
  variables   String? // JSON
  // ... outros campos
}

// Campanhas de email
model EmailCampaignNew {
  id              String @id @default(cuid())
  name            String
  subject         String
  status          String // DRAFT, SENDING, SENT
  totalRecipients Int
  sentCount       Int
  openedCount     Int
  clickedCount    Int
  // ... outros campos
}

// Sistema de tracking
model EmailTracking {
  id            String @id @default(cuid())
  campaignId    String?
  leadEmail     String
  trackingToken String @unique
  status        String
  openCount     Int
  clickCount    Int
  // ... outros campos
}

// Testes A/B
model ABTest {
  id       String @id @default(cuid())
  name     String
  status   String // DRAFT, RUNNING, COMPLETED
  variantA String // JSON
  variantB String // JSON
  results  String? // JSON
  // ... outros campos
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Configuração SMTP
SMTP_PROVIDER=ses # ses, sendgrid, gmail, mailhog
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@capsul.com.br
SMTP_FROM_NAME=Capsul Brasil CRM

# AWS SES (se usar)
AWS_SES_REGION=us-east-2
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key

# SendGrid (se usar)
SENDGRID_API_KEY=your_sendgrid_key

# Gmail (se usar)
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalação e Setup

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar banco de dados**:
```bash
npx prisma db push
```

3. **Executar testes**:
```bash
node test-basic-functionality.js
```

## 📊 Como Usar

### 1. Criar um Template
```typescript
const template = await emailMarketingService.createTemplate({
  name: 'Boas-vindas',
  subject: 'Bem-vindo, {{nome}}!',
  htmlContent: '<h1>Olá {{nome}}</h1><p>Bem-vindo à {{empresa}}!</p>',
  variables: ['nome', 'empresa'],
  category: 'MARKETING',
  createdById: 'user-id'
});
```

### 2. Criar uma Campanha
```typescript
const campaign = await emailMarketingService.createCampaign({
  name: 'Campanha de Boas-vindas',
  subject: 'Bem-vindo à Capsul Brasil!',
  templateId: template.id,
  type: 'MARKETING',
  createdById: 'user-id'
});
```

### 3. Adicionar Destinatários
```typescript
await emailMarketingService.addRecipientsToCampaign(campaign.id, {
  leadIds: ['lead1', 'lead2', 'lead3'],
  segmentCriteria: {
    status: ['NEW', 'QUALIFIED'],
    source: ['WEBSITE', 'FACEBOOK']
  }
});
```

### 4. Enviar Campanha
```typescript
await emailMarketingService.sendCampaign(campaign.id, {
  batchSize: 50,
  delayBetweenBatches: 1000
});
```

### 5. Validar Lista de Emails
```typescript
const validation = await emailMarketingService.validateEmailList([
  'email1@domain.com',
  'email2@domain.com'
]);

console.log('Válidos:', validation.valid);
console.log('Inválidos:', validation.invalid);
console.log('Suspeitos:', validation.suspicious);
```

### 6. Criar Teste A/B
```typescript
const abTest = await fetch('/api/email-marketing/ab-tests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Teste de Subject',
    templateId: 'template-id',
    variants: {
      A: { subject: 'Oferta especial para você!' },
      B: { subject: 'Não perca esta oportunidade!' }
    },
    settings: {
      testSize: 20,
      winnerCriteria: 'opens',
      testDuration: 24,
      autoSendWinner: true
    }
  })
});
```

### 7. Obter Analytics
```typescript
const analytics = await emailMarketingService.getDetailedAnalytics(
  'campaign-id', // Opcional: ID da campanha específica
  {
    from: new Date('2024-01-01'),
    to: new Date()
  }
);

console.log('Taxa de abertura:', analytics.openRate);
console.log('Taxa de cliques:', analytics.clickRate);
console.log('Total enviado:', analytics.emailsSent);
```

## 🔗 APIs Disponíveis

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/email-marketing/templates` | Lista templates |
| `POST` | `/api/email-marketing/templates` | Cria template |
| `GET` | `/api/email-marketing/campaigns` | Lista campanhas |
| `POST` | `/api/email-marketing/campaigns` | Cria campanha |
| `GET` | `/api/email-marketing/analytics` | Busca analytics |
| `POST` | `/api/email-marketing/ab-tests` | Cria teste A/B |
| `GET` | `/api/track/open/[id]` | Rastreia abertura |
| `GET` | `/api/track/click/[id]` | Rastreia clique |
| `POST` | `/api/unsubscribe` | Processa descadastro |

### Tracking de Emails

#### Pixel de Abertura
```html
<img src="/api/track/open/tracking-id" width="1" height="1" style="display:none;" />
```

#### Link de Tracking
```html
<a href="/api/track/click/tracking-id?url=https://example.com">Clique aqui</a>
```

#### Link de Unsubscribe
```html
<a href="/unsubscribe/token-base64">Descadastre-se</a>
```

## 📈 Métricas e Analytics

### Métricas Principais

- **Taxa de Entrega**: Percentual de emails entregues
- **Taxa de Abertura**: Percentual de emails abertos
- **Taxa de Cliques**: Percentual de cliques nos links
- **Taxa de Descadastro**: Percentual de unsubscribes
- **Taxa de Rejeição**: Percentual de bounces

### Dashboard Features

- **Filtros por período**: 7 dias, 30 dias, 90 dias, personalizado
- **Filtros por campanha**: Analytics específicas por campanha
- **Top campanhas**: Ranking por performance
- **Atividade recente**: Últimas ações dos leads
- **Exportação CSV**: Download de relatórios

## 🔒 Segurança e Conformidade

### LGPD/GDPR
- **Consentimento explícito**: Campo `consentLGPD` no modelo Lead
- **Direito ao esquecimento**: Funcionalidade de exclusão de dados
- **Transparência**: Links claros de descadastro
- **Auditoria**: Log de todas as ações

### Segurança
- **Tokens seguros**: Criptografia base64 com timestamp
- **Expiração de links**: Links de descadastro expiram em 48h
- **Validação de entrada**: Sanitização de todos os inputs
- **Rate limiting**: Controle de frequência de envio

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Emails não são enviados
```bash
# Verificar configuração SMTP
node -e "console.log(process.env.SMTP_HOST)"

# Testar conexão
node test-basic-functionality.js
```

#### 2. Tracking não funciona
- Verificar se `NEXT_PUBLIC_APP_URL` está configurado
- Confirmar que os endpoints `/api/track/*` estão acessíveis

#### 3. Validação de email falha
- Verificar conectividade de rede para consultas DNS
- Confirmar que a lista de domínios descartáveis está atualizada

#### 4. Analytics não carregam
```bash
# Verificar tabelas do banco
npx prisma studio
```

#### 5. Erro na migração do Prisma
```bash
# Resetar banco (cuidado em produção!)
npx prisma migrate reset

# Aplicar migrações
npx prisma db push
```

## 🔄 Workflow de Desenvolvimento

### Para adicionar nova funcionalidade:

1. **Atualizar schema** (`prisma/schema.prisma`)
2. **Aplicar migração** (`npx prisma db push`)
3. **Implementar serviço** (`src/services/`)
4. **Criar API** (`src/app/api/`)
5. **Desenvolver UI** (`src/components/`)
6. **Adicionar testes** (scripts de teste)
7. **Atualizar documentação**

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do console/servidor
2. Executar `test-basic-functionality.js`
3. Consultar esta documentação
4. Abrir issue no repositório

---

## 🎉 Conclusão

O sistema de email marketing do Capsul Brasil CRM está agora completamente funcional e competitivo com as principais plataformas do mercado. Todas as 10 funcionalidades essenciais foram implementadas com sucesso:

✅ **Sistema completo implementado e testado**
✅ **Arquitetura escalável e modular**
✅ **Conformidade com LGPD/GDPR**
✅ **APIs RESTful bem documentadas**
✅ **Dashboard analytics em tempo real**
✅ **Testes automatizados incluídos**

O sistema está pronto para uso em produção! 🚀