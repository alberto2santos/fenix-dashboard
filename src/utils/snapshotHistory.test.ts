import { describe, expect, it } from 'vitest'
import { SoldaRowSchema } from '@/schemas/soldaSchema'
import {
  calculateWeekdayProductivity,
  estimateAreaCompletion,
  mergeSnapshotHistory,
  selectLatestSnapshots,
} from './snapshotHistory'

function snapshot(
  date: string,
  completed: number,
  shift?: 'A' | 'B' | 'C',
) {
  return SoldaRowSchema.parse({
    area: 'AREA-A',
    soldasRealizadas: completed,
    saldoSoldas: 100 - completed,
    totalPrevisto: 100,
    porcentagem: completed,
    dataReferencia: date,
    turno: shift,
  })
}

describe('snapshot history', () => {
  it('replaces a repeated area, date, and shift while retaining other dates', () => {
    const rows = mergeSnapshotHistory(
      [snapshot('2026-03-01', 10, 'A')],
      [snapshot('2026-03-01', 12, 'A'), snapshot('2026-03-03', 30, 'A')],
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].soldasRealizadas).toBe(12)
  })

  it('selects the most recent record and filters by shift', () => {
    const rows = [
      snapshot('2026-03-01', 10, 'A'),
      snapshot('2026-03-02', 20, 'A'),
      snapshot('2026-03-02', 25, 'B'),
    ]

    expect(selectLatestSnapshots(rows)[0].soldasRealizadas).toBe(25)
    expect(selectLatestSnapshots(rows, 'A')[0].soldasRealizadas).toBe(20)
  })

  it('projects an estimated finish date from cumulative snapshots', () => {
    const estimate = estimateAreaCompletion([
      snapshot('2026-03-01', 10),
      snapshot('2026-03-03', 30),
    ])

    expect(estimate[0]).toMatchObject({
      area: 'AREA-A',
      estimatedEndDate: '2026-03-10',
      productionPerDay: 10,
      snapshots: 2,
    })
  })

  it('groups production deltas by weekday', () => {
    const productivity = calculateWeekdayProductivity([
      snapshot('2026-03-01', 10),
      snapshot('2026-03-03', 30),
    ])

    expect(productivity).toEqual([
      { area: 'AREA-A', weekday: 2, production: 20 },
    ])
  })
})
