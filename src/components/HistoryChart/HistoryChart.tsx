// ============================================================
// HistoryChart.tsx — Comparativo de soldas por área
// - Barras agrupadas: Realizado × Previsto × Saldo
// - Tooltip formatado em pt-BR
// - Altura dinâmica com base no número de áreas
// ============================================================

import ReactECharts       from 'echarts-for-react'
import { useMemo }        from 'react'
import type { AreaChartData } from '@/hooks/useDashboardData'

// ─── Props ───────────────────────────────────────────────────
interface HistoryChartProps {
  data: AreaChartData[]
}

// ─── Cores das séries ────────────────────────────────────────
const SERIES_COLORS = {
  realizado: '#10b981',
  previsto:  '#3b82f6',
  saldo:     '#f59e0b',
} as const

// ─── Componente ──────────────────────────────────────────────
export function HistoryChart({ data }: HistoryChartProps) {

  const option = useMemo(() => {
    const areas     = data.map((d) => d.area)
    const realizadas = data.map((d) => d.realizadas)
    const previsto   = data.map((d) => d.previsto)
    const saldo      = data.map((d) => d.saldo)

    return {
      backgroundColor: 'transparent',

      legend: {
        data:      ['Realizado', 'Previsto', 'Saldo'],
        top:       0,
        textStyle: { color: '#94a3b8', fontFamily: 'Inter', fontSize: 12 },
        itemStyle: { borderRadius: 2 },
      },

      tooltip: {
        trigger:         'axis',
        backgroundColor: '#16161f',
        borderColor:     '#2a2a3a',
        textStyle:       { color: '#fff', fontFamily: 'Inter', fontSize: 12 },
        axisPointer:     { type: 'shadow' },
        // Tooltip com valores formatados em pt-BR
        formatter: (params: unknown[]) => {
          const items = params as { seriesName: string; value: number; color: string }[]
          const area  = (items[0] as { axisValueLabel?: string; axisValue?: string })
            ?.axisValueLabel ?? (items[0] as { axisValue?: string })?.axisValue ?? ''

          const rows = items
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:16px">
                  <span style="color:${p.color}">● ${p.seriesName}</span>
                  <strong>${p.value.toLocaleString('pt-BR')}</strong>
                </div>`
            )
            .join('')

          return `
            <div style="font-family:Inter,sans-serif;min-width:180px">
              <div style="color:#f59e0b;font-weight:600;margin-bottom:6px">${area}</div>
              ${rows}
            </div>
          `
        },
      },

      grid: {
        left:         '3%',
        right:        '3%',
        bottom:       '3%',
        top:          '50px',
        containLabel: true,
      },

      xAxis: {
        type: 'category',
        data: areas,
        axisLabel: {
          color:      '#475569',
          fontFamily: 'Inter',
          fontSize:   10,
          // Rotaciona automaticamente quando há muitas áreas
          rotate:     areas.length > 5 ? 30 : 0,
          // Trunca nomes longos
          formatter:  (v: string) => v.length > 14 ? `${v.slice(0, 12)}…` : v,
        },
        axisLine: { lineStyle: { color: '#2a2a3a' } },
      },

      yAxis: {
        type: 'value',
        axisLabel: {
          color:      '#475569',
          fontFamily: 'Inter',
          fontSize:   11,
          formatter:  (v: number) => v.toLocaleString('pt-BR'),
        },
        splitLine: { lineStyle: { color: '#2a2a3a', type: 'dashed' } },
      },

      series: [
        {
          name:        'Realizado',
          type:        'bar',
          data:        realizadas,
          barMaxWidth: 28,
          itemStyle: {
            color:        SERIES_COLORS.realizado,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.85 },
          },
        },
        {
          name:        'Previsto',
          type:        'bar',
          data:        previsto,
          barMaxWidth: 28,
          itemStyle: {
            color:        SERIES_COLORS.previsto,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.85 },
          },
        },
        {
          name:        'Saldo',
          type:        'bar',
          data:        saldo,
          barMaxWidth: 28,
          itemStyle: {
            color:        SERIES_COLORS.saldo,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.85 },
          },
        },
      ],
    }
  }, [data])

  // Altura cresce com o número de áreas (mínimo 300px)
  const chartHeight = Math.max(300, data.length * 28)

  return (
    <article
      className="rounded-xl bg-fenix-card border border-fenix-border p-5"
      aria-label="Comparativo de soldas por área"
    >
      <h2 className="text-sm font-semibold text-steel uppercase tracking-wider mb-1">
        Comparativo por Área
      </h2>
      <p className="text-xs text-steel mb-4">
        Realizado × Previsto × Saldo — todas as áreas
      </p>

      <ReactECharts
        option={option}
        style={{ height: `${chartHeight}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        aria-label="Gráfico comparativo de barras agrupadas por área"
      />
    </article>
  )
}