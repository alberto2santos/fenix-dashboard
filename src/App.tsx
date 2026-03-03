// ============================================================
// App.tsx — Entrada principal do Fênix II Dashboard
// Gerencia estado global de rows e filtro de área
// ============================================================

import { useState, useCallback }  from 'react'
import { AppHeader }              from '@/components/AppHeader/AppHeader'
import { AppFooter }              from '@/components/AppFooter/AppFooter'
import { UploadSection }          from '@/components/UploadSection/UploadSection'
import { KpiGrid }                from '@/components/KpiCard/KpiGrid'
import { ChartsSection }          from '@/components/ChartsSection/ChartsSection'
import { DataTable }              from '@/components/DataTable/DataTable'
import { useCsvParser }           from '@/hooks/useCsvParser'
import type { SoldaRow }          from '@/schemas/soldaSchema'

export default function App() {
  const [rows, setRows]             = useState<SoldaRow[]>([])
  const [areaFilter, setAreaFilter] = useState<string | null>(null)

  // ── Parser CSV (UploadSection) ───────────────────────────
  const { parseFile, isLoading, error } = useCsvParser({
    onSuccess: (parsedRows: SoldaRow[]) => {
      setRows(parsedRows)
      setAreaFilter(null)
    },
  })

  // ── Dados vindos do SettingsDrawer (manual ou CSV interno)
  // Sobrescreve área se já existir — adiciona se for nova
  const handleDataAdd = useCallback((newRows: SoldaRow[]) => {
    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.area, r]))
      newRows.forEach((r) => map.set(r.area, r))
      return Array.from(map.values())
    })
  }, [])

  // ── Filtro de área (clique no gráfico ou tabela) ─────────
  const handleFilterChange = useCallback((area: string | null) => {
    setAreaFilter(area)
  }, [])

  const filteredRows = areaFilter
    ? rows.filter((r) => r.area === areaFilter)
    : rows

  const lastUpdated = rows.length > 0 ? rows[0].dataReferencia ?? null : null
  const hasData     = rows.length > 0

  return (
    <div className="min-h-dvh flex flex-col bg-fenix-bg">

      <AppHeader
        lastUpdated={lastUpdated}
        onDataAdd={handleDataAdd}       // ✅ conectado ao SettingsDrawer
      />

      <main
        className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        aria-label="Conteúdo principal do dashboard"
      >
        <UploadSection
          onFileSelect={parseFile}
          isLoading={isLoading}
          error={error}
          hasData={hasData}
        />

        {hasData && (
          <>
            <KpiGrid rows={rows} />

            <ChartsSection
              rows={rows}
              onAreaClick={handleFilterChange}
              activeArea={areaFilter}
            />

            <DataTable
              rows={filteredRows}
              allRows={rows}
              activeFilter={areaFilter}
              onFilterChange={handleFilterChange}
            />
          </>
        )}
      </main>

      <AppFooter />

    </div>
  )
}