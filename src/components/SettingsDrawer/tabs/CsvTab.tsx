// ============================================================
// CsvTab.tsx — Importação e exportação de CSV
// Import: PapaParse + validação Zod + drag-and-drop
// Export: gera CSV a partir dos dados em memória
// Template: baixa modelo CSV pré-preenchido
// ============================================================

import { useRef, useState }                           from 'react'
import { Upload, Download, AlertCircle, FileCheck2, FileDown } from 'lucide-react'
import Papa                                           from 'papaparse'
import { SoldaRowSchema, mapRawRow }                  from '@/schemas/soldaSchema'
import type { SoldaRow }                              from '@/schemas/soldaSchema'
import { useQueryClient }                             from '@tanstack/react-query'
import { SOLDA_QUERY_KEY }                            from '@/hooks/useCsvParser'
import type { CsvTabProps }                           from '../SettingsDrawer.types'

// ─── Modelo CSV para download ─────────────────────────────────
const CSV_TEMPLATE = [
  'area,soldas_realizadas,saldo_soldas,total_previsto,porcentagem,data_referencia',
  'AREA-A,120,30,150,0.80,2026-03-02',
  'AREA-B,85,65,150,0.57,2026-03-02',
  'AREA-C,200,0,200,1.00,2026-03-02',
  'AREA-D,45,105,150,0.30,2026-03-02',
  'AREA-E,130,20,150,0.87,2026-03-02',
  'AREA-F,60,40,100,0.60,2026-03-02',
].join('\n')

// ─── Helper: dispara download de blob ────────────────────────
function triggerDownload(blob: Blob, filename: string): void {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Componente ──────────────────────────────────────────────
export function CsvTab({ onImport }: CsvTabProps) {
  const queryClient               = useQueryClient()
  const inputRef                  = useRef<HTMLInputElement>(null)
  const [status, setStatus]       = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage]     = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const currentRows = queryClient.getQueryData<SoldaRow[]>(SOLDA_QUERY_KEY) ?? []

  // ── Processa arquivo CSV ──────────────────────────────────
  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus('error')
      setMessage('Selecione um arquivo com extensão .csv')
      return
    }

    Papa.parse<Record<string, unknown>>(file, {
      header:         true,
      skipEmptyLines: true,
      encoding:       'UTF-8',

      complete: (results) => {
        const validRows: SoldaRow[] = []
        let ignored = 0

        results.data.forEach((row) => {
          const areaValue = String(
            row['area'] ?? row['Area'] ?? row['Rótulos de Linha'] ?? ''
          ).trim().toLowerCase()

          if (['total geral', 'total', ''].includes(areaValue)) return

          const mapped = mapRawRow(row)
          if (!mapped['area']) mapped['area'] = areaValue

          const parsed = SoldaRowSchema.safeParse(mapped)
          if (parsed.success) {
            validRows.push(parsed.data)
          } else {
            ignored++
          }
        })

        if (validRows.length === 0) {
          setStatus('error')
          setMessage('Nenhuma linha válida encontrada. Verifique o formato do CSV.')
          return
        }

        onImport(validRows)
        setStatus('success')
        setMessage(
          `${validRows.length} área(s) importada(s) com sucesso${ignored > 0 ? ` (${ignored} linha(s) ignorada(s))` : ''}`
        )
      },

      error: (err) => {
        setStatus('error')
        setMessage(`Erro ao ler o arquivo: ${err.message}`)
      },
    })
  }

  // ── Drag and drop ─────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  // ── Exporta dados atuais como CSV ─────────────────────────
  const handleExport = () => {
    if (currentRows.length === 0) return

    const csv = Papa.unparse(
      currentRows.map((r) => ({
        area:              r.area,
        soldas_realizadas: r.soldasRealizadas,
        saldo_soldas:      r.saldoSoldas,
        total_previsto:    r.totalPrevisto,
        porcentagem:       r.porcentagem,
        data_referencia:   r.dataReferencia ?? '',
      })),
      { delimiter: ';' }   // ponto-e-vírgula para Excel pt-BR
    )

    triggerDownload(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
      `fenix-dados-${new Date().toISOString().split('T')[0]}.csv`
    )
  }

  // ── Baixa modelo CSV ──────────────────────────────────────
  const handleDownloadTemplate = () => {
    triggerDownload(
      new Blob([`\uFEFF${CSV_TEMPLATE}`], { type: 'text/csv;charset=utf-8' }),
      'dados-solda-modelo.csv'
    )
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Importar ───────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-steel mb-3">Importar CSV</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            py-8 px-4 rounded-xl border-2 border-dashed cursor-pointer
            transition-all text-center
            ${isDragging
              ? 'border-amber bg-amber/5 scale-[1.01]'
              : 'border-fenix-border hover:border-fenix-borderAlt hover:bg-fenix-card'}
          `}
        >
          <Upload className={`w-8 h-8 ${isDragging ? 'text-amber' : 'text-steel'}`} />
          <div>
            <p className="text-sm text-white font-medium">Arraste o arquivo aqui</p>
            <p className="text-xs text-steel mt-0.5">
              ou clique para selecionar um arquivo .csv
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) processFile(file)
              e.target.value = ''   // permite re-upload do mesmo arquivo
            }}
          />
        </div>

        {/* Feedback de importação */}
        {status !== 'idle' && (
          <div className={`
            flex items-start gap-2 mt-3 p-3 rounded-lg text-xs
            ${status === 'success'
              ? 'bg-status-okBg border border-status-ok text-status-ok'
              : 'bg-status-critBg border border-status-critical text-status-critical'}
          `}>
            {status === 'success'
              ? <FileCheck2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            }
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* ── Baixar modelo CSV ──────────────────────────────── */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-fenix-card border border-fenix-border">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white">Não tem um CSV?</p>
          <p className="text-xs text-steel mt-0.5 leading-relaxed">
            Baixe o modelo pronto e preencha com os seus dados.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-md shrink-0
            bg-fenix-cardHover border border-fenix-border
            text-xs font-medium text-amber
            hover:border-amber hover:bg-amber/5
            transition-all active:scale-[0.97]
          "
        >
          <FileDown className="w-3.5 h-3.5" />
          Baixar modelo
        </button>
      </div>

      <div className="divider-amber" />

      {/* ── Exportar dados atuais ──────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-steel mb-1">Exportar dados atuais</p>
        <p className="text-xs text-steel/60 mb-3">
          Exporta as{' '}
          <strong className="text-white">{currentRows.length} área(s)</strong>{' '}
          atualmente carregadas no dashboard como CSV compatível com Excel.
        </p>

        <button
          onClick={handleExport}
          disabled={currentRows.length === 0}
          className="
            w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
            bg-fenix-card border border-fenix-border text-sm font-medium
            text-white hover:border-amber hover:bg-fenix-cardHover
            transition-all active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-fenix-border
          "
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>

        {currentRows.length === 0 && (
          <p className="text-xs text-steel/50 mt-2 text-center">
            Carregue dados no dashboard para habilitar a exportação.
          </p>
        )}
      </div>

    </div>
  )
}