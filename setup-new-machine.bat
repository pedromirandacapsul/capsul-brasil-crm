@echo off
echo 🚀 Configurando Capsul Brasil CRM em nova máquina...

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale o Node.js 18+ primeiro.
    pause
    exit /b 1
)

REM Verificar se pnpm está instalado
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando pnpm...
    npm install -g pnpm
)

REM Instalar dependências
echo 📦 Instalando dependências...
pnpm install

REM Configurar ambiente se não existir
if not exist ".env.local" (
    echo ⚙️ Criando arquivo de configuração...
    copy .env.example .env.local
    echo ✅ Arquivo .env.local criado - configure as variáveis se necessário
)

REM Configurar banco de dados
echo 🗄️ Configurando banco de dados...
if not exist "dev.db" (
    echo Criando banco SQLite e executando migrações...
    set DATABASE_URL=file:./dev.db
    npx prisma migrate dev --name init

    echo 🌱 Populando banco com dados iniciais...
    npx prisma db seed
) else (
    echo Banco já existe, verificando migrações...
    set DATABASE_URL=file:./dev.db
    npx prisma migrate deploy
)

echo.
echo ✅ Setup concluído com sucesso!
echo.
echo Para iniciar o projeto:
echo   pnpm run dev
echo.
echo Usuários padrão criados:
echo   Admin:   admin@capsul.com.br / admin123
echo   Manager: manager@capsul.com.br / manager123
echo   Sales:   sales@capsul.com.br / sales123
echo.
echo Acesse: http://localhost:3000
echo.
pause