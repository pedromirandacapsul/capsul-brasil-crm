#!/bin/bash

# Script de cron job para processar workflows de email
# Execute: chmod +x scripts/cron-workflow.sh

# Diretório do projeto
PROJECT_DIR="/Users/pedromiranda/crm capsul/capsul-brasil-crm"

# Logs
LOG_DIR="$PROJECT_DIR/logs"
WORKFLOW_LOG="$LOG_DIR/workflow-cron.log"

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Timestamp
echo "$(date '+%Y-%m-%d %H:%M:%S') - Iniciando processamento de workflows" >> "$WORKFLOW_LOG"

# Ir para o diretório do projeto
cd "$PROJECT_DIR" || exit 1

# Executar o processamento
if node scripts/process-workflows.js >> "$WORKFLOW_LOG" 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Processamento concluído com sucesso" >> "$WORKFLOW_LOG"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Erro no processamento de workflows" >> "$WORKFLOW_LOG"
fi

# Limpar logs antigos (manter apenas os últimos 7 dias)
find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null

echo "$(date '+%Y-%m-%d %H:%M:%S') - Cron job finalizado" >> "$WORKFLOW_LOG"