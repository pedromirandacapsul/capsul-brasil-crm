#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function copyEnvFile() {
  const envExample = path.join(process.cwd(), '.env.example')
  const envLocal = path.join(process.cwd(), '.env.local')

  if (!fs.existsSync(envLocal)) {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envLocal)
      log('✅ Created .env.local from .env.example', colors.green)
    } else {
      log('⚠️  .env.example not found', colors.yellow)
    }
  } else {
    log('ℹ️  .env.local already exists', colors.blue)
  }
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, colors.cyan)
  try {
    execSync(command, { stdio: 'inherit' })
    log(`✅ ${description} completed`, colors.green)
    return true
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, colors.red)
    return false
  }
}

async function waitForServices() {
  log('\n⏳ Waiting for services to be ready...', colors.cyan)

  let attempts = 0
  const maxAttempts = 30

  while (attempts < maxAttempts) {
    try {
      // Check PostgreSQL
      execSync('docker exec capsul-postgres pg_isready -U capsul_user -d capsul_db', { stdio: 'ignore' })

      // Check Redis
      execSync('docker exec capsul-redis redis-cli ping', { stdio: 'ignore' })

      log('✅ All services are ready!', colors.green)
      return true
    } catch {
      attempts++
      if (attempts % 5 === 0) {
        log(`⏳ Still waiting for services... (${attempts}/${maxAttempts})`, colors.yellow)
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  log('❌ Services failed to start within timeout', colors.red)
  return false
}

async function main() {
  log(`${colors.bold}🚀 Capsul Brasil - Local Development Bootstrap${colors.reset}`)
  log('='.repeat(50))

  // Check prerequisites
  log('\n📋 Checking prerequisites...', colors.cyan)

  const checks = [
    { command: 'node', name: 'Node.js' },
    { command: 'pnpm', name: 'pnpm' },
    { command: 'docker', name: 'Docker' }
  ]

  let hasAllPrerequisites = true

  for (const check of checks) {
    if (checkCommand(check.command)) {
      log(`✅ ${check.name} is installed`, colors.green)
    } else {
      log(`❌ ${check.name} is not installed`, colors.red)
      hasAllPrerequisites = false
    }
  }

  if (!hasAllPrerequisites) {
    log('\n💡 Please install missing prerequisites:', colors.yellow)
    log('   • Node.js: https://nodejs.org/')
    log('   • pnpm: npm install -g pnpm')
    log('   • Docker: https://docker.com/get-started')
    process.exit(1)
  }

  // Check if Docker is running
  try {
    execSync('docker info', { stdio: 'ignore' })
    log('✅ Docker is running', colors.green)
  } catch {
    log('❌ Docker is not running. Please start Docker Desktop/Engine', colors.red)
    process.exit(1)
  }

  // Copy environment file
  log('\n📄 Setting up environment...', colors.cyan)
  copyEnvFile()

  // Install dependencies
  if (!runCommand('pnpm install', 'Installing dependencies')) {
    process.exit(1)
  }

  // Start Docker services
  if (!runCommand('docker compose up -d', 'Starting Docker services')) {
    process.exit(1)
  }

  // Wait for services to be ready
  const servicesReady = await waitForServices()
  if (!servicesReady) {
    log('\n💡 Troubleshooting tips:', colors.yellow)
    log('   • Check if ports 5432, 6379, 8025, 3001 are available')
    log('   • Run: docker compose logs -f')
    log('   • Try: docker compose down && docker compose up -d')
    process.exit(1)
  }

  // Generate Prisma client
  if (!runCommand('pnpm prisma generate', 'Generating Prisma client')) {
    process.exit(1)
  }

  // Run database migrations
  if (!runCommand('pnpm prisma migrate dev --name init', 'Running database migrations')) {
    process.exit(1)
  }

  // Seed database
  if (!runCommand('pnpm prisma db seed', 'Seeding database')) {
    process.exit(1)
  }

  // Success message
  log(`\n${colors.green}${colors.bold}🎉 Bootstrap completed successfully!${colors.reset}`)
  log('='.repeat(50))
  log('\n📚 Next steps:')
  log(`   1. Run: ${colors.cyan}pnpm dev${colors.reset}`)
  log(`   2. Open: ${colors.cyan}http://localhost:3000${colors.reset}`)
  log(`   3. Check email: ${colors.cyan}http://localhost:8025${colors.reset} (Mailhog)`)
  log(`   4. View BI: ${colors.cyan}http://localhost:3001${colors.reset} (Metabase)`)

  log('\n👤 Test users:')
  log(`   Admin: ${colors.cyan}admin@capsul.com.br${colors.reset} / ${colors.cyan}Capsul@2024!Admin${colors.reset}`)
  log(`   Manager: ${colors.cyan}manager@capsul.com.br${colors.reset} / ${colors.cyan}Capsul@2024!Manager${colors.reset}`)
  log(`   Sales: ${colors.cyan}vendas@capsul.com.br${colors.reset} / ${colors.cyan}Capsul@2024!Sales${colors.reset}`)

  log('\n🛠️  Useful commands:')
  log(`   • ${colors.cyan}pnpm db:studio${colors.reset} - Open Prisma Studio`)
  log(`   • ${colors.cyan}pnpm compose:logs${colors.reset} - View Docker logs`)
  log(`   • ${colors.cyan}pnpm compose:down${colors.reset} - Stop services`)
  log(`   • ${colors.cyan}pnpm db:reset${colors.reset} - Reset database`)
}

main().catch(error => {
  log(`\n💥 Bootstrap failed: ${error.message}`, colors.red)
  process.exit(1)
})