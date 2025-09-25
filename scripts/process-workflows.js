#!/usr/bin/env node
/**
 * Script para processar workflows agendados (executado por cron job)
 * Pode ser executado manualmente ou via cron
 */

const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

// Configurações
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'default-cron-token'

async function processWorkflows() {
  try {
    console.log('🔄 Processando workflows agendados...')

    const curlCommand = `curl -X POST "${API_BASE_URL}/api/email-marketing/workflows/process" \
      -H "Authorization: Bearer ${CRON_SECRET_TOKEN}" \
      -H "Content-Type: application/json" \
      -s`

    const { stdout, stderr } = await execAsync(curlCommand)

    if (stderr) {
      console.error('❌ Erro na requisição:', stderr)
      process.exit(1)
    }

    let result
    try {
      result = JSON.parse(stdout)
    } catch (error) {
      console.error('❌ Erro ao parsear resposta JSON:', stdout)
      process.exit(1)
    }

    if (result.success) {
      console.log(`✅ Processamento concluído: ${result.processed} execuções processadas`)
      console.log(`📧 Mensagem: ${result.message}`)
    } else {
      console.error(`❌ Erro no processamento: ${result.error}`)
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Erro ao processar workflows:', error.message)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  processWorkflows()
}

module.exports = { processWorkflows }