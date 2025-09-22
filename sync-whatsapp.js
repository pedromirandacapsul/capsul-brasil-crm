const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Iniciando sincronização forçada do WhatsApp...\n');

    // Encontrar conta conectada
    const account = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' }
    });

    if (!account) {
      console.log('❌ Nenhuma conta conectada encontrada.');
      return;
    }

    console.log(`📱 Conta encontrada: ${account.phoneNumber} (${account.id})`);

    // Fazer a requisição para sincronizar
    const response = await fetch(`http://localhost:3001/api/whatsapp/accounts/${account.id}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Sincronização concluída!`);
      console.log(`📊 Total de conversas sincronizadas: ${result.totalSynced}`);
      console.log(`💬 Mensagem: ${result.message}`);
    } else {
      const error = await response.text();
      console.log(`❌ Erro na sincronização: ${error}`);
    }

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();