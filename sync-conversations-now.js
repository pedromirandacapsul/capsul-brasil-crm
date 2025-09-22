const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function syncConversations() {
  try {
    console.log('🔄 Sincronizando conversas da conta conectada...\n')

    // Encontrar conta conectada
    const connectedAccount = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' },
      select: { id: true, phoneNumber: true, displayName: true }
    })

    if (!connectedAccount) {
      console.log('❌ Nenhuma conta conectada encontrada')
      return
    }

    console.log(`📱 Conta conectada: ${connectedAccount.phoneNumber} (${connectedAccount.displayName})`)
    console.log(`📋 Account ID: ${connectedAccount.id}`)

    // Fazer requisição para sincronizar
    console.log('\n🔄 Iniciando sincronização via API...')

    const response = await fetch(`http://localhost:3000/api/whatsapp/accounts/${connectedAccount.id}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Sincronização concluída!`)
      console.log(`📊 Conversas sincronizadas: ${data.totalSynced}`)
    } else {
      const error = await response.json()
      console.log(`❌ Erro na sincronização: ${error.error}`)
    }

    // Verificar conversas no banco
    console.log('\n📋 Verificando conversas no banco...')
    const conversations = await prisma.whatsAppConversation.findMany({
      where: { accountId: connectedAccount.id },
      select: {
        id: true,
        contactName: true,
        contactNumber: true,
        isGroup: true,
        lastMessageAt: true,
        unreadCount: true
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 10
    })

    console.log(`📊 Total de conversas: ${conversations.length}`)

    if (conversations.length > 0) {
      console.log('\n📱 Primeiras 10 conversas:')
      conversations.forEach((conv, i) => {
        const type = conv.isGroup ? 'GRUPO' : 'INDIVIDUAL'
        const lastMsg = conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString('pt-BR') : 'N/A'
        console.log(`   ${i + 1}. ${conv.contactName || conv.contactNumber} (${type}) - ${lastMsg}`)
      })
    } else {
      console.log('⚠️  Nenhuma conversa encontrada. Tentando sincronização manual...')
    }

    console.log('\n🎯 Processo concluído!')
    console.log('💡 Agora acesse o Inbox em: http://localhost:3000/admin/whatsapp')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncConversations()