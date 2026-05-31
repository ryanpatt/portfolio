// MedMart Dev Sprint — twice-daily status report (8 AM / 6 PM ET).
// Triggered by Vercel Cron (see vercel.json) or manually with ?preview=1.
// Pulls the Monday board, builds a report, emails it via ElasticEmail.
//
// Required env vars:
//   MONDAY_TOKEN          Monday personal API token (read access to board)
//   ELASTICEMAIL_API_KEY  already configured for this project
//   CRON_SECRET           Vercel sends this as a Bearer token on cron calls
// Optional env vars:
//   REPORT_TO     comma-separated recipients (default: the three stakeholders)
//   REPORT_FROM   verified ElasticEmail sender (default below)
//   STALE_BASE_DAYS (default 2)   SP_GRACE_MIN (default 4)

export const config = { runtime: 'edge' }

const BOARD = '18413273901'
const BOARD_URL = `https://medmart-company.monday.com/boards/${BOARD}`
const MONDAY_API = 'https://api.monday.com/v2'
const EE_SEND = 'https://api.elasticemail.com/v4/emails'

const COL = {
  status: 'color_mm3b4c67',
  scope: 'color_mm3c8r1z',
  assignee: 'multiple_person_mm3bx243',
  sp: 'numeric_mm3bjq3m',
  tt: 'duration_mm3be8w6',
}
// Team tracked in the "by team member" activity section + hours. TEAM_ORDER
// fixes display order (JS reorders numeric-string object keys, so don't rely on it).
const TEAM_ORDER = ['104228757', '96592612', '97246569', '101693627']
const NAMED: Record<string, string> = {
  '104228757': 'Tu Van', '96592612': 'Faisal',
  '97246569': 'Anna', '101693627': 'Adriana',
}
const INPROGRESS = new Set(['Working on it', 'In Review', 'Stuck'])
const GATES = new Set(['Deployed/Ready for QA', 'Final QA', 'TBD:Staging', 'TBD:Prod'])
const STATUS_ORDER = ['Working on it', 'In Review', 'Stuck', 'Deployed/Ready for QA',
  'Final QA', 'TBD:Staging', 'TBD:Prod', 'Not Started', 'Triage', 'Done']

type Item = {
  id: string; name: string; updated_at: string; group: { title: string } | null
  st: { text: string | null }[]; sc: { text: string | null }[]
  asg: { text: string | null }[]; sp: { text: string | null }[]
  tt: { history?: { started_user_id: string; started_at: string; ended_at: string | null }[] }[]
  updates?: { creator_id: string; created_at: string }[]
}

// One activity-log event on the Dev Sprint board (status changes, edits, etc.).
type ActLog = { event: string; created_at: string; user_id: string | number; data: string }

async function monday<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.MONDAY_TOKEN
  if (!token) throw new Error('MONDAY_TOKEN not configured')
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(MONDAY_API, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json', 'API-Version': '2024-10' },
      body: JSON.stringify({ query, variables }),
    })
    const data = await r.json() as { data?: T; errors?: unknown }
    if (data.errors) {
      const msg = JSON.stringify(data.errors)
      if (/COMPLEXITY|complexity|Rate|minute/.test(msg) && attempt < 3) {
        await new Promise(res => setTimeout(res, 4000 * (attempt + 1))); continue
      }
      throw new Error(msg)
    }
    return data.data as T
  }
  throw new Error('Monday query failed')
}

async function fetchItems(): Promise<Item[]> {
  const q = `query($b:ID!,$c:String){boards(ids:[$b]){items_page(limit:60,cursor:$c){cursor items{
    id name updated_at group{title}
    st:column_values(ids:["${COL.status}"]){text}
    sc:column_values(ids:["${COL.scope}"]){text}
    asg:column_values(ids:["${COL.assignee}"]){text}
    sp:column_values(ids:["${COL.sp}"]){text}
    tt:column_values(ids:["${COL.tt}"]){ ... on TimeTrackingValue { history{started_user_id started_at ended_at} } }
    updates(limit:5){creator_id created_at}
  }}}}`
  const items: Item[] = []
  let cursor: string | null = null
  do {
    const d: any = await monday(q, { b: BOARD, c: cursor })
    const page = d.boards[0].items_page
    items.push(...page.items)
    cursor = page.cursor
  } while (cursor)
  return items
}

// Activity log for the Dev Sprint board over [fromISO, toISO]. Single board only.
async function fetchActivity(fromISO: string, toISO: string): Promise<ActLog[]> {
  const q = `query($b:ID!,$f:ISO8601DateTime!,$t:ISO8601DateTime!){boards(ids:[$b]){
    activity_logs(from:$f,to:$t,limit:500){event created_at user_id data}}}`
  const d: any = await monday(q, { b: BOARD, f: fromISO, t: toISO })
  return d.boards[0].activity_logs || []
}

// ── ET / DST helpers ────────────────────────────────────────────────────────
function etParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short',
  })
  const p: Record<string, string> = {}
  for (const part of fmt.formatToParts(d)) p[part.type] = part.value
  return { y: +p.year, mo: +p.month, da: +p.day, h: +p.hour, mi: +p.minute, wd: p.weekday }
}
// epoch ms for a given ET wall-clock time (handles DST via offset probe)
function etEpoch(y: number, mo: number, da: number, h: number, mi: number) {
  const guess = Date.UTC(y, mo - 1, da, h, mi)
  const p = etParts(new Date(guess))
  const asUtc = Date.UTC(p.y, p.mo - 1, p.da, p.h, p.mi)
  return guess - (asUtc - guess) // correct by the tz offset
}
const fmtET = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', ...opts }).format(d)

function one(cvs: { text: string | null }[]) { return cvs?.[0]?.text || null }

type Row = { age: number; st: string; sc: string; name: string; asg: string; sp: number }
function buildReport(items: Item[], now: Date, forcedAM?: boolean) {
  const et = etParts(now)
  const isAM = forcedAM !== undefined ? forcedAM : et.h < 12
  const STALE_BASE = +(process.env.STALE_BASE_DAYS || 2)
  const SP_GRACE_MIN = +(process.env.SP_GRACE_MIN || 4)
  // activity window
  const winStart = isAM
    ? etEpoch(et.y, et.mo, et.da, 18, 0) - 24 * 3600e3 // 6pm yesterday
    : etEpoch(et.y, et.mo, et.da, 8, 0)                // 8am today
  const dayStart = etEpoch(et.y, et.mo, et.da, 0, 0)
  const wdIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(et.wd)
  const weekStart = dayStart - wdIdx * 24 * 3600e3

  const statusCt: Record<string, number> = {}
  const scopeCt: Record<string, number> = {}
  const stale: Row[] = [], hung: Row[] = []
  const active: Row[] = []
  const doneToday: { t: number; name: string; asg: string }[] = []
  const recent: { t: number; st: string; name: string }[] = []
  const ttToday: Record<string, number> = {}, ttWeek: Record<string, number> = {}
  const notesByUser: Record<string, { t: number; name: string }[]> = {}
  for (const k of Object.keys(NAMED)) { ttToday[k] = 0; ttWeek[k] = 0; notesByUser[k] = [] }

  for (const it of items) {
    const st = one(it.st) || '—', sc = one(it.sc) || '—', asg = one(it.asg) || ''
    const grp = it.group?.title || ''
    const sp = Math.ceil(parseFloat(one(it.sp) || '0')) || 0
    const upd = Date.parse(it.updated_at)
    const ageDays = (now.getTime() - upd) / 86400e3
    statusCt[st] = (statusCt[st] || 0) + 1
    scopeCt[sc] = (scopeCt[sc] || 0) + 1
    const done = st === 'Done' || grp.includes('Done')
    const threshold = sp >= SP_GRACE_MIN ? sp : STALE_BASE // big items get proportional grace
    const row: Row = { age: Math.floor(ageDays), st, sc, name: it.name, asg, sp }
    if (!done && ageDays >= threshold) {
      if (INPROGRESS.has(st)) stale.push(row)
      else if (GATES.has(st)) hung.push(row)
    }
    if (!done && INPROGRESS.has(st)) active.push(row)
    if (done && upd >= dayStart) doneToday.push({ t: upd, name: it.name, asg })
    if (upd >= winStart) recent.push({ t: upd, st, name: it.name })
    for (const h of it.tt?.[0]?.history || []) {
      const uid = h.started_user_id
      if (!(uid in NAMED) || !h.ended_at) continue
      const s = Date.parse(h.started_at), e = Date.parse(h.ended_at)
      const dur = (e - s) / 1000
      if (s >= dayStart) ttToday[uid] += dur
      if (s >= weekStart) ttWeek[uid] += dur
    }
    for (const up of it.updates || []) {
      const cid = String(up.creator_id)
      const t = Date.parse(up.created_at)
      if (cid in NAMED && t >= winStart) notesByUser[cid].push({ t, name: it.name })
    }
  }
  const byAge = (a: Row, b: Row) => b.age - a.age
  const stIdx = (s: string) => { const i = STATUS_ORDER.indexOf(s); return i < 0 ? 99 : i }
  stale.sort(byAge); hung.sort(byAge)
  active.sort((a, b) => stIdx(a.st) - stIdx(b.st) || b.age - a.age)
  doneToday.sort((a, b) => b.t - a.t)
  recent.sort((a, b) => b.t - a.t)
  return { now, isAM, winStart, statusCt, scopeCt, stale, hung, active, doneToday, recent, ttToday, ttWeek, notesByUser, total: items.length, STALE_BASE, SP_GRACE_MIN }
}

// Per-member activity (status changes + notes + other edits + hours) for the
// report window, assembled from the board activity log + the report's tallies.
type Member = {
  name: string; hToday: number; hWeek: number
  status: { t: number; task: string; from: string; to: string }[]
  notes: { t: number; name: string }[]
  edits: number
}
function buildMembers(r: ReturnType<typeof buildReport>, logs: ActLog[]): Member[] {
  const m: Record<string, Member> = {}
  for (const [id, name] of Object.entries(NAMED)) {
    m[id] = { name, hToday: r.ttToday[id] || 0, hWeek: r.ttWeek[id] || 0, status: [], notes: r.notesByUser[id] || [], edits: 0 }
  }
  for (const l of logs) {
    const uid = String(l.user_id)
    if (!(uid in m)) continue
    const t = Number(l.created_at) / 1e4 // activity_logs created_at is in 100ns units
    if (t < r.winStart) continue
    if (l.event === 'update_column_value') {
      let d: any; try { d = JSON.parse(l.data) } catch { continue }
      if (d?.column_id === COL.status) {
        m[uid].status.push({ t, task: d.pulse_name || '—', from: d.previous_value?.label?.text || '—', to: d.value?.label?.text || '—' })
      } else {
        m[uid].edits++
      }
    } else if (l.event === 'create_pulse' || l.event === 'move_pulse_from_group' || l.event === 'update_name') {
      m[uid].edits++
    }
  }
  for (const v of Object.values(m)) { v.status.sort((a, b) => b.t - a.t); v.notes.sort((a, b) => b.t - a.t) }
  return TEAM_ORDER.map(id => m[id])
}

const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
const hrs = (s: number) => `${(s / 3600).toFixed(1)}h`

// ── shared rendering pieces ───────────────────────────────────────────────
const emptyRow = (msg: string) => `<tr><td style="color:#999;padding:4px 8px">${msg}</td></tr>`
const rowTbl = (rows: Row[]) => rows.slice(0, 20).map(x =>
  `<tr><td style="padding:2px 8px;color:#b45309;font-weight:600">${x.age}d</td>`
  + `<td style="padding:2px 8px"><span style="background:#eef;border-radius:4px;padding:1px 6px;font-size:12px">${esc(x.st)}</span> `
  + `<span style="color:#888;font-size:12px">${esc(x.sc)}</span></td>`
  + `<td style="padding:2px 8px">${esc(x.name)}${x.sp ? ` <span style="color:#aaa">(${x.sp}sp)</span>` : ''}</td>`
  + `<td style="padding:2px 8px;color:#555;font-size:12px">${esc(x.asg || 'unassigned')}</td></tr>`).join('')

function statusBlock(r: ReturnType<typeof buildReport>) {
  const statusLine = STATUS_ORDER.filter(s => r.statusCt[s])
    .map(s => `<b>${r.statusCt[s]}</b> ${esc(s)}`).join(' · ')
  const scopeLine = Object.entries(r.scopeCt).sort().map(([k, v]) => `${esc(k)} ${v}`).join(', ')
  return `<div style="background:#f6f7fb;border-radius:8px;padding:10px 14px;margin-bottom:16px">
    <div style="font-size:13px;color:#555;margin-bottom:4px">${r.total} items</div>
    <div style="font-size:13px;line-height:1.7">${statusLine}</div>
    <div style="font-size:12px;color:#888;margin-top:4px">scope: ${scopeLine}</div>
  </div>`
}
const scopeText = (r: ReturnType<typeof buildReport>) =>
  Object.entries(r.scopeCt).sort().map(([k, v]) => `${k} ${v}`).join(', ')
const statusText = (r: ReturnType<typeof buildReport>) =>
  `${r.total} items: ` + STATUS_ORDER.filter(s => r.statusCt[s]).map(s => `${r.statusCt[s]} ${s}`).join(' · ')

function shell(title: string, dateStr: string, timeStr: string, body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:720px;margin:auto;color:#222">
  <h2 style="margin:0 0 2px">${title}</h2>
  <div style="color:#888;font-size:13px;margin-bottom:14px">${dateStr}, ${timeStr} ET · <a href="${BOARD_URL}">open board</a></div>
  ${body}
  <div style="color:#aaa;font-size:11px;margin-top:18px;border-top:1px solid #eee;padding-top:8px">Automated from ryanpatt.com · board ${BOARD}.</div>
</div>`
}

// ── 8 AM: what's active / being worked on ─────────────────────────────────
function renderMorning(r: ReturnType<typeof buildReport>, dateStr: string, timeStr: string) {
  const subject = `MedMart Dev Sprint — Morning: What's Active — ${dateStr}`
  const body = `${statusBlock(r)}
  <h3 style="margin:14px 0 4px">🔧 Active — being worked on — ${r.active.length}</h3>
  <table style="border-collapse:collapse;font-size:13px;width:100%">${rowTbl(r.active) || emptyRow('nothing in progress')}</table>
  <h3 style="margin:18px 0 4px;color:#b45309">⚠ Stalling — ${r.stale.length} <span style="font-weight:400;font-size:12px;color:#999">(no update ≥ ${r.STALE_BASE}d; items ≥${r.SP_GRACE_MIN}sp get sp-day grace)</span></h3>
  <table style="border-collapse:collapse;font-size:13px;width:100%">${rowTbl(r.stale) || emptyRow('none 🎉')}</table>
  <h3 style="margin:18px 0 4px;color:#b91c1c">⛔ Waiting in deploy/QA gate — ${r.hung.length}</h3>
  <table style="border-collapse:collapse;font-size:13px;width:100%">${rowTbl(r.hung) || emptyRow('none 🎉')}</table>`
  const html = shell("MedMart Dev Sprint — Morning · What's Active", dateStr, timeStr, body)

  const lines: string[] = []
  lines.push(`MEDMART DEV SPRINT — Morning: What's Active — ${dateStr}, ${timeStr} ET`)
  lines.push(statusText(r)); lines.push(`scope: ${scopeText(r)}`)
  lines.push(`\n🔧 ACTIVE — being worked on: ${r.active.length}`)
  r.active.slice(0, 20).forEach(x => lines.push(`  ${x.age}d [${x.st}|${x.sc}] ${x.name} — ${x.asg || 'unassigned'}`))
  lines.push(`\n⚠ STALLING (no update ≥${r.STALE_BASE}d): ${r.stale.length}`)
  r.stale.slice(0, 20).forEach(x => lines.push(`  ${x.age}d [${x.st}|${x.sc}] ${x.name} — ${x.asg || 'unassigned'}`))
  lines.push(`\n⛔ WAITING in deploy/QA gate: ${r.hung.length}`)
  r.hung.slice(0, 20).forEach(x => lines.push(`  ${x.age}d [${x.st}|${x.sc}] ${x.name} — ${x.asg || 'unassigned'}`))
  return { subject, html, text: lines.join('\n') }
}

// ── 6 PM: what got done today + activity + hours ──────────────────────────
function renderEvening(r: ReturnType<typeof buildReport>, dateStr: string, timeStr: string, members: Member[]) {
  const subject = `MedMart Dev Sprint — Evening Wrap-up — ${dateStr}`
  const winStr = fmtET(new Date(r.winStart), { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  const tm = (t: number) => fmtET(new Date(t), { hour: 'numeric', minute: '2-digit' })
  const doneRows = r.doneToday.slice(0, 30).map(x =>
    `<tr><td style="padding:2px 8px;color:#888;font-size:12px">${tm(x.t)}</td>`
    + `<td style="padding:2px 8px">${esc(x.name)}</td>`
    + `<td style="padding:2px 8px;color:#555;font-size:12px">${esc(x.asg || '')}</td></tr>`).join('')
  const recentRows = r.recent.slice(0, 20).map(x =>
    `<tr><td style="padding:1px 8px;color:#888;font-size:12px">${tm(x.t)}</td>`
    + `<td style="padding:1px 8px;font-size:12px"><span style="color:#667">[${esc(x.st)}]</span> ${esc(x.name)}</td></tr>`).join('')
  const memberBlocks = members.map(m => {
    const acts: string[] = []
    m.status.slice(0, 6).forEach(s => acts.push(`<div style="font-size:12px;color:#555;padding:1px 0">↪ <b>${esc(s.to)}</b> <span style="color:#999">(from ${esc(s.from)})</span> · ${esc(s.task)} <span style="color:#aaa">${tm(s.t)}</span></div>`))
    m.notes.slice(0, 6).forEach(n => acts.push(`<div style="font-size:12px;color:#555;padding:1px 0">📝 note · ${esc(n.name)} <span style="color:#aaa">${tm(n.t)}</span></div>`))
    const summ = `${hrs(m.hToday)} today / ${hrs(m.hWeek)} wk · ${m.status.length} status · ${m.notes.length} notes${m.edits ? ` · ${m.edits} edits` : ''}`
    const quiet = !m.status.length && !m.notes.length && !m.edits && !m.hToday
    return `<div style="margin:6px 0;padding:8px 10px;background:#fafafa;border-radius:6px">
      <div><b>${esc(m.name)}</b> <span style="color:#888;font-size:12px">· ${summ}</span></div>
      ${quiet ? '<div style="font-size:12px;color:#bbb">no activity</div>' : acts.join('')}</div>`
  }).join('')
  const body = `${statusBlock(r)}
  <h3 style="margin:14px 0 4px;color:#15803d">✅ Done today — ${r.doneToday.length}</h3>
  <table style="border-collapse:collapse;font-size:13px;width:100%">${doneRows || emptyRow('nothing marked done yet')}</table>
  <h3 style="margin:18px 0 4px">🔄 Activity since ${winStr} — ${r.recent.length} items</h3>
  <table style="border-collapse:collapse;width:100%">${recentRows || emptyRow('no activity')}</table>
  <h3 style="margin:18px 0 4px">👥 By team member <span style="font-weight:400;font-size:12px;color:#999">(time · status changes · notes, since ${winStr})</span></h3>
  ${memberBlocks}`
  const html = shell('MedMart Dev Sprint — Evening Wrap-up', dateStr, timeStr, body)

  const lines: string[] = []
  lines.push(`MEDMART DEV SPRINT — Evening Wrap-up — ${dateStr}, ${timeStr} ET`)
  lines.push(statusText(r)); lines.push(`scope: ${scopeText(r)}`)
  lines.push(`\n✅ DONE TODAY: ${r.doneToday.length}`)
  r.doneToday.slice(0, 30).forEach(x => lines.push(`  ${tm(x.t)} ${x.name} — ${x.asg || ''}`.trimEnd()))
  lines.push(`\n🔄 ACTIVITY since ${winStr}: ${r.recent.length} items`)
  r.recent.slice(0, 20).forEach(x => lines.push(`  ${tm(x.t)} [${x.st}] ${x.name}`))
  lines.push(`\n👥 BY TEAM MEMBER (time today/wk · status · notes, since ${winStr}):`)
  members.forEach(m => {
    lines.push(`  ${m.name}: ${hrs(m.hToday)} today / ${hrs(m.hWeek)} wk · ${m.status.length} status · ${m.notes.length} notes${m.edits ? ` · ${m.edits} edits` : ''}`)
    m.status.slice(0, 6).forEach(s => lines.push(`     ↪ ${s.to} (from ${s.from}) · ${s.task} ${tm(s.t)}`))
    m.notes.slice(0, 6).forEach(n => lines.push(`     📝 note · ${n.name} ${tm(n.t)}`))
  })
  return { subject, html, text: lines.join('\n') }
}

function render(r: ReturnType<typeof buildReport>, members: Member[]) {
  const dateStr = fmtET(r.now, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = fmtET(r.now, { hour: 'numeric', minute: '2-digit' })
  return r.isAM ? renderMorning(r, dateStr, timeStr) : renderEvening(r, dateStr, timeStr, members)
}

async function sendEmail(to: string[], subject: string, html: string, text: string, from: string) {
  const apiKey = process.env.ELASTICEMAIL_API_KEY
  if (!apiKey) throw new Error('ELASTICEMAIL_API_KEY not configured')
  const body = {
    Recipients: to.map(Email => ({ Email })),
    Content: {
      From: from,
      Subject: subject,
      Body: [
        { ContentType: 'HTML', Charset: 'utf-8', Content: html },
        { ContentType: 'PlainText', Charset: 'utf-8', Content: text },
      ],
    },
  }
  const res = await fetch(EE_SEND, {
    method: 'POST',
    headers: { 'X-ElasticEmail-ApiKey': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const out = await res.text()
  if (!res.ok) throw new Error(`ElasticEmail ${res.status}: ${out}`)
  return out
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') || ''
  const isCron = secret && auth === `Bearer ${secret}`
  const isPreview = url.searchParams.get('preview') === '1' && (!secret || url.searchParams.get('key') === secret)
  if (!isCron && !isPreview) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    // Diagnostic: list validated ElasticEmail sender domains.
    if (url.searchParams.get('action') === 'domains') {
      const apiKey = process.env.ELASTICEMAIL_API_KEY || ''
      const res = await fetch('https://api.elasticemail.com/v4/domains', { headers: { 'X-ElasticEmail-ApiKey': apiKey } })
      return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } })
    }
    // Vercel Cron fires four UTC slots (12/13/22/23, Mon–Fri); we proceed only
    // when the punctual fire lands on 8am or 6pm ET, which is exactly one cron
    // per slot in either DST state — no double-send, DST-proof. The slot/AM is
    // derived from the ET hour (no slot param needed). ?slot=am|pm forces a run
    // for manual preview testing.
    const now = new Date()
    const { h } = etParts(now)
    const slot = url.searchParams.get('slot') // 'am' | 'pm'
    let forcedAM: boolean | undefined
    if (slot === 'am') forcedAM = true
    else if (slot === 'pm') forcedAM = false
    if (!isPreview && !slot && h !== 8 && h !== 18) {
      return new Response(JSON.stringify({ skipped: `ET hour ${h} is not a send window` }), { headers: { 'Content-Type': 'application/json' } })
    }
    const items = await fetchItems()
    const report = buildReport(items, now, forcedAM)
    // Per-member activity (status changes + edits) from the Dev Sprint board's
    // activity log over the report window. Best-effort: never fail the report.
    let logs: ActLog[] = []
    try { logs = await fetchActivity(new Date(report.winStart).toISOString(), now.toISOString()) } catch { /* skip */ }
    const members = buildMembers(report, logs)
    const { subject, html, text } = render(report, members)

    // recipients: ?to= overrides (used for preview test); else REPORT_TO; else stakeholders
    const toParam = url.searchParams.get('to')
    const to = (toParam || process.env.REPORT_TO ||
      'rpatt@medmart.com,dlykins@medmart.com,dfesman@medmart.com').split(',').map(s => s.trim()).filter(Boolean)

    const fromAddr = url.searchParams.get('from') || process.env.REPORT_FROM || 'MedMart Reports <noreply@ryanpatt.email>'
    if (url.searchParams.get('dry') === '1') {
      return new Response(JSON.stringify({ subject, from: fromAddr, to, text }, null, 2), { headers: { 'Content-Type': 'application/json' } })
    }
    const result = await sendEmail(to, subject, html, text, fromAddr)
    return new Response(JSON.stringify({ sent: true, from: fromAddr, to, subject, ee: result }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
