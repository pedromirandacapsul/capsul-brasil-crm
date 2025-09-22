/**
 * TESTE DO WEBHOOK ZAPMEOW
 * Testa o endpoint webhook que criamos para receber dados do ZapMeow
 */

const axios = require('axios')

async function testWebhook() {
  try {
    console.log('🧪 TESTANDO WEBHOOK ZAPMEOW...\n')

    const webhookUrl = 'http://localhost:3001/api/whatsapp/webhook'

    // Teste 1: Mensagem recebida
    console.log('📨 Teste 1: Mensagem recebida')
    const messageReceived = {
      event: 'message_received',
      instanceId: '37991737234',
      phone: '5537991361002@c.us',
      message: 'Oi! Como você está?',
      messageId: 'msg_123456',
      timestamp: new Date().toISOString(),
      isFromMe: false
    }

    const response1 = await axios.post(webhookUrl, messageReceived, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Status:', response1.status)
    console.log('📦 Resposta:', response1.data)
    console.log('')

    // Teste 2: Mensagem enviada
    console.log('📤 Teste 2: Mensagem enviada')
    const messageSent = {
      event: 'message_sent',
      instanceId: '37991737234',
      phone: '5537991361002@c.us',
      message: 'Mensagem teste do funil',
      messageId: 'msg_789012',
      timestamp: new Date().toISOString(),
      isFromMe: true
    }

    const response2 = await axios.post(webhookUrl, messageSent, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Status:', response2.status)
    console.log('📦 Resposta:', response2.data)
    console.log('')

    // Teste 3: Trigger de funil
    console.log('🎯 Teste 3: Trigger de funil')
    const funnelTrigger = {
      event: 'funnel_trigger',
      instanceId: '37991737234',
      phone: '5537991361002@c.us',
      message: '',
      messageId: '',
      timestamp: new Date().toISOString(),
      isFromMe: false,
      funnelData: {
        funnelId: 'funil-teste-zapmeow',
        stepId: 'step-inicial'
      },
      leadData: {
        nome: 'Pedro Miranda',
        email: 'pedro@test.com',
        telefone: '37991361002'
      }
    }

    const response3 = await axios.post(webhookUrl, funnelTrigger, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Status:', response3.status)
    console.log('📦 Resposta:', response3.data)
    console.log('')

    console.log('🎉 TODOS OS TESTES PASSARAM!')
    console.log('✅ Webhook ZapMeow funcionando corretamente!')

  } catch (error) {
    console.error('❌ Erro testando webhook:', error.message)
    if (error.response) {
      console.error('📦 Resposta do erro:', error.response.data)
      console.error('🔢 Status do erro:', error.response.status)
    }
  }
}

testWebhook()