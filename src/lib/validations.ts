import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20).optional(),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres').max(100).optional(),
  roleTitle: z.string().max(100).optional(),
  interest: z.string().min(10, 'Interesse deve ter pelo menos 10 caracteres').max(1000),
  notes: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  referrer: z.string().max(500).optional(),
  consentLGPD: z.boolean(),
  honeypot: z.string().max(0, 'Spam detectado').optional(),
})

export const updateLeadSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10).max(20).optional(),
  company: z.string().min(2).max(100).optional(),
  roleTitle: z.string().max(100).optional(),
  interest: z.string().min(10).max(1000).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
  score: z.number().min(0).max(100).optional(),
  ownerId: z.string().optional(),
})

export const leadFiltersSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']).optional(),
  ownerId: z.string().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(2000).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'company', 'score']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const createTaskSchema = z.object({
  leadId: z.string().min(1),
  assigneeId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueAt: z.string().datetime().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  dueAt: z.string().datetime().optional().or(z.null()),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

export const createActivitySchema = z.object({
  leadId: z.string().min(1),
  type: z.enum([
    'CREATED',
    'CONTACTED',
    'EMAIL_SENT',
    'CALL_MADE',
    'MEETING_SCHEDULED',
    'STATUS_CHANGED',
    'NOTE_ADDED',
    'TASK_CREATED',
    'TASK_COMPLETED',
  ]),
  payload: z.record(z.any()).optional(),
})

export const analyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>