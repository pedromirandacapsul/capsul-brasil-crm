import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, templateId, segmentIds, variants, settings } = body;

    // Validações
    if (!name || !templateId || !variants.A.subject || !variants.B.subject) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Criar teste A/B
    const abTest = await prisma.aBTest.create({
      data: {
        name,
        status: 'DRAFT',
        templateId,
        segmentIds: JSON.stringify(segmentIds || []),
        variantA: JSON.stringify(variants.A),
        variantB: JSON.stringify(variants.B),
        settings: JSON.stringify(settings),
        userId: 'user-admin' // TODO: pegar do contexto de auth
      }
    });

    return NextResponse.json({
      success: true,
      data: abTest,
      message: 'Teste A/B criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar teste A/B:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar teste A/B' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const abTests = await prisma.aBTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: abTests
    });

  } catch (error) {
    console.error('Erro ao buscar testes A/B:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar testes A/B' },
      { status: 500 }
    );
  }
}