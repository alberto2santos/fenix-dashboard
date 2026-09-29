import type { SoldaRow } from '@/schemas/soldaSchema'

export type ShiftFilter = 'ALL' | 'A' | 'B' | 'C'

export interface AreaForecast {
  area: string
  estimatedEndDate: string | null
  productionPerDay: number
  snapshots: number
}

const SHIFT_ORDER: Record<string, number> = { A: 1, B: 2, C: 3 }

function snapshotOrder(row: SoldaRow): number {
  return SHIFT_ORDER[row.turno ?? ''] ?? 4
}

function snapshotKey(row: SoldaRow): string {
  return `${row.area.trim().toLocaleLowerCase('pt-BR')}|${row.dataReferencia}|${row.turno ?? 'geral'}`
}

function isLaterSnapshot(candidate: SoldaRow, current: SoldaRow): boolean {
  if (candidate.dataReferencia !== current.dataReferencia) {
    return candidate.dataReferencia > current.dataReferencia
  }
  return snapshotOrder(candidate) >= snapshotOrder(current)
}

export function mergeSnapshotHistory(
  existing: SoldaRow[],
  incoming: SoldaRow[],
): SoldaRow[] {
  const snapshots = new Map(existing.map((row) => [snapshotKey(row), row]))
  incoming.forEach((row) => snapshots.set(snapshotKey(row), row))

  return [...snapshots.values()].sort((a, b) =>
    a.dataReferencia.localeCompare(b.dataReferencia) || snapshotOrder(a) - snapshotOrder(b),
  )
}

export function selectLatestSnapshots(
  history: SoldaRow[],
  shift: ShiftFilter = 'ALL',
): SoldaRow[] {
  const latest = new Map<string, SoldaRow>()

  history
    .filter((row) => shift === 'ALL' || row.turno === shift)
    .forEach((row) => {
      const current = latest.get(row.area)
      if (!current || isLaterSnapshot(row, current)) latest.set(row.area, row)
    })

  return [...latest.values()].sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'))
}

function latestSnapshotPerDay(rows: SoldaRow[]): SoldaRow[] {
  const byDate = new Map<string, SoldaRow>()
  rows.forEach((row) => {
    const current = byDate.get(row.dataReferencia)
    if (!current || snapshotOrder(row) >= snapshotOrder(current)) {
      byDate.set(row.dataReferencia, row)
    }
  })
  return [...byDate.values()].sort((a, b) => a.dataReferencia.localeCompare(b.dataReferencia))
}

function utcDayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T12:00:00Z`) / 86_400_000)
}

export function estimateAreaCompletion(
  history: SoldaRow[],
  shift: ShiftFilter = 'ALL',
): AreaForecast[] {
  const areas = new Map<string, SoldaRow[]>()
  history
    .filter((row) => shift === 'ALL' || row.turno === shift)
    .forEach((row) => areas.set(row.area, [...(areas.get(row.area) ?? []), row]))

  return [...areas.entries()].map(([area, areaRows]) => {
    const snapshots = latestSnapshotPerDay(areaRows)
    if (snapshots.length < 2) {
      return { area, estimatedEndDate: null, productionPerDay: 0, snapshots: snapshots.length }
    }

    const firstDay = utcDayNumber(snapshots[0].dataReferencia)
    const points = snapshots.map((row) => ({
      x: utcDayNumber(row.dataReferencia) - firstDay,
      y: row.soldasRealizadas,
    }))
    const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length
    const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length
    const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0)
    const slope = denominator === 0
      ? 0
      : points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator
    const latest = snapshots[snapshots.length - 1]

    if (slope <= 0 || latest.soldasRealizadas >= latest.totalPrevisto) {
      return {
        area,
        estimatedEndDate: latest.soldasRealizadas >= latest.totalPrevisto ? latest.dataReferencia : null,
        productionPerDay: Math.max(0, slope),
        snapshots: snapshots.length,
      }
    }

    const intercept = meanY - slope * meanX
    const targetDay = (latest.totalPrevisto - intercept) / slope
    const daysFromFirst = Math.max(points[points.length - 1].x, Math.ceil(targetDay))
    const endDate = new Date((firstDay + daysFromFirst) * 86_400_000)
      .toISOString()
      .slice(0, 10)

    return {
      area,
      estimatedEndDate: endDate,
      productionPerDay: Number(slope.toFixed(2)),
      snapshots: snapshots.length,
    }
  }).sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'))
}

export interface WeekdayProductivity {
  area: string
  weekday: number
  production: number
}

export function calculateWeekdayProductivity(
  history: SoldaRow[],
  shift: ShiftFilter = 'ALL',
): WeekdayProductivity[] {
  const areas = new Map<string, SoldaRow[]>()
  history
    .filter((row) => shift === 'ALL' || row.turno === shift)
    .forEach((row) => areas.set(row.area, [...(areas.get(row.area) ?? []), row]))

  const totals = new Map<string, WeekdayProductivity>()
  for (const [area, rows] of areas) {
    const snapshots = latestSnapshotPerDay(rows)
    for (let index = 1; index < snapshots.length; index += 1) {
      const previous = snapshots[index - 1]
      const current = snapshots[index]
      const produced = Math.max(0, current.soldasRealizadas - previous.soldasRealizadas)
      const weekday = new Date(`${current.dataReferencia}T12:00:00Z`).getUTCDay()
      const key = `${area}|${weekday}`
      const cell = totals.get(key) ?? { area, weekday, production: 0 }
      cell.production += produced
      totals.set(key, cell)
    }
  }

  return [...totals.values()]
}
