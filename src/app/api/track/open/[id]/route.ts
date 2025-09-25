import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Pixel transparente 1x1 em base64
const TRANSPARENT_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trackingId = params.id;

    // Obter informações do request
    const headers = request.headers;
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    // Verificar se já foi aberto
    const tracking = await prisma.emailTracking.findUnique({
      where: { id: trackingId }
    });

    if (tracking && !tracking.openedAt) {
      // Primeira abertura
      await prisma.emailTracking.update({
        where: { id: trackingId },
        data: {
          openedAt: new Date(),
          openCount: 1,
          status: 'OPENED',
          metadata: {
            firstOpen: {
              ip: ipAddress,
              userAgent: userAgent,
              timestamp: new Date().toISOString()
            }
          }
        }
      });
    } else if (tracking) {
      // Aberturas subsequentes
      await prisma.emailTracking.update({
        where: { id: trackingId },
        data: {
          openCount: { increment: 1 },
          lastOpenedAt: new Date()
        }
      });
    }

    // Retornar pixel transparente
    const pixel = Buffer.from(TRANSPARENT_PIXEL, 'base64');

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erro ao rastrear abertura:', error);
    // Sempre retornar pixel mesmo com erro
    const pixel = Buffer.from(TRANSPARENT_PIXEL, 'base64');
    return new NextResponse(pixel, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' }
    });
  }
}