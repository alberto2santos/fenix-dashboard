// ============================================================
// exportPdf.ts — Utilitário de exportação PDF/PNG
// Chama o servidor local (server/export.js) que usa Playwright
// para gerar um PDF vetorial de alta qualidade
// ============================================================

// ─── Tipos ───────────────────────────────────────────────────
export interface ExportOptions {
  format?:   'pdf' | 'png'
  filename?: string
}

interface ExportPayload {
  url:       string
  format:    'pdf' | 'png'
  filename:  string
  elementId?: string
}

// ─── Helper: data formatada para o nome do arquivo ───────────
function getDateSuffix(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Helper: dispara o download do blob ──────────────────────
function triggerDownload(blob: Blob, filename: string, format: string): void {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href               = url
  link.download           = `${filename}.${format}`
  link.style.display      = 'none'

  document.body.appendChild(link)   // ✅ necessário para Firefox
  link.click()
  document.body.removeChild(link)

  // Libera memória após o click
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Helper: POST para a API de exportação ───────────────────
async function postExport(endpoint: string, payload: ExportPayload): Promise<Blob> {
  const response = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => String(response.status))
    throw new Error(`[exportPdf] Servidor retornou ${response.status}: ${message}`)
  }

  return response.blob()
}

// ─── Exporta o dashboard completo ────────────────────────────
export async function exportDashboard(
  options: ExportOptions = {}
): Promise<void> {
  const { format = 'pdf', filename = 'fenix-dashboard' } = options
  const fullFilename = `${filename}-${getDateSuffix()}`

  try {
    const blob = await postExport('/api/export', {
      url:      window.location.href,
      format,
      filename: fullFilename,
    })

    triggerDownload(blob, fullFilename, format)

  } catch (err) {
    console.error('[Fênix II] Erro ao exportar dashboard:', err)
    // Fallback: janela de impressão do browser
    window.print()
  }
}

// ─── Exporta apenas um elemento específico ───────────────────
export async function exportElement(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const { format = 'png', filename = 'fenix-chart' } = options
  const fullFilename = `${filename}-${getDateSuffix()}`

  // Valida se o elemento existe antes de chamar o servidor
  if (!document.getElementById(elementId)) {
    console.warn(`[Fênix II] Elemento #${elementId} não encontrado no DOM`)
    return
  }

  try {
    const blob = await postExport('/api/export-element', {
      url:       window.location.href,
      elementId,
      format,
      filename:  fullFilename,
    })

    triggerDownload(blob, fullFilename, format)

  } catch (err) {
    console.error(`[Fênix II] Erro ao exportar elemento #${elementId}:`, err)
  }
}