'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'

const followUpSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Hora é obrigatória"),
  type: z.string().min(1, "Tipo de ação é obrigatório"),
  notes: z.string().optional()
}).refine((data) => {
  const selectedDateTime = new Date(`${data.date}T${data.time}`)
  const now = new Date()
  return selectedDateTime > now
}, {
  message: "Data e hora devem ser no futuro",
  path: ["date"]
})

type FollowUpFormData = z.infer<typeof followUpSchema>

interface EnhancedScheduleFollowUpModalProps {
  leadId: string
  leadName: string
  onFollowUpScheduled?: () => void
  children: React.ReactNode
}

export function EnhancedScheduleFollowUpModal({
  leadId,
  leadName,
  onFollowUpScheduled,
  children
}: EnhancedScheduleFollowUpModalProps) {
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
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    mode: 'onChange'
  })

  const watchedType = watch('type')

  const actionTypes = [
    { value: 'CALL', label: 'Ligação', icon: '📞' },
    { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
    { value: 'EMAIL', label: 'E-mail', icon: '📧' },
    { value: 'MEETING', label: 'Reunião', icon: '🤝' }
  ]

  const onSubmit = async (data: FollowUpFormData) => {
    setLoading(true)
    try {
      const nextActionAt = new Date(`${data.date}T${data.time}:00`).toISOString()

      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nextActionAt,
          nextActionType: data.type,
          nextActionNotes: data.notes?.trim() || null,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'FOLLOW_UP_SCHEDULED'
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
            onFollowUpScheduled?.()
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
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

  const today = new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <Calendar className="h-5 w-5 mr-2" />
            </motion.div>
            Agendar Follow-up
          </DialogTitle>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            Agendar próxima ação para <strong>{leadName}</strong>
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
                Follow-up agendado com sucesso!
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
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    {...register('date')}
                    id="date"
                    type="date"
                    min={today}
                    className={errors.date ? 'border-red-300' : ''}
                  />
                  <AnimatePresence>
                    {errors.date && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-600 mt-1"
                      >
                        {errors.date.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <Label htmlFor="time">Hora *</Label>
                  <Input
                    {...register('time')}
                    id="time"
                    type="time"
                    className={errors.time ? 'border-red-300' : ''}
                  />
                  <AnimatePresence>
                    {errors.time && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-600 mt-1"
                      >
                        {errors.time.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="type">Tipo de Ação *</Label>
                <Select value={watchedType} onValueChange={(value) => setValue('type', value, { shouldValidate: true })}>
                  <SelectTrigger className={errors.type ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecione o tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {errors.type && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-600 mt-1"
                    >
                      {errors.type.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  {...register('notes')}
                  id="notes"
                  placeholder="Ex: Ligar para discutir proposta comercial"
                  rows={3}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 border border-blue-200 rounded-md p-3"
              >
                <p className="text-sm text-blue-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Este agendamento aparecerá na sua agenda e será lembrado automaticamente.
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
                    className="bg-blue-600 hover:bg-blue-700 relative overflow-hidden"
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
                          Agendando...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Agendar Follow-up
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