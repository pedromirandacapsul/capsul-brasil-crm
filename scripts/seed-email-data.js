const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedEmailData() {
  try {
    console.log('🌱 Populando banco com dados de email marketing...')

    // Buscar usuário admin
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.error('❌ Usuário admin não encontrado')
      return
    }

    console.log('✅ Usando usuário admin:', adminUser.email)

    // Criar templates básicos
    const templates = await prisma.emailTemplate.createMany({
      data: [
        {
          name: 'Boas-vindas',
          subject: 'Bem-vindo(a) ao nosso sistema!',
          htmlContent: `
<h1>Olá {{name}}!</h1>
<p>Seja muito bem-vindo(a) ao nosso sistema!</p>
<p>Estamos muito felizes em tê-lo(a) conosco.</p>
<p>Em breve entraremos em contato com mais informações.</p>
<p>Atenciosamente,<br>Equipe Capsul Brasil</p>
          `,
          textContent: 'Olá {{name}}! Seja muito bem-vindo(a) ao nosso sistema!',
          category: 'WORKFLOW',
          active: true,
          createdById: adminUser.id
        },
        {
          name: 'Seguimento 1',
          subject: 'Que tal conhecer mais sobre nossos serviços?',
          htmlContent: `
<h1>Olá {{name}}!</h1>
<p>Esperamos que esteja tudo bem!</p>
<p>Gostaríamos de apresentar nossos serviços em mais detalhes.</p>
<p>Quando seria um bom momento para conversarmos?</p>
<p>Atenciosamente,<br>Equipe Capsul Brasil</p>
          `,
          textContent: 'Olá {{name}}! Esperamos que esteja tudo bem!',
          category: 'WORKFLOW',
          active: true,
          createdById: adminUser.id
        }
      ]
    })
    console.log(`✅ ${templates.count} templates criados`)

    // Buscar templates para criar workflows
    const templatesList = await prisma.emailTemplate.findMany({
      where: { active: true }
    })

    // Criar workflows de exemplo
    console.log('🔄 Criando workflows de exemplo...')

    const workflow1 = await prisma.emailWorkflow.create({
      data: {
        name: 'Boas-vindas para Novos Leads',
        description: 'Sequência de emails para leads recém cadastrados',
        triggerType: 'LEAD_CREATED',
        triggerConfig: JSON.stringify({}),
        active: true,
        createdById: adminUser.id,
        steps: {
          create: [
            {
              stepOrder: 1,
              templateId: templatesList[0].id,
              delayHours: 0,
              conditions: JSON.stringify({})
            },
            {
              stepOrder: 2,
              templateId: templatesList[1].id,
              delayHours: 24,
              conditions: JSON.stringify({})
            }
          ]
        }
      }
    })

    console.log(`   ✅ Workflow "${workflow1.name}" criado com 2 steps`)
    console.log('🎉 Seed de email marketing concluído!')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedEmailData()
