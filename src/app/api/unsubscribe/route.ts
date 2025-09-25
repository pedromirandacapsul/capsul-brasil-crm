import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Decodificar token e buscar lead
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

    // Atualizar lead para unsubscribed
    await prisma.lead.update({
      where: { email },
      data: {
        emailSubscribed: false,
        unsubscribedAt: new Date()
      }
    });

    // Log da ação
    await prisma.emailEvent.create({
      data: {
        leadEmail: email,
        eventType: 'UNSUBSCRIBED',
        eventData: JSON.stringify({ token, timestamp: new Date().toISOString() })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email removido da lista com sucesso'
    });

  } catch (error) {
    console.error('Erro ao processar unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}