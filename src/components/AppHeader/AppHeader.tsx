// ============================================================
// AppHeader.tsx — Cabeçalho da aplicação
// - Relógio atualizado a cada minuto
// - Indicador de data de referência do CSV
// - Botão de exportação PDF com estado de loading
// - Botão de configurações com SettingsDrawer
// ============================================================

import { useState, useEffect, useCallback }       from 'react'
import { Flame, Clock, Download, Loader2, Settings } from 'lucide-react'
import { exportDashboard }                        from '@/utils/exportPdf'
import { SettingsDrawer }                         from '@/components/SettingsDrawer/SettingsDrawer'
import type { SoldaRow }                          from '@/schemas/soldaSchema'

// ─── Props ───────────────────────────────────────────────────
interface AppHeaderProps {
  lastUpdated: string | null
  onDataAdd:   (rows: SoldaRow[]) => void   // callback vindo do App.tsx
}

// ─── Formata a data atual em pt-BR ───────────────────────────
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day:     '2-digit',
    month:   '2-digit',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  })
}

// ─── Componente ──────────────────────────────────────────────
export function AppHeader({ lastUpdated, onDataAdd }: AppHeaderProps) {
  const [now, setNow]             = useState(new Date())
  const [exporting, setExporting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Atualiza relógio a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleExport = useCallback(async () => {
    if (exporting) return
    setExporting(true)
    try {
      await exportDashboard({ format: 'pdf', filename: 'fenix-dashboard' })
    } catch (err) {
      console.error('[Fênix II] Erro ao exportar PDF:', err)
    } finally {
      setExporting(false)
    }
  }, [exporting])

  return (
    <>
      <header
        className="w-full border-b border-fenix-border bg-fenix-surface"
        role="banner"
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* ── Identidade do projeto ── */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-glow border border-amber"
                aria-hidden="true"
              >
                <Flame className="w-5 h-5 text-amber" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-white leading-none">
                  Projeto{' '}
                  <span className="text-gradient-amber">Fênix II</span>
                </h1>
                <p className="text-xs text-steel mt-0.5 uppercase tracking-widest">
                  Engenharia &amp; Soldagem
                </p>
              </div>
            </div>

            {/* ── Informações, ações e configurações ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

              {/* Data de referência do CSV */}
              {lastUpdated && (
                <div
                  className="flex items-center gap-1.5 text-xs text-steel"
                  aria-label={`Dados de referência: ${lastUpdated}`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-status-ok animate-pulse flex-shrink-0"
                    aria-hidden="true"
                  />
                  Referência:{' '}
                  <span className="text-steel-light font-medium">{lastUpdated}</span>
                </div>
              )}

              {/* Relógio atual */}
              <div
                className="flex items-center gap-1.5 text-xs text-steel"
                aria-label="Data e hora atual"
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <time dateTime={now.toISOString()}>{formatDateTime(now)}</time>
              </div>

              {/* Botão exportar PDF */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                  bg-amber text-fenix-bg hover:bg-amber-light
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                  transition-colors duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
                aria-label={exporting ? 'Exportando PDF...' : 'Exportar dashboard como PDF'}
                aria-busy={exporting}
              >
                {exporting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  : <Download className="w-3.5 h-3.5" aria-hidden="true" />
                }
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </button>

              {/* Botão configurações */}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir configurações"
                className="
                  p-2 rounded-lg text-steel
                  hover:text-white hover:bg-fenix-cardHover
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber
                  transition-colors
                "
              >
                <Settings className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>

        {/* Linha decorativa */}
        <div className="divider-amber" aria-hidden="true" />
      </header>

      {/* Drawer FORA do <header> — evita z-index e stacking context */}
      <SettingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDataAdd={onDataAdd}
      />
    </>
  )
}