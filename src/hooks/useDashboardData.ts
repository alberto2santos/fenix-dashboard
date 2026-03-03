// ============================================================
// useDashboardData.ts — Hook de métricas calculadas
// Recebe as linhas do CSV e retorna KPIs e dados para gráficos
// Centraliza toda lógica de cálculo fora dos componentes
// ============================================================

import { useMemo }            from 'react'
import type { SoldaRow }      from '@/schemas/soldaSchema'
import { getStatusColor }     from '@/utils/colorRules'

// ─── Tipos de retorno ────────────────────────────────────────
export interface DashboardKpis {
  avancoReal:       number
  soldasRealizadas: number
  saldoTotal:       number
  totalPrevisto:    number
}

export interface AreaChartData {
  area:        string
  realizadas:  number
  saldo:       number
  previsto:    number
  porcentagem: number
  statusColor: string
}

export interface DashboardData {
  kpis:          DashboardKpis
  areaChartData: AreaChartData[]
  gaugeData: {
    progresso: number
    restante:  number
  }
}

// ─── Helper ──────────────────────────────────────────────────
function toFixed2(n: number): number {
  return parseFloat(n.toFixed(2))
}

// ─── Hook Principal ──────────────────────────────────────────
export function useDashboardData(rows: SoldaRow[]): DashboardData {
  return useMemo(() => {

    // Map puro — sem mutação de variáveis externas
    const areaChartData: AreaChartData[] = rows.map((row) => ({
      area:        row.area,
      realizadas:  row.soldasRealizadas,
      saldo:       row.saldoSoldas,
      previsto:    row.totalPrevisto,
      porcentagem: row.porcentagem,
      statusColor: getStatusColor(row.porcentagem),
    }))

    // Totais via reduce — sem let + reatribuição
    const totals = rows.reduce(
      (acc, row) => ({
        realizadas: acc.realizadas + row.soldasRealizadas,
        saldo:      acc.saldo      + row.saldoSoldas,
        previsto:   acc.previsto   + row.totalPrevisto,
      }),
      { realizadas: 0, saldo: 0, previsto: 0 }
    )

    const avancoReal = totals.previsto > 0
      ? (totals.realizadas / totals.previsto) * 100
      : 0

    return {
      kpis: {
        avancoReal:       toFixed2(avancoReal),
        soldasRealizadas: totals.realizadas,
        saldoTotal:       totals.saldo,
        totalPrevisto:    totals.previsto,
      },
      areaChartData,
      gaugeData: {
        progresso: toFixed2(avancoReal),
        restante:  toFixed2(100 - avancoReal),
      },
    }

  }, [rows])
}