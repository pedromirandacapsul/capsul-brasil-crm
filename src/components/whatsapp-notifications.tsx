'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, MessageCircle, Wifi, CheckCircle, X } from 'lucide-react'
import { whatsappNotifications, WhatsAppNotification } from '@/lib/whatsapp-notifications'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function WhatsAppNotifications() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    // Subscribe to notifications
    whatsappNotifications.subscribe(session.user.id, (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep only last 10
      setUnreadCount(prev => prev + 1)

      // Show toast notification
      toast.custom((t) => (
        <Card className="w-96 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  {notification.type === 'new_message' && <MessageCircle className="h-4 w-4 text-blue-600" />}
                  {notification.type === 'connection_status' && <Wifi className="h-4 w-4 text-blue-600" />}
                  {notification.type === 'message_status' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                </div>
                <CardTitle className="text-sm font-medium">{notification.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.dismiss(t.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">{notification.message}</p>
            {notification.conversationId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  toast.dismiss(t.id)
                  router.push(`/admin/whatsapp/${notification.accountId}/messages`)
                }}
              >
                Ver Conversa
              </Button>
            )}
          </CardContent>
        </Card>
      ), {
        duration: 5000,
        position: 'top-right',
      })
    })

    // Load initial unread count
    whatsappNotifications.getUnreadCount(session.user.id).then(setUnreadCount)

    return () => {
      whatsappNotifications.unsubscribe(session.user.id)
    }
  }, [session?.user?.id, router])

  const markAsRead = async (notificationIds: string[]) => {
    if (!session?.user?.id) return

    try {
      await whatsappNotifications.markAsRead(session.user.id, notificationIds)
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle className="h-4 w-4" />
      case 'connection_status':
        return <Wifi className="h-4 w-4" />
      case 'message_status':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  if (!session?.user) return null

  return (
    <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações WhatsApp</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead([notification.id])
                  }
                  if (notification.conversationId) {
                    setShowDropdown(false)
                    router.push(`/admin/whatsapp/${notification.accountId}/messages`)
                  }
                }}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={`p-1 rounded-full ${notification.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center text-blue-600 hover:text-blue-800"
          onClick={() => {
            setShowDropdown(false)
            router.push('/admin/whatsapp')
          }}
        >
          Ver todas as conversas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}