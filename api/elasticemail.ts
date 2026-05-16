export const config = { runtime: 'edge' }

const EE_BASE = 'https://api.elasticemail.com/v4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  // Password gate
  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
  const password = process.env.EMAIL_DASHBOARD_PASSWORD
  if (!password || token !== password) return json({ error: 'Unauthorized' }, 401)

  const apiKey = process.env.ELASTICEMAIL_API_KEY
  if (!apiKey) return json({ error: 'ElasticEmail API key not configured' }, 500)

  const eeHeaders = { 'X-ElasticEmail-ApiKey': apiKey }
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  // ── Email log list ────────────────────────────────────────────────────────
  if (action === 'emails') {
    const params = new URLSearchParams()
    ;['limit', 'offset', 'status', 'from', 'to', 'startDate', 'endDate', 'searchTerm'].forEach(k => {
      const v = url.searchParams.get(k)
      if (v) params.set(k, v)
    })
    const res = await fetch(`${EE_BASE}/emails?${params}`, { headers: eeHeaders })
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

  // ── Inbound stats + channel breakdown ─────────────────────────────────────
  if (action === 'channels') {
    const res = await fetch(`${EE_BASE}/statistics/channel/byname?limit=50`, { headers: eeHeaders })
    const data = await res.json()
    return json(data, res.ok ? 200 : res.status)
  }

  return json({ error: 'Unknown action' }, 400)
}
