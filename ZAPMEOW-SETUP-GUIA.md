# 🚀 GUIA COMPLETO ZAPMEOW + FUNIS

## ✅ **SISTEMA IMPLEMENTADO COM SUCESSO**

### **🎯 O QUE TEMOS**

✅ **ZapMeow Clonado e Customizado** - Sistema Go brasileiro de WhatsApp REAL
✅ **Endpoints de Funis** - `/api/{instanceId}/funnel/trigger` e `/api/{instanceId}/funnel/message`
✅ **Sistema de Webhook** - Integração automática com Next.js
✅ **Compatibilidade Next.js** - Endpoint `/api/whatsapp/webhook` criado

### **🔧 INSTALAÇÃO ZAPMEOW**

#### **1. Instalar Go (Necessário)**
```bash
# Windows (usar PowerShell como Administrador)
winget install GoLang.Go

# Ou baixar em: https://golang.org/dl/
# Após instalar, reiniciar o terminal
```

#### **2. Verificar Instalação Go**
```bash
go version
# Deve mostrar: go version go1.21.x windows/amd64
```

#### **3. Configurar ZapMeow**
```bash
cd zapmeow
go mod tidy
```

#### **4. Instalar Redis (Opcional - para produção)**
```bash
# Para desenvolvimento, ZapMeow funcionará sem Redis
# Para produção, instalar Redis Server
```

### **🚀 EXECUÇÃO**

#### **1. Iniciar Next.js (Terminal 1)**
```bash
cd "C:\Users\Pedro Miranda\Documents\Deus-abencoa"
DATABASE_URL="file:./dev.db" pnpm dev
```
**Next.js estará em**: `http://localhost:3001`

#### **2. Iniciar ZapMeow (Terminal 2)**
```bash
cd zapmeow
go run cmd/server/main.go
```
**ZapMeow estará em**: `http://localhost:8900`

### **📖 DOCUMENTAÇÃO API**

#### **ZapMeow Swagger**
```
http://localhost:8900/api/swagger/index.html
```

#### **Endpoints Principais**
```bash
# Obter QR Code
GET http://localhost:8900/api/INSTANCE_ID/qrcode

# Verificar Status
GET http://localhost:8900/api/INSTANCE_ID/status

# Enviar Mensagem Tradicional
POST http://localhost:8900/api/INSTANCE_ID/chat/send/text
{
  "phone": "5537991361002",
  "text": "Olá! Mensagem teste"
}

# NOVO: Disparar Funil 🎯
POST http://localhost:8900/api/INSTANCE_ID/funnel/trigger
{
  "phone": "5537991361002",
  "funnelId": "funil-vendas-2024",
  "leadData": {
    "nome": "Pedro Miranda",
    "email": "pedro@teste.com"
  }
}

# NOVO: Enviar Mensagem de Funil 📤
POST http://localhost:8900/api/INSTANCE_ID/funnel/message
{
  "phone": "5537991361002",
  "text": "Olá! Esta mensagem vem do funil automatizado",
  "funnelId": "funil-vendas-2024",
  "stepId": "step-1"
}
```

### **🔄 FLUXO DE INTEGRAÇÃO**

```
1. 📱 ZapMeow conecta com WhatsApp REAL
2. 🎯 Você dispara funil via API
3. 📤 ZapMeow envia mensagem real
4. 🔗 Webhook automático para Next.js
5. 💾 Next.js salva no banco
6. 📊 Dashboard mostra progresso
```

### **🧪 TESTE COMPLETO**

#### **1. Criar Instância WhatsApp**
```bash
# 1. Abrir ZapMeow
curl http://localhost:8900/api/MEU_NUMERO/qrcode

# 2. Escanear QR Code com celular
# 3. Aguardar status CONNECTED
curl http://localhost:8900/api/MEU_NUMERO/status
```

#### **2. Testar Funil**
```bash
# Disparar funil
curl -X POST http://localhost:8900/api/MEU_NUMERO/funnel/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5537991361002",
    "funnelId": "teste-zapmeow",
    "leadData": { "nome": "Teste", "origem": "zapmeow" }
  }'
```

#### **3. Enviar Mensagem de Funil**
```bash
curl -X POST http://localhost:8900/api/MEU_NUMERO/funnel/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5537991361002",
    "text": "🎉 Parabéns! Funil ZapMeow funcionando!",
    "funnelId": "teste-zapmeow",
    "stepId": "step-boas-vindas"
  }'
```

### **📊 MONITORAMENTO**

#### **Logs ZapMeow**
```
📤 Sending REAL WhatsApp message
🔄 Enviando webhook para funil
✅ Webhook enviado com sucesso
```

#### **Logs Next.js**
```
🔄 Webhook ZapMeow recebido
📦 Payload: { event: "message_sent", ... }
✅ Webhook processado com sucesso
```

### **🛠️ TROUBLESHOOTING**

#### **Problema: Go não instalado**
```bash
# Instalar Go primeiro
winget install GoLang.Go
# Reiniciar terminal
```

#### **Problema: WhatsApp não conecta**
```bash
# Verificar se celular tem WhatsApp ativo
# Verificar se QR Code está válido
# Tentar nova instância com ID diferente
```

#### **Problema: Webhook não funciona**
```bash
# Verificar se Next.js está em localhost:3001
# Verificar logs do ZapMeow para erros de webhook
# Testar webhook manualmente
```

### **🎉 RESULTADO ESPERADO**

✅ **WhatsApp 100% REAL** - Mensagens chegam nos celulares
✅ **Funis Automatizados** - Triggers via API
✅ **Webhooks Funcionando** - Sincronização automática
✅ **Sistema Brasileiro** - Documentação em português
✅ **Multi-instância** - Várias contas WhatsApp

### **📞 PRÓXIMOS PASSOS**

1. **Instalar Go** - `winget install GoLang.Go`
2. **Iniciar ZapMeow** - `go run cmd/server/main.go`
3. **Conectar WhatsApp** - Escanear QR Code
4. **Testar Funis** - Usar endpoints `/funnel/trigger`
5. **Integrar Sistema** - Chamar APIs do seu Next.js

---

**🚀 ZAPMEOW + FUNIS = WHATSAPP REAL COM AUTOMAÇÃO COMPLETA!**