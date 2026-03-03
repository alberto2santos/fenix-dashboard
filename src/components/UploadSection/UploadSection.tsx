// ============================================================
// UploadSection.tsx — Área de upload do CSV
// - Drag & Drop + clique para selecionar arquivo
// - Estado de loading com skeleton
// - Exibe erro de validação se houver
// - Exibe badge de sucesso se dados já estiverem carregados
// ============================================================

import { useRef, useState, useCallback, useId } from 'react'
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

// ─── Props ───────────────────────────────────────────────────
interface UploadSectionProps {
  onFileSelect: (file: File) => void
  isLoading:    boolean
  error:        string | null
  hasData:      boolean
}

// ─── Componente ──────────────────────────────────────────────
export function UploadSection({
  onFileSelect,
  isLoading,
  error,
  hasData,
}: UploadSectionProps) {
  const inputRef             = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputId              = useId() // ID único para aria-labelledby

  // Processa arquivo selecionado (via clique ou drag)
  const handleFile = useCallback((file: File | null | undefined) => {
    if (!file || isLoading) return
    onFileSelect(file)
  }, [onFileSelect, isLoading])

  // ── Drag & Drop handlers ──────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!isLoading) setIsDragging(true)
  }, [isLoading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Evita flicker ao mover sobre elementos filhos
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isLoading) return
    const file = e.dataTransfer.files[0]
    // Valida extensão antes de passar para o parser
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      onFileSelect(file) // Deixa o parser reportar o erro formatado
      return
    }
    handleFile(file)
  }, [isLoading, handleFile, onFileSelect])

  // Reset do input para permitir recarregar o mesmo arquivo
  const handleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }, [])

  return (
    <section aria-label="Upload de arquivo CSV">
      <div
        className={clsx(
          'relative rounded-xl border-2 border-dashed transition-all duration-300',
          'bg-fenix-card p-6',
          !isDragging && !isLoading && 'border-fenix-borderAlt hover:border-amber',
          isDragging  && 'border-amber bg-amber-glow scale-[1.01]',
          isLoading   && 'border-fenix-border cursor-not-allowed opacity-70',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label="Área de drop para arquivo CSV"
        aria-busy={isLoading}
      >
        {/* Input oculto */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv"
          className="sr-only"
          aria-label="Selecionar arquivo CSV"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={isLoading}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* ── Ícone e texto ── */}
          <div className="flex items-center gap-3 flex-1">
            <div className={clsx(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300',
              isDragging  ? 'bg-amber'        :
              isLoading   ? 'bg-fenix-border' :
              'bg-amber-glow',
            )}>
              {isLoading
                ? <RefreshCw className="w-5 h-5 text-amber animate-spin" aria-hidden="true" />
                : <Upload    className={clsx('w-5 h-5', isDragging ? 'text-fenix-bg' : 'text-amber')} aria-hidden="true" />
              }
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {isLoading
                  ? 'Processando arquivo...'
                  : isDragging
                    ? 'Solte o arquivo aqui!'
                    : 'Carregar dados do projeto'
                }
              </p>
              <p className="text-xs text-steel mt-0.5">
                {isLoading
                  ? 'Validando estrutura do CSV com Zod...'
                  : 'Arraste o CSV aqui ou clique para selecionar'
                }
              </p>
            </div>
          </div>

          {/* ── Botão de seleção ── */}
          <button
            onClick={handleClick}
            disabled={isLoading}
            className={clsx(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm font-semibold transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
              isLoading
                ? 'bg-fenix-border text-steel cursor-not-allowed'
                : 'bg-amber text-fenix-bg hover:bg-amber-light active:scale-95',
            )}
            aria-label={hasData ? 'Atualizar dados do CSV' : 'Selecionar arquivo CSV'}
            aria-controls={inputId}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {hasData ? 'Atualizar CSV' : 'Selecionar CSV'}
          </button>

        </div>

        {/* ── Badge de dados carregados ── */}
        {hasData && !isLoading && !error && (
          <div
            className="mt-4 flex items-center gap-2 text-xs text-status-ok"
            role="status"
            aria-live="polite"
          >
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Dados carregados com sucesso. Carregue um novo CSV para atualizar.</span>
          </div>
        )}

        {/* ── Mensagem de erro ── */}
        {error && (
          <div
            className="mt-4 flex items-start gap-2 text-xs text-status-critical"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

      </div>
    </section>
  )
}