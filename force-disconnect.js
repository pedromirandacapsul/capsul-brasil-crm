const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceDisconnect() {
  try {
    console.log('🔄 Forçando desconexão da conta WhatsApp...\n');

    // 1. Atualizar status no banco
    const updated = await prisma.whatsAppAccount.update({
      where: { id: 'cmfn3ltpx0001oql7yi5ds8bo' },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
        sessionData: null,
        lastHeartbeat: null
      }
    });

    console.log('✅ Conta desconectada no banco de dados');
    console.log(`📱 ${updated.phoneNumber} - Status: ${updated.status}`);

    console.log('\n🔧 Próximos passos:');
    console.log('1. Vá para: http://localhost:3001/admin/whatsapp');
    console.log('2. Clique em "Conectar" para reconectar a conta');
    console.log('3. Escaneie o QR code novamente');
    console.log('4. Aguarde a conexão completa');
    console.log('5. Tente enviar uma mensagem');

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

forceDisconnect();