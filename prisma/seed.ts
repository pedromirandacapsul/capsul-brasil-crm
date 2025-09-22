import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Capsul@2024!Admin', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@capsul.com.br' },
    update: {},
    create: {
      name: 'Administrador Capsul',
      email: 'admin@capsul.com.br',
      passwordHash: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  })

  // Create manager user
  const managerPassword = await bcrypt.hash('Capsul@2024!Manager', 12)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@capsul.com.br' },
    update: {},
    create: {
      name: 'Gestor Capsul',
      email: 'manager@capsul.com.br',
      passwordHash: managerPassword,
      role: 'MANAGER',
      active: true,
    },
  })

  // Create sales user
  const salesPassword = await bcrypt.hash('Capsul@2024!Sales', 12)

  const sales = await prisma.user.upsert({
    where: { email: 'vendas@capsul.com.br' },
    update: {},
    create: {
      name: 'Vendedor Capsul',
      email: 'vendas@capsul.com.br',
      passwordHash: salesPassword,
      role: 'SALES',
      active: true,
    },
  })

  // Create sample leads
  const sampleLeads = await Promise.all([
    prisma.lead.upsert({
      where: { id: 'sample-lead-1' },
      update: {},
      create: {
        id: 'sample-lead-1',
        name: 'João Silva',
        email: 'joao.silva@empresa.com.br',
        phone: '(11) 99999-1234',
        company: 'Empresa ABC Ltda',
        roleTitle: 'Diretor Comercial',
        interest: 'Consultoria em Gestão',
        notes: 'Interessado em otimizar processos internos',
        source: 'Website',
        utmSource: 'google',
        utmMedium: 'organic',
        consentLGPD: true,
        status: 'NEW',
        score: 85,
        ownerId: sales.id,
      },
    }),
    prisma.lead.upsert({
      where: { id: 'sample-lead-2' },
      update: {},
      create: {
        id: 'sample-lead-2',
        name: 'Maria Santos',
        email: 'maria.santos@startup.com.br',
        phone: '(11) 88888-5678',
        company: 'Startup XYZ',
        roleTitle: 'CEO',
        interest: 'Transformação Digital',
        notes: 'Startup em fase de crescimento, precisa de estruturação',
        source: 'LinkedIn',
        utmSource: 'linkedin',
        utmMedium: 'social',
        consentLGPD: true,
        status: 'CONTACTED',
        score: 92,
        ownerId: sales.id,
        firstContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    }),
    prisma.lead.upsert({
      where: { id: 'sample-lead-3' },
      update: {},
      create: {
        id: 'sample-lead-3',
        name: 'Carlos Oliveira',
        email: 'carlos@corporacao.com.br',
        phone: '(11) 77777-9012',
        company: 'Corporação 123',
        roleTitle: 'VP de Operações',
        interest: 'Eficiência Operacional',
        notes: 'Grande empresa, processo de decisão complexo',
        source: 'Referral',
        consentLGPD: true,
        status: 'QUALIFIED',
        score: 78,
        ownerId: manager.id,
        firstContactAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    }),
  ])

  // Create sample activities
  await Promise.all([
    prisma.activity.create({
      data: {
        leadId: sampleLeads[0].id,
        userId: sales.id,
        type: 'CREATED',
        payload: JSON.stringify({ message: 'Lead criado através do formulário do site' }),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: sampleLeads[1].id,
        userId: sales.id,
        type: 'CREATED',
        payload: JSON.stringify({ message: 'Lead criado através do LinkedIn' }),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: sampleLeads[1].id,
        userId: sales.id,
        type: 'CONTACTED',
        payload: JSON.stringify({
          message: 'Primeiro contato realizado',
          method: 'email',
          duration: 0
        }),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: sampleLeads[2].id,
        userId: manager.id,
        type: 'CREATED',
        payload: JSON.stringify({ message: 'Lead criado através de referência' }),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: sampleLeads[2].id,
        userId: manager.id,
        type: 'STATUS_CHANGED',
        payload: JSON.stringify({
          message: 'Status alterado para Qualificado',
          oldStatus: 'CONTACTED',
          newStatus: 'QUALIFIED'
        }),
      },
    }),
  ])

  // Create sample tasks
  await Promise.all([
    prisma.task.create({
      data: {
        leadId: sampleLeads[0].id,
        assigneeId: sales.id,
        creatorId: sales.id,
        title: 'Ligar para o João Silva',
        description: 'Fazer contato inicial para entender melhor as necessidades',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'PENDING',
      },
    }),
    prisma.task.create({
      data: {
        leadId: sampleLeads[1].id,
        assigneeId: sales.id,
        creatorId: manager.id,
        title: 'Enviar proposta inicial',
        description: 'Preparar e enviar proposta baseada na reunião inicial',
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'IN_PROGRESS',
      },
    }),
    prisma.task.create({
      data: {
        leadId: sampleLeads[2].id,
        assigneeId: manager.id,
        creatorId: manager.id,
        title: 'Agendar reunião com tomadores de decisão',
        description: 'Coordenar agenda com VP e diretoria para apresentação',
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        status: 'PENDING',
      },
    }),
  ])

  // Create sample KPIs
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

  await Promise.all([
    // Leads metrics
    prisma.teamKPI.upsert({
      where: { date_metric: { date: today, metric: 'leads_created' } },
      update: {},
      create: {
        date: today,
        metric: 'leads_created',
        value: 3,
        metadata: JSON.stringify({ source: 'seed' }),
      },
    }),
    prisma.teamKPI.upsert({
      where: { date_metric: { date: yesterday, metric: 'leads_created' } },
      update: {},
      create: {
        date: yesterday,
        metric: 'leads_created',
        value: 5,
        metadata: JSON.stringify({ source: 'seed' }),
      },
    }),
    prisma.teamKPI.upsert({
      where: { date_metric: { date: twoDaysAgo, metric: 'leads_created' } },
      update: {},
      create: {
        date: twoDaysAgo,
        metric: 'leads_created',
        value: 2,
        metadata: JSON.stringify({ source: 'seed' }),
      },
    }),
    // Conversion metrics
    prisma.teamKPI.upsert({
      where: { date_metric: { date: today, metric: 'conversion_rate' } },
      update: {},
      create: {
        date: today,
        metric: 'conversion_rate',
        value: 0.15,
        metadata: JSON.stringify({ source: 'seed', unit: 'percentage' }),
      },
    }),
    // Response time metrics
    prisma.teamKPI.upsert({
      where: { date_metric: { date: today, metric: 'avg_response_time_hours' } },
      update: {},
      create: {
        date: today,
        metric: 'avg_response_time_hours',
        value: 4.5,
        metadata: JSON.stringify({ source: 'seed', unit: 'hours' }),
      },
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log('👤 Users created:')
  console.log(`   Admin: admin@capsul.com.br / Capsul@2024!Admin`)
  console.log(`   Manager: manager@capsul.com.br / Capsul@2024!Manager`)
  console.log(`   Sales: vendas@capsul.com.br / Capsul@2024!Sales`)
  console.log('📊 Sample data: 3 leads, activities, tasks, and KPIs created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })