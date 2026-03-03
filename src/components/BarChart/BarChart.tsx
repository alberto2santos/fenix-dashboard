// ============================================================
// BarChart.tsx — Gráfico de barras horizontais por área
// - Clique em barra filtra a tabela (toggle)
// - Área ativa destacada, demais com opacidade reduzida
// ============================================================

import ReactECharts          from 'echarts-for-react'
import { useCallback, useMemo } from 'react'
import type { AreaChartData }   from '@/hooks/useDashboardData'

// ─── Props ───────────────────────────────────────────────────
interface BarChartProps {
  data:       AreaChartData[]
  onBarClick: (area: string | null) => void
  activeArea: string | null
}

// ─── Componente ──────────────────────────────────────────────
export function BarChart({ data, onBarClick, activeArea }: BarChartProps) {
  // Inverte para que a última área apareça no topo
  const reversed = useMemo(() => [...data].reverse(), [data])

  // Handler de clique em barra — toggle de filtro
  const onChartClick = useCallback(
    (params: { name: string }) => {
      onBarClick(activeArea === params.name ? null : params.name)
    },
    [activeArea, onBarClick]
  )

  const option = useMemo(() => ({
    backgroundColor: 'transparent',

    tooltip: {
      trigger:     'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#16161f',
      borderColor:     '#2a2a3a',
      textStyle:       { color: '#fff', fontFamily: 'Inter' },
      formatter: (params: unknown[]) => {
        const p = params[0] as { name: string; value: number; color: string }
        return `
          <div style="font-family:Inter,sans-serif;padding:2px 4px">
            <strong style="color:#f59e0b">${p.name}</strong><br/>
            Progresso: <strong style="color:${p.color}">${p.value.toFixed(1)}%</strong>
          </div>
        `
      },
    },

    grid: {
      left: '3%', right: '8%', bottom: '3%', top: '3%',
      containLabel: true,
    },

    xAxis: {
      type: 'value',
      min:  0,
      max:  100,
      axisLabel: {
        color:      '#475569',
        fontFamily: 'Inter',
        formatter:  (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: '#2a2a3a' } },
    },

    yAxis: {
      type: 'category',
      data: reversed.map((d) => d.area),
      axisLabel: {
        color:      '#94a3b8',
        fontFamily: 'Inter',
        fontSize:   11,
        // Trunca nomes longos para não quebrar o layout
        formatter:  (v: string) => v.length > 20 ? `${v.slice(0, 18)}…` : v,
      },
      axisLine: { lineStyle: { color: '#2a2a3a' } },
    },

    series: [
      {
        type:       'bar',
        barMaxWidth: 24,
        data: reversed.map((d) => ({
          value: d.porcentagem,
          itemStyle: {
            color:        d.statusColor,
            borderRadius: [0, 4, 4, 0],
            opacity:      activeArea && activeArea !== d.area ? 0.25 : 1,
          },
        })),

        // Rótulo com % no final da barra
        label: {
          show:       true,
          position:   'right',
          color:      '#94a3b8',
          fontFamily: 'Inter',
          fontSize:   10,
          formatter:  ({ value }: { value: number }) => `${value.toFixed(0)}%`,
        },

        emphasis: {
          itemStyle: { opacity: 1 },
          disabled:  false,
        },
      },
    ],
  }), [reversed, activeArea])

  return (
    <article
      className="rounded-xl bg-fenix-card border border-fenix-border p-5"
      aria-label="Progresso por área de trabalho"
    >
      <h2 className="text-sm font-semibold text-steel uppercase tracking-wider mb-1">
        Progresso por Área
      </h2>

      {/* Legenda de estado do filtro */}
      <p className="text-xs text-steel mb-4 min-h-[1rem]">
        {activeArea ? (
          <>
            <span className="text-amber font-medium">{activeArea}</span>
            {' '}— Clique novamente para remover o filtro
          </>
        ) : (
          'Clique em uma barra para filtrar a tabela'
        )}
      </p>

      <ReactECharts
        option={option}
        style={{ height: `${Math.max(200, reversed.length * 36)}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={{ click: onChartClick }}
        aria-label="Gráfico de barras horizontais com progresso por área"
      />
    </article>
  )
}