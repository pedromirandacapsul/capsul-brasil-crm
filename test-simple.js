/**
 * TESTE SIMPLES DO WHATSAPP
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function testSimple() {
  try {
    console.log('🔍 VERIFICANDO CONTAS WHATSAPP...\n')

    // Buscar contas
    const accounts = await prisma.whatsAppAccount.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    if (accounts.length === 0) {
      console.log('❌ Nenhuma conta WhatsApp encontrada')
      return
    }

    console.log('📱 CONTAS ENCONTRADAS:')
    accounts.forEach((acc, i) => {
      console.log(`   ${i + 1}. ${acc.phoneNumber} - ${acc.status} (ID: ${acc.id.substring(0, 8)}...)`)
    })

    // Testar conta conectada
    const connected = accounts.find(acc => acc.status === 'CONNECTED')

    if (!connected) {
      console.log('\n❌ Nenhuma conta CONNECTED encontrada')
      console.log('👉 Solução: Acesse http://localhost:3001/admin/whatsapp e conecte uma conta')
      return
    }

    console.log(`\n✅ Conta conectada: ${connected.phoneNumber}`)
    console.log(`   ID: ${connected.id}`)
    console.log(`   Status: ${connected.status}`)

    // Verificar conversas
    const convs = await prisma.whatsAppConversation.count({
      where: { accountId: connected.id }
    })

    console.log(`   Conversas: ${convs}`)

    if (convs > 0) {
      console.log('\n🎯 SISTEMA CONFIGURADO CORRETAMENTE!')
      console.log('👉 Teste no navegador: http://localhost:3001/admin/whatsapp')
    } else {
      console.log('\n⚠️ Conta conectada mas sem conversas')
      console.log('👉 Tente reconectar o WhatsApp')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSimple()