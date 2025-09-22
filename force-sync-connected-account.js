/**
 * 🔄 FORÇAR SINCRONIZAÇÃO DA CONTA CONECTADA
 *
 * Este script força a sincronização das conversas para a conta já conectada
 */

const { whatsappManager } = require('./src/lib/whatsapp-manager.ts')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function forceSyncConnectedAccount() {
  try {
    console.log('🔄 FORÇANDO SINCRONIZAÇÃO DA CONTA CONECTADA\n')

    // Encontrar conta conectada
    const connectedAccount = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' },
      select: {
        id: true,
        phoneNumber: true,
        displayName: true,
        userId: true
      }
    })

    if (!connectedAccount) {
      console.log('❌ Nenhuma conta conectada encontrada')
      return
    }

    console.log(`📱 Conta encontrada: ${connectedAccount.phoneNumber} (${connectedAccount.displayName})`)
    console.log(`📋 Account ID: ${connectedAccount.id}`)
    console.log(`👤 User ID: ${connectedAccount.userId}`)

    console.log('\n🔄 Iniciando sincronização forçada...')

    // Usar diretamente o WhatsApp Manager
    const syncResult = await whatsappManager.syncAllChats(connectedAccount.id)

    if (syncResult.success) {
      console.log(`✅ Sincronização bem-sucedida!`)
      console.log(`📊 Conversas sincronizadas: ${syncResult.totalSynced}`)
    } else {
      console.log(`❌ Erro na sincronização: ${syncResult.error}`)
    }

    // Verificar conversas sincronizadas
    console.log('\n📋 Verificando conversas sincronizadas...')
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
      take: 15
    })

    console.log(`📊 Total de conversas no banco: ${conversations.length}`)

    if (conversations.length > 0) {
      console.log('\n📱 Conversas encontradas:')
      conversations.forEach((conv, i) => {
        const type = conv.isGroup ? '👥 GRUPO' : '👤 INDIVIDUAL'
        const lastMsg = conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString('pt-BR') : 'N/A'
        const unread = conv.unreadCount > 0 ? `📬 ${conv.unreadCount}` : '✅'
        console.log(`   ${i + 1}. ${conv.contactName || conv.contactNumber} ${type} - ${lastMsg} ${unread}`)
      })
    } else {
      console.log('⚠️  Ainda nenhuma conversa encontrada.')
    }

    console.log('\n🎯 SINCRONIZAÇÃO CONCLUÍDA!')
    console.log('💡 Acesse o inbox agora: http://localhost:3000/admin/whatsapp')
    console.log('📋 Vá na aba "Inbox" para ver suas conversas')

  } catch (error) {
    console.error('❌ Erro na sincronização forçada:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceSyncConnectedAccount()