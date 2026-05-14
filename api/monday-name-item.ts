export const config = { runtime: 'edge' }

const BOARD_ID = '18413273901'

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

// Find the highest MM-XX number across all items on the board
async function getNextTicketNumber(token: string): Promise<number> {
  const data = await mondayGql(`{
    boards(ids: [${BOARD_ID}]) {
      items_page(limit: 500) {
        items { name }
      }
    }
  }`, token)

  const items = (data.data?.boards as { items_page: { items: { name: string }[] } }[] | undefined)?.[0]?.items_page?.items ?? []

  let max = 0
  for (const item of items) {
    const match = item.name.match(/^MM-(\d+)/i)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > max) max = n
    }
  }
  return max + 1
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const body = await request.text()

  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(body) } catch { return new Response('Bad Request', { status: 400 }) }

  // Monday challenge handshake
  if (parsed.challenge) {
    return new Response(JSON.stringify({ challenge: parsed.challenge }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const mondayToken = process.env.MONDAY_TOKEN
  if (!mondayToken) return new Response('Server misconfigured', { status: 500 })

  const event = parsed.event as Record<string, unknown> | undefined
  const itemId = (event?.pulseId ?? event?.pulse_id) as number | undefined
  const itemName = (event?.pulseName ?? event?.pulse_name) as string | undefined

  if (!itemId || !itemName) return new Response('OK', { status: 200 })

  // Skip if already has MM-XX prefix
  if (/^MM-\d+/i.test(itemName)) return new Response(JSON.stringify({ skipped: true }), {
    headers: { 'Content-Type': 'application/json' },
  })

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
