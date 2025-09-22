import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'DOCUMENT', 'GENERAL']).default('GENERAL'),
  dueAt: z.union([
    z.string().transform(str => str ? new Date(str) : null),
    z.null()
  ]).optional(),
  leadId: z.string().min(1, 'Lead é obrigatório'),
  opportunityId: z.string().optional(), // Permite vincular tarefa a oportunidade
  assigneeId: z.string().min(1, 'Responsável é obrigatório'),
})

const taskFiltersSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  search: z.string().optional(),
  dueDateFilter: z.enum(['all', 'today', 'tomorrow', 'this_week', 'overdue', 'custom']).optional(),
  customDateFrom: z.string().optional(),
  customDateTo: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
  sortBy: z.enum(['createdAt', 'dueAt', 'title', 'priority', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    const validatedData = createTaskSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: validatedData.leadId },
    })
    console.log('Lead found:', lead)

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({
      where: { id: validatedData.assigneeId },
    })
    console.log('Assignee found:', assignee)

    if (!assignee) {
      return NextResponse.json(
        { success: false, error: 'Responsável não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a oportunidade existe (se fornecida)
    if (validatedData.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: validatedData.opportunityId },
      })

      if (!opportunity) {
        return NextResponse.json(
          { success: false, error: 'Oportunidade não encontrada' },
          { status: 404 }
        )
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        category: validatedData.category,
        dueAt: validatedData.dueAt,
        leadId: validatedData.leadId,
        opportunityId: validatedData.opportunityId,
        assigneeId: validatedData.assigneeId,
        creatorId: session.user.id,
      },
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
        opportunity: {
          select: {
            id: true,
            stage: true,
            amountBr: true,
            lead: {
              select: {
                name: true,
                company: true
              }
            }
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Tarefa criada com sucesso',
    })
  } catch (error) {
    console.error('Error creating task:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = taskFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      leadId: searchParams.get('leadId') || undefined,
      search: searchParams.get('search') || undefined,
      dueDateFilter: searchParams.get('dueDateFilter') as any || undefined,
      customDateFrom: searchParams.get('customDateFrom') || undefined,
      customDateTo: searchParams.get('customDateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    })

    // Build where clause
    const where: any = {}

    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.category) where.category = filters.category
    if (filters.assigneeId) where.assigneeId = filters.assigneeId
    if (filters.leadId) where.leadId = filters.leadId

    // Date filters
    if (filters.dueDateFilter && filters.dueDateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      switch (filters.dueDateFilter) {
        case 'today':
          where.dueAt = {
            gte: today,
            lt: tomorrow
          }
          break
        case 'tomorrow':
          where.dueAt = {
            gte: tomorrow,
            lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          }
          break
        case 'this_week':
          where.dueAt = {
            gte: today,
            lte: nextWeek
          }
          break
        case 'overdue':
          where.dueAt = {
            lt: today
          }
          where.status = {
            not: 'COMPLETED'
          }
          break
        case 'custom':
          if (filters.customDateFrom || filters.customDateTo) {
            where.dueAt = {}
            if (filters.customDateFrom) {
              where.dueAt.gte = new Date(filters.customDateFrom)
            }
            if (filters.customDateTo) {
              where.dueAt.lte = new Date(filters.customDateTo)
            }
          }
          break
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { lead: { name: { contains: filters.search, mode: 'insensitive' } } },
        { lead: { company: { contains: filters.search, mode: 'insensitive' } } },
        { assignee: { name: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    // Get total count
    const total = await prisma.task.count({ where })

    // Get tasks with pagination
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
        subtasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            subtasks: true
          }
        }
      },
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    })

    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
          hasNext: filters.page < totalPages,
          hasPrev: filters.page > 1,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}