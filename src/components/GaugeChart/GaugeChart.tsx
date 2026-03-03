import ReactECharts          from 'echarts-for-react'
import { useMemo }           from 'react'
import { getStatusColor }    from '@/utils/colorRules'

interface GaugeChartProps {
  progresso: number
  restante:  number
}

export function GaugeChart({ progresso }: GaugeChartProps) {
  const color = getStatusColor(progresso)

  const option = useMemo(() => ({
    backgroundColor: 'transparent',

    series: [
      {
        type:       'gauge',
        startAngle: 200,
        endAngle:   -20,
        min:        0,
        max:        100,
        radius:     '88%',

        pointer: {
          length:       '68%',
          width:        6,
          offsetCenter: [0, '0%'],
          itemStyle:    { color },
        },

        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [progresso / 100, color],
              [1, '#2a2a3a'],
            ],
          },
        },

        // Esconder elementos desnecessários para um visual mais limpo
        axisTick:  { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },

        // Âncora central — círculo no pivô do ponteiro
        anchor: {
          show:      true,
          showAbove: true,
          size:      16,
          itemStyle: { borderWidth: 6, borderColor: color, color: '#16161f' },
        },
        
        // Detalhes numéricos no centro do gauge
        detail: {
          valueAnimation: true,
          fontSize:       38,
          fontWeight:     700,
          fontFamily:     'Inter, sans-serif',
          color,
          offsetCenter:   [0, '38%'],
          formatter:      '{value}%',
        },

        // Título abaixo do detalhe numérico
        title: {
          show:         true,
          offsetCenter: [0, '62%'],
          color:        '#94a3b8',
          fontSize:     11,
          fontFamily:   'Inter, sans-serif',
        },

        data: [{ value: progresso, name: 'Progresso Global' }],
      },
    ],
  }), [progresso, color])

  return (
    <article
      className="rounded-xl bg-fenix-card border border-fenix-border p-5"
      aria-label={`Progresso global: ${progresso}%`}
    >
      <h2 className="text-sm font-semibold text-steel uppercase tracking-wider mb-1">
        Progresso Global
      </h2>
      <p className="text-xs text-steel mb-4">Avanço total de soldas do projeto</p>

      <ReactECharts
        option={option}
        style={{ height: '280px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        aria-label={`Medidor mostrando ${progresso}% de progresso`}
      />
    </article>
  )
}