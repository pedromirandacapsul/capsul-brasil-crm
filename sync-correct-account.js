/**
 * 🔧 SINCRONIZAR CONTA CORRETA
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function syncCorrectAccount() {
  try {
    console.log('🔧 SINCRONIZANDO CONTA CORRETA\n')

    // 1. Encontrar a conta realmente conectada
    const connectedAccount = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' },
      select: {
        id: true,
        phoneNumber: true,
        displayName: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!connectedAccount) {
      console.log('❌ Nenhuma conta conectada encontrada')
      return
    }

    console.log(`✅ Conta conectada atual:`)
    console.log(`   Número: ${connectedAccount.phoneNumber}`)
    console.log(`   Nome: ${connectedAccount.displayName}`)
    console.log(`   ID: ${connectedAccount.id}`)
    console.log(`   Criada: ${new Date(connectedAccount.createdAt).toLocaleString('pt-BR')}`)

    // 2. Verificar conversas nesta conta
    const conversations = await prisma.whatsAppConversation.count({
      where: { accountId: connectedAccount.id }
    })

    console.log(`\n📱 Conversas nesta conta: ${conversations}`)

    if (conversations === 0) {
      console.log('\n⚠️ PROBLEMA: Conta conectada não tem conversas!')
      console.log('   • Sistema tentará enviar para conta sem conversas')
      console.log('   • Por isso cai no MOCK')
      console.log('')
      console.log('🔧 SOLUÇÃO:')
      console.log('   1. As conversas estão em conta antiga')
      console.log('   2. Precisa reconectar esta conta: 37991361002')
      console.log('   3. Ou migrar conversas para conta nova')
    }

    // 3. Verificar contas antigas com conversas
    const accountsWithConversations = await prisma.whatsAppAccount.findMany({
      where: {
        conversations: {
          some: {}
        }
      },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        _count: {
          select: {
            conversations: true
          }
        }
      }
    })

    console.log(`\n📊 Contas com conversas:`)
    accountsWithConversations.forEach((acc, i) => {
      console.log(`   ${i + 1}. ${acc.phoneNumber} (${acc.status}) - ${acc._count.conversations} conversas`)
    })

    console.log(`\n🎯 DIAGNÓSTICO FINAL:`)
    console.log(`   • Conta CONNECTED: ${connectedAccount.phoneNumber} (${conversations} conversas)`)
    console.log(`   • Frontend usa conversas de contas antigas`)
    console.log(`   • Sistema tenta enviar pela conta CONNECTED (sem conversas)`)
    console.log(`   • API getSession() não encontra sessão ativa`)
    console.log(`   • Cai no MOCK`)

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncCorrectAccount()