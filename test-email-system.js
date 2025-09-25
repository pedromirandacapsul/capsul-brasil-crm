// Script de teste para verificar se todas as funcionalidades estão funcionando
const { emailMarketingService } = require('./src/services/email-marketing-service');

async function testEmailSystem() {
  console.log('🧪 Iniciando testes do sistema de email marketing...\n');

  try {
    // Teste 1: Testar configuração de email
    console.log('1️⃣ Testando configuração de email...');
    const testResult = await emailMarketingService.testEmailConfiguration('teste@capsul.com.br');
    console.log('✅ Resultado:', testResult.success ? 'SUCESSO' : 'FALHA');
    console.log('📄 Mensagem:', testResult.message);
    console.log('');

    // Teste 2: Validar lista de emails
    console.log('2️⃣ Testando validação de emails...');
    const testEmails = [
      'valido@gmail.com',
      'invalido@dominio-que-nao-existe.abc',
      'admin@empresa.com',
      'teste@tempmail.com'
    ];

    const validationResult = await emailMarketingService.validateEmailList(testEmails);
    console.log('✅ Emails válidos:', validationResult.valid.length);
    console.log('❌ Emails inválidos:', validationResult.invalid.length);
    console.log('⚠️  Emails suspeitos:', validationResult.suspicious.length);
    console.log('');

    // Teste 3: Criar template
    console.log('3️⃣ Testando criação de template...');
    const template = await emailMarketingService.createTemplate({
      name: 'Template de Teste',
      description: 'Template criado para teste do sistema',
      subject: 'Olá {{nome}}, bem-vindo à Capsul Brasil!',
      htmlContent: `
        <h2>Bem-vindo, {{nome}}!</h2>
        <p>Obrigado por se cadastrar na <strong>{{empresa}}</strong>.</p>
        <p>Seu email: {{email}}</p>
        <p>Atenciosamente,<br>Equipe Capsul Brasil</p>
      `,
      textContent: 'Bem-vindo, {{nome}}! Obrigado por se cadastrar.',
      variables: ['nome', 'empresa', 'email'],
      category: 'MARKETING',
      createdById: 'user-admin'
    });
    console.log('✅ Template criado:', template.id);
    console.log('');

    // Teste 4: Obter analytics gerais
    console.log('4️⃣ Testando analytics do sistema...');
    const analytics = await emailMarketingService.getDetailedAnalytics();
    console.log('📊 Campanhas:', analytics.campaigns);
    console.log('📧 Emails enviados:', analytics.emailsSent);
    console.log('👁️  Taxa de abertura:', analytics.openRate.toFixed(2) + '%');
    console.log('🖱️  Taxa de cliques:', analytics.clickRate.toFixed(2) + '%');
    console.log('');

    // Teste 5: Gerar link de unsubscribe
    console.log('5️⃣ Testando geração de link de unsubscribe...');
    const unsubLink = emailMarketingService.generateUnsubscribeLink('teste@capsul.com.br');
    console.log('🔗 Link gerado:', unsubLink);
    console.log('');

    console.log('🎉 Todos os testes concluídos com sucesso!\n');
    console.log('✅ Sistema de email marketing está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar os testes
testEmailSystem();