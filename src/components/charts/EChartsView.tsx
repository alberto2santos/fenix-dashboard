import type { EChartsReactProps } from 'echarts-for-react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  GaugeChart,
  HeatmapChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

export function EChartsView(props: EChartsReactProps) {
  return <ReactEChartsCore {...props} echarts={echarts} />
}
