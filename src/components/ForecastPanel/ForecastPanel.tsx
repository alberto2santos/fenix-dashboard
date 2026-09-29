import { useMemo } from 'react'
import type { SoldaRow } from '@/schemas/soldaSchema'
import type { ShiftFilter } from '@/utils/snapshotHistory'
import { estimateAreaCompletion } from '@/utils/snapshotHistory'

interface ForecastPanelProps {
  history: SoldaRow[]
  shift: ShiftFilter
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

export function ForecastPanel({ history, shift }: ForecastPanelProps) {
  const forecasts = useMemo(() => estimateAreaCompletion(history, shift), [history, shift])

  return (
    <article className="rounded-xl border border-fenix-border bg-fenix-card p-5" aria-label="Previsão de conclusão por área">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-steel">
        Projeção de conclusão
      </h2>
      <p className="mb-4 text-xs text-steel">
        Regressão linear sobre snapshots cumulativos, com pelo menos duas datas por área.
      </p>

      {forecasts.length === 0 ? (
        <p className="rounded-lg border border-fenix-border bg-fenix-surface p-4 text-sm text-steel">
          Importe dados históricos para calcular as projeções.
        </p>
      ) : (
        <ul className="space-y-2">
          {forecasts.map((forecast) => (
            <li key={forecast.area} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-fenix-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{forecast.area}</p>
                <p className="text-xs text-steel">
                  {forecast.snapshots} datas · {forecast.productionPerDay.toLocaleString('pt-BR')} soldas/dia na tendência
                </p>
              </div>
              <p className="text-sm font-medium text-amber">
                {forecast.estimatedEndDate
                  ? formatDate(forecast.estimatedEndDate)
                  : forecast.snapshots < 2 ? 'Histórico insuficiente' : 'Sem tendência de avanço'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
