import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLeadSchema, leadFiltersSchema } from '@/lib/validations'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdsIntegrationService } from '@/lib/ads-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract tracking data from request
    const trackingData = AdsIntegrationService.extractTrackingData(request)

    // Validate input
    const validatedData = createLeadSchema.parse(body)

    // Check for existing lead with same email (if provided)
    let existingLead = null
    if (validatedData.email) {
      existingLead = await prisma.lead.findFirst({
        where: { email: validatedData.email },
      })
    }

    // If lead exists and was marked as LOST, reopen it
    if (existingLead) {
      if (existingLead.status === 'LOST') {
        const updatedLead = await prisma.$transaction(async (tx) => {
          // Update existing lead
          const lead = await tx.lead.update({
            where: { id: existingLead.id },
            data: {
              name: validatedData.name,
              phone: validatedData.phone,
              company: validatedData.company,
              roleTitle: validatedData.roleTitle,
              interest: validatedData.interest,
              notes: validatedData.notes,
              source: validatedData.source,
              utmSource: validatedData.utmSource,
              utmMedium: validatedData.utmMedium,
              utmCampaign: validatedData.utmCampaign,
              utmTerm: validatedData.utmTerm,
              utmContent: validatedData.utmContent,
              referrer: validatedData.referrer,
              status: 'NEW',
              score: 0,
              updatedAt: new Date(),
              lastActivityAt: new Date(),
            },
          })

          // Skip activity creation for public form submissions

          return lead
        })

        return NextResponse.json({
          success: true,
          data: updatedLead,
          message: 'Lead reaberto com sucesso',
        })
      } else {
        // Lead exists and is not LOST, merge data
        const mergedLead = await prisma.$transaction(async (tx) => {
          const lead = await tx.lead.update({
            where: { id: existingLead.id },
            data: {
              name: validatedData.name,
              phone: validatedData.phone || existingLead.phone,
              company: validatedData.company || existingLead.company,
              roleTitle: validatedData.roleTitle || existingLead.roleTitle,
              interest: `${existingLead.interest}\n\n--- Nova mensagem ---\n${validatedData.interest}`,
              notes: validatedData.notes ?
                `${existingLead.notes || ''}\n\n--- Nova nota ---\n${validatedData.notes}` :
                existingLead.notes,
              updatedAt: new Date(),
              lastActivityAt: new Date(),
            },
          })

          // Create activity for lead update - use admin user for system activities
          const systemUser = await tx.user.findFirst({
            where: { role: 'ADMIN' }
          })

          if (systemUser) {
            await tx.activity.create({
              data: {
                leadId: lead.id,
                userId: systemUser.id,
                type: 'CONTACTED',
                payload: JSON.stringify({
                  message: 'Lead atualizado através do formulário do site',
                  newInterest: validatedData.interest,
                }),
              },
            })
          }

          return lead
        })

        return NextResponse.json({
          success: true,
          data: mergedLead,
          message: 'Lead atualizado com sucesso',
        })
      }
    }

    // Create new lead
    const newLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone,
          company: validatedData.company,
          roleTitle: validatedData.roleTitle,
          interest: validatedData.interest,
          notes: validatedData.notes,
          source: validatedData.source || 'Website',
          utmSource: validatedData.utmSource,
          utmMedium: validatedData.utmMedium,
          utmCampaign: validatedData.utmCampaign,
          utmTerm: validatedData.utmTerm,
          utmContent: validatedData.utmContent,
          referrer: validatedData.referrer,
          consentLGPD: validatedData.consentLGPD,
          status: 'NEW',
          score: 85, // Default score for new leads
          lastActivityAt: new Date(),
        },
      })

      // Skip activity creation for public form submissions to avoid foreign key issues
      // Activities will be created later when a user interacts with the lead

      return lead
    })

    return NextResponse.json({
      success: true,
      data: newLead,
      message: 'Lead criado com sucesso',
    })
  } catch (error) {
    console.error('Error creating lead:', error)

    if (error instanceof Error && error.message.includes('Spam detectado')) {
      return NextResponse.json(
        { success: false, error: 'Spam detectado' },
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
    // Check authentication for admin routes
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = leadFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      source: searchParams.get('source') || undefined,
      utmSource: searchParams.get('utmSource') || undefined,
      utmMedium: searchParams.get('utmMedium') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    })

    // Build where clause
    const where: any = {}

    if (filters.status) where.status = filters.status
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.source) where.source = { contains: filters.source, mode: 'insensitive' }
    if (filters.utmSource) where.utmSource = { contains: filters.utmSource, mode: 'insensitive' }
    if (filters.utmMedium) where.utmMedium = { contains: filters.utmMedium, mode: 'insensitive' }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.lead.count({ where })

    // Get leads with pagination
    const leads = await prisma.lead.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tagAssignments: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            activities: true,
            tasks: true,
          },
        },
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
        leads,
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
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}