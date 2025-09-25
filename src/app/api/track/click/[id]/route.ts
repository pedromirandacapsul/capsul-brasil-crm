import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackingId = params.id;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || '/');
    }

    // Registrar clique
    await prisma.emailClick.create({
      data: {
        trackingId,
        url: targetUrl,
        clickedAt: new Date()
      }
    });

    // Atualizar contadores
    await prisma.emailTracking.update({
      where: { id: trackingId },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date(),
        status: 'CLICKED'
      }
    });

    // Redirecionar para URL original
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Erro ao rastrear clique:', error);
    // Em caso de erro, redirecionar para home
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || '/');
  }
}