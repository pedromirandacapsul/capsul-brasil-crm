import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Extract filter parameters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const assigneeId = searchParams.get('assigneeId')
    const dueDateFilter = searchParams.get('dueDateFilter')
    const customDateFrom = searchParams.get('customDateFrom')
    const customDateTo = searchParams.get('customDateTo')

    // Build where clause
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }

    // Category filter
    if (category && category !== 'ALL') {
      where.category = category
    }

    // Assignee filter
    if (assigneeId && assigneeId !== 'ALL') {
      where.assigneeId = assigneeId
    }

    // Due date filters
    if (dueDateFilter && dueDateFilter !== 'all') {
      const now = new Date()

      switch (dueDateFilter) {
        case 'overdue':
          where.dueAt = {
            lt: now
          }
          where.status = { not: 'COMPLETED' }
          break
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          where.dueAt = {
            gte: todayStart,
            lte: todayEnd
          }
          break
        case 'thisWeek':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)
          where.dueAt = {
            gte: weekStart,
            lte: weekEnd
          }
          break
        case 'thisMonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          where.dueAt = {
            gte: monthStart,
            lte: monthEnd
          }
          break
        case 'custom':
          if (customDateFrom && customDateTo) {
            where.dueAt = {
              gte: new Date(customDateFrom),
              lte: new Date(customDateTo)
            }
          }
          break
      }
    }

    // Fetch filtered tasks
    const tasks = await prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    })

    // Convert to CSV
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Status',
      'Prioridade',
      'Categoria',
      'Lead',
      'Empresa',
      'Responsável',
      'Criador',
      'Data de Vencimento',
      'Data de Criação',
      'Última Atualização',
      'Subtarefas'
    ]

    const csvRows = [
      headers.join(','),
      ...tasks.map(task => {
        const row = [
          task.id,
          `"${task.title.replace(/"/g, '""')}"`,
          `"${(task.description || '').replace(/"/g, '""')}"`,
          getStatusLabel(task.status),
          getPriorityLabel(task.priority),
          getCategoryLabel(task.category),
          `"${(task.lead?.name || '').replace(/"/g, '""')}"`,
          `"${(task.lead?.company || '').replace(/"/g, '""')}"`,
          `"${(task.assignee?.name || 'Não atribuída').replace(/"/g, '""')}"`,
          `"${(task.creator?.name || '').replace(/"/g, '""')}"`,
          task.dueAt ? format(new Date(task.dueAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
          format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          task._count?.subtasks || 0
        ]
        return row.join(',')
      })
    ]

    const csv = csvRows.join('\n')

    // Generate filename with filters applied
    const filterSuffix = generateFilterSuffix({
      search,
      status,
      priority,
      category,
      assigneeId,
      dueDateFilter
    })

    const filename = `tarefas${filterSuffix}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Pendente'
    case 'IN_PROGRESS': return 'Em Progresso'
    case 'COMPLETED': return 'Concluída'
    case 'CANCELLED': return 'Cancelada'
    default: return status
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW': return 'Baixa'
    case 'MEDIUM': return 'Média'
    case 'HIGH': return 'Alta'
    case 'URGENT': return 'Urgente'
    default: return priority
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'CALL': return 'Chamada'
    case 'WHATSAPP': return 'WhatsApp'
    case 'EMAIL': return 'Email'
    case 'MEETING': return 'Reunião'
    case 'DOCUMENT': return 'Documento'
    case 'GENERAL': return 'Geral'
    default: return category
  }
}

function generateFilterSuffix(filters: any): string {
  const appliedFilters = []

  if (filters.search) appliedFilters.push('busca')
  if (filters.status && filters.status !== 'ALL') appliedFilters.push(getStatusLabel(filters.status).toLowerCase())
  if (filters.priority && filters.priority !== 'ALL') appliedFilters.push(getPriorityLabel(filters.priority).toLowerCase())
  if (filters.category && filters.category !== 'ALL') appliedFilters.push(getCategoryLabel(filters.category).toLowerCase())
  if (filters.assigneeId && filters.assigneeId !== 'ALL') appliedFilters.push('responsavel')
  if (filters.dueDateFilter && filters.dueDateFilter !== 'all') appliedFilters.push('prazo')

  return appliedFilters.length > 0 ? `_${appliedFilters.join('_')}` : '_todos'
}