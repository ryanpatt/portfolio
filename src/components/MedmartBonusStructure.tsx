import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

/*  MedMart performance-bonus structure (route: /medmart/bonus-structure)
    Standalone — intentionally NOT linked from the public roadmap.
    Simple: four metrics, each measured against the prior 2 years. Self-funding. */

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

// Four metrics, each benchmarked against the trailing 24 months.
const METRICS = [
  { key: 'cvr', name: 'Conversion rate', basis: 'vs. prior 2-year average', target: '+10% sustained 30 days', bonus: 1500, stretch: '+20% → $3,000', note: 'More of the same traffic turns into orders.' },
  { key: 'aov', name: 'Average order value', basis: 'vs. prior 2-year average', target: '+10% sustained 30 days', bonus: 1000, stretch: null, note: 'Bigger baskets from bundles, financing, cross-sell.' },
  { key: 'recovery', name: 'Recovered revenue', basis: 'net-new from email flows', target: '3% of recovered revenue', bonus: 'cap $2,000 / quarter', stretch: null, note: 'Abandoned-cart, browse and win-back flows (Klaviyo-attributed).' },
  { key: 'overall', name: 'Overall revenue growth', basis: 'vs. prior 2-year trend', target: '≥10% above trend, sustained 60 days', bonus: 5000, stretch: null, note: 'The bottom line — growth beyond what the trend already predicted.' },
] as const

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border-subtle bg-card p-5 ${className}`}>{children}</div>
}

export default function MedmartBonusStructure() {
  const [revenue, setRevenue] = useState(300000) // prior 2-yr AVG monthly revenue ($)
  const [model, setModel] = useState<'milestone' | 'overall'>('milestone')

  const calc = useMemo(() => {
    const annual = revenue * 12
    const incAnnual10 = annual * 0.10            // +10% overall growth above trend
    const recoveryYr = Math.min(revenue * 0.05 * 3 * 0.03, 2000) * 4 // ~5% of rev recovered, 3%, capped/qtr
    const maxBonus = 1500 + 1000 + recoveryYr + 5000 + 1500 /* cvr stretch */
    return { incAnnual10, recoveryYr, maxBonus, roi: incAnnual10 / maxBonus }
  }, [revenue])

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
          <Link to="/medmart" className="flex items-center gap-2 text-sm text-muted hover:text-ink"><span aria-hidden>←</span> MedMart</Link>
          <span className="ml-auto rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-light">Internal · not on the roadmap</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <section>
          <span className="font-display text-xs font-semibold tracking-widest text-gold">PERFORMANCE BONUS</span>
          <h1 className="mt-1 font-display text-4xl font-bold md:text-5xl">Pay for results, not promises.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Four numbers, each measured against your <strong className="text-ink">prior two years</strong> so seasonality and normal growth are
            already accounted for. A bonus pays only when a metric clearly beats that history and holds. It’s
            <strong className="text-ink"> self-funding</strong> — every payout is a small slice of the new revenue that earned it.
          </p>
        </section>

        {/* principles */}
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { h: 'Verifiable', b: 'GA4 · Magento reports · Klaviyo — the same dashboards either side can open.' },
            { h: '2-year baseline', b: 'Benchmarked on the trailing 24 months, not a cherry-picked window.' },
            { h: 'Sustained', b: 'A gain must hold (30 days; 60 for overall growth) — no one-week flukes.' },
            { h: 'Self-funding', b: 'Each bonus is a fraction of the incremental revenue it reflects.' },
          ].map(p => (
            <Card key={p.h}><div className="font-display text-base font-semibold text-ink">{p.h}</div><p className="mt-1.5 text-sm text-muted">{p.b}</p></Card>
          ))}
        </section>

        {/* the four metrics */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">The four metrics</h2>
          <div className="mt-4 space-y-3">
            {METRICS.map(m => (
              <Card key={m.key} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="sm:w-52 shrink-0">
                  <div className="font-display text-lg font-semibold text-ink">{m.name}</div>
                  <div className="text-xs text-muted">{m.basis}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-ink">Target: <span className="text-gold-light">{m.target}</span></div>
                  <div className="mt-0.5 text-sm text-muted">{m.note}</div>
                </div>
                <div className="sm:w-36 sm:text-right">
                  <div className="font-display text-xl font-bold text-emerald-300">{typeof m.bonus === 'number' ? usd(m.bonus) : m.bonus}</div>
                  {m.stretch && <div className="text-xs text-muted">stretch: {m.stretch}</div>}
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">Each milestone pays once. Conversion and AOV are simple percentage lifts over the 2-year average; recovery is net-new email revenue; overall growth is the bottom-line check that ties it all together.</p>
        </section>

        {/* ROI calculator */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">What it’s worth</h2>
          <p className="mt-1 text-sm text-muted">Set the prior 2-year average monthly revenue to your real number — the math updates.</p>
          <Card className="mt-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Prior 2-year average monthly revenue</span>
              <div className="mt-2 flex items-center gap-4">
                <input type="range" min={50000} max={1000000} step={10000} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-gold" />
                <span className="w-32 text-right font-display text-xl font-bold text-gold-light">{usd(revenue)}</span>
              </div>
            </label>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">+10% growth = / yr</div><div className="mt-1 font-display text-2xl font-bold text-emerald-300">{usd(calc.incAnnual10)}</div><div className="text-xs text-muted">above the 2-year trend</div></div>
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">Max bonus / yr</div><div className="mt-1 font-display text-2xl font-bold text-ink">{usd(calc.maxBonus)}</div><div className="text-xs text-muted">if every metric is hit</div></div>
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">Return on the program</div><div className="mt-1 font-display text-2xl font-bold text-gold-light">{calc.roi.toFixed(0)}×</div><div className="text-xs text-muted">incremental ÷ total bonus</div></div>
            </div>
            <p className="mt-3 text-xs text-muted">At {usd(revenue)}/mo, beating the trend by 10% adds ~{usd(calc.incAnnual10)} a year. The entire bonus, even if everything pays, is about {(100 / calc.roi).toFixed(1)}% of that.</p>
          </Card>
        </section>

        {/* payout model */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">How it pays out</h2>
          <div className="mt-3 inline-flex rounded-lg border border-border-subtle bg-surface p-1">
            {(['milestone', 'overall'] as const).map(m => (
              <button key={m} onClick={() => setModel(m)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${model === m ? 'bg-gold text-bg' : 'text-muted hover:text-ink'}`}>
                {m === 'milestone' ? 'Per-milestone' : 'Single overall goal'}
              </button>
            ))}
          </div>
          <Card className="mt-4 text-sm leading-relaxed text-muted">
            {model === 'milestone' ? (
              <p><strong className="text-ink">Pay as you go.</strong> Each of the four metrics is checked monthly and paid the next cycle once it has held. Rewards each win as it lands and spreads the cost across the gains that fund it.</p>
            ) : (
              <p><strong className="text-ink">One goal, one bonus.</strong> A single <span className="text-gold-light">$5,000</span> payout when overall revenue runs ≥10% above the prior 2-year trend, sustained 60 days. Simplest to administer; pays purely on the bottom line.</p>
            )}
          </Card>
        </section>

        {/* rules */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">The rules, in plain terms</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[
              'Baseline = the trailing 24 months (prior 2 years), so normal growth and seasonality don’t count as “lift.”',
              'A gain counts only after it holds 30 consecutive days (60 for overall revenue growth).',
              'Everything is read from GA4 / Magento sales reports / Klaviyo — no judgment calls.',
              'Attribution stays conservative: gains clearly driven by paid traffic or pricing outside this scope don’t pay.',
              'Each milestone pays once; the program is capped, so the cost is always known up front.',
              'Dollar amounts are a starting proposal — easy to adjust; the logic holds at any scale.',
            ].map((t, i) => <li key={i} className="flex gap-2"><span className="mt-0.5 text-gold">•</span><span>{t}</span></li>)}
          </ul>
        </section>

        <footer className="mt-12 border-t border-border-subtle pt-6 text-xs leading-relaxed text-muted">
          Figures are illustrative until the 2-year baseline is pulled from Magento/GA. The structure is meant to be affordable
          (self-funding from incremental revenue), achievable (targets start at a realistic +10%), and transparent (every metric is
          independently verifiable against your own history).
        </footer>
      </main>
    </div>
  )
}
