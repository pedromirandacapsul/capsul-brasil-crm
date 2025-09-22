import { NextRequest, NextResponse } from 'next/server'
import { zapMeowService } from '@/lib/whatsapp/zapmeow-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando conversas via API /api/whatsapp/chats')

    // 1. Buscar conta ativa ZapMeow
    const connectedAccount = await prisma.whatsAppAccount.findFirst({
      where: { status: 'CONNECTED' },
      select: { id: true, phoneNumber: true }
    })

    if (!connectedAccount) {
      return NextResponse.json({
        error: 'Nenhuma conta conectada encontrada',
        chats: []
      }, { status: 400 })
    }

    // 2. Buscar conversas via ZapMeowService
    console.log(`🔄 Buscando conversas para conta ${connectedAccount.id}`)
    const conversations = await zapMeowService.getConversations(connectedAccount.id)

    console.log(`📊 ${conversations.length} conversas encontradas`)

    const formattedChats = conversations.map(conv => ({
      id: conv.id,
      contactNumber: conv.contactNumber,
      name: conv.contactName || conv.contactNumber || 'Sem nome',
      lastMessage: 'Via ZapMeow',
      timestamp: conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : Date.now(),
      isGroup: conv.isGroup,
      unreadCount: conv.unreadCount || 0,
      profilePicUrl: null
    }))

    return NextResponse.json({
      chats: formattedChats,
      total: formattedChats.length,
      accountId: connectedAccount.id,
      source: 'zapmeow'
    })

  } catch (error) {
    console.error('❌ Erro fatal ao buscar conversas:', error)
    return NextResponse.json({
      error: 'Erro ao buscar conversas',
      details: error instanceof Error ? error.message : 'Unknown error',
      chats: []
    }, { status: 500 })
  }
}