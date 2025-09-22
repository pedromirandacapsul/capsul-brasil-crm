'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  MessageSquare,
  Save,
  Play,
  Pause,
  Trash2,
  ArrowLeft,
  Link as LinkIcon,
  Edit3,
  Target,
  Send,
  Phone,
  X,
  Image,
  Mic,
  FileText,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface MessageBox {
  id: string
  title: string
  content: string
  type: 'text' | 'image' | 'audio' | 'file'
  mediaUrl?: string
  fileName?: string
  directTargetId?: string // Conexão direta da mensagem (para quando não tem opções)
  x: number
  y: number
  responses: Array<{
    id: string
    text: string
    targetId?: string
  }>
  isEditingTitle: boolean
  isEditingContent: boolean
  isDragging: boolean
}

interface Connection {
  id: string
  from: string
  to: string
}

export default function VisualFlowEditor() {
  const [messageBoxes, setMessageBoxes] = useState<MessageBox[]>([
    {
      id: 'msg-1',
      title: 'Mensagem de Boas-vindas',
      content: 'Olá! Como posso ajudá-lo hoje?',
      type: 'text',
      x: 100,
      y: 100,
      responses: [
        { id: 'resp-1', text: 'Informações', targetId: undefined },
        { id: 'resp-2', text: 'Suporte', targetId: undefined }
      ],
      isEditingTitle: false,
      isEditingContent: false,
      isDragging: false
    }
  ])

  const [connections, setConnections] = useState<Connection[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [draggedBox, setDraggedBox] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [editingResponse, setEditingResponse] = useState<{boxId: string, responseIndex: number} | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [simulationHistory, setSimulationHistory] = useState<Array<{
    id: string
    content: string
    isBot: boolean
    timestamp: string
    responses?: Array<{id: string, text: string, targetId?: string}>
  }>>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  // Carregar estado do localStorage ao inicializar
  useEffect(() => {
    // Priorizar salvamento manual se existir
    let savedFlow = localStorage.getItem('visualFlowEditor_saved')
    let source = 'salvamento manual'

    // Se não houver salvamento manual, usar auto-save
    if (!savedFlow) {
      savedFlow = localStorage.getItem('visualFlowEditor')
      source = 'auto-salvamento'
    }

    if (savedFlow) {
      try {
        const parsed = JSON.parse(savedFlow)
        if (parsed.messageBoxes && parsed.messageBoxes.length > 0) {
          setMessageBoxes(parsed.messageBoxes)
          console.log(`📂 Fluxo carregado do ${source}:`, {
            messages: parsed.messageBoxes.length,
            connections: parsed.connections?.length || 0,
            timestamp: parsed.timestamp
          })

          // Mostrar notificação de carregamento
          toast.success(
            `📂 Fluxo carregado!\n${parsed.messageBoxes.length} mensagens restauradas`,
            {
              duration: 3000,
              style: {
                background: '#3B82F6',
                color: 'white'
              }
            }
          )

          // Atualizar tempo do último salvamento se disponível
          if (parsed.metadata?.lastSaved) {
            setLastSaveTime(parsed.metadata.lastSaved)
          }
        }
        if (parsed.connections) setConnections(parsed.connections)
      } catch (e) {
        console.error('❌ Erro ao carregar fluxo salvo:', e)
        toast.error('Erro ao carregar fluxo salvo. Iniciando editor vazio.')
      }
    } else {
      console.log('📝 Nenhum fluxo salvo encontrado. Iniciando editor vazio.')
    }
  }, [])

  // Auto-salvar no localStorage (com delay para não interferir na edição)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const flowData = { messageBoxes, connections }
      localStorage.setItem('visualFlowEditor', JSON.stringify(flowData))
    }, 1000) // Delay de 1 segundo

    return () => clearTimeout(timeoutId)
  }, [messageBoxes, connections])

  const addNewMessage = useCallback((type: 'text' | 'image' | 'audio' | 'file' = 'text') => {
    const newMessage: MessageBox = {
      id: `msg-${Date.now()}`,
      title: type === 'text' ? 'Nova Mensagem' :
             type === 'image' ? 'Nova Imagem' :
             type === 'audio' ? 'Novo Áudio' : 'Novo Arquivo',
      content: type === 'text' ? 'Clique aqui para editar sua mensagem...' :
               type === 'image' ? 'Clique para adicionar uma imagem...' :
               type === 'audio' ? 'Clique para adicionar um áudio...' :
               'Clique para adicionar um arquivo...',
      type: type,
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      responses: [
        { id: `resp-${Date.now()}-1`, text: 'Continuar', targetId: undefined }
      ],
      isEditingTitle: false,
      isEditingContent: true, // Iniciar em modo de edição
      isDragging: false
    }

    setMessageBoxes(prev => [...prev, newMessage])

    // Forçar modo de edição após um pequeno delay
    setTimeout(() => {
      setMessageBoxes(current => current.map(box =>
        box.id === newMessage.id
          ? { ...box, isEditingContent: true }
          : box
      ))
    }, 100)

    toast.success(`Nova ${type === 'text' ? 'mensagem' : type === 'image' ? 'imagem' : type === 'audio' ? 'áudio' : 'arquivo'} criada! Clique no conteúdo para editar.`)
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<MessageBox>) => {
    setMessageBoxes(prev => prev.map(box =>
      box.id === id ? { ...box, ...updates } : box
    ))
  }, [])

  const deleteMessage = useCallback((id: string) => {
    setMessageBoxes(prev => prev.filter(box => box.id !== id))
    setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id))
    toast.success('Mensagem removida!')
  }, [])

  // FUNCIONALIDADE 1: EDIÇÃO DE TEXTO
  const startEditingTitle = (boxId: string) => {
    updateMessage(boxId, { isEditingTitle: true })
  }

  const stopEditingTitle = (boxId: string) => {
    updateMessage(boxId, { isEditingTitle: false })
    toast.success('Título salvo!')
  }

  const startEditingContent = (boxId: string) => {
    updateMessage(boxId, { isEditingContent: true })
  }

  const stopEditingContent = (boxId: string) => {
    console.log(`📝 stopEditingContent chamado: boxId=${boxId}`)
    updateMessage(boxId, { isEditingContent: false })
    toast.success('Conteúdo salvo!')
  }

  const updateTitle = (boxId: string, newTitle: string) => {
    updateMessage(boxId, { title: newTitle })
  }

  const updateContent = (boxId: string, newContent: string) => {
    console.log(`📝 updateContent chamado: boxId=${boxId}, newContent="${newContent}"`)
    updateMessage(boxId, { content: newContent })
  }

  // FUNCIONALIDADE 2: DRAG AND DROP
  const handleMouseDown = (e: React.MouseEvent, boxId: string) => {
    e.preventDefault()

    // Só arrastar se clicar no header ou em área não editável
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })

    setDraggedBox(boxId)
    updateMessage(boxId, { isDragging: true })

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = e.clientX - canvasRect.left - dragOffset.x
      const newY = e.clientY - canvasRect.top - dragOffset.y

      updateMessage(boxId, {
        x: Math.max(0, Math.min(newX, canvasRect.width - 320)),
        y: Math.max(0, Math.min(newY, canvasRect.height - 300))
      })
    }

    const handleMouseUp = () => {
      setDraggedBox(null)
      updateMessage(boxId, { isDragging: false })
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      toast.success('Posição salva!')
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // FUNCIONALIDADE 3: SISTEMA DE CONEXÕES POR RESPOSTA
  const [connectingResponse, setConnectingResponse] = useState<{messageId: string, responseIndex: number} | null>(null)

  const startResponseConnection = (messageId: string, responseIndex: number) => {
    setConnectingResponse({ messageId, responseIndex })
    toast.info('🎯 Clique na mensagem de destino para essa resposta!')
  }

  const completeResponseConnection = (targetMessageId: string) => {
    if (!connectingResponse) {
      toast.error('Nenhuma resposta sendo conectada!')
      return
    }

    const { messageId, responseIndex } = connectingResponse
    const sourceMessage = messageBoxes.find(msg => msg.id === messageId)

    if (!sourceMessage) {
      toast.error('Mensagem de origem não encontrada!')
      setConnectingResponse(null)
      return
    }

    // Atualizar a resposta específica com o targetId
    const updatedResponses = [...sourceMessage.responses]
    updatedResponses[responseIndex] = {
      ...updatedResponses[responseIndex],
      targetId: targetMessageId
    }

    updateMessage(messageId, { responses: updatedResponses })

    // Criar conexão visual também
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      from: messageId,
      to: targetMessageId
    }

    setConnections(prev => [...prev, newConnection])
    setConnectingResponse(null)

    toast.success(`✅ Resposta "${updatedResponses[responseIndex].text}" conectada!`)
  }

  const removeResponseConnection = (messageId: string, responseIndex: number) => {
    const sourceMessage = messageBoxes.find(msg => msg.id === messageId)
    if (!sourceMessage) return

    const updatedResponses = [...sourceMessage.responses]
    const targetId = updatedResponses[responseIndex].targetId

    // Remover o targetId da resposta
    updatedResponses[responseIndex] = {
      ...updatedResponses[responseIndex],
      targetId: undefined
    }

    updateMessage(messageId, { responses: updatedResponses })

    // Remover conexão visual correspondente
    if (targetId) {
      setConnections(prev => prev.filter(conn =>
        !(conn.from === messageId && conn.to === targetId)
      ))
    }

    toast.success('Conexão da resposta removida!')
  }

  // CONEXÕES DIRETAS DE MENSAGEM (para mensagens sem opções)
  const [connectingMessage, setConnectingMessage] = useState<string | null>(null)

  const startMessageConnection = (messageId: string) => {
    setConnectingMessage(messageId)
    toast.info('🎯 Clique na mensagem de destino!')
  }

  const completeMessageConnection = (targetMessageId: string) => {
    if (!connectingMessage) {
      toast.error('Nenhuma mensagem sendo conectada!')
      return
    }

    if (connectingMessage === targetMessageId) {
      toast.error('Uma mensagem não pode conectar com ela mesma!')
      setConnectingMessage(null)
      return
    }

    // Atualizar a mensagem com conexão direta
    updateMessage(connectingMessage, { directTargetId: targetMessageId })

    // Criar conexão visual também
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      from: connectingMessage,
      to: targetMessageId
    }

    setConnections(prev => [...prev, newConnection])
    setConnectingMessage(null)

    toast.success(`✅ Mensagem conectada automaticamente!`)
  }

  const removeMessageConnection = (messageId: string) => {
    const message = messageBoxes.find(msg => msg.id === messageId)
    if (!message || !message.directTargetId) return

    const targetId = message.directTargetId

    // Remover o directTargetId da mensagem
    updateMessage(messageId, { directTargetId: undefined })

    // Remover conexão visual correspondente
    setConnections(prev => prev.filter(conn =>
      !(conn.from === messageId && conn.to === targetId)
    ))

    toast.success('Conexão direta removida!')
  }

  const removeConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    toast.success('Conexão removida!')
  }

  // FUNCIONALIDADE 4: EDIÇÃO DE RESPOSTAS
  const startEditingResponse = (boxId: string, responseIndex: number) => {
    setEditingResponse({ boxId, responseIndex })
  }

  const stopEditingResponse = () => {
    setEditingResponse(null)
    toast.success('Resposta salva!')
  }

  const updateResponse = (boxId: string, responseIndex: number, newText: string) => {
    const box = messageBoxes.find(b => b.id === boxId)
    if (!box) return

    const newResponses = [...box.responses]
    newResponses[responseIndex].text = newText

    updateMessage(boxId, { responses: newResponses })
  }

  const addResponse = (boxId: string) => {
    const box = messageBoxes.find(b => b.id === boxId)
    if (!box) return

    const newResponse = {
      id: `resp-${Date.now()}`,
      text: 'Nova opção',
      targetId: undefined
    }

    updateMessage(boxId, {
      responses: [...box.responses, newResponse]
    })
    toast.success('Nova opção adicionada!')
  }

  const removeResponse = (boxId: string, responseIndex: number) => {
    const box = messageBoxes.find(b => b.id === boxId)
    if (!box) return

    const newResponses = box.responses.filter((_, index) => index !== responseIndex)
    updateMessage(boxId, { responses: newResponses })

    if (newResponses.length === 0) {
      toast.success('Todas as opções removidas! Esta mensagem agora é apenas texto.')
    } else {
      toast.success('Opção removida!')
    }
  }

  const saveFlow = async () => {
    console.log('🔽 Botão salvar clicado!')

    // Primeiro verificar se há mensagens para salvar
    if (messageBoxes.length === 0) {
      alert('⚠️ ATENÇÃO!\n\nNão há mensagens para salvar.\nAdicione pelo menos uma mensagem antes de salvar o fluxo.')
      return
    }

    try {
      const flowData = {
        messageBoxes: messageBoxes,
        connections: connections,
        timestamp: new Date().toISOString(),
        version: '1.0',
        metadata: {
          totalMessages: messageBoxes.length,
          totalConnections: connections.length,
          lastSaved: new Date().toLocaleString('pt-BR')
        }
      }

      console.log('📊 Dados do fluxo:', flowData)

      // Salvar no localStorage como backup
      localStorage.setItem('visualFlowEditor_saved', JSON.stringify(flowData))
      localStorage.setItem('visualFlowEditor', JSON.stringify(flowData))

      // Converter para formato da API
      const apiData = {
        name: `Fluxo Visual - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
        description: `Fluxo criado no editor visual com ${messageBoxes.length} mensagens e ${connections.length} conexões`,
        triggerType: 'MANUAL',
        triggerValue: null,
        steps: messageBoxes.map((box, index) => ({
          stepType: 'MESSAGE',
          messageType: box.type.toUpperCase(),
          content: box.content,
          mediaUrl: box.mediaUrl || null,
          stepOrder: index + 1,
          delayMinutes: 0,
          conditions: null,
          actions: box.responses ? JSON.stringify(box.responses) : null
        })),
        visualData: JSON.stringify(flowData) // Salvar os dados visuais também
      }

      console.log('📤 Enviando para API:', apiData)

      // Salvar no banco de dados via API
      const response = await fetch('/api/whatsapp/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Fluxo salvo no banco:', result)

        // Feedback de sucesso
        const mensagemSucesso = `✅ FLUXO SALVO COM SUCESSO!\n\n📊 Detalhes:\n• ${flowData.metadata.totalMessages} mensagens\n• ${flowData.metadata.totalConnections} conexões\n• Salvo em: ${flowData.metadata.lastSaved}\n\n💾 Local: Banco de dados + localStorage\n🆔 ID: ${result.flow?.id || 'N/A'}`

        alert(mensagemSucesso)

        // Toast de backup
        toast.success(`✅ Fluxo salvo no banco de dados!`, { duration: 3000 })

        // Atualizar o tempo do último salvamento
        setLastSaveTime(flowData.metadata.lastSaved)

      } else {
        const error = await response.json()
        console.error('❌ Erro da API:', error)

        // Fallback: salvar só no localStorage
        alert(`⚠️ AVISO!\n\nNão foi possível salvar no banco de dados.\nMotivo: ${error.error || 'Erro desconhecido'}\n\n✅ Fluxo salvo localmente no navegador.\n\n💡 Para ver na lista, implemente autenticação.`)

        toast.error('Erro ao salvar no servidor. Salvo localmente.')
        setLastSaveTime(flowData.metadata.lastSaved)
      }

    } catch (error) {
      console.error('❌ Erro ao salvar fluxo:', error)

      // Fallback: salvar só no localStorage
      alert(`❌ ERRO AO SALVAR!\n\nErro: ${error.message}\n\n✅ Fluxo salvo localmente como backup.`)
      toast.error('Erro ao salvar. Backup local criado.')
    }
  }

  const toggleExecution = () => {
    setIsRunning(!isRunning)
    toast.success(isRunning ? 'Fluxo pausado' : 'Fluxo iniciado')
  }

  // SIMULAÇÃO DO WHATSAPP
  const startSimulation = () => {
    if (messageBoxes.length === 0) {
      toast.error('Adicione pelo menos uma mensagem antes de simular!')
      return
    }

    // Encontrar a primeira mensagem (geralmente a que não é target de nenhuma conexão)
    const firstMessage = messageBoxes.find(msg =>
      !connections.some(conn => conn.to === msg.id)
    ) || messageBoxes[0]

    setCurrentMessageId(firstMessage.id)
    setSimulationHistory([{
      id: firstMessage.id,
      content: firstMessage.content,
      isBot: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      responses: firstMessage.responses
    }])
    setShowSimulation(true)
    toast.success('🎯 Simulação iniciada! Teste o fluxo como se fosse um usuário.')

    // Se a primeira mensagem não tem respostas ou só tem respostas vazias, continuar automaticamente
    if (!firstMessage.responses || firstMessage.responses.length === 0 ||
        firstMessage.responses.every(r => !r.text.trim())) {
      setTimeout(() => {
        continueAutomaticFlow(firstMessage.id)
      }, 1500)
    }
  }

  // Nova função para continuar fluxo automaticamente
  const continueAutomaticFlow = (currentMsgId: string) => {
    const currentMessage = messageBoxes.find(msg => msg.id === currentMsgId)

    // Priorizar conexão direta da mensagem se existir
    let nextMessageId: string | undefined

    if (currentMessage?.directTargetId) {
      nextMessageId = currentMessage.directTargetId
    } else {
      // Fallback para conexões visuais
      const nextConnection = connections.find(conn => conn.from === currentMsgId)
      nextMessageId = nextConnection?.to
    }

    if (nextMessageId) {
      const nextMessage = messageBoxes.find(msg => msg.id === nextMessageId)
      if (nextMessage) {
        const botResponse = {
          id: nextMessage.id,
          content: nextMessage.content,
          isBot: true,
          timestamp: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          responses: nextMessage.responses
        }

        setSimulationHistory(prev => [...prev, botResponse])
        setCurrentMessageId(nextMessage.id)

        // Se a próxima mensagem também não tem respostas válidas, continuar automaticamente
        if (!nextMessage.responses || nextMessage.responses.length === 0 ||
            nextMessage.responses.every(r => !r.text.trim())) {
          setTimeout(() => {
            continueAutomaticFlow(nextMessage.id)
          }, 1500)
        }
      }
    } else {
      // Fim do fluxo automático
      setTimeout(() => {
        setSimulationHistory(prev => [...prev, {
          id: 'end',
          content: '✅ Fim do fluxo automático! O usuário será direcionado para atendimento humano.',
          isBot: true,
          timestamp: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }])
        setCurrentMessageId(null)
      }, 1000)
    }
  }

  const selectResponse = (responseText: string, targetId?: string) => {
    // Adicionar resposta do usuário ao histórico
    const userResponse = {
      id: `user-${Date.now()}`,
      content: responseText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    setSimulationHistory(prev => [...prev, userResponse])

    // Se há um targetId, buscar a próxima mensagem
    if (targetId) {
      const nextMessage = messageBoxes.find(msg => msg.id === targetId)
      if (nextMessage) {
        setTimeout(() => {
          const botResponse = {
            id: nextMessage.id,
            content: nextMessage.content,
            isBot: true,
            timestamp: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            responses: nextMessage.responses
          }

          setSimulationHistory(prev => [...prev, botResponse])
          setCurrentMessageId(nextMessage.id)

          // Se a próxima mensagem não tem respostas válidas, continuar automaticamente
          if (!nextMessage.responses || nextMessage.responses.length === 0 ||
              nextMessage.responses.every(r => !r.text.trim())) {
            setTimeout(() => {
              continueAutomaticFlow(nextMessage.id)
            }, 1500)
          }
        }, 1000) // Simular delay de resposta do bot
      } else {
        // Fim do fluxo
        setTimeout(() => {
          setSimulationHistory(prev => [...prev, {
            id: 'end',
            content: '✅ Fim do fluxo! O usuário será direcionado para atendimento humano.',
            isBot: true,
            timestamp: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }])
          setCurrentMessageId(null)
        }, 1000)
      }
    } else {
      // Sem target definido - fim do fluxo
      setTimeout(() => {
        setSimulationHistory(prev => [...prev, {
          id: 'end',
          content: '⚠️ Esta opção não tem destino configurado. Configure as conexões no editor.',
          isBot: true,
          timestamp: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }])
        setCurrentMessageId(null)
      }, 1000)
    }
  }

  const resetSimulation = () => {
    setSimulationHistory([])
    setCurrentMessageId(null)
    setShowSimulation(false)
    toast.success('Simulação reiniciada!')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/whatsapp/automacao/flows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Fluxos
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editor Visual de Funil</h1>
            <p className="text-sm text-gray-600">Clique nos textos para editar, arraste as caixas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botões diretos para adicionar elementos */}
          <Button
            onClick={() => addNewMessage('text')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>

          <Button
            onClick={() => addNewMessage('image')}
            variant="outline"
            className="border-green-500 text-green-700 hover:bg-green-50"
          >
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>

          <Button
            onClick={() => addNewMessage('audio')}
            variant="outline"
            className="border-orange-500 text-orange-700 hover:bg-orange-50"
          >
            <Mic className="h-4 w-4 mr-2" />
            Áudio
          </Button>

          <Button
            onClick={() => addNewMessage('file')}
            variant="outline"
            className="border-purple-500 text-purple-700 hover:bg-purple-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Arquivo
          </Button>
          <Button
            variant="outline"
            onClick={startSimulation}
            className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 font-medium"
          >
            <Play className="h-4 w-4 mr-2" />
            🎯 Testar Fluxo
          </Button>
          <Button
            variant="outline"
            onClick={(e) => {
              console.log('🖱️ Clique detectado no botão salvar')
              e.preventDefault()
              e.stopPropagation()
              saveFlow()
            }}
            className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100 font-medium relative z-50"
          >
            <Save className="h-4 w-4 mr-2" />
            💾 Salvar Fluxo
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* Conexões SVG */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          {connections.map(conn => {
            const fromBox = messageBoxes.find(b => b.id === conn.from)
            const toBox = messageBoxes.find(b => b.id === conn.to)

            if (!fromBox || !toBox) return null

            const x1 = fromBox.x + 320
            const y1 = fromBox.y + 150
            const x2 = toBox.x
            const y2 = toBox.y + 150

            return (
              <g key={conn.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                />
                {/* Ponto clicável para remover conexão */}
                <circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r="8"
                  fill="red"
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => removeConnection(conn.id)}
                  title="Clique para remover conexão"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2}
                  textAnchor="middle"
                  dy="0.3em"
                  fill="white"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  ✕
                </text>
              </g>
            )
          })}

          {/* Definição da seta */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#3b82f6"
              />
            </marker>
          </defs>
        </svg>

        {/* Mensagens */}
        {messageBoxes.map(box => (
          <Card
            key={box.id}
            className={`absolute w-80 border-2 shadow-lg transition-all z-20 ${
              box.isDragging ? 'cursor-grabbing scale-105 rotate-2' : 'cursor-grab'
            } ${
              connectingFrom === box.id ? 'border-green-400 bg-green-50' :
              connectingFrom ? 'border-purple-400 bg-purple-50 hover:border-purple-600' : 'border-blue-400'
            }`}
            style={{
              left: box.x,
              top: box.y
            }}
            onMouseDown={(e) => handleMouseDown(e, box.id)}
          >
            <CardHeader className={`text-white p-3 rounded-t-lg cursor-move ${
              box.type === 'text' ? 'bg-blue-500' :
              box.type === 'image' ? 'bg-green-500' :
              box.type === 'audio' ? 'bg-orange-500' : 'bg-purple-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  {box.type === 'text' ? <MessageSquare className="h-4 w-4" /> :
                   box.type === 'image' ? <Image className="h-4 w-4" /> :
                   box.type === 'audio' ? <Mic className="h-4 w-4" /> :
                   <FileText className="h-4 w-4" />}
                  {box.isEditingTitle ? (
                    <Input
                      value={box.title}
                      onChange={(e) => updateTitle(box.id, e.target.value)}
                      onBlur={() => stopEditingTitle(box.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          stopEditingTitle(box.id)
                        }
                      }}
                      className={`text-sm border-blue-300 text-white placeholder-blue-100 ${
                        box.type === 'text' ? 'bg-blue-400' :
                        box.type === 'image' ? 'bg-green-400' :
                        box.type === 'audio' ? 'bg-orange-400' : 'bg-purple-400'
                      }`}
                      placeholder="Título da mensagem"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`font-medium text-sm cursor-text px-1 rounded transition-colors ${
                        box.type === 'text' ? 'hover:bg-blue-400' :
                        box.type === 'image' ? 'hover:bg-green-400' :
                        box.type === 'audio' ? 'hover:bg-orange-400' : 'hover:bg-purple-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingTitle(box.id)
                      }}
                    >
                      {box.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMessage(box.id)
                    }}
                    className="text-white hover:bg-red-500 h-6 w-6 p-0"
                    title="Deletar mensagem"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {/* Conteúdo da mensagem - CLICÁVEL PARA EDITAR */}
              <div className="mb-4">
                {box.type === 'text' ? (
                  box.isEditingContent ? (
                    <Textarea
                      value={box.content}
                      onChange={(e) => updateContent(box.id, e.target.value)}
                      onBlur={() => stopEditingContent(box.id)}
                      className="min-h-20 resize-none"
                      placeholder="Digite o conteúdo da mensagem..."
                      autoFocus
                      key={`${box.id}-editing`} // Força re-render quando entra em modo de edição
                    />
                  ) : (
                    <div
                      className="p-3 bg-gray-50 rounded border min-h-20 text-sm cursor-text hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingContent(box.id)
                      }}
                    >
                      {box.content || 'Clique aqui para editar sua mensagem...'}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {/* Preview da mídia */}
                    <div className={`p-4 rounded border-2 border-dashed text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      box.type === 'image' ? 'border-green-300 bg-green-50' :
                      box.type === 'audio' ? 'border-orange-300 bg-orange-50' :
                      'border-purple-300 bg-purple-50'
                    }`}>
                      {box.type === 'image' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="h-8 w-8 text-green-600" />
                          <p className="text-sm text-green-700">
                            {box.mediaUrl ? 'Imagem selecionada' : 'Clique para selecionar uma imagem'}
                          </p>
                        </div>
                      ) : box.type === 'audio' ? (
                        <div className="flex flex-col items-center gap-2">
                          <Mic className="h-8 w-8 text-orange-600" />
                          <p className="text-sm text-orange-700">
                            {box.mediaUrl ? 'Áudio selecionado' : 'Clique para selecionar um áudio'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-purple-600" />
                          <p className="text-sm text-purple-700">
                            {box.fileName ? `Arquivo: ${box.fileName}` : 'Clique para selecionar um arquivo'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Campo de texto opcional para legenda */}
                    {box.isEditingContent ? (
                      <Textarea
                        value={box.content}
                        onChange={(e) => updateContent(box.id, e.target.value)}
                        onBlur={() => stopEditingContent(box.id)}
                        className="min-h-16 resize-none"
                        placeholder={
                          box.type === 'image' ? 'Legenda da imagem (opcional)...' :
                          box.type === 'audio' ? 'Descrição do áudio (opcional)...' :
                          'Descrição do arquivo (opcional)...'
                        }
                        autoFocus
                      />
                    ) : (
                      <div
                        className="p-2 bg-gray-50 rounded border text-sm cursor-text hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingContent(box.id)
                        }}
                      >
                        {box.content || `Clique para adicionar uma ${
                          box.type === 'image' ? 'legenda' :
                          box.type === 'audio' ? 'descrição do áudio' :
                          'descrição do arquivo'
                        }...`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opções de resposta - CLICÁVEIS PARA EDITAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Opções de Resposta:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      addResponse(box.id)
                    }}
                    className="h-6 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {box.responses.map((response, index) => (
                  <div key={response.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs flex-1 p-2 hover:bg-gray-50 transition-colors ${
                          response.targetId ? 'border-green-400 bg-green-50' : ''
                        }`}
                      >
                        {editingResponse?.boxId === box.id && editingResponse?.responseIndex === index ? (
                          <Input
                            value={response.text}
                            onChange={(e) => updateResponse(box.id, index, e.target.value)}
                            onBlur={stopEditingResponse}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                stopEditingResponse()
                              }
                            }}
                            className="h-5 text-xs border-none p-0 bg-transparent"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-text w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingResponse(box.id, index)
                            }}
                          >
                            {response.text}
                          </span>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeResponse(box.id, index)
                        }}
                        className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                        title="Remover opção"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Botões de conexão para cada resposta */}
                    <div className="flex items-center gap-1 ml-2">
                      {response.targetId ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                            ✅ Conectado
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeResponseConnection(box.id, index)
                            }}
                            className="h-4 w-4 p-0 text-red-500 hover:bg-red-50"
                            title="Remover conexão"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            startResponseConnection(box.id, index)
                          }}
                          className="h-4 text-xs text-purple-600 hover:bg-purple-50 p-1"
                          disabled={connectingResponse?.messageId === box.id && connectingResponse?.responseIndex === index}
                        >
                          <LinkIcon className="h-2 w-2 mr-1" />
                          {connectingResponse?.messageId === box.id && connectingResponse?.responseIndex === index
                            ? 'Conectando...'
                            : 'Conectar'
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conexão direta da mensagem */}
              <div className="mt-4 space-y-2">
                {/* Mostrar conexão direta se existir */}
                {box.directTargetId && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                        🔄 Conexão Automática
                      </Badge>
                      <span className="text-xs text-blue-600">
                        {messageBoxes.find(m => m.id === box.directTargetId)?.title || 'Mensagem de destino'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMessageConnection(box.id)
                      }}
                      className="h-4 w-4 p-0 text-red-500 hover:bg-red-50"
                      title="Remover conexão automática"
                    >
                      ✕
                    </Button>
                  </div>
                )}

                {/* Botões de conexão */}
                <div className="flex gap-2">
                  {/* Conectar mensagem diretamente */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      startMessageConnection(box.id)
                    }}
                    className={`flex-1 text-blue-600 border-blue-300 hover:bg-blue-50 ${
                      connectingMessage === box.id ? 'animate-pulse border-blue-500' : ''
                    }`}
                    disabled={connectingMessage === box.id}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    {connectingMessage === box.id ? 'Conectando...' : 'Conectar Mensagem'}
                  </Button>

                  {/* Receber conexões */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (connectingResponse) {
                        completeResponseConnection(box.id)
                      } else if (connectingMessage) {
                        completeMessageConnection(box.id)
                      }
                    }}
                    className={`flex-1 text-purple-600 border-purple-300 hover:bg-purple-50 ${
                      (connectingResponse || connectingMessage) ? 'animate-pulse border-purple-500' : ''
                    }`}
                    disabled={!connectingResponse && !connectingMessage}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {(connectingResponse || connectingMessage) ? '🎯 Receber Aqui' : 'Aguardando'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Status da conexão de resposta */}
        {connectingResponse && (
          <div className="absolute top-4 left-4 bg-purple-100 border border-purple-400 rounded p-3 z-30 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
              <span className="text-sm text-purple-800 font-medium">
                🔗 Conectando resposta "{(() => {
                  const msg = messageBoxes.find(m => m.id === connectingResponse.messageId)
                  return msg?.responses[connectingResponse.responseIndex]?.text || ''
                })()}" - Clique na mensagem de destino
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConnectingResponse(null)}
                className="h-5 w-5 p-0 text-purple-700 hover:bg-purple-200"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Status da conexão de mensagem direta */}
        {connectingMessage && (
          <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 rounded p-3 z-30 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
              <span className="text-sm text-blue-800 font-medium">
                🔄 Conectando mensagem "{(() => {
                  const msg = messageBoxes.find(m => m.id === connectingMessage)
                  return msg?.title || ''
                })()} automáticamente" - Clique na mensagem de destino
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConnectingMessage(null)}
                className="h-5 w-5 p-0 text-blue-700 hover:bg-blue-200"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Simulação do WhatsApp */}
      <Dialog open={showSimulation} onOpenChange={() => setShowSimulation(false)}>
        <DialogContent className="max-w-md h-[600px] p-0 overflow-hidden">
          <DialogHeader className="bg-green-600 text-white p-4 flex flex-row items-center space-y-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-white">Bot de Atendimento</DialogTitle>
                <p className="text-xs text-green-100">Online agora</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSimulation(false)}
              className="text-white hover:bg-green-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {/* Chat Container */}
          <div className="flex-1 bg-gray-100 bg-opacity-50 p-4 overflow-y-auto space-y-3 max-h-[400px]">
            {simulationHistory.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-white text-gray-800 rounded-bl-none'
                      : 'bg-green-500 text-white rounded-br-none'
                  } shadow-sm`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-green-100'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {currentMessageId && simulationHistory.length > 0 && simulationHistory[simulationHistory.length - 1]?.isBot && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Response Options */}
          {currentMessageId && (
            <div className="p-4 bg-white border-t space-y-2">
              <p className="text-xs text-gray-500 mb-2">Escolha uma opção:</p>
              {(() => {
                const currentMessage = simulationHistory
                  .slice()
                  .reverse()
                  .find(msg => msg.isBot && msg.responses)
                return currentMessage?.responses?.map((response, index) => (
                  <Button
                    key={response.id}
                    variant="outline"
                    size="sm"
                    onClick={() => selectResponse(response.text, response.targetId)}
                    className="w-full justify-start text-left hover:bg-green-50 border-green-200"
                  >
                    {response.text}
                  </Button>
                )) || []
              })()}
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 bg-gray-50 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              className="flex-1"
            >
              🔄 Reiniciar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSimulation(false)}
              className="flex-1"
            >
              ✅ Finalizar Teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Bar */}
      <div className="bg-white border-t p-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>{messageBoxes.length} mensagem(s)</span>
          <span>{connections.length} conexão(ões)</span>
          <Badge variant={isRunning ? 'default' : 'secondary'}>
            {isRunning ? 'Executando' : 'Pausado'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-salvando...</span>
          {lastSaveTime && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600 font-medium">
                💾 Último salvamento manual: {lastSaveTime}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}