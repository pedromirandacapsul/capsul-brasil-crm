const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmailSystem() {
  console.log('🔧 Verificando sistema de email...');

  try {
    // 1. Verificar execuções
    const total = await prisma.emailWorkflowExecution.count();
    const running = await prisma.emailWorkflowExecution.count({ where: { status: 'RUNNING' } });
    const failed = await prisma.emailWorkflowExecution.count({ where: { status: 'FAILED' } });
    const completed = await prisma.emailWorkflowExecution.count({ where: { status: 'COMPLETED' } });

    console.log(`📊 Execuções: ${total} total | ${running} executando | ${completed} completas | ${failed} falharam`);

    // 2. Verificar workflows
    const workflows = await prisma.emailWorkflow.count();
    const activeWorkflows = await prisma.emailWorkflow.count({ where: { active: true } });
    console.log(`⚙️ Workflows: ${workflows} total | ${activeWorkflows} ativos`);

    // 3. Verificar campanhas
    const campaigns = await prisma.emailCampaign.count();
    console.log(`📧 Campanhas: ${campaigns} total`);

    // 4. Verificar templates
    const templates = await prisma.emailTemplate.count();
    console.log(`🎨 Templates: ${templates} total`);

    console.log('✅ Sistema de email está funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmailSystem();