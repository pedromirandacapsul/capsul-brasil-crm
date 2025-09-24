// Mock do Nodemailer
jest.mock('nodemailer')

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    emailCampaignNew: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      findMany: jest.fn(),
    },
    emailOpen: {
      create: jest.fn(),
    },
    emailClick: {
      create: jest.fn(),
    },
    emailRecipient: {
      update: jest.fn(),
    },
  },
}))

import { EmailMarketingService } from '../email-marketing-service'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// Mock das variáveis de ambiente
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    SMTP_PROVIDER: 'mailhog',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_FROM: 'test@capsul.com.br',
    SMTP_FROM_NAME: 'Test CRM',
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('EmailMarketingService', () => {
  let service: EmailMarketingService

  beforeEach(() => {
    // Resetar singleton para testes
    ;(EmailMarketingService as any).instance = undefined
    service = EmailMarketingService.getInstance()
  })

  describe('Teste de Email', () => {
    it('deve simular envio em ambiente de desenvolvimento', async () => {
      process.env.NODE_ENV = 'development'
      process.env.SMTP_PROVIDER = 'mailhog'

      const result = await service.testEmailConfiguration('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toContain('simulado com sucesso')
      expect(result.info?.provider).toBe('SIMULADO')
    })
  })

  describe('Métricas', () => {
    it('deve calcular métricas gerais com dados vazios', async () => {
      ;(prisma.emailCampaignNew.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.emailTemplate.count as jest.Mock).mockResolvedValue(0)

      const result = await service.getOverallMetrics()

      expect(result).toEqual({
        totalCampaigns: 0,
        totalEmailsSent: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        activeTemplates: 0,
      })
    })

    it('deve calcular métricas gerais com dados de campanhas', async () => {
      const mockCampaigns = [
        {
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 47,
          clickedCount: 12,
        },
        {
          sentCount: 200,
          deliveredCount: 190,
          openedCount: 76,
          clickedCount: 19,
        },
      ]

      ;(prisma.emailCampaignNew.findMany as jest.Mock).mockResolvedValue(mockCampaigns)
      ;(prisma.emailTemplate.count as jest.Mock).mockResolvedValue(5)

      const result = await service.getOverallMetrics()

      expect(result.totalCampaigns).toBe(2)
      expect(result.totalEmailsSent).toBe(300)
      expect(result.activeTemplates).toBe(5)
      expect(result.avgOpenRate).toBeCloseTo(43.16, 1)
      expect(result.avgClickRate).toBeCloseTo(25.20, 1)
    })
  })

  describe('Tracking', () => {
    it('deve registrar abertura de email', async () => {
      ;(prisma.emailOpen.create as jest.Mock).mockResolvedValue({})
      ;(prisma.emailRecipient.update as jest.Mock).mockResolvedValue({})
      ;(prisma.emailCampaignNew.update as jest.Mock).mockResolvedValue({})

      await service.trackEmailOpen('campaign-1', 'recipient-1', '192.168.1.1', 'Mozilla/5.0')

      expect(prisma.emailOpen.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-1',
          recipientId: 'recipient-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      })

      expect(prisma.emailRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          lastOpenedAt: expect.any(Date),
          openCount: { increment: 1 },
        },
      })

      expect(prisma.emailCampaignNew.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { openedCount: { increment: 1 } },
      })
    })

    it('deve registrar clique em email', async () => {
      ;(prisma.emailClick.create as jest.Mock).mockResolvedValue({})
      ;(prisma.emailRecipient.update as jest.Mock).mockResolvedValue({})
      ;(prisma.emailCampaignNew.update as jest.Mock).mockResolvedValue({})

      await service.trackEmailClick(
        'campaign-1',
        'recipient-1',
        'https://example.com',
        'Clique aqui',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(prisma.emailClick.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-1',
          recipientId: 'recipient-1',
          url: 'https://example.com',
          linkText: 'Clique aqui',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      })

      expect(prisma.emailRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recipient-1' },
        data: {
          lastClickedAt: expect.any(Date),
          clickCount: { increment: 1 },
        },
      })

      expect(prisma.emailCampaignNew.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { clickedCount: { increment: 1 } },
      })
    })
  })
})