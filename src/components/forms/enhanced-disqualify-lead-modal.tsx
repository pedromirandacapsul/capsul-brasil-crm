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
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react'

const disqualifySchema = z.object({
  reason: z.string().min(1, "Motivo é obrigatório"),
  details: z.string().optional()
})

type DisqualifyFormData = z.infer<typeof disqualifySchema>

interface EnhancedDisqualifyLeadModalProps {
  leadId: string
  leadName: string
  onLeadDisqualified?: () => void
  children: React.ReactNode
}

export function EnhancedDisqualifyLeadModal({
  leadId,
  leadName,
  onLeadDisqualified,
  children
}: EnhancedDisqualifyLeadModalProps) {
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
  } = useForm<DisqualifyFormData>({
    resolver: zodResolver(disqualifySchema),
    mode: 'onChange'
  })

  const watchedReason = watch('reason')

  const lossReasons = [
    { value: 'SEM_BUDGET', label: 'Sem budget/verba' },
    { value: 'SEM_INTERESSE', label: 'Sem interesse' },
    { value: 'CONCORRENCIA', label: 'Escolheu concorrência' },
    { value: 'FORA_PERFIL', label: 'Fora do perfil' },
    { value: 'TIMING', label: 'Timing inadequado' },
    { value: 'NAO_RESPONDE', label: 'Não responde/não atende' },
    { value: 'PRECO', label: 'Preço muito alto' },
    { value: 'SOLUCAO_INTERNA', label: 'Solução interna' },
    { value: 'OUTRO', label: 'Outro motivo' }
  ]

  const onSubmit = async (data: DisqualifyFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'LOST',
          lossReason: data.reason,
          lossDetails: data.details?.trim() || null,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'DISQUALIFIED'
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
            onLeadDisqualified?.()
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error disqualifying lead:', error)
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
            </motion.div>
            Desqualificar Lead
          </DialogTitle>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            Desqualificar o lead <strong>{leadName}</strong>
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
                className="rounded-full bg-green-100 p-3"
              >
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-green-600 font-medium"
              >
                Lead desqualificado com sucesso!
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="reason">Motivo da Desqualificação *</Label>
                <Select value={watchedReason} onValueChange={(value) => setValue('reason', value, { shouldValidate: true })}>
                  <SelectTrigger className={errors.reason ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {lossReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {errors.reason && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-600 mt-1"
                    >
                      {errors.reason.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="details">Detalhes (opcional)</Label>
                <Textarea
                  {...register('details')}
                  id="details"
                  placeholder="Ex: Informou que vai aguardar próximo ano para decidir"
                  rows={3}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-red-50 border border-red-200 rounded-md p-3"
              >
                <p className="text-sm text-red-600">
                  <strong>Atenção:</strong> Esta ação marcará o lead como "Perdido" e ele sairá da lista de leads ativos.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                    variant="destructive"
                    disabled={loading || !isValid}
                    className="relative overflow-hidden"
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
                          Desqualificando...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Desqualificar Lead
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