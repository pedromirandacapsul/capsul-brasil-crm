const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forceSync() {
  try {
    console.log('🔄 Iniciando sincronização forçada...')

    // Buscar conta conectada
    const account = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' }
    })

    if (!account) {
      console.log('❌ Nenhuma conta conectada encontrada')
      return
    }

    console.log(`📱 Conta: ${account.phoneNumber} (${account.id})`)

    // Importar WhatsApp Manager
    const { whatsappManager } = await import('./src/lib/whatsapp-manager.ts')

    // Verificar se existe conexão ativa
    const manager = whatsappManager
    const client = manager.getClient(account.id)

    if (!client) {
      console.log('❌ Cliente WhatsApp não encontrado. Tentando reconectar...')

      // Tentar reconectar
      const result = await manager.connect(account.id)
      if (!result.success) {
        console.log('❌ Falha na reconexão:', result.error)
        return
      }
      console.log('✅ Reconectado com sucesso')
    }

    console.log('🔍 Buscando conversas do WhatsApp...')

    // Forçar sincronização
    const activeClient = manager.getClient(account.id)
    if (activeClient) {
      const chats = await activeClient.getChats()
      console.log(`📊 ${chats.length} conversas encontradas`)

      let syncedCount = 0

      for (const chat of chats) {
        try {
          // Ignorar status broadcast
          if (chat.id._serialized.includes('status@broadcast')) continue

          const contactNumber = chat.id._serialized
          const isGroup = chat.isGroup
          let contactName = chat.name || contactNumber
          let profilePicture = null

          try {
            profilePicture = await chat.getProfilePicUrl()
          } catch (e) {
            // Foto de perfil não disponível
          }

          // Criar ou atualizar conversa
          await prisma.whatsAppConversation.upsert({
            where: {
              accountId_contactNumber: {
                accountId: account.id,
                contactNumber
              }
            },
            update: {
              contactName,
              profilePicture,
              lastMessageAt: chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : undefined,
              unreadCount: chat.unreadCount || 0
            },
            create: {
              accountId: account.id,
              contactNumber,
              contactName,
              profilePicture,
              isGroup,
              status: 'ACTIVE',
              lastMessageAt: chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : new Date(),
              unreadCount: chat.unreadCount || 0
            }
          })

          syncedCount++
          console.log(`✅ ${syncedCount}. ${contactName} (${isGroup ? 'Grupo' : 'Individual'})`)

          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`❌ Erro ao sincronizar ${chat.id._serialized}:`, error.message)
        }
      }

      console.log(`\n🎉 Sincronização concluída! ${syncedCount} conversas sincronizadas`)

      // Verificar mensagens recentes
      console.log('\n📬 Verificando mensagens recentes...')
      const recentConversations = await prisma.whatsAppConversation.findMany({
        where: { accountId: account.id },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        include: {
          _count: {
            select: { messages: true }
          }
        }
      })

      console.log('\n📊 Top 10 conversas mais recentes:')
      recentConversations.forEach((conv, i) => {
        console.log(`${i+1}. ${conv.contactName} - ${conv._count.messages} mensagens - ${conv.lastMessageAt?.toLocaleString()}`)
      })

    } else {
      console.log('❌ Cliente ainda não disponível após reconexão')
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceSync()