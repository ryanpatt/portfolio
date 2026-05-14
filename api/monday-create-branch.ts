export const config = { runtime: 'edge' }

const BOARD_ID = '18413273901'
const BRANCH_TYPE_COL = 'color_mm3bc4zz'

async function verifySignature(body: string, authHeader: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const hexSig = authHeader.replace(/^hmac-sha256=/, '').trim()
  const bytes = new Uint8Array(hexSig.match(/.{2}/g)?.map(b => parseInt(b, 16)) ?? [])
  return crypto.subtle.verify('HMAC', key, bytes, enc.encode(body))
}

async function mondayGql(query: string, token: string): Promise<{ data?: Record<string, unknown>; errors?: unknown[] }> {
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query }),
  })
  return res.json() as Promise<{ data?: Record<string, unknown>; errors?: unknown[] }>
}

async function getNextTicketNumber(token: string): Promise<number> {
  const data = await mondayGql(`{
    boards(ids: [${BOARD_ID}]) {
      items_page(limit: 500) { items { name } }
    }
  }`, token)

  const items = (data.data?.boards as { items_page: { items: { name: string }[] } }[] | undefined)
    ?.[0]?.items_page?.items ?? []

  let max = 0
  for (const item of items) {
    const m = item.name.match(/^MM-(\d+)/i)
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n }
  }
  return max + 1
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const body = await request.text()

  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(body) } catch { return new Response('Bad Request', { status: 400 }) }

  if (parsed.challenge) {
    return new Response(JSON.stringify({ challenge: parsed.challenge }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const signingSecret = process.env.MONDAY_SIGNING_SECRET
  const mondayToken  = process.env.MONDAY_TOKEN
  if (!signingSecret || !mondayToken) return new Response('Server misconfigured', { status: 500 })

  const authHeader = request.headers.get('Authorization') ?? ''
  if (authHeader) {
    const valid = await verifySignature(body, authHeader, signingSecret)
    if (!valid) return new Response('Unauthorized', { status: 401 })
  }

  const event = parsed.event as Record<string, unknown> | undefined
  const colId = (event?.columnId ?? event?.column_id) as string | undefined
  if (!event || colId !== BRANCH_TYPE_COL) return new Response('OK', { status: 200 })

  const eventValue = event.value as Record<string, unknown> | null | undefined
  if (!eventValue) return new Response('OK', { status: 200 })

  const label = eventValue.label as Record<string, unknown> | undefined
  const branchType = label?.text as string | undefined
  if (!branchType || !['feat', 'fix', 'ops', 'hotfix'].includes(branchType)) {
    return new Response('OK', { status: 200 })
  }

  const itemId = (event.pulseId ?? event.pulse_id) as number

  // Fetch current item name
  const itemData = await mondayGql(`{ items(ids: [${itemId}]) { name } }`, mondayToken)
  const itemName = (itemData.data?.items as { name: string }[] | undefined)?.[0]?.name
  if (!itemName) return new Response('Item not found', { status: 404 })

  // Already has MM-XX prefix — nothing to do
  if (/^MM-\d+/i.test(itemName)) {
    return new Response(JSON.stringify({ skipped: true, name: itemName }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Assign next ticket number and rename
  const ticketNum = await getNextTicketNumber(mondayToken)
  const newName = `MM-${ticketNum} · ${itemName}`

  await mondayGql(`mutation {
    change_multiple_column_values(
      board_id: ${BOARD_ID},
      item_id: ${itemId},
      column_values: ${JSON.stringify(JSON.stringify({ name: newName }))}
    ) { id }
  }`, mondayToken)

  return new Response(JSON.stringify({ name: newName }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
