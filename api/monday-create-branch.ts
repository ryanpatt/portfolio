export const config = { runtime: 'edge' }

const BOARD_ID = '18413273901'
const BRANCH_TYPE_COL = 'color_mm3bc4zz'
const BRANCH_COL = 'text_mm3b6h07'
const TICKET_COL = 'autonumber_mm3b7kt1'
const GH_OWNER = 'Med-mart'
const GH_REPO = 'mmr-web-m2'
const BASE_BRANCH = 'staging'

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

function slugify(name: string, ticketNum: number): string {
  const withoutPrefix = name.replace(/^MM-\d+\s*[·\-]?\s*/i, '')
  const slug = withoutPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
  return `mm-${ticketNum}-${slug}`
}

interface MondayColumnValue { id: string; value: string | null; text: string | null }
interface MondayItem { name: string; column_values: MondayColumnValue[] }

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const body = await request.text()

  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(body) } catch { return new Response('Bad Request', { status: 400 }) }

  // Monday challenge handshake (first-time webhook registration)
  if (parsed.challenge) {
    return new Response(JSON.stringify({ challenge: parsed.challenge }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const signingSecret = process.env.MONDAY_SIGNING_SECRET
  const mondayToken  = process.env.MONDAY_TOKEN
  const githubToken  = process.env.GITHUB_TOKEN

  if (!signingSecret || !mondayToken || !githubToken) {
    return new Response('Server misconfigured', { status: 500 })
  }

  // Verify HMAC-SHA256 signature
  const authHeader = request.headers.get('Authorization') ?? ''
  const valid = await verifySignature(body, authHeader, signingSecret)
  if (!valid) return new Response('Unauthorized', { status: 401 })

  const event = parsed.event as Record<string, unknown> | undefined
  if (!event || event.columnId !== BRANCH_TYPE_COL) return new Response('OK', { status: 200 })

  const eventValue = event.value as Record<string, unknown> | undefined
  const label = eventValue?.label as Record<string, unknown> | undefined
  const branchType = label?.text as string | undefined

  if (!branchType || !['feat', 'fix', 'ops', 'hotfix'].includes(branchType)) {
    return new Response('OK', { status: 200 })
  }

  const itemId = event.pulseId as number

  // Fetch ticket number and current branch value from Monday
  const itemData = await mondayGql(`{
    items(ids: [${itemId}]) {
      name
      column_values(ids: ["${TICKET_COL}", "${BRANCH_COL}"]) {
        id value text
      }
    }
  }`, mondayToken)

  const items = (itemData.data?.items as MondayItem[] | undefined)
  const item = items?.[0]
  if (!item) return new Response('Item not found', { status: 404 })

  // Skip if branch already set
  const branchCol = item.column_values.find(c => c.id === BRANCH_COL)
  if (branchCol?.text) return new Response(JSON.stringify({ skipped: true, branch: branchCol.text }), {
    headers: { 'Content-Type': 'application/json' },
  })

  // Get auto-number ticket ID
  const ticketCol = item.column_values.find(c => c.id === TICKET_COL)
  const ticketNum = parseInt(ticketCol?.value ?? ticketCol?.text ?? '0', 10)
  if (!ticketNum) return new Response('No ticket number', { status: 200 })

  const slug = slugify(item.name, ticketNum)
  const branchName = `${branchType}/${slug}`

  // Get staging branch HEAD SHA from GitHub
  const refRes = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${BASE_BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!refRes.ok) {
    const err = await refRes.text()
    console.error('GitHub ref lookup failed:', err)
    return new Response('GitHub ref lookup failed', { status: 502 })
  }

  const refData = await refRes.json() as { object?: { sha?: string } }
  const sha = refData.object?.sha
  if (!sha) return new Response('No SHA for base branch', { status: 502 })

  // Create the branch off staging
  const createRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/refs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error('GitHub branch create failed:', err)
    return new Response('Branch creation failed', { status: 502 })
  }

  // Write branch name back to Monday card
  await mondayGql(`mutation {
    change_column_value(
      board_id: ${BOARD_ID},
      item_id: ${itemId},
      column_id: "${BRANCH_COL}",
      value: ${JSON.stringify(JSON.stringify(branchName))}
    ) { id }
  }`, mondayToken)

  return new Response(JSON.stringify({ branch: branchName }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
