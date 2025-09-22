import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar contatos únicos das conversas do WhatsApp
    const conversations = await prisma.whatsAppConversation.findMany({
      select: {
        id: true,
        contactName: true,
        contactNumber: true,
        lastMessageAt: true,
        account: {
          select: {
            id: true,
            phoneNumber: true
          }
        }
      },
      where: {
        contactName: {
          not: null
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: 100 // Limitar a 100 contatos mais recentes
    })

    // Remover duplicatas por número de telefone
    const uniqueContacts = conversations.reduce((acc, conv) => {
      const exists = acc.find(c => c.contactNumber === conv.contactNumber)
      if (!exists) {
        acc.push({
          id: conv.id,
          contactName: conv.contactName || 'Contato sem nome',
          contactNumber: conv.contactNumber,
          lastMessageAt: conv.lastMessageAt,
          accountId: conv.account.id,
          accountPhone: conv.account.phoneNumber
        })
      }
      return acc
    }, [] as any[])

    return NextResponse.json({
      contacts: uniqueContacts,
      total: uniqueContacts.length
    })

  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}