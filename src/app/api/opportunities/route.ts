import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'
import { opportunityWebhooks } from '@/services/webhook-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar oportunidades' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const ownerId = searchParams.get('owner_id')
    const stage = searchParams.get('stage')
    const expectedCloseFrom = searchParams.get('expected_close_from')
    const expectedCloseTo = searchParams.get('expected_close_to')
    const createdFrom = searchParams.get('created_from')
    const createdTo = searchParams.get('created_to')
    const source = searchParams.get('source')

    const skip = (page - 1) * limit

    // Build where clause based on role and filters
    let whereClause: any = {}

    // Role-based filtering
    if (userRole === 'SALES') {
      whereClause.ownerId = session.user.id
    } else if (userRole === 'MANAGER') {
      // Manager sees opportunities from their team
      const teamMembers = await prisma.user.findMany({
        where: { role: 'SALES' },
        select: { id: true }
      })
      whereClause.ownerId = {
        in: [...teamMembers.map(u => u.id), session.user.id]
      }
    }
    // ADMIN sees all

    // Apply filters
    if (ownerId) {
      whereClause.ownerId = ownerId
    }
    if (stage) {
      whereClause.stage = stage
    }
    if (expectedCloseFrom || expectedCloseTo) {
      whereClause.expectedCloseAt = {}
      if (expectedCloseFrom) {
        whereClause.expectedCloseAt.gte = new Date(expectedCloseFrom)
      }
      if (expectedCloseTo) {
        whereClause.expectedCloseAt.lte = new Date(expectedCloseTo)
      }
    }
    if (createdFrom || createdTo) {
      whereClause.createdAt = {}
      if (createdFrom) {
        whereClause.createdAt.gte = new Date(createdFrom)
      }
      if (createdTo) {
        whereClause.createdAt.lte = new Date(createdTo)
      }
    }
    if (source) {
      whereClause.lead = {
        source: source
      }
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where: whereClause,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              source: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.opportunity.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Prisma instance:', typeof prisma, !!prisma)
    const session = await getServerSession(authOptions)

    // Controle de bypass via variável de ambiente (para desenvolvimento)
    const skipAuth = process.env.SKIP_AUTH_IN_DEVELOPMENT === 'true'

    if (!session && !skipAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session?.user?.role || 'ADMIN'
    if (!skipAuth && !hasPermission(userRole, PERMISSIONS.OPPORTUNITIES_CREATE)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar oportunidades' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Creating opportunity with data:', body)

    const { leadId, ownerId, stage = 'NEW', amountBr, expectedCloseAt, discountPct, costEstimatedBr } = body

    // Validate required fields
    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID é obrigatório' },
        { status: 400 }
      )
    }

    // Validate stage rules
    if (['PROPOSAL', 'NEGOTIATION'].includes(stage) && !amountBr) {
      return NextResponse.json(
        { success: false, error: 'Valor é obrigatório para estágios PROPOSAL e NEGOTIATION' },
        { status: 400 }
      )
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Get stage probability
    console.log('Getting stage probability for:', stage)
    let stageProbability = null
    let probability = 0

    try {
      stageProbability = await prisma.stageProbability.findUnique({
        where: { stage }
      })
      console.log('Stage probability found:', stageProbability)
      probability = stageProbability?.probability || 0
    } catch (stageError) {
      console.log('Stage probability error:', stageError.message)
      // Default probabilities by stage
      const defaultProbabilities: Record<string, number> = {
        'NEW': 10,
        'QUALIFICATION': 25,
        'DISCOVERY': 40,
        'PROPOSAL': 60,
        'NEGOTIATION': 80,
        'WON': 100,
        'LOST': 0
      }
      probability = defaultProbabilities[stage] || 10
    }
    console.log('Using probability:', probability)

    const createData = {
      leadId,
      ownerId: ownerId || session?.user?.id || 'cmfvq4tnh0000nce5axicbr1u',
      stage,
      amountBr,
      probability,
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      discountPct,
      costEstimatedBr
    }
    console.log('Creating opportunity with data:', createData)

    const opportunity = await prisma.opportunity.create({
      data: createData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            source: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create stage history entry
    await prisma.stageHistory.create({
      data: {
        opportunityId: opportunity.id,
        stageFrom: null,
        stageTo: stage,
        changedBy: session?.user?.id || 'cmfvq4tnh0000nce5axicbr1u'
      }
    })

    // Trigger webhook for opportunity creation
    try {
      await opportunityWebhooks.created({
        opportunity,
        createdBy: {
          id: session?.user?.id || 'cmfvq4tnh0000nce5axicbr1u',
          name: session?.user?.name || 'System',
          email: session?.user?.email || 'system@capsul.com'
        }
      })
    } catch (webhookError) {
      console.error('Webhook error for opportunity creation:', webhookError)
      // Don't fail the API call if webhook fails
    }

    return NextResponse.json({
      success: true,
      data: opportunity
    })

  } catch (error) {
    console.error('Error creating opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}