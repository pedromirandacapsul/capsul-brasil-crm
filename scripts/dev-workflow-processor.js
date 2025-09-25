#!/usr/bin/env node
/**
 * Processador de workflows para desenvolvimento
 * Roda continuamente em background processando workflows a cada 30 segundos
 */

const { processWorkflows } = require('./process-workflows')

const INTERVAL_MS = 30 * 1000 // 30 segundos

console.log('🚀 Iniciando processador de workflows em modo desenvolvimento')
console.log(`⏰ Processando workflows a cada ${INTERVAL_MS/1000} segundos`)
console.log('📝 Pressione Ctrl+C para parar\n')

let isProcessing = false

async function processLoop() {
  if (isProcessing) {
    console.log('⚠️  Processamento anterior ainda em andamento, pulando...')
    return
  }

  isProcessing = true

  try {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🔄 Verificando workflows agendados...`)

    await processWorkflows()

  } catch (error) {
    console.error(`❌ Erro no processamento: ${error.message}`)
  } finally {
    isProcessing = false
  }
}

// Processar imediatamente na inicialização
processLoop()

// Configurar intervalo
const interval = setInterval(processLoop, INTERVAL_MS)

// Tratamento de sinais para parada limpa
process.on('SIGINT', () => {
  console.log('\n🛑 Parando processador de workflows...')
  clearInterval(interval)
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando processador de workflows...')
  clearInterval(interval)
  process.exit(0)
})