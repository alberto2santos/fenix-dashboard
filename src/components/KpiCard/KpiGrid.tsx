import { memo }                                    from 'react'
import { TrendingUp, Zap, AlertTriangle, Target }  from 'lucide-react'
import { KpiCard }                                 from './KpiCard'
import { useDashboardData }                        from '@/hooks/useDashboardData'
import type { SoldaRow }                           from '@/schemas/soldaSchema'

// ─── Props ───────────────────────────────────────────────────
interface KpiGridProps {
  rows: SoldaRow[]
}

// ─── Componente ──────────────────────────────────────────────
export const KpiGrid = memo(function KpiGrid({ rows }: KpiGridProps) {
  const { kpis } = useDashboardData(rows)

  // Percentual do saldo: 100% quando zerado (tudo concluído)
  const saldoPercentage = kpis.saldoTotal === 0 ? 100 : kpis.avancoReal

  // Tendência com base no avanço real
  const avanceTrend =
    kpis.avancoReal >= 80 ? 'up' :
    kpis.avancoReal >= 50 ? 'neutral' :
    'down'

  return (
    <section
      aria-label="Indicadores de desempenho"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >

      {/* Avanço Real — card principal com destaque */}
      <KpiCard
        label="Avanço Real"
        value={kpis.avancoReal.toFixed(1)}
        suffix="%"
        icon={TrendingUp}
        percentage={kpis.avancoReal}
        trend={avanceTrend}
        highlight
        tooltip="Percentual global de soldas concluídas em relação ao total previsto"
      />

      {/* Soldas Realizadas */}
      <KpiCard
        label="Soldas Realizadas"
        value={kpis.soldasRealizadas}
        icon={Zap}
        tooltip="Total de soldas executadas em todas as áreas"
      />

      {/* Saldo em Aberto */}
      <KpiCard
        label="Saldo em Aberto"
        value={kpis.saldoTotal}
        icon={AlertTriangle}
        percentage={saldoPercentage}
        tooltip="Total de soldas que ainda precisam ser executadas"
      />

      {/* Total Previsto */}
      <KpiCard
        label="Total Previsto"
        value={kpis.totalPrevisto}
        icon={Target}
        tooltip="Meta total de soldas planejadas para o projeto"
      />

    </section>
  )
})