import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'

/* ─── types (must match api/fraud-review.ts payload) ──────────────────────── */

type TabId = 'summary' | 'orders' | 'sources' | 'prevention' | 'evidence' | 'providers'
type Severity = 'recoverable' | 'urgent' | 'lost' | 'info'
type ColorKey = 'red' | 'orange' | 'gold' | 'emerald' | 'blue' | 'muted'

interface Report {
  date: string
  intro: string
  statCards: { label: string; value: string; sub: string; color: ColorKey }[]
  whatHappened: string[]
  money: { period: string; what: string; amount: string; tone: ColorKey }[]
  moneyNote: string
  moneyOrders: { aprilChargebacks: string[]; mayFraud: string[]; mayCaptured: string[] }
  priorities: [string, string][]
  orders: { order: string; amount: string; shipTo: string; state: string; action: string; sev: Severity }[]
  ordersNote: string
  patternNote: string
  prevention: { when: string; tone: 'red' | 'orange' | 'emerald'; items: { title: string; detail: string }[] }[]
  preventionNote: string
  actionsTaken?: { asOf: string; items: { status: 'done' | 'progress' | 'note'; text: string }[] }
  attacker: [string, string][]
  declineReasons: { reason: string; count: number }[]
  evidenceNote: string
  method: string
  sources: {
    cardTesting: {
      ip: string; host: string; attempts: number; emails: number; window: string
      target: string; comboNote: string; sampleEmails: string[]
    }
    geoNote: string
    fraudOrders: { ord: string; d: string; st: string; email: string; ip: string; ipGeo: string; amt: string; ship: string }[]
  }
  providers: {
    intro: string
    volumeNote: string
    comparison: { provider: string; headline: string; annual: string; note: string; tone: ColorKey }[]
    caseForStripe: { title: string; detail: string }[]
    considerations: string[]
    verdict: string
  }
}

/* ─── class maps (literals live here so Tailwind keeps them) ──────────────── */

const textColor: Record<ColorKey, string> = {
  red: 'text-red-400', orange: 'text-orange-400', gold: 'text-gold',
  emerald: 'text-emerald-400', blue: 'text-blue-400', muted: 'text-muted',
}
const tierTone: Record<'red' | 'orange' | 'emerald', string> = {
  red: 'border-red-500/30 bg-red-500/5',
  orange: 'border-orange-500/30 bg-orange-500/5',
  emerald: 'border-emerald-500/30 bg-emerald-500/5',
}
const sevColors: Record<Severity, string> = {
  recoverable: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  urgent: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  lost: 'bg-red-500/15 text-red-400 border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
}
const sevLabel: Record<Severity, string> = {
  recoverable: 'Recoverable', urgent: 'Act today', lost: 'Likely lost', info: 'Watch',
}

const PIN_KEY = 'mm_fraud_pin'

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function MedmartFraudReview() {
  const [report, setReport] = useState<Report | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<TabId>('summary')

  // Always fetch the current server payload — never cache the report itself, so a
  // newly added field/tab can never leave a stale shape that blanks the UI.
  async function loadReport(p: string): Promise<boolean> {
    const res = await fetch('/api/fraud-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: p }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      setError(data.error || 'Unable to load the report.')
      return false
    }
    setReport(data.report as Report)
    return true
  }

  // On mount, if this browser session already unlocked, re-fetch fresh using the stored PIN.
  useEffect(() => {
    const p = sessionStorage.getItem(PIN_KEY)
    if (!p) return
    setLoading(true)
    loadReport(p).catch(() => setError('Network error.')).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function unlock(e: FormEvent) {
    e.preventDefault()
    if (!pin.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const ok = await loadReport(pin.trim())
      if (ok) {
        sessionStorage.setItem(PIN_KEY, pin.trim())
        setPin('')
      }
    } catch {
      setError('Network error. (Running locally? The /api function needs `vercel dev`, not plain `vite`.)')
    } finally {
      setLoading(false)
    }
  }

  function lock() {
    sessionStorage.removeItem(PIN_KEY)
    setReport(null)
    setTab('summary')
  }

  /* ── Loading (re-fetching from a stored PIN) ─────────────────────────────── */
  if (!report && loading) {
    return (
      <div className="min-h-screen bg-bg text-ink font-sans flex items-center justify-center">
        <div className="text-sm text-muted">Loading report…</div>
      </div>
    )
  }

  /* ── PIN gate ───────────────────────────────────────────────────────────── */
  if (!report) {
    return (
      <div className="min-h-screen bg-bg text-ink font-sans flex flex-col">
        <header className="border-b border-border-subtle bg-bg/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
            <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              MedMart
            </Link>
            <div className="h-4 w-px bg-border-subtle" />
            <span className="text-sm font-medium text-ink">Payment Fraud Review</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <form onSubmit={unlock} className="w-full max-w-sm bg-white/[0.03] border border-border-subtle rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h1 className="text-base font-semibold text-ink">Protected report</h1>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-4">
              This page contains confidential order and fraud details. Enter the access PIN to view it.
            </p>
            <input
              type="password"
              autoComplete="off"
              autoFocus
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Access PIN"
              className="w-full bg-black/30 border border-border-subtle rounded px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-gold/50 mb-3"
            />
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="w-full bg-gold/15 hover:bg-gold/25 disabled:opacity-40 disabled:cursor-not-allowed text-gold border border-gold/30 rounded px-3 py-2 text-sm font-medium transition-colors"
            >
              {loading ? 'Checking…' : 'View report'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Report ─────────────────────────────────────────────────────────────── */
  const tabs: { id: TabId; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'orders', label: `Orders to Verify (${report.orders.length})` },
    { id: 'sources', label: 'Sources & IPs' },
    { id: 'prevention', label: 'Prevention' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'providers', label: 'Payment Providers' },
  ]
  const maxDecline = Math.max(...report.declineReasons.map(d => d.count), 1)

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
          <span className="text-sm font-medium text-ink">Payment Fraud Review</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted">{report.date}</span>
            <button onClick={lock} className="text-xs text-muted hover:text-ink transition-colors">Lock</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Payment Fraud Review</h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">{report.intro}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {report.statCards.map(card => (
            <div key={card.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className={`text-2xl font-bold font-mono mb-1 ${textColor[card.color]}`}>{card.value}</div>
              <div className="text-xs font-medium text-ink mb-0.5">{card.label}</div>
              <div className="text-xs text-muted">{card.sub}</div>
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

        {/* SUMMARY */}
        {tab === 'summary' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">What happened, in plain terms</h2>
              {report.whatHappened.map((p, i) => (
                <p key={i} className="text-sm text-muted leading-relaxed mb-3 last:mb-0">{p}</p>
              ))}
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">The money</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs text-muted uppercase tracking-wider text-left">
                      <th className="py-2 pr-3 font-medium">Period</th>
                      <th className="py-2 pr-3 font-medium">What</th>
                      <th className="py-2 pr-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.money.map((m, i) => (
                      <tr key={i} className="border-b border-border-subtle/40">
                        <td className="py-3 pr-3 text-muted text-xs">{m.period}</td>
                        <td className="py-3 pr-3 text-ink text-xs">{m.what}</td>
                        <td className={`py-3 pr-3 text-right font-mono text-xs ${textColor[m.tone]}`}>{m.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted mt-4 leading-relaxed">{report.moneyNote}</p>

              <div className="mt-5 pt-4 border-t border-border-subtle/60 space-y-3">
                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">Backing order numbers</div>
                {[
                  { label: `April chargebacks (${report.moneyOrders.aprilChargebacks.length})`, list: report.moneyOrders.aprilChargebacks },
                  { label: `May fraud-flagged (${report.moneyOrders.mayFraud.length})`, list: report.moneyOrders.mayFraud },
                  { label: `↳ of which charged (${report.moneyOrders.mayCaptured.length})`, list: report.moneyOrders.mayCaptured },
                ].map((g, i) => (
                  <div key={i}>
                    <div className="text-xs text-ink mb-1">{g.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.list.map(o => (
                        <span key={o} className="text-[11px] font-mono text-muted bg-black/30 border border-border-subtle/60 rounded px-1.5 py-0.5">{o}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted/80 leading-relaxed">Every order is itemized with date, amount, email, IP and destination on the Sources &amp; IPs tab.</p>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">The three things that matter</h2>
              <ul className="space-y-2.5 text-sm text-muted">
                {report.priorities.map(([t, d], i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/15 text-gold text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <span><strong className="text-ink">{t}.</strong> {d}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Orders charged to stolen cards — verify before fulfilling</h2>
              <p className="text-xs text-muted mb-4">{report.ordersNote}</p>
              <div className="space-y-3">
                {report.orders.map(o => (
                  <div key={o.order} className="bg-black/20 border border-border-subtle/60 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm text-ink font-mono">#{o.order}</div>
                        <div className="text-xs text-muted mt-0.5">Ship to: {o.shipTo}</div>
                      </div>
                      <div className="text-lg font-bold font-mono text-ink">{o.amount}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sevColors[o.sev]}`}>{sevLabel[o.sev]}</span>
                      <span className="text-xs text-muted">{o.state}</span>
                    </div>
                    <div className="text-sm text-ink mt-2">{o.action}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xl">🔎</span>
                <h2 className="text-base font-semibold text-blue-400">Pattern worth flagging</h2>
              </div>
              <p className="text-sm text-muted leading-relaxed">{report.patternNote}</p>
            </section>
          </div>
        )}

        {/* SOURCES & IPs */}
        {tab === 'sources' && report.sources && (
          <div className="space-y-6">
            <section className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-orange-400 mb-1">Card-testing source</h2>
              <p className="text-xs text-muted mb-4">Where the stolen cards were tested. Essentially one address.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  ['IP address', report.sources.cardTesting.ip],
                  ['Host', report.sources.cardTesting.host],
                  ['Attempts', `${report.sources.cardTesting.attempts} carts`],
                  ['Distinct emails', `${report.sources.cardTesting.emails}`],
                  ['Active window', report.sources.cardTesting.window],
                  ['Target product', report.sources.cardTesting.target],
                ].map(([k, v], i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded p-3">
                    <div className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">{k}</div>
                    <div className="text-xs text-ink font-mono break-all">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">{report.sources.cardTesting.comboNote}</p>
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Sample emails used</div>
              <div className="flex flex-wrap gap-2">
                {report.sources.cardTesting.sampleEmails.map((e, i) => (
                  <span key={i} className="text-xs font-mono text-muted bg-black/30 border border-border-subtle/60 rounded px-2 py-1 break-all">{e}</span>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Fraudulent orders — email, IP & destination</h2>
              <p className="text-xs text-muted mb-4">{report.sources.geoNote}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs text-muted uppercase tracking-wider text-left">
                      <th className="py-2 pr-3 font-medium">Order #</th>
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Email used</th>
                      <th className="py-2 pr-3 font-medium">IP</th>
                      <th className="py-2 pr-3 font-medium">IP location · ISP</th>
                      <th className="py-2 pr-3 font-medium text-right">Amount</th>
                      <th className="py-2 pr-3 font-medium">Ship to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sources.fraudOrders.map((o, i) => (
                      <tr key={i} className="border-b border-border-subtle/40">
                        <td className="py-2 pr-3 text-ink font-mono text-xs whitespace-nowrap">{o.ord}</td>
                        <td className="py-2 pr-3 text-muted font-mono text-xs whitespace-nowrap">{o.d}</td>
                        <td className="py-2 pr-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${o.st === 'fraud' ? sevColors.urgent : sevColors.lost}`}>{o.st}</span>
                        </td>
                        <td className="py-2 pr-3 text-ink font-mono text-xs break-all">{o.email}</td>
                        <td className="py-2 pr-3 text-muted font-mono text-xs break-all">{o.ip}</td>
                        <td className="py-2 pr-3 text-muted text-xs whitespace-nowrap">{o.ipGeo}</td>
                        <td className="py-2 pr-3 text-right text-ink font-mono text-xs whitespace-nowrap">{o.amt}</td>
                        <td className="py-2 pr-3 text-muted text-xs whitespace-nowrap">{o.ship}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* PREVENTION */}
        {tab === 'prevention' && (
          <div className="space-y-5">
            {report.actionsTaken && (
              <section className="bg-emerald-500/[0.06] border border-emerald-500/30 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Actions taken · {report.actionsTaken.asOf}</h2>
                <div className="space-y-2.5">
                  {report.actionsTaken.items.map((a, i) => {
                    const m = { done: ['✓', 'text-emerald-400'], progress: ['◔', 'text-yellow-400'], note: ['ℹ', 'text-blue-400'] }[a.status]
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`shrink-0 mt-0.5 text-sm font-bold ${m[1]}`}>{m[0]}</span>
                        <span className="text-sm text-muted leading-relaxed">{a.text}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
            {report.prevention.map((tier, i) => (
              <section key={i} className={`border rounded-xl p-6 ${tierTone[tier.tone]}`}>
                <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">{tier.when}</h2>
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
            <p className="text-xs text-muted leading-relaxed px-1">{report.preventionNote}</p>
          </div>
        )}

        {/* EVIDENCE */}
        {tab === 'evidence' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">The attacker</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {report.attacker.map(([k, v], i) => (
                  <div key={i} className="bg-black/20 border border-border-subtle/60 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">{k}</div>
                    <div className="text-xs text-muted leading-relaxed">{v}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Why we know it is card testing</h2>
              <p className="text-xs text-muted mb-4">The decline reasons recorded in the payment logs are a textbook bot fingerprint.</p>
              <div className="space-y-2">
                {report.declineReasons.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 text-right font-mono text-sm text-gold">{d.count}</div>
                    <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gold/40 rounded-full" style={{ width: `${(d.count / maxDecline) * 100}%` }} />
                    </div>
                    <div className="text-xs text-muted w-64 shrink-0">{d.reason}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-4 leading-relaxed">{report.evidenceNote}</p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">How this was investigated</h2>
              <p className="text-sm text-muted leading-relaxed">{report.method}</p>
            </section>
          </div>
        )}

        {/* PAYMENT PROVIDERS */}
        {tab === 'providers' && report.providers && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Where payments run today</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">{report.providers.intro}</p>
              <p className="text-xs text-muted/80 leading-relaxed">{report.providers.volumeNote}</p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Cost at your volume</h2>
              <p className="text-xs text-muted mb-4">Published rates applied to ~$16.5M/yr of card volume. At list, all three are within rounding distance — the lever is the negotiated rate.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs text-muted uppercase tracking-wider text-left">
                      <th className="py-2 pr-3 font-medium">Provider</th>
                      <th className="py-2 pr-3 font-medium">Headline rate</th>
                      <th className="py-2 pr-3 font-medium text-right">Est. annual</th>
                      <th className="py-2 pr-3 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.providers.comparison.map((r, i) => (
                      <tr key={i} className="border-b border-border-subtle/40 align-top">
                        <td className={`py-3 pr-3 text-xs font-semibold whitespace-nowrap ${textColor[r.tone]}`}>{r.provider}</td>
                        <td className="py-3 pr-3 text-muted text-xs">{r.headline}</td>
                        <td className={`py-3 pr-3 text-right font-mono text-xs whitespace-nowrap ${textColor[r.tone]}`}>{r.annual}</td>
                        <td className="py-3 pr-3 text-muted text-xs leading-snug">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-gold/[0.06] border border-gold/30 rounded-xl p-6">
              <h2 className="text-base font-semibold text-gold mb-4">The case for Stripe</h2>
              <div className="space-y-3">
                {report.providers.caseForStripe.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/15 text-gold text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <div className="text-sm text-ink font-medium">{c.title}</div>
                      <div className="text-xs text-muted mt-0.5 leading-relaxed">{c.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">What a switch involves</h2>
              <ul className="space-y-2 text-xs text-muted">
                {report.providers.considerations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-border-subtle mt-0.5 shrink-0">—</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Recommendation</h2>
              <p className="text-sm text-muted leading-relaxed">{report.providers.verdict}</p>
            </section>
          </div>
        )}

        <footer className="mt-10 pt-6 border-t border-border-subtle text-xs text-muted">
          Prepared by Ryan Patt · Read-only forensic review · Figures from production data as of {report.date}.
        </footer>

      </div>
    </div>
  )
}
