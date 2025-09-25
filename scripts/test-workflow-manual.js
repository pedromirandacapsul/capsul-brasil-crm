#!/usr/bin/env node
/**
 * Teste manual de workflow - dispara um workflow específico e monitora logs
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testWorkflowManual() {
  try {
    console.log('🧪 Teste Manual de Workflow\n')

    // 1. Buscar leads e workflows disponíveis
    console.log('1️⃣ Buscando dados...')

    const leads = await prisma.lead.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const workflows = await prisma.emailWorkflow.findMany({
      where: { active: true },
      select: { id: true, name: true, triggerType: true },
      take: 5
    })

    console.log(`   📋 ${leads.length} leads encontrados:`)
    leads.forEach((lead, i) => {
      console.log(`      ${i+1}. ${lead.name} (${lead.email}) - ID: ${lead.id}`)
    })

    console.log(`   🔄 ${workflows.length} workflows ativos:`)
    workflows.forEach((wf, i) => {
      console.log(`      ${i+1}. ${wf.name} (${wf.triggerType}) - ID: ${wf.id}`)
    })

    if (leads.length === 0 || workflows.length === 0) {
      console.log('❌ Não há leads ou workflows para testar')
      return
    }

    // 2. Usar primeiro lead e primeiro workflow
    const testLead = leads[0]
    const testWorkflow = workflows[0]

    console.log(`\n2️⃣ Testando workflow "${testWorkflow.name}" para lead "${testLead.name}"`)

    // 3. Importar e usar o serviço
    const { emailWorkflowService } = require('../src/services/email-workflow-service')

    // 4. Iniciar execução
    console.log('   🚀 Iniciando execução...')
    const startResult = await emailWorkflowService.startWorkflowExecution(
      testWorkflow.id,
      testLead.id,
      { test: true, timestamp: new Date().toISOString() }
    )

    console.log('   📊 Resultado da inicialização:', startResult)

    if (!startResult.success) {
      console.log('❌ Falha ao iniciar workflow')
      return
    }

    // 5. Aguardar 2 segundos e processar
    console.log('\n3️⃣ Aguardando 2 segundos e processando...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('   🔄 Processando steps agendados...')
    const processResult = await emailWorkflowService.processScheduledSteps()

    console.log('   📊 Resultado do processamento:', processResult)

    // 6. Verificar execuções
    console.log('\n4️⃣ Verificando execuções...')
    const executions = await prisma.emailWorkflowExecution.findMany({
      where: {
        workflowId: testWorkflow.id,
        leadId: testLead.id
      },
      include: {
        lead: { select: { name: true, email: true } },
        workflow: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    console.log(`   📋 ${executions.length} execuções encontradas:`)
    executions.forEach((exec, i) => {
      console.log(`      ${i+1}. Status: ${exec.status}, Step: ${exec.currentStep}, NextAt: ${exec.nextStepAt}`)
    })

    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWorkflowManual()