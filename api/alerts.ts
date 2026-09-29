interface AlertEvent {
  area: string
  progress: number
  threshold: number
  shift?: string
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function isAlertEvent(value: unknown): value is AlertEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  return typeof event.area === 'string'
    && typeof event.progress === 'number'
    && Number.isFinite(event.progress)
    && typeof event.threshold === 'number'
    && Number.isFinite(event.threshold)
}

function getProvider(): string {
  return process.env.ALERT_WEBHOOK_PROVIDER?.toLowerCase() ?? 'custom'
}

function isConfigured(provider: string): boolean {
  return Boolean(process.env.ALERT_WEBHOOK_URL)
    && (provider !== 'whatsapp' || Boolean(process.env.ALERT_WEBHOOK_TOKEN && process.env.ALERT_WEBHOOK_TO))
}

function formatAlertText(events: AlertEvent[]): string {
  return events.map((event) =>
    `${event.area}: ${event.progress.toFixed(1)}% de avanço (limiar ${event.threshold.toFixed(1)}%)${event.shift ? ` · Turno ${event.shift}` : ''}`,
  ).join('\n')
}

export default {
  async fetch(request: Request): Promise<Response> {
    const provider = getProvider()
    if (request.method === 'GET') return json({ configured: isConfigured(provider), provider })
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

    if (!isConfigured(provider)) return json({ error: 'Webhook não configurado no servidor.' }, 503)

    let body: { events?: unknown }
    try {
      body = await request.json() as { events?: unknown }
    } catch {
      return json({ error: 'JSON inválido.' }, 400)
    }

    const events = Array.isArray(body.events) ? body.events.filter(isAlertEvent).slice(0, 100) : []
    if (events.length === 0) return json({ error: 'Nenhum evento válido foi enviado.' }, 400)

    const text = formatAlertText(events)
    let payload: Record<string, unknown>
    if (provider === 'whatsapp') {
      payload = {
        messaging_product: 'whatsapp',
        to: process.env.ALERT_WEBHOOK_TO,
        type: 'text',
        text: { body: text },
      }
    } else if (provider === 'slack' || provider === 'teams') {
      payload = { text }
    } else {
      payload = { text, events }
    }

    try {
      const response = await fetch(process.env.ALERT_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.ALERT_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return json({ error: `O webhook retornou HTTP ${response.status}.` }, 502)
      return json({ sent: events.length })
    } catch {
      return json({ error: 'Não foi possível alcançar o webhook configurado.' }, 502)
    }
  },
}
