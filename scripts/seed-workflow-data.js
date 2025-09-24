const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedWorkflowData() {
  try {
    console.log('🌱 Populando banco com dados de teste para workflows...')

    // Buscar um usuário admin existente
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })

    if (!adminUser) {
      console.error('❌ Nenhum usuário admin encontrado. Crie um usuário admin primeiro.')
      return
    }

    console.log(`✅ Usando usuário admin: ${adminUser.email}`)

    // Buscar templates existentes
    const templates = await prisma.emailTemplate.findMany({
      where: { active: true }
    })

    if (templates.length === 0) {
      console.log('⚠️  Nenhum template encontrado. Execute o seed de email data primeiro.')
      return
    }

    console.log(`✅ Encontrados ${templates.length} templates`)

    // 1. Criar workflows de exemplo
    console.log('🔄 Criando workflows de exemplo...')

    const workflows = [
      {
        name: 'Boas-vindas para Novos Leads',
        description: 'Sequência de emails para novos leads que se cadastram',
        triggerType: 'LEAD_CREATED',
        triggerConfig: JSON.stringify({}),
        active: true,
        createdById: adminUser.id,
        steps: [
          {
            templateId: templates[0].id, // Boas-vindas
            stepOrder: 1,
            delayHours: 0,
            conditions: JSON.stringify({})
          },
          {
            templateId: templates[1].id, // Follow-up
            stepOrder: 2,
            delayHours: 24,
            conditions: JSON.stringify({})
          }
        ]
      },
      {
        name: 'Nutrição de Leads Qualificados',
        description: 'Workflow para nutrir leads que foram qualificados',
        triggerType: 'STATUS_CHANGED',
        triggerConfig: JSON.stringify({ status: 'QUALIFIED' }),
        active: true,
        createdById: adminUser.id,
        steps: [
          {
            templateId: templates[1].id, // Follow-up
            stepOrder: 1,
            delayHours: 2,
            conditions: JSON.stringify({ leadStatus: ['QUALIFIED'] })
          }
        ]
      }
    ]

    for (const workflow of workflows) {
      try {
        const { steps, ...workflowData } = workflow
        
        const created = await prisma.emailWorkflow.create({
          data: {
            ...workflowData,
            steps: {
              create: steps
            }
          }
        })
        console.log(`   ✅ Workflow "${created.name}" criado com ${steps.length} steps`)
      } catch (error) {
        console.log(`   ⚠️  Workflow "${workflow.name}" já existe ou erro:`, error.message)
      }
    }

    console.log('🎉 Seed de workflows concluído!')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedWorkflowData()
  .then(() => {
    console.log('✅ Seed executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })
