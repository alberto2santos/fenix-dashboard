import { useEffect, useRef, useState } from 'react'
import type { MqttClient } from 'mqtt'
import { useQueryClient } from '@tanstack/react-query'
import { Radio, Unplug } from 'lucide-react'
import { SOLDA_HISTORY_QUERY_KEY } from '@/hooks/useCsvParser'
import { SoldaRowSchema, mapRawRow } from '@/schemas/soldaSchema'
import type { SoldaRow } from '@/schemas/soldaSchema'
import { mergeSnapshotHistory } from '@/utils/snapshotHistory'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
type RealtimeTransport = 'mqtt' | 'websocket' | 'sse'

export function RealtimeIngestion() {
  const queryClient = useQueryClient()
  const mqttRef = useRef<MqttClient | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [transport, setTransport] = useState<RealtimeTransport>('mqtt')
  const [endpoint, setEndpoint] = useState('')
  const [topic, setTopic] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [message, setMessage] = useState('')
  const [received, setReceived] = useState(0)

  const disconnect = () => {
    mqttRef.current?.end(true)
    socketRef.current?.close()
    eventSourceRef.current?.close()
    mqttRef.current = null
    socketRef.current = null
    eventSourceRef.current = null
    setStatus('disconnected')
  }

  useEffect(() => () => {
    mqttRef.current?.end(true)
    socketRef.current?.close()
    eventSourceRef.current?.close()
  }, [])

  const ingestPayload = (payload: string) => {
    try {
      const decoded: unknown = JSON.parse(payload)
      const items = Array.isArray(decoded) ? decoded : [decoded]
      const rows: SoldaRow[] = items.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return []
        const source = item as Record<string, unknown>
        const normalized = { ...source, ...mapRawRow(source) }
        const requiredFields = ['area', 'soldasRealizadas', 'saldoSoldas', 'totalPrevisto', 'porcentagem']
        if (requiredFields.some((field) => normalized[field] === undefined || normalized[field] === '')) return []
        const parsed = SoldaRowSchema.safeParse(normalized)
        return parsed.success ? [parsed.data] : []
      })

      if (rows.length === 0) {
        setMessage('Mensagem recebida, mas nenhum registro passou pela validação do schema.')
        return
      }

      queryClient.setQueryData<SoldaRow[]>(SOLDA_HISTORY_QUERY_KEY, (previous = []) =>
        mergeSnapshotHistory(previous, rows),
      )
      setReceived((count) => count + rows.length)
      setMessage(`${rows.length} registro(s) recebido(s) e salvo(s) no histórico local.`)
    } catch {
      setMessage(`Mensagem ${transport.toUpperCase()} ignorada: envie um payload JSON válido.`)
    }
  }

  const startConnection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    let parsedUrl: URL
    try {
      parsedUrl = new URL(endpoint)
    } catch {
      setStatus('error')
      setMessage('Informe uma URL válida para a conexão selecionada.')
      return
    }

    const validProtocol = transport === 'sse'
      ? ['http:', 'https:'].includes(parsedUrl.protocol)
      : ['ws:', 'wss:'].includes(parsedUrl.protocol)
    if (!validProtocol || (transport === 'mqtt' && !topic.trim())) {
      setStatus('error')
      setMessage(transport === 'sse'
        ? 'Use uma URL http:// ou https:// para o endpoint SSE.'
        : `Use uma URL ws:// ou wss://${transport === 'mqtt' ? ' e informe o tópico MQTT' : ''}.`)
      return
    }
    if (window.location.protocol === 'https:'
      && ((transport === 'sse' && parsedUrl.protocol !== 'https:')
        || (transport !== 'sse' && parsedUrl.protocol !== 'wss:'))) {
      setStatus('error')
      setMessage('Em um site HTTPS, use HTTPS para SSE ou WSS para WebSocket/MQTT.')
      return
    }

    disconnect()
    setStatus('connecting')

    if (transport === 'mqtt') {
      try {
        const { connect } = await import('mqtt')
        const client = connect(endpoint, {
          clean: true,
          connectTimeout: 10_000,
          reconnectPeriod: 2_000,
          ...(username.trim() ? { username: username.trim() } : {}),
          ...(password ? { password } : {}),
        })
        mqttRef.current = client
        client.on('connect', () => {
          client.subscribe(topic.trim(), (error) => {
            if (error) {
              setStatus('error')
              setMessage(`Não foi possível assinar o tópico: ${error.message}`)
              return
            }
            setStatus('connected')
            setMessage(`Escutando ${topic.trim()}`)
          })
        })
        client.on('message', (_receivedTopic, payload) => {
          ingestPayload(new TextDecoder().decode(payload))
        })
        client.on('error', (error) => {
          setStatus('error')
          setMessage(`Falha na conexão MQTT: ${error.message}`)
        })
        client.on('close', () => {
          if (mqttRef.current === client) setStatus('disconnected')
        })
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o cliente MQTT.')
      }
      return
    }

    if (transport === 'websocket') {
      try {
        const socket = new WebSocket(endpoint)
        socketRef.current = socket
        socket.addEventListener('open', () => {
          if (socketRef.current !== socket) return
          setStatus('connected')
          setMessage('Conexão WebSocket ativa.')
        })
        socket.addEventListener('message', (event: MessageEvent<string | ArrayBuffer | Blob>) => {
          if (typeof event.data === 'string') ingestPayload(event.data)
          else if (event.data instanceof Blob) void event.data.text().then(ingestPayload)
          else ingestPayload(new TextDecoder().decode(event.data))
        })
        socket.addEventListener('error', () => {
          setStatus('error')
          setMessage('Falha na conexão WebSocket.')
        })
        socket.addEventListener('close', () => {
          if (socketRef.current === socket) setStatus('disconnected')
        })
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o WebSocket.')
      }
      return
    }

    try {
      const source = new EventSource(endpoint)
      eventSourceRef.current = source
      source.onopen = () => {
        if (eventSourceRef.current !== source) return
        setStatus('connected')
        setMessage('Conexão SSE ativa.')
      }
      source.onmessage = (event) => ingestPayload(event.data)
      source.onerror = () => {
        if (eventSourceRef.current !== source) return
        setStatus(source.readyState === EventSource.CLOSED ? 'error' : 'connecting')
        setMessage(source.readyState === EventSource.CLOSED
          ? 'A conexão SSE foi encerrada.'
          : 'Conexão SSE interrompida; tentando reconectar.')
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o SSE.')
    }
  }

  const locked = status === 'connecting' || status === 'connected'
  const transportLabel = transport === 'mqtt' ? 'MQTT' : transport === 'websocket' ? 'WebSocket' : 'SSE'

  return (
    <section className="rounded-xl border border-fenix-border bg-fenix-card p-5" aria-label="Ingestão em tempo real">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-steel">Ingestão em tempo real</h2>
          <p className="mt-1 text-xs text-steel">Receba snapshots JSON por MQTT, WebSocket ou Server-Sent Events.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status === 'connected' ? 'bg-status-ok-tint text-status-ok' : status === 'error' ? 'bg-status-critBg text-status-critical' : 'bg-fenix-surface text-steel'}`} role="status">
          {status === 'connected' ? 'Conectado' : status === 'connecting' ? 'Conectando…' : status === 'error' ? 'Erro' : 'Desconectado'}
        </span>
      </div>

      <form onSubmit={startConnection} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-xs text-steel">
          Protocolo
          <select value={transport} disabled={locked} onChange={(event) => setTransport(event.target.value as RealtimeTransport)} className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white">
            <option value="mqtt">MQTT sobre WebSocket</option>
            <option value="websocket">WebSocket</option>
            <option value="sse">Server-Sent Events (SSE)</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-steel">
          {transport === 'mqtt' ? 'URL do broker (WS/WSS)' : transport === 'sse' ? 'URL do endpoint SSE' : 'URL do servidor (WS/WSS)'}
          <input required disabled={locked} value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder={transport === 'sse' ? 'https://servidor.example.com/events' : transport === 'mqtt' ? 'wss://broker.example.com:8084/mqtt' : 'wss://servidor.example.com/stream'} className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white" />
        </label>
        {transport === 'mqtt' && (
          <>
            <label className="space-y-1 text-xs text-steel">
              Tópico
              <input required disabled={locked} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="fenix/area-a/snapshots" className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs text-steel">
              Usuário (opcional)
              <input autoComplete="username" disabled={locked} value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs text-steel">
              Senha (opcional, apenas nesta sessão)
              <input type="password" autoComplete="current-password" disabled={locked} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white" />
            </label>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
          {status === 'connected' ? (
            <button type="button" onClick={disconnect} className="inline-flex items-center gap-2 rounded-lg border border-fenix-border px-4 py-2 text-sm text-white hover:border-amber">
              <Unplug className="h-4 w-4" /> Parar escuta
            </button>
          ) : (
            <button type="submit" disabled={status === 'connecting'} className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-fenix-bg hover:bg-amber-light disabled:opacity-60">
              <Radio className="h-4 w-4" /> {status === 'connecting' ? 'Conectando…' : `Ativar escuta ${transportLabel}`}
            </button>
          )}
          <span className="text-xs text-steel">{received} registro(s) recebidos nesta sessão.</span>
          {message && <span className="text-xs text-steel" aria-live="polite">{message}</span>}
        </div>
      </form>
      <p className="mt-3 text-xs text-steel-muted-70">
        Payload: JSON com area, soldas_realizadas, saldo_soldas, total_previsto, porcentagem, data_referencia e turno. Em produção, use WSS/HTTPS. Credenciais MQTT ficam apenas na memória desta aba.
      </p>
    </section>
  )
}
