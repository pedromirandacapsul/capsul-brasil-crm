# 🛠️ Setup Local Completo - Capsul Brasil

Este guia detalha como configurar o ambiente de desenvolvimento local do Capsul Brasil em diferentes sistemas operacionais.

## 📋 Pré-requisitos Detalhados

### Windows

1. **Node.js LTS**
   ```bash
   # Baixe e instale do site oficial
   # https://nodejs.org/

   # Ou usando Chocolatey
   choco install nodejs

   # Verifique a instalação
   node --version  # v18.x.x ou superior
   ```

2. **pnpm**
   ```bash
   npm install -g pnpm
   pnpm --version  # 8.x.x ou superior
   ```

3. **Docker Desktop**
   ```bash
   # Baixe e instale do site oficial
   # https://docs.docker.com/desktop/install/windows-install/

   # Certifique-se que WSL2 está habilitado
   wsl --install
   ```

### macOS

1. **Node.js LTS**
   ```bash
   # Usando Homebrew (recomendado)
   brew install node@18

   # Ou baixe do site oficial
   # https://nodejs.org/
   ```

2. **pnpm**
   ```bash
   npm install -g pnpm
   ```

3. **Docker Desktop**
   ```bash
   # Usando Homebrew
   brew install --cask docker

   # Ou baixe do site oficial
   # https://docs.docker.com/desktop/install/mac-install/
   ```

### Linux (Ubuntu/Debian)

1. **Node.js LTS**
   ```bash
   # Usando NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Ou usando snap
   sudo snap install node --classic
   ```

2. **pnpm**
   ```bash
   npm install -g pnpm
   ```

3. **Docker Engine**
   ```bash
   # Instalar Docker Engine
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Adicionar usuário ao grupo docker
   sudo usermod -aG docker $USER
   newgrp docker

   # Instalar Docker Compose
   sudo apt-get install docker-compose-plugin
   ```

## 🚀 Instalação Passo-a-Passo

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd capsul-brasil
```

### 2. Verificar Pré-requisitos

```bash
# Verificar se tudo está instalado
node --version    # v18.x.x+
pnpm --version    # 8.x.x+
docker --version  # 20.x.x+

# Verificar se Docker está rodando
docker info
```

### 3. Bootstrap Automático

```bash
# Executa todo o setup automaticamente
pnpm dev:bootstrap
```

**O que o bootstrap faz:**
- ✅ Verifica pré-requisitos
- ✅ Copia `.env.local` do `.env.example`
- ✅ Instala dependências
- ✅ Sobe containers Docker
- ✅ Aguarda serviços ficarem prontos
- ✅ Gera cliente Prisma
- ✅ Executa migrations
- ✅ Popula dados iniciais

### 4. Iniciar Desenvolvimento

```bash
pnpm dev
```

## 🔍 Verificação da Instalação

### Smoke Test Manual

1. **Frontend**
   - Abra http://localhost:3000
   - Veja a landing page carregando
   - Teste o formulário de contato

2. **Admin**
   - Acesse http://localhost:3000/admin
   - Faça login com `admin@capsul.com.br` / `Capsul@2024!Admin`
   - Verifique se dashboard carrega

3. **Email**
   - Abra http://localhost:8025 (Mailhog)
   - Envie um formulário
   - Veja se email chegou

4. **BI**
   - Abra http://localhost:3001 (Metabase)
   - Configure usando PostgreSQL local
   - Verifique conectividade

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Portas Ocupadas

**Erro:** `Port 5432 is already in use`

**Solução:**
```bash
# Windows
netstat -an | findstr ":5432"
netstat -an | findstr ":6379"
netstat -an | findstr ":3000"

# macOS/Linux
lsof -i :5432
lsof -i :6379
lsof -i :3000

# Parar serviços conflitantes ou alterar portas no docker-compose.yml
```

#### 2. Docker Não Inicia

**Erro:** `Cannot connect to the Docker daemon`

**Solução Windows:**
```bash
# Reiniciar Docker Desktop
# Verificar se WSL2 está habilitado
wsl --list --verbose

# Se necessário, instalar WSL2
wsl --install
```

**Solução macOS:**
```bash
# Reiniciar Docker Desktop
# Verificar se está na pasta Applications
open /Applications/Docker.app
```

**Solução Linux:**
```bash
# Verificar se Docker daemon está rodando
sudo systemctl status docker

# Iniciar se necessário
sudo systemctl start docker

# Verificar permissões
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Problemas de Dependências

**Erro:** `Package not found` ou `Cannot resolve dependency`

**Solução:**
```bash
# Limpar cache
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstalar
pnpm install
```

#### 4. Database Connection Error

**Erro:** `P1001: Can't reach database server`

**Solução:**
```bash
# Verificar se PostgreSQL container está rodando
docker ps

# Verificar logs
docker compose logs postgres

# Recriar containers
docker compose down -v
docker compose up -d

# Aguardar serviços
sleep 30

# Recriar database
pnpm db:reset
```

#### 5. Windows + WSL2 Issues

**Erro:** `Docker Desktop requires a newer WSL kernel version`

**Solução:**
```bash
# Atualizar WSL
wsl --update

# Reiniciar WSL
wsl --shutdown
wsl

# Verificar versão
wsl --version
```

#### 6. macOS Apple Silicon

**Erro:** `Platform incompatibility` ou imagens ARM64

**Solução:**
```bash
# Forçar arquitetura x86_64 se necessário
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Rebuild containers
docker compose down
docker compose up -d --build
```

#### 7. Permission Denied (Linux)

**Erro:** `Permission denied while trying to connect`

**Solução:**
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Relogar ou executar
newgrp docker

# Verificar grupos
groups
```

### Reset Completo

Se nada funcionar, execute um reset completo:

```bash
# Parar tudo
docker compose down -v
docker system prune -a -f

# Limpar Node.js
rm -rf node_modules
rm pnpm-lock.yaml

# Recomençar
pnpm install
pnpm dev:bootstrap
```

## 🔧 Configurações Avançadas

### Customizar Portas

Edite `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Muda porta local para 5433

  redis:
    ports:
      - "6380:6379"  # Muda porta local para 6380
```

Atualize `.env.local`:

```env
DATABASE_URL="postgresql://capsul_user:capsul_pass@localhost:5433/capsul_db"
REDIS_URL="redis://localhost:6380"
```

### Performance no Windows

Mova o projeto para dentro do WSL2:

```bash
# No WSL2
cd /home/username/
git clone <repository-url>
cd capsul-brasil
pnpm dev:bootstrap
```

### Desenvolvimento Offline

Todos os serviços rodam localmente:
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Email (Mailhog)
- ✅ BI (Metabase)
- ✅ Analytics (Mock)

Apenas a instalação inicial de dependências requer internet.

## 📊 Monitoramento

### Logs dos Serviços

```bash
# Todos os logs
docker compose logs -f

# Serviço específico
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f mailhog
docker compose logs -f metabase
```

### Status dos Serviços

```bash
# Ver containers rodando
docker ps

# Verificar saúde
docker compose ps
```

### Métricas de Performance

```bash
# Uso de recursos
docker stats

# Espaço usado
docker system df
```

## 🎯 Próximos Passos

Após configuração bem-sucedida:

1. **Explore o Admin**: http://localhost:3000/admin
2. **Configure Metabase**: http://localhost:3001
3. **Teste o Email**: http://localhost:8025
4. **Rode os testes**: `pnpm test` e `pnpm e2e`
5. **Desenvolva**: Veja a estrutura em `src/`

## 📞 Suporte

Se encontrar problemas não documentados:

1. Verifique os logs: `docker compose logs -f`
2. Execute diagnóstico: `pnpm dev:bootstrap`
3. Reset completo se necessário
4. Documente e reporte o issue

---

**Happy Coding!** 🚀