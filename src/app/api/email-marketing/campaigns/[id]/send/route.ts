import { NextResponse } from 'next/server';
import { EmailMarketingService } from '@/services/email-marketing-service';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        segments: {
          include: {
            leads: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    const emailService = EmailMarketingService.getInstance();
    const leads = campaign.segments.flatMap(s => s.leads);
    let sentCount = 0;

    for (const lead of leads) {
      try {
        await emailService.sendEmail(
          lead.email,
          campaign.template.subject,
          campaign.template.htmlContent,
          campaign.template.textContent || undefined
        );

        await prisma.emailSend.create({
          data: {
            campaignId: campaign.id,
            leadId: lead.id,
            templateId: campaign.templateId,
            status: 'SENT',
            sentAt: new Date()
          }
        });
        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar para ${lead.email}:`, error);
      }
    }

    await prisma.emailCampaign.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Erro ao enviar campanha:', error);
    return NextResponse.json({ error: 'Erro ao enviar campanha' }, { status: 500 });
  }
}