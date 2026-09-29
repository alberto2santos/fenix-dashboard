// ============================================================
// App.tsx — Entrada principal do Fênix II Dashboard
// Gerencia estado global de rows e filtro de área
// ============================================================

import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { Analytics }             from '@vercel/analytics/react'
import { useIsRestoring, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppHeader }              from '@/components/AppHeader/AppHeader'
import { AppFooter }              from '@/components/AppFooter/AppFooter'
import { UploadSection }          from '@/components/UploadSection/UploadSection'
import { KpiGrid }                from '@/components/KpiCard/KpiGrid'
import { DataTable }              from '@/components/DataTable/DataTable'
import { useCsvParser, SOLDA_HISTORY_QUERY_KEY, SOLDA_QUERY_KEY } from '@/hooks/useCsvParser'
import { ShiftFilter }            from '@/components/ShiftFilter/ShiftFilter'
import type { SoldaRow }          from '@/schemas/soldaSchema'
import { DOWNTIME_QUERY_KEY }     from '@/schemas/downtimeSchema'
import type { DowntimeEvent }     from '@/schemas/downtimeSchema'
import { mergeSnapshotHistory, selectLatestSnapshots } from '@/utils/snapshotHistory'
import type { ShiftFilter as ShiftFilterValue } from '@/utils/snapshotHistory'

const ChartsSection = lazy(() => import('@/components/ChartsSection/ChartsSection').then((module) => ({
  default: module.ChartsSection,
})))
const DowntimeSection = lazy(() => import('@/components/DowntimeSection/DowntimeSection').then((module) => ({
  default: module.DowntimeSection,
})))
const RealtimeIngestion = lazy(() => import('@/components/RealtimeIngestion/RealtimeIngestion').then((module) => ({
  default: module.RealtimeIngestion,
})))
const AlertSettings = lazy(() => import('@/components/AlertSettings/AlertSettings').then((module) => ({
  default: module.AlertSettings,
})))

type OptionalToolKey = 'realtime' | 'alerts' | 'downtime'
type OptionalTools = Record<OptionalToolKey, boolean>

const OPTIONAL_TOOLS_KEY = 'fenix-optional-tools-v1'
const OPTIONAL_TOOL_OPTIONS: { key: OptionalToolKey; label: string; description: string }[] = [
  { key: 'realtime', label: 'Ingestão em tempo real', description: 'MQTT, WebSocket ou SSE' },
  { key: 'alerts', label: 'Alertas de avanço', description: 'Notificações e webhooks' },
  { key: 'downtime', label: 'Paradas e retrabalho', description: 'Registro operacional por área' },
]

function readOptionalTools(): OptionalTools {
  const defaults: OptionalTools = { realtime: false, alerts: false, downtime: false }
  try {
    const stored = window.localStorage.getItem(OPTIONAL_TOOLS_KEY)
    if (!stored) return defaults
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return defaults
    const values = parsed as Partial<OptionalTools>
    return {
      realtime: values.realtime === true,
      alerts: values.alerts === true,
      downtime: values.downtime === true,
    }
  } catch {
    return defaults
  }
}

export default function App() {
  const queryClient = useQueryClient()
  const isRestoring = useIsRestoring()
  const { data: historyRows = [] } = useQuery<SoldaRow[]>({
    queryKey: SOLDA_HISTORY_QUERY_KEY,
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
  })
  const { data: downtimeEvents = [] } = useQuery<DowntimeEvent[]>({
    queryKey: DOWNTIME_QUERY_KEY,
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
  })
  const [activeShift, setActiveShift] = useState<ShiftFilterValue>('ALL')
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [optionalTools, setOptionalTools] = useState<OptionalTools>(readOptionalTools)
  const dashboardResultsRef = useRef<HTMLElement | null>(null)
  const rows = useMemo(
    () => selectLatestSnapshots(historyRows, activeShift),
    [historyRows, activeShift],
  )

  useEffect(() => {
    if (isRestoring || historyRows.length > 0) return
    const legacyRows = queryClient.getQueryData<SoldaRow[]>(SOLDA_QUERY_KEY) ?? []
    if (legacyRows.length > 0) {
      queryClient.setQueryData<SoldaRow[]>(SOLDA_HISTORY_QUERY_KEY, mergeSnapshotHistory([], legacyRows))
    }
  }, [historyRows.length, isRestoring, queryClient])

  // ── Parser CSV (UploadSection) ───────────────────────────
  const { parseFile, isLoading, error } = useCsvParser()

  useEffect(() => {
    try {
      window.localStorage.setItem(OPTIONAL_TOOLS_KEY, JSON.stringify(optionalTools))
    } catch {
      // A escolha de ferramentas continua funcionando mesmo se o navegador bloquear o armazenamento local.
    }
  }, [optionalTools])

  const toggleOptionalTool = useCallback((key: OptionalToolKey) => {
    setOptionalTools((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  const handleViewResults = useCallback(() => {
    dashboardResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    dashboardResultsRef.current?.focus({ preventScroll: true })
  }, [])

  // ── Dados vindos do SettingsDrawer (manual ou CSV interno)
  // Sobrescreve área se já existir — adiciona se for nova
  const handleDataAdd = useCallback((newRows: SoldaRow[]) => {
    queryClient.setQueryData<SoldaRow[]>(SOLDA_HISTORY_QUERY_KEY, (previous = []) =>
      mergeSnapshotHistory(previous, newRows),
    )
    setAreaFilter(null)
  }, [queryClient])

  const handleDowntimeAdd = useCallback((event: DowntimeEvent) => {
    queryClient.setQueryData<DowntimeEvent[]>(DOWNTIME_QUERY_KEY, (previous = []) => [event, ...previous])
  }, [queryClient])

  const handleDowntimeEnd = useCallback((eventId: string) => {
    queryClient.setQueryData<DowntimeEvent[]>(DOWNTIME_QUERY_KEY, (previous = []) =>
      previous.map((event) => event.id === eventId && !event.endedAt
        ? { ...event, endedAt: new Date().toISOString() }
        : event),
    )
  }, [queryClient])

  // ── Filtro de área (clique no gráfico ou tabela) ─────────
  const handleFilterChange = useCallback((area: string | null) => {
    setAreaFilter(area)
  }, [])

  const filteredRows = areaFilter
    ? rows.filter((r) => r.area === areaFilter)
    : rows

  const lastUpdated = rows.length > 0 ? rows[0].dataReferencia ?? null : null
  const hasData     = historyRows.length > 0

  return (
    <div className="min-h-dvh flex flex-col bg-fenix-bg">

      <AppHeader
        lastUpdated={lastUpdated}
        onDataAdd={handleDataAdd}       // ✅ conectado ao SettingsDrawer
      />

      <main
        className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        aria-label="Conteúdo principal do dashboard"
      >
        <UploadSection
          onFileSelect={parseFile}
          isLoading={isLoading}
          error={error}
          hasData={hasData}
          onViewData={handleViewResults}
        />

        {hasData && (
          <ShiftFilter
            value={activeShift}
            onChange={setActiveShift}
            available={historyRows.some((row) => row.turno !== undefined)}
          />
        )}

        {hasData && rows.length === 0 && (
          <p className="rounded-lg border border-fenix-border bg-fenix-card p-4 text-sm text-steel" role="status">
            Não há registros para o turno selecionado.
          </p>
        )}

        {rows.length > 0 && (
          <section
            id="dashboard-results"
            ref={dashboardResultsRef}
            tabIndex={-1}
            aria-label="Resultados do dashboard"
            className="scroll-mt-6 space-y-6 rounded-xl focus-visible:outline-none"
          >
            <KpiGrid rows={rows} />

            <Suspense fallback={<p className="rounded-xl border border-fenix-border bg-fenix-card p-5 text-sm text-steel">Carregando gráficos…</p>}>
              <ChartsSection
                rows={rows}
                history={historyRows}
                shift={activeShift}
                onAreaClick={handleFilterChange}
                activeArea={areaFilter}
              />
            </Suspense>

            <DataTable
              rows={filteredRows}
              allRows={rows}
              activeFilter={areaFilter}
              onFilterChange={handleFilterChange}
            />
          </section>
        )}

        <section className="space-y-4" aria-label="Ferramentas opcionais">
          <details className="group rounded-xl border border-fenix-border bg-fenix-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 outline-none transition-colors hover:bg-fenix-surface focus-visible:ring-2 focus-visible:ring-amber [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-semibold text-white">Ferramentas opcionais</span>
                <span className="mt-1 block text-xs text-steel">Ative apenas os recursos que fazem parte da sua rotina.</span>
              </span>
              <span className="shrink-0 rounded-full border border-fenix-border px-3 py-1 text-xs text-steel">
                {Object.values(optionalTools).filter(Boolean).length} ativo(s)
              </span>
            </summary>

            <div className="grid grid-cols-1 gap-3 border-t border-fenix-border p-4 md:grid-cols-3">
              {OPTIONAL_TOOL_OPTIONS.map(({ key, label, description }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-fenix-border bg-fenix-surface p-3 transition-colors hover:border-amber">
                  <input
                    type="checkbox"
                    checked={optionalTools[key]}
                    onChange={() => toggleOptionalTool(key)}
                    className="mt-0.5 h-4 w-4 accent-amber"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">{label}</span>
                    <span className="mt-1 block text-xs text-steel">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </details>

          <Suspense fallback={Object.values(optionalTools).some(Boolean)
            ? <p className="rounded-xl border border-fenix-border bg-fenix-card p-4 text-sm text-steel">Carregando ferramenta…</p>
            : null}
          >
            {optionalTools.realtime && <RealtimeIngestion />}
            {optionalTools.alerts && <AlertSettings rows={rows} shift={activeShift} />}
            {optionalTools.downtime && (
              <DowntimeSection
                events={downtimeEvents}
                areas={[...new Set(historyRows.map((row) => row.area))]}
                shift={activeShift}
                onAdd={handleDowntimeAdd}
                onEnd={handleDowntimeEnd}
              />
            )}
          </Suspense>
        </section>
      </main>

      <AppFooter />

      <Analytics />

    </div>
  )
}
