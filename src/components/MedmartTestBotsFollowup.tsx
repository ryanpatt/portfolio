import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

type TabId = 'summary' | 'verified' | 'gap' | 'next'

const validTabs: TabId[] = ['summary', 'verified', 'gap', 'next']

const REPORT_DATE = '2026-05-28'
const QUERIED_AT_UTC = '2026-05-28 20:28 UTC'

type Status = 'ok' | 'warn' | 'unknown'

const statusColors: Record<Status, string> = {
  ok:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warn:    'bg-orange-500/15 text-orange-400 border-orange-500/25',
  unknown: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
}

const statusLabel: Record<Status, string> = {
  ok: 'Active', warn: 'Permissive', unknown: 'Not checked',
}

const statCards: { label: string; value: string; sub: string; color: string }[] = [
  { label: 'Asked',          value: '48h',       sub: 'Any bot attempts since 2026-05-26 20:28 UTC?', color: 'text-ink' },
  { label: 'Defenses up',    value: '2 / 2',     sub: 'IP block + payment-information rate limit still active', color: 'text-emerald-400' },
  { label: 'Traffic numbers', value: '—',         sub: 'Audit token still lacks Zone · Analytics · Read', color: 'text-orange-400' },
  { label: 'New config drift', value: '0',        sub: 'Custom rules, rate limits, allowlists unchanged since 2026-05-26', color: 'text-ink' },
]

const verified: { status: Status; title: string; detail: string; evidence: string }[] = [
  {
    status: 'ok',
    title: 'Card-testing IP 94.72.160.10 — still blocked',
    detail: 'The Cloudflare zone-level Access Rule put in place during the 2026-05-25 incident is still in the access_rules list. Mode = block, target = ip, value = 94.72.160.10, created 2026-05-25, notes "Checkout fraud". No drift.',
    evidence: 'GET /zones/.../firewall/access_rules/rules → block ip 94.72.160.10 (1 of 25 entries).',
  },
  {
    status: 'ok',
    title: 'payment-information rate limit — still active',
    detail: 'The rate-limit rule that was repaired on 2026-05-25 (broadened from /rest/V1/guest-carts/... to any payment-information path) is enabled. 20 requests / 60s per IP+colo, managed_challenge action, mitigation timeout 0s. Last updated 2026-05-26 16:56 UTC — no later edits.',
    evidence: 'GET /rulesets/.../ratelimit → expression: http.host eq "medmartonline.com" and http.request.method eq "POST" and http.request.uri.path contains "payment-information".',
  },
  {
    status: 'ok',
    title: 'Hand-built bot/geo controls — unchanged from the 2026-05-26 review',
    detail: 'All 10 custom firewall rules from the Cloudflare review are still present in the same order with the same actions: block /custom/query, block /auctane, skip Mediapartners-Google, block Chinese cloud + scraper ASNs, managed-challenge for ~30 countries, managed-challenge for everything outside US/CA, vulnerability-scanner probe blocks. The "Block explicit IP list" and "Allow known bots" rules are still disabled (same as last review). No new rules added, no rules removed.',
    evidence: 'GET /rulesets/.../http_request_firewall_custom → same 10 rules, same expressions.',
  },
  {
    status: 'warn',
    title: 'Super Bot Fight Mode — still permissive',
    detail: 'No change since the Cloudflare review (Finding F2). Definitely-automated = allow, verified-bots = allow, static-resource protection = off. AI-bot and crawler protection both still disabled. The "did SBFM block any bots in the last 48h" question is moot — the lever is set to allow, so SBFM is not blocking anything.',
    evidence: 'GET /zones/.../bot_management → sbfm_definitely_automated="allow", sbfm_verified_bots="allow", ai_bots_protection="disabled", crawler_protection="disabled".',
  },
]

const gapItems: { title: string; detail: string }[] = [
  {
    title: 'Did 94.72.160.10 (or a sibling IP) try again in the last 48h?',
    detail: 'Needs firewallEventsAdaptive in the GraphQL Analytics dataset — token returns "does not have permission \'com.cloudflare.api.account.zone.analytics.read\'". Cloudflare dashboard → Security → Events will show this immediately for any rule action (block, managed_challenge, rate-limit).',
  },
  {
    title: 'Did the payment-information rate limit fire?',
    detail: 'Same gap. The 20/60s managed_challenge is a silent guardrail; without analytics there is no way from the API to count how often it triggered or which IPs hit it.',
  },
  {
    title: 'Bot-score distribution of incoming traffic',
    detail: 'httpRequestsAdaptiveGroups grouped by botScoreSrcName would split the last 48h into verified bot / likely automated / likely human. Same scope blocker.',
  },
  {
    title: 'Geo / ASN of attempts',
    detail: 'The "outside US/CA" managed-challenge is the heaviest control on the zone. Without analytics we cannot show what share of requests it caught or which ASNs lead.',
  },
]

const nextItems: { tier: string; tone: Status; items: { title: string; detail: string }[] }[] = [
  {
    tier: 'Fastest answer',
    tone: 'ok',
    items: [
      {
        title: 'Open Cloudflare → Security → Events, filter ip.src = 94.72.160.10',
        detail: 'A 60-second visual check that tells you whether the IP made any attempt in the last 48h and what action fired (the standing access rule should show block events if it did).',
      },
      {
        title: 'Same view, filter rule = "payment-information card-testing throttle"',
        detail: 'Confirms whether the rate limit fired at all in the window, and from which IPs.',
      },
    ],
  },
  {
    tier: 'Permanent fix',
    tone: 'warn',
    items: [
      {
        title: 'Add Zone · Analytics · Read to the existing token',
        detail: 'Edit the token (secret stays the same). Once added, this report can be regenerated automatically with real numbers — bot scores, country breakdown, firewall event counts, top IPs — instead of API-readable config only.',
      },
      {
        title: 'Engage Super Bot Fight Mode',
        detail: 'Set definitely-automated to Block or Managed Challenge; turn on static-resource protection. Still the largest unaddressed bot-defense lever (carried over from F2 of the Cloudflare review).',
      },
    ],
  },
]

function readHash(): TabId {
  if (typeof window === 'undefined') return 'summary'
  const raw = window.location.hash.replace('#', '')
  return validTabs.includes(raw as TabId) ? (raw as TabId) : 'summary'
}

export default function MedmartTestBotsFollowup() {
  const [tab, setTab] = useState<TabId>(() => readHash())

  useEffect(() => {
    const desired = `#${tab}`
    if (window.location.hash !== desired) window.history.replaceState(null, '', desired)
  }, [tab])

  useEffect(() => {
    const onHashChange = () => setTab(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'summary',  label: 'Summary' },
    { id: 'verified', label: `Verified (${verified.length})` },
    { id: 'gap',      label: 'Data Gap' },
    { id: 'next',     label: 'Next' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">Bot Activity — 48h Follow-up</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">{REPORT_DATE}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Bot Activity &mdash; 48-hour Follow-up</h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            Follow-up to the 2026-05-25 card-testing incident: are the Cloudflare defenses still in place, and did
            the bot (or a sibling IP) make any attempts against medmartonline.com in the last 48 hours?
            Queried 2026-05-28 20:28 UTC. No settings were changed.
          </p>
        </div>

        <div className="mb-8 bg-blue-500/[0.06] border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <div className="text-sm text-muted leading-relaxed">
              <span className="text-blue-400 font-semibold">Scope note.</span> Same data-access constraint as the
              Cloudflare review &mdash; the audit token can read <strong className="text-ink">configuration</strong>
              (rules, rate limits, bot settings, access rules) but cannot read <strong className="text-ink">traffic</strong>
              (request counts, firewall events, bot scores). Adding{' '}
              <code className="text-ink bg-black/30 px-1 rounded">Zone &middot; Analytics &middot; Read</code>{' '}
              to the token unlocks the &ldquo;did anyone try&rdquo; numbers; until then the dashboard&apos;s
              Security &rarr; Events view answers it in one click.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statCards.map(c => (
            <div key={c.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className={`text-2xl font-bold font-mono mb-1 ${c.color}`}>{c.value}</div>
              <div className="text-xs font-medium text-ink mb-0.5">{c.label}</div>
              <div className="text-xs text-muted leading-snug">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 border-b border-border-subtle overflow-x-auto">
          {tabs.map(t => (
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

        {tab === 'summary' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Bottom line</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Every defensive control put in place during the 2026-05-25 card-testing incident is{' '}
                <strong className="text-emerald-400">still in place</strong> and{' '}
                <strong className="text-emerald-400">unchanged</strong> on the API as of {QUERIED_AT_UTC} &mdash;
                the 94.72.160.10 IP block, the payment-information rate limit, and the broader bot/geo rule set
                from the 2026-05-26 Cloudflare review. No drift, no manual disables, no new rules around them.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                What this report <em>cannot</em> say is whether the bot actually came back in the last 48 hours,
                because Cloudflare&apos;s traffic and firewall-event data sit behind the Analytics API and the
                audit token is still configuration-only. The dashboard&apos;s Security &rarr; Events view
                answers that in a single filter; the same answer becomes API-readable as soon as Zone &middot;
                Analytics &middot; Read is added to the token.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Confirmed via API</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    '94.72.160.10 block still active (zone access_rules)',
                    'payment-information rate limit still active (20/60s, managed_challenge)',
                    'Outside-US/CA managed challenge still in place',
                    'Chinese cloud + scraper ASN blocks unchanged',
                    'Vulnerability-scanner probe blocks unchanged',
                    'Allowlist unchanged (25 entries)',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
              <section className="bg-orange-500/[0.05] border border-orange-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">Cannot answer from API</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    'Whether 94.72.160.10 attempted again in 48h',
                    'How often the payment-information rate limit fired',
                    'Bot score distribution of incoming traffic',
                    'Geo / ASN of attempts that hit the edge',
                    'SBFM still permissive — no bot-block events to count',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-orange-400 mt-0.5 shrink-0">&times;</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {tab === 'verified' && (
          <div className="space-y-4">
            {verified.map((v, i) => (
              <section key={i} className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[v.status]}`}>{statusLabel[v.status]}</span>
                  <h2 className="text-base font-semibold text-ink">{v.title}</h2>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-3">{v.detail}</p>
                <div className="bg-black/20 border border-border-subtle/60 rounded p-3">
                  <div className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">Evidence</div>
                  <code className="text-[11px] text-muted/90 font-mono break-all leading-relaxed">{v.evidence}</code>
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'gap' && (
          <div className="space-y-6">
            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-2">What the token returns when asked for traffic</h2>
              <code className="block text-[11px] text-red-400/90 font-mono bg-black/30 border border-border-subtle/60 rounded p-3 break-all">
                does not have permission &apos;com.cloudflare.api.account.zone.analytics.read&apos; for zone 1fc1d16f8d6a46d49c25d5352a2ea2ff
              </code>
              <p className="text-sm text-muted leading-relaxed mt-3">
                Same gap as flagged in the 2026-05-26 Cloudflare review. The token works for everything
                else &mdash; rulesets, access rules, bot management settings, DNS &mdash; but the
                GraphQL Analytics dataset (httpRequests*, firewallEvents*) is gated by a separate scope.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Questions that need that scope to answer</h2>
              <ul className="space-y-3 text-sm text-muted">
                {gapItems.map((g, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <div className="text-ink font-medium">{g.title}</div>
                      <div className="text-xs text-muted/90 mt-0.5 leading-relaxed">{g.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === 'next' && (
          <div className="space-y-5">
            <p className="text-xs text-muted leading-relaxed px-1">
              Two paths: a 60-second dashboard check that answers the original question today, and a
              token edit that makes this report reproducible by API.
            </p>
            {nextItems.map((tier, i) => (
              <section key={i} className={`border rounded-xl p-6 ${statusColors[tier.tone].replace('text-', 'border-').split(' ')[0]} ${tier.tone === 'warn' ? 'bg-orange-500/[0.04]' : 'bg-emerald-500/[0.04]'}`}>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[tier.tone]}`}>{tier.tier}</span>
                </h2>
                <div className="space-y-3">
                  {tier.items.map((it, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-gold" />
                      <div>
                        <div className="text-sm text-ink font-medium">{it.title}</div>
                        <div className="text-xs text-muted mt-0.5 leading-relaxed">{it.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-border-subtle text-xs text-muted">
          Prepared by Ryan Patt &middot; Read-only follow-up to the 2026-05-25 incident &middot; No settings changed &middot; Queried {QUERIED_AT_UTC}.
        </footer>

      </div>
    </div>
  )
}
