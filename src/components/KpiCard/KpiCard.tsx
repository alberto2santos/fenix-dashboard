// ============================================================
// KpiCard.tsx — Card de KPI com semáforo de status
// - Borda âmbar para card destacado
// - Badge de status baseado em porcentagem
// - Tooltip nativo e acessibilidade completa
// ============================================================

import { memo }              from 'react'
import { clsx }              from 'clsx'
import type { LucideIcon }   from 'lucide-react'
import { getStatusClasses }  from '@/utils/colorRules'

// ─── Props ───────────────────────────────────────────────────
interface KpiCardProps {
  label:       string
  value:       string | number
  icon:        LucideIcon
  tooltip?:    string
  percentage?: number   // Se informado, aplica semáforo de status
  suffix?:     string   // Ex: "%" ou " soldas"
  highlight?:  boolean  // Destaque principal (borda âmbar)
  trend?:      'up' | 'down' | 'neutral' // Tendência opcional
}

// ─── Componente ──────────────────────────────────────────────
export const KpiCard = memo(function KpiCard({
  label,
  value,
  icon: Icon,
  tooltip,
  percentage,
  suffix      = '',
  highlight   = false,
  trend,
}: KpiCardProps) {
  const statusClasses  = percentage !== undefined ? getStatusClasses(percentage) : null
  const isCritical     = statusClasses?.border === 'border-status-critical'

  // Formata valor numérico em pt-BR automaticamente
  const formattedValue =
    typeof value === 'number'
      ? value.toLocaleString('pt-BR')
      : value

  return (
    <article
      className={clsx(
        'relative rounded-xl p-5 bg-fenix-card border transition-all duration-300',
        'hover:shadow-cardHov hover:bg-fenix-cardHover animate-fade_in',
        highlight
          ? 'border-amber shadow-amber'
          : 'border-fenix-border hover:border-fenix-borderAlt',
        isCritical && 'animate-pulse_border',
      )}
      aria-label={`${label}: ${formattedValue}${suffix}`}
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-2">

        {/* ── Label e valor ── */}
        <div className="flex-1 min-w-0">

          {/* Label */}
          <p className="text-xs font-medium text-steel uppercase tracking-wider truncate">
            {label}
          </p>

          {/* Valor principal */}
          <p className="mt-2 text-3xl font-bold text-white leading-none tabular-nums">
            {formattedValue}
            {suffix && (
              <span className="text-lg font-normal text-steel ml-1">
                {suffix}
              </span>
            )}
          </p>

          {/* Linha de rodapé: badge de status + tendência */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">

            {/* Badge de status */}
            {statusClasses && (
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusClasses.bg,
                  statusClasses.text,
                  statusClasses.border,
                )}
                aria-label={`Status: ${statusClasses.label}`}
              >
                {statusClasses.label}
              </span>
            )}

            {/* Indicador de tendência */}
            {trend && (
              <span
                className={clsx(
                  'text-xs font-medium',
                  trend === 'up'      && 'text-status-ok',
                  trend === 'down'    && 'text-status-critical',
                  trend === 'neutral' && 'text-steel',
                )}
                aria-label={
                  trend === 'up'      ? 'Tendência de alta' :
                  trend === 'down'    ? 'Tendência de queda' :
                  'Sem variação'
                }
              >
                {trend === 'up'      ? '↑' :
                 trend === 'down'    ? '↓' :
                 '→'}
              </span>
            )}

          </div>
        </div>

        {/* ── Ícone ── */}
        <div
          className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300',
            highlight  ? 'bg-amber-glow'    : 'bg-fenix-border',
            isCritical && 'bg-status-critBg',
          )}
          aria-hidden="true"
        >
          <Icon
            className={clsx(
              'w-5 h-5 transition-colors duration-300',
              highlight  ? 'text-amber'           : 'text-steel',
              isCritical && 'text-status-critical',
            )}
          />
        </div>

      </div>

      {/* Linha decorativa inferior no card destacado */}
      {highlight && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-transparent via-amber to-transparent"
          aria-hidden="true"
        />
      )}
    </article>
  )
})