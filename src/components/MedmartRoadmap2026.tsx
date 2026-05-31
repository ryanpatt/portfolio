import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

/*  medmartonline.com Conversion & Design Overhaul — 2026 Roadmap  (route: /medmart/roadmap2026)
    Interactive, self-contained. Progress (todo/doing/done) persists to localStorage —
    no backend. Scope: medmartonline.com only. Audit method: heuristic + Playwright
    funnel capture (prod → payment), desktop + mobile, 2026-05-30.  */

const REPORT_DATE = '2026-05-30'
const STORAGE_KEY = 'medmart-roadmap2026-v1'

type Status = 'todo' | 'doing' | 'done'
const ORDER: Status[] = ['todo', 'doing', 'done']

const STATUS_UI: Record<Status, { label: string; cls: string; dot: string }> = {
  todo:  { label: 'To do',       cls: 'bg-white/5 text-muted border-border-subtle',          dot: 'bg-muted' },
  doing: { label: 'In progress', cls: 'bg-gold/15 text-gold-light border-gold/30',           dot: 'bg-gold' },
  done:  { label: 'Done',        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
}

/* ----------------------------- progress store ----------------------------- */

function useProgress() {
  const [map, setMap] = useState<Record<string, Status>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch { /* ignore quota */ }
  }, [map])
  const statusOf = useCallback((id: string): Status => map[id] || 'todo', [map])
  const cycle = useCallback((id: string) => {
    setMap(m => {
      const cur = m[id] || 'todo'
      return { ...m, [id]: ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length] }
    })
  }, [])
  const reset = useCallback(() => setMap({}), [])
  return { statusOf, cycle, reset, map }
}

/* --------------------------------- data ---------------------------------- */

type Item = { id: string; title: string; detail: string; metric?: string; effort?: string; lift?: string }

const P0S: Item[] = [
  {
    id: 'p0-atc',
    title: 'Email popup can cover the Add-to-Cart button — verify the real impact',
    detail: 'Confirmed in testing: a Klaviyo email popup renders on top of the product buy box (39 overlay nodes sat over the Add-to-Cart button). The backend is healthy — a native form submit adds the item (302, cart populates). What is NOT yet confirmed: whether real users — especially on mobile, or before they dismiss the popup — are blocked from clicking the button. Earlier automated "dead button" results were the popup intercepting the click, not a proven code bug. Action: a 2-minute human test on prod (does cart/add fire after dismissing the popup?). Recommended fix is to retire the blocking popup entirely and capture email the non-intrusive way — an always-on footer signup plus a checkout opt-in (both shown in the live demo) — so the Add-to-Cart is never covered, especially on mobile.',
    metric: 'ATC → cart success rate · popup bounce', effort: '½ day to verify', lift: 'Protects the primary CTA',
  },
  {
    id: 'p0-pay',
    title: 'Payment-step decline risk from over-tight Authorize.net FDS',
    detail: 'Post-fraud tightening (incident 2026-05-26, E00027 on the $0 validation auth) may be declining legitimate buyers at the final step. Pull the Authnet approval rate; relax AVS/FDS if legit declines are confirmed.',
    metric: 'Payment approval %', effort: '1 day to pull data', lift: 'Recovers silent lost orders',
  },
]

type Surface = {
  id: string; name: string; shot: string; shotAlt: string
  good: string[]; bad: string[]
}

const CONSUMER_SURFACES: Surface[] = [
  {
    id: 'c-home', name: 'Home', shot: 'consumer-home.jpg', shotAlt: 'medmartonline.com home page',
    good: ['Strong trust base: "Family Business Since 1992", BBB-accredited, Trustpilot "Excellent"', 'Best-seller carousel present'],
    bad: ['"Directly from our customers" testimonial block renders 3× stacked (desktop + mobile) — looks broken', 'No audience routing above the fold (caregiver / patient / business all land the same)', 'Dated Luma visual system; weak hierarchy; staff-photo hero instead of product/outcome'],
  },
  {
    id: 'c-cat', name: 'Category', shot: 'consumer-category.jpg', shotAlt: 'medmartonline.com category page',
    good: ['Filters present', 'Deep catalog'],
    bad: ['List view (not grid); heavy bottom-of-page SEO copy', 'No review stars, "ships free", or financing cues on cards', 'No "talk to an expert" hook for high-consideration buys'],
  },
  {
    id: 'c-pdp', name: 'PDP ($3,599 bed)', shot: 'consumer-pdp.jpg', shotAlt: 'medmartonline.com product page',
    good: ['Expert Chat / Call / Email block', 'Financing (Affirm / HSA / TrueMed)', '"Frequently Bought Together", 22 images'],
    bad: ['NO reviews / no social proof on a $3,599 product', 'NO stock / availability / delivery estimate', 'Warranty, returns, price-match buried in tabs instead of by the buy box', 'Competing CTAs (Add to Cart vs Buy Now)'],
  },
  {
    id: 'c-reg', name: 'Register', shot: 'consumer-register.jpg', shotAlt: 'medmartonline.com create-account page',
    good: ['Guest checkout allowed (no forced login)'],
    bad: ['Lists NO benefits of creating an account (faster checkout, tracking, financing, reorder, tax-exempt)', 'No social login', '"Allow remote shopping assistance" exposed by default — confusing'],
  },
]

type Phase = { id: string; window: string; theme: string; tone: string; blurb: string; items: Item[] }

const ROADMAP: Phase[] = [
  {
    id: 'd30', window: '0–30 days', theme: 'Stop the bleeding + instrument', tone: 'rose',
    blurb: 'Low-risk foundation: recover silent losses and get clean measurement before optimizing anything.',
    items: [
      { id: 'r-atc', title: 'Replace the blocking email popup with non-blocking capture', detail: 'Retire the Klaviyo popup that can cover the Add-to-Cart button. Collect email the non-intrusive way instead — an always-on footer signup (“10% off your first order”) and a one-tap checkout opt-in (both shown in the live demo). Verify the CTA is never obscured, especially on mobile.', metric: 'ATC success rate · email capture rate', effort: 'S', lift: 'Protects CTA + grows list' },
      { id: 'r-pay', title: 'Pull Authnet approval rate; relax FDS if needed', detail: 'Confirm whether legit buyers are being declined post-fraud; loosen AVS/FDS accordingly.', metric: 'Approval %', effort: 'S', lift: 'Step-function' },
      { id: 'r-clarity', title: 'Install Microsoft Clarity (free) + verify GA4/GTM events', detail: 'Heatmaps + session replay to see WHY users leave; confirm ecommerce events fire end-to-end. Unblocks all measurement.', metric: 'Instrumentation', effort: 'S', lift: 'Enabler' },
      { id: 'r-testi', title: 'Fix the triple-rendered testimonials + dead scroll', detail: 'Remove the duplicated "Directly from our customers" blocks on home.', metric: 'Bounce / scroll depth', effort: 'S', lift: 'Polish' },
      { id: 'r-pdp-quick', title: 'PDP quick wins: stock/delivery + trust by the buy box; pull reviews onto PDP', detail: 'Surface availability, delivery estimate, warranty/returns next to the CTA; expose review content.', metric: 'PDP → cart', effort: 'M', lift: '[est] 5–15%' },
    ],
  },
  {
    id: 'd60', window: '31–60 days', theme: 'Trust & PDP conversion', tone: 'gold',
    blurb: 'Attack the high-AOV durable-equipment funnel where trust gaps cost the most.',
    items: [
      { id: 'r-reviews', title: 'Roll review/social-proof system across PDPs + category cards', detail: 'Stars + counts on cards, full reviews on PDP, verified-buyer badges.', metric: 'PDP → cart', effort: 'M', lift: '[est] +8–18%' },
      { id: 'r-delivery', title: 'Add delivery-estimate + white-glove messaging', detail: 'On PDPs and checkout — decisive for big equipment.', metric: 'Cart → purchase', effort: 'M', lift: '[est] +3–8%' },
      { id: 'r-co-rail', title: 'Checkout reassurance rail', detail: 'Financing/HSA reminder, security, returns, progress steps.', metric: 'Checkout completion', effort: 'M', lift: '[est] +3–7%' },
      { id: 'r-account', title: 'Account value-prop redesign + reduce register friction', detail: 'Sell the benefits; add reorder + order tracking; trim confusing options.', metric: 'Account creation', effort: 'M', lift: '[est] +5–10%' },
      { id: 'r-merch', title: 'Merchandising signals: Overall Pick + Best Seller badges, “most popular” sort', detail: 'Surface social proof at the moment of choice on category cards and PDPs (shown in the live demo).', metric: 'Category → PDP CTR', effort: 'S', lift: '[est] +3–6%' },
    ],
  },
  {
    id: 'd90', window: '61–90 days', theme: 'Funnel split + design refresh', tone: 'sky',
    blurb: 'Give business buyers their own journey on medmartonline.com and modernize the consumer storefront.',
    items: [
      { id: 'r-ds', title: 'Modernize the storefront design system', detail: 'Refresh home / category / PDP off the dated Luma theme — cleaner hierarchy, trust-forward, mobile-first. Incremental, not a rebuild.', metric: 'Blended CVR', effort: 'L', lift: '[est] +10–20%' },
      { id: 'r-b2b', title: 'Stand up a dedicated business endpoint (medmartonline.com/business)', detail: 'A separate B2B path on the same domain: quote-to-order, company accounts, Net-30, tax-exempt, PO upload — out of the consumer checkout.', metric: 'B2B lead → quote → order', effort: 'L', lift: 'Lead quality' },
      { id: 'r-routing', title: 'Audience routing on entry (caregiver / patient / business)', detail: 'Route intent from the hero instead of one generic funnel.', metric: 'Engagement / CVR by segment', effort: 'M', lift: '[est] +5–12%' },
      { id: 'r-finder', title: 'Guided product finder (top categories → 2 questions → recommendation)', detail: 'A simple quiz that routes undecided shoppers to the right product; opens from header, home and category. Built in the live demo.', metric: 'Finder → PDP → cart', effort: 'M', lift: '[est] +5–10% assisted' },
      { id: 'r-email1', title: 'Email overhaul phase 1 — transactional', detail: 'Order, shipping, delivery, review-request, account-created. High open rates = prime real estate.', metric: 'Email-driven repeat rate', effort: 'M', lift: 'Retention' },
    ],
  },
  {
    id: 'd120', window: '91–120 days', theme: 'Retention, lifecycle & optimization', tone: 'emerald',
    blurb: 'Compounding gains: lifecycle flows, personalization, and a permanent testing loop.',
    items: [
      { id: 'r-flows', title: 'Lifecycle email + SMS flows in Klaviyo', detail: 'Abandoned cart, browse-abandon, post-purchase, win-back, B2B nurture.', metric: 'Revenue/visitor, repeat rate', effort: 'L', lift: '[est] +8–15%' },
      { id: 'r-perso', title: 'Personalization & merchandising', detail: 'Best-seller/bundle logic, financing-forward messaging.', metric: 'AOV, attach rate', effort: 'M', lift: '[est] +3–8%' },
      { id: 'r-capture', title: 'PDP “Not ready to buy?” offer — capture the objection + 10% off', detail: 'On every product page, a no-pressure offer: pick what’s holding you back (comparing, price, fit, asking family, browsing), drop an email, get 10% off for when you’re ready — plus a specialist follow-up. Captures the email AND the reason (the “why people hesitate” data), then feeds the Klaviyo nurture. Most high-AOV buyers convert within ~2 weeks of first asking. Built in the live demo (PDP).', metric: 'Email capture rate, reason mix, return-to-buy', effort: 'S', lift: 'List growth + recovery' },
      { id: 'r-ab', title: 'Formal A/B testing program', detail: 'PDP, checkout, home hero — structured experiments.', metric: 'Validated lift / test', effort: 'M', lift: 'Compounding' },
      { id: 'r-loop', title: 'Continuous CRO loop + monthly scorecard', detail: 'Clarity/GA4-driven; a standing monthly review of the KPI scorecard.', metric: 'Program velocity', effort: 'S', lift: 'Compounding' },
    ],
  },
]

const KPIS: { k: string; v: string }[] = [
  { k: 'Overall conversion rate', v: 'baseline TBD on GA4' },
  { k: 'PDP → cart rate', v: 'per-surface' },
  { k: 'Cart → checkout → purchase', v: 'funnel step rates' },
  { k: 'Payment approval %', v: 'Authnet' },
  { k: 'Average order value', v: 'consumer vs business' },
  { k: 'Repeat-purchase rate', v: 'retention' },
  { k: 'B2B lead → quote → order', v: 'B2B funnel' },
  { k: 'Revenue per visitor', v: 'north-star' },
]

/* cumulative expected lift band (illustrative, benchmark-based) */
const LIFT_CURVE = [
  { wk: 'Wk 0', low: 0, high: 0 },
  { wk: 'Wk 2', low: 3, high: 10 },
  { wk: 'Wk 4', low: 5, high: 15 },
  { wk: 'Wk 6', low: 8, high: 20 },
  { wk: 'Wk 8', low: 11, high: 26 },
  { wk: 'Wk 10', low: 13, high: 30 },
  { wk: 'Wk 12', low: 16, high: 36 },
  { wk: 'Wk 16', low: 20, high: 45 },
]

const ACCESS_TIERS: { tier: string; items: { id: string; label: string; held?: boolean }[] }[] = [
  { tier: 'Tier 1 — behavioral truth', items: [
    { id: 'a-ga4', label: 'GA4 Viewer/Analyst — both properties (IDs needed)' },
    { id: 'a-clarity', label: 'Session recording / heatmaps — install MS Clarity (free)' },
    { id: 'a-gtm', label: 'Google Tag Manager — container access' },
    { id: 'a-gsc', label: 'Google Search Console — both domains' },
  ]},
  { tier: 'Tier 2 — commerce + marketing', items: [
    { id: 'a-mag', label: 'Magento admin — already held (confirm Reports enabled)', held: true },
    { id: 'a-klaviyo', label: 'Klaviyo — email/SMS metrics + template build' },
    { id: 'a-sg', label: 'SendGrid — transactional deliverability' },
    { id: 'a-ads', label: 'Google Ads / Microsoft Ads — read access' },
    { id: 'a-meta', label: 'Meta / paid social — identify in-house vs agency + access' },
    { id: 'a-ctm', label: 'CallTrackingMetrics — phone-conversion data' },
  ]},
  { tier: 'Tier 3 — supporting', items: [
    { id: 'a-cf', label: 'Cloudflare — add analytics:read scope to existing token' },
    { id: 'a-authnet', label: 'Authorize.net — payment-step approval/decline rates' },
  ]},
]

/* ------------------------------ small UI bits ----------------------------- */

function StatusButton({ status, onClick }: { status: Status; onClick: () => void }) {
  const ui = STATUS_UI[status]
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${ui.cls}`}
      aria-label={`Status: ${ui.label}. Click to change.`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />
      {ui.label}
    </button>
  )
}

function ProgressRing({ pct, size = 132 }: { pct: number; size?: number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2d42" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="#c9a84c" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink">{pct}%</span>
        <span className="text-[11px] uppercase tracking-wider text-muted">complete</span>
      </div>
    </div>
  )
}

function Bar({ pct, tone = 'gold' }: { pct: number; tone?: string }) {
  const color = tone === 'emerald' ? 'bg-emerald-400' : tone === 'sky' ? 'bg-sky-400' : tone === 'rose' ? 'bg-rose-400' : 'bg-gold'
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Shot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="rounded-lg border border-border-subtle bg-surface overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border-subtle bg-bg/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        {caption && <span className="ml-2 truncate text-[11px] text-muted">{caption}</span>}
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <img src={`/medmart/roadmap2026/${src}`} alt={alt} loading="lazy" decoding="async" className="block w-full" />
      </div>
    </figure>
  )
}

const NAV = [
  ['summary', 'Summary'], ['critical', 'Critical'], ['audit', 'Funnel audit'],
  ['funnel', 'B2B vs B2C'], ['roadmap', 'Roadmap'], ['measure', 'Measurement'],
  ['design', 'Design'], ['access', 'Access'],
] as const

/* -------------------------------- the page -------------------------------- */

export default function MedmartRoadmap2026() {
  const { statusOf, cycle, reset } = useProgress()

  useEffect(() => {
    const prev = document.title
    document.title = 'MedMart 2026 Growth Roadmap — Ryan Patt'
    return () => { document.title = prev }
  }, [])

  const allItemIds = useMemo(() => [...P0S.map(p => p.id), ...ROADMAP.flatMap(p => p.items.map(i => i.id))], [])
  const doneCount = allItemIds.filter(id => statusOf(id) === 'done').length
  const overallPct = Math.round((doneCount / allItemIds.length) * 100)

  const phasePct = (p: Phase) => {
    const ids = p.items.map(i => i.id)
    const d = ids.filter(id => statusOf(id) === 'done').length
    return Math.round((d / ids.length) * 100)
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link to="/medmart" className="flex shrink-0 items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <span aria-hidden>←</span> MedMart
          </Link>
          <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-ink">{label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden w-24 sm:block"><Bar pct={overallPct} /></div>
            <span className="text-xs font-medium text-gold-light">{overallPct}%</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* hero */}
        <section className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-light">
              Conversion & Design Overhaul · {REPORT_DATE}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              medmartonline.com — 2026 Growth Roadmap
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
              <strong className="text-ink">medmartonline.com</strong> sells $1,000–$4,000 durable medical equipment on a dated theme that
              leaks conversions: an email popup that can <strong className="text-ink">cover the Add-to-Cart button</strong>, product pages
              with no reviews or delivery info, a testimonial block that renders three times, and a single funnel that forces business and
              consumer buyers down the same path. The fixes are concrete and mostly self-inflicted — repair the leaks, modernize the design,
              and give business buyers their own journey on the same domain.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#roadmap" className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-gold-light">View the roadmap</a>
              <a href="#critical" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20">2 critical items</a>
              <button onClick={reset} className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-muted transition-colors hover:text-ink">Reset progress</button>
            </div>
          </div>
          <div className="flex justify-center md:pl-6"><ProgressRing pct={overallPct} /></div>
        </section>

        {/* stat cards */}
        <section className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { v: '$3,599', l: 'PDP, 0 reviews', s: 'no social proof' },
            { v: '3×', l: 'testimonial block', s: 'renders three times' },
            { v: '17+', l: 'JS errors / PDP', s: 'front-end debt' },
            { v: '1', l: 'funnel, 2 buyers', s: 'B2B mixed into B2C' },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-card p-4">
              <div className="font-display text-2xl font-bold text-ink">{c.v}</div>
              <div className="text-sm text-ink">{c.l}</div>
              <div className="mt-0.5 text-xs text-muted">{c.s}</div>
            </div>
          ))}
        </section>

        {/* summary */}
        <Section id="summary" kicker="01" title="Executive summary">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { h: 'A popup can cover the buy box', b: 'A Klaviyo email popup renders over the product buy box in testing. The backend works — but we need a 2-minute human check to confirm whether the popup blocks Add-to-Cart for real users, mobile especially.' },
              { h: 'High-AOV pages lack proof', b: 'On $1k–$4k equipment the PDPs show no reviews and no delivery/stock info; warranty and returns are buried in tabs. The home page also renders its testimonials three times.' },
              { h: 'B2B is bolted onto B2C', b: 'Net-30, POs, tax-exempt and quotes live inside the consumer funnel instead of a dedicated business path. Two very different buyers, one confused funnel.' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border border-border-subtle bg-card p-5">
                <h3 className="font-display text-base font-semibold text-ink">{c.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.b}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* critical */}
        <Section id="critical" kicker="02" title="Critical — act first" subtitle="Silent, high-cost issues. Each is a click-to-cycle checklist item (To do → In progress → Done); progress saves to your browser.">
          <div className="space-y-3">
            {P0S.map(p => (
              <ItemCard key={p.id} item={p} status={statusOf(p.id)} onCycle={() => cycle(p.id)} accent="rose" />
            ))}
          </div>
        </Section>

        {/* audit */}
        <Section id="audit" kicker="03" title="Funnel audit" subtitle="medmartonline.com captured live (prod → payment), desktop + mobile, 2026-05-30.">
          <div className="space-y-6">
            {CONSUMER_SURFACES.map(s => (
              <div key={s.id} className="grid gap-5 rounded-xl border border-border-subtle bg-card p-5 md:grid-cols-2">
                <Shot src={s.shot} alt={s.shotAlt} caption={s.shotAlt} />
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">{s.name}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {s.good.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span>{g}</span></li>
                    ))}
                    {s.bad.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted"><Icon name="x" className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><span>{b}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* funnel strategy */}
        <Section id="funnel" kicker="04" title="Business vs consumer — one domain, two journeys" subtitle="Split the two buyers on medmartonline.com instead of forcing them through one funnel.">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/30 bg-card p-5">
              <h3 className="font-display text-base font-semibold text-rose-300">Today — one funnel</h3>
              <div className="mt-4 space-y-2 text-sm">
                <FunnelBox label="medmartonline.com" sub="every buyer hits the same path; Net-30, POs, tax-exempt and quotes sit inside the consumer checkout" tone="rose" />
                <FunnelBox label="Consumer + business collide" sub="an individual buying one scooter and a facility buying ten beds get an identical, compromised experience" tone="rose" />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-card p-5">
              <h3 className="font-display text-base font-semibold text-emerald-300">Target — two journeys</h3>
              <div className="mt-4 space-y-2 text-sm">
                <FunnelBox label="Consumer journey (medmartonline.com)" sub="assisted high-consideration: expert help, financing/HSA, reviews, delivery clarity" tone="emerald" />
                <FunnelBox label="Business endpoint (medmartonline.com/business)" sub="a dedicated B2B path on the same domain: company accounts, quote-to-order, Net-30, tax-exempt, PO upload, multi-seat" tone="emerald" />
                <FunnelBox label="Smart routing" sub="an entry prompt sends each buyer to the right journey; business pricing & terms stay out of the consumer checkout" tone="emerald" />
              </div>
            </div>
          </div>
        </Section>

        {/* roadmap */}
        <Section id="roadmap" kicker="05" title="30 / 60 / 90 / 120 roadmap" subtitle="Click any item's status to cycle To do → In progress → Done. Per-phase and overall progress update live and persist locally.">
          <div className="space-y-6">
            {ROADMAP.map(p => {
              const pct = phasePct(p)
              return (
                <div key={p.id} className="rounded-xl border border-border-subtle bg-card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${toneChip(p.tone)}`}>{p.window}</span>
                    <h3 className="font-display text-lg font-semibold text-ink">{p.theme}</h3>
                    <span className="ml-auto text-sm font-medium text-muted">{pct}%</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{p.blurb}</p>
                  <div className="mt-3"><Bar pct={pct} tone={p.tone} /></div>
                  <div className="mt-4 space-y-2.5">
                    {p.items.map(it => (
                      <ItemCard key={it.id} item={it} status={statusOf(it.id)} onCycle={() => cycle(it.id)} compact />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* measurement */}
        <Section id="measure" kicker="06" title="Measurement & timeline" subtitle="No win is claimed from a screenshot — only from a tracked event moving against its baseline.">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <h3 className="font-display text-base font-semibold text-ink">Cumulative expected lift <span className="text-muted">(illustrative band)</span></h3>
              <p className="mt-1 text-xs text-muted">Benchmark-based until GA4 baselines land. Real signal timing scales with traffic on each surface.</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={LIFT_CURVE} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                    <XAxis dataKey="wk" stroke="#8d97aa" fontSize={11} />
                    <YAxis stroke="#8d97aa" fontSize={11} unit="%" />
                    <Tooltip contentStyle={{ background: '#0f1524', border: '1px solid #1e2d42', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#e8edf5' }} />
                    <Area type="monotone" dataKey="high" stroke="#c9a84c" strokeWidth={2} fill="url(#g1)" name="High est." />
                    <Area type="monotone" dataKey="low" stroke="#8d97aa" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" name="Low est." />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border-subtle bg-card p-5">
                <h3 className="font-display text-base font-semibold text-ink">KPI scorecard</h3>
                <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {KPIS.map((k, i) => (
                    <li key={i} className="flex justify-between gap-2 text-sm">
                      <span className="text-ink">{k.k}</span><span className="text-muted">{k.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border-subtle bg-card p-5 text-sm leading-relaxed text-muted">
                <h3 className="font-display text-base font-semibold text-ink">When will we see it?</h3>
                <p className="mt-2"><strong className="text-ink">Days</strong> — P0 fixes (add-to-cart, payment) are step-functions, visible immediately in daily orders.</p>
                <p className="mt-1.5"><strong className="text-ink">2–6 weeks</strong> — PDP trust/UX, read time scales with traffic (low for high-AOV equipment, faster for low-cost accessories).</p>
                <p className="mt-1.5"><strong className="text-ink">6–12 weeks</strong> — lifecycle email + design system mature.</p>
                <p className="mt-1.5"><strong className="text-ink">30–60 days</strong> — customer-feedback signal (CSAT, reviews, support tickets).</p>
              </div>
            </div>
          </div>
        </Section>

        {/* design */}
        <Section id="design" kicker="07" title="Design direction" subtitle="Built in-page (no Figma cost). Start with the live interactive demo, then the recommended before/after for each surface.">
          <DesignSub title="Full interactive demo storefront — open the real pages" desc="A complete, navigable redesign of medmartonline.com: full Home, Category, Product, Cart, Checkout and Business pages with a working cart. Open any page below — nothing is saved or submitted.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { to: '/medmart/demo-store', t: 'Home page', d: 'Hero, audience routing, best sellers, trust' },
                { to: '/medmart/demo-store/shop/mobility-scooters', t: 'Category page', d: 'Grid, filters, financing & review cues' },
                { to: '/medmart/demo-store/product/golden-buzzaround-hd', t: 'Product page', d: 'Reviews, stock/delivery, financing, experts' },
                { to: '/medmart/demo-store/cart', t: 'Cart', d: 'Line items, summary, financing reminder' },
                { to: '/medmart/demo-store/checkout', t: 'Checkout', d: 'Reassurance rail → order confirmation' },
                { to: '/medmart/demo-store/business', t: 'Business / B2B', d: 'Quote, Net-30, tax-exempt, volume pricing' },
                { to: '/medmart/demo-store?finder=1', t: 'Guided product finder', d: 'Top categories → 2 questions → recommendation' },
                { to: '/medmart/demo-store/product/golden-buzzaround-hd#not-ready', t: '“Not ready?” 10% capture', d: 'Capture the objection + email when a visitor isn’t ready' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="group flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4 transition-colors hover:bg-gold/10">
                  <span>
                    <span className="block font-display text-base font-semibold text-ink">{l.t}</span>
                    <span className="mt-0.5 block text-sm text-muted">{l.d}</span>
                  </span>
                  <Icon name="chevron" className="h-5 w-5 shrink-0 text-gold-light transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">Tip: start on the Home page and shop all the way through to the order confirmation — the cart carries across pages.</p>
          </DesignSub>

          <DesignSub title="Email campaigns — full branded templates" desc="The lifecycle emails that recover and grow revenue between visits — each a complete, fully-branded MedMart template. Open the gallery to see them full-size.">
            <Link to="/medmart/email-campaigns" className="group flex items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gold/5 p-5 transition-colors hover:bg-gold/10">
              <span>
                <span className="block font-display text-lg font-semibold text-ink">Open the email campaign gallery</span>
                <span className="mt-1 block text-sm text-muted">Full templates: abandoned cart · new arrivals · accessory cross-sell · survey-for-10%-off · win-back</span>
              </span>
              <Icon name="chevron" className="h-6 w-6 shrink-0 text-gold-light transition-transform group-hover:translate-x-0.5" />
            </Link>
          </DesignSub>
        </Section>

        {/* access */}
        <Section id="access" kicker="08" title="Access & instrumentation" subtitle="Everything grounded in real numbers depends on these. Check items off as access lands.">
          <div className="grid gap-4 md:grid-cols-3">
            {ACCESS_TIERS.map(t => (
              <div key={t.tier} className="rounded-xl border border-border-subtle bg-card p-5">
                <h3 className="font-display text-sm font-semibold text-ink">{t.tier}</h3>
                <ul className="mt-3 space-y-2.5">
                  {t.items.map(it => (
                    <li key={it.id} className="flex items-start gap-2.5">
                      <button onClick={() => cycle(it.id)} aria-label="toggle"
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors ${statusOf(it.id) === 'done' || it.held ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-border-subtle text-transparent hover:border-gold'}`}>
                        <Icon name="check" className="h-3 w-3" />
                      </button>
                      <span className={`text-sm leading-snug ${statusOf(it.id) === 'done' || it.held ? 'text-muted line-through' : 'text-ink'}`}>{it.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <footer className="mt-12 border-t border-border-subtle pt-6 text-xs leading-relaxed text-muted">
          <p>Scope: medmartonline.com only. Method: heuristic review + Playwright/Chromium funnel capture (prod → payment), desktop + mobile, {REPORT_DATE}. Lift and timeline figures marked <span className="text-gold-light">[est]</span> are benchmark-based until GA4 + Clarity baselines are connected. Progress is stored in this browser only — no account, no database.</p>
        </footer>
      </main>
    </div>
  )
}

/* ----------------------------- sub-components ----------------------------- */

function Section({ id, kicker, title, subtitle, children }: { id: string; kicker: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-20">
      <div className="mb-5">
        <span className="font-display text-xs font-semibold tracking-widest text-gold">{kicker}</span>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function ItemCard({ item, status, onCycle, accent, compact }: { item: Item; status: Status; onCycle: () => void; accent?: string; compact?: boolean }) {
  const done = status === 'done'
  return (
    <div className={`rounded-lg border p-4 transition-colors ${accent === 'rose' ? 'border-rose-500/30 bg-rose-500/5' : 'border-border-subtle bg-surface'} ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h4 className={`font-medium text-ink ${compact ? 'text-sm' : 'text-base'} ${done ? 'line-through decoration-muted' : ''}`}>{item.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.metric && <Tag icon="metric">{item.metric}</Tag>}
            {item.effort && <Tag icon="effort">{item.effort}</Tag>}
            {item.lift && <Tag accent icon="lift">{item.lift}</Tag>}
          </div>
        </div>
        <StatusButton status={status} onClick={onCycle} />
      </div>
    </div>
  )
}

function Tag({ children, accent, icon }: { children: React.ReactNode; accent?: boolean; icon?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${accent ? 'border-gold/30 bg-gold/10 text-gold-light' : 'border-border-subtle bg-white/5 text-muted'}`}>
      {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}

function FunnelBox({ label, sub, tone }: { label: string; sub: string; tone: string }) {
  const border = tone === 'emerald' ? 'border-emerald-500/30' : 'border-rose-500/30'
  return (
    <div className={`rounded-lg border ${border} bg-surface p-3`}>
      <div className="text-sm font-medium text-ink">{label}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  )
}

function toneChip(tone: string) {
  switch (tone) {
    case 'rose': return 'bg-rose-500/15 text-rose-300'
    case 'sky': return 'bg-sky-500/15 text-sky-300'
    case 'emerald': return 'bg-emerald-500/15 text-emerald-300'
    default: return 'bg-gold/15 text-gold-light'
  }
}

const ICON_PATHS: Record<string, React.ReactNode> = {
  cart: <><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2 3h2.2l2.3 12.1a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 7H6" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  truck: <><path d="M3 6h11v9H3zM14 9h3.5l3.5 3.5V15H14z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
  shield: <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />,
  refresh: <><path d="M3 8a9 9 0 0 1 15-3l3 3M21 16a9 9 0 0 1-15 3l-3-3" /><path d="M21 5v3h-3M3 19v-3h3" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  arrowLeft: <path d="M15 5l-7 7 7 7" />,
  phone: <path d="M5 4h3l1.5 5-2 1a11 11 0 0 0 5 5l1-2 5 1.5V22a1 1 0 0 1-1 1A18 18 0 0 1 4 5a1 1 0 0 1 1-1z" />,
  metric: <><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></>,
  effort: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  lift: <><path d="M3 17l6-6 4 4 7-7" /><path d="M17 8h4v4" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
}

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {ICON_PATHS[name]}
    </svg>
  )
}


function DesignSub({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-4 mt-1 max-w-3xl text-sm text-muted">{desc}</p>
      {children}
    </div>
  )
}
