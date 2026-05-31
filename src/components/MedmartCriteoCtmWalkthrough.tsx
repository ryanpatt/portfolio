import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

/* ─── tiny inline icons (stroke, inherit color) ───────────────────────────── */
const svg = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const I = {
  click: svg(<><path d="M9 3v3M4.6 4.6 6.7 6.7M3 9h3" /><path d="m11 11 9 3.5-3.6 1.3L15.1 20 11 11Z" /></>),
  globe: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>),
  phone: svg(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" />),
  link: svg(<><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>),
  match: svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M8.5 11h5M11 8.5v5" /></>),
  push: svg(<><path d="M6 18 18 6" /><path d="M9 6h9v9" /></>),
  cart: svg(<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L23 7H6" /></>),
  file: svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 14h8M8 18h5" /></>),
  upload: svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>),
  chart: svg(<><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></>),
  clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  check: svg(<path d="M20 6 9 17l-5-5" />),
}

type Step = { icon: ReactNode; title: string; text: string }

const ctmSteps: Step[] = [
  { icon: I.click, title: 'Ad click', text: 'A shopper clicks a paid ad. The click carries a Google Click ID (GCLID).' },
  { icon: I.globe, title: 'Browses the site', text: 'CallTrackingMetrics tags the visit and shows a tracked phone number.' },
  { icon: I.phone, title: 'Calls & buys', text: 'They order by phone. CTM records the call and the ad that drove it.' },
  { icon: I.link, title: 'Notifies Magento', text: 'CTM sends a webhook to the store the moment the call is logged.' },
  { icon: I.match, title: 'Matches the order', text: 'Magento links the call to the right order by session, order #, or caller number.' },
  { icon: I.push, title: 'Sends the value back', text: 'The order’s sale value is pushed onto the CTM call (with a Google Ads backup file).' },
]

const criteoSteps: Step[] = [
  { icon: I.cart, title: 'Order completes', text: 'Any completed order becomes a conversion to report.' },
  { icon: I.clock, title: 'Daily export', text: 'A scheduled job gathers the day’s qualifying orders automatically.' },
  { icon: I.file, title: 'Builds the file', text: 'A simple file with order value, a privacy-safe email, and the event name.' },
  { icon: I.upload, title: 'Goes to Criteo', text: 'The file is uploaded to Criteo, matched by your conversion event.' },
  { icon: I.chart, title: 'Sale attributed', text: 'Criteo credits the sale back to the ad that earned it.' },
]

/* ─── flow renderer: horizontal on desktop, stacked on mobile ──────────────── */
function Flow({ steps, accent }: { steps: Step[]; accent: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-stretch">
      {steps.map((s, i) => (
        <div key={s.title} className="flex flex-col md:flex-row md:items-stretch md:flex-1">
          <div className="flex-1 bg-white/[0.03] border border-border-subtle rounded-lg p-4 flex flex-col gap-1.5">
            <div className={`flex items-center justify-between ${accent}`}>
              <span>{s.icon}</span>
              <span className="text-[10px] font-mono opacity-50">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="text-sm font-semibold text-ink">{s.title}</div>
            <div className="text-xs text-muted leading-relaxed">{s.text}</div>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex items-center justify-center shrink-0 ${accent} opacity-40 py-1 md:py-0 md:px-1.5`}>
              <svg className="rotate-90 md:rotate-0" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ResultBadge({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className={`mt-3 inline-flex items-center gap-2 text-xs font-medium ${accent}`}>
      <span className="w-5 h-5">{I.check}</span>
      {children}
    </div>
  )
}

export default function MedmartCriteoCtmWalkthrough() {
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
          <span className="text-sm font-medium text-ink">Conversion Tracking</span>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <span className="text-xs text-muted">CTM · Criteo</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Title */}
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-mono text-gold uppercase tracking-wider">Walkthrough</span>
          <h1 className="text-3xl font-display font-bold text-ink mt-2 mb-3">
            Connecting orders back to the ads that earned them
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Two Magento modules quietly close the loop between an ad click and a real sale —
            including sales that happen over the <span className="text-ink">phone</span>, which ad
            platforms normally can’t see. The result: Google Ads and Criteo learn which campaigns
            actually drive revenue, not just clicks.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'CallTrackingMetrics', value: 'Phone calls', sub: 'Live two-way API', color: 'text-blue-400' },
            { label: 'Criteo', value: 'Online orders', sub: 'Daily file feed', color: 'text-amber-400' },
            { label: 'Where it lives', value: 'One screen', sub: 'Admin → Conversion Tracking', color: 'text-ink' },
            { label: 'Setup health', value: 'One click', sub: 'Test Connection ✓', color: 'text-emerald-400' },
          ].map(c => (
            <div key={c.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className="text-[11px] text-muted mb-1">{c.label}</div>
              <div className={`text-lg font-display font-bold ${c.color}`}>{c.value}</div>
              <div className="text-[11px] text-muted mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Big picture */}
        <div className="mb-12">
          <h2 className="text-base font-semibold text-ink mb-1">The big picture</h2>
          <p className="text-sm text-muted mb-5 max-w-2xl">One shopper, two ways to credit the sale.</p>
          <div className="bg-white/[0.03] border border-border-subtle rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <div className="md:w-48 shrink-0 flex md:flex-col items-center justify-center gap-2 bg-white/[0.02] border border-border-subtle rounded-lg p-4 text-center">
                <span className="text-gold w-6 h-6">{I.cart}</span>
                <div>
                  <div className="text-sm font-semibold text-ink">A customer buys</div>
                  <div className="text-[11px] text-muted">online or by phone</div>
                </div>
              </div>
              <div className="hidden md:flex items-center text-muted opacity-40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div className="border border-blue-400/30 bg-blue-400/[0.04] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-1"><span className="w-5 h-5">{I.phone}</span><span className="text-sm font-semibold">Phone order → CTM</span></div>
                  <p className="text-xs text-muted leading-relaxed">Call-tracking ties the phone call to the ad click, then sends the sale value back live.</p>
                </div>
                <div className="border border-amber-400/30 bg-amber-400/[0.04] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-1"><span className="w-5 h-5">{I.upload}</span><span className="text-sm font-semibold">Every order → Criteo</span></div>
                  <p className="text-xs text-muted leading-relaxed">A daily file reports completed orders so Criteo can attribute them to its ads.</p>
                </div>
              </div>
              <div className="hidden md:flex items-center text-muted opacity-40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
              <div className="md:w-48 shrink-0 flex md:flex-col items-center justify-center gap-2 bg-white/[0.02] border border-border-subtle rounded-lg p-4 text-center">
                <span className="text-emerald-400 w-6 h-6">{I.chart}</span>
                <div>
                  <div className="text-sm font-semibold text-ink">Ad platform sees revenue</div>
                  <div className="text-[11px] text-muted">true ROI, not just clicks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTM flow */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 w-5 h-5">{I.phone}</span>
            <h2 className="text-base font-semibold text-ink">CallTrackingMetrics — phone-call attribution</h2>
          </div>
          <p className="text-sm text-muted mb-5 max-w-2xl">
            Follows a caller from the ad they clicked all the way to the revenue they generated.
          </p>
          <Flow steps={ctmSteps} accent="text-blue-400" />
          <ResultBadge accent="text-emerald-400">Google Ads now knows: “this phone call was a $X sale.”</ResultBadge>
        </div>

        {/* Criteo flow */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 w-5 h-5">{I.upload}</span>
            <h2 className="text-base font-semibold text-ink">Criteo — offline conversions</h2>
          </div>
          <p className="text-sm text-muted mb-5 max-w-2xl">
            No API keys needed — Criteo just receives a file of completed orders, tagged with your
            conversion event.
          </p>
          <Flow steps={criteoSteps} accent="text-amber-400" />
          <ResultBadge accent="text-emerald-400">Criteo credits each sale to the ad that drove it.</ResultBadge>
        </div>

        {/* What changed */}
        <div className="mb-12 bg-white/[0.03] border border-border-subtle rounded-lg p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">What changed: Invoca → CTM</h2>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <span className="px-3 py-1.5 rounded-md border border-border-subtle text-muted line-through">Invoca</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted opacity-50"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <span className="px-3 py-1.5 rounded-md border border-blue-400/40 bg-blue-400/[0.06] text-blue-400 font-medium">CallTrackingMetrics</span>
            <span className="text-xs text-muted">Same outcome — the call-tracking provider was swapped to CTM under the hood.</span>
          </div>
        </div>

        {/* Configure & verify */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink mb-1">Set up &amp; verify</h2>
          <p className="text-sm text-muted mb-5 max-w-2xl">Both providers live on one admin screen.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <div className="text-xs text-muted mb-3 font-mono">Admin → Stores → Configuration → MedMart → Conversion Tracking</div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-1"><span className="w-5 h-5">{I.phone}</span> CallTrackingMetrics</div>
              <p className="text-xs text-muted leading-relaxed mb-2">Enter the account ID and keys — one click confirms the connection.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-md bg-zinc-800 border border-border-subtle text-zinc-200 text-xs font-medium">Test Connection</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-4 h-4">{I.check}</span> Connected to “Med Mart”</span>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1"><span className="w-5 h-5">{I.upload}</span> Criteo</div>
              <p className="text-xs text-muted leading-relaxed">
                Just an <span className="text-ink">Advertiser ID</span> and a <span className="text-ink">conversion event name</span> —
                no keys to manage. The daily file does the rest.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted/70 mt-10 border-t border-border-subtle pt-4">
          MedMart_Ctm + MedMart_Criteo · Magento 2 conversion-tracking modules
        </p>
      </div>
    </div>
  )
}
