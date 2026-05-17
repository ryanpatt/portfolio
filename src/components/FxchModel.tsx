import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  scenarios,
  simulate,
  summarize,
  perOrderEconomics,
  headcountCost,
  fmtUSD,
  fmtPct,
  type Assumptions,
  type ScenarioKey,
} from '../data/fxchProjections'

const SCENARIO_COLOR: Record<ScenarioKey, string> = {
  bear: '#f97316',   // orange
  base: '#10b981',   // emerald
  bull: '#60a5fa',   // blue
}

export default function FxchModel() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('base')
  const scenario = scenarios.find((s) => s.key === scenarioKey)!
  const [a, setA] = useState<Assumptions>(scenario.assumptions)

  // Switching scenario resets the editable assumptions
  const onScenarioChange = (k: ScenarioKey) => {
    setScenarioKey(k)
    const s = scenarios.find((x) => x.key === k)!
    setA(s.assumptions)
  }

  const rows = useMemo(() => simulate(a), [a])
  const summary = useMemo(() => summarize(rows), [rows])
  const eco = useMemo(() => perOrderEconomics(a), [a])
  const accent = SCENARIO_COLOR[scenarioKey]

  // Chart data
  const cashChart = rows.map((r) => ({
    month: r.month,
    cash: Math.round(r.cumulativeCash),
    revenue: Math.round(r.ftchGrossRevenue),
  }))
  const gmvChart = rows.map((r) => ({
    month: r.month,
    gmv: Math.round(r.gmv),
  }))
  const yearBars = [
    { year: 'Year 1', gmv: Math.round(summary.y1Gmv), revenue: Math.round(summary.y1Revenue) },
    { year: 'Year 2', gmv: Math.round(summary.y2Gmv), revenue: Math.round(summary.y2Revenue) },
    { year: 'Year 3', gmv: Math.round(summary.y3Gmv), revenue: Math.round(summary.y3Revenue) },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link
          to="/kloy/fxch"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-8"
        >
          ← FTCH POLC overview
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
            Interactive model
          </span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-zinc-700/40 text-zinc-300 border-zinc-600">
            Edit any assumption
          </span>
        </div>

        <h1 className="font-semibold text-4xl md:text-6xl text-zinc-50 leading-[1.05]">
          FTCH — Financial Model
        </h1>
        <p className="mt-4 text-zinc-300 leading-relaxed text-lg md:text-xl">
          A 36-month projection with editable assumptions. Every number is defended
          below the model. Don&apos;t take the defaults on faith — adjust them and
          see what breaks.
        </p>

        {/* ============================================ */}
        {/* Scenario selector */}
        {/* ============================================ */}
        <section className="mt-10">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-3">Scenario</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 inline-flex flex-wrap gap-1">
            {scenarios.map((s) => (
              <button
                key={s.key}
                onClick={() => onScenarioChange(s.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  scenarioKey === s.key
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl">
            {scenario.blurb}
          </p>
        </section>

        {/* ============================================ */}
        {/* Headline numbers */}
        {/* ============================================ */}
        <section className="mt-10">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">Headline numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Funding need"
              value={fmtUSD(summary.peakCashNeed, { compact: true })}
              sub="Max cumulative burn over 36 months"
              tone="amber"
            />
            <Stat
              label="Break-even month"
              value={summary.breakEvenMonth ? `M${summary.breakEvenMonth}` : 'Not in 36 mo'}
              sub={summary.breakEvenMonth ? 'First profitable month' : 'Needs more time or different fees'}
              tone={summary.breakEvenMonth ? 'emerald' : 'red'}
            />
            <Stat
              label="Year 3 GMV"
              value={fmtUSD(summary.y3Gmv, { compact: true })}
              sub="Total value of orders processed"
            />
            <Stat
              label="Year 3 revenue"
              value={fmtUSD(summary.y3Revenue, { compact: true })}
              sub="FTCH gross (delivery + onboarding)"
            />
            <Stat
              label="Final active markets"
              value={String(summary.finalMarkets)}
            />
            <Stat
              label="Final active merchants"
              value={String(summary.finalMerchants)}
            />
            <Stat
              label="Final monthly orders"
              value={summary.finalMonthlyOrders.toLocaleString()}
            />
            <Stat
              label="Final net margin"
              value={fmtPct(summary.netMarginAtEnd)}
              tone={summary.netMarginAtEnd > 0 ? 'emerald' : 'red'}
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* Per-order economics callout */}
        {/* ============================================ */}
        <section className="mt-10">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">
            Per-order economics
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
              <Row label="Customer charged" value={fmtUSD(eco.customerCharge)} />
              <Row label="Stripe fee" value={`−${fmtUSD(eco.stripeFee)}`} />
              <Row label="FTCH delivery share (gross)" value={fmtUSD(eco.ftchDeliveryGross)} />
              <Row label="Driver payout from FTCH cut" value={`−${fmtUSD(eco.driverPayout)}`} />
              <Row label="FTCH item-markup revenue" value={fmtUSD(eco.ftchMarkupRevenue)} />
              <Row label="FTCH gross per order" value={fmtUSD(eco.ftchTotalGross)} />
              <Row
                label="FTCH net per order (after Stripe)"
                value={fmtUSD(eco.ftchNetAfterStripe)}
                emphasis={eco.ftchNetAfterStripe < 0 ? 'bad' : 'good'}
              />
            </div>
            {eco.ftchNetAfterStripe < 0 && (
              <p className="mt-4 text-sm text-amber-300 leading-relaxed">
                <strong>Honest read:</strong> at these settings, FTCH loses money on
                every order before paying for infra, headcount, or marketing. Revenue
                has to come from onboarding fees alone, or from raising the delivery
                fee, lowering the driver share, or taking a markup cut on items.
                Try moving the sliders below.
              </p>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* Charts */}
        {/* ============================================ */}
        <section className="mt-10">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">Cumulative cash</h2>
          <p className="text-sm text-zinc-400 mb-3">
            The lowest point on this curve is the funding you actually need. Anything
            above zero is profit. Anything below is burn.
          </p>
          <div className="h-72 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashChart}>
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(v) => fmtUSD(v, { compact: true })}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmtUSD(Number(v))}
                  labelFormatter={(l) => `Month ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="cash"
                  stroke={accent}
                  strokeWidth={2}
                  fill="url(#cashGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">Monthly GMV</h2>
          <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gmvChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(v) => fmtUSD(v, { compact: true })}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmtUSD(Number(v))}
                  labelFormatter={(l) => `Month ${l}`}
                />
                <Line type="monotone" dataKey="gmv" stroke={accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">By year</h2>
          <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(v) => fmtUSD(v, { compact: true })}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => fmtUSD(Number(v))}
                />
                <Bar dataKey="gmv" name="GMV" fill={accent} radius={[6, 6, 0, 0]}>
                  {yearBars.map((_, i) => (
                    <Cell key={i} fill={accent} fillOpacity={0.4} />
                  ))}
                </Bar>
                <Bar dataKey="revenue" name="FTCH Revenue" fill={accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ============================================ */}
        {/* Sliders */}
        {/* ============================================ */}
        <section className="mt-12">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-2">Pressure-test the model</h2>
          <p className="text-sm text-zinc-400 mb-4 max-w-3xl">
            Adjust any input. The headline numbers and charts update live. The
            scenario switch above resets these back to that scenario&apos;s defaults.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <SliderGroup title="Market ramp">
              <Slider
                label="Months between launches"
                value={a.monthsBetweenLaunches}
                min={1}
                max={6}
                step={1}
                onChange={(v) => setA({ ...a, monthsBetweenLaunches: v })}
                unit=" mo"
              />
              <Slider
                label="Merchants per mature market"
                value={a.merchantsPerMarketMature}
                min={3}
                max={30}
                step={1}
                onChange={(v) => setA({ ...a, merchantsPerMarketMature: v })}
              />
              <Slider
                label="Orders per merchant per day (mature)"
                value={a.ordersPerMerchantDayMature}
                min={1}
                max={15}
                step={1}
                onChange={(v) => setA({ ...a, ordersPerMerchantDayMature: v })}
              />
              <Slider
                label="Months to mature merchants"
                value={a.monthsToMatureMerchants}
                min={1}
                max={18}
                step={1}
                onChange={(v) => setA({ ...a, monthsToMatureMerchants: v })}
                unit=" mo"
              />
              <Slider
                label="Months to mature orders"
                value={a.monthsToMatureOrders}
                min={1}
                max={18}
                step={1}
                onChange={(v) => setA({ ...a, monthsToMatureOrders: v })}
                unit=" mo"
              />
              <Slider
                label="Monthly merchant churn"
                value={a.merchantChurnMonthly * 100}
                min={0}
                max={15}
                step={0.5}
                onChange={(v) => setA({ ...a, merchantChurnMonthly: v / 100 })}
                unit="%"
              />
            </SliderGroup>

            <SliderGroup title="Per-order economics">
              <Slider
                label="Average item value"
                value={a.averageItemValue}
                min={10}
                max={60}
                step={1}
                onChange={(v) => setA({ ...a, averageItemValue: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Delivery fee"
                value={a.deliveryFee}
                min={1}
                max={10}
                step={0.5}
                onChange={(v) => setA({ ...a, deliveryFee: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Average tip"
                value={a.tip}
                min={0}
                max={8}
                step={0.5}
                onChange={(v) => setA({ ...a, tip: v })}
                unit="$"
                prefix
              />
              <Slider
                label="FTCH share of delivery fee"
                value={a.ftchShareOfDelivery * 100}
                min={20}
                max={100}
                step={5}
                onChange={(v) => setA({ ...a, ftchShareOfDelivery: v / 100 })}
                unit="%"
              />
              <Slider
                label="Driver share of FTCH's cut"
                value={a.driverShareOfFtchCut * 100}
                min={0}
                max={100}
                step={5}
                onChange={(v) => setA({ ...a, driverShareOfFtchCut: v / 100 })}
                unit="%"
              />
              <Slider
                label="FTCH item markup take"
                value={a.itemMarkupTakenByFtch * 100}
                min={0}
                max={20}
                step={0.5}
                onChange={(v) => setA({ ...a, itemMarkupTakenByFtch: v / 100 })}
                unit="%"
              />
            </SliderGroup>

            <SliderGroup title="Onboarding fees">
              <Slider
                label="Registration fee"
                value={a.merchantRegistrationFee}
                min={0}
                max={300}
                step={10}
                onChange={(v) => setA({ ...a, merchantRegistrationFee: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Tech assessment fee"
                value={a.merchantOnboardingFee}
                min={0}
                max={300}
                step={5}
                onChange={(v) => setA({ ...a, merchantOnboardingFee: v })}
                unit="$"
                prefix
              />
            </SliderGroup>

            <SliderGroup title="Costs">
              <Slider
                label="Base infra / mo"
                value={a.infraBaseMonthly}
                min={100}
                max={2000}
                step={50}
                onChange={(v) => setA({ ...a, infraBaseMonthly: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Infra per market / mo"
                value={a.infraPerMarketMonthly}
                min={0}
                max={500}
                step={10}
                onChange={(v) => setA({ ...a, infraPerMarketMonthly: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Market launch marketing"
                value={a.marketLaunchCost}
                min={0}
                max={10000}
                step={250}
                onChange={(v) => setA({ ...a, marketLaunchCost: v })}
                unit="$"
                prefix
              />
              <Slider
                label="Insurance / mo"
                value={a.insuranceMonthly}
                min={0}
                max={5000}
                step={100}
                onChange={(v) => setA({ ...a, insuranceMonthly: v })}
                unit="$"
                prefix
              />
            </SliderGroup>
          </div>
        </section>

        {/* ============================================ */}
        {/* Headcount */}
        {/* ============================================ */}
        <section className="mt-12">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">
            Headcount cost (step function)
          </h2>
          <p className="text-sm text-zinc-400 mb-4 max-w-3xl">
            Salaries are the largest line item. This is a deliberate step function —
            you cannot run 25 markets on the Phase 1 team. These numbers assume
            US-based comp with founders partially deferred.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[1, 7, 13, 25].map((m) => {
              const h = headcountCost(m)
              return (
                <div key={m} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="text-zinc-100 font-medium">{h.phase}</div>
                    <div className="text-zinc-100 font-mono">{fmtUSD(h.monthly)}/mo</div>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mb-2">
                    Starting month {m}
                  </div>
                  <div className="text-sm text-zinc-400 leading-relaxed">{h.detail}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ============================================ */}
        {/* What this assumes */}
        {/* ============================================ */}
        <section className="mt-12">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">
            What this model assumes (every number defended)
          </h2>
          <ul className="space-y-2.5 text-zinc-300 leading-relaxed">
            <Bullet>
              <strong>$25 AOV</strong> — small-town avg basket. Urban averages are
              $30–40, but FTCH targets towns with diners, pizza, grocery, hardware —
              not steakhouses.
            </Bullet>
            <Bullet>
              <strong>$4 delivery fee, $3 tip</strong> — middle of the master
              plan&apos;s stated $2.99–$5.99 range, with a tip closer to small-town
              norms (smaller than urban $5–7).
            </Bullet>
            <Bullet>
              <strong>75% FTCH delivery share, 60% driver payout from that share</strong>
              {' '}— exactly as stated in master plan §7. <em>This is where the model
              gets uncomfortable</em>: at $4 fee, FTCH retains $1.20 gross per order
              before Stripe takes $1.23 in fees. Per-order net is roughly zero, which
              means platform revenue has to come from onboarding fees or item markup.
            </Bullet>
            <Bullet>
              <strong>4% monthly merchant churn</strong> — roughly 38% annualized.
              This is consistent with SMB retail churn benchmarks. The master plan
              targets 85% 90-day retention; that&apos;s 5% monthly churn implied —
              this model is slightly more optimistic than that.
            </Bullet>
            <Bullet>
              <strong>2.9% + $0.30 Stripe fees on full transaction</strong> — Stripe
              Connect&apos;s standard. Platform pays it unless explicitly passed to
              customer (which would hurt conversion).
            </Bullet>
            <Bullet>
              <strong>Headcount step function</strong> — Phase 1 = 4–5 people at
              $35k/mo cash burn, Phase 1.5 = 7 at $75k/mo, Phase 2 = 15 at $165k/mo,
              Phase 3 = 25 at $280k/mo. Founder/CTO included at conservative comp.
            </Bullet>
            <Bullet>
              <strong>$3,000 per market launch</strong> — direct mail ($2k for
              5k-home town) + ads + branded merch + community manager onboarding.
            </Bullet>
            <Bullet>
              <strong>Markets, merchants, and orders all ramp gradually</strong>{' '}
              — no market opens with all 12 merchants and 5 orders/day on day one.
              The ramp curves are linear; reality is messier (J-curve common).
            </Bullet>
          </ul>
        </section>

        {/* ============================================ */}
        {/* What this can't tell you */}
        {/* ============================================ */}
        <section className="mt-12">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">
            What this model can&apos;t tell you
          </h2>
          <ul className="space-y-2.5 text-zinc-300 leading-relaxed">
            <Bullet tone="amber">
              <strong>Whether towns will actually order.</strong> The model takes
              orders-per-merchant-per-day as an input. The only way to know the real
              number is to launch a pilot. Defaults are based on industry small-town
              benchmarks, not FTCH data — because there isn&apos;t any yet.
            </Bullet>
            <Bullet tone="amber">
              <strong>Whether $99 + $75 onboarding fees stick.</strong> A non-trivial
              fraction of merchants will refuse at the door, especially in towns
              that&apos;ve never paid for software. The model assumes 100%
              conversion of attempted onboardings — that&apos;s wrong, but the right
              number is unknown until you sell.
            </Bullet>
            <Bullet tone="amber">
              <strong>Driver supply elasticity.</strong> The model assumes drivers
              show up to meet demand. In rural areas, this is the single biggest
              operational risk and it&apos;s not modeled.
            </Bullet>
            <Bullet tone="amber">
              <strong>Fundraising friction and dilution.</strong> Peak cash need
              isn&apos;t the same as fundraising target. Add ~20% buffer + assume
              dilution costs.
            </Bullet>
          </ul>
        </section>

        {/* ============================================ */}
        {/* What it'll need to get going */}
        {/* ============================================ */}
        <section className="mt-12">
          <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">
            What FTCH actually needs to get going
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 text-zinc-300 leading-relaxed">
            <div>
              <div className="text-zinc-100 font-medium mb-1">1. Money: {fmtUSD(summary.peakCashNeed, { compact: true })} (this scenario) + ~20% buffer</div>
              <p className="text-sm text-zinc-400">
                The cumulative-cash chart bottoms at {fmtUSD(summary.peakCashNeed, { compact: true })}.
                Real fundraising should target {fmtUSD(summary.peakCashNeed * 1.2, { compact: true })}–
                {fmtUSD(summary.peakCashNeed * 1.5, { compact: true })} to absorb misses and dilution math.
                The master plan&apos;s $250k–$500k seed range only works in the bull
                case <em>and</em> with founders working unpaid.
              </p>
            </div>
            <div>
              <div className="text-zinc-100 font-medium mb-1">2. Team: 4–5 to pilot, ~9 by month 9, 15+ by month 18</div>
              <p className="text-sm text-zinc-400">
                Pilot can run on founder + CTO + tech specialist + 2 community
                managers. By month 9 the engineering load and ops support burden
                forces 2 more engineers + 1 ops coordinator. Phase 2 requires real
                middle management.
              </p>
            </div>
            <div>
              <div className="text-zinc-100 font-medium mb-1">3. Two pilot markets before raising</div>
              <p className="text-sm text-zinc-400">
                Get to ~4 months of live data in 2 towns. Real numbers replace this
                model&apos;s defaults: actual orders/merchant/day, actual driver
                acceptance, actual merchant churn. That&apos;s the only data that
                changes the funding ask from a guess to a defended number.
              </p>
            </div>
            <div>
              <div className="text-zinc-100 font-medium mb-1">4. A revenue answer that isn&apos;t &quot;onboarding fees forever&quot;</div>
              <p className="text-sm text-zinc-400">
                Per-order economics are flat-to-negative at the master plan&apos;s
                stated splits. Either delivery fees go up, driver share goes down,
                FTCH takes an item markup cut, or onboarding fees become recurring
                (e.g., $29/mo SaaS layer). Pick one before launch — don&apos;t leave
                it to discovery.
              </p>
            </div>
            <div>
              <div className="text-zinc-100 font-medium mb-1">5. A productized launch motion before market #3</div>
              <p className="text-sm text-zinc-400">
                The 8-week pre-launch checklist works for 2 markets. It does not
                work for 25. Either the playbook becomes a checklist a community
                manager can run in 3 weeks, or the Phase 2 ramp slips by a year.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* CTA */}
        {/* ============================================ */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          <div className="font-medium text-zinc-100 mb-1">Want this as a spreadsheet?</div>
          <p>
            This model can also be exported as an .xlsx with the same formulas and
            scenarios — useful if you need to share with a CFO or investor who lives
            in Excel. Just ask.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href="mailto:r.patt9134@gmail.com" className="text-zinc-200 hover:text-white underline">r.patt9134@gmail.com</a>
            <span className="text-zinc-600">·</span>
            <Link to="/kloy/fxch" className="text-zinc-200 hover:text-white underline">Back to POLC overview</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================================
// Subcomponents
// =========================================================

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'emerald' | 'amber' | 'red'
}) {
  const valueClass = tone
    ? {
        emerald: 'text-emerald-300',
        amber: 'text-amber-300',
        red: 'text-red-300',
      }[tone]
    : 'text-zinc-50'
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1.5 text-xl font-semibold ${valueClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-zinc-500 leading-tight">{sub}</div> : null}
    </div>
  )
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: 'good' | 'bad'
}) {
  const valueClass = emphasis === 'bad'
    ? 'text-red-300'
    : emphasis === 'good'
    ? 'text-emerald-300'
    : 'text-zinc-100'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-mono ${valueClass}`}>{value}</span>
    </div>
  )
}

function SliderGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  prefix,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
  prefix?: boolean
}) {
  const display = prefix && unit ? `${unit}${value}` : `${value}${unit ?? ''}`
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-mono text-zinc-100">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full mt-1 accent-emerald-400"
      />
    </div>
  )
}

function Bullet({ children, tone }: { children: React.ReactNode; tone?: 'amber' }) {
  const dotClass = tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <li className="flex gap-2.5 leading-relaxed">
      <span className={`mt-2 size-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span>{children}</span>
    </li>
  )
}
