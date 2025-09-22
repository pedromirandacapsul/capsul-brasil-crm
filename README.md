# Capsul Brasil - Local-First CRM

Sistema completo de CRM com foco em desenvolvimento local-first, permitindo que qualquer desenvolvedor suba a aplicação completa em sua máquina local usando apenas SQLite + Node.js.

✨ **Versão atual com Dashboard Avançado, Gráficos Interativos e Kanban Board!**

## 🚀 Quick Start

### Opção 1: Setup Automático (Recomendado)
```bash
# Windows
./setup-new-machine.bat

# Linux/Mac
chmod +x setup-new-machine.sh
./setup-new-machine.sh
```

### Opção 2: Setup Manual
```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar ambiente
cp .env.example .env.local

# 3. Configurar banco de dados
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
DATABASE_URL="file:./dev.db" npx prisma db seed

# 4. Iniciar desenvolvimento
DATABASE_URL="file:./dev.db" pnpm dev
```

**Pronto!** Acesse:
- **App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Gestão de Leads**: http://localhost:3000/admin/leads
- **Kanban Pipeline**: http://localhost:3000/admin/kanban

## 📋 Pré-requisitos

- **Node.js** LTS (18+)
- **pnpm** (`npm install -g pnpm`)
- **Docker Desktop** ou Docker Engine

## 👤 Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | `admin@capsul.com.br` | `admin123` |
| Gestor | `manager@capsul.com.br` | `manager123` |
| Vendas | `sales@capsul.com.br` | `sales123` |

## 🏗️ Stack Tecnológica

- **Frontend**: Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend**: Next.js API Routes + Prisma + SQLite (dev)
- **Auth**: NextAuth.js com RBAC (Admin/Manager/Sales)
- **UI**: Framer Motion + Recharts + React Beautiful DND
- **Componentes**: shadcn/ui + Lucide Icons + CMDK
- **Analytics**: Dashboard interativo com gráficos e métricas animadas
- **Database**: SQLite local-first para desenvolvimento

## 📁 Estrutura do Projeto

```
capsul-brasil/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── admin/
│   │   │   ├── leads/page.tsx   # 📊 Dashboard Enhanced (PRINCIPAL)
│   │   │   └── kanban/page.tsx  # 🎯 Kanban Board
│   │   └── api/                 # API Routes
│   ├── components/
│   │   ├── dashboard/           # 📈 Componentes de Dashboard
│   │   │   ├── animated-metric-card.tsx
│   │   │   ├── animated-chart-container.tsx
│   │   │   └── animated-dashboard-container.tsx
│   │   ├── kanban/
│   │   │   └── kanban-board.tsx # 🎯 Board Kanban
│   │   ├── forms/               # 🔧 Modais Enhanced
│   │   │   ├── enhanced-disqualify-lead-modal.tsx
│   │   │   ├── enhanced-schedule-followup-modal.tsx
│   │   │   └── enhanced-send-to-kanban-modal.tsx
│   │   ├── leads/
│   │   │   └── tag-selector.tsx # 🏷️ Sistema de Tags
│   │   └── ui/                  # 🎨 Componentes Base
│   │       └── tag.tsx
│   ├── lib/                     # Utilitários e configurações
│   └── types/                   # Tipos TypeScript
├── prisma/                      # Schema e migrations
├── scripts/                     # Scripts de automação
├── docs/                        # Documentação
└── package.json                 # Dependências
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                     # Inicia o servidor de desenvolvimento
pnpm build                   # Build de produção
pnpm start                   # Inicia servidor de produção

# Database
pnpm db:migrate              # Executa migrations
pnpm db:seed                 # Popula dados iniciais
pnpm db:studio               # Abre Prisma Studio
pnpm db:reset                # Reset completo do DB

# Docker
pnpm compose:up              # Sobe containers
pnpm compose:down            # Para containers
pnpm compose:logs            # Visualiza logs

# Qualidade
pnpm lint                    # ESLint
pnpm test                    # Testes unitários
pnpm e2e                     # Testes end-to-end
```

## 🎯 Funcionalidades

### 🌐 Landing Page
- Formulário de captação com validação
- Anti-spam (honeypot + Turnstile mock)
- Captura de UTMs e referrer
- Consentimento LGPD

### 🔐 Admin/CRM Avançado
- **Dashboard Interativo** com métricas animadas em tempo real
- **Gestão de Leads Completa** - http://localhost:3000/admin/leads
  - 📊 Métricas clickáveis com filtros dinâmicos
  - 📈 Gráficos interativos (Performance Mensal, Fontes de Leads)
  - 🎯 Funil de conversão visual animado
  - ⏱️ Métricas de tempo (primeiro contato, conversão)
  - 🔄 Alternância Table/Kanban no mesmo local
  - 🏷️ Sistema de tags categorizadas
  - ⚡ Animações fluidas com Framer Motion

### 📋 Kanban Board Avançado
- **Pipeline Visual** - http://localhost:3000/admin/kanban
  - Drag-and-drop entre colunas
  - Cards detalhados com informações completas
  - Estatísticas por estágio
  - Atualização em tempo real

### 📊 Analytics & BI
- **Gráficos Interativos** com Recharts
  - LineChart: Performance mensal (leads captados vs convertidos)
  - BarChart: Fontes de leads com taxa de conversão
  - Funil de conversão animado
- **Métricas de Tempo** em tempo real
- **Dashboard responsivo** com animações

### 🤖 WhatsApp Integration
- Sistema completo de automação
- Flows visuais com editor
- Templates de mensagem
- Campanhas em massa
- TTS (Text-to-Speech)

### 🎨 Componentes Avançados
- **Modais Enhanced**: Desqualificação, Follow-up, Movimentação
- **AnimatedMetricCard**: Cards com animações e interação
- **AnimatedChartContainer**: Containers para gráficos
- **TagSelector**: Sistema de tags com cores
- **KanbanBoard**: Board completo drag-and-drop

## 🚀 Funcionalidades Mais Recentes

### 📊 Dashboard Enhanced de Leads
A nova página principal de leads (`/admin/leads`) agora inclui:

#### Métricas Interativas
- **7 Cards de Métricas** clickáveis com animações
- Filtros dinâmicos por categoria (Total, Novos, Qualificados, etc.)
- Indicadores visuais de tendência (+12, -5, etc.)
- Estados ativos/inativos com feedback visual

#### Gráficos Avançados
- **Performance Mensal**: LineChart com 3 linhas (Leads, Convertidos, Taxa %)
- **Fontes de Leads**: BarChart comparando captação vs conversão
- **Funil de Conversão**: Visualização em etapas animadas
- **Métricas de Tempo**: Primeiro contato, conversão, taxa de resposta

#### Interface Moderna
- **Alternância Table/Kanban**: Botões para trocar visualização
- **Filtros Inteligentes**: Busca + Status + Filtros por card
- **Animações Fluidas**: Framer Motion em todos os elementos
- **Design Responsivo**: Funciona em todas as telas

### 🎯 Kanban Board Standalone
Página dedicada (`/admin/kanban`) com:
- **5 Colunas**: Novos → Contatados → Qualificados → Proposta → Convertidos
- **Cards Detalhados**: Informações completas de cada lead
- **Estatísticas**: Contadores por estágio
- **Drag & Drop**: Movimentação entre colunas (em desenvolvimento)

### 🏷️ Sistema de Tags Avançado
- **Tags Categorizadas** com cores personalizadas
- **Interface Visual** para seleção e gestão
- **Integração Completa** em leads e kanban
- **Componente Reutilizável** `<Tag />` com variações

## 📚 Documentação Completa

Para setup detalhado e troubleshooting, veja: **[docs/SetupLocal.md](docs/SetupLocal.md)**

## 🔧 Troubleshooting Rápido

**Portas ocupadas?**
```bash
# Verifique quais portas estão em uso
netstat -an | findstr ":5432\|:6379\|:3000\|:8025\|:3001"

# Ou altere as portas no docker-compose.yml
```

**Docker não sobe?**
```bash
# Verifique se o Docker está rodando
docker info

# Reset completo
docker compose down -v
docker compose up -d
```

**Database com erro?**
```bash
# Reset e recriar
pnpm db:reset
pnpm prisma migrate dev
pnpm prisma db seed
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 🎨 Screenshots & Demonstração

### 📊 Dashboard de Leads Enhanced
- **Métricas Animadas**: 7 cards interativos com filtros
- **Gráficos Interativos**: Performance mensal e fontes de leads
- **Funil Visual**: Conversão em etapas animadas
- **Tabela/Kanban**: Alternância no mesmo local

### 🎯 Kanban Pipeline
- **5 Estágios**: Novos → Contatados → Qualificados → Proposta → Convertidos
- **Cards Detalhados**: Informações completas dos leads
- **Estatísticas**: Contadores dinâmicos por coluna

### 🏷️ Sistema de Tags
- **Cores Personalizadas**: Tags categorizadas
- **Interface Visual**: Seleção e gestão intuitiva
- **Integração Total**: Em todas as telas de leads

## 🔧 Para Desenvolvedores

### Componentes Criados
```typescript
// Métricas animadas
<AnimatedMetricCard
  title="Total de Leads"
  value={120}
  icon={Users}
  color="blue"
  onClick={handleFilter}
  trend={{ value: 12, label: "este mês" }}
/>

// Gráficos
<AnimatedChartContainer title="Performance">
  <ResponsiveContainer>
    <LineChart data={chartData}>
      {/* Recharts components */}
    </LineChart>
  </ResponsiveContainer>
</AnimatedChartContainer>

// Tags
<Tag color="#8b5cf6" size="sm">Lead Qualificado</Tag>

// Kanban
<KanbanBoard leads={leads} onLeadUpdate={handleUpdate} />
```

### Dependências Principais
```json
{
  "dependencies": {
    "framer-motion": "^10.16.16",
    "recharts": "^3.2.1",
    "react-beautiful-dnd": "^13.1.1",
    "cmdk": "^1.1.1",
    "@radix-ui/react-popover": "^1.1.15"
  }
}
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Capsul Brasil** - Transformando negócios com tecnologia 🚀

> 💡 **Dica**: Teste todas as funcionalidades em http://localhost:3000 - use as credenciais de teste para explorar o sistema completo!