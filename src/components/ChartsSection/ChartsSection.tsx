// ============================================================
// ChartsSection.tsx — Seção de gráficos do dashboard
// - Gauge de progresso global
// - Barras horizontais por área (com filtro interativo)
// - Histórico de progresso (largura total)
// ============================================================

import { memo }             from 'react'
import { GaugeChart }       from '@/components/GaugeChart/GaugeChart'
import { BarChart }         from '@/components/BarChart/BarChart'
import { HistoryChart }     from '@/components/HistoryChart/HistoryChart'
import { ForecastPanel }    from '@/components/ForecastPanel/ForecastPanel'
import { ProductivityHeatmap } from '@/components/ProductivityHeatmap/ProductivityHeatmap'
import { useDashboardData } from '@/hooks/useDashboardData'
import type { SoldaRow }    from '@/schemas/soldaSchema'
import type { ShiftFilter } from '@/utils/snapshotHistory'

// ─── Props ───────────────────────────────────────────────────
interface ChartsSectionProps {
  rows:        SoldaRow[]
  history:     SoldaRow[]
  shift:       ShiftFilter
  onAreaClick: (area: string | null) => void
  activeArea:  string | null
}

// ─── Componente ──────────────────────────────────────────────
export const ChartsSection = memo(function ChartsSection({
  rows,
  history,
  shift,
  onAreaClick,
  activeArea,
}: ChartsSectionProps) {
  const { gaugeData, areaChartData } = useDashboardData(rows)

  // Sem dados → não renderiza a seção
  if (rows.length === 0) return null

  return (
    <section
      aria-label="Gráficos de desempenho"
      className="space-y-4"
    >
      {/* Linha 1: Gauge + Barras (lado a lado no desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GaugeChart
          progresso={gaugeData.progresso}
          restante={gaugeData.restante}
        />
        <BarChart
          data={areaChartData}
          onBarClick={onAreaClick}
          activeArea={activeArea}
        />
      </div>

      {/* Linha 2: Histórico (largura total) */}
      <HistoryChart data={areaChartData} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ForecastPanel history={history} shift={shift} />
        <ProductivityHeatmap history={history} shift={shift} />
      </div>
    </section>
  )
})
