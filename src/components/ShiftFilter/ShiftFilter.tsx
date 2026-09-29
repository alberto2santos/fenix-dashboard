import type { ShiftFilter as ShiftFilterValue } from '@/utils/snapshotHistory'

interface ShiftFilterProps {
  value: ShiftFilterValue
  onChange: (value: ShiftFilterValue) => void
  available: boolean
}

export function ShiftFilter({ value, onChange, available }: ShiftFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-fenix-border bg-fenix-card px-4 py-3">
      <label htmlFor="shift-filter" className="text-sm font-medium text-white">
        Turno operacional
      </label>
      <select
        id="shift-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as ShiftFilterValue)}
        className="rounded-lg border border-fenix-border bg-fenix-surface px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
      >
        <option value="ALL">Todos os turnos</option>
        <option value="A">Turno A · 06:00–14:00</option>
        <option value="B">Turno B · 14:00–22:00</option>
        <option value="C">Turno C · 22:00–06:00</option>
      </select>
      {!available && (
        <span className="text-xs text-steel">
          Importe dados com a coluna opcional “turno” para filtrar por turno.
        </span>
      )}
    </div>
  )
}
