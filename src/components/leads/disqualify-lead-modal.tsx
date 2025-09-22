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
import { X, AlertTriangle } from 'lucide-react'

interface DisqualifyLeadModalProps {
  leadId: string
  leadName: string
  onLeadDisqualified?: () => void
  children: React.ReactNode
}

export function DisqualifyLeadModal({
  leadId,
  leadName,
  onLeadDisqualified,
  children
}: DisqualifyLeadModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reason: '',
    details: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.reason) return

    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'LOST',
          lossReason: formData.reason,
          lossDetails: formData.details.trim() || null,
          lastInteractionAt: new Date().toISOString(),
          lastInteractionType: 'DISQUALIFIED'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFormData({ reason: '', details: '' })
          setOpen(false)
          onLeadDisqualified?.()
        }
      }
    } catch (error) {
      console.error('Error disqualifying lead:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Desqualificar Lead
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Desqualificar o lead <strong>{leadName}</strong>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Motivo da Desqualificação *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor="details">Detalhes (opcional)</Label>
            <Textarea
              id="details"
              placeholder="Ex: Informou que vai aguardar próximo ano para decidir"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              rows={3}
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">
              <strong>Atenção:</strong> Esta ação marcará o lead como "Perdido" e ele sairá da lista de leads ativos.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !formData.reason}
            >
              {loading ? 'Desqualificando...' : 'Desqualificar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}