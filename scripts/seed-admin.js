const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    console.log('🔑 Criando usuário admin...')

    // Verificar se já existe
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe:', existingAdmin.email)
      return
    }

    // Criar admin
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@capsul.com.br',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        active: true
      }
    })

    console.log('✅ Usuário admin criado:', admin.email)

    // Criar alguns leads de teste também
    const leads = await prisma.lead.createMany({
      data: [
        {
          name: 'Tamires Miranda',
          email: 'tnbmiranda@icloud.com',
          phone: '+55 11 99999-9999',
          status: 'NOVO',
          source: 'WEBSITE',
          ownerId: admin.id
        },
        {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '+55 11 88888-8888',
          status: 'CONTATO_REALIZADO',
          source: 'INDICACAO',
          ownerId: admin.id
        }
      ]
    })

    console.log(`✅ ${leads.count} leads criados`)

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
          textContent: 'Olá {{name}}! Seja muito bem-vindo(a) ao nosso sistema! Estamos muito felizes em tê-lo(a) conosco.',
          category: 'WORKFLOW',
          active: true,
          createdById: admin.id
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
          textContent: 'Olá {{name}}! Esperamos que esteja tudo bem! Gostaríamos de apresentar nossos serviços em mais detalhes.',
          category: 'WORKFLOW',
          active: true,
          createdById: admin.id
        }
      ]
    })

    console.log(`✅ ${templates.count} templates criados`)

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()