#!/usr/bin/env node

/**
 * Script de Backfill para Criação Retroativa de Oportunidades
 *
 * Processa leads antigos que estão em status que deveriam ter criado
 * oportunidades automaticamente, mas não criaram devido à implementação
 * posterior do sistema de automação.
 *
 * Uso:
 *   node scripts/backfill-opportunities.js [--dry-run] [--status QUALIFIED] [--batch-size 100]
 *
 * Opções:
 *   --dry-run: Apenas simula as operações sem salvar no banco
 *   --status: Processa apenas leads com status específico
 *   --batch-size: Número de leads processados por lote (padrão: 50)
 *   --force: Força recriação de oportunidades mesmo se já existirem
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuração de automação integrada (baseada em automation-config.ts)
const AUTOMATION_CONFIG = {
  triggers: [
    {
      status: 'QUALIFIED',
      stage: 'QUALIFICATION',
      enabled: true,
      requiresValue: false,
      description: 'Lead qualificado automaticamente vira oportunidade',
      priority: 1
    },
    {
      status: 'PROPOSAL',
      stage: 'PROPOSAL',
      enabled: true,
      requiresValue: true,
      description: 'Proposta com valor obrigatório',
      priority: 2
    },
    {
      status: 'WON',
      stage: 'WON',
      enabled: true,
      requiresValue: false,
      description: 'Negócio fechado com sucesso',
      priority: 3
    },
    {
      status: 'LOST',
      stage: 'LOST',
      enabled: true,
      requiresValue: false,
      description: 'Oportunidade perdida',
      priority: 4
    },
    {
      status: 'CONTACTED',
      stage: 'NEW',
      enabled: true,
      requiresValue: false,
      description: 'Lead contatado pode virar oportunidade automaticamente',
      priority: 5
    },
    {
      status: 'INTERESTED',
      stage: 'DISCOVERY',
      enabled: true,
      requiresValue: false,
      description: 'Lead interessado entra em descoberta automaticamente',
      priority: 6
    },
    {
      status: 'NEW',
      stage: 'NEW',
      enabled: false,
      requiresValue: false,
      description: 'Lead novo (normalmente não cria oportunidade)',
      priority: 7
    }
  ]
}

// Funções helper para automação
function shouldCreateOpportunity(status) {
  const config = AUTOMATION_CONFIG.triggers.find(c => c.status === status)
  return config?.enabled || false
}

function getTriggerConfig(status) {
  return AUTOMATION_CONFIG.triggers.find(c => c.status === status) || null
}

function getActiveTriggers() {
  return AUTOMATION_CONFIG.triggers
    .filter(c => c.enabled)
    .sort((a, b) => a.priority - b.priority)
}

// Configurações do script
const DEFAULT_BATCH_SIZE = 50
const VALID_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

// Parse dos argumentos da linha de comando
function parseArgs() {
  const args = process.argv.slice(2)
  const config = {
    dryRun: false,
    status: null,
    batchSize: DEFAULT_BATCH_SIZE,
    force: false
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        config.dryRun = true
        break
      case '--status':
        if (i + 1 < args.length) {
          const status = args[++i].toUpperCase()
          if (VALID_STATUSES.includes(status)) {
            config.status = status
          } else {
            console.error(`❌ Status inválido: ${status}. Válidos: ${VALID_STATUSES.join(', ')}`)
            process.exit(1)
          }
        }
        break
      case '--batch-size':
        if (i + 1 < args.length) {
          config.batchSize = parseInt(args[++i])
          if (isNaN(config.batchSize) || config.batchSize <= 0) {
            console.error('❌ Batch size deve ser um número positivo')
            process.exit(1)
          }
        }
        break
      case '--force':
        config.force = true
        break
      case '--help':
        console.log(`
Script de Backfill para Criação Retroativa de Oportunidades

Uso:
  node scripts/backfill-opportunities.js [opções]

Opções:
  --dry-run              Apenas simula as operações sem salvar
  --status QUALIFIED     Processa apenas leads com status específico
  --batch-size 100       Número de leads por lote (padrão: 50)
  --force                Força recriação mesmo se oportunidade já existe
  --help                 Mostra esta ajuda

Exemplos:
  node scripts/backfill-opportunities.js --dry-run
  node scripts/backfill-opportunities.js --status QUALIFIED
  node scripts/backfill-opportunities.js --status PROPOSAL --force
        `)
        process.exit(0)
        break
    }
  }

  return config
}

// Função para buscar leads que precisam de oportunidades
async function findLeadsNeedingOpportunities(config) {
  const activeTriggers = getActiveTriggers()
  const eligibleStatuses = activeTriggers.map(t => t.status)

  console.log(`🔍 Buscando leads com status: ${eligibleStatuses.join(', ')}`)

  const whereClause = {
    status: config.status ? { equals: config.status } : { in: eligibleStatuses },
    ...(config.force ? {} : {
      opportunities: {
        none: {} // Só leads sem oportunidades (a menos que --force)
      }
    })
  }

  const totalLeads = await prisma.lead.count({ where: whereClause })

  console.log(`📊 Total de leads encontrados: ${totalLeads}`)

  if (totalLeads === 0) {
    console.log('✅ Nenhum lead necessita processamento')
    return []
  }

  // Buscar leads em lotes
  const leads = await prisma.lead.findMany({
    where: whereClause,
    include: {
      opportunities: true,
      owner: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: config.batchSize
  })

  return leads
}

// Função para criar uma oportunidade para um lead
async function createOpportunityForLead(lead, config) {
  const triggerConfig = getTriggerConfig(lead.status)

  if (!triggerConfig || !triggerConfig.enabled) {
    console.log(`⚠️  Lead ${lead.id} (${lead.name}) tem status ${lead.status} que não está habilitado para automação`)
    return null
  }

  // Verificar se já existe oportunidade (importante para --force)
  if (lead.opportunities.length > 0 && !config.force) {
    console.log(`⚠️  Lead ${lead.id} (${lead.name}) já tem ${lead.opportunities.length} oportunidade(s)`)
    return null
  }

  // Verificar se requer valor obrigatório e se o lead tem dealValue
  if (triggerConfig.requiresValue && (!lead.dealValue || lead.dealValue <= 0)) {
    console.log(`⚠️  Lead ${lead.id} (${lead.name}) em status ${lead.status} requer valor, mas dealValue é ${lead.dealValue}`)
    return null
  }

  const opportunityData = {
    leadId: lead.id,
    ownerId: lead.ownerId || lead.owner?.id,
    stage: triggerConfig.stage,
    amountBr: lead.dealValue || null,
    currency: 'BRL',
    probability: getProbabilityForStage(triggerConfig.stage),
    expectedCloseAt: calculateExpectedCloseDate(lead.createdAt, triggerConfig.stage),
    createdAt: lead.stageEnteredAt || lead.createdAt, // Usar data de entrada no estágio se disponível
    updatedAt: new Date()
  }

  if (config.dryRun) {
    console.log(`🔄 [DRY RUN] Criaria oportunidade para lead ${lead.id} (${lead.name}):`, {
      stage: opportunityData.stage,
      amount: opportunityData.amountBr,
      probability: opportunityData.probability
    })
    return { ...opportunityData, id: 'dry-run-id' }
  }

  try {
    // Se --force e já existe oportunidade, deletar primeiro
    if (config.force && lead.opportunities.length > 0) {
      console.log(`🔄 Removendo ${lead.opportunities.length} oportunidade(s) existente(s) do lead ${lead.id}`)
      await prisma.opportunity.deleteMany({
        where: { leadId: lead.id }
      })
    }

    const opportunity = await prisma.opportunity.create({
      data: opportunityData
    })

    // Criar registro no histórico de estágios
    await prisma.stageHistory.create({
      data: {
        opportunityId: opportunity.id,
        stageFrom: null, // Primeiro estágio
        stageTo: triggerConfig.stage,
        changedBy: lead.ownerId || 'system',
        changedAt: opportunityData.createdAt
      }
    })

    // Criar atividade de automação
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: lead.ownerId || 'system',
        type: 'OPPORTUNITY_CREATED_BACKFILL',
        payload: JSON.stringify({
          opportunityId: opportunity.id,
          stage: triggerConfig.stage,
          automationTrigger: lead.status,
          backfillScript: true,
          originalDate: lead.stageEnteredAt || lead.createdAt
        }),
        createdAt: opportunityData.createdAt
      }
    })

    console.log(`✅ Oportunidade criada para lead ${lead.id} (${lead.name}) - ID: ${opportunity.id}`)
    return opportunity

  } catch (error) {
    console.error(`❌ Erro ao criar oportunidade para lead ${lead.id} (${lead.name}):`, error.message)
    return null
  }
}

// Função para calcular probabilidade baseada no estágio
function getProbabilityForStage(stage) {
  const stageProbabilities = {
    'NEW': 10,
    'QUALIFICATION': 25,
    'DISCOVERY': 40,
    'PROPOSAL': 65,
    'NEGOTIATION': 80,
    'WON': 100,
    'LOST': 0
  }
  return stageProbabilities[stage] || 10
}

// Função para calcular data esperada de fechamento
function calculateExpectedCloseDate(createdAt, stage) {
  const baseDate = new Date(createdAt)
  const daysToAdd = {
    'NEW': 30,
    'QUALIFICATION': 25,
    'DISCOVERY': 20,
    'PROPOSAL': 15,
    'NEGOTIATION': 10,
    'WON': 0,
    'LOST': 0
  }

  baseDate.setDate(baseDate.getDate() + (daysToAdd[stage] || 30))
  return baseDate
}

// Função principal
async function main() {
  const config = parseArgs()

  console.log('🚀 Iniciando script de backfill de oportunidades')
  console.log('📋 Configuração:', {
    dryRun: config.dryRun,
    status: config.status || 'todos os status ativos',
    batchSize: config.batchSize,
    force: config.force
  })

  if (config.dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhuma alteração será salva no banco de dados')
  }

  try {
    // Validar configuração de automação
    const activeTriggers = getActiveTriggers()
    if (activeTriggers.length === 0) {
      console.error('❌ Nenhum trigger de automação está ativo')
      process.exit(1)
    }

    console.log(`✅ ${activeTriggers.length} triggers ativos: ${activeTriggers.map(t => t.status).join(', ')}`)

    let processedCount = 0
    let createdCount = 0
    let totalBatches = 0

    while (true) {
      const leads = await findLeadsNeedingOpportunities(config)

      if (leads.length === 0) {
        break
      }

      totalBatches++
      console.log(`\n📦 Processando lote ${totalBatches} (${leads.length} leads)`)

      for (const lead of leads) {
        const opportunity = await createOpportunityForLead(lead, config)
        processedCount++

        if (opportunity) {
          createdCount++
        }

        // Pequena pausa para não sobrecarregar o banco
        if (!config.dryRun && processedCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Se processamos menos leads que o batch size, é o último lote
      if (leads.length < config.batchSize) {
        break
      }
    }

    console.log('\n🎉 Script concluído!')
    console.log(`📊 Estatísticas finais:`)
    console.log(`   - Leads processados: ${processedCount}`)
    console.log(`   - Oportunidades criadas: ${createdCount}`)
    console.log(`   - Taxa de sucesso: ${processedCount > 0 ? Math.round((createdCount / processedCount) * 100) : 0}%`)

    if (config.dryRun) {
      console.log('\n💡 Para executar as alterações de verdade, execute sem --dry-run')
    }

  } catch (error) {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { main, parseArgs, findLeadsNeedingOpportunities, createOpportunityForLead }