import { AlertTriangle, CheckCircle } from 'lucide-react'
import { getStatusLevel } from '@/utils/colorRules'
import type { SoldaRow } from '@/schemas/soldaSchema'

// ─── Props ───────────────────────────────────────────────────
interface AlertBadgeProps {
  rows: SoldaRow[]
}

// ─── Helpers ─────────────────────────────────────────────────
// Motivo legível para exibir na badge
function getAlertReason(row: SoldaRow): string {
  if (row.saldoSoldas === 0)                          return 'Concluída'
  if (row.porcentagem === 0)                          return 'Sem progresso'
  if (getStatusLevel(row.porcentagem) === 'critical') return `${row.porcentagem.toFixed(1)}%`
  return ''
}

// ─── Componente ──────────────────────────────────────────────
export function AlertBadge({ rows }: AlertBadgeProps) {
  // Áreas críticas: saldo zerado OU progresso crítico
  const criticas = rows.filter(
    (r) => r.saldoSoldas === 0 || getStatusLevel(r.porcentagem) === 'critical'
  )

  // ── Tudo OK ───────────────────────────────────────────────
  if (criticas.length === 0) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-status-ok"
        role="status"
        aria-live="polite"
        aria-label="Todas as áreas dentro do esperado"
      >
        <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>Todas as áreas dentro do esperado</span>
      </div>
    )
  }

  // ── Alertas ───────────────────────────────────────────────
  return (
    <div role="alert" aria-live="assertive" aria-label={`${criticas.length} área(s) requer(em) atenção`}>

      {/* Cabeçalho do alerta */}
      <div className="flex items-center gap-2 text-xs text-status-critical font-semibold mb-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" aria-hidden="true" />
        <span>{criticas.length} área(s) requer(em) atenção</span>
      </div>

      {/* Badges por área */}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Áreas críticas">
        {criticas.map((r) => {
          const reason = getAlertReason(r)

          return (
            <span
              key={r.area}
              role="listitem"
              title={`${r.area}: ${reason}`}
              className="
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                bg-status-critBg text-status-critical border border-status-critical
                animate-pulse_border
              "
            >
              {r.area}
              {reason && (
                <span className="opacity-70">— {reason}</span>
              )}
            </span>
          )
        })}
      </div>

    </div>
  )
}