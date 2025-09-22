const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

async function cleanup() {
  try {
    console.log('🧹 Limpando contas WhatsApp travadas...\n')

    // 1. Encontrar contas travadas
    const stuckAccounts = await prisma.whatsAppAccount.findMany({
      where: {
        OR: [
          { status: 'CONNECTING' },
          { status: 'ERROR' },
          {
            AND: [
              { status: 'CONNECTED' },
              {
                lastHeartbeat: {
                  lt: new Date(Date.now() - 5 * 60 * 1000) // Mais de 5 minutos sem heartbeat
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        lastHeartbeat: true
      }
    })

    console.log(`📊 Encontradas ${stuckAccounts.length} contas para limpeza:`)
    stuckAccounts.forEach((account, i) => {
      console.log(`   ${i + 1}. ${account.phoneNumber} - Status: ${account.status} - Last: ${account.lastHeartbeat || 'N/A'}`)
    })

    if (stuckAccounts.length === 0) {
      console.log('✅ Nenhuma conta travada encontrada!')
      return
    }

    console.log('\n🔄 Limpando contas...')

    // 2. Reset para DISCONNECTED
    const updated = await prisma.whatsAppAccount.updateMany({
      where: {
        id: {
          in: stuckAccounts.map(acc => acc.id)
        }
      },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
        lastHeartbeat: null,
        sessionData: null
      }
    })

    console.log(`✅ ${updated.count} contas resetadas para DISCONNECTED`)

    // 3. Mostrar estado final
    console.log('\n📋 Estado final das contas:')
    const finalAccounts = await prisma.whatsAppAccount.findMany({
      select: {
        id: true,
        phoneNumber: true,
        status: true,
        qrCode: true
      },
      orderBy: { id: 'desc' }
    })

    finalAccounts.forEach((account, i) => {
      console.log(`   ${i + 1}. ${account.phoneNumber} - ${account.status} - QR: ${account.qrCode ? 'SIM' : 'NÃO'}`)
    })

    console.log('\n🎯 Limpeza concluída! Agora pode tentar conectar novamente.')

  } catch (error) {
    console.error('❌ Erro na limpeza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()