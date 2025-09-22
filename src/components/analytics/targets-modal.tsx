'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, Plus, Trash2, DollarSign, User, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  name: string
  role: string
}

interface Target {
  id?: string
  year: number
  month: number
  targetValue: number
  userId: string | null
  userName?: string
}

interface TargetsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function TargetsModal({ isOpen, onClose, onSave }: TargetsModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchTargets()
    }
  }, [isOpen, selectedYear, selectedMonth])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: User) => ['SALES', 'MANAGER'].includes(user.role)))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTargets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/targets?year=${selectedYear}&month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        setTargets(data.targets || [])
      }
    } catch (error) {
      console.error('Error fetching targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTarget = () => {
    setTargets([...targets, {
      year: selectedYear,
      month: selectedMonth,
      targetValue: 0,
      userId: null
    }])
  }

  const updateTarget = (index: number, field: keyof Target, value: any) => {
    const newTargets = [...targets]
    newTargets[index] = { ...newTargets[index], [field]: value }

    // Update userName when userId changes
    if (field === 'userId') {
      const user = users.find(u => u.id === value)
      newTargets[index].userName = user?.name || 'Meta Geral'
    }

    setTargets(newTargets)
  }

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index))
  }

  const saveTargets = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/analytics/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targets: targets.map(target => ({
            ...target,
            userId: target.userId === 'GENERAL' ? null : target.userId
          }))
        }),
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        console.error('Error saving targets')
      }
    } catch (error) {
      console.error('Error saving targets:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ]

  const totalTarget = targets.reduce((sum, target) => sum + (target.targetValue || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Configurar Metas de Receita</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Período</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ano</Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mês</Label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targets List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Metas Configuradas</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Total: {formatCurrency(totalTarget)}
                  </span>
                  <Button onClick={addTarget} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Meta
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {targets.map((target, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Responsável</Label>
                            <Select
                              value={target.userId || 'GENERAL'}
                              onValueChange={(value) => updateTarget(index, 'userId', value === 'GENERAL' ? null : value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GENERAL">
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Meta Geral</span>
                                  </div>
                                </SelectItem>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4" />
                                      <span>{user.name}</span>
                                      <span className="text-xs text-gray-500">({user.role})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Meta de Receita</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={target.targetValue || ''}
                              onChange={(e) => updateTarget(index, 'targetValue', parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeTarget(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {target.userId ? target.userName || 'Usuário' : 'Meta Geral'}
                          </span>
                          {' '}• Meta: {formatCurrency(target.targetValue || 0)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {targets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma meta configurada para este período</p>
                      <p className="text-sm">Clique em "Adicionar Meta" para começar</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={saveTargets} disabled={saving}>
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Metas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}