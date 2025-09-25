const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestExecution() {
  try {
    console.log('🧪 Criando execução de teste...');

    // Buscar workflow e lead de teste
    const workflow = await prisma.emailWorkflow.findFirst({
      where: { active: true }
    });

    const lead = await prisma.lead.findFirst({
      where: { email: 'pedro@grupocapsul.com.br' }
    });

    if (!workflow || !lead) {
      console.log('❌ Workflow ou lead não encontrado');
      return;
    }

    console.log('📋 Usando:', workflow.name, 'para', lead.name);

    // Criar execução que deve ser processada AGORA
    const execution = await prisma.emailWorkflowExecution.create({
      data: {
        workflowId: workflow.id,
        leadId: lead.id,
        currentStep: 1,
        status: 'RUNNING',
        nextStepAt: new Date(Date.now() - 60000), // 1 minuto atrás
        data: JSON.stringify({ test: true })
      }
    });

    console.log('✅ Execução criada:', execution.id);

    // Verificar execuções pendentes
    const pendingCount = await prisma.emailWorkflowExecution.count({
      where: {
        status: 'RUNNING',
        nextStepAt: {
          lte: new Date()
        }
      }
    });

    console.log('⏰ Execuções pendentes:', pendingCount);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTestExecution();