import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── types ─────────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'checklist' | 'demo' | 'square' | 'rollback'
type Status = 'ready' | 'blocked' | 'caution' | 'info'

const statusBadge: Record<Status, string> = {
  ready:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  blocked: 'bg-red-500/15 text-red-400 border-red-500/25',
  caution: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
}

/* ─── snapshot meta ─────────────────────────────────────────────────────── */

const REVIEW_DATE = '2026-05-26'
const STORAGE_KEY = 'jtc-launch-prep-v1'

const statCards: { label: string; value: string; sub: string; color: string }[] = [
  { label: 'Demo on staging', value: 'Ready', sub: '15/15 routes return 200', color: 'text-emerald-400' },
  { label: 'Production build', value: 'Stale', sub: 'Recent features 404 on prod', color: 'text-orange-400' },
  { label: 'Square mode', value: 'Sandbox', sub: 'Prod keys present, switch OFF', color: 'text-gold' },
  { label: 'Go-live blockers', value: '3', sub: 'Old build · no prod deploy · menu review', color: 'text-red-400' },
]

/* ─── demo smoke test (read-only HTTP checks, 2026-05-26) ───────────────── */

const stagingRoutes: string[] = [
  '/', '/menu', '/order', '/cart', '/checkout', '/faq',
  '/community/photos', '/community/partners', '/auth/login', '/auth/register',
  '/auth/forgot-password', '/dashboard', '/kitchen', '/admin/dashboard', '/reservations',
]

const prodRoutes: { path: string; ok: boolean }[] = [
  { path: '/', ok: true },
  { path: '/community/partners', ok: true },
  { path: '/faq', ok: false },
  { path: '/community/photos', ok: false },
  { path: '/dashboard/settings', ok: false },
  { path: '/kitchen', ok: false },
]

const pendingDemoItems: string[] = [
  'Reservations form → mobile-friendly modal (was flagged pending in the last build session — confirm before demoing reservations on a phone).',
  'Admin “how to create an event” inline help/template (pending — confirm in /admin/events).',
]

/* ─── the consolidated checklist ────────────────────────────────────────── */

type CheckItem = { id: string; label: string; detail?: string }
type CheckGroup = { tier: string; tone: Status; blurb: string; items: CheckItem[] }

const checklist: CheckGroup[] = [
  {
    tier: 'Phase 0 — Today (demo on staging)', tone: 'ready',
    blurb: 'Staging is the current build and runs on Square sandbox — safe to demo, no real money moves.',
    items: [
      { id: 'p0-url', label: 'Demo on staging.thejamestowncafe.com (NOT the apex — prod is an older build)' },
      { id: 'p0-smoke', label: 'Re-smoke-test the 15 demo routes the morning of (all returned 200 on 2026-05-26)' },
      { id: 'p0-logins', label: 'Confirm staging logins work', detail: 'Admin admin@thejamestowncafe.com · KDS PIN 1234 (staging only).' },
      { id: 'p0-reservations', label: 'Spot-check reservations modal + admin events help (both were pending last session)' },
      { id: 'p0-order', label: 'Place a sandbox test order end-to-end (cart → checkout → confirmation)' },
    ],
  },
  {
    tier: 'Phase 1 — Owner menu review (before any real payments)', tone: 'caution',
    blurb: 'The live menu was script-generated from item names — prices, sizes and modifiers are educated guesses. The owner has to verify these against the real menu/POS before going live.',
    items: [
      { id: 'p1-prices', label: 'Owner verifies every item price' },
      { id: 'p1-mods', label: 'Owner verifies modifier prices', detail: 'Inferred today: oat/almond/soy +$0.75, syrups +$0.50, extra shot +$0.75, cold foam +$0.50, whipped cream +$0.25.' },
      { id: 'p1-sizes', label: 'Owner verifies sizes group correctly (e.g. Latte 16oz / 20oz under one item)' },
      { id: 'p1-attach', label: 'Owner verifies which modifier groups attach to which drinks' },
      { id: 'p1-active', label: 'Owner confirms which items are active vs hidden, and item names/spelling' },
    ],
  },
  {
    tier: 'Phase 2 — Pre-prod engineering', tone: 'caution',
    blurb: 'Prod is running an old build and there is no production deploy path yet.',
    items: [
      { id: 'p2-deploy', label: 'Write + test a production deploy script (only deploy_staging.sh exists today)', detail: 'Model it on the staging script but target the prod Cloudways app (6372516). Keep the env.production.php exclusion.' },
      { id: 'p2-push', label: 'Deploy the current build to prod and confirm /faq, /community/photos, /dashboard/settings, /kitchen now return 200' },
      { id: 'p2-gitsecrets', label: 'Scrub committed secrets', detail: 'private_html/.env.production and square.env are tracked in git; .env.production contains the prod DB password. Untrack + rotate.' },
      { id: 'p2-backup', label: 'Take a full JSON export of the PROD Square catalog as a rollback artifact (no such script exists yet)' },
    ],
  },
  {
    tier: 'Phase 3 — Flip Square to production', tone: 'blocked',
    blurb: 'Only after Phases 1 & 2. Flipping this means real cards get charged.',
    items: [
      { id: 'p3-menu', label: 'Decide menu strategy', detail: 'Recommended: owner edits the menu in the Square Dashboard, then run /admin/sync to pull it in — no destructive writes, no rollback needed.' },
      { id: 'p3-flip', label: 'Set SQUARE_ENVIRONMENT=production', detail: 'Prod keys already live in env.production.php (token, prod app id, location L08EBJQJ1ATXA). Note: a DB settings.square_environment row can override the file — check both.' },
      { id: 'p3-sync', label: 'Run /admin/sync against prod and verify the live menu matches the owner-approved menu' },
    ],
  },
  {
    tier: 'Phase 4 — Post-launch verification', tone: 'info',
    blurb: 'Prove the real-money path works, then stand down.',
    items: [
      { id: 'p4-order', label: 'Place ONE small real order, confirm it lands in the prod Square POS, then refund it' },
      { id: 'p4-payment', label: 'Confirm payment + order both appear in the Square dashboard with correct totals/tip/fees' },
      { id: 'p4-monitor', label: 'Watch the first day of real orders for menu/price mismatches' },
    ],
  },
]

/* ─── page ───────────────────────────────────────────────────────────────── */

const validTabs: TabId[] = ['overview', 'checklist', 'demo', 'square', 'rollback']

function readHashTab(): TabId {
  if (typeof window === 'undefined') return 'overview'
  const raw = window.location.hash.replace('#', '')
  return validTabs.includes(raw as TabId) ? (raw as TabId) : 'overview'
}

export default function JtownLaunchPrep() {
  const [tab, setTab] = useState<TabId>(() => readHashTab())
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => {
    const desired = `#${tab}`
    if (window.location.hash !== desired) window.history.replaceState(null, '', desired)
  }, [tab])

  useEffect(() => {
    const onHashChange = () => setTab(readHashTab())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)) } catch { /* ignore */ }
  }, [checked])

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }))
  const resetChecks = () => setChecked({})

  const allItems = checklist.flatMap((g) => g.items)
  const doneCount = allItems.filter((i) => checked[i.id]).length
  const pct = Math.round((doneCount / allItems.length) * 100)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'checklist', label: `Checklist (${doneCount}/${allItems.length})` },
    { id: 'demo',      label: 'Demo Readiness' },
    { id: 'square',    label: 'Square & Menu' },
    { id: 'rollback',  label: 'Rollback Plan' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Ryan Patt
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">Jamestown Café · Launch Prep</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">{REVIEW_DATE}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Jamestown Café — Launch Prep</h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            A read-only readiness review and go-live checklist. The demo runs on staging against Square&apos;s sandbox,
            so it&apos;s safe to show today. Going to production is a separate, multi-step job — the checklist orders it
            so nothing real-money happens before the menu is verified and the build is current. No code, deploys, or
            Square settings were changed to produce this.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border-subtle overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-gold text-gold' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCards.map((c) => (
                <div key={c.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
                  <div className={`text-xl font-bold font-display mb-1 ${c.color}`}>{c.value}</div>
                  <div className="text-xs font-medium text-ink mb-0.5">{c.label}</div>
                  <div className="text-xs text-muted leading-snug">{c.sub}</div>
                </div>
              ))}
            </div>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">In one paragraph</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                <strong className="text-emerald-400">The demo is ready</strong> — every demo route on staging returns 200,
                and it runs on Square&apos;s sandbox so no real cards are charged. <strong className="text-orange-400">Production
                is not ready to flip today.</strong> Prod is running an older build (several recent pages 404 there), there is
                no production deploy script yet, and the menu in the system was generated by scripts rather than entered by the
                owner — so prices, sizes and modifiers need an owner review before any real payment is taken.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                The good news on safety: the destructive catalog scripts are hard-locked to sandbox and cannot touch prod,
                production Square keys already exist but the environment switch is deliberately OFF, and the code falls back
                to sandbox if prod keys are ever missing. Square is the source of truth and the site only pulls from it, so the
                safest &ldquo;go-live with the menu&rdquo; path needs no risky rewrite at all.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Ready / safe</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    'All 15 demo routes return 200 on staging',
                    'Demo runs on Square sandbox — no real charges',
                    'Destructive catalog scripts are sandbox-locked',
                    'Prod Square keys exist; switch intentionally OFF',
                    'Code auto-falls-back to sandbox if prod keys missing',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5 shrink-0">✓</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
              <section className="bg-red-500/[0.05] border border-red-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Blockers before go-live</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    'Prod runs an OLD build (recent pages 404)',
                    'No production deploy script exists',
                    'Menu is script-generated — owner must verify',
                    'No prod-catalog backup/rollback artifact yet',
                    'Prod DB password is committed in git',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-red-400 mt-0.5 shrink-0">✕</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="bg-blue-500/[0.06] border border-blue-500/30 rounded-xl p-5 flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">→</span>
              <div className="text-sm text-muted leading-relaxed">
                <span className="text-blue-400 font-semibold">Next:</span> work the
                <button onClick={() => setTab('checklist')} className="text-blue-400 underline hover:text-blue-300 mx-1">Checklist</button>
                top to bottom. Phase 0 is today; Phases 1–4 are the path to a real-money launch.
              </div>
            </div>
          </div>
        )}

        {/* CHECKLIST */}
        {tab === 'checklist' && (
          <div className="space-y-5">
            {/* progress */}
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">{doneCount} of {allItems.length} done</span>
                <button onClick={resetChecks} className="text-xs text-muted hover:text-ink underline">Reset</button>
              </div>
              <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted mt-2">Your check state is saved in this browser only.</p>
            </div>

            {checklist.map((g) => {
              const groupDone = g.items.filter((i) => checked[i.id]).length
              return (
                <section key={g.tier} className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[g.tone]}`}>
                      {groupDone}/{g.items.length}
                    </span>
                    <h2 className="text-base font-semibold text-ink">{g.tier}</h2>
                  </div>
                  <p className="text-xs text-muted mb-4 leading-relaxed">{g.blurb}</p>
                  <ul className="space-y-2.5">
                    {g.items.map((it) => {
                      const on = !!checked[it.id]
                      return (
                        <li key={it.id}>
                          <button
                            onClick={() => toggle(it.id)}
                            className="w-full text-left flex items-start gap-3 group"
                          >
                            <span className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              on ? 'bg-gold border-gold' : 'border-border-subtle group-hover:border-muted'
                            }`}>
                              {on && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#090c15" strokeWidth="3.5">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </span>
                            <span>
                              <span className={`text-sm ${on ? 'text-muted line-through' : 'text-ink'}`}>{it.label}</span>
                              {it.detail && <span className="block text-xs text-muted mt-0.5 leading-relaxed">{it.detail}</span>}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}

        {/* DEMO READINESS */}
        {tab === 'demo' && (
          <div className="space-y-6">
            <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-6">
              <h2 className="text-base font-semibold text-emerald-400 mb-2">Staging — all green</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Read-only HTTP checks on <code className="text-ink">staging.thejamestowncafe.com</code> ({REVIEW_DATE}).
                Every demo route returned <span className="text-emerald-400 font-mono">200</span>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stagingRoutes.map((r) => (
                  <div key={r} className="flex items-center gap-2 bg-black/20 border border-border-subtle/60 rounded px-3 py-2">
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">200</span>
                    <code className="text-xs text-ink truncate">{r}</code>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-2">Production — running an older build</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Same checks on the apex <code className="text-ink">thejamestowncafe.com</code>. Recent pages 404 there,
                which confirms none of the recent work has shipped to prod yet. <strong className="text-ink">Demo on staging.</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {prodRoutes.map((r) => (
                  <div key={r.path} className="flex items-center gap-2 bg-black/20 border border-border-subtle/60 rounded px-3 py-2">
                    <span className={`text-[10px] font-mono shrink-0 ${r.ok ? 'text-emerald-400' : 'text-red-400'}`}>{r.ok ? '200' : '404'}</span>
                    <code className="text-xs text-ink truncate">{r.path}</code>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Confirm before demoing these flows</h2>
              <ul className="space-y-2.5 text-sm text-muted">
                {pendingDemoItems.map((t, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-gold mt-0.5 shrink-0">•</span><span>{t}</span></li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* SQUARE & MENU */}
        {tab === 'square' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">How the catalog flows</h2>
              <p className="text-sm text-muted leading-relaxed">
                <strong className="text-ink">Square is the source of truth.</strong> The site only <em>pulls</em> the catalog
                from Square into its own database (the admin Sync action), then renders the menu from that DB. Nothing the site
                does writes back to Square&apos;s catalog. That single fact shapes the whole menu/rollback plan: the safest way to
                publish a menu is to fix it in Square and sync it down — never to rewrite Square from the app.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Square environment status</h2>
              <div className="space-y-3 text-sm">
                {[
                  ['Active mode', 'Sandbox', 'gold', 'SQUARE_ENVIRONMENT = sandbox in env.production.php — deliberately OFF.'],
                  ['Prod keys', 'Present', 'emerald', 'Real production token, a production app id (sq0idp- prefix), and location L08EBJQJ1ATXA are configured and ready.'],
                  ['Safety net', 'Auto-fallback', 'emerald', 'SquareService falls back to sandbox if prod keys are ever missing, so a half-configured prod can’t silently charge cards.'],
                  ['Override', 'DB can flip it', 'blue', 'A settings.square_environment row overrides the env file — check both when flipping or auditing.'],
                ].map(([k, v, c, d], i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-border-subtle/40 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs text-muted uppercase tracking-wider w-28 shrink-0">{k}</span>
                    <span className={`text-sm font-medium shrink-0 w-28 ${
                      c === 'emerald' ? 'text-emerald-400' : c === 'blue' ? 'text-blue-400' : 'text-gold'
                    }`}>{v}</span>
                    <span className="text-xs text-muted leading-relaxed">{d}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-6">
              <h2 className="text-base font-semibold text-emerald-400 mb-2">Updating the menu on staging — safe</h2>
              <p className="text-sm text-muted leading-relaxed">
                The catalog-rebuild scripts (<code className="text-ink">rebuild_sandbox_catalog</code>,
                <code className="text-ink"> restructure_full_menu</code>) are hard-coded to the sandbox environment — one even
                blanks the prod keys before running — and the prod→sandbox sync is read-only on prod. So you can wipe and
                rebuild the sandbox catalog freely, then run the admin Sync to pull it into the DB. No risk to prod.
              </p>
            </section>

            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-2">Menu accuracy — needs an owner review</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The current menu was built by scripts that <em>inferred</em> sizes, modifier groups and prices from item names.
                Reasonable, but guesses. Before any real payment, the owner should sign off on:
              </p>
              <ul className="space-y-2 text-sm text-muted">
                {[
                  'Item prices and names/spelling',
                  'Modifier prices (currently: oat/almond/soy +$0.75, syrups +$0.50, extra shot +$0.75, cold foam +$0.50, whipped cream +$0.25)',
                  'Size grouping (e.g. 16oz / 20oz under one item)',
                  'Which modifier groups attach to which drinks',
                  'Which items are active vs hidden',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-gold mt-0.5 shrink-0">•</span><span>{t}</span></li>
                ))}
              </ul>
            </section>

            <section className="bg-red-500/[0.05] border border-red-500/25 rounded-xl p-6">
              <h2 className="text-base font-semibold text-red-400 mb-2">Security cleanup (pre-go-live, not demo-blocking)</h2>
              <p className="text-sm text-muted leading-relaxed">
                Two secret-bearing files are tracked in git — <code className="text-ink">private_html/.env.production</code> (contains
                the prod DB password) and <code className="text-ink">square.env</code>. The gitignore rule only matched the
                root-level path, so the nested copy slipped through. Untrack them and rotate the exposed credentials before this
                repo goes anywhere public. The real prod Square token lives in <code className="text-ink">env.production.php</code>,
                which <em>is</em> correctly gitignored.
              </p>
            </section>
          </div>
        )}

        {/* ROLLBACK */}
        {tab === 'rollback' && (
          <div className="space-y-6">
            <section className="bg-blue-500/[0.06] border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-blue-400 mb-2">The key reality</h2>
              <p className="text-sm text-muted leading-relaxed">
                Square has <strong className="text-ink">no one-click rollback</strong>, and there is currently <strong className="text-ink">no
                tool that pushes the new menu to prod</strong> — every menu-build script targets sandbox only. So &ldquo;update prod with a
                rollback option&rdquo; isn&apos;t a single switch; it&apos;s a choice between two paths.
              </p>
            </section>

            <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.ready}`}>Recommended</span>
                <h2 className="text-base font-semibold text-ink">Option A — Square Dashboard → Sync</h2>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                The owner edits the menu in their real Square Dashboard (the source of truth), then you run the admin Sync to
                pull it into the site. <strong className="text-emerald-400">No destructive writes, so no rollback needed</strong> —
                Square keeps its own version history, and the site just mirrors whatever Square holds. Lowest risk, and it keeps
                the owner in control of their own catalog.
              </p>
            </section>

            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.caution}`}>Higher risk</span>
                <h2 className="text-base font-semibold text-ink">Option B — Programmatic push to prod</h2>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Only if you need to replicate the restructured sandbox layout exactly in prod. This means pointing a
                delete-and-rebuild at the production catalog — the risky operation. Do it safely:
              </p>
              <ol className="space-y-2 text-sm text-muted list-decimal pl-5">
                <li><strong className="text-ink">Back up first.</strong> Export the full prod catalog to timestamped JSON (the rollback artifact). No such script exists yet — it mirrors the read step of the existing prod→sandbox sync, ~20 lines.</li>
                <li><strong className="text-ink">Dry-run.</strong> Run the prod-targeted rebuild in dry-run mode and review the plan before writing.</li>
                <li><strong className="text-ink">Know the caveat.</strong> Recreating deleted objects from the backup gives them new IDs, which can break image/report links; past orders keep their own item snapshots, so sales history is not corrupted.</li>
              </ol>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-2">&ldquo;Keep the old menu just in case&rdquo;</h2>
              <p className="text-sm text-muted leading-relaxed">
                That instinct is right — implement it concretely as a <strong className="text-ink">timestamped JSON export of the
                prod catalog taken immediately before any change</strong>. That file is your rollback: it can be re-imported via
                batch-upsert to restore the previous menu. With Option A you don&apos;t even need it, because you never destructively
                rewrite Square.
              </p>
            </section>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-border-subtle text-xs text-muted">
          Prepared by Ryan Patt · Read-only readiness review · No code, deploys, or Square settings changed · Snapshot {REVIEW_DATE}.
        </footer>

      </div>
    </div>
  )
}
