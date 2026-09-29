import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiGrid } from './KpiGrid'
import { SoldaRowSchema } from '@/schemas/soldaSchema'

describe('KpiGrid', () => {
  it('renders the totals and progress calculated from area rows', () => {
    const rows = [SoldaRowSchema.parse({
      area: 'AREA-A',
      soldasRealizadas: 90,
      saldoSoldas: 60,
      totalPrevisto: 150,
      porcentagem: 60,
      dataReferencia: '2026-03-02',
    })]

    render(<KpiGrid rows={rows} />)

    expect(screen.getByRole('article', { name: 'Avanço Real: 60.0%' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Soldas Realizadas: 90' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Saldo em Aberto: 60' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Total Previsto: 150' })).toBeInTheDocument()
  })
})
