const { PrismaClient } = require('@prisma/client')
const { Client, LocalAuth } = require('whatsapp-web.js')

const prisma = new PrismaClient()

async function syncRealConversations() {
  try {
    console.log('🔄 Iniciando sincronização de conversas reais...')

    // Buscar conta conectada
    const account = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' }
    })

    if (!account) {
      console.log('❌ Nenhuma conta conectada encontrada')
      return
    }

    console.log(`📱 Conta: ${account.phoneNumber} (${account.id})`)

    // Criar cliente WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: account.id
      }),
      puppeteer: {
        headless: true,
        executablePath: 'C:\\Users\\Pedro Miranda\\.cache\\puppeteer\\chrome\\win64-140.0.7339.82\\chrome-win64\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    })

    console.log('🔌 Conectando ao WhatsApp...')

    // Configurar eventos
    client.on('ready', async () => {
      console.log('✅ WhatsApp conectado! Sincronizando conversas...')

      try {
        // Buscar todos os chats
        const chats = await client.getChats()
        console.log(`📊 ${chats.length} conversas encontradas no WhatsApp`)

        let syncedCount = 0
        let newConversations = 0

        for (const chat of chats) {
          try {
            // Ignorar status broadcast
            if (chat.id._serialized.includes('status@broadcast')) continue

            const contactNumber = chat.id._serialized
            const isGroup = chat.isGroup
            let contactName = chat.name || contactNumber
            let profilePicture = null

            // Tentar obter foto de perfil
            try {
              profilePicture = await chat.getProfilePicUrl()
            } catch (e) {
              // Foto não disponível
            }

            // Para contatos individuais, tentar obter nome mais específico
            if (!isGroup && chat.contact) {
              contactName = chat.contact.name || chat.contact.pushname || contactNumber.split('@')[0]
            }

            const lastMessageDate = chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : new Date()

            // Verificar se conversa já existe
            const existingConversation = await prisma.whatsAppConversation.findFirst({
              where: { accountId: account.id, contactNumber }
            })

            if (existingConversation) {
              // Atualizar conversa existente
              await prisma.whatsAppConversation.update({
                where: { id: existingConversation.id },
                data: {
                  contactName,
                  profilePicture,
                  lastMessageAt: lastMessageDate,
                  unreadCount: chat.unreadCount || 0
                }
              })
            } else {
              // Criar nova conversa
              await prisma.whatsAppConversation.create({
                data: {
                  accountId: account.id,
                  contactNumber,
                  contactName,
                  profilePicture,
                  isGroup,
                  status: 'ACTIVE',
                  lastMessageAt: lastMessageDate,
                  unreadCount: chat.unreadCount || 0
                }
              })
              newConversations++
            }

            syncedCount++
            console.log(`✅ ${syncedCount}. ${contactName} ${isGroup ? '(Grupo)' : ''} - ${chat.unreadCount || 0} não lidas`)

            // Delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 50))

          } catch (error) {
            console.error(`❌ Erro ao sincronizar ${chat.id._serialized}:`, error.message)
          }
        }

        console.log(`\n🎉 Sincronização concluída!`)
        console.log(`📊 ${syncedCount} conversas sincronizadas`)
        console.log(`🆕 ${newConversations} novas conversas adicionadas`)

        // Mostrar estatísticas
        const totalConversations = await prisma.whatsAppConversation.count({
          where: { accountId: account.id }
        })

        const unreadConversations = await prisma.whatsAppConversation.count({
          where: {
            accountId: account.id,
            unreadCount: { gt: 0 }
          }
        })

        console.log(`\n📊 ESTATÍSTICAS:`)
        console.log(`📱 Total de conversas: ${totalConversations}`)
        console.log(`🔵 Conversas não lidas: ${unreadConversations}`)

        // Mostrar conversas mais recentes
        const recentConversations = await prisma.whatsAppConversation.findMany({
          where: { accountId: account.id },
          orderBy: { lastMessageAt: 'desc' },
          take: 10
        })

        console.log(`\n📬 TOP 10 CONVERSAS MAIS RECENTES:`)
        recentConversations.forEach((conv, i) => {
          const date = conv.lastMessageAt ? conv.lastMessageAt.toLocaleString('pt-BR') : 'N/A'
          const unread = conv.unreadCount > 0 ? ` (${conv.unreadCount} não lidas)` : ''
          console.log(`${i+1}. ${conv.contactName}${unread} - ${date}`)
        })

        // Fechar cliente
        await client.destroy()
        console.log('\n✅ Sincronização completa! WhatsApp desconectado.')

      } catch (error) {
        console.error('❌ Erro durante sincronização:', error)
        await client.destroy()
      }
    })

    client.on('auth_failure', () => {
      console.log('❌ Falha na autenticação WhatsApp')
    })

    client.on('disconnected', () => {
      console.log('📱 WhatsApp desconectado')
    })

    // Inicializar cliente
    await client.initialize()

    // Timeout de segurança
    setTimeout(() => {
      console.log('⏰ Timeout - encerrando processo')
      process.exit(0)
    }, 60000) // 1 minuto

  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Capturar Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrompido pelo usuário')
  await prisma.$disconnect()
  process.exit(0)
})

syncRealConversations()