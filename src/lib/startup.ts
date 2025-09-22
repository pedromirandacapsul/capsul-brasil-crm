import { scheduler } from '@/lib/scheduler'

// Função para inicializar serviços quando a aplicação iniciar
export async function initializeServices() {
  console.log('🚀 Inicializando serviços da aplicação...')

  try {
    // Inicializar o sistema de agendamento
    await scheduler.initialize()

    console.log('✅ Todos os serviços foram inicializados com sucesso')
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error)
  }
}

// Função para parar serviços quando a aplicação for fechada
export function shutdownServices() {
  console.log('🛑 Parando serviços da aplicação...')

  try {
    // Parar todos os jobs agendados
    scheduler.stopAll()

    console.log('✅ Todos os serviços foram parados com sucesso')
  } catch (error) {
    console.error('❌ Erro ao parar serviços:', error)
  }
}

// Configurar handlers para parada da aplicação
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('📨 Recebido SIGINT, parando aplicação...')
    shutdownServices()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('📨 Recebido SIGTERM, parando aplicação...')
    shutdownServices()
    process.exit(0)
  })

  process.on('beforeExit', () => {
    console.log('📨 Aplicação sendo finalizada...')
    shutdownServices()
  })
}