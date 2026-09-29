import { EChartsView } from '@/components/charts/EChartsView'
import { useMemo } from 'react'
import type { SoldaRow } from '@/schemas/soldaSchema'
import type { ShiftFilter } from '@/utils/snapshotHistory'
import { calculateWeekdayProductivity } from '@/utils/snapshotHistory'

interface ProductivityHeatmapProps {
  history: SoldaRow[]
  shift: ShiftFilter
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ProductivityHeatmap({ history, shift }: ProductivityHeatmapProps) {
  const { areas, data, max } = useMemo(() => {
    const productivity = calculateWeekdayProductivity(history, shift)
    const areaNames = [...new Set(productivity.map((cell) => cell.area))]
    const areaIndex = new Map(areaNames.map((area, index) => [area, index]))
    const values = productivity.map((cell) => [cell.weekday, areaIndex.get(cell.area) ?? 0, cell.production])

    return {
      areas: areaNames,
      data: values,
      max: Math.max(1, ...productivity.map((cell) => cell.production)),
    }
  }, [history, shift])

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: '#16161f',
      borderColor: '#2a2a3a',
      textStyle: { color: '#fff', fontFamily: 'Inter', fontSize: 12 },
      formatter: (params: { data: [number, number, number] }) =>
        `${areas[params.data[1]]} · ${WEEKDAYS[params.data[0]]}: ${params.data[2].toLocaleString('pt-BR')} soldas`,
    },
    grid: { left: 110, right: 24, top: 20, bottom: 44 },
    xAxis: {
      type: 'category',
      data: WEEKDAYS,
      splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
      axisLine: { lineStyle: { color: '#2a2a3a' } },
    },
    yAxis: {
      type: 'category',
      data: areas,
      splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontFamily: 'Inter' },
      axisLine: { lineStyle: { color: '#2a2a3a' } },
    },
    visualMap: {
      min: 0,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: '#94a3b8', fontFamily: 'Inter' },
      inRange: { color: ['#1e293b', '#0f766e', '#34d399'] },
    },
    series: [{ name: 'Soldas por dia da semana', type: 'heatmap', data, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.45)' } } }],
  }), [areas, data, max])

  return (
    <article className="rounded-xl border border-fenix-border bg-fenix-card p-5" aria-label="Mapa de calor da produtividade por dia da semana">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-steel">
        Produtividade por dia da semana
      </h2>
      <p className="mb-4 text-xs text-steel">
        Variação entre snapshots cumulativos consecutivos, agrupada pelo dia do último registro.
      </p>
      {data.length === 0 ? (
        <p className="rounded-lg border border-fenix-border bg-fenix-surface p-4 text-sm text-steel">
          São necessárias pelo menos duas datas de referência por área.
        </p>
      ) : (
        <EChartsView
          option={option}
          style={{ height: `${Math.max(260, areas.length * 42 + 80)}px`, width: '100%' }}
          opts={{ renderer: 'canvas' }}
          aria-label="Mapa de calor com produtividade por área e dia da semana"
        />
      )}
    </article>
  )
}
