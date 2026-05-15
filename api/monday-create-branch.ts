export const config = { runtime: 'edge' }

const BOARD_ID = '18413273901'
const BRANCH_TYPE_COL = 'color_mm3bc4zz'
const BRANCH_COL = 'link_mm3cd6zn'
const GH_OWNER = 'Med-mart'
const GH_REPO = 'mmr-web-m2'
const BASE_BRANCH = 'production'

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

function toBranchSlug(name: string): string {
  return name
    .replace(/^MM-\d+\s*[·\-]?\s*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
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
  const mondayToken   = process.env.MONDAY_TOKEN
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

  // Fetch item name and branch column
  const itemData = await mondayGql(`{
    items(ids: [${itemId}]) {
      name
      column_values(ids: ["${BRANCH_COL}"]) { id text }
    }
  }`, mondayToken)

  const items = itemData.data?.items as { name: string; column_values: { id: string; text: string | null }[] }[] | undefined
  const item = items?.[0]
  if (!item) return new Response('Item not found', { status: 404 })

  // ── 1. Assign MM-XX if needed ──────────────────────────────────────────────
  let finalName = item.name
  let ticketNum: number

  const existingMatch = item.name.match(/^MM-(\d+)/i)
  if (existingMatch) {
    ticketNum = parseInt(existingMatch[1], 10)
  } else {
    ticketNum = await getNextTicketNumber(mondayToken)
    finalName = `MM-${ticketNum} · ${item.name}`
    await mondayGql(`mutation {
      change_multiple_column_values(
        board_id: ${BOARD_ID},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify({ name: finalName }))}
      ) { id }
    }`, mondayToken)
  }

  // Skip if branch column already set — link columns store url in `text`
  const branchColText = item.column_values.find(c => c.id === BRANCH_COL)?.text
  if (branchColText && branchColText !== 'null') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── 2. Compute branch name ─────────────────────────────────────────────────
  const branchName = `${branchType}/mm-${ticketNum}-${toBranchSlug(finalName)}`
  const branchUrl  = `https://github.com/${GH_OWNER}/${GH_REPO}/tree/${branchName}`

  // ── 3. Create branch on GitHub from staging ────────────────────────────────
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) return new Response('Server misconfigured', { status: 500 })

  const refRes = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${BASE_BRANCH}`,
    { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } }
  )
  if (!refRes.ok) return new Response('GitHub ref lookup failed', { status: 502 })
  const sha = (await refRes.json() as { object?: { sha?: string } }).object?.sha
  if (!sha) return new Response('No SHA for base branch', { status: 502 })

  const createRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/refs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  })
  if (!createRes.ok) {
    const err = await createRes.json() as { message?: string }
    // 422 = branch already exists — treat as success
    if (err.message !== 'Reference already exists') {
      return new Response('Branch creation failed', { status: 502 })
    }
  }

  // ── 4. Set Branch column (link) → clickable GitHub branch URL ─────────────
  const branchLinkValue = JSON.stringify({ url: branchUrl, text: branchName })
  await mondayGql(`mutation {
    change_column_value(
      board_id: ${BOARD_ID},
      item_id: ${itemId},
      column_id: "${BRANCH_COL}",
      value: ${JSON.stringify(branchLinkValue)}
    ) { id }
  }`, mondayToken)

  // ── 5. Post update with checkout command ──────────────────────────────────
  const update = [
    `🌿 **Branch created:** \`${branchName}\``,
    ``,
    `**Checkout locally:**`,
    `\`\`\``,
    `git fetch origin`,
    `git checkout ${branchName}`,
    `\`\`\``,
    ``,
    `🔗 [View on GitHub](${branchUrl})`,
  ].join('\n')

  await mondayGql(`mutation {
    create_update(item_id: ${itemId}, body: ${JSON.stringify(update)}) { id }
  }`, mondayToken)

  return new Response(JSON.stringify({ name: finalName, branch: branchName }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
