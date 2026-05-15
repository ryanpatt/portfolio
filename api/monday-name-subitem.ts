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
  if (!event) return new Response('OK', { status: 200 })

  const subitemId     = (event.pulseId      ?? event.pulse_id)        as number | undefined
  const subitemName   = (event.pulseName    ?? event.pulse_name)       as string | undefined
  const parentId      = (event.parentItemId ?? event.parent_item_id)  as number | undefined
  // boardId in subitem events is the subitems sub-board, not the parent board
  const subitemBoardId = (event.boardId     ?? event.board_id)         as number | undefined

  if (!subitemId || !subitemName || !parentId || !subitemBoardId) return new Response('OK', { status: 200 })

  // Already has a prefix — skip
  if (/^MM-\d+\.\d+/i.test(subitemName)) {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // Fetch parent name + all existing subitems in one query
  const parentData = await mondayGql(`{
    items(ids: [${parentId}]) {
      name
      subitems { id name }
    }
  }`, mondayToken)

  const parent = (parentData.data?.items as { name: string; subitems: { id: string; name: string }[] }[] | undefined)?.[0]
  if (!parent) return new Response('Parent not found', { status: 404 })

  // Extract MM-XX from parent name
  const parentMatch = parent.name.match(/^MM-(\d+)/i)
  if (!parentMatch) {
    // Parent hasn't been numbered yet — nothing to prefix with
    return new Response(JSON.stringify({ skipped: true, reason: 'parent has no MM-XX' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const parentTicket = parentMatch[1]

  // Count existing numbered subitems to get next index
  let maxIndex = 0
  for (const sub of parent.subitems) {
    const m = sub.name.match(/^MM-\d+\.(\d+)/i)
    if (m) { const n = parseInt(m[1], 10); if (n > maxIndex) maxIndex = n }
  }
  const subIndex = maxIndex + 1

  const newName = `MM-${parentTicket}.${subIndex} · ${subitemName}`

  // Subitems live in their own sub-board — use subitemBoardId not the parent BOARD_ID
  await mondayGql(`mutation {
    change_multiple_column_values(
      board_id: ${subitemBoardId},
      item_id: ${subitemId},
      column_values: ${JSON.stringify(JSON.stringify({ name: newName }))}
    ) { id }
  }`, mondayToken)

  return new Response(JSON.stringify({ name: newName }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
