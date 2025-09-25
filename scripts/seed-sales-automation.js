const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSalesAutomation() {
  try {
    console.log('🎯 Populando banco com dados de automação de vendas...')

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

    // 1. Criar templates de vendas
    console.log('📄 Criando templates de vendas...')

    const salesTemplates = [
      {
        name: 'Proposta Comercial - Descoberta',
        type: 'PROPOSAL',
        stage: 'DISCOVERY',
        subject: 'Proposta Comercial - {{company}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Proposta Comercial</h2>
          <p>Olá {{leadName}},</p>
          <p>Com base na nossa conversa sobre as necessidades da <strong>{{company}}</strong>, preparamos uma proposta personalizada:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151;">Valor do Investimento</h3>
            <p style="font-size: 24px; font-weight: bold; color: #2563eb;">{{value}}</p>
          </div>

          <p>Esta proposta é válida por 15 dias e inclui:</p>
          <ul>
            <li>Implementação completa da solução</li>
            <li>Treinamento da equipe</li>
            <li>Suporte técnico por 6 meses</li>
          </ul>

          <p>Estou à disposição para esclarecer qualquer dúvida.</p>
          <p>Atenciosamente,<br>{{ownerName}}</p>
        </div>`,
        generatePdf: false,
        isDefault: true,
        createdById: adminUser.id
      },
      {
        name: 'Follow-up - Primeira Tentativa',
        type: 'FOLLOW_UP',
        stage: 'PROPOSAL',
        subject: 'Sobre nossa proposta para {{company}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Olá {{leadName}},</p>
          <p>Espero que esteja bem! Queria dar um follow-up sobre a proposta que enviei para a {{company}}.</p>
          <p>Surgiu alguma dúvida? Estou aqui para ajudar e esclarecer qualquer ponto.</p>
          <p>Podemos marcar uma conversa rápida para discutir os próximos passos?</p>
          <p>Aguardo seu retorno!</p>
          <p>{{ownerName}}</p>
        </div>`,
        generatePdf: false,
        isDefault: true,
        createdById: adminUser.id
      },
      {
        name: 'Follow-up - Segunda Tentativa',
        type: 'FOLLOW_UP',
        stage: 'PROPOSAL',
        subject: 'Última oportunidade - {{company}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Olá {{leadName}},</p>
          <p>Sei que deve estar ocupado, mas não queria perder a oportunidade de ajudar a {{company}}.</p>
          <p>Nossa proposta expira em breve, e gostaria de saber se há interesse em prosseguir.</p>
          <p>Caso não seja o momento ideal, sem problemas - pode me avisar quando for conveniente retomar a conversa.</p>
          <p>Obrigado pelo tempo!</p>
          <p>{{ownerName}}</p>
        </div>`,
        generatePdf: false,
        isDefault: true,
        createdById: adminUser.id
      },
      {
        name: 'Fechamento - Última Tentativa',
        type: 'CLOSING',
        stage: 'NEGOTIATION',
        subject: 'Vamos fechar hoje? - {{company}}',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Olá {{leadName}},</p>
          <p>Estamos quase finalizando a negociação para a {{company}}!</p>
          <p>Para garantirmos o início imediato, posso oferecer:</p>
          <ul>
            <li>✅ 5% de desconto adicional</li>
            <li>✅ Início na próxima semana</li>
            <li>✅ Suporte prioritário</li>
          </ul>
          <p><strong>Esta oferta é válida apenas até hoje às 18h.</strong></p>
          <p>Vamos fechar? 🚀</p>
          <p>{{ownerName}}</p>
        </div>`,
        generatePdf: false,
        isDefault: true,
        createdById: adminUser.id
      }
    ]

    for (const template of salesTemplates) {
      try {
        const created = await prisma.salesTemplate.create({
          data: template
        })
        console.log(`   ✅ Template "${created.name}" criado`)
      } catch (error) {
        console.log(`   ⚠️  Template "${template.name}" já existe ou erro:`, error.message)
      }
    }

    // 2. Criar regras de automação por estágio
    console.log('⚙️ Criando regras de automação...')

    const automationRules = [
      {
        name: 'Proposta Automática - Descoberta',
        description: 'Envia proposta automática quando oportunidade chega em descoberta',
        triggerType: 'STAGE_CHANGE',
        triggerValue: 'DISCOVERY',
        templateId: null, // Será buscado por tipo e estágio
        delayHours: 2,
        conditions: JSON.stringify({
          minValue: 5000,
          hasEmail: true
        }),
        active: true,
        createdById: adminUser.id
      },
      {
        name: 'Follow-up Automático - Proposta',
        description: 'Follow-up automático 24h após envio de proposta',
        triggerType: 'STAGE_CHANGE',
        triggerValue: 'PROPOSAL',
        templateId: null,
        delayHours: 24,
        conditions: JSON.stringify({
          noResponse: true
        }),
        active: true,
        createdById: adminUser.id
      },
      {
        name: 'Urgência - Negociação',
        description: 'Criar urgência quando oportunidade está em negociação há 3 dias',
        triggerType: 'STAGE_CHANGE',
        triggerValue: 'NEGOTIATION',
        templateId: null,
        delayHours: 72,
        conditions: JSON.stringify({
          stageTime: 3,
          unit: 'days'
        }),
        active: true,
        createdById: adminUser.id
      }
    ]

    for (const rule of automationRules) {
      try {
        const created = await prisma.salesAutomationRule.create({
          data: rule
        })
        console.log(`   ✅ Regra "${created.name}" criada`)
      } catch (error) {
        console.log(`   ⚠️  Regra "${rule.name}" já existe ou erro:`, error.message)
      }
    }

    // 3. Verificar se existem oportunidades para demonstrar
    const opportunityCount = await prisma.opportunity.count()
    console.log(`📊 Total de oportunidades existentes: ${opportunityCount}`)

    if (opportunityCount === 0) {
      console.log('🔄 Criando oportunidades de exemplo para demonstrar automação...')

      // Buscar um lead existente
      let lead = await prisma.lead.findFirst()

      if (!lead) {
        // Criar lead de exemplo
        lead = await prisma.lead.create({
          data: {
            name: 'João Empresário',
            email: 'joao@exemplo.com.br',
            phone: '(11) 99999-0001',
            company: 'Empresa Exemplo Ltda',
            interest: 'Automação de vendas',
            status: 'QUALIFIED',
            source: 'WEBSITE'
          }
        })
        console.log(`   ✅ Lead de exemplo criado: ${lead.name}`)
      }

      // Criar oportunidade de exemplo
      const opportunity = await prisma.opportunity.create({
        data: {
          leadId: lead.id,
          ownerId: adminUser.id,
          stage: 'NEW',
          amountBr: 15000,
          probability: 20,
          expectedCloseAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      })

      console.log(`   ✅ Oportunidade de exemplo criada: R$ ${opportunity.amountBr}`)
    }

    console.log('🎉 Seed de automação de vendas concluído!')
    console.log('\n📝 Como testar:')
    console.log('1. Vá para /admin/opportunities')
    console.log('2. Mude o estágio de uma oportunidade')
    console.log('3. As automações serão disparadas automaticamente')
    console.log('4. Verifique os emails agendados em /admin/sales/scheduled-emails')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedSalesAutomation()
  .then(() => {
    console.log('✅ Seed executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  })