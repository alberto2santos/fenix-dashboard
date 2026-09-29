import { useMemo, useState } from 'react'
import { CircleStop, Play, Wrench } from 'lucide-react'
import { DOWNTIME_REASONS } from '@/schemas/downtimeSchema'
import type { DowntimeEvent } from '@/schemas/downtimeSchema'
import type { ShiftFilter } from '@/utils/snapshotHistory'

interface DowntimeSectionProps {
  events: DowntimeEvent[]
  areas: string[]
  shift: ShiftFilter
  onAdd: (event: DowntimeEvent) => void
  onEnd: (eventId: string) => void
}

function getDurationMinutes(event: DowntimeEvent): number {
  const end = event.endedAt ? Date.parse(event.endedAt) : Date.now()
  return Math.max(0, Math.round((end - Date.parse(event.startedAt)) / 60_000))
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}min` : `${rest}min`
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function DowntimeSection({ events, areas, shift, onAdd, onEnd }: DowntimeSectionProps) {
  const [area, setArea] = useState(areas[0] ?? '')
  const [reason, setReason] = useState<(typeof DOWNTIME_REASONS)[number]>(DOWNTIME_REASONS[0])
  const [startedAt, setStartedAt] = useState(() => toLocalInput(new Date()))
  const [turno, setTurno] = useState<'' | 'A' | 'B' | 'C'>('')
  const [reworkCount, setReworkCount] = useState('0')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const filteredEvents = useMemo(
    () => events.filter((event) => shift === 'ALL' || event.turno === shift),
    [events, shift],
  )
  const totalMinutes = filteredEvents.reduce((total, event) => total + getDurationMinutes(event), 0)
  const totalRework = filteredEvents.reduce((total, event) => total + event.reworkCount, 0)
  const openEvents = filteredEvents.filter((event) => !event.endedAt)
  const reasonCounts = filteredEvents.reduce<Record<string, number>>((counts, event) => {
    counts[event.reason] = (counts[event.reason] ?? 0) + 1
    return counts
  }, {})

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!area.trim()) {
      setFormError('Informe a área da parada.')
      return
    }

    const rework = Number(reworkCount)
    if (!Number.isInteger(rework) || rework < 0) {
      setFormError('A quantidade de retrabalho deve ser um número inteiro igual ou maior que zero.')
      return
    }

    onAdd({
      id: crypto.randomUUID(),
      area: area.trim(),
      startedAt: new Date(startedAt).toISOString(),
      reason,
      reworkCount: rework,
      ...(turno ? { turno } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })
    setFormError('')
    setReason(DOWNTIME_REASONS[0])
    setStartedAt(toLocalInput(new Date()))
    setReworkCount('0')
    setNotes('')
  }

  return (
    <section className="space-y-4 rounded-xl border border-fenix-border bg-fenix-card p-5" aria-label="Histórico de paradas e retrabalho">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-steel">Paradas e retrabalho</h2>
        <p className="mt-1 text-xs text-steel">Registre o motivo, a duração e as soldas que precisam ser refeitas.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-fenix-surface p-3">
          <p className="text-xs text-steel">Tempo de parada</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatDuration(totalMinutes)}</p>
        </div>
        <div className="rounded-lg bg-fenix-surface p-3">
          <p className="text-xs text-steel">Paradas em andamento</p>
          <p className="mt-1 text-lg font-semibold text-amber">{openEvents.length}</p>
        </div>
        <div className="rounded-lg bg-fenix-surface p-3">
          <p className="text-xs text-steel">Soldas para retrabalho</p>
          <p className="mt-1 text-lg font-semibold text-white">{totalRework.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-fenix-border bg-fenix-surface p-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-xs text-steel">
          Área
          <input list="downtime-areas" required value={area} onChange={(event) => setArea(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white" />
          <datalist id="downtime-areas">{areas.map((item) => <option key={item} value={item} />)}</datalist>
        </label>
        <label className="space-y-1 text-xs text-steel">
          Motivo
          <select value={reason} onChange={(event) => setReason(event.target.value as (typeof DOWNTIME_REASONS)[number])} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white">
            {DOWNTIME_REASONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-steel">
          Início
          <input type="datetime-local" required value={startedAt} onChange={(event) => setStartedAt(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1 text-xs text-steel">
          Turno
          <select value={turno} onChange={(event) => setTurno(event.target.value as '' | 'A' | 'B' | 'C')} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white">
            <option value="">Sem turno</option>
            <option value="A">Turno A</option>
            <option value="B">Turno B</option>
            <option value="C">Turno C</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-steel">
          Soldas para retrabalho
          <input type="number" min="0" step="1" value={reworkCount} onChange={(event) => setReworkCount(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1 text-xs text-steel">
          Observações
          <input value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white" />
        </label>
        <div className="flex items-center gap-3 md:col-span-2 xl:col-span-3">
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-fenix-bg hover:bg-amber-light">
            <CircleStop className="h-4 w-4" /> Registrar parada
          </button>
          {formError && <p role="alert" className="text-xs text-status-critical">{formError}</p>}
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-fenix-surface p-4 lg:col-span-2">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">Registros</h3>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-steel">Nenhuma parada registrada para este turno.</p>
          ) : (
            <ul className="space-y-2">
              {[...filteredEvents].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map((event) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-fenix-border px-3 py-2">
                  <div className="flex items-start gap-2">
                    {event.endedAt ? <Wrench className="mt-0.5 h-4 w-4 text-steel" /> : <CircleStop className="mt-0.5 h-4 w-4 text-amber" />}
                    <div>
                      <p className="text-sm font-medium text-white">{event.area} · {event.reason}</p>
                      <p className="text-xs text-steel">
                        {new Date(event.startedAt).toLocaleString('pt-BR')} · {formatDuration(getDurationMinutes(event))}
                        {event.turno ? ` · Turno ${event.turno}` : ''} · Retrabalho: {event.reworkCount}
                      </p>
                      {event.notes && <p className="mt-1 text-xs text-steel">{event.notes}</p>}
                    </div>
                  </div>
                  {!event.endedAt && (
                    <button type="button" onClick={() => onEnd(event.id)} className="inline-flex items-center gap-1 rounded-md border border-fenix-border px-2.5 py-1.5 text-xs text-white hover:border-amber">
                      <Play className="h-3 w-3" /> Encerrar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg bg-fenix-surface p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">Motivos registrados</h3>
          {Object.entries(reasonCounts).length === 0 ? (
            <p className="text-sm text-steel">Sem ocorrências.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                <li key={label} className="flex justify-between gap-2 text-sm">
                  <span className="text-steel">{label}</span>
                  <span className="font-medium text-white">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
