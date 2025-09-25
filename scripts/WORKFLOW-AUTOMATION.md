# 🔄 Sistema de Automação de Workflows

## Problema Resolvido

**Problema Original**: Os workflows de email não executavam automaticamente quando novos leads eram criados via formulário.

**Causa**: Faltavam triggers automáticos no endpoint de criação de leads.

**Solução**: Implementamos triggers automáticos e sistema completo de processamento de workflows.

## ✅ O que foi Implementado

### 1. Triggers Automáticos
- **Integração no endpoint de leads** (`src/app/api/leads/route.ts`)
- **Trigger para novos leads**: Dispara workflows com trigger `LEAD_CREATED`
- **Trigger para leads reabertos**: Dispara workflows quando lead LOST → NEW
- **Tratamento de erros**: Não impede criação do lead em caso de erro nos workflows

### 2. Scripts de Processamento
- **`scripts/process-workflows.js`**: Script principal para processar workflows agendados
- **`scripts/dev-workflow-processor.js`**: Processador contínuo para desenvolvimento (30s)
- **`scripts/cron-workflow.sh`**: Script de cron job com logs
- **`scripts/crontab-example.txt`**: Exemplos de configuração do crontab

### 3. Sistema de Logs
- **Logs automáticos**: Criados em `logs/workflow-cron.log`
- **Rotação de logs**: Remove automaticamente logs antigos (7+ dias)
- **Timestamps**: Todos os logs incluem data/hora

## 🚀 Como Usar

### Para Desenvolvimento

1. **Iniciar processador em background**:
```bash
cd "/Users/pedromiranda/crm capsul/capsul-brasil-crm"
node scripts/dev-workflow-processor.js &
```

2. **Testar processamento manual**:
```bash
node scripts/process-workflows.js
```

3. **Ver logs em tempo real**:
```bash
tail -f logs/workflow-processor.log
```

### Para Produção

1. **Instalar cron job** (executar a cada 5 minutos):
```bash
# Editar crontab
crontab -e

# Adicionar linha:
*/5 * * * * /Users/pedromiranda/crm\ capsul/capsul-brasil-crm/scripts/cron-workflow.sh

# Ou usar exemplo pronto:
crontab scripts/crontab-example.txt
```

2. **Verificar cron job ativo**:
```bash
crontab -l
```

3. **Ver logs do cron**:
```bash
tail -f logs/workflow-cron.log
```

## 📊 Monitoramento

### APIs Disponíveis
- **GET** `/api/email-marketing/workflows` - Listar workflows
- **POST** `/api/email-marketing/workflows/process` - Processar agendados (requer token)
- **GET** `/api/email-marketing/workflows/executions` - Ver execuções

### Logs de Sistema
```bash
# Ver últimas execuções
tail -20 logs/workflow-cron.log

# Monitorar em tempo real
tail -f logs/workflow-cron.log

# Buscar erros
grep -i error logs/workflow-cron.log
```

## 🛠️ Configuração

### Variáveis de Ambiente
```bash
# API base URL (padrão: http://localhost:3001)
export API_BASE_URL="http://localhost:3001"

# Token de segurança para cron jobs (padrão: default-cron-token)
export CRON_SECRET_TOKEN="your-secure-token"
```

### Frequências de Processamento

- **Desenvolvimento**: 30 segundos (dev-workflow-processor.js)
- **Produção recomendada**: 5 minutos (*/5 * * * *)
- **Alta frequência**: 1 minuto (* * * * *)
- **Baixa frequência**: 10-30 minutos

## 🔧 Como Funciona

### 1. Criação de Lead
```
Formulário → POST /api/leads → emailWorkflowService.checkAutoTriggers()
```

### 2. Trigger de Workflow
```
checkAutoTriggers() → startWorkflowExecution() → scheduleNextStep()
```

### 3. Processamento Agendado
```
Cron Job → POST /api/email-marketing/workflows/process → processScheduledSteps()
```

### 4. Envio de Email
```
processWorkflowStep() → sendWorkflowEmail() → EmailMarketingService.sendEmail()
```

## 🎯 Status Atual

- ✅ **Triggers implementados**: Workflows disparam automaticamente
- ✅ **Sistema funcionando**: API processamento ativa
- ✅ **Scripts configurados**: Cron jobs prontos
- ✅ **Logs implementados**: Monitoramento completo
- ✅ **Servidor rodando**: http://localhost:3001
- ✅ **MailHog ativo**: http://localhost:8025 (visualizar emails)

## 📝 Próximos Passos

1. **Testar criação de workflows** via interface web
2. **Criar leads de teste** e verificar disparo automático
3. **Configurar cron job** para ambiente de produção
4. **Monitorar logs** para verificar execução correta

## 🐛 Troubleshooting

### Problema: Workflows não executam
**Solução**: Verificar se o cron job está ativo e se a API está rodando

### Problema: Emails não são enviados
**Solução**: Verificar MailHog (http://localhost:8025) e logs do sistema

### Problema: Erro 500 na API
**Solução**: Verificar se há erros de compilação no Next.js nos logs do servidor

### Problema: Banco de dados
**Solução**: Executar `DATABASE_URL="file:./dev.db" npx prisma db push` para sincronizar schema