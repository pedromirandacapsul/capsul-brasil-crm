'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const opportunitySchema = z.object({
  status: z.enum(['QUALIFIED', 'PROPOSAL', 'WON', 'LOST'], {
    required_error: "Status é obrigatório para criar oportunidade"
  }),
  amount: z.number().optional(),
  lossReason: z.string().optional(),
  lossDetails: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  if (data.status === 'PROPOSAL' && (!data.amount || data.amount <= 0)) {
    return false
  }
  if (data.status === 'LOST' && !data.lossReason) {
    return false
  }
  return true
}, {
  message: "Campos obrigatórios não preenchidos",
  path: ["status"]
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface SendToOpportunitiesModalProps {
  leadId: string
  leadName: string
  currentStatus: string
  onOpportunityCreated?: () => void
  children: React.ReactNode
}

const statusLabels = {
  'QUALIFIED': 'Qualificado',
  'PROPOSAL': 'Proposta',
  'WON': 'Ganho',
  'LOST': 'Perdido'
}

const statusDescriptions = {
  'QUALIFIED': 'Lead qualificado pronto para virar oportunidade',
  'PROPOSAL': 'Proposta enviada (requer valor)',
  'WON': 'Negócio fechado com sucesso',
  'LOST': 'Oportunidade perdida (requer motivo)'
}

export function SendToOpportunitiesModal({
  leadId,
  leadName,
  currentStatus,
  onOpportunityCreated,
  children
}: SendToOpportunitiesModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      status: 'QUALIFIED'
    }
  })

  const selectedStatus = watch('status')

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      setLoading(true)

      // Primeiro atualizar o status do lead
      const updateResponse = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          dealValue: data.amount,  // Mapear amount para dealValue
          lossReason: data.lossReason,
          lossDetails: data.lossDetails
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Falha ao atualizar o lead')
      }

      const result = await updateResponse.json()

      if (result.success) {
        const statusMessages = {
          'QUALIFIED': `Lead ${leadName} foi qualificado e está agora no pipeline de oportunidades!`,
          'PROPOSAL': `Proposta criada para ${leadName} com valor de R$ ${data.amount?.toLocaleString('pt-BR') || '0'}!`,
          'WON': `🎉 Parabéns! Negócio fechado com ${leadName}!`,
          'LOST': `Oportunidade marcada como perdida. Motivo: ${data.lossReason || 'Não especificado'}`
        }

        toast({
          title: "✅ Oportunidade atualizada!",
          description: statusMessages[data.status] || `Lead ${leadName} foi convertido em oportunidade com sucesso.`,
          action: (
            <button
              onClick={() => window.open('/admin/opportunities', '_blank')}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Ver Pipeline
            </button>
          )
        })

        setOpen(false)
        reset()
        onOpportunityCreated?.()
      } else {
        throw new Error(result.error || 'Erro ao criar oportunidade')
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : 'Erro interno do servidor',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="opportunity-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Enviar para Oportunidades</span>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div id="opportunity-dialog-description" className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Convertendo Lead: {leadName}
                </p>
                <p className="text-xs text-blue-600">
                  Esta ação criará uma oportunidade automaticamente
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Novo Status *</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-gray-500">
                          {statusDescriptions[value as keyof typeof statusDescriptions]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            {selectedStatus === 'PROPOSAL' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="amount">Valor da Proposta *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  Valor obrigatório para propostas
                </p>
              </motion.div>
            )}

            {selectedStatus === 'LOST' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="lossReason">Motivo da Perda *</Label>
                  <Select onValueChange={(value) => setValue('lossReason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE">Preço muito alto</SelectItem>
                      <SelectItem value="COMPETITOR">Escolheu concorrente</SelectItem>
                      <SelectItem value="NO_BUDGET">Sem orçamento</SelectItem>
                      <SelectItem value="NO_DECISION">Não tomou decisão</SelectItem>
                      <SelectItem value="NOT_INTERESTED">Perdeu interesse</SelectItem>
                      <SelectItem value="TIMING">Timing inadequado</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lossDetails">Detalhes da Perda</Label>
                  <Textarea
                    id="lossDetails"
                    placeholder="Descreva os detalhes da perda..."
                    {...register('lossDetails')}
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a conversão..."
                {...register('notes')}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Criando...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Criar Oportunidade</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}