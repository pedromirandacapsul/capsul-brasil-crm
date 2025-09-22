'use client'

import { useState } from 'react'
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
import { Calendar } from 'lucide-react'

interface ScheduleFollowUpModalProps {
  leadId: string
  leadName: string
  onFollowUpScheduled?: () => void
  children: React.ReactNode
}

export function ScheduleFollowUpModal({
  leadId,
  leadName,
  onFollowUpScheduled,
  children
}: ScheduleFollowUpModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    notes: ''
  })

  const actionTypes = [
    { value: 'CALL', label: 'Ligação' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'E-mail' },
    { value: 'MEETING', label: 'Reunião' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.time || !formData.type) return

    setLoading(true)
    try {
      // Combinar data e hora em uma string ISO
      const nextActionAt = new Date(`${formData.date}T${formData.time}:00`).toISOString()

      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nextActionAt,
          nextActionType: formData.type,
          nextActionNotes: formData.notes.trim() || null,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'FOLLOW_UP_SCHEDULED'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFormData({ date: '', time: '', type: '', notes: '' })
          setOpen(false)
          onFollowUpScheduled?.()
        }
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
    } finally {
      setLoading(false)
    }
  }

  // Obter data mínima (hoje)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Follow-up</DialogTitle>
          <p className="text-sm text-gray-600">
            Agendar próxima ação para <strong>{leadName}</strong>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Tipo de Ação</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Ligar para discutir proposta comercial"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.date || !formData.time || !formData.type}
            >
              {loading ? 'Agendando...' : 'Agendar Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}