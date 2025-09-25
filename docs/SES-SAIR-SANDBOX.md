# 🚨 URGENTE: Sair do Sandbox Amazon SES

Sua conta está em **SANDBOX MODE** na região **Leste dos EUA (Ohio) - us-east-2**.

## ⚠️ Limitações do Sandbox
- ❌ Só pode enviar para **emails verificados**
- ❌ Limite de **200 emails por dia**
- ❌ Taxa máxima de **1 email por segundo**
- ❌ **NÃO FUNCIONA** para produção

---

## 🎯 PASSO A PASSO PARA SAIR DO SANDBOX

### 1️⃣ **Acesse o Console SES**
1. Vá para: https://console.aws.amazon.com/ses/
2. **IMPORTANTE**: Mude para região **"US East (Ohio) us-east-2"**
3. No menu à esquerda, clique **"Account dashboard"**

### 2️⃣ **Solicitar acesso à produção**
1. Na página principal, você verá: **"Your account is in the sandbox"**
2. Clique no botão **"Request production access"**
3. Preencha o formulário:

```
Use Case: Transactional
Website URL: https://capsul.com.br
Use Case Description:
"Estamos implementando um sistema CRM para envio de emails transacionais incluindo:
- Boas-vindas para novos clientes
- Notificações de status de pedidos
- Follow-ups de vendas automatizados
- Confirmações de agendamentos
- Newsletters mensais para clientes existentes

Nossa empresa atende clientes corporativos no Brasil e precisamos de confiabilidade para comunicação profissional."

Additional Contact Info:
Email: contato@capsul.com.br
Preferred Contact Language: Portuguese

Bounce/Complaint Process:
"Manteremos taxas de bounce abaixo de 5% e complaints abaixo de 0.1% através de:
- Lista de emails validada e atualizada
- Opt-in confirmado para marketing
- Processo de unsubscribe claro
- Monitoramento automático de métricas
- Limpeza regular de emails inválidos"

Expected Volume: 10,000 emails per day
```

### 3️⃣ **Aguardar aprovação**
- ⏱️ **Tempo**: 12-24 horas (pode levar até 48h)
- 📧 **Notificação**: Por email cadastrado na conta AWS
- 📊 **Status**: Monitorar no dashboard SES

---

## 🔧 ENQUANTO AGUARDA: Preparar configuração

### 4️⃣ **Criar usuário IAM**
1. Acesse: https://console.aws.amazon.com/iam/
2. **Users** → **Create user**
3. **Username**: `capsul-ses-user`
4. **Permissions**: Attach policy **AmazonSESFullAccess**
5. **Create access key** → **Other** → Create

### 5️⃣ **Gerar credenciais SMTP**
1. Volte ao SES Console (us-east-2)
2. **SMTP settings** → **Create SMTP credentials**
3. **IAM User Name**: `capsul-ses-smtp`
4. **Download** as credenciais (.csv)
5. **⚠️ IMPORTANTE**: Anote:
   - SMTP Username: `AKIAXXXXXXXXXXXXXXXX`
   - SMTP Password: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

### 6️⃣ **Verificar email/domínio (opcional mas recomendado)**
1. **Verified identities** → **Create identity**
2. Opção 1 - **Email**: `contato@capsul.com.br`
3. Opção 2 - **Domain**: `capsul.com.br` (requer configuração DNS)

---

## ⚙️ CONFIGURAR NO CAPSUL CRM

### 7️⃣ **Atualizar .env.local**
```bash
# Substituir pelas suas credenciais REAIS
AWS_REGION="us-east-2"
AWS_SES_ACCESS_KEY="AKIAXXXXXXXXXXXXXXXX"     # ← Sua Access Key REAL
AWS_SES_SECRET_KEY="xxxxxxxxxxxxxxxxxxxxxxx"  # ← Sua Secret Key REAL
SMTP_FROM="contato@capsul.com.br"             # ← Email verificado
```

### 8️⃣ **Testar configuração**
```bash
# Teste básico
cd /Users/pedromiranda/crm\ capsul/capsul-brasil-crm
node scripts/test-amazon-ses.js

# Teste com email real (substituir pelo seu)
node scripts/test-amazon-ses.js seuemail@gmail.com
```

---

## 📊 DEPOIS DE SAIR DO SANDBOX

### ✅ **Vantagens:**
- 🎯 **50.000+ emails/dia** (quota inicial)
- 🚀 **14+ emails/segundo** (taxa inicial)
- 📧 **Qualquer email** pode receber
- 📈 **Quotas aumentam** automaticamente
- 💰 **$0.10 por 1.000** emails

### 🛡️ **Responsabilidades:**
- 📊 **Bounce rate < 5%**
- 📊 **Complaint rate < 0.1%**
- 📧 **Monitoring obrigatório**
- 🔍 **Reputation dashboard**

---

## 🚨 AÇÕES IMEDIATAS

### ✅ **Pode fazer AGORA:**
1. ✅ Criar usuário IAM
2. ✅ Gerar credenciais SMTP
3. ✅ Verificar email pessoal para teste
4. ✅ Preencher formulário de produção
5. ✅ Testar em sandbox com email verificado

### ⏳ **Depois da aprovação:**
1. Configurar credenciais reais
2. Testar envio em produção
3. Executar campanha completa
4. Monitorar métricas

---

## 🧪 TESTE IMEDIATO EM SANDBOX

Enquanto aguarda aprovação, pode testar:

```bash
# 1. Configure suas credenciais REAIS (mesmo em sandbox)
# 2. Adicione seu email pessoal como verificado
# 3. Teste o envio
node scripts/test-amazon-ses.js seuemail@gmail.com
```

**⚠️ EM SANDBOX**: Só enviará para emails verificados no SES Console.

---

## 📞 Se tiver problemas

**Formulário rejeitado?**
- Seja mais específico no use case
- Adicione informações da empresa
- Mencione compliance (LGPD, opt-in)

**Demora na aprovação?**
- Normal até 48h
- AWS pode pedir mais informações
- Responda rapidamente aos emails

**Quota muito baixa?**
- Inicie com quota padrão
- AWS aumenta automaticamente baseado no uso
- Pode solicitar aumento manual depois

🎯 **OBJETIVO**: Ter produção funcionando em 24-48h!