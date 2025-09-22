# 🚀 Guia Passo a Passo - Automação WhatsApp

## 📋 Pré-requisitos
- ✅ Sistema rodando em `http://localhost:3000`
- ✅ WhatsApp conectado via QR Code
- ✅ Acesso ao admin com login feito

---

## 🎯 **PASSO 1: CONECTAR O WHATSAPP**

### 1.1 Acessar o Admin WhatsApp
1. Abra o navegador e vá para: `http://localhost:3000/admin`
2. Faça login com suas credenciais
3. No menu lateral, clique em **"WhatsApp"**

### 1.2 Conectar sua Conta WhatsApp
1. Na página do WhatsApp, clique na aba **"Nova Conexão"**
2. Digite o número: `37991737234` (ou seu número de teste)
3. Selecione **"WhatsApp Web (QR Code)"**
4. Clique em **"Conectar WhatsApp"**
5. **Escaneie o QR Code** com seu celular:
   - Abra WhatsApp no celular
   - Menu (⋮) → "Aparelhos conectados"
   - "Conectar um aparelho" → Escaneie o código

### 1.3 Verificar Conexão
- Aguarde até o status mudar para **"CONECTADO"** (verde)
- Você verá a conta na aba "Contas Conectadas"

---

## 📝 **PASSO 2: CRIAR TEMPLATES DE MENSAGEM**

### 2.1 Acessar Templates
1. Na página WhatsApp Admin, clique na aba **"Automação"**
2. Clique no card **"Templates"**
3. Ou acesse direto: `http://localhost:3000/whatsapp/automacao/templates`

### 2.2 Criar Template de Boas-vindas
1. Clique em **"Novo Template"**
2. Preencha os dados:
   ```
   Nome: template_boas_vindas
   Categoria: PERSONAL
   Tipo de Cabeçalho: TEXT
   Conteúdo do Cabeçalho: 🎉 Bem-vindo!

   Conteúdo da Mensagem:
   Olá {1}! 👋

   Seja muito bem-vindo(a) ao nosso sistema!

   Estamos felizes em tê-lo(a) conosco. Em breve entraremos em contato com mais informações sobre nossos produtos e serviços.

   Se tiver alguma dúvida, estarei aqui para ajudar!

   Texto do Rodapé: Equipe de Atendimento

   Variáveis (JSON):
   [{"name": "nome", "example": "João"}]
   ```
3. Clique em **"Criar Template"**

### 2.3 Criar Template de Follow-up
1. Clique em **"Novo Template"** novamente
2. Preencha:
   ```
   Nome: template_follow_up
   Categoria: BUSINESS
   Tipo de Cabeçalho: TEXT
   Conteúdo do Cabeçalho: 💼 Oportunidade Especial

   Conteúdo da Mensagem:
   Olá {1}!

   Vi que você tem interesse em nossos serviços.

   Temos uma oportunidade especial que pode ser perfeita para você:

   🔥 {2}% de desconto em nosso pacote premium
   ⏰ Oferta válida até {3}

   Gostaria de saber mais detalhes?

   Texto do Rodapé: Não perca essa chance!

   Variáveis (JSON):
   [
     {"name": "nome", "example": "Maria"},
     {"name": "desconto", "example": "30"},
     {"name": "data_limite", "example": "31/12/2024"}
   ]
   ```
3. Clique em **"Criar Template"**

---

## 🔄 **PASSO 3: CRIAR FLUXO DE AUTOMAÇÃO**

### 3.1 Acessar Fluxos
1. Na automação, clique em **"Fluxos"**
2. Ou acesse: `http://localhost:3000/whatsapp/automacao/flows`
3. Clique em **"Novo Fluxo"**

### 3.2 Configurar Fluxo de Boas-vindas
1. **Informações Básicas:**
   ```
   Nome: Fluxo Boas-vindas Automático
   Descrição: Sequência automática para novos leads
   Tipo de Trigger: NEW_CONTACT (Novo contato)
   ```

2. **Adicionar Passos:**

   **Passo 1 - Mensagem Imediata:**
   - Tipo: Mensagem
   - Template: template_boas_vindas
   - Variáveis: nome = "{{contact.name}}"
   - Delay: 0 minutos

   **Passo 2 - Follow-up:**
   - Tipo: Mensagem
   - Template: template_follow_up
   - Variáveis:
     - nome = "{{contact.name}}"
     - desconto = "30"
     - data_limite = "31/12/2024"
   - Delay: 1440 minutos (24 horas)

3. Clique em **"Salvar Fluxo"**
4. **IMPORTANTE:** Mantenha **INATIVO** por enquanto para testar

---

## 🎯 **PASSO 4: CONFIGURAR CAMPANHA DE TESTE**

### 4.1 Acessar Campanhas
1. Clique em **"Campanhas"**
2. Ou acesse: `http://localhost:3000/whatsapp/automacao/campaigns`
3. Clique em **"Nova Campanha"**

### 4.2 Criar Campanha de Teste
1. **Configuração da Campanha:**
   ```
   Nome: Teste Automação - Primeiro Envio
   Descrição: Campanha de teste para validar sistema

   Template: template_boas_vindas

   Tipo de Público: MANUAL
   Lista de Números:
   37991737234 (seu número de teste)

   Agendamento: IMMEDIATE (Imediato)
   ```

2. **IMPORTANTE:** Marque como **INATIVA** inicialmente
3. Clique em **"Criar Campanha"**

---

## 🧪 **PASSO 5: EXECUTAR TESTE CONTROLADO**

### 5.1 Teste de Template Individual
1. Vá para **Templates**
2. Encontre o "template_boas_vindas"
3. Clique nos três pontos (⋮) → **"Visualizar"**
4. Verifique se o preview está correto
5. Teste as variáveis

### 5.2 Teste de Campanha
1. Vá para **Campanhas**
2. Encontre sua campanha de teste
3. Clique em **"Ativar"** (botão play ▶️)
4. **Confirme** que deseja ativar
5. **Monitore** na dashboard se a mensagem foi enviada

### 5.3 Verificar Envio
1. Verifique seu WhatsApp no celular
2. Deve receber a mensagem de boas-vindas
3. Na interface admin, vá para **"Inbox"**
4. Verifique se a conversa apareceu

---

## 🚀 **PASSO 6: ATIVAR AUTOMAÇÃO COMPLETA**

### 6.1 Ativar Fluxo Automático
1. Vá para **"Fluxos"**
2. Encontre "Fluxo Boas-vindas Automático"
3. Clique no botão **"Ativar"** (muda de "Pausar" para "Ativar")
4. **Confirme** a ativação

### 6.2 Configurar Leads/Contatos
1. Adicione contatos na base de dados ou
2. Configure webhook para novos leads ou
3. Importe lista de contatos

### 6.3 Monitorar Execução
1. **Dashboard Principal:** `http://localhost:3000/whatsapp/automacao`
2. Monitore:
   - Fluxos ativos
   - Execuções realizadas
   - Mensagens enviadas
   - Campanhas rodando

---

## 📊 **PASSO 7: CRIAR CAMPANHA PARA LEADS**

### 7.1 Campanha para Base de Leads
1. Vá para **"Campanhas"** → **"Nova Campanha"**
2. Configure:
   ```
   Nome: Campanha Follow-up Leads
   Template: template_follow_up

   Público:
   - MANUAL: Cole lista de números
   - Ou SEGMENTED: Configure filtros

   Números exemplo:
   37991737234
   5511999999999
   5511888888888

   Agendamento:
   - IMMEDIATE para teste
   - SCHEDULED para produção
   ```

### 7.2 Executar Campanha
1. **Revise** todos os dados
2. **Teste** com poucos números primeiro
3. Clique em **"Ativar Campanha"**
4. **Monitore** o progresso em tempo real

---

## 🔍 **PASSO 8: MONITORAMENTO E CONTROLE**

### 8.1 Dashboard de Controle
Acesse: `http://localhost:3000/whatsapp/automacao`

**Monitore:**
- ✅ Fluxos Ativos: Quantos fluxos estão rodando
- ✅ Execuções: Quantas automações foram disparadas
- ✅ Campanhas: Status das campanhas ativas
- ✅ Mensagens: Total de mensagens enviadas

### 8.2 Inbox em Tempo Real
Acesse: `http://localhost:3000/admin/whatsapp` → Aba "Inbox"

**Verifique:**
- Conversas iniciadas automaticamente
- Respostas dos clientes
- Status de entrega das mensagens

### 8.3 Relatórios de Fluxo
Acesse: `http://localhost:3000/whatsapp/automacao/flows/[id]/view`

**Analise:**
- Taxa de execução
- Pontos de parada
- Efetividade do fluxo

---

## ⚠️ **DICAS IMPORTANTES DE SEGURANÇA**

### ❌ **NÃO FAÇA:**
- Não ative fluxos em produção sem testar
- Não envie para bases grandes sem validar
- Não use o mesmo número para muitos testes
- Não ative múltiplas campanhas simultâneas sem controle

### ✅ **SEMPRE FAÇA:**
- Teste com números pequenos primeiro
- Verifique templates antes de usar
- Monitore as execuções em tempo real
- Tenha backup dos dados importantes
- Use delay entre mensagens para evitar spam

---

## 🆘 **RESOLUÇÃO DE PROBLEMAS**

### Problema: Mensagens não enviando
**Solução:**
1. Verifique se WhatsApp está conectado (status "CONECTADO")
2. Confirme se o fluxo/campanha está ativo
3. Veja logs no console do navegador
4. Reconecte o WhatsApp se necessário

### Problema: Templates não funcionando
**Solução:**
1. Verifique sintaxe das variáveis `{1}`, `{2}`
2. Confirme JSON das variáveis
3. Teste preview antes de usar

### Problema: Fluxo não dispara
**Solução:**
1. Confirme trigger configurado corretamente
2. Verifique se fluxo está ativo
3. Teste com novo contato manualmente

---

## 🎉 **RESULTADO FINAL**

Após seguir todos os passos, você terá:

✅ **Sistema totalmente configurado**
✅ **Templates personalizados criados**
✅ **Fluxos automáticos funcionando**
✅ **Campanhas executando com sucesso**
✅ **Monitoramento em tempo real**
✅ **Mensagens sendo enviadas automaticamente**

---

## 📞 **EXEMPLO PRÁTICO - FLUXO COMPLETO**

**Cenário:** Novo lead entra no sistema

1. **Trigger:** Sistema detecta novo contato
2. **Ação 1:** Envia mensagem de boas-vindas (imediato)
3. **Ação 2:** Aguarda 24 horas
4. **Ação 3:** Envia follow-up com oferta
5. **Monitoramento:** Admin acompanha no dashboard
6. **Resposta:** Cliente responde no WhatsApp
7. **Atendimento:** Equipe vê no Inbox e responde

**🚀 Sistema totalmente automatizado e funcionando!**

---

*Data de criação: ${new Date().toLocaleDateString('pt-BR')}*
*Sistema: WhatsApp Automation v1.0*