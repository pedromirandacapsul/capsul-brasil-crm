# 📧 VERIFICAR EMAIL NO AMAZON SES (SANDBOX)

Para testar envios reais enquanto está em sandbox, você precisa verificar seu email pessoal.

## 🎯 PASSO A PASSO RÁPIDO

### 1️⃣ **Acessar SES Console**
1. Acesse: https://console.aws.amazon.com/ses/
2. **IMPORTANTE**: Certifique-se de estar na região **US East (Ohio) us-east-2**
3. No menu à esquerda, clique **"Verified identities"**

### 2️⃣ **Criar Identity de Email**
1. Clique **"Create identity"**
2. Selecione **"Email address"** (não Domain)
3. Digite seu email pessoal: `seuemail@gmail.com`
4. Clique **"Create identity"**

### 3️⃣ **Confirmar no seu Email**
1. Verifique sua caixa de entrada
2. Procure email da AWS: **"Amazon Web Services – Email Address Verification"**
3. Clique no link de confirmação
4. Você verá: **"Congratulations! You've successfully verified..."**

### 4️⃣ **Verificar Status no Console**
1. Volte ao SES Console
2. Em **"Verified identities"**, você verá seu email
3. Status deve mostrar: **"Verified"** ✅

---

## 🧪 TESTAR ENVIO IMEDIATAMENTE

Depois de verificar, execute estes testes:

### **Teste 1: Script direto**
```bash
cd /Users/pedromiranda/crm\ capsul/capsul-brasil-crm
node scripts/test-amazon-ses.js seuemail@gmail.com
```

### **Teste 2: Via API da aplicação**
```bash
curl -X POST "http://localhost:3000/api/email/test" \
  -H "Content-Type: application/json" \
  -d '{"email": "seuemail@gmail.com"}'
```

### **Teste 3: Campanha de marketing**
```bash
DATABASE_URL="file:./dev.db" node -e "
const nodemailer = require('nodemailer');
async function testCampaign() {
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-2.amazonaws.com',
    port: 587, secure: false,
    auth: {
      user: 'AKIAQDKVYZ7QFXO7JNAL',
      pass: 'BNUXpEjeU/gxZ9xwFzWaZClkql1Je1/9z8vCKDsPMg6C'
    }, tls: { rejectUnauthorized: true }
  });

  const info = await transporter.sendMail({
    from: '\"Capsul Brasil\" <noreply@capsul.com.br>',
    to: 'SEUEMAIL@GMAIL.COM', // ← SUBSTITUIR
    subject: '🎉 Teste Amazon SES Funcionando!',
    html: \`<h1>Sucesso!</h1><p>Amazon SES + Capsul CRM funcionando perfeitamente!</p>\`
  });

  console.log('✅ Email enviado:', info.messageId);
}
testCampaign().catch(console.error);
"
```

---

## ⚠️ IMPORTANTE: Verificar REMETENTE também

Para evitar erros, verifique também o email remetente:

### **Opção A: Verificar noreply@capsul.com.br**
1. Se você tem acesso a este email
2. Create identity → Email → `noreply@capsul.com.br`
3. Confirmar no email

### **Opção B: Usar seu email como remetente**
1. Editar `.env.local`:
```bash
SMTP_FROM="seuemail@gmail.com"  # ← Seu email verificado
```

---

## 🚀 APÓS VERIFICAÇÃO

Você poderá:
- ✅ Enviar até **200 emails por dia**
- ✅ Testar **campanhas reais**
- ✅ Validar **automações de vendas**
- ✅ Monitorar **métricas de entrega**
- ✅ Testar **templates personalizados**

---

## 🎯 RESULTADO ESPERADO

Depois de verificar seu email:

```bash
🎉 EMAIL ENVIADO COM SUCESSO!
📧 Message ID: 01020xxx-xxx-xxx-xxx-xxxxx@email.amazonses.com
📤 Accepted: [ 'seuemail@gmail.com' ]
📥 Rejected: []
✅ Amazon SES + Capsul CRM integrados!
```

---

## 💡 DICAS IMPORTANTES

1. **Use Gmail/Outlook**: Mais fácil para verificar
2. **Verifique spam**: Email da AWS pode ir para spam
3. **Região correta**: us-east-2 (Ohio) - onde estão suas credenciais
4. **Status Verified**: Deve aparecer "Verified" com checkmark verde
5. **Teste imediato**: Funciona instantaneamente após verificar

**Pronto para testar o sistema completo em modo sandbox!** 🚀