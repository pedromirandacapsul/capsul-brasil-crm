import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().default('#3B82F6'),
  category: z.string().optional(),
})

const tagFiltersSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  active: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

    // Check if tag name already exists
    const existingTag = await prisma.leadTag.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      },
    })

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Uma tag com este nome já existe' },
        { status: 400 }
      )
    }

    const newTag = await prisma.leadTag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        category: validatedData.category,
      },
    })

    return NextResponse.json({
      success: true,
      data: newTag,
      message: 'Tag criada com sucesso',
    })
  } catch (error) {
    console.error('Error creating tag:', error)

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
    const filters = tagFiltersSchema.parse({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
    })

    // Build where clause
    const where: any = {}

    if (filters.category) where.category = filters.category
    if (filters.active !== undefined) where.active = filters.active

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive'
      }
    }

    const tags = await prisma.leadTag.findMany({
      where,
      include: {
        _count: {
          select: {
            leadTags: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Group by category
    const categorizedTags = tags.reduce((acc, tag) => {
      const category = tag.category || 'Sem categoria'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({
        ...tag,
        usageCount: tag._count.leadTags
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      data: {
        tags,
        categorizedTags,
        totalTags: tags.length,
        categories: Object.keys(categorizedTags)
      }
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}