import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'

/* ─── types (must match api/authnet-review.ts payload) ────────────────────── */

type TabId = 'summary' | 'evidence' | 'declines' | 'avs' | 'fix'
type Tone = 'red' | 'orange' | 'gold' | 'emerald' | 'blue' | 'muted'

interface Report {
  date: string
  headline: string
  intro: string
  statCards: { label: string; value: string; sub: string; tone: Tone }[]
  whatsHappening: string[]
  errorString: string
  wrapperNote: string
  evidence: { check: string; found: string; tone: Tone }[]
  validationTrend: { day: string; approved: number; declined: number; note: string }[]
  declines: { time: string; name: string; city: string; card: string; avs: string }[]
  declinesNote: string
  channelNote: string
  rootCause: string
  fixPrimary: string[]
  fixWorkaround: string
  checklist: { q: string; a: string }[]
  addressCheck: {
    question: string
    verdict: string
    answer: string
    sampleBillTo: [string, string][]
    emptyFieldCounts: { field: string; empty: number }[]
    avsCodes: { code: string; label: string; meaning: string; tone: Tone }[]
    why: string
    proof: string
    confirm: string
  }
}

/* ─── class maps (literals live here so Tailwind keeps them) ──────────────── */

const textColor: Record<Tone, string> = {
  red: 'text-red-400', orange: 'text-orange-400', gold: 'text-gold',
  emerald: 'text-emerald-400', blue: 'text-blue-400', muted: 'text-muted',
}
const dotColor: Record<Tone, string> = {
  red: 'bg-red-400', orange: 'bg-orange-400', gold: 'bg-gold',
  emerald: 'bg-emerald-400', blue: 'bg-blue-400', muted: 'bg-muted',
}

const PIN_KEY = 'mm_authnet_pin'

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function MedmartAuthnetReview() {
  const [report, setReport] = useState<Report | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<TabId>('summary')

  async function loadReport(p: string): Promise<boolean> {
    const res = await fetch('/api/authnet-review', {
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

  /* ── Loading ─────────────────────────────────────────────────────────────── */
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
            <span className="text-sm font-medium text-ink">Payment Gateway Review</span>
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
              This page contains confidential order and payment detail. Enter the access PIN to view it.
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
    { id: 'evidence', label: 'Evidence' },
    { id: 'declines', label: `Declines (${report.declines.length})` },
    { id: 'avs', label: 'Address & AVS' },
    { id: 'fix', label: 'Fix' },
  ]
  const maxBar = Math.max(...report.validationTrend.map(d => d.approved + d.declined), 1)

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
          <span className="text-sm font-medium text-ink truncate">Payment Gateway Review</span>
          <button onClick={lock} className="ml-auto text-xs text-muted hover:text-ink transition-colors flex items-center gap-1.5 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Lock
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-4">
            Authorize.Net · “Gateway connection error” · {report.date}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink mb-3 leading-tight max-w-3xl">
            {report.headline}
          </h1>
          <p className="text-muted text-sm md:text-base leading-relaxed max-w-3xl">
            {report.intro}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {report.statCards.map((c, i) => (
            <div key={i} className="bg-white/[0.02] border border-border-subtle rounded-xl p-4">
              <div className="text-xs text-muted mb-1">{c.label}</div>
              <div className={`text-lg font-display font-bold ${textColor[c.tone]}`}>{c.value}</div>
              <div className="text-[11px] text-muted/80 mt-1 leading-snug">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-subtle mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-gold text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Summary ── */}
        {tab === 'summary' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {report.whatsHappening.map((p, i) => (
                <div key={i} className="flex gap-3 bg-white/[0.02] border border-border-subtle rounded-xl p-4">
                  <span className="text-gold font-display font-bold text-sm shrink-0">{i + 1}</span>
                  <p className="text-sm text-muted leading-relaxed">{p}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">The exact error in the logs</h3>
              <pre className="text-[11px] md:text-xs text-orange-300 bg-black/40 border border-border-subtle rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">{report.errorString}</pre>
              <p className="text-xs text-muted leading-relaxed mt-3">{report.wrapperNote}</p>
            </div>

            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">Root cause</h3>
              <p className="text-sm text-muted leading-relaxed">{report.rootCause}</p>
            </div>
          </div>
        )}

        {/* ── Evidence ── */}
        {tab === 'evidence' && (
          <div className="space-y-6">
            <div className="space-y-2">
              {report.evidence.map((e, i) => (
                <div key={i} className="flex gap-3 bg-white/[0.02] border border-border-subtle rounded-xl p-4">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor[e.tone]}`} />
                  <div>
                    <div className="text-sm font-medium text-ink">{e.check}</div>
                    <div className="text-xs text-muted leading-relaxed mt-0.5">{e.found}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-1">Card-validation outcomes, day by day</h3>
              <p className="text-xs text-muted mb-4">
                The $0.00 “validate card” auth that runs for every new card — green = approved, red = declined.
              </p>
              <div className="space-y-2.5">
                {report.validationTrend.map((d, i) => {
                  const total = d.approved + d.declined
                  const pct = (total / maxBar) * 100
                  const apprPct = total ? (d.approved / total) * 100 : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-muted shrink-0">{d.day}</div>
                      <div className="flex-1 h-5 rounded bg-black/30 overflow-hidden" style={{ width: `${Math.max(pct, 8)}%` }}>
                        <div className="h-full flex">
                          <div className="h-full bg-emerald-500/60" style={{ width: `${apprPct}%` }} />
                          <div className="h-full bg-red-500/60" style={{ width: `${100 - apprPct}%` }} />
                        </div>
                      </div>
                      <div className="w-40 text-[11px] text-muted/80 shrink-0">
                        <span className="text-emerald-400">{d.approved} ok</span>
                        {' · '}
                        <span className="text-red-400">{d.declined} declined</span>
                        {d.note && <span className="block text-muted/60">{d.note}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">The client's checklist, answered</h3>
              <div className="space-y-3">
                {report.checklist.map((c, i) => (
                  <div key={i} className="border-l-2 border-gold/30 pl-3">
                    <div className="text-xs font-medium text-ink">{c.q}</div>
                    <div className="text-xs text-muted leading-relaxed mt-0.5">{c.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Declines ── */}
        {tab === 'declines' && (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-white/[0.02] border border-border-subtle rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border-subtle">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Card</th>
                    <th className="px-4 py-3 font-medium">AVS</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {report.declines.map((d, i) => (
                    <tr key={i} className="border-b border-border-subtle/50 last:border-0">
                      <td className="px-4 py-3 text-muted tabular-nums">{d.time}</td>
                      <td className="px-4 py-3 text-ink">{d.name}</td>
                      <td className="px-4 py-3 text-muted">{d.city}</td>
                      <td className="px-4 py-3 text-muted tabular-nums">{d.card}</td>
                      <td className="px-4 py-3"><span className="text-orange-400 font-medium">{d.avs}</span></td>
                      <td className="px-4 py-3"><span className="text-red-400 text-xs font-medium">Declined · E00027</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted leading-relaxed">{report.declinesNote}</p>
            <div className="bg-blue-500/[0.04] border border-blue-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-ink mb-1.5">Backend-only? No.</h3>
              <p className="text-xs text-muted leading-relaxed">{report.channelNote}</p>
            </div>
          </div>
        )}

        {/* ── Address & AVS ── */}
        {tab === 'avs' && (
          <div className="space-y-6">
            {/* Q&A headline */}
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <p className="text-xs text-muted mb-1">The question</p>
              <h3 className="text-base font-semibold text-ink mb-3">{report.addressCheck.question}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-display font-bold text-emerald-400">{report.addressCheck.verdict}</span>
                <span className="text-xs text-muted">Short answer</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{report.addressCheck.answer}</p>
            </div>

            {/* Proof: the actual data + empty-field counts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
                <h4 className="text-sm font-semibold text-ink mb-1">What we actually send</h4>
                <p className="text-xs text-muted mb-3">One real request pulled from the production payment log:</p>
                <div className="bg-black/30 border border-border-subtle rounded-lg p-3 space-y-1">
                  {report.addressCheck.sampleBillTo.map(([k, v], i) => (
                    <div key={i} className="flex justify-between gap-3 text-xs">
                      <span className="text-muted/70">{k}</span>
                      <span className="text-ink font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
                <h4 className="text-sm font-semibold text-ink mb-1">Blank fields across all of today's orders</h4>
                <p className="text-xs text-muted mb-3">If the address weren't being sent, these would be non-zero:</p>
                <div className="space-y-2">
                  {report.addressCheck.emptyFieldCounts.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{f.field}</span>
                      <span className="text-emerald-400 font-medium tabular-nums">{f.empty} blank</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The crux: what the AVS letter means */}
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h4 className="text-sm font-semibold text-ink mb-1">The key to all of this: what the AVS result means</h4>
              <p className="text-xs text-muted mb-4">
                AVS is the bank's address check. The letter the bank returns is what decides this — and “U” does
                <span className="text-ink font-medium"> not</span> mean we forgot to send an address.
              </p>
              <div className="space-y-2">
                {report.addressCheck.avsCodes.map((a, i) => (
                  <div key={i} className="flex gap-3 bg-black/20 border border-border-subtle rounded-lg p-3">
                    <span className={`shrink-0 w-7 h-7 rounded flex items-center justify-center font-display font-bold text-sm ${textColor[a.tone]} bg-white/[0.04]`}>{a.code}</span>
                    <div>
                      <div className={`text-sm font-medium ${textColor[a.tone]}`}>{a.label}</div>
                      <div className="text-xs text-muted leading-relaxed mt-0.5">{a.meaning}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why / proof / confirm */}
            <div className="bg-orange-500/[0.04] border border-orange-500/20 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-ink mb-2">Why every decline shows “U”</h4>
              <p className="text-sm text-muted leading-relaxed">{report.addressCheck.why}</p>
            </div>
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h4 className="text-sm font-semibold text-ink mb-2">Proof the address handling didn't change</h4>
              <p className="text-sm text-muted leading-relaxed">{report.addressCheck.proof}</p>
            </div>
            <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-ink mb-2">How to confirm in 2 minutes</h4>
              <p className="text-sm text-muted leading-relaxed">{report.addressCheck.confirm}</p>
            </div>
          </div>
        )}

        {/* ── Fix ── */}
        {tab === 'fix' && (
          <div className="space-y-6">
            <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Recommended fix — Authorize.Net account</h3>
              <ol className="space-y-2.5">
                {report.fixPrimary.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                    <span className="text-emerald-400 font-display font-bold shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">Immediate workaround (Magento side)</h3>
              <p className="text-sm text-muted leading-relaxed">{report.fixWorkaround}</p>
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted/50 mt-10">
          Read-only diagnostics from production logs (var/log/exception.log, var/log/tokenbase.log) and live
          connectivity tests. No production settings were changed.
        </p>
      </div>
    </div>
  )
}
