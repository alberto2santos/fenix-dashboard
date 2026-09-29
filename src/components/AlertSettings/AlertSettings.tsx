import { useEffect, useMemo, useRef, useState } from 'react'
import type { SoldaRow } from '@/schemas/soldaSchema'
import type { ShiftFilter } from '@/utils/snapshotHistory'
import { useSettings } from '@/hooks/useSettings'

interface AlertSettingsProps {
  rows: SoldaRow[]
  shift: ShiftFilter
}

interface WebhookStatus {
  configured: boolean
  provider: string
}

function getAreaThreshold(area: string, overrides: Record<string, number>, defaultThreshold: number) {
  return overrides[area] ?? defaultThreshold
}

export function AlertSettings({ rows, shift }: AlertSettingsProps) {
  const { settings, updateSettings } = useSettings()
  const [message, setMessage] = useState('')
  const previousCriticalAreas = useRef<Set<string> | null>(null)
  const criticalRows = useMemo(
    () => rows.filter((row) => row.porcentagem < getAreaThreshold(row.area, settings.areaThresholds, settings.criticalThresholdPercent)),
    [rows, settings.areaThresholds, settings.criticalThresholdPercent],
  )

  useEffect(() => {
    const currentAreas = new Set(criticalRows.map((row) => row.area))
    const previousAreas = previousCriticalAreas.current
    previousCriticalAreas.current = currentAreas
    if (!previousAreas) return

    const newlyCritical = criticalRows.filter((row) => !previousAreas.has(row.area))
    if (newlyCritical.length === 0) return

    if (settings.browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de avanço do Fênix II', {
        body: newlyCritical.map((row) => `${row.area}: ${row.porcentagem.toFixed(1)}%`).join(' · '),
      })
    }

    if (settings.webhookAlertsEnabled) {
      void fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: newlyCritical.map((row) => ({
            area: row.area,
            progress: row.porcentagem,
            threshold: getAreaThreshold(row.area, settings.areaThresholds, settings.criticalThresholdPercent),
            ...(shift !== 'ALL' ? { shift } : {}),
          })),
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json().catch(() => ({})) as { error?: string }
            throw new Error(data.error ?? `O servidor respondeu HTTP ${response.status}.`)
          }
          setMessage('Alerta enviado ao webhook configurado no servidor.')
        })
        .catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : 'Falha ao enviar o alerta ao webhook.')
        })
    }
  }, [criticalRows, settings.areaThresholds, settings.browserNotificationsEnabled, settings.criticalThresholdPercent, settings.webhookAlertsEnabled, shift])

  const handleBrowserToggle = async (enabled: boolean) => {
    setMessage('')
    if (!enabled) {
      updateSettings({ browserNotificationsEnabled: false })
      return
    }
    if (!('Notification' in window)) {
      setMessage('Este navegador não oferece notificações nativas.')
      return
    }
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
    updateSettings({ browserNotificationsEnabled: permission === 'granted' })
    if (permission !== 'granted') setMessage('Permissão de notificação não concedida.')
  }

  const handleWebhookToggle = async (enabled: boolean) => {
    setMessage('')
    if (!enabled) {
      updateSettings({ webhookAlertsEnabled: false })
      return
    }

    try {
      const response = await fetch('/api/alerts')
      const status = await response.json() as WebhookStatus
      if (!response.ok || !status.configured) {
        setMessage('Configure o webhook no servidor antes de ativar este envio.')
        return
      }
      updateSettings({ webhookAlertsEnabled: true })
      setMessage(`Webhook ${status.provider} ativo.`)
    } catch {
      setMessage('Não foi possível verificar o webhook. Inicie o servidor local ou configure a função da Vercel.')
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-fenix-border bg-fenix-card p-5" aria-label="Alertas configuráveis">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-steel">Alertas configuráveis</h2>
        <p className="mt-1 text-xs text-steel">
          O limiar compara o avanço acumulado da área com seu percentual do total previsto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1 text-xs text-steel">
          Avanço mínimo esperado (%)
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={settings.criticalThresholdPercent}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value) && value >= 0 && value <= 100) {
                updateSettings({ criticalThresholdPercent: value })
              }
            }}
            className="w-full rounded-md border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex items-center gap-2 rounded-lg bg-fenix-surface p-3 text-sm text-white">
          <input
            type="checkbox"
            checked={settings.browserNotificationsEnabled}
            onChange={(event) => void handleBrowserToggle(event.target.checked)}
            className="accent-amber"
          />
          Notificações do navegador
        </label>
        <label className="flex items-center gap-2 rounded-lg bg-fenix-surface p-3 text-sm text-white">
          <input
            type="checkbox"
            checked={settings.webhookAlertsEnabled}
            onChange={(event) => void handleWebhookToggle(event.target.checked)}
            className="accent-amber"
          />
          Envio por webhook
        </label>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-steel">Limiares específicos por área</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const hasOverride = settings.areaThresholds[row.area] !== undefined
              return (
                <div key={row.area} className="flex items-end gap-2 rounded-lg bg-fenix-surface p-3">
                  <label className="flex-1 space-y-1 text-xs text-steel">
                    {row.area} (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      aria-label={`Limiar de ${row.area} (%)`}
                      value={getAreaThreshold(row.area, settings.areaThresholds, settings.criticalThresholdPercent)}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isFinite(value) || value < 0 || value > 100) return
                        updateSettings({ areaThresholds: { ...settings.areaThresholds, [row.area]: value } })
                      }}
                      className="w-full rounded-md border border-fenix-border bg-fenix-card px-3 py-2 text-sm text-white"
                    />
                  </label>
                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => updateSettings({
                        areaThresholds: Object.fromEntries(
                          Object.entries(settings.areaThresholds).filter(([area]) => area !== row.area),
                        ),
                      })}
                      className="rounded-md border border-fenix-border px-2 py-2 text-xs text-steel hover:text-white"
                      aria-label={`Usar limiar geral para ${row.area}`}
                    >
                      Geral
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-steel">
        <span role="status">{criticalRows.length} área(s) abaixo do limiar.</span>
        <span>Os alertas são enviados quando uma área cruza o limiar.</span>
        {message && <span aria-live="polite">{message}</span>}
      </div>
    </section>
  )
}
