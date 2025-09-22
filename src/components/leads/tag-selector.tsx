'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag } from '@/components/ui/tag'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface TagData {
  id: string
  name: string
  color: string
  category?: string
  usageCount?: number
}

interface TagSelectorProps {
  leadId: string
  selectedTags?: TagData[]
  onTagsChange?: (tags: TagData[]) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TagSelector({
  leadId,
  selectedTags = [],
  onTagsChange,
  size = 'md',
  className
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<TagData[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAvailableTags()
  }, [])

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableTags(data.data.tags || [])
        }
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleTagSelect = async (tag: TagData) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      return // Tag already selected
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId: tag.id }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newTags = [...selectedTags, tag]
          onTagsChange?.(newTags)
        }
      }
    } catch (error) {
      console.error('Error assigning tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTagRemove = async (tagId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/tags?tagId=${tagId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newTags = selectedTags.filter(t => t.id !== tagId)
          onTagsChange?.(newTags)
        }
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.find(selected => selected.id === tag.id)
  )

  return (
    <div className={className}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <Tag
            key={tag.id}
            color={tag.color}
            size={size}
            removable
            onRemove={() => handleTagRemove(tag.id)}
          >
            {tag.name}
          </Tag>
        ))}
      </div>

      {/* Add Tag Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size={size} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar tags..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => {
                      handleTagSelect(tag)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {tag.category && (
                        <span className="text-xs text-gray-500">{tag.category}</span>
                      )}
                      {tag.usageCount !== undefined && (
                        <span className="text-xs text-gray-400">({tag.usageCount})</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Tag Manager Component for creating new tags
interface TagManagerProps {
  onTagCreated?: (tag: TagData) => void
}

export function TagManager({ onTagCreated }: TagManagerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    category: ''
  })

  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          category: formData.category.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onTagCreated?.(data.data)
          setFormData({ name: '', color: '#3B82F6', category: '' })
          setOpen(false)
        }
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da tag"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria (opcional)</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="ex: fonte, interesse, prioridade"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Criando...' : 'Criar Tag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}