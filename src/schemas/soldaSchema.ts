// ============================================================
// soldaSchema.ts — Schema Zod + mapeamento de cabeçalhos CSV
// Valida e normaliza cada linha do CSV antes de usar no app
// ============================================================

import { z } from 'zod'

// ─── Helper: string pt-BR → number ───────────────────────────
// Trata: "1.250,50" → 1250.5 | "0,80" → 0.8 | "80%" → 80
const toNumber = (val: unknown): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val   // ✅ guard NaN em number
  if (typeof val !== 'string') return 0

  const cleaned = val
    .trim()
    .replace('%', '')
    .replace(/\./g, '')
    .replace(',', '.')

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// ─── Schema de uma linha do CSV ──────────────────────────────
export const SoldaRowSchema = z.object({

  area: z
    .string()
    .min(1, 'Área não pode ser vazia')
    .trim(),

  soldasRealizadas: z
    .unknown()
    .transform(toNumber)
    .pipe(z.number().nonnegative('Soldas realizadas não pode ser negativo')),

  saldoSoldas: z
    .unknown()
    .transform(toNumber)
    .pipe(z.number()),

  totalPrevisto: z
    .unknown()
    .transform(toNumber)
    .pipe(z.number().nonnegative('Total previsto não pode ser negativo')),

  // Normaliza: 0.80 → 80 | 80% → 80 | 80 → 80
  porcentagem: z
    .unknown()
    .transform((val) => {
      const num = toNumber(val)
      return num > 0 && num <= 1 ? +(num * 100).toFixed(2) : num  // ✅ arredonda ao normalizar
    })
    .pipe(
      z.number()
        .min(0,   'Porcentagem não pode ser negativa')
        .max(100, 'Porcentagem não pode ultrapassar 100%')
    ),

  dataReferencia: z
    .string()
    .optional()
    .default(() => new Date().toISOString().split('T')[0]),
})

export type SoldaRow = z.infer<typeof SoldaRowSchema>

// ─── Mapeamento cabeçalhos CSV → campos do schema ────────────
// Aceita todos os formatos: novo (snake_case) + legado (Excel/Pivot pt-BR)
export const CSV_HEADER_MAP: Record<string, keyof SoldaRow> = {

  // Formato novo (snake_case)
  'area':               'area',
  'Area':               'area',
  'AREA':               'area',
  'soldas_realizadas':  'soldasRealizadas',
  'saldo_soldas':       'saldoSoldas',
  'total_previsto':     'totalPrevisto',
  'porcentagem':        'porcentagem',
  'data_referencia':    'dataReferencia',

  // Formato legado (Excel / Pivot Table pt-BR)
  'Rótulos de Linha':             'area',
  'Rotulos de Linha':             'area',
  'rotulos de linha':             'area',
  'RÓTULOS DE LINHA':             'area',

  'Soma de SOLDAS REALIZADAS':    'soldasRealizadas',
  'SOMA DE SOLDAS REALIZADAS':    'soldasRealizadas',
  'soma de soldas realizadas':    'soldasRealizadas',
  'SOLDAS REALIZADAS':            'soldasRealizadas',
  'soldas realizadas':            'soldasRealizadas',
  'Realizadas':                   'soldasRealizadas',
  'realizadas':                   'soldasRealizadas',

  'Soma de SALDO DE SOLDAS':      'saldoSoldas',
  'SOMA DE SALDO DE SOLDAS':      'saldoSoldas',
  'soma de saldo de soldas':      'saldoSoldas',
  'SALDO DE SOLDAS':              'saldoSoldas',
  'saldo de soldas':              'saldoSoldas',
  'Saldo':                        'saldoSoldas',
  'saldo':                        'saldoSoldas',

  'Soma de TOTAL SOLDAS PREVISTO':'totalPrevisto',
  'SOMA DE TOTAL SOLDAS PREVISTO':'totalPrevisto',
  'soma de total soldas previsto':'totalPrevisto',
  'TOTAL SOLDAS PREVISTO':        'totalPrevisto',
  'total soldas previsto':        'totalPrevisto',
  'Previsto':                     'totalPrevisto',
  'previsto':                     'totalPrevisto',

  '%':                            'porcentagem',
  'Porcentagem':                  'porcentagem',
  'PORCENTAGEM':                  'porcentagem',
  'Progresso':                    'porcentagem',
  'progresso':                    'porcentagem',

  'Data':                         'dataReferencia',
  'data':                         'dataReferencia',
  'Data de Referência':           'dataReferencia',
  'Data de Referencia':           'dataReferencia',
}

// ─── Mapeia linha bruta do CSV → objeto para o schema ────────
export function mapRawRow(rawRow: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  for (const [csvKey, schemaKey] of Object.entries(CSV_HEADER_MAP)) {
    // Não sobrescreve campo já mapeado por chave anterior
    if (csvKey in rawRow && !(schemaKey in mapped)) {
      mapped[schemaKey] = rawRow[csvKey]
    }
  }

  return mapped
}