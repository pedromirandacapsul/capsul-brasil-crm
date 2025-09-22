'use client'

import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  MessageSquare,
  Settings,
  Save,
  Play,
  Pause,
  Trash2,
  FileDown,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MessageNodeData {
  id: string
  title: string
  content: string
  timestamp: string
  responses: Array<{
    id: string
    text: string
    targetNodeId?: string
  }>
  isEditing?: boolean
}

const MessageNode = ({ data, id }: { data: MessageNodeData; id: string }) => {
  const [isEditing, setIsEditing] = useState(data.isEditing || false)
  const [title, setTitle] = useState(data.title)
  const [content, setContent] = useState(data.content)
  const [responses, setResponses] = useState(data.responses)

  const handleSave = () => {
    setIsEditing(false)
    toast.success('Mensagem atualizada!')
  }

  const addResponse = () => {
    const newResponse = {
      id: `response-${Date.now()}`,
      text: 'Nova opção',
      targetNodeId: undefined
    }
    setResponses([...responses, newResponse])
  }

  const removeResponse = (responseId: string) => {
    setResponses(responses.filter(r => r.id !== responseId))
  }

  const nodeClasses = "bg-white border-2 border-blue-400 rounded-lg shadow-lg min-w-[280px] max-w-[380px]"
  const headerClasses = "bg-blue-500 text-white p-3 rounded-t-lg flex items-center justify-between"
  const contentClasses = "p-4"
  const footerClasses = "flex justify-between p-2 bg-gray-50 rounded-b-lg"

  return (
    <div className={nodeClasses}>
      <div className={headerClasses}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm bg-blue-400 border-blue-300 text-white placeholder-blue-100"
              placeholder="Título da mensagem"
            />
          ) : (
            <span className="font-medium text-sm">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-white hover:bg-blue-400 h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-500 h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className={contentClasses}>
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo da mensagem..."
            className="mb-3 min-h-[80px] resize-none"
          />
        ) : (
          <div className="mb-3 p-2 bg-gray-50 rounded border min-h-[80px] text-sm">
            {content || 'Clique para editar a mensagem...'}
          </div>
        )}

        <div className="text-xs text-gray-500 mb-3">
          {data.timestamp}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Opções de Resposta:</span>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={addResponse}
                className="h-6 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            )}
          </div>

          {responses.map((response, index) => (
            <div key={response.id} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex-1">
                {isEditing ? (
                  <Input
                    value={response.text}
                    onChange={(e) => {
                      const newResponses = [...responses]
                      newResponses[index].text = e.target.value
                      setResponses(newResponses)
                    }}
                    className="h-5 text-xs border-none p-0 bg-transparent"
                  />
                ) : (
                  response.text
                )}
              </Badge>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResponse(response.id)}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="flex-1 h-7 text-xs"
            >
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="flex-1 h-7 text-xs"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className={footerClasses}>
        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white cursor-pointer"
             title="Ponto de entrada" />
        <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white cursor-pointer"
             title="Ponto de saída" />
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  messageNode: MessageNode,
}

interface VisualFlowEditorProps {
  flowId?: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

export default function VisualFlowEditor({
  flowId,
  initialNodes = [],
  initialEdges = [],
  onSave
}: VisualFlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isRunning, setIsRunning] = useState(false)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3b82f6',
        },
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
        },
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  const addNewMessage = useCallback(() => {
    const newNode: Node = {
      id: `message-${Date.now()}`,
      type: 'messageNode',
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: {
        id: `message-${Date.now()}`,
        title: `Mensagem #${nodes.length + 1}`,
        content: 'Nova mensagem...',
        timestamp: new Date().toLocaleString('pt-BR'),
        responses: [
          { id: 'resp-1', text: 'Sim', targetNodeId: undefined },
          { id: 'resp-2', text: 'Não', targetNodeId: undefined }
        ],
        isEditing: true
      }
    }
    setNodes((nds) => [...nds, newNode])
    toast.success('Nova mensagem adicionada!')
  }, [nodes.length, setNodes])

  const saveFlow = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges)
    }
    toast.success('Fluxo salvo com sucesso!')
  }, [nodes, edges, onSave])

  const toggleFlowExecution = useCallback(() => {
    setIsRunning(!isRunning)
    toast.success(isRunning ? 'Fluxo pausado' : 'Fluxo iniciado')
  }, [isRunning])

  const clearCanvas = useCallback(() => {
    setNodes([])
    setEdges([])
    toast.success('Canvas limpo')
  }, [setNodes, setEdges])

  const exportFlow = useCallback(() => {
    const flow = {
      nodes: nodes,
      edges: edges,
      viewport: reactFlowInstance?.getViewport()
    }
    const dataStr = JSON.stringify(flow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fluxo-${flowId || 'novo'}.json`
    link.click()
    toast.success('Fluxo exportado!')
  }, [nodes, edges, reactFlowInstance, flowId])

  const toolbarClasses = "bg-white border-b p-4 flex items-center justify-between shadow-sm"
  const canvasClasses = "flex-1"
  const statusBarClasses = "bg-white border-t p-2 flex items-center justify-between text-sm text-gray-600"
  const containerClasses = "flex flex-col h-full bg-gray-50"

  return (
    <div className={containerClasses}>
      <div className={toolbarClasses}>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Editor Visual de Funil
          </h2>
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Executando' : 'Pausado'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={addNewMessage}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>

          <Button
            variant="outline"
            onClick={toggleFlowExecution}
            className={isRunning ? 'text-red-600 border-red-600' : 'text-green-600 border-green-600'}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Pausar' : 'Executar'}
          </Button>

          <Button variant="outline" onClick={saveFlow}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>

          <Button variant="outline" onClick={exportFlow}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Button variant="outline" onClick={clearCanvas} className="text-red-600 border-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      <div className={canvasClasses} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          connectionLineType="smoothstep"
          connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.3}
          maxZoom={2}
          snapToGrid={true}
          snapGrid={[20, 20]}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          fitView
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap
            nodeColor="#3b82f6"
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-white border border-gray-300"
          />
        </ReactFlow>
      </div>

      <div className={statusBarClasses}>
        <div className="flex items-center gap-4">
          <span>{nodes.length} mensagem(s)</span>
          <span>{edges.length} conexão(ões)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Sistema Online</span>
        </div>
      </div>
    </div>
  )
}