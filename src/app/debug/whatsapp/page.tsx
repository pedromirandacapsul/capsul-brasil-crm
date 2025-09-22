import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getWhatsAppData() {
  try {
    const accounts = await prisma.whatsAppAccount.findMany({
      where: {
        status: 'CONNECTED'
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: {
                timestamp: 'desc'
              },
              take: 3
            },
            _count: {
              select: {
                messages: true
              }
            }
          },
          orderBy: {
            lastMessageAt: 'desc'
          },
          take: 10
        }
      }
    })

    return accounts
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error)
    return []
  }
}

export default async function DebugWhatsAppPage() {
  const accounts = await getWhatsAppData()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug WhatsApp - Conversas e Mensagens</h1>

      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Nenhuma conta WhatsApp conectada encontrada.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white border border-gray-200 rounded-lg shadow">
              <div className="bg-green-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-green-800">
                  📱 {account.phoneNumber} - {account.displayName || 'WhatsApp'}
                </h2>
                <p className="text-sm text-green-600">
                  Status: {account.status} | Conversas: {account.conversations.length}
                </p>
              </div>

              <div className="p-6">
                {account.conversations.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhuma conversa encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {account.conversations.map((conversation) => (
                      <div key={conversation.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {conversation.contactName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {conversation.contactNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">
                              {conversation.lastMessageAt &&
                                formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                  addSuffix: true,
                                  locale: ptBR
                                })
                              }
                            </span>
                            <p className="text-sm font-medium text-blue-600">
                              {conversation._count.messages} mensagens
                            </p>
                          </div>
                        </div>

                        {conversation.messages.length > 0 && (
                          <div className="bg-gray-50 rounded p-3 space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Últimas mensagens:</h4>
                            {conversation.messages.map((message) => (
                              <div key={message.id} className="text-sm">
                                <span className={`inline-block px-2 py-1 rounded text-xs ${
                                  message.direction === 'INBOUND'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {message.direction === 'INBOUND' ? '📥 Recebida' : '📤 Enviada'}
                                </span>
                                <span className="ml-2 text-gray-600">
                                  {message.content.length > 100
                                    ? message.content.substring(0, 100) + '...'
                                    : message.content
                                  }
                                </span>
                                <span className="ml-2 text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(message.timestamp), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <a
          href="/admin/whatsapp"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ← Voltar para WhatsApp Admin
        </a>
      </div>
    </div>
  )
}