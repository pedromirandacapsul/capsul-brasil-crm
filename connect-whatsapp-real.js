const { Client, LocalAuth } = require('whatsapp-web.js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectWhatsAppReal() {
  const accountId = 'cmfn6khok0001p9lbjkwmc42c';

  console.log('🔗 Iniciando conexão WhatsApp Web real...\n');

  // Verificar conta no banco
  const account = await prisma.whatsAppAccount.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    console.log('❌ Conta não encontrada no banco de dados');
    return;
  }

  console.log(`📱 Conectando conta: ${account.phoneNumber} (${account.displayName})`);

  // Criar cliente WhatsApp
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: accountId,
      dataPath: './whatsapp-sessions'
    }),
    puppeteer: {
      executablePath: 'C:\\Users\\Pedro Miranda\\.cache\\puppeteer\\chrome\\win64-140.0.7339.82\\chrome-win64\\chrome.exe',
      headless: false, // Mostrar janela do Chrome para debug
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // Event handlers
  client.on('qr', (qr) => {
    console.log('📱 QR Code gerado! Escaneie com seu WhatsApp:');
    console.log(qr);
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp conectado com sucesso!');

    // Atualizar status no banco
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        status: 'CONNECTED',
        lastHeartbeat: new Date()
      }
    });

    console.log('✅ Status atualizado no banco de dados');

    // Listar algumas conversas para teste
    const chats = await client.getChats();
    console.log(`📬 ${chats.length} conversas encontradas`);

    // Mostrar as primeiras 5 conversas
    console.log('\n📋 Primeiras 5 conversas:');
    chats.slice(0, 5).forEach((chat, i) => {
      console.log(`   ${i + 1}. ${chat.name || chat.id._serialized} ${chat.isGroup ? '(Grupo)' : '(Individual)'}`);
    });

    console.log('\n🎯 WhatsApp Web conectado e funcionando!');
    console.log('🔗 Agora você pode testar o envio de mensagens na interface');
  });

  client.on('auth_failure', () => {
    console.log('❌ Falha na autenticação');
  });

  client.on('disconnected', () => {
    console.log('⚠️ WhatsApp desconectado');
  });

  // Inicializar
  try {
    await client.initialize();
  } catch (error) {
    console.error('💥 Erro ao inicializar:', error.message);
  }
}

connectWhatsAppReal().catch(console.error);