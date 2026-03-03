// ============================================================
// colorRules.ts — Sistema de semáforo por percentual
// Retorna cores e labels baseados no progresso da área
//
// Regras:
//   < 60%  → Crítico  (vermelho)
//   60-80% → Atenção  (âmbar)
//   > 80%  → OK       (verde)
// ============================================================

// ─── Tipo de status ──────────────────────────────────────────
export type StatusLevel = 'ok' | 'warning' | 'critical'

// ─── Thresholds configuráveis ────────────────────────────────
const THRESHOLD_WARNING  = 80  // Acima disso → ok
const THRESHOLD_CRITICAL = 60  // Abaixo disso → crítico

// ─── Maps estáticos (fora das funções — criados uma vez) ─────
const STATUS_COLORS: Record<StatusLevel, string> = {
  ok:       '#10b981',
  warning:  '#f59e0b',
  critical: '#ef4444',
}

// ✅ Tipo explícito para o retorno do getStatusClasses
export interface StatusClasses {
  bg:     string
  text:   string
  border: string
  label:  string
}

const STATUS_CLASSES: Record<StatusLevel, StatusClasses> = {
  ok: {
    bg:     'bg-status-okBg',
    text:   'text-status-ok',
    border: 'border-status-ok',
    label:  'No Prazo',
  },
  warning: {
    bg:     'bg-status-warnBg',
    text:   'text-status-warning',
    border: 'border-status-warning',
    label:  'Atenção',
  },
  critical: {
    bg:     'bg-status-critBg',
    text:   'text-status-critical',
    border: 'border-status-critical',
    label:  'Crítico',
  },
}

// ─── Retorna o nível de status baseado no % ──────────────────
export function getStatusLevel(porcentagem: number): StatusLevel {
  if (porcentagem >= THRESHOLD_WARNING)  return 'ok'
  if (porcentagem >= THRESHOLD_CRITICAL) return 'warning'
  return 'critical'
}

// ─── Retorna a cor HEX para gráficos ─────────────────────────
export function getStatusColor(porcentagem: number): string {
  return STATUS_COLORS[getStatusLevel(porcentagem)]
}

// ─── Retorna classes Tailwind para badges ────────────────────
export function getStatusClasses(porcentagem: number): StatusClasses {
  return STATUS_CLASSES[getStatusLevel(porcentagem)]
}

// ─── Retorna array de cores para o ECharts ───────────────────
export function getChartColors(percentages: number[]): string[] {
  return percentages.map(getStatusColor)
}