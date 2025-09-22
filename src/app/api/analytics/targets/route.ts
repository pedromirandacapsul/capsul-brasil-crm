import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar metas' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    let whereClause: any = {
      year,
      month,
    }

    // Filter by user role
    if (userRole === 'SALES') {
      whereClause.userId = session.user.id
    } else if (userRole === 'MANAGER') {
      const teamMembers = await prisma.user.findMany({
        where: { role: 'SALES' },
        select: { id: true }
      })
      whereClause.OR = [
        { userId: session.user.id },
        { userId: { in: teamMembers.map(u => u.id) } },
        { userId: null } // General targets
      ]
    }

    const targets = await prisma.revenueTarget.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    const formattedTargets = targets.map(target => ({
      id: target.id,
      year: target.year,
      month: target.month,
      targetValue: target.targetValue,
      userId: target.userId,
      userName: target.user?.name || 'Meta Geral',
      userRole: target.user?.role || 'GENERAL'
    }))

    return NextResponse.json({
      success: true,
      targets: formattedTargets
    })

  } catch (error) {
    console.error('Error fetching targets:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_MANAGE)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para gerenciar metas' },
        { status: 403 }
      )
    }

    const { targets } = await request.json()

    if (!Array.isArray(targets)) {
      return NextResponse.json(
        { success: false, error: 'Formato inválido' },
        { status: 400 }
      )
    }

    // Process each target
    const results = []
    for (const targetData of targets) {
      const { id, year, month, targetValue, userId } = targetData

      if (!year || !month || targetValue < 0) {
        continue // Skip invalid targets
      }

      if (id) {
        // Update existing target
        const updatedTarget = await prisma.revenueTarget.update({
          where: { id },
          data: {
            targetValue,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                name: true,
                role: true
              }
            }
          }
        })
        results.push(updatedTarget)
      } else {
        // Create new target
        const targetUserId = userId === 'GENERAL' ? null : userId

        // Check if target already exists
        const existingTarget = await prisma.revenueTarget.findFirst({
          where: {
            year,
            month,
            userId: targetUserId
          }
        })

        let newTarget
        if (existingTarget) {
          // Update existing
          newTarget = await prisma.revenueTarget.update({
            where: { id: existingTarget.id },
            data: {
              targetValue,
              updatedAt: new Date()
            },
            include: {
              user: {
                select: {
                  name: true,
                  role: true
                }
              }
            }
          })
        } else {
          // Create new
          newTarget = await prisma.revenueTarget.create({
            data: {
              year,
              month,
              targetValue,
              userId: targetUserId
            },
            include: {
              user: {
                select: {
                  name: true,
                  role: true
                }
              }
            }
          })
        }
        results.push(newTarget)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} meta(s) salva(s) com sucesso`,
      targets: results
    })

  } catch (error) {
    console.error('Error saving targets:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userRole = session.user.role
    if (!hasPermission(userRole, PERMISSIONS.ANALYTICS_MANAGE)) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para gerenciar metas' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('id')

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'ID da meta é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.revenueTarget.delete({
      where: { id: targetId }
    })

    return NextResponse.json({
      success: true,
      message: 'Meta removida com sucesso'
    })

  } catch (error) {
    console.error('Error deleting target:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}