# 📧 Configuração do Amazon SES para Produção

Este guia te ajudará a configurar o **Amazon SES (Simple Email Service)** para envios profissionais em produção.

## 🎯 Pré-requisitos

- [x] Conta AWS ativa
- [x] Domínio próprio verificado
- [x] Cartão de crédito válido na AWS
- [x] Acesso ao DNS do seu domínio

---

## 📋 Passo 1: Criar conta AWS e configurar SES

### 1.1 - Acessar Amazon SES
1. Acesse [AWS Console](https://console.aws.amazon.com/)
2. Procure por **"SES"** ou **"Simple Email Service"**
3. Selecione a região **US East (N. Virginia)** ou **us-east-1**

### 1.2 - Verificar domínio
1. Vá em **"Verified identities"**
2. Clique **"Create identity"**
3. Selecione **"Domain"**
4. Digite seu domínio: `capsul.com.br`
5. Adicione os registros DNS mostrados:
   - **TXT** para verificação
   - **CNAME** para DKIM
   - **MX** para recebimento (opcional)

### 1.3 - Sair do Sandbox
Por padrão, o SES está em **modo sandbox** (só envia para emails verificados).

1. Vá em **"Account dashboard"**
2. Clique **"Request production access"**
3. Preencha o formulário:
   - **Use case**: Transactional emails
   - **Website**: `https://capsul.com.br`
   - **Bounce/complaint rate**: Menos de 5%

---

## 🔑 Passo 2: Criar credenciais SMTP

### 2.1 - Criar usuário IAM
1. Vá em **AWS IAM Console**
2. **"Users"** → **"Create user"**
3. Nome: `capsul-ses-smtp`
4. **Attach policies directly**
5. Busque e adicione: `AmazonSESFullAccess`

### 2.2 - Gerar credenciais SMTP
1. No **SES Console** → **"SMTP settings"**
2. Clique **"Create SMTP credentials"**
3. **Username**: `capsul-ses-smtp`
4. Clique **"Create user"**
5. **⚠️ IMPORTANTE**: Anote as credenciais:
   - **SMTP Username**: `AKIAIOSFODNN7EXAMPLE`
   - **SMTP Password**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY`

---

## ⚙️ Passo 3: Configurar no Capsul CRM

### 3.1 - Editar .env.local
Abra o arquivo `.env.local` e configure:

```bash
# Email Configuration
SMTP_PROVIDER="ses"

# Amazon SES - CONFIGURE AQUI COM SUAS CREDENCIAIS
AWS_REGION="us-east-1"
AWS_SES_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"     # ← Sua Access Key
AWS_SES_SECRET_KEY="wJalrXUtnFEMI/K7MDENG"    # ← Sua Secret Key
SES_SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_FROM="noreply@capsul.com.br"             # ← Seu domínio verificado
SMTP_FROM_NAME="Capsul Brasil CRM"
```

### 3.2 - Testar configuração
```bash
# Executar teste básico
node scripts/test-amazon-ses.js

# Testar com email real
node scripts/test-amazon-ses.js seu@email.com
```

---

## 🧪 Passo 4: Validar configuração

### 4.1 - Via script de teste
```bash
cd /Users/pedromiranda/crm\ capsul/capsul-brasil-crm
node scripts/test-amazon-ses.js seu@email.com
```

### 4.2 - Via interface web
1. Acesse: http://localhost:3000/admin/email-marketing
2. Use o **"Teste de Configuração SMTP"**
3. Digite seu email e clique **"Testar Envio"**

---

## 🚀 Passo 5: Enviar campanha de produção

### 5.1 - Campanha de teste
```bash
# Executar campanha real via Amazon SES
DATABASE_URL="file:./dev.db" node -e "
const { EmailMarketingService } = require('./src/services/email-marketing-service');
const service = new EmailMarketingService();
service.testEmailConfiguration('seu@email.com').then(result => {
  console.log('Resultado:', result);
});
"
```

---

## 📊 Monitoramento e métricas

### 5.1 - Dashboard SES
- **Bounce rate**: < 5%
- **Complaint rate**: < 0.1%
- **Sending quota**: Monitorar uso diário

### 5.2 - No Capsul CRM
- **Dashboard**: http://localhost:3000/admin/email-marketing
- **Métricas**: Taxa de abertura, cliques, bounces
- **Atividades**: http://localhost:3000/admin/sales/scheduled-emails

---

## ⚠️ Boas práticas de produção

### ✅ Segurança
- [ ] Use **IAM roles** ao invés de Access Keys (em EC2)
- [ ] Rotacione credenciais regularmente
- [ ] Configure **VPC endpoints** para SES
- [ ] Use **AWS Secrets Manager** para credenciais

### ✅ Deliverability
- [ ] Configure **SPF** record: `v=spf1 include:amazonses.com ~all`
- [ ] Ative **DKIM** no domínio
- [ ] Configure **DMARC**: `v=DMARC1; p=quarantine;`
- [ ] Use **subdomínio** para emails: `mail.capsul.com.br`

### ✅ Monitoramento
- [ ] Configure **CloudWatch** alarms
- [ ] Monitore **bounce/complaint** rates
- [ ] Configure **SNS** para notificações
- [ ] Use **SES reputation dashboard**

---

## 🔧 Troubleshooting

### Problema: "Sending quota exceeded"
**Solução**: Aguardar 24h ou solicitar aumento de quota

### Problema: "Email address not verified"
**Solução**: Verificar domínio no SES Console

### Problema: "Access Denied"
**Solução**: Verificar permissões IAM do usuário

### Problema: High bounce rate
**Solução**: Limpar lista de emails e validar destinatários

---

## 💰 Custos estimados

| Volume mensal | Custo SES | Total estimado |
|---------------|-----------|----------------|
| 10.000 emails | $1.00     | ~$1.00        |
| 50.000 emails | $5.00     | ~$5.00        |
| 100.000 emails| $10.00    | ~$10.00       |

**📊 Muito mais barato que SendGrid, Mailgun ou outros!**

---

## 📞 Suporte

- **AWS SES Docs**: https://docs.aws.amazon.com/ses/
- **AWS Support**: Console → Support Center
- **Capsul CRM**: Logs em `/logs` e console do browser

---

## ✅ Checklist de produção

- [ ] Domínio verificado no SES
- [ ] Conta fora do sandbox
- [ ] Credenciais SMTP criadas
- [ ] .env.local configurado
- [ ] Script de teste executado com sucesso
- [ ] SPF/DKIM configurados
- [ ] Primeira campanha enviada
- [ ] Dashboard de métricas funcionando
- [ ] Monitoramento configurado

🎉 **Parabéns! Seu sistema está pronto para envios profissionais em escala!**