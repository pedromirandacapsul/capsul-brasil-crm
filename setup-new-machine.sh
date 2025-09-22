#!/bin/bash

# Capsul Brasil CRM - Setup para Nova Máquina
echo "🚀 Configurando Capsul Brasil CRM em nova máquina..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install

# Configurar ambiente se não existir
if [ ! -f ".env.local" ]; then
    echo "⚙️ Criando arquivo de configuração..."
    cp .env.example .env.local

    # Gerar nova secret para NextAuth
    SECRET=$(openssl rand -base64 32)
    sed -i "s/your-super-secret-nextauth-secret-key-change-in-production/$SECRET/" .env.local

    echo "✅ Arquivo .env.local criado com nova chave secreta"
fi

# Configurar banco de dados
echo "🗄️ Configurando banco de dados..."
if [ ! -f "dev.db" ]; then
    echo "Criando banco SQLite e executando migrações..."
    DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init

    echo "🌱 Populando banco com dados iniciais..."
    DATABASE_URL="file:./dev.db" npx prisma db seed
else
    echo "Banco já existe, verificando migrações..."
    DATABASE_URL="file:./dev.db" npx prisma migrate deploy
fi

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "Para iniciar o projeto:"
echo "  DATABASE_URL=\"file:./dev.db\" pnpm dev"
echo ""
echo "Usuários padrão criados:"
echo "  Admin:   admin@capsul.com.br / admin123"
echo "  Manager: manager@capsul.com.br / manager123"
echo "  Sales:   sales@capsul.com.br / sales123"
echo ""
echo "Acesse: http://localhost:3000"