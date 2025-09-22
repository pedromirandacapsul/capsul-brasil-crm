'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Edit2,
  Check,
  X
} from 'lucide-react'

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface TaskSubtasksManagerProps {
  taskId: string
  subtasks: Subtask[]
  onSubtasksChange: (subtasks: Subtask[]) => void
  readonly?: boolean
}

export function TaskSubtasksManager({
  taskId,
  subtasks,
  onSubtasksChange,
  readonly = false
}: TaskSubtasksManagerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onSubtasksChange([...subtasks, data.data])
          setNewSubtaskTitle('')
        }
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      if (response.ok) {
        const updatedSubtasks = subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed } : s
        )
        onSubtasksChange(updatedSubtasks)
      }
    } catch (error) {
      console.error('Error updating subtask:', error)
    }
  }

  const handleEditSubtask = async (subtaskId: string) => {
    if (!editingTitle.trim()) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() })
      })

      if (response.ok) {
        const updatedSubtasks = subtasks.map(s =>
          s.id === subtaskId ? { ...s, title: editingTitle.trim() } : s
        )
        onSubtasksChange(updatedSubtasks)
        setEditingId(null)
        setEditingTitle('')
      }
    } catch (error) {
      console.error('Error editing subtask:', error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId)
        onSubtasksChange(updatedSubtasks)
      }
    } catch (error) {
      console.error('Error deleting subtask:', error)
    }
  }

  const startEditing = (subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditingTitle(subtask.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          Checklist
          {totalCount > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({completedCount}/{totalCount})
            </span>
          )}
        </CardTitle>
        {totalCount > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-gray-600">
              {progress.toFixed(0)}% concluído
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new subtask */}
        {!readonly && (
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar item..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              disabled={loading}
            />
            <Button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim() || loading}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Subtasks list */}
        <div className="space-y-2">
          <AnimatePresence>
            {subtasks.map((subtask, index) => (
              <motion.div
                key={subtask.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  subtask.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={(checked) =>
                    handleToggleSubtask(subtask.id, checked as boolean)
                  }
                  disabled={readonly}
                />

                {/* Title */}
                <div className="flex-1">
                  {editingId === subtask.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleEditSubtask(subtask.id)
                          if (e.key === 'Escape') cancelEditing()
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleEditSubtask(subtask.id)}
                        disabled={!editingTitle.trim()}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`${
                        subtask.completed
                          ? 'line-through text-gray-500'
                          : 'text-gray-900'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {!readonly && editingId !== subtask.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(subtask)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {subtasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {readonly
                ? 'Nenhum item no checklist'
                : 'Adicione itens ao checklist para organizar sua tarefa'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}