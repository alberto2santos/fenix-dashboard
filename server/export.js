// ============================================================
// server/export.js — Servidor Node.js de exportação PDF/PNG
// Usa Playwright (Chromium headless) para gerar PDFs vetoriais
//
// Para rodar: npm run server
// Porta: 3001 (proxy configurado no vite.config.ts)
// ============================================================

import http             from 'http'
import { parse }        from 'url'
import { chromium }     from 'playwright'

const PORT            = 3001
const ALLOWED_ORIGIN  = 'http://localhost:5173'
const LAUNCH_TIMEOUT  = 30_000
const RENDER_WAIT     = 2_000

// ─── Parseia body da request ─────────────────────────────────
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data',  (chunk) => { body += chunk.toString() })
    req.on('end',   ()      => {
      try   { resolve(JSON.parse(body)) }
      catch { reject(new Error('JSON inválido no body da requisição')) }
    })
    req.on('error', reject)   // ✅ captura erros de stream
  })
}

// ─── Resposta de erro padronizada ────────────────────────────
function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: message }))
}

// ─── Valida URL recebida ──────────────────────────────────────
function isValidUrl(raw) {
  try {
    const { protocol } = new URL(raw)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// ─── Gera o buffer (PDF ou PNG) via Playwright ───────────────
async function renderPage(pageUrl, format) {
  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()

    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: LAUNCH_TIMEOUT })
    await page.waitForTimeout(RENDER_WAIT)  // aguarda ECharts renderizar

    if (format === 'png') {
      return {
        buffer:      await page.screenshot({ fullPage: true, type: 'png' }),
        contentType: 'image/png',
        ext:         'png',
      }
    }

    return {
      buffer: await page.pdf({
        format:          'A4',
        landscape:       true,
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      }),
      contentType: 'application/pdf',
      ext:         'pdf',
    }
  } finally {
    await browser.close()   // sempre fecha — mesmo se screenshot/pdf falhar
  }
}

// ─── Handler: exportação do dashboard ────────────────────────
async function handleExport(req, res) {
  let body

  try {
    body = await parseBody(req)
  } catch (err) {
    return sendError(res, 400, err.message)
  }

  const {
    url:      pageUrl  = '',
    format             = 'pdf',
    filename           = 'fenix-dashboard',
  } = body

  // Valida campos obrigatórios
  if (!pageUrl)               return sendError(res, 400, 'Campo "url" é obrigatório')
  if (!isValidUrl(pageUrl))   return sendError(res, 400, 'URL inválida ou protocolo não permitido')
  if (!['pdf','png'].includes(format))
                              return sendError(res, 400, 'Formato deve ser "pdf" ou "png"')

  try {
    const { buffer, contentType, ext } = await renderPage(pageUrl, format)

    res.writeHead(200, {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${filename}.${ext}"`,
      'Content-Length':      buffer.length,
    })
    res.end(buffer)

  } catch (err) {
    console.error('[Export Server] Erro ao renderizar página:', err.message)
    sendError(res, 500, 'Erro ao gerar o arquivo. Verifique se o dashboard está acessível.')
  }
}

// ─── Servidor HTTP ───────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // CORS para o Vite dev server
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const { pathname } = parse(req.url ?? '')

  if (req.method === 'POST' && pathname === '/api/export') {
    await handleExport(req, res)
    return
  }

  sendError(res, 404, `Rota não encontrada: ${req.method} ${pathname}`)
})

// ─── Erros não tratados do servidor ──────────────────────────
server.on('error', (err) => {
  console.error('[Export Server] Erro fatal:', err.message)
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`[Export Server] Rodando em http://localhost:${PORT}`)
  console.log('[Export Server] POST /api/export — gera PDF/PNG do dashboard')
})