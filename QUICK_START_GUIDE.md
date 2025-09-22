# 🚀 Guia Rápido de Inicialização - CRM Capsul Brasil

## 📁 **Localização do Projeto**
```
C:\Users\Pedro Miranda\Documents\Deus-abencoa\
```

---

## ⚡ **Comandos de Inicialização Rápida**

### **1. Navegue para o diretório do projeto**
```bash
cd "C:\Users\Pedro Miranda\Documents\Deus-abencoa"
```

### **2. Inicie o servidor de desenvolvimento (Principal)**
```bash
DATABASE_URL="file:./dev.db" npm run dev
```
**🌐 Servidor disponível em**: `http://localhost:3003` (ou próxima porta disponível)

### **3. Inicie o Prisma Studio (Opcional - Para visualizar banco)**
```bash
DATABASE_URL="file:./dev.db" npx prisma studio --port 5555
```
**🗄️ Prisma Studio disponível em**: `http://localhost:5555`

---

## 🔧 **Comandos Úteis para Desenvolvimento**

### **Banco de Dados**
```bash
# Atualizar schema do banco
DATABASE_URL="file:./dev.db" npx prisma db push

# Gerar cliente Prisma
DATABASE_URL="file:./dev.db" npx prisma generate

# Visualizar banco de dados
DATABASE_URL="file:./dev.db" npx prisma studio --port 5555
```

### **Dependências**
```bash
# Instalar dependências
npm install

# ou com pnpm (se preferir)
pnpm install
```

### **Build e Produção**
```bash
# Build do projeto
npm run build

# Iniciar em produção
npm start
```

---

## 🌐 **URLs Principais do Sistema**

| Página | URL | Descrição |
|--------|-----|-----------|
| **Dashboard** | `http://localhost:3003/admin` | Página principal do admin |
| **Tarefas Enhanced** | `http://localhost:3003/admin/tasks` | Sistema completo de tarefas |
| **Leads** | `http://localhost:3003/admin/leads` | Gestão de leads |
| **Kanban Leads** | `http://localhost:3003/admin/leads/kanban` | Visão Kanban de leads |
| **Pipeline** | `http://localhost:3003/admin/pipeline` | Pipeline de vendas |
| **Nova Tarefa** | `http://localhost:3003/admin/tasks/new` | Criar nova tarefa |
| **Prisma Studio** | `http://localhost:5555` | Interface do banco de dados |

---

## 👤 **Credenciais de Acesso**

### **Usuário Administrador**
- **Email**: `admin@capsul.com.br`
- **Senha**: `admin123`
- **Role**: `ADMIN`

### **URL de Login**
```
http://localhost:3003/auth/signin
```

---

## 📋 **Checklist de Inicialização**

### ✅ **Pré-requisitos Verificados**
- [x] Node.js instalado
- [x] npm/pnpm disponível
- [x] Projeto clonado em `C:\Users\Pedro Miranda\Documents\Deus-abencoa\`
- [x] Banco SQLite `dev.db` configurado
- [x] Dependências instaladas

### ✅ **Serviços Iniciados**
- [x] Servidor Next.js rodando
- [x] Banco de dados SQLite conectado
- [x] Prisma Studio (opcional)

### ✅ **Sistema Funcional**
- [x] Login funcionando
- [x] Dashboard carregando
- [x] Tarefas Enhanced operacional
- [x] Kanban funcionando
- [x] Filtros e analytics ativos

---

## 🐛 **Resolução de Problemas Comuns**

### **Erro: Port 3000 in use**
```bash
# O sistema automaticamente usa a próxima porta disponível
# Exemplo: 3001, 3002, 3003, etc.
# Verifique a mensagem no terminal para ver a porta usada
```

### **Erro: Database não encontrado**
```bash
# Recriar o banco se necessário
DATABASE_URL="file:./dev.db" npx prisma db push
```

### **Erro: Missing dependencies**
```bash
# Reinstalar dependências
rm -rf node_modules
npm install
```

### **Erro: Prisma Client out of sync**
```bash
# Regenerar cliente Prisma
DATABASE_URL="file:./dev.db" npx prisma generate
```

---

## 📊 **Status dos Serviços**

### **Verificar se está funcionando:**
1. **✅ Next.js Server**: Acesse `http://localhost:3003/admin`
2. **✅ Database**: Login deve funcionar com credenciais admin
3. **✅ Tarefas**: Página `/admin/tasks` deve carregar com analytics
4. **✅ Kanban**: Toggle entre Tabela/Kanban deve funcionar

---

## 🔄 **Comandos de Background (Paralelos)**

Se quiser rodar múltiplos serviços simultaneamente:

```bash
# Terminal 1: Servidor principal
DATABASE_URL="file:./dev.db" npm run dev

# Terminal 2: Prisma Studio
DATABASE_URL="file:./dev.db" npx prisma studio --port 5555
```

---

## 💾 **Backup Rápido**

### **Fazer backup do banco**
```bash
cp dev.db dev_backup_$(date +%Y%m%d_%H%M%S).db
```

### **Restaurar backup**
```bash
cp dev_backup_YYYYMMDD_HHMMSS.db dev.db
```

---

## 🎯 **Funcionalidades Principais Testadas**

### **Sistema de Tarefas Enhanced**
- ✅ Analytics em tempo real
- ✅ Filtros avançados
- ✅ Visualização Kanban
- ✅ Categorização visual
- ✅ Alertas proativos
- ✅ Drag & drop
- ✅ Integração com leads
- ✅ **Export inteligente filtrado** (aplica filtros ativos)
- ✅ **Relatório por prioridade** (analytics avançados)
- ✅ **Sistema de subtarefas/checklist** (organização detalhada)

### **Performance**
- ✅ Carregamento < 3s
- ✅ Animações suaves
- ✅ Responsividade mobile
- ✅ Estado persistente

---

## 📝 **Notas de Desenvolvimento**

### **Estrutura do Projeto**
```
src/
├── app/
│   ├── admin/tasks/          # Páginas de tarefas
│   └── api/tasks/           # APIs de tarefas
├── components/
│   ├── tasks/               # Componentes de tarefas
│   └── ui/                  # Componentes base
├── lib/
│   └── task-categories.ts   # Configurações de categoria
└── prisma/
    └── schema.prisma        # Schema do banco
```

### **Tecnologias Principais**
- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Drag & Drop**: React Beautiful DnD
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js

---

## 🎉 **Início Rápido - Comando Único**

Para iniciar tudo de uma vez:

```bash
cd "C:\Users\Pedro Miranda\Documents\Deus-abencoa" && DATABASE_URL="file:./dev.db" npm run dev
```

**🌐 Acesse**: `http://localhost:3003/admin/tasks` para ver o sistema completo funcionando!

---

## 📞 **Informações de Contato/Debug**

### **Logs Importantes**
- **Console do navegador**: Para erros de frontend
- **Terminal**: Para erros de backend
- **Network tab**: Para problemas de API

### **Arquivos de Log**
- **Next.js logs**: Terminal onde rodou `npm run dev`
- **Database logs**: Prisma queries no terminal

---

**⚡ Sistema pronto para desenvolvimento e demonstração!**

---

*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*
*Servidor testado em: Windows 11*
*Portas padrão: 3000 (Next.js), 5555 (Prisma Studio)*