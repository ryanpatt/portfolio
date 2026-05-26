import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── types ─────────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'topology' | 'controls' | 'findings' | 'recommendations' | 'traffic'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'info'
type Action = 'block' | 'challenge' | 'allow' | 'rewrite' | 'redirect'

const riskColors: Record<RiskLevel, string> = {
  low:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
  info:     'bg-blue-500/15 text-blue-400 border-blue-500/25',
}
const riskLabel: Record<RiskLevel, string> = {
  low: 'Low', medium: 'Moderate', high: 'High', critical: 'Critical', info: 'Info',
}
const actionColors: Record<Action, string> = {
  block:     'bg-red-500/15 text-red-400 border-red-500/25',
  challenge: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  allow:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rewrite:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  redirect:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
}

/* ─── data (read-only snapshot pulled 2026-05-26 via account API token) ───── */

const REVIEW_DATE = '2026-05-26'

const statCards: { label: string; value: string; sub: string; color: string }[] = [
  { label: 'Zones reviewed',     value: '3',  sub: 'medmart.com · medmartonline.com (Pro) · medmarthome.com', color: 'text-ink' },
  { label: 'Critical findings',  value: '1',  sub: 'Managed WAF available but not deployed', color: 'text-red-400' },
  { label: 'Attack-surface issues', value: '52', sub: '1 Critical · 43 Moderate · 8 Low', color: 'text-orange-400' },
  { label: 'Active edge rules',  value: '10', sub: 'custom firewall + 2 rate limits on the store', color: 'text-gold' },
]

const zones: { name: string; plan: string; role: string; proxied: string[]; dnsOnly: string }[] = [
  {
    name: 'medmartonline.com', plan: 'Pro', role: 'Primary storefront',
    proxied: ['medmartonline.com (apex) → Fastly → Magento Cloud', 'blog.', 'speed.', 'mcstaging.'],
    dnsOnly: 'www.medmartonline.com points straight to Fastly (grey-cloud), plus all mail / SendGrid / Microsoft / Landingi records.',
  },
  {
    name: 'medmart.com', plan: 'Free', role: 'Redirect to store',
    proxied: ['medmart.com (apex) → redirects to medmartonline.com', 'www.medmart.com'],
    dnsOnly: 'All mail / SendGrid / Lync / Klaviyo / Zendesk records.',
  },
  {
    name: 'medmarthome.com', plan: 'Free', role: 'Parked',
    proxied: ['— nothing proxied —'],
    dnsOnly: 'Entirely DNS-only (apex on Cloudflare IP, www on a third-party host). No traffic flows through the edge.',
  },
]

const customRules: { action: Action; name: string; expr: string }[] = [
  { action: 'block',     name: 'Block "/custom/query"', expr: 'http.request.full_uri contains "/custom/query"' },
  { action: 'block',     name: 'Block "/auctane"', expr: 'http.request.uri.path contains "/auctane"' },
  { action: 'allow',     name: 'Skip — Mediapartners-Google', expr: 'http.user_agent contains "Google"' },
  { action: 'allow',     name: 'Skip — verified / known bots', expr: 'cf.client.bot' },
  { action: 'block',     name: 'Block Chinese cloud ASNs', expr: 'ip.geoip.asnum in {132203 45102 45899 139341} and not cf.client.bot' },
  { action: 'challenge', name: 'Managed Challenge — country list (CN, IN, RU, BR, …)', expr: 'ip.geoip.country in { ~30 countries }' },
  { action: 'challenge', name: 'Managed Challenge — everything outside US / CA', expr: 'not ip.geoip.country in {"CA" "US"} and not cf.client.bot and http.host ne "mcstaging.medmartonline.com"' },
  { action: 'block',     name: 'Block explicit IP list (~20 IPs, mostly LATAM)', expr: 'ip.src in { 162.0.234.190 38.253.95.81 45.189.236.16 … }' },
  { action: 'block',     name: 'Block vulnerability-scanner probes', expr: 'uri.path contains "/wp-login" | "/wp-admin" | "/wp-config" | …' },
  { action: 'block',     name: 'Block scraper ASNs', expr: 'ip.src.asnum in {132203 45102 212238 136907 203020} and not cf.client.bot' },
]

const rateLimits: { action: Action; name: string; rule: string; limit: string }[] = [
  { action: 'challenge', name: 'Card-testing throttle', rule: 'POST to /…payment-information on medmartonline.com', limit: '20 req / 60s per IP + colo · managed challenge · no persistence (timeout 0)' },
  { action: 'block',     name: 'Cart rate limiter', rule: 'path contains /checkout/cart', limit: '20 req / 10s per IP + colo · block · 10s timeout' },
]

const findings: { id: string; risk: RiskLevel; title: string; detail: string; evidence: string }[] = [
  {
    id: 'F1', risk: 'critical', title: 'Managed WAF rulesets are available but not deployed (store)',
    detail: 'On medmartonline.com the OWASP Core, Cloudflare Managed, and Exposed-Credentials rulesets exist on the plan but are not actually executed — there is no zone entrypoint in the http_request_firewall_managed phase (all four show kind="managed", none kind="zone"). Cloudflare\'s own Attack Surface Report independently flags this as the single Critical issue (waf_not_enabled). Active protection today is only the custom firewall rules, the two rate limits, always-on L7 DDoS, and normalization.',
    evidence: 'GET /rulesets → managed phase has only kind=managed; /rulesets/phases/http_request_firewall_managed/entrypoint → "could not find entrypoint ruleset"; ASR issue medmartonline.com · waf_not_enabled · Critical.',
  },
  {
    id: 'F2', risk: 'high', title: 'Super Bot Fight Mode is permissive — bots are allowed',
    detail: 'SBFM on the store is set to allow "definitely automated" and "verified bots", with static-resource protection off. In practice the automated-bot lever is not engaged, so the "dead / unwanted bot" mitigation relies entirely on the hand-built ASN and IP block lists, which an attacker rotates around. Bot Fight Mode is also off on both Free zones.',
    evidence: 'GET /bot_management → sbfm_definitely_automated=allow, sbfm_verified_bots=allow, sbfm_static_resource_protection=false. ASR: standard_super_bot_fight_mode (Moderate).',
  },
  {
    id: 'F3', risk: 'medium', title: 'SSL mode is "Full", not "Full (Strict)"',
    detail: 'All three zones use SSL mode Full, which encrypts edge→origin but does not validate the origin certificate. Since the origin (Fastly) presents a valid certificate, this can safely be Full (Strict) to close a MITM gap between Cloudflare and origin.',
    evidence: 'GET /settings → ssl=full on all zones.',
  },
  {
    id: 'F4', risk: 'medium', title: 'HSTS disabled everywhere; weak TLS floor on Free zones',
    detail: 'HSTS is off on all zones (max-age 0). medmart.com and medmarthome.com still allow TLS 1.0/1.1 (min_tls_version 1.0), and medmart.com has Always Use HTTPS off. The store is healthier (TLS 1.2, Always HTTPS on). The ASR raises 11 hsts_not_enabled and 11 always_https_not_enabled items across enterprise-enrollment / -registration / app / m1 / msoid / t subdomains.',
    evidence: 'GET /settings → security_header.max_age=0 (all); min_tls_version=1.0 (medmart.com, medmarthome.com). ASR: 22 insecure_configuration items.',
  },
  {
    id: 'F5', risk: 'medium', title: 'Three admin accounts without MFA',
    detail: 'Cloudflare\'s Attack Surface Report flags three account members with multi-factor authentication not enabled. For an account that controls DNS and edge security for the storefront, every admin should have MFA enforced.',
    evidence: 'ASR weak_authentication × 3: d•••••s@medmartonline.com, f•••••l@medmart.com, i•••••l@coredevelop.com.',
  },
  {
    id: 'F6', risk: 'low', title: 'Redundant / stale rules and allowlist hygiene',
    detail: 'The "country list" managed-challenge rule is a strict subset of the broader "everything outside US/CA" rule, so it is redundant. The card-testing IP 94.72.160.10 is blocked twice (two identical entries). Roughly half of the ~17–24 IP allowlist entries have no note — allowlisting bypasses security checks, so undocumented/stale entries are a quiet risk that should be dated and reviewed.',
    evidence: 'Custom firewall rules #6 vs #7 overlap; access_rules contains duplicate 94.72.160.10 blocks and multiple un-noted whitelist IPs.',
  },
  {
    id: 'F7', risk: 'low', title: 'Email-auth and miscellaneous suggestions',
    detail: 'ASR also raises an SPF issue on an odd host "medmart.com.bk.medmart.com" (×2 — looks like a leftover/misconfigured record worth deleting), a missing DMARC on medmarthome.com, no security.txt on any zone, and Turnstile not enabled. AI-bot blocking/challenge is also unset (no_block_ai_bots / no_challenge_ai_bots) — relevant if scraping is a concern.',
    evidence: 'ASR: email_security × 3, configuration_suggestion × 13 (security_txt_not_enabled, no_turnstile_enabled, manage_bot_fight_mode, no_block_ai_bots, no_challenge_ai_bots).',
  },
]

const recommendations: { tier: string; tone: RiskLevel; items: { title: string; detail: string }[] }[] = [
  {
    tier: 'Do now', tone: 'critical',
    items: [
      { title: 'Deploy the managed WAF on medmartonline.com', detail: 'Enable the Cloudflare Managed Ruleset + OWASP Core (it is already included in the Pro plan). Start in Log to confirm no false positives against the Magento/Fastly storefront, then move to Block. This closes the lone Critical finding.' },
      { title: 'Engage Super Bot Fight Mode', detail: 'Set "definitely automated" to Block (or Managed Challenge) and turn on static-resource protection. This is the actual lever for the "dead / unwanted bots" question — today it is set to allow.' },
    ],
  },
  {
    tier: 'This week', tone: 'high',
    items: [
      { title: 'Add Zone · Analytics · Read to the API token', detail: 'The original ask — volume of bots and non-US/CA traffic — needs the GraphQL Analytics dataset, which the current token cannot read. Editing the token\'s permissions keeps the same secret; once added, the traffic/geo/bot-volume numbers can be appended to the Traffic tab.' },
      { title: 'SSL → Full (Strict) and enable HSTS', detail: 'Origin (Fastly) has a valid cert, so Full (Strict) is safe and closes the edge→origin MITM gap. Enable HSTS (consider a short max-age first, then ramp) across the proxied zones.' },
      { title: 'Raise TLS floor to 1.2 on medmart.com & medmarthome.com', detail: 'Both still accept TLS 1.0/1.1. Set min TLS 1.2 and turn on Always Use HTTPS on medmart.com.' },
    ],
  },
  {
    tier: 'Housekeeping', tone: 'medium',
    items: [
      { title: 'Enforce MFA on the 3 flagged admin accounts', detail: 'Account controls DNS + edge security for the store; MFA should be mandatory for every member.' },
      { title: 'Prune redundant / stale rules', detail: 'Remove the country-list challenge rule (covered by the not-US/CA rule), dedupe the double 94.72.160.10 block, and date/review the un-noted allowlist IPs.' },
      { title: 'Email-auth & extras', detail: 'Delete or fix the "medmart.com.bk.medmart.com" SPF record, add DMARC on medmarthome.com, publish security.txt, and consider Turnstile + AI-bot challenge if scraping is a concern.' },
    ],
  },
]

/* ─── page ───────────────────────────────────────────────────────────────── */

const validTabs: TabId[] = ['overview', 'topology', 'controls', 'findings', 'recommendations', 'traffic']
const findingIds = findings.map(f => f.id)

function readHash(): { tab: TabId; scrollTo: string | null } {
  if (typeof window === 'undefined') return { tab: 'overview', scrollTo: null }
  const raw = window.location.hash.replace('#', '')
  if (validTabs.includes(raw as TabId)) return { tab: raw as TabId, scrollTo: null }
  if (findingIds.includes(raw)) return { tab: 'findings', scrollTo: raw }
  return { tab: 'overview', scrollTo: null }
}

export default function MedmartCloudflareReview() {
  const [tab, setTab] = useState<TabId>(() => readHash().tab)

  useEffect(() => {
    const desired = `#${tab}`
    if (tab === 'findings' && findingIds.includes(window.location.hash.replace('#', ''))) return
    if (window.location.hash !== desired) window.history.replaceState(null, '', desired)
  }, [tab])

  useEffect(() => {
    const onHashChange = () => {
      const { tab: next, scrollTo } = readHash()
      setTab(next)
      if (scrollTo) setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const { scrollTo } = readHash()
    if (scrollTo) setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',        label: 'Overview' },
    { id: 'topology',        label: 'Topology' },
    { id: 'controls',        label: 'Bot & Geo Controls' },
    { id: 'findings',        label: `Findings (${findings.length})` },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'traffic',         label: 'Traffic Data' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">Cloudflare Security Review</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">{REVIEW_DATE}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Cloudflare Security &amp; Edge Review</h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            A read-only posture review of the three MedMart Cloudflare zones — proxy topology, bot &amp; geo controls,
            WAF/rate-limit configuration, and the account&apos;s Attack Surface Report. No settings were changed.
          </p>
        </div>

        {/* Scope / data-access banner */}
        <div className="mb-8 bg-blue-500/[0.06] border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <div className="text-sm text-muted leading-relaxed">
              <span className="text-blue-400 font-semibold">Scope note.</span> This is a <strong className="text-ink">configuration</strong> review.
              The original request — <em>volume of dead/unwanted bots and traffic outside US/CA</em> — needs Cloudflare&apos;s
              Analytics dataset, and the audit token currently lacks <code className="text-ink bg-black/30 px-1 rounded">Zone · Analytics · Read</code>.
              Everything here comes from readable config (DNS, firewall, rulesets, bot, settings, Security Center).
              See the <button onClick={() => setTab('traffic')} className="text-blue-400 underline hover:text-blue-300">Traffic Data</button> tab for what unlocks once that one read scope is added.
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statCards.map(c => (
            <div key={c.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className={`text-2xl font-bold font-mono mb-1 ${c.color}`}>{c.value}</div>
              <div className="text-xs font-medium text-ink mb-0.5">{c.label}</div>
              <div className="text-xs text-muted leading-snug">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
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

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">In one paragraph</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                MedMart fronts three zones with Cloudflare. The storefront (<code className="text-ink">medmartonline.com</code>, Pro plan)
                is proxied at the apex and forwards to Fastly → Magento Cloud; <code className="text-ink">www</code> is DNS-only and bypasses
                Cloudflare entirely. The edge already does real work against unwanted traffic: a catch-all <strong className="text-ink">Managed
                Challenge for everything outside the US/CA</strong>, ASN blocks for Chinese cloud and scraper networks, vulnerability-scanner
                probe blocks, and two rate limits aimed at card-testing and cart abuse.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                The headline gap is that the <strong className="text-red-400">managed WAF rulesets are present on the plan but not actually
                deployed</strong>, and <strong className="text-orange-400">Super Bot Fight Mode is set to allow automated bots</strong> —
                so bot defense leans on hand-maintained block lists. Beyond that it&apos;s hardening: SSL is Full (not Strict), HSTS is off,
                two Free zones still allow TLS 1.0, three admins lack MFA, and there&apos;s some rule/allowlist cleanup to do.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <section className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Already in good shape</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    'Non-US/CA traffic is managed-challenged by default',
                    'Chinese cloud + scraper ASNs blocked',
                    'Vulnerability-scanner probe paths blocked',
                    'Card-testing + cart rate limits in place',
                    'Card-testing IP 94.72.160.10 blocked',
                    'OWASP / Managed rulesets available on the Pro plan',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5 shrink-0">✓</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
              <section className="bg-red-500/[0.05] border border-red-500/25 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Biggest gaps</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {[
                    'Managed WAF rulesets not deployed (Critical)',
                    'Super Bot Fight Mode allows automated bots',
                    'SSL is Full, not Full (Strict)',
                    'HSTS off; TLS 1.0 allowed on Free zones',
                    '3 admin accounts without MFA',
                    'Traffic analytics not readable by audit token',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-red-400 mt-0.5 shrink-0">✕</span><span>{t}</span></li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* TOPOLOGY */}
        {tab === 'topology' && (
          <div className="space-y-6">
            <section className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-blue-400 mb-2">Why this matters for the audit</h2>
              <p className="text-sm text-muted leading-relaxed">
                Cloudflare only sees — and only has analytics for — <strong className="text-ink">proxied (orange-cloud)</strong> records.
                The storefront apex <code className="text-ink">medmartonline.com</code> is proxied, so real shopping + bot traffic to the bare
                domain is visible. But <code className="text-ink">www.medmartonline.com</code> is DNS-only straight to Fastly, so a slice of
                storefront traffic never touches the edge. A complete bot/geo picture combines Cloudflare (apex) with Fastly logs (www).
              </p>
            </section>

            {zones.map(z => (
              <section key={z.name} className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h2 className="text-base font-semibold text-ink font-mono">{z.name}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${z.plan === 'Pro' ? riskColors.info : 'bg-white/5 text-muted border-border-subtle'}`}>{z.plan}</span>
                  <span className="text-xs text-muted">{z.role}</span>
                </div>
                <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">Proxied (Cloudflare sees this)</div>
                <ul className="space-y-1 mb-4">
                  {z.proxied.map((p, i) => (
                    <li key={i} className="text-xs text-ink font-mono flex items-start gap-2"><span className="text-emerald-400 shrink-0">●</span><span className="break-all">{p}</span></li>
                  ))}
                </ul>
                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">DNS-only (invisible to Cloudflare)</div>
                <p className="text-xs text-muted leading-relaxed">{z.dnsOnly}</p>
              </section>
            ))}
          </div>
        )}

        {/* CONTROLS */}
        {tab === 'controls' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Custom firewall rules — medmartonline.com</h2>
              <p className="text-xs text-muted mb-4">Evaluated in order. This is where the bot &amp; non-US/CA handling lives today.</p>
              <div className="space-y-2.5">
                {customRules.map((r, i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-muted w-5 text-right">{i + 1}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${actionColors[r.action]}`}>{r.action}</span>
                      <span className="text-sm text-ink">{r.name}</span>
                    </div>
                    <code className="block text-[11px] text-muted/90 font-mono break-all pl-7 leading-relaxed">{r.expr}</code>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-4">Rate limits — medmartonline.com</h2>
              <div className="space-y-3">
                {rateLimits.map((r, i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${actionColors[r.action]}`}>{r.action}</span>
                      <span className="text-sm text-ink font-medium">{r.name}</span>
                    </div>
                    <div className="text-xs text-muted font-mono mt-1">{r.rule}</div>
                    <div className="text-xs text-gold mt-1">{r.limit}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-2">Super Bot Fight Mode — currently permissive</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  ['Definitely automated', 'allow'],
                  ['Verified bots', 'allow'],
                  ['Static-resource protection', 'off'],
                ].map(([k, v], i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded p-3">
                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">{k}</div>
                    <div className="text-sm text-orange-400 font-mono">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-4 leading-relaxed">
                With "definitely automated" set to <span className="text-orange-400 font-mono">allow</span>, SBFM is not blocking bots —
                the unwanted-bot defense is effectively the hand-maintained ASN/IP block lists above. See finding F2.
              </p>
            </section>
          </div>
        )}

        {/* FINDINGS */}
        {tab === 'findings' && (
          <div className="space-y-4">
            {findings.map(f => (
              <section key={f.id} id={f.id} className="bg-white/[0.02] border border-border-subtle rounded-xl p-6 scroll-mt-20">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-mono text-muted">{f.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[f.risk]}`}>{riskLabel[f.risk]}</span>
                  <h2 className="text-base font-semibold text-ink">{f.title}</h2>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-3">{f.detail}</p>
                <div className="bg-black/20 border border-border-subtle/60 rounded p-3">
                  <div className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">Evidence</div>
                  <code className="text-[11px] text-muted/90 font-mono break-all leading-relaxed">{f.evidence}</code>
                </div>
              </section>
            ))}

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Attack Surface Report — 52 issues</h2>
              <p className="text-xs text-muted mb-4">Cloudflare Security Center, account-wide. Severity and type breakdown:</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[['Critical', '1', 'text-red-400'], ['Moderate', '43', 'text-orange-400'], ['Low', '8', 'text-yellow-400']].map(([k, v, c], i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded p-3 text-center">
                    <div className={`text-xl font-bold font-mono ${c}`}>{v}</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">{k}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ['insecure_configuration', 22, 'Always-HTTPS / HSTS off on enterprise-enrollment, -registration, app, m1, msoid, t subdomains'],
                  ['compliance_violation', 11, 'TLS not enabled on those same subdomains'],
                  ['configuration_suggestion', 13, 'WAF not enabled (Critical), bot-fight-mode, AI-bot block/challenge, security.txt, Turnstile'],
                  ['weak_authentication', 3, 'MFA not enabled on 3 admin accounts'],
                  ['email_security', 3, 'SPF on a stray "medmart.com.bk.medmart.com" host; DMARC on medmarthome.com'],
                ].map(([type, n, desc], i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border-subtle/40 py-2">
                    <span className="font-mono text-gold w-8 text-right shrink-0">{n}</span>
                    <span className="font-mono text-ink w-48 shrink-0">{type}</span>
                    <span className="text-muted leading-snug">{desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {tab === 'recommendations' && (
          <div className="space-y-5">
            <p className="text-xs text-muted leading-relaxed px-1">
              Prioritized and read-only — nothing below has been applied. Items are ordered by impact on the storefront&apos;s
              exposure to unwanted automated traffic.
            </p>
            {recommendations.map((tier, i) => (
              <section key={i} className={`border rounded-xl p-6 ${riskColors[tier.tone].replace('text-', 'border-').split(' ')[0]} ${tier.tone === 'critical' ? 'bg-red-500/[0.04]' : tier.tone === 'high' ? 'bg-orange-500/[0.04]' : 'bg-white/[0.02]'}`}>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[tier.tone]}`}>{tier.tier}</span>
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

        {/* TRAFFIC */}
        {tab === 'traffic' && (
          <div className="space-y-6">
            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-2">Why there are no traffic numbers here yet</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The original request was volume — how many dead/unwanted bots and how much non-US/CA traffic hit the domains.
                That comes from Cloudflare&apos;s GraphQL Analytics API, and the audit token returns:
              </p>
              <code className="block text-[11px] text-red-400/90 font-mono bg-black/30 border border-border-subtle/60 rounded p-3 break-all">
                does not have permission &apos;com.cloudflare.api.account.zone.analytics.read&apos; for zone …
              </code>
              <p className="text-sm text-muted leading-relaxed mt-3">
                Adding <strong className="text-ink">Zone · Analytics · Read</strong> to the existing token (an edit — the secret stays the
                same) unlocks the numbers below. No other change is needed.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">What gets produced once the scope is added</h2>
              <ul className="space-y-2.5 text-sm text-muted">
                {[
                  ['Geo breakdown', 'Requests by country with the non-US/CA share called out — and how much of it the "outside US/CA" rule is already challenging.'],
                  ['Bot volume', 'Verified vs automated vs likely-automated traffic, and the volume hitting the ASN/IP block lists.'],
                  ['Firewall events', 'Counts by action (managed-challenge, block, rate-limit) broken down by country, ASN, and host.'],
                  ['Top talkers', 'Heaviest user-agents, ASNs, and request paths — to spot scrapers and credential-stuffing patterns.'],
                  ['Edge status mix', '2xx/3xx/4xx/5xx split to separate real shoppers from probe noise.'],
                ].map(([k, v], i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/15 text-gold text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <span><strong className="text-ink">{k}.</strong> {v}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted/80 leading-relaxed mt-4 pt-4 border-t border-border-subtle/60">
                Caveat: Cloudflare analytics only cover proxied hostnames (the apexes). Traffic to <code className="text-ink">www.medmartonline.com</code>,
                which is DNS-only to Fastly, would need Fastly&apos;s own logs/stats to complete the picture.
              </p>
            </section>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-border-subtle text-xs text-muted">
          Prepared by Ryan Patt · Read-only Cloudflare configuration review · No settings changed · Snapshot {REVIEW_DATE}.
        </footer>

      </div>
    </div>
  )
}
