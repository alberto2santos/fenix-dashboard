// ============================================================
// DataTable.tsx — Tabela de dados por área com sorting
// - Sorting por qualquer coluna (asc/desc)
// - Filtro ativo por área (integrado com BarChart)
// - Badge de alertas críticos
// - Estado vazio e totais no rodapé
// ============================================================

import { useState, useMemo, useCallback, memo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react'
import { clsx }                  from 'clsx'
import { getStatusClasses }      from '@/utils/colorRules'
import { AlertBadge }            from '@/components/AlertBadge/AlertBadge'
import type { SoldaRow }         from '@/schemas/soldaSchema'

// ─── Tipos de sorting ────────────────────────────────────────
type SortKey = keyof SoldaRow
type SortDir = 'asc' | 'desc'

interface SortState {
  key: SortKey
  dir: SortDir
}

// ─── Props ───────────────────────────────────────────────────
interface DataTableProps {
  rows:          SoldaRow[]
  allRows:       SoldaRow[]
  activeFilter:  string | null
  onFilterChange:(area: string | null) => void
}

// ─── Definição de colunas (fora do componente — constante) ───
const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'area',             label: 'Área' },
  { key: 'soldasRealizadas', label: 'Realizadas', align: 'right' },
  { key: 'saldoSoldas',      label: 'Saldo',      align: 'right' },
  { key: 'totalPrevisto',    label: 'Previsto',   align: 'right' },
  { key: 'porcentagem',      label: '% Progresso',align: 'right' },
]

// ─── Ícone de sort ───────────────────────────────────────────
const SortIcon = memo(function SortIcon({
  column,
  sort,
}: {
  column: SortKey
  sort: SortState
}) {
  if (sort.key !== column)
    return <ChevronsUpDown className="w-3 h-3 text-steel-dark" aria-hidden="true" />
  if (sort.dir === 'asc')
    return <ChevronUp className="w-3 h-3 text-amber" aria-hidden="true" />
  return <ChevronDown className="w-3 h-3 text-amber" aria-hidden="true" />
})

// ─── Totais do rodapé ────────────────────────────────────────
function computeTotals(rows: SoldaRow[]) {
  return rows.reduce(
    (acc, r) => ({
      soldasRealizadas: acc.soldasRealizadas + r.soldasRealizadas,
      saldoSoldas:      acc.saldoSoldas      + r.saldoSoldas,
      totalPrevisto:    acc.totalPrevisto    + r.totalPrevisto,
    }),
    { soldasRealizadas: 0, saldoSoldas: 0, totalPrevisto: 0 }
  )
}

// ─── Componente ──────────────────────────────────────────────
export const DataTable = memo(function DataTable({
  rows,
  allRows,
  activeFilter,
  onFilterChange,
}: DataTableProps) {
  // Estado de sorting (padrão: área crescente)
  const [sort, setSort] = useState<SortState>({ key: 'area', dir: 'asc' })

  // Alterna direção ou muda coluna
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }, [])

  // Aplica sorting nos dados
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sort.key]
      const bVal = b[sort.key]
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'pt-BR')
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort])

  // Totais calculados para o rodapé
  const totals = useMemo(() => computeTotals(sortedRows), [sortedRows])

  return (
    <section aria-label="Tabela de dados por área">

      {/* ── Cabeçalho da seção ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-steel uppercase tracking-wider">
            Detalhamento por Área
          </h2>
          <p className="text-xs text-steel-dark mt-0.5">
            {activeFilter
              ? `Mostrando: ${activeFilter}`
              : `${rows.length} área(s) carregada(s)`}
          </p>
        </div>

        {/* Badge de alertas */}
        <AlertBadge rows={allRows} />
      </div>

      {/* ── Filtro ativo ── */}
      {activeFilter && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-steel">Filtro ativo:</span>
          <button
            onClick={() => onFilterChange(null)}
            className="
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
              bg-amber-glow text-amber border border-amber
              hover:bg-amber hover:text-fenix-bg
              transition-colors duration-200
            "
            aria-label={`Remover filtro: ${activeFilter}`}
          >
            {activeFilter}
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Tabela com scroll horizontal em mobile ── */}
      <div className="overflow-x-auto rounded-xl border border-fenix-border">
        <table
          className="w-full text-sm bg-fenix-card"
          role="table"
          aria-label="Progresso de soldas por área"
          aria-rowcount={sortedRows.length}
        >
          <thead>
            <tr className="border-b border-fenix-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx(
                    'px-4 py-3 text-xs font-semibold text-steel uppercase tracking-wider',
                    'whitespace-nowrap cursor-pointer select-none',
                    'hover:text-amber transition-colors duration-150',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                  onClick={() => handleSort(col.key)}
                  aria-sort={
                    sort.key === col.key
                      ? sort.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse',
                    )}
                  >
                    {col.label}
                    <SortIcon column={col.key} sort={sort} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center text-steel text-sm"
                >
                  Nenhum dado encontrado para o filtro selecionado.
                </td>
              </tr>
            ) : (
              sortedRows.map((row, i) => {
                const status   = getStatusClasses(row.porcentagem)
                const isActive = activeFilter === row.area

                return (
                  <tr
                    key={`${row.area}-${i}`}
                    className={clsx(
                      'border-b border-fenix-border/50 transition-colors duration-150',
                      'hover:bg-fenix-cardHover cursor-pointer',
                      isActive && 'bg-amber-glow',
                    )}
                    onClick={() => onFilterChange(isActive ? null : row.area)}
                    aria-selected={isActive}
                    aria-label={`Área ${row.area}: ${row.porcentagem.toFixed(1)}% de progresso`}
                  >
                    {/* Área */}
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      {row.area}
                    </td>

                    {/* Realizadas */}
                    <td className="px-4 py-3 text-right text-steel-light tabular-nums">
                      {row.soldasRealizadas.toLocaleString('pt-BR')}
                    </td>

                    {/* Saldo */}
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={clsx(
                        row.saldoSoldas === 0
                          ? 'text-status-ok font-medium'
                          : 'text-steel-light',
                      )}>
                        {row.saldoSoldas.toLocaleString('pt-BR')}
                      </span>
                    </td>

                    {/* Previsto */}
                    <td className="px-4 py-3 text-right text-steel-light tabular-nums">
                      {row.totalPrevisto.toLocaleString('pt-BR')}
                    </td>

                    {/* % Progresso */}
                    <td className="px-4 py-3 text-right">
                      <span className={clsx(
                        'inline-flex items-center justify-center px-2 py-0.5',
                        'rounded-full text-xs font-semibold border',
                        status.bg, status.text, status.border,
                      )}>
                        {row.porcentagem.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {/* ── Linha de totais ── */}
          {sortedRows.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-fenix-border bg-fenix-surface">
                <td className="px-4 py-3 text-xs font-semibold text-steel uppercase tracking-wider">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-white font-semibold tabular-nums text-xs">
                  {totals.soldasRealizadas.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-white font-semibold tabular-nums text-xs">
                  {totals.saldoSoldas.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-white font-semibold tabular-nums text-xs">
                  {totals.totalPrevisto.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right text-steel text-xs">—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Contagem de registros */}
      {sortedRows.length > 0 && (
        <div className="mt-2 px-2 text-xs text-steel-dark">
          {sortedRows.length} registro(s) exibido(s)
          {activeFilter && ` de ${allRows.length} total`}
        </div>
      )}

    </section>
  )
})