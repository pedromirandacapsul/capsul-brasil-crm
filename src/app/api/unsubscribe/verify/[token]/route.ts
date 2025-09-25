import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Decodificar token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [email, timestamp] = decoded.split('|');

      if (!email || !timestamp) {
        return NextResponse.json(
          { success: false, error: 'Token inválido' },
          { status: 400 }
        );
      }

      // Verificar se token não expirou (48 horas)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const fortyEightHours = 48 * 60 * 60 * 1000;

      if (now - tokenTime > fortyEightHours) {
        return NextResponse.json(
          { success: false, error: 'Token expirado' },
          { status: 400 }
        );
      }

      // Buscar lead
      const lead = await prisma.lead.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          emailSubscribed: true
        }
      });

      if (!lead) {
        return NextResponse.json(
          { success: false, error: 'Lead não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        lead
      });

    } catch (decodeError) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}