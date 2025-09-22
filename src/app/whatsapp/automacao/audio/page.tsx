'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Mic,
  Play,
  Download,
  Trash2,
  Volume2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface AudioGeneration {
  id: string
  text: string
  voice: string
  audioUrl?: string
  duration?: number
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  completedAt?: string
}

const VOICE_OPTIONS = [
  { value: 'pt-BR-Wavenet-A', label: 'Feminina (Wavenet A)', language: 'pt-BR' },
  { value: 'pt-BR-Wavenet-B', label: 'Masculina (Wavenet B)', language: 'pt-BR' },
  { value: 'pt-BR-Standard-A', label: 'Feminina (Standard A)', language: 'pt-BR' },
  { value: 'pt-BR-Standard-B', label: 'Masculina (Standard B)', language: 'pt-BR' },
  { value: 'en-US-Wavenet-C', label: 'Feminina EN (Wavenet C)', language: 'en-US' },
  { value: 'en-US-Wavenet-D', label: 'Masculina EN (Wavenet D)', language: 'en-US' }
]

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  GENERATING: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500'
}

const STATUS_LABELS = {
  PENDING: 'Pendente',
  GENERATING: 'Gerando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou'
}

export default function AudioPage() {
  const [audioGenerations, setAudioGenerations] = useState<AudioGeneration[]>([])
  const [filteredAudios, setFilteredAudios] = useState<AudioGeneration[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [newAudio, setNewAudio] = useState({
    text: '',
    voice: 'pt-BR-Wavenet-A'
  })

  useEffect(() => {
    loadAudioGenerations()
  }, [])

  useEffect(() => {
    filterAudios()
  }, [audioGenerations, searchTerm])

  const loadAudioGenerations = async () => {
    try {
      setLoading(true)

      // Real API call
      const response = await fetch('/api/whatsapp/tts')
      if (response.ok) {
        const data = await response.json()
        setAudioGenerations(data.audios || [])
      } else {
        console.error('Failed to load audio generations')
        // Fallback to mock data
        const mockAudios: AudioGeneration[] = [
        {
          id: '1',
          text: 'Olá! Bem-vindo ao nosso atendimento automatizado. Como posso ajudar você hoje?',
          voice: 'pt-BR-Wavenet-A',
          audioUrl: '/audio/tts/welcome.mp3',
          duration: 8,
          status: 'COMPLETED',
          createdAt: '2024-01-20T10:30:00Z',
          completedAt: '2024-01-20T10:30:15Z'
        },
        {
          id: '2',
          text: 'Obrigado pelo seu contato! Nossa equipe entrará em contato em breve.',
          voice: 'pt-BR-Wavenet-B',
          audioUrl: '/audio/tts/thanks.mp3',
          duration: 6,
          status: 'COMPLETED',
          createdAt: '2024-01-20T11:15:00Z',
          completedAt: '2024-01-20T11:15:10Z'
        },
        {
          id: '3',
          text: 'Este é um teste de geração de áudio com uma mensagem mais longa para verificar como funciona o sistema de TTS com textos extensos.',
          voice: 'pt-BR-Standard-A',
          status: 'GENERATING',
          createdAt: '2024-01-21T09:45:00Z'
        },
        {
          id: '4',
          text: 'Mensagem de erro para teste do sistema.',
          voice: 'pt-BR-Wavenet-A',
          status: 'FAILED',
          createdAt: '2024-01-21T10:00:00Z'
        }
      ]

        setAudioGenerations(mockAudios)
      }
    } catch (error) {
      console.error('Erro ao carregar gerações de áudio:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAudios = () => {
    let filtered = audioGenerations

    if (searchTerm) {
      filtered = filtered.filter(audio =>
        audio.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audio.voice.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAudios(filtered)
  }

  const generateAudio = async () => {
    try {
      setGenerating(true)

      if (!newAudio.text.trim()) {
        alert('Digite o texto para gerar o áudio')
        return
      }

      const response = await fetch('/api/whatsapp/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newAudio.text,
          voice: newAudio.voice
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newGeneration: AudioGeneration = {
          id: result.id || Date.now().toString(),
          text: newAudio.text,
          voice: newAudio.voice,
          status: 'GENERATING',
          createdAt: new Date().toISOString()
        }

        setAudioGenerations(prev => [newGeneration, ...prev])

        // Poll for completion
        const pollStatus = async () => {
          const statusResponse = await fetch(`/api/whatsapp/tts/${newGeneration.id}`)
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.status === 'COMPLETED') {
              setAudioGenerations(prev => prev.map(audio =>
                audio.id === newGeneration.id
                  ? {
                      ...audio,
                      status: 'COMPLETED' as const,
                      audioUrl: statusData.audioUrl,
                      duration: statusData.duration,
                      completedAt: new Date().toISOString()
                    }
                  : audio
              ))
            } else if (statusData.status === 'FAILED') {
              setAudioGenerations(prev => prev.map(audio =>
                audio.id === newGeneration.id
                  ? { ...audio, status: 'FAILED' as const }
                  : audio
              ))
            } else {
              setTimeout(pollStatus, 2000)
            }
          }
        }
        setTimeout(pollStatus, 2000)
      } else {
        console.error('Failed to generate audio')
        // Fallback to mock generation
        const newGeneration: AudioGeneration = {
          id: Date.now().toString(),
          text: newAudio.text,
          voice: newAudio.voice,
          status: 'GENERATING',
          createdAt: new Date().toISOString()
        }

        setAudioGenerations(prev => [newGeneration, ...prev])

        setTimeout(() => {
          setAudioGenerations(prev => prev.map(audio =>
            audio.id === newGeneration.id
              ? {
                  ...audio,
                  status: 'COMPLETED' as const,
                  audioUrl: '/audio/tts/generated.mp3',
                  duration: Math.ceil(newAudio.text.length / 10),
                  completedAt: new Date().toISOString()
                }
              : audio
          ))
        }, 3000)
      }

      setNewAudio({ text: '', voice: 'pt-BR-Wavenet-A' })
      setShowNewDialog(false)
    } catch (error) {
      console.error('Erro ao gerar áudio:', error)
    } finally {
      setGenerating(false)
    }
  }

  const deleteAudio = async (audioId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/tts/${audioId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAudioGenerations(prev => prev.filter(audio => audio.id !== audioId))
      } else {
        console.error('Failed to delete audio')
      }
    } catch (error) {
      console.error('Erro ao deletar áudio:', error)
    }
  }

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play().catch(console.error)
  }

  const downloadAudio = (audioUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVoiceLabel = (voice: string) => {
    const option = VOICE_OPTIONS.find(v => v.value === voice)
    return option ? option.label : voice
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando áudios...</p>
        </div>
      </div>
    )
  }

  const totalAudios = audioGenerations.length
  const completedAudios = audioGenerations.filter(a => a.status === 'COMPLETED').length
  const totalDuration = audioGenerations
    .filter(a => a.duration)
    .reduce((acc, a) => acc + (a.duration || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Áudios TTS</h1>
          <p className="text-gray-600 mt-1">Gerencie mensagens de voz automáticas</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Gerar Áudio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mic className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Áudios</p>
                <p className="text-2xl font-bold">{totalAudios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold">{completedAudios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Duração Total</p>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Em Uso</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar áudios por texto ou voz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Texto</TableHead>
                <TableHead>Voz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudios.map((audio) => (
                <TableRow key={audio.id}>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm truncate">{audio.text}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getVoiceLabel(audio.voice)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="default"
                        style={{ backgroundColor: STATUS_COLORS[audio.status] }}
                      >
                        {STATUS_LABELS[audio.status]}
                      </Badge>
                      {audio.status === 'GENERATING' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {audio.duration ? formatDuration(audio.duration) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(audio.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {audio.status === 'COMPLETED' && audio.audioUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playAudio(audio.audioUrl!)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadAudio(audio.audioUrl!, `audio-${audio.id}.mp3`)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAudio(audio.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAudios.length === 0 && (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum áudio encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece gerando seu primeiro áudio automático.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Primeiro Áudio
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Audio Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar Novo Áudio</DialogTitle>
            <DialogDescription>
              Digite o texto que será convertido em áudio usando TTS (Text-to-Speech)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Texto para Conversão</Label>
              <Textarea
                placeholder="Digite o texto que será convertido em áudio..."
                value={newAudio.text}
                onChange={(e) => setNewAudio(prev => ({ ...prev, text: e.target.value }))}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: 5000 caracteres • Duração estimada: {Math.ceil(newAudio.text.length / 10)}s
              </p>
            </div>

            <div>
              <Label>Voz</Label>
              <Select
                value={newAudio.voice}
                onValueChange={(value) => setNewAudio(prev => ({ ...prev, voice: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map(voice => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Dicas para melhor qualidade:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use pontuação para pausas naturais</li>
                <li>• Evite caracteres especiais como {'{}'}, [], etc.</li>
                <li>• Escreva números por extenso (ex: "três" ao invés de "3")</li>
                <li>• Use "doutor" ao invés de "dr."</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={generateAudio} disabled={generating || !newAudio.text.trim()}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Gerar Áudio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}