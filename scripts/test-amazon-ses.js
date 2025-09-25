const { SESClient, SendEmailCommand, GetSendQuotaCommand } = require('@aws-sdk/client-ses');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testAmazonSES() {
  try {
    console.log('🚀 Testando configuração do Amazon SES...\n');

    // Verificar variáveis de ambiente
    console.log('📋 Verificando configuração:');
    console.log('  • AWS_REGION:', process.env.AWS_REGION || '❌ NÃO CONFIGURADO');
    console.log('  • AWS_SES_ACCESS_KEY:', process.env.AWS_SES_ACCESS_KEY ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');
    console.log('  • AWS_SES_SECRET_KEY:', process.env.AWS_SES_SECRET_KEY ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');
    console.log('  • SMTP_FROM:', process.env.SMTP_FROM || '❌ NÃO CONFIGURADO');
    console.log('  • SES_SMTP_HOST:', process.env.SES_SMTP_HOST || 'Será detectado automaticamente');

    if (!process.env.AWS_SES_ACCESS_KEY || !process.env.AWS_SES_SECRET_KEY) {
      console.log('\n❌ ERRO: Credenciais AWS não configuradas!');
      console.log('\n📋 Para configurar o Amazon SES:');
      console.log('1. Acesse o AWS Console > SES');
      console.log('2. Crie um usuário IAM com permissões SES');
      console.log('3. Gere as credenciais SMTP');
      console.log('4. Configure as variáveis no .env.local:');
      console.log('   AWS_SES_ACCESS_KEY="sua-access-key"');
      console.log('   AWS_SES_SECRET_KEY="sua-secret-key"');
      console.log('   AWS_REGION="us-east-1"');
      console.log('   SMTP_FROM="noreply@seudominio.com"');
      return;
    }

    // Teste 1: Verificar quota do SES
    console.log('\n🔍 Teste 1: Verificando quota do Amazon SES...');
    try {
      const sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-east-2',
        credentials: {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SES_SECRET_KEY,
        },
      });

      const quotaCommand = new GetSendQuotaCommand({});
      const quota = await sesClient.send(quotaCommand);

      console.log('✅ Conectado ao Amazon SES com sucesso!');
      console.log('📊 Quota SES:');
      console.log(`  • Máximo 24h: ${quota.Max24HourSend} emails`);
      console.log(`  • Enviados 24h: ${quota.SentLast24Hours} emails`);
      console.log(`  • Taxa máxima: ${quota.MaxSendRate} emails/segundo`);

    } catch (sesError) {
      console.log('❌ Erro ao conectar com SES:', sesError.message);
      return;
    }

    // Teste 2: Configurar transporter Nodemailer
    console.log('\n🔍 Teste 2: Configurando transporter Nodemailer...');

    const transporter = nodemailer.createTransporter({
      host: process.env.SES_SMTP_HOST || `email-smtp.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_ACCESS_KEY,
        pass: process.env.AWS_SES_SECRET_KEY,
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    // Verificar conexão
    try {
      await transporter.verify();
      console.log('✅ Transporter SMTP configurado com sucesso!');
    } catch (smtpError) {
      console.log('❌ Erro no transporter SMTP:', smtpError.message);
      return;
    }

    // Teste 3: Enviar email de teste (se email for fornecido)
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n🔍 Teste 3: Enviando email de teste para ${testEmail}...`);

      try {
        const info = await transporter.sendMail({
          from: `"Capsul Brasil CRM" <${process.env.SMTP_FROM}>`,
          to: testEmail,
          subject: '🧪 Teste Amazon SES - Capsul Brasil',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb;">🎉 Amazon SES Funcionando!</h1>

              <div style="background: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2>✅ Configuração SES Validada</h2>
                <p>Este email foi enviado com sucesso através do <strong>Amazon SES</strong>!</p>
              </div>

              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3>📊 Detalhes do Envio:</h3>
                <ul>
                  <li><strong>Provedor:</strong> Amazon SES</li>
                  <li><strong>Região:</strong> ${process.env.AWS_REGION}</li>
                  <li><strong>Host SMTP:</strong> ${process.env.SES_SMTP_HOST || `email-smtp.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`}</li>
                  <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                </ul>
              </div>

              <div style="background: #22c55e; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                <h3>🚀 Sistema Pronto para Produção!</h3>
                <p>O Amazon SES está configurado corretamente e pronto para envios em larga escala.</p>
              </div>

              <hr style="margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                📧 Enviado pelo sistema Capsul Brasil CRM<br>
                🌐 Amazon SES - Serviço profissional de email
              </p>
            </div>
          `,
          text: `
            🎉 Amazon SES Funcionando!

            Este email foi enviado com sucesso através do Amazon SES!

            Detalhes do Envio:
            - Provedor: Amazon SES
            - Região: ${process.env.AWS_REGION}
            - Data/Hora: ${new Date().toLocaleString('pt-BR')}

            🚀 Sistema Pronto para Produção!
            O Amazon SES está configurado corretamente e pronto para envios em larga escala.

            Enviado pelo sistema Capsul Brasil CRM
          `
        });

        console.log('✅ Email de teste enviado com sucesso!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📤 Accepted:', info.accepted);
        console.log('📥 Rejected:', info.rejected);

      } catch (emailError) {
        console.log('❌ Erro ao enviar email:', emailError.message);
        return;
      }
    }

    console.log('\n🎉 CONFIGURAÇÃO AMAZON SES VALIDADA COM SUCESSO!');
    console.log('✅ O sistema está pronto para envios em produção');
    console.log('📊 Configure suas campanhas de email marketing no dashboard');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
📧 Script de Teste do Amazon SES

Uso:
  node scripts/test-amazon-ses.js [email-para-teste]

Exemplos:
  node scripts/test-amazon-ses.js
  node scripts/test-amazon-ses.js seu@email.com

O script irá:
1. Verificar as configurações AWS no .env.local
2. Testar conexão com o Amazon SES
3. Configurar o transporter Nodemailer
4. Enviar email de teste (se fornecido)
`);
} else {
  testAmazonSES();
}