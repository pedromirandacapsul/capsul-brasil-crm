'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Phone,
  Building,
  Clock,
  DollarSign,
  Plus,
  Search,
  Filter,
  MessageCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { hasPermission, PERMISSIONS } from '@/lib/rbac'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  roleTitle: string | null
  status: string
  score: number
  source: string | null
  createdAt: string
  lastActivityAt: string | null
  owner: {
    id: string
    name: string
    email: string
  } | null
  _count: {
    activities: number
    tasks: number
  }
}

interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  leads: Lead[]
}

const statusColumns: Omit<KanbanColumn, 'leads'>[] = [
  { id: 'new', title: 'Novos', status: 'NEW', color: 'bg-blue-100 border-blue-200' },
  { id: 'contacted', title: 'Contatados', status: 'CONTACTED', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'qualified', title: 'Qualificados', status: 'QUALIFIED', color: 'bg-green-100 border-green-200' },
  { id: 'proposal', title: 'Proposta', status: 'PROPOSAL', color: 'bg-purple-100 border-purple-200' },
  { id: 'won', title: 'Ganhos', status: 'WON', color: 'bg-emerald-100 border-emerald-200' },
  { id: 'lost', title: 'Perdidos', status: 'LOST', color: 'bg-red-100 border-red-200' },
]

function LeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm">{lead.name}</h3>
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-800">{lead.score}</span>
              </div>
            </div>
          </div>

          {lead.roleTitle && (
            <p className="text-xs text-gray-600 mb-2">{lead.roleTitle}</p>
          )}

          <div className="space-y-1 mb-3">
            {lead.email && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{lead.phone}</span>
                </div>
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 p-1 rounded"
                  title="Contatar via WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="h-3 w-3" />
                </a>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building className="h-3 w-3" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {lead.source && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {lead.source}
              </Badge>
            )}
          </div>

          {lead.owner && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-gray-600">
                Responsável: {lead.owner.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KanbanColumnComponent({ column }: { column: KanbanColumn }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed ${column.color} p-4 min-h-[600px] transition-colors ${
        isOver ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900">{column.title}</h2>
        <Badge variant="secondary">{column.leads.length}</Badge>
      </div>

      <SortableContext items={column.leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
        {column.leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </SortableContext>

      {column.leads.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>Arraste leads para esta coluna</p>
        </div>
      )}
    </div>
  )
}

export default function KanbanPage() {
  const { data: session } = useSession()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(sourceFilter && { source: sourceFilter }),
        limit: '1000', // Get all leads for kanban
      })

      const response = await fetch(`/api/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        const leads = data.data.leads

        // Group leads by status
        const groupedColumns = statusColumns.map(col => ({
          ...col,
          leads: leads.filter((lead: Lead) => lead.status === col.status)
        }))

        setColumns(groupedColumns)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [search, sourceFilter])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the lead being dragged
    let draggedLead: Lead | null = null
    let sourceColumn: KanbanColumn | null = null

    for (const column of columns) {
      const lead = column.leads.find(l => l.id === activeId)
      if (lead) {
        draggedLead = lead
        sourceColumn = column
        break
      }
    }

    if (!draggedLead || !sourceColumn) return

    // Find target column (could be another lead's column or the column itself)
    let targetColumn: KanbanColumn | null = null

    // Check if dropped on a column
    targetColumn = columns.find(col => col.id === overId) || null

    // If not dropped on column, find the column of the target lead
    if (!targetColumn) {
      for (const column of columns) {
        if (column.leads.some(l => l.id === overId)) {
          targetColumn = column
          break
        }
      }
    }

    if (!targetColumn || targetColumn.status === sourceColumn.status) return

    // Optimistically update UI first
    const updatedColumns = columns.map(column => {
      if (column.id === sourceColumn.id) {
        return {
          ...column,
          leads: column.leads.filter(l => l.id !== activeId)
        }
      }
      if (column.id === targetColumn.id) {
        return {
          ...column,
          leads: [...column.leads, { ...draggedLead, status: targetColumn.status }]
        }
      }
      return column
    })
    setColumns(updatedColumns)

    // Update lead status on server
    try {
      const response = await fetch(`/api/leads/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumn.status }),
      })

      if (!response.ok) {
        // Revert on error
        setColumns(columns)
        console.error('Failed to update lead status')
      }
    } catch (error) {
      // Revert on error
      setColumns(columns)
      console.error('Error updating lead status:', error)
    }
  }

  const activeLead = activeId ?
    columns.flatMap(col => col.leads).find(lead => lead.id === activeId) : null

  if (!session) return null

  const userRole = session.user.role

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban - Leads</h1>
          <p className="text-gray-600">
            Gerencie leads arrastando e soltando entre os estágios
          </p>
        </div>
        <div className="flex space-x-2">
          {hasPermission(userRole, PERMISSIONS.LEADS_CREATE) && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sourceFilter || 'all'} onValueChange={(value) => setSourceFilter(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Referral">Indicação</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setSourceFilter('')
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {columns.map((column) => (
              <KanbanColumnComponent key={column.id} column={column} />
            ))}
          </div>

          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}