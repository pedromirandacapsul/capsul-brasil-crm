import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, reason, campaignId } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o lead existe
    const lead = await prisma.lead.findFirst({
      where: { email }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Email não encontrado em nossa base' },
        { status: 404 }
      )
    }

    // Registrar descadastro
    const unsubscribe = await prisma.emailUnsubscribe.create({
      data: {
        leadId: lead.id,
        email: lead.email,
        reason: reason || 'Não especificado',
        campaignId,
        unsubscribedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown'
      }
    })

    // Atualizar status do lead para não receber mais emails
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        emailOptOut: true,
        lastActivityAt: new Date()
      }
    })

    console.log(`✅ Descadastro processado: ${email} - Motivo: ${reason}`)

    return NextResponse.json({
      success: true,
      message: 'Descadastro realizado com sucesso',
      unsubscribeId: unsubscribe.id
    })

  } catch (error: any) {
    console.error('Erro ao processar descadastro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const campaignId = searchParams.get('campaign')

    // Página de descadastro
    const unsubscribePageHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Descadastro - Capsul Brasil CRM</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
          }
          input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          button {
            background: #ef4444;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
          }
          button:hover {
            background: #dc2626;
          }
          .success {
            background: #dcfce7;
            border: 1px solid #16a34a;
            color: #15803d;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .info {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            color: #1e40af;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .legal {
            margin-top: 20px;
            font-size: 12px;
            color: #888;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Capsul Brasil CRM</div>
          </div>

          <h1>Descadastro de Emails</h1>

          <div class="info">
            <strong>Sobre o descadastro:</strong><br>
            Respeitamos sua privacidade. Ao se descadastrar, você não receberá mais emails promocionais nossa.
            Emails transacionais (como confirmações de pedido) ainda podem ser enviados quando necessário.
          </div>

          <form id="unsubscribeForm">
            <div class="form-group">
              <label for="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value="${email || ''}"
                required
                ${email ? 'readonly' : ''}
              />
            </div>

            <div class="form-group">
              <label for="reason">Motivo do descadastro (opcional)</label>
              <select id="reason" name="reason">
                <option value="">Selecione um motivo</option>
                <option value="Muitos emails">Recebo muitos emails</option>
                <option value="Conteúdo irrelevante">Conteúdo não é relevante</option>
                <option value="Não solicitei">Não me inscrevi para receber emails</option>
                <option value="Mudei de email">Mudei de endereço de email</option>
                <option value="Problemas técnicos">Problemas técnicos</option>
                <option value="Outro">Outro motivo</option>
              </select>
            </div>

            <div class="form-group">
              <label for="feedback">Feedback adicional (opcional)</label>
              <textarea
                id="feedback"
                name="feedback"
                rows="3"
                placeholder="Como podemos melhorar nossos emails?"
              ></textarea>
            </div>

            <button type="submit" id="submitBtn">
              Confirmar Descadastro
            </button>
          </form>

          <div class="legal">
            <strong>Seus direitos conforme a LGPD:</strong><br>
            • Você pode solicitar acesso aos seus dados pesais<br>
            • Você pode solicitar a correção de dados incorretos<br>
            • Você pode solicitar a exclusão de seus dados<br>
            • Você pode solicitar a portabilidade de seus dados<br>
            <br>
            Para exercer seus direitos, entre em contato: pedro@grupocapsul.com.br
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} Capsul Brasil CRM. Todos os direitos reservados.<br>
            <a href="mailto:pedro@grupocapsul.com.br">Contato</a> |
            <a href="/privacy">Política de Privacidade</a>
          </div>
        </div>

        <script>
          document.getElementById('unsubscribeForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;

            try {
              submitBtn.textContent = 'Processando...';
              submitBtn.disabled = true;

              const formData = new FormData(this);
              const data = {
                email: formData.get('email'),
                reason: formData.get('reason'),
                feedback: formData.get('feedback'),
                campaignId: '${campaignId || ''}'
              };

              const response = await fetch('/api/email/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              const result = await response.json();

              if (result.success) {
                document.querySelector('.container').innerHTML = \`
                  <div class="header">
                    <div class="logo">Capsul Brasil CRM</div>
                  </div>
                  <div class="success">
                    <h2>✅ Descadastro realizado com sucesso!</h2>
                    <p>Seu email foi removido de nossa lista de marketing. Você não receberá mais emails promocionais.</p>
                    <p>Agradecemos por ter sido nosso assinante!</p>
                  </div>
                  <div class="footer">
                    Caso tenha se descadastrado por engano, entre em contato conosco.
                  </div>
                \`;
              } else {
                alert('Erro: ' + result.error);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
              }

            } catch (error) {
              console.error('Erro:', error);
              alert('Erro ao processar descadastro. Tente novamente.');
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          });
        </script>
      </body>
      </html>
    `

    return new NextResponse(unsubscribePageHtml, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error: any) {
    console.error('Erro ao exibir página de descadastro:', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}