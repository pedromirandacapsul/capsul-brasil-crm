# Sistema de Automações de Email Marketing

## Visão Geral

O módulo de Automações de Email Marketing permite criar e gerenciar fluxos automatizados de emails baseados no comportamento dos leads. O sistema inclui criação de automações, execução de steps sequenciais, monitoramento de performance e logs detalhados.

## Estrutura do Módulo

### Páginas Frontend

#### `/admin/email-marketing/automations` - Dashboard Principal
- **Localização**: `src/app/admin/email-marketing/automations/page.tsx`
- **Funcionalidades**:
  - Lista todas as automações com estatísticas em tempo real
  - Cards com métricas de performance (taxa de abertura, cliques, emails enviados)
  - Toggle para ativar/desativar automações
  - Navegação para criar, editar e visualizar logs
  - Estados de carregamento e tratamento de erros

#### `/admin/email-marketing/automations/create` - Criar Automação
- **Localização**: `src/app/admin/email-marketing/automations/create/page.tsx`
- **Funcionalidades**:
  - Formulário para criar nova automação
  - Seleção de triggers (Lead Criado, Status Alterado, Tag Adicionada, etc.)
  - Gerenciamento dinâmico de steps (adicionar/remover)
  - Integração com templates de email
  - Validação e tratamento de erros

#### `/admin/email-marketing/automations/[id]` - Detalhes da Automação
- **Localização**: `src/app/admin/email-marketing/automations/[id]/page.tsx`
- **Funcionalidades**:
  - Interface com abas (Visão Geral, Editar, Logs)
  - **Aba Visão Geral**: Estatísticas e preview dos steps
  - **Aba Editar**: Formulário para modificar propriedades da automação
  - **Aba Logs**: Logs detalhados de execução com filtros

### APIs Backend

#### `/api/email-marketing/automations` - API Principal
- **Localização**: `src/app/api/email-marketing/automations/route.ts`
- **Endpoints**:
  - `GET` - Lista automações com estatísticas calculadas
  - `POST` - Cria nova automação com steps

#### `/api/email-marketing/automations/[id]` - API Individual
- **Localização**: `src/app/api/email-marketing/automations/[id]/route.ts`
- **Endpoints**:
  - `GET` - Busca automação específica com steps e execuções
  - `PUT` - Atualiza automação (nome, descrição, status)
  - `DELETE` - Remove automação com verificações de segurança

#### `/api/email-marketing/automations/[id]/logs` - API de Logs
- **Localização**: `src/app/api/email-marketing/automations/[id]/logs/route.ts`
- **Endpoints**:
  - `GET` - Busca logs de execução com paginação e filtros

## Modelos de Dados

### EmailWorkflow
```typescript
{
  id: string
  name: string
  description?: string
  triggerType: string // LEAD_CREATED, STATUS_CHANGED, TAG_ADDED, DATE_BASED, MANUAL
  triggerConfig?: string // JSON com configurações do trigger
  active: boolean
  createdById: string
  createdAt: DateTime
  updatedAt: DateTime
  steps: EmailWorkflowStep[]
  executions: EmailWorkflowExecution[]
}
```

### EmailWorkflowStep
```typescript
{
  id: string
  workflowId: string
  templateId?: string
  stepOrder: number
  delayHours: number // Delay antes de enviar
  conditions?: string // JSON com condições
  active: boolean
  createdAt: DateTime
  template?: EmailTemplate
}
```

### EmailWorkflowExecution
```typescript
{
  id: string
  workflowId: string
  leadId: string
  currentStep: number
  status: string // RUNNING, COMPLETED, PAUSED, FAILED
  startedAt: DateTime
  completedAt?: DateTime
  nextStepAt?: DateTime
  data?: string // JSON com dados do contexto
  error?: string // Mensagem de erro
  logs?: string // JSON com logs detalhados
  workflow: EmailWorkflow
  lead: Lead
}
```

## Tipos de Triggers

### LEAD_CREATED - Novo Lead
- Dispara quando um novo lead é criado no sistema
- Ideal para sequências de boas-vindas

### STATUS_CHANGED - Mudança de Status
- Dispara quando o status do lead muda
- Útil para nurturing baseado no estágio do funil

### TAG_ADDED - Tag Adicionada
- Dispara quando uma tag específica é adicionada ao lead
- Permite segmentação dinâmica

### DATE_BASED - Baseado em Data
- Dispara em datas específicas (aniversários, datas importantes)
- Permite campanhas sazonais

### MANUAL - Trigger Manual
- Disparado manualmente pelo usuário
- Útil para testes e campanhas pontuais

## Fluxo de Execução

1. **Criação da Automação**
   - Usuário define trigger e condições
   - Configura steps sequenciais com templates
   - Define delays entre steps

2. **Ativação do Trigger**
   - Sistema monitora eventos definidos
   - Cria `EmailWorkflowExecution` quando trigger é ativado

3. **Processamento dos Steps**
   - Executa steps em ordem sequencial
   - Aplica delays configurados
   - Registra logs detalhados

4. **Monitoramento**
   - Tracks aberturas e cliques
   - Calcula métricas de performance
   - Mantém histórico completo

## Métricas e Analytics

### Métricas Calculadas
- **Taxa de Abertura**: Percentual de emails abertos
- **Taxa de Clique**: Percentual de cliques nos emails
- **Leads Elegíveis**: Número de leads que atendem aos critérios
- **Emails Disparados**: Total de emails enviados
- **Execuções Ativas**: Automações em andamento

### Logs Detalhados
- Timestamp de cada ação
- Status de execução (SUCCESS, FAILED, PENDING)
- Detalhes de erros quando aplicável
- Contexto completo da execução

## Segurança e Validações

### Validações de Input
- Nome e tipo de trigger obrigatórios
- Validação de steps e templates
- Verificação de permissões de usuário

### Proteções de Sistema
- Não permite exclusão de automações com execuções ativas
- Logs imutáveis para auditoria
- Tratamento robusto de erros

### Rate Limiting
- Controle de frequência de envio
- Prevenção de spam
- Respeito aos limites do provedor de email

## Integração com Outros Módulos

### Email Templates
- Integração direta com sistema de templates
- Suporte a variáveis dinâmicas
- Preview de templates nos steps

### Lead Management
- Acesso aos dados completos do lead
- Tracking de atividades
- Atualização de scores e tags

### Campaign Analytics
- Integração com métricas gerais
- Relatórios consolidados
- Comparação de performance

## Troubleshooting

### Problemas Comuns
1. **Automação não dispara**: Verificar critérios do trigger
2. **Emails não enviados**: Validar configuração SMTP/SES
3. **Performance baixa**: Analisar segmentação e conteúdo

### Logs de Debug
- Todos os erros são logados com contexto completo
- Interface de logs permite filtrar por status e período
- Detalhes técnicos disponíveis para debugging

## Próximas Funcionalidades
- Integração com WhatsApp para cross-channel
- A/B testing de templates
- Segmentação dinâmica avançada
- Machine learning para otimização de horários
- Webhooks para integrações externas

---

**Documentação técnica completa do módulo de Automações de Email Marketing do CRM Capsul.**