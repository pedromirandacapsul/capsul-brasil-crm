'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { ArrowRight, CheckCircle, CheckCircle2, TrendingUp } from 'lucide-react'

const kanbanSchema = z.object({
  newStatus: z.string().min(1, "Nova etapa é obrigatória"),
  notes: z.string().optional()
})

type KanbanFormData = z.infer<typeof kanbanSchema>

interface EnhancedSendToKanbanModalProps {
  leadId: string
  leadName: string
  currentStatus: string
  onLeadMoved?: () => void
  children: React.ReactNode
}

export function EnhancedSendToKanbanModal({
  leadId,
  leadName,
  currentStatus,
  onLeadMoved,
  children
}: EnhancedSendToKanbanModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<KanbanFormData>({
    resolver: zodResolver(kanbanSchema),
    mode: 'onChange'
  })

  const watchedStatus = watch('newStatus')

  const statusOptions = [
    { value: 'NEW', label: 'Novo Lead', available: currentStatus !== 'NEW', icon: '🆕', color: 'blue' },
    { value: 'CONTACTED', label: 'Primeiro Contato', available: true, icon: '📞', color: 'green' },
    { value: 'QUALIFIED', label: 'Lead Qualificado', available: currentStatus !== 'QUALIFIED', icon: '✅', color: 'purple' },
    { value: 'PROPOSAL', label: 'Proposta Enviada', available: currentStatus !== 'PROPOSAL', icon: '📄', color: 'orange' },
    { value: 'WON', label: 'Cliente Convertido', available: currentStatus !== 'WON', icon: '🎉', color: 'green' }
  ].filter(option => option.available)

  const onSubmit = async (data: KanbanFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.newStatus,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'STATUS_CHANGE',
          ...(data.notes && {
            // TODO: Implementar campo de notas de movimentação no futuro
          })
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSuccess(true)
          setTimeout(() => {
            reset()
            setOpen(false)
            setSuccess(false)
            onLeadMoved?.()
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error moving lead to kanban:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      reset()
      setSuccess(false)
    }
    setOpen(newOpen)
  }

  const getCurrentStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      NEW: 'Novo',
      NOT_ANSWERED_1: 'Não Atendido (1ª)',
      NOT_ANSWERED_2: 'Não Atendido (2ª)',
      CONTACTED: 'Contatado',
      QUALIFIED: 'Qualificado',
      PROPOSAL: 'Proposta',
      WON: 'Ganho',
      LOST: 'Perdido',
    }
    return statusLabels[status] || status
  }

  const getSelectedStatusInfo = () => {
    return statusOptions.find(option => option.value === watchedStatus)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-purple-600">
            <motion.div
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <ArrowRight className="h-5 w-5 mr-2" />
            </motion.div>
            Mover para Pipeline
          </DialogTitle>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            Mover <strong>{leadName}</strong> para outra etapa do pipeline
          </motion.p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="rounded-full bg-purple-100 p-3"
              >
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-purple-600 font-medium"
              >
                Lead movido com sucesso!
              </motion.p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 border border-gray-200 rounded-md p-3"
              >
                <p className="text-sm text-gray-600">
                  <strong>Status atual:</strong> {getCurrentStatusLabel(currentStatus)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="newStatus">Nova Etapa *</Label>
                <Select value={watchedStatus} onValueChange={(value) => setValue('newStatus', value, { shouldValidate: true })}>
                  <SelectTrigger className={errors.newStatus ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecione a nova etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center space-x-2">
                          <span>{status.icon}</span>
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {errors.newStatus && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-600 mt-1"
                    >
                      {errors.newStatus.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Status Preview */}
              <AnimatePresence>
                {watchedStatus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-purple-50 border border-purple-200 rounded-md p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">{getCurrentStatusLabel(currentStatus)}</span>
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-700">
                          {getSelectedStatusInfo()?.icon} {getSelectedStatusInfo()?.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="notes">Observações da Movimentação (opcional)</Label>
                <Textarea
                  {...register('notes')}
                  id="notes"
                  placeholder="Ex: Lead demonstrou interesse após reunião"
                  rows={2}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 border border-blue-200 rounded-md p-3"
              >
                <p className="text-sm text-blue-600">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Esta mudança será registrada no histórico do lead.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-end space-x-2"
              >
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || !isValid}
                    className="bg-purple-600 hover:bg-purple-700 relative overflow-hidden"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Movendo...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Mover Lead
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}