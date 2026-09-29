import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SOLDA_HISTORY_QUERY_KEY, useCsvParser } from './useCsvParser'
import type { SoldaRow } from '@/schemas/soldaSchema'

function CsvParserHarness() {
  const { parseFile, error } = useCsvParser()

  const loadCsv = () => {
    const csv = [
      'area,soldas_realizadas,saldo_soldas,total_previsto,porcentagem,data_referencia,turno',
      'AREA-A,90,60,150,60,2026-03-02,A',
      'AREA-B,20,130,150,120,2026-03-02,B',
    ].join('\n')
    parseFile(new File([csv], 'snapshots.csv', { type: 'text/csv' }))
  }

  return (
    <>
      <button onClick={loadCsv}>Importar CSV</button>
      {error && <p role="alert">{error}</p>}
    </>
  )
}

describe('useCsvParser', () => {
  it('keeps valid rows and reports corrupt lines', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CsvParserHarness />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Importar CSV' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('1 linha(s) ignorada(s)')
    await waitFor(() => {
      const history = queryClient.getQueryData<SoldaRow[]>(SOLDA_HISTORY_QUERY_KEY)
      expect(history).toHaveLength(1)
      expect(history?.[0]).toMatchObject({ area: 'AREA-A', turno: 'A' })
    })
  })
})
