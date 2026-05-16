export const config = { runtime: 'edge' }

const EE_BASE = 'https://api.elasticemail.com/v4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    ''
  )
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  // IP allowlist gate
  const allowedRaw = process.env.ALLOWED_IPS || ''
  const allowed = allowedRaw.split(',').map(s => s.trim()).filter(Boolean)
  if (allowed.length > 0) {
    const ip = clientIp(request)
    if (!ip || !allowed.includes(ip)) {
      return json({ error: 'Forbidden' }, 403)
    }
  }

  const apiKey = process.env.ELASTICEMAIL_API_KEY
  if (!apiKey) return json({ error: 'ElasticEmail API key not configured' }, 500)

  const eeHeaders = { 'X-ElasticEmail-ApiKey': apiKey }
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  // ── Event log list ────────────────────────────────────────────────────────
  if (action === 'emails') {
    const params = new URLSearchParams()
    ;['limit', 'offset', 'eventtype', 'from', 'to'].forEach(k => {
      const v = url.searchParams.get(k)
      if (v) params.set(k, v)
    })
    const res = await fetch(`${EE_BASE}/events?${params}`, { headers: eeHeaders })
    const data = await res.json()
    return json(data, res.ok ? 200 : res.status)
  }

  // ── Single email view (body on demand) ────────────────────────────────────
  if (action === 'view') {
    const msgid = url.searchParams.get('msgid')
    if (!msgid) return json({ error: 'msgid required' }, 400)
    const res = await fetch(`${EE_BASE}/emails/${encodeURIComponent(msgid)}/view`, { headers: eeHeaders })
    const data = await res.json()
    return json(data, res.ok ? 200 : res.status)
  }

  // ── Aggregate statistics ──────────────────────────────────────────────────
  if (action === 'stats') {
    const params = new URLSearchParams()
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`${EE_BASE}/statistics?${params}`, { headers: eeHeaders })
    const data = await res.json()
    return json(data, res.ok ? 200 : res.status)
  }

  return json({ error: 'Unknown action' }, 400)
}
