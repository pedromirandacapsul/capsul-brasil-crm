const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testSESDirectSMTP() {
  try {
    console.log('🔧 Testando SMTP Amazon SES Direto\n');

    console.log('📋 Configuração:');
    console.log('  Host: email-smtp.us-east-2.amazonaws.com');
    console.log('  Port: 587');
    console.log('  Region: us-east-2 (Ohio)');
    console.log('  From:', process.env.SMTP_FROM);
    console.log('  To:', process.env.RECIPIENT_EMAIL || 'pedro@grupocapsul.com.br');
    console.log('');

    // Configurar transporter
    const transporter = nodemailer.createTransport({
      host: 'email-smtp.us-east-2.amazonaws.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.AWS_SES_ACCESS_KEY,
        pass: process.env.AWS_SES_SECRET_KEY
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    console.log('1️⃣ Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão SMTP estabelecida!\n');

    console.log('2️⃣ Enviando email de teste...');
    const testTime = new Date().toLocaleString('pt-BR');

    const mailOptions = {
      from: `"Capsul Brasil - Teste" <${process.env.SMTP_FROM}>`,
      to: process.env.RECIPIENT_EMAIL || 'pedro@grupocapsul.com.br',
      subject: `🧪 Teste SES Direto - ${testTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #2563eb; border-radius: 10px;">
          <h1 style="color: #2563eb; text-align: center;">🎯 Amazon SES - Teste Direto</h1>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af;">✅ Configuração Validada</h2>
            <ul style="color: #374151;">
              <li><strong>Servidor:</strong> email-smtp.us-east-2.amazonaws.com</li>
              <li><strong>Região:</strong> us-east-2 (Ohio)</li>
              <li><strong>Porta:</strong> 587 (TLS)</li>
              <li><strong>Protocolo:</strong> SMTP</li>
              <li><strong>Hora do envio:</strong> ${testTime}</li>
            </ul>
          </div>

          <div style="background: #dcfce7; border: 2px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #16a34a; margin: 0 0 10px 0;">🚀 Status: FUNCIONANDO</h3>
            <p style="margin: 0; color: #374151;">
              Se você está lendo este email, o Amazon SES está configurado e funcionando corretamente!
            </p>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Importante - Sandbox Mode</h4>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              Sua conta SES está em modo sandbox. Emails só são entregues para endereços verificados.
              Para enviar para qualquer email, solicite saída do sandbox no AWS Console.
            </p>
          </div>

          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            📧 Enviado via Amazon SES por Capsul Brasil CRM<br>
            🕐 ${testTime}
          </p>
        </div>
      `,
      text: `
        🎯 Amazon SES - Teste Direto

        ✅ Configuração Validada
        - Servidor: email-smtp.us-east-2.amazonaws.com
        - Região: us-east-2 (Ohio)
        - Porta: 587 (TLS)
        - Protocolo: SMTP
        - Hora do envio: ${testTime}

        🚀 Status: FUNCIONANDO

        Se você está lendo este email, o Amazon SES está configurado e funcionando corretamente!

        ⚠️ Importante - Sandbox Mode
        Sua conta SES está em modo sandbox. Emails só são entregues para endereços verificados.
        Para enviar para qualquer email, solicite saída do sandbox no AWS Console.

        📧 Enviado via Amazon SES por Capsul Brasil CRM
        🕐 ${testTime}
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Accepted:', info.accepted);
    console.log('📥 Rejected:', info.rejected);
    console.log('');

    // Diagnóstico
    console.log('🔍 DIAGNÓSTICO DA ENTREGA:');
    console.log('');
    console.log('✅ FUNCIONANDO:');
    console.log('  • Conexão SMTP estabelecida');
    console.log('  • Autenticação aceita');
    console.log('  • Email aceito pelo Amazon SES');
    console.log('  • Message ID gerado:', info.messageId);
    console.log('');

    console.log('❓ SE NÃO RECEBEU O EMAIL:');
    console.log('');
    console.log('1️⃣ VERIFIQUE SPAM/LIXO ELETRÔNICO');
    console.log('   • Procure por "Teste SES Direto"');
    console.log('   • Pode ter ido para pasta de spam');
    console.log('');

    console.log('2️⃣ SANDBOX AMAZON SES');
    console.log('   • Sua conta está em modo SANDBOX');
    console.log('   • SÓ ENTREGA para emails verificados');
    console.log('   • pedro@grupocapsul.com.br precisa estar verificado');
    console.log('');

    console.log('3️⃣ VERIFICAR NO AWS CONSOLE SES:');
    console.log('   • Acesse: https://console.aws.amazon.com/ses/');
    console.log('   • Região: US East (Ohio) us-east-2');
    console.log('   • Verified identities > procure pedro@grupocapsul.com.br');
    console.log('   • Status deve ser "Verified" ✅');
    console.log('');

    console.log('4️⃣ SAIR DO SANDBOX:');
    console.log('   • Account dashboard > "Request production access"');
    console.log('   • Após aprovação = emails para qualquer endereço');
    console.log('');

    console.log('🎯 CONCLUSÃO:');
    console.log('• Amazon SES: ✅ FUNCIONANDO');
    console.log('• SMTP: ✅ CONECTADO');
    console.log('• Envio: ✅ SUCESSO');
    console.log('• Entrega: ❓ Verifique spam ou sandbox');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.log('');
    console.log('🔧 POSSÍVEIS CAUSAS:');
    console.log('  • Credenciais incorretas');
    console.log('  • Conexão de rede bloqueada');
    console.log('  • Configuração SMTP inválida');
    console.log('  • Região AWS incorreta');
  }
}

testSESDirectSMTP();