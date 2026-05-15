export const config = { runtime: 'edge' }

const PARENT_BOARD_ID = '18413273901'
const SUB_BOARD_ID    = '18413285656'
const BRANCH_TYPE_COL = 'color_mm3c9sz1'  // Branch Type on subitems board
const BRANCH_COL      = 'link_mm3c9ymd'   // Branch (link) on subitems board
const GH_OWNER        = 'Med-mart'
const GH_REPO         = 'mmr-web-m2'
const BASE_BRANCH     = 'production'

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

function toBranchSlug(name: string): string {
  return name
    .replace(/^MM-[\d.]+\s*[·\-]?\s*/i, '')
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

  const mondayToken = process.env.MONDAY_TOKEN
  const githubToken = process.env.GITHUB_TOKEN
  if (!mondayToken || !githubToken) return new Response('Server misconfigured', { status: 500 })

  const event       = parsed.event as Record<string, unknown> | undefined
  if (!event) return new Response('OK', { status: 200 })

  const subitemId   = (event.pulseId      ?? event.pulse_id)       as number | undefined
  const subitemName = (event.pulseName    ?? event.pulse_name)      as string | undefined
  const parentId    = (event.parentItemId ?? event.parent_item_id) as number | undefined
  const changedCol  = (event.columnId     ?? event.column_id)      as string | undefined

  if (!subitemId || !subitemName || !parentId) return new Response('OK', { status: 200 })

  // ── Fetch parent name + existing subitems ──────────────────────────────────
  const parentData = await mondayGql(`{
    items(ids: [${parentId}]) {
      name
      subitems { id name }
    }
  }`, mondayToken)

  const parent = (parentData.data?.items as { name: string; subitems: { id: string; name: string }[] }[] | undefined)?.[0]
  if (!parent) return new Response('Parent not found', { status: 404 })

  const parentMatch = parent.name.match(/^MM-(\d+)/i)
  if (!parentMatch) return new Response(JSON.stringify({ skipped: true, reason: 'parent has no MM-XX' }), {
    headers: { 'Content-Type': 'application/json' },
  })
  const parentTicket = parentMatch[1]

  // ── Auto-name subitem if it lacks MM-XX.N prefix ──────────────────────────
  let finalName = subitemName
  let subIndex: number

  const existingMatch = subitemName.match(/^MM-\d+\.(\d+)/i)
  if (existingMatch) {
    subIndex = parseInt(existingMatch[1], 10)
  } else {
    let maxIndex = 0
    for (const sub of parent.subitems) {
      const m = sub.name.match(/^MM-\d+\.(\d+)/i)
      if (m) { const n = parseInt(m[1], 10); if (n > maxIndex) maxIndex = n }
    }
    subIndex = maxIndex + 1
    finalName = `MM-${parentTicket}.${subIndex} · ${subitemName}`

    await mondayGql(`mutation {
      change_multiple_column_values(
        board_id: ${SUB_BOARD_ID},
        item_id: ${subitemId},
        column_values: ${JSON.stringify(JSON.stringify({ name: finalName }))}
      ) { id }
    }`, mondayToken)
  }

  // ── Only do branch work if Branch Type column was the trigger ──────────────
  if (changedCol !== BRANCH_TYPE_COL) {
    return new Response(JSON.stringify({ name: finalName }), { headers: { 'Content-Type': 'application/json' } })
  }

  const eventValue = event.value as Record<string, unknown> | null | undefined
  if (!eventValue) return new Response('OK', { status: 200 })
  const label = eventValue.label as Record<string, unknown> | undefined
  const branchType = label?.text as string | undefined
  if (!branchType || !['feat', 'fix', 'ops', 'hotfix'].includes(branchType)) {
    return new Response('OK', { status: 200 })
  }

  // Check if branch already set on this subitem
  const subitemData = await mondayGql(`{
    items(ids: [${subitemId}]) {
      column_values(ids: ["${BRANCH_COL}"]) { id text }
    }
  }`, mondayToken)
  const branchText = (subitemData.data?.items as { column_values: { id: string; text: string | null }[] }[] | undefined)
    ?.[0]?.column_values?.[0]?.text
  if (branchText && branchText !== 'null') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Create GitHub branch ───────────────────────────────────────────────────
  const branchName = `${branchType}/mm-${parentTicket}.${subIndex}-${toBranchSlug(finalName)}`
  const branchUrl  = `https://github.com/${GH_OWNER}/${GH_REPO}/tree/${branchName}`

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
    if (err.message !== 'Reference already exists') return new Response('Branch creation failed', { status: 502 })
  }

  // ── Set Branch column (link) ───────────────────────────────────────────────
  const branchLinkValue = JSON.stringify({ url: branchUrl, text: branchName })
  await mondayGql(`mutation {
    change_column_value(
      board_id: ${SUB_BOARD_ID},
      item_id: ${subitemId},
      column_id: "${BRANCH_COL}",
      value: ${JSON.stringify(branchLinkValue)}
    ) { id }
  }`, mondayToken)

  // ── Post git checkout command as subitem update ────────────────────────────
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
    create_update(item_id: ${subitemId}, body: ${JSON.stringify(update)}) { id }
  }`, mondayToken)

  return new Response(JSON.stringify({ name: finalName, branch: branchName }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
