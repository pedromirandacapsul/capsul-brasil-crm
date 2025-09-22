# 📦 Guia de Migração - Capsul Brasil CRM

## 🎯 Como Migrar para Nova Máquina

### ✅ **Método Recomendado: Setup Automático**

1. **Copie toda a pasta do projeto** para a nova máquina
2. **Execute o script de setup:**

   **Windows:**
   ```cmd
   setup-new-machine.bat
   ```

   **Linux/Mac:**
   ```bash
   chmod +x setup-new-machine.sh
   ./setup-new-machine.sh
   ```

3. **Inicie o projeto:**
   ```bash
   pnpm dev
   ```

### 🔧 **Método Manual**

**Pré-requisitos na nova máquina:**
- Node.js 18+
- pnpm (`npm install -g pnpm`)

**Passos:**

1. **Instalar dependências:**
   ```bash
   pnpm install
   ```

2. **Configurar ambiente:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configurar banco de dados:**
   ```bash
   DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
   DATABASE_URL="file:./dev.db" npx prisma db seed
   ```

4. **Iniciar desenvolvimento:**
   ```bash
   DATABASE_URL="file:./dev.db" pnpm dev
   ```

## 📁 **Arquivos que DEVEM ser copiados:**

```
✅ src/                    # Código fonte completo
✅ prisma/                 # Schema e migrations
✅ public/                 # Assets estáticos
✅ package.json           # Dependências
✅ .env.example           # Template ambiente
✅ next.config.js         # Configurações Next.js
✅ tailwind.config.ts     # Configurações Tailwind
✅ tsconfig.json          # Configurações TypeScript
✅ components.json        # Configurações shadcn/ui
✅ README.md              # Documentação
✅ setup-new-machine.*    # Scripts de setup
```

## 🚫 **Arquivos que NÃO devem ser copiados:**

```
❌ node_modules/          # Reinstalar com pnpm install
❌ .next/                 # Cache Next.js - regenerado
❌ .env.local             # Ambiente específico da máquina
❌ dev.db                 # Banco SQLite - recriar novo
❌ dev.db-journal         # Journal SQLite
❌ .git/                  # Histórico Git (se não for repo)
```

## 🔐 **Configurações Específicas por Ambiente**

### **Desenvolvimento Local (Padrão)**
```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
```

### **Servidor de Staging**
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_URL="https://staging.seudominio.com"
```

### **Produção**
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_URL="https://app.seudominio.com"
NEXTAUTH_SECRET="chave-super-secreta-production"
```

## 🧪 **Testando a Migração**

Após o setup, teste se tudo está funcionando:

1. **Acesse:** http://localhost:3000
2. **Login de teste:**
   - Admin: `admin@capsul.com.br` / `admin123`
   - Manager: `manager@capsul.com.br` / `manager123`
   - Sales: `sales@capsul.com.br` / `sales123`

3. **Teste as funcionalidades:**
   - ✅ Kanban drag & drop
   - ✅ Botões WhatsApp nos leads
   - ✅ Menu Tarefas
   - ✅ Menu Analytics
   - ✅ Criação de leads

## 🐛 **Solução de Problemas Comuns**

### **Erro: "users.map is not a function"**
```bash
# Limpe o cache Next.js
rm -rf .next
pnpm dev
```

### **Erro: "Prisma Client não encontrado"**
```bash
# Regenere o Prisma Client
npx prisma generate
```

### **Erro: "Port 3000 in use"**
```bash
# Mate processos na porta
npx kill-port 3000
# ou mude a porta no package.json
```

### **Banco não funciona**
```bash
# Recrie o banco do zero
rm dev.db
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
DATABASE_URL="file:./dev.db" npx prisma db seed
```

## 🚀 **Deploy em Produção**

Para produção, considere usar:
- **Banco**: PostgreSQL ou MySQL
- **Host**: Vercel, Railway, ou DigitalOcean
- **Variáveis**: Configure todas as env vars necessárias

---

📞 **Suporte**: Se encontrar problemas, verifique os logs de erro e consulte a documentação do Next.js + Prisma.