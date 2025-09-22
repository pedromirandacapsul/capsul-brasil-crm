'use client'

import { useState } from 'react'
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
import { ArrowRight, CheckCircle } from 'lucide-react'

interface SendToKanbanModalProps {
  leadId: string
  leadName: string
  currentStatus: string
  onLeadMoved?: () => void
  children: React.ReactNode
}

export function SendToKanbanModal({
  leadId,
  leadName,
  currentStatus,
  onLeadMoved,
  children
}: SendToKanbanModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    newStatus: '',
    notes: ''
  })

  const statusOptions = [
    { value: 'NEW', label: 'Novo Lead', available: currentStatus !== 'NEW' },
    { value: 'CONTACTED', label: 'Primeiro Contato', available: true },
    { value: 'QUALIFIED', label: 'Lead Qualificado', available: currentStatus !== 'QUALIFIED' },
    { value: 'PROPOSAL', label: 'Proposta Enviada', available: currentStatus !== 'PROPOSAL' },
    { value: 'WON', label: 'Cliente Convertido', available: currentStatus !== 'WON' }
  ].filter(option => option.available)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.newStatus) return

    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.newStatus,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'STATUS_CHANGE',
          ...(formData.notes && {
            // TODO: Adicionar campo para notas de movimentação no futuro
            // moveNotes: formData.notes.trim()
          })
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFormData({ newStatus: '', notes: '' })
          setOpen(false)
          onLeadMoved?.()
        }
      }
    } catch (error) {
      console.error('Error moving lead to kanban:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-purple-600">
            <ArrowRight className="h-5 w-5 mr-2" />
            Mover para Pipeline
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Mover <strong>{leadName}</strong> para outra etapa do pipeline
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-600">
              <strong>Status atual:</strong> {getCurrentStatusLabel(currentStatus)}
            </p>
          </div>

          <div>
            <Label htmlFor="newStatus">Nova Etapa *</Label>
            <Select value={formData.newStatus} onValueChange={(value) => setFormData({ ...formData, newStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a nova etapa" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações da Movimentação (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Lead demonstrou interesse após reunião"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-600">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Esta mudança será registrada no histórico do lead.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.newStatus}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Movendo...' : 'Mover Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}