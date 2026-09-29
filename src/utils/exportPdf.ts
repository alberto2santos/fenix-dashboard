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

async function exportWithBrowser(element: HTMLElement, format: 'pdf' | 'png', filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0f',
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
    scrollX: -window.scrollX,
    scrollY: -window.scrollY,
  })

  if (format === 'png') {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Não foi possível gerar a imagem PNG.')), 'image/png')
    })
    triggerDownload(blob, filename, 'png')
    return
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const scaledHeight = canvas.height * pageWidth / canvas.width
  const sourceHeight = Math.floor(pageHeight * canvas.width / pageWidth)
  const pageCount = Math.ceil(canvas.height / sourceHeight)

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) pdf.addPage()
    const offsetY = page * sourceHeight
    const sliceHeight = Math.min(sourceHeight, canvas.height - offsetY)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight
    const context = pageCanvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a página do PDF.')
    context.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
    pdf.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      pageWidth,
      Math.min(pageHeight, scaledHeight - page * pageHeight),
    )
  }

  pdf.save(`${filename}.pdf`)
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
    try {
      const dashboard = document.querySelector<HTMLElement>('main') ?? document.body
      await exportWithBrowser(dashboard, format, fullFilename)
    } catch (fallbackError) {
      console.error('[Fênix II] Erro no fallback local de exportação:', fallbackError)
      window.print()
    }
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
    try {
      const element = document.getElementById(elementId)
      if (element) await exportWithBrowser(element, format, fullFilename)
    } catch (fallbackError) {
      console.error(`[Fênix II] Erro no fallback local do elemento #${elementId}:`, fallbackError)
    }
  }
}
