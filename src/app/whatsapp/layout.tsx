'use client'

import { AdminLayout } from '@/components/layout/admin-layout'

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}