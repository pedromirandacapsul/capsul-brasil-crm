const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateRules() {
  try {
    console.log('🔧 Corrigindo templates nas regras de automação...')

    // Use IDs dos templates que existem no banco
    const templates = {
      DISCOVERY: 'cmfy05v2b00017iulvo0lca5d', // Proposta Comercial - Descoberta
      PROPOSAL: 'cmfy05v2c00037iul2zyal4tx',  // Follow-up - Primeira Tentativa
      NEGOTIATION: 'cmfy05v2e00077iuln41oxfmh' // Fechamento - Última Tentativa
    }

    // Atualizar regras uma por uma para evitar constraint violations
    const updated1 = await prisma.salesAutomationRule.updateMany({
      where: { triggerValue: 'DISCOVERY' },
      data: { templateId: templates.DISCOVERY }
    })
    console.log(`✅ ${updated1.count} regra(s) DISCOVERY atualizadas`)

    const updated2 = await prisma.salesAutomationRule.updateMany({
      where: { triggerValue: 'PROPOSAL' },
      data: { templateId: templates.PROPOSAL }
    })
    console.log(`✅ ${updated2.count} regra(s) PROPOSAL atualizadas`)

    const updated3 = await prisma.salesAutomationRule.updateMany({
      where: { triggerValue: 'NEGOTIATION' },
      data: { templateId: templates.NEGOTIATION }
    })
    console.log(`✅ ${updated3.count} regra(s) NEGOTIATION atualizadas`)

    // Verificar o resultado
    const rules = await prisma.salesAutomationRule.findMany({
      include: {
        template: {
          select: { name: true }
        }
      }
    })

    console.log('\n📋 Regras atualizadas:')
    rules.forEach(rule => {
      const templateName = rule.template?.name || 'SEM TEMPLATE'
      console.log(`  • ${rule.name} (${rule.triggerValue}) → ${templateName}`)
    })

    console.log('\n🎉 Templates corrigidos com sucesso!')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateRules()