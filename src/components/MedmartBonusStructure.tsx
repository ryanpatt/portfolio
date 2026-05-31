import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

/*  MedMart performance-bonus structure (route: /medmart/bonus-structure)
    Standalone — intentionally NOT linked from the public roadmap.
    Pay only for verified, sustained lift over a frozen baseline. Self-funding. */

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
const pct = (n: number) => n + '%'

type Tier = { lift: number; bonus: number }
const CVR_TIERS: Tier[] = [{ lift: 5, bonus: 750 }, { lift: 10, bonus: 1500 }, { lift: 15, bonus: 2500 }, { lift: 20, bonus: 4000 }]
const AOV_TIERS: Tier[] = [{ lift: 5, bonus: 500 }, { lift: 10, bonus: 1000 }]
const RECOVERY_RATE = 3 // % of verified recovered revenue
const RECOVERY_CAP = 2000 // per quarter
const PAYMENT_BONUS = 500 // +3pt approval, one-time
const OVERALL_BONUS = 5000 // +15% revenue/visitor sustained 60 days

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border-subtle bg-card p-5 ${className}`}>{children}</div>
}

export default function MedmartBonusStructure() {
  const [revenue, setRevenue] = useState(300000) // baseline monthly revenue ($)
  const [model, setModel] = useState<'milestone' | 'overall'>('milestone')

  const calc = useMemo(() => {
    const cvr = CVR_TIERS.map(t => {
      const incMonthly = revenue * (t.lift / 100)
      return { ...t, incMonthly, incAnnual: incMonthly * 12, roi: (incMonthly * 12) / t.bonus }
    })
    const aov = AOV_TIERS.map(t => {
      const incMonthly = revenue * (t.lift / 100)
      return { ...t, incMonthly, incAnnual: incMonthly * 12, roi: (incMonthly * 12) / t.bonus }
    })
    const recoveredMonthly = revenue * 0.05 // mature flows ~5% of revenue (illustrative)
    const recoveryBonusYr = Math.min(recoveredMonthly * 3 * (RECOVERY_RATE / 100), RECOVERY_CAP) * 4
    const maxBonus = CVR_TIERS.reduce((s, t) => s + t.bonus, 0) + AOV_TIERS.reduce((s, t) => s + t.bonus, 0) + PAYMENT_BONUS + recoveryBonusYr + OVERALL_BONUS
    const blendedIncAnnual = revenue * 0.15 * 12 // overall +15% rev/visitor
    return { cvr, aov, recoveredMonthly, recoveryBonusYr, maxBonus, blendedIncAnnual, programRoi: blendedIncAnnual / maxBonus }
  }, [revenue])

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link to="/medmart" className="flex items-center gap-2 text-sm text-muted hover:text-ink"><span aria-hidden>←</span> MedMart</Link>
          <span className="ml-auto rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-light">Internal · not on the roadmap</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section>
          <span className="font-display text-xs font-semibold tracking-widest text-gold">PERFORMANCE BONUS</span>
          <h1 className="mt-1 font-display text-4xl font-bold md:text-5xl">Pay for results, not promises.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            A bonus that pays out only on <strong className="text-ink">verified, sustained lift</strong> over a frozen baseline — measured in
            tools you already own. It’s designed to be <strong className="text-ink">self-funding</strong>: every payout is a small fraction of
            the new revenue that earned it. Low risk to the business, real upside for the work.
          </p>
        </section>

        {/* principles */}
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { h: 'Verifiable', b: 'GA4 · Magento reports · Klaviyo · Authorize.net — no judgment calls.' },
            { h: 'Baseline-frozen', b: 'A 30-day pre-project baseline is locked before any payout math.' },
            { h: 'Sustained', b: 'A lift must hold for 30 consecutive days to count — no flukes.' },
            { h: 'Conservative', b: 'Attribution favors the business; ambiguous gains don’t pay.' },
          ].map(p => (
            <Card key={p.h}><div className="font-display text-base font-semibold text-ink">{p.h}</div><p className="mt-1.5 text-sm text-muted">{p.b}</p></Card>
          ))}
        </section>

        {/* calculator */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">ROI calculator</h2>
          <p className="mt-1 text-sm text-muted">Set the baseline monthly revenue to your real number — every figure below updates. (Defaults are illustrative until the baseline is frozen.)</p>
          <Card className="mt-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Baseline monthly online revenue</span>
              <div className="mt-2 flex items-center gap-4">
                <input type="range" min={50000} max={1000000} step={10000} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-gold" />
                <span className="w-32 text-right font-display text-xl font-bold text-gold-light">{usd(revenue)}</span>
              </div>
            </label>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">Max bonus exposure / yr</div><div className="mt-1 font-display text-2xl font-bold text-ink">{usd(calc.maxBonus)}</div><div className="text-xs text-muted">if every tier is hit</div></div>
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">Incremental revenue / yr</div><div className="mt-1 font-display text-2xl font-bold text-emerald-300">{usd(calc.blendedIncAnnual)}</div><div className="text-xs text-muted">at the +15% overall goal</div></div>
              <div className="rounded-lg bg-surface p-4"><div className="text-xs uppercase tracking-wide text-muted">Return on the program</div><div className="mt-1 font-display text-2xl font-bold text-gold-light">{calc.programRoi.toFixed(0)}×</div><div className="text-xs text-muted">incremental ÷ total bonus</div></div>
            </div>
            <p className="mt-3 text-xs text-muted">In plain terms: at {usd(revenue)}/mo, hitting the overall goal adds ~{usd(calc.blendedIncAnnual)} a year. The entire bonus, even if everything pays out, is about {(100 / calc.programRoi).toFixed(1)}% of that.</p>
          </Card>
        </section>

        {/* tiers */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Milestone tiers</h2>
          <p className="mt-1 text-sm text-muted">Each rung pays once, when the metric crosses it and holds 30 days. Earn rungs as you climb.</p>

          <h3 className="mt-5 font-display text-lg font-semibold text-ink">Conversion rate <span className="text-sm font-normal text-muted">· site-wide, over frozen baseline</span></h3>
          <TierTable rows={calc.cvr} />

          <h3 className="mt-6 font-display text-lg font-semibold text-ink">Average order value <span className="text-sm font-normal text-muted">· merchandising, bundles, financing-forward</span></h3>
          <TierTable rows={calc.aov} />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Card>
              <div className="font-display text-base font-semibold text-ink">Recovered revenue <span className="text-sm font-normal text-muted">· email flows</span></div>
              <p className="mt-1.5 text-sm text-muted">{RECOVERY_RATE}% of Klaviyo-attributed recovered revenue (abandoned cart, browse, win-back), capped {usd(RECOVERY_CAP)}/quarter.</p>
              <div className="mt-2 text-sm text-emerald-300">≈ {usd(calc.recoveryBonusYr)}/yr at this revenue (illustrative)</div>
            </Card>
            <Card>
              <div className="font-display text-base font-semibold text-ink">Payment approval rate <span className="text-sm font-normal text-muted">· FDS fix</span></div>
              <p className="mt-1.5 text-sm text-muted">One-time {usd(PAYMENT_BONUS)} when the Authorize.net approval rate improves ≥3 points, sustained 30 days — recovering legit declines.</p>
            </Card>
          </div>
        </section>

        {/* payment model */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">How it pays out</h2>
          <div className="mt-3 inline-flex rounded-lg border border-border-subtle bg-surface p-1">
            {(['milestone', 'overall'] as const).map(m => (
              <button key={m} onClick={() => setModel(m)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${model === m ? 'bg-gold text-bg' : 'text-muted hover:text-ink'}`}>
                {m === 'milestone' ? 'Per-milestone' : 'Single overall goal'}
              </button>
            ))}
          </div>
          <Card className="mt-4">
            {model === 'milestone' ? (
              <div className="text-sm leading-relaxed text-muted">
                <p><strong className="text-ink">Pay as you go.</strong> Each tier is verified at the end of the month and paid the following cycle once it has held 30 days. Keeps motivation tied to live results and spreads cost across the gains that fund it.</p>
                <p className="mt-2">Best when you want momentum and to reward each win as it lands.</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-muted">
                <p><strong className="text-ink">One goal, one bonus.</strong> A single payout of <span className="text-gold-light">{usd(OVERALL_BONUS)}</span> when the blended target — <strong className="text-ink">+15% revenue per visitor, sustained 60 days</strong> — is verified against the frozen baseline. Simplest to administer; pays only on the bottom-line outcome.</p>
                <p className="mt-2">Best when you want a single, unambiguous finish line tied to the roadmap.</p>
              </div>
            )}
          </Card>
        </section>

        {/* effort vs roi */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Effort vs. return</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-2">Workstream</th><th className="px-4 py-2">Effort</th><th className="px-4 py-2">Metric moved</th><th className="px-4 py-2">Bonus on success</th></tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {[
                  ['P0 fixes (add-to-cart, payment, popup)', 'S', 'Approval %, CTA reliability', usd(PAYMENT_BONUS)],
                  ['PDP trust + reviews + delivery', 'M', 'Conversion rate', 'CVR tiers'],
                  ['Email lifecycle flows', 'M', 'Recovered revenue', `${RECOVERY_RATE}% recovered`],
                  ['Merchandising + finder + offers', 'M', 'AOV, conversion', 'AOV + CVR tiers'],
                  ['Design refresh + funnel split', 'L', 'Blended rev/visitor', `Overall ${usd(OVERALL_BONUS)}`],
                ].map((r, i) => (
                  <tr key={i} className="text-ink"><td className="px-4 py-2.5">{r[0]}</td><td className="px-4 py-2.5 text-muted">{r[1]}</td><td className="px-4 py-2.5 text-muted">{r[2]}</td><td className="px-4 py-2.5 text-gold-light">{r[3]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* rules */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Verification & rules</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[
              'Baseline = the trailing 30 days before kickoff, frozen in writing once GA4 + Clarity are connected.',
              'A lift counts only after it holds 30 consecutive days against that baseline (60 for the overall goal).',
              'Metrics are read from GA4 / Magento sales reports / Klaviyo / Authorize.net — the same dashboards either side can open.',
              'Attribution is conservative: a metric clearly driven by paid-traffic or pricing changes outside this scope is excluded.',
              'Each milestone pays once; the program is capped at the figures above so cost is always known.',
              'Either party can request a monthly read-out; disputes resolve to the tool of record.',
            ].map((t, i) => <li key={i} className="flex gap-2"><span className="mt-0.5 text-gold">•</span><span>{t}</span></li>)}
          </ul>
        </section>

        <footer className="mt-12 border-t border-border-subtle pt-6 text-xs leading-relaxed text-muted">
          Dollar figures are a starting proposal and the calculator is illustrative until the baseline is frozen. The structure is meant to be
          affordable (self-funding from incremental revenue), achievable (tiers start at modest, realistic lifts), and transparent (every metric
          is independently verifiable). Adjust the tier amounts to taste — the logic holds at any scale.
        </footer>
      </main>
    </div>
  )
}

function TierTable({ rows }: { rows: { lift: number; bonus: number; incMonthly: number; incAnnual: number; roi: number }[] }) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border-subtle">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
          <tr><th className="px-4 py-2">Lift (sustained 30d)</th><th className="px-4 py-2">Incremental / mo</th><th className="px-4 py-2">Incremental / yr</th><th className="px-4 py-2">Bonus</th><th className="px-4 py-2">Return</th></tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map(r => (
            <tr key={r.lift} className="text-ink">
              <td className="px-4 py-2.5 font-medium">+{pct(r.lift)}</td>
              <td className="px-4 py-2.5 text-emerald-300">{usd(r.incMonthly)}</td>
              <td className="px-4 py-2.5 text-emerald-300">{usd(r.incAnnual)}</td>
              <td className="px-4 py-2.5 text-gold-light">{usd(r.bonus)}</td>
              <td className="px-4 py-2.5 text-muted">{r.roi.toFixed(0)}×</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
