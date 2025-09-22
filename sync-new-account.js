const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncNewAccount() {
  try {
    console.log('🔄 Sincronizando conversas da nova conta...\n');

    // 1. Verificar nova conta
    const account = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!account) {
      console.log('❌ Nenhuma conta conectada encontrada');
      return;
    }

    console.log(`✅ Conta encontrada: ${account.phoneNumber} (${account.id})`);
    console.log(`🟢 Status: ${account.status}`);

    // 2. Verificar quantas conversas existem
    const conversationCount = await prisma.whatsAppConversation.count({
      where: { accountId: account.id }
    });

    console.log(`📊 Conversas atuais: ${conversationCount}`);

    if (conversationCount < 10) {
      console.log('🔄 Poucas conversas encontradas, iniciando sincronização...');

      // 3. Fazer chamada para sincronizar
      const response = await fetch(`http://localhost:3001/api/whatsapp/accounts/${account.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Vai falhar por autenticação, mas mostra o endpoint
        }
      });

      console.log(`📊 Status da sincronização: ${response.status}`);

      if (response.status === 401) {
        console.log('\n💡 Para sincronizar manualmente:');
        console.log('1. Vá para: http://localhost:3001/admin/whatsapp');
        console.log('2. Clique em "Sincronizar todas as conversas"');
        console.log('3. Aguarde a sincronização completar');
      }
    }

    // 4. Verificar conversas após tentativa
    const finalCount = await prisma.whatsAppConversation.count({
      where: { accountId: account.id }
    });

    console.log(`\n📊 Total de conversas: ${finalCount}`);

    if (finalCount > 0) {
      const recentConversations = await prisma.whatsAppConversation.findMany({
        where: { accountId: account.id },
        orderBy: { lastMessageAt: 'desc' },
        take: 5
      });

      console.log('\n📞 Conversas mais recentes:');
      recentConversations.forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.contactName || conv.contactNumber}`);
        console.log(`      👥 Grupo: ${conv.isGroup ? 'Sim' : 'Não'}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncNewAccount();