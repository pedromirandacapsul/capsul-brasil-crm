const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedEmailData() {
  try {
    console.log('🌱 Populando banco com dados de teste para email marketing...')

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

    // 1. Criar templates de email
    console.log('📧 Criando templates de email...')

    const templates = [
      {
        name: 'Boas-vindas Lead',
        description: 'Email de boas-vindas para novos leads',
        subject: 'Bem-vindo(a) à Capsul Brasil! 🎉',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">Bem-vindo(a), {{nome}}! 🎉</h1>
            <p>É um prazer ter você conosco na <strong>Capsul Brasil</strong>!</p>
            <p>Recebemos seu interesse e nossa equipe entrará em contato em breve!</p>
          </div>`,
        textContent: `Bem-vindo(a), {{nome}}!\n\nÉ um prazer ter você conosco na Capsul Brasil!`,
        variables: JSON.stringify(['nome', 'empresa', 'email', 'telefone']),
        category: 'WELCOME',
        createdById: adminUser.id
      },
      {
        name: 'Follow-up Qualificação',
        description: 'Email para qualificar leads interessados',
        subject: 'Vamos conversar sobre {{empresa}}? ☕',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Olá {{nome}}, como vai? 👋</h2>
            <p>Gostaria de entender melhor como podemos ajudar a <strong>{{empresa}}</strong>.</p>
            <p>Que tal marcarmos um bate-papo de 15 minutos?</p>
          </div>`,
        textContent: `Olá {{nome}}, como vai?\n\nGostaria de conversar sobre como podemos ajudar a {{empresa}}.`,
        variables: JSON.stringify(['nome', 'empresa', 'email']),
        category: 'FOLLOW_UP',
        createdById: adminUser.id
      }
    ]

    for (const template of templates) {
      try {
        const created = await prisma.emailTemplate.create({
          data: template
        })
        console.log(`   ✅ Template "${created.name}" criado`)
      } catch (error) {
        console.log(`   ⚠️  Template "${template.name}" já existe ou erro:`, error.message)
      }
    }

    // 2. Criar alguns leads de teste
    console.log('👥 Verificando leads de teste...')

    const testLeads = [
      {
        name: 'João Silva',
        email: 'joao@empresa1.com.br',
        phone: '(11) 99999-1111',
        company: 'Tech Innovate Ltda',
        status: 'NEW',
        source: 'WEBSITE',
        interest: 'Automação de processos',
        dealValue: 25000
      },
      {
        name: 'Maria Santos',
        email: 'maria@startup2.com.br',
        phone: '(11) 99999-2222',
        company: 'StartupX',
        status: 'QUALIFIED',
        source: 'LINKEDIN',
        interest: 'CRM personalizado',
        dealValue: 15000
      }
    ]

    for (const lead of testLeads) {
      try {
        const existing = await prisma.lead.findUnique({
          where: { email: lead.email }
        })

        if (!existing) {
          const created = await prisma.lead.create({
            data: lead
          })
          console.log(`   ✅ Lead "${created.name}" criado`)
        } else {
          console.log(`   ℹ️  Lead "${lead.name}" já existe`)
        }
      } catch (error) {
        console.log(`   ⚠️  Erro ao criar lead "${lead.name}":`, error.message)
      }
    }

    console.log('🎉 Seed de dados de email marketing concluído!')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedEmailData()
  .then(() => {
    console.log('✅ Seed executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })
