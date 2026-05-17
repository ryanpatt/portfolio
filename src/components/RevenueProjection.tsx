import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fmtUSD,
  projections,
  type ScenarioKey,
  simulate,
  summarize,
} from '../data/kloyProjections'

const COLORS = {
  conservative: '#60a5fa', // blue-400
  base: '#10b981',         // emerald-500
  aggressive: '#f97316',   // orange-500
}

export function RevenueProjection({ projectSlug }: { projectSlug: string }) {
  const config = projections[projectSlug]
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('base')

  if (!config) return null

  const scenario = config.scenarios.find((s) => s.key === scenarioKey) ?? config.scenarios[0]
  const series = useMemo(
    () => simulate(scenario, config.unit.arpaMonthlyCents),
    [scenario, config.unit.arpaMonthlyCents],
  )
  const summary = useMemo(() => summarize(series), [series])

  // Chart-friendly data (convert cents → dollars for nice axis values)
  const mrrSeries = series.map((d) => ({
    month: d.month,
    mrr: Math.round(d.mrrCents / 100),
    customers: d.customers,
  }))

  const yearBars = [
    { year: 'Year 1 ARR', value: Math.round(summary.y1AnnualizedCents / 100) },
    { year: 'Year 2 ARR', value: Math.round(summary.y2AnnualizedCents / 100) },
    { year: 'Year 3 ARR', value: Math.round(summary.y3AnnualizedCents / 100) },
  ]

  const accent = COLORS[scenarioKey]
  const gradientId = `area-${scenarioKey}`

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 className="font-semibold text-xl md:text-2xl text-zinc-50">Revenue projection</h2>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Modeled — not actuals</span>
      </div>

      {/* Scenario toggle */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 inline-flex flex-wrap gap-1">
        {config.scenarios.map((s) => (
          <button
            key={s.key}
            onClick={() => setScenarioKey(s.key)}
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
      <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-2xl">
        {scenario.blurb}
      </p>

      {/* Stat strip */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Year 1 ARR"   value={fmtUSD(summary.y1AnnualizedCents, { compact: true })} accent={accent} />
        <Stat label="Year 2 ARR"   value={fmtUSD(summary.y2AnnualizedCents, { compact: true })} accent={accent} />
        <Stat label="Year 3 ARR"   value={fmtUSD(summary.y3AnnualizedCents, { compact: true })} accent={accent} />
        <Stat
          label={`${config.customerNoun} (M36)`}
          value={summary.y3Customers.toLocaleString()}
          accent={accent}
        />
      </div>

      {/* MRR over time (area chart) */}
      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-medium text-zinc-100">Monthly recurring revenue · 36 months</h3>
          <span className="text-xs text-zinc-500">{config.revenueNoun}</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrSeries} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                tickFormatter={(m) => (m % 6 === 0 ? `M${m}` : '')}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `$${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1000
                    ? `$${(v / 1000).toFixed(0)}K`
                    : `$${v}`
                }
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e4e4e7' }}
                formatter={(value, name) => {
                  const v = Number(value)
                  if (name === 'mrr') return [`$${v.toLocaleString()}`, 'MRR'] as [string, string]
                  return [String(value), String(name)] as [string, string]
                }}
                labelFormatter={(m) => `Month ${m}`}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke={accent}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-up: ARR-by-year bar + customer count line */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
          <h3 className="font-medium text-zinc-100 mb-2">ARR by year</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearBars} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1000 ? `$${(v / 1000).toFixed(0)}K`
                    : `$${v}`
                  }
                  width={56}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e4e4e7' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'ARR'] as [string, string]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {yearBars.map((_, i) => (
                    <Cell key={i} fill={accent} fillOpacity={0.55 + i * 0.2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
          <h3 className="font-medium text-zinc-100 mb-2">{config.customerNoun} over time</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrSeries} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(m) => (m % 6 === 0 ? `M${m}` : '')}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  width={42}
                  tickFormatter={(v) => v.toString()}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e4e4e7' }}
                  formatter={(value) => [Number(value).toLocaleString(), config.customerNoun] as [string, string]}
                  labelFormatter={(m) => `Month ${m}`}
                />
                <Area
                  type="monotone"
                  dataKey="customers"
                  stroke="#a1a1aa"
                  strokeWidth={2}
                  fill="#a1a1aa"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assumptions footnote */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 select-none">
          Show model assumptions
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400 grid sm:grid-cols-2 gap-3">
          <Row label="Starting customers" value={String(scenario.startingCustomers)} />
          <Row label="ARPA / month" value={fmtUSD(config.unit.arpaMonthlyCents)} />
          <Row label="New / mo · Y1" value={String(scenario.monthlyNewCustomersY1)} />
          <Row label="New / mo · Y2" value={String(scenario.monthlyNewCustomersY2)} />
          <Row label="New / mo · Y3" value={String(scenario.monthlyNewCustomersY3)} />
          <Row label="Monthly churn" value={`${(scenario.monthlyChurn * 100).toFixed(1)}%`} />
          <Row label="Cumulative 36-mo revenue" value={fmtUSD(summary.cum36Cents, { compact: true })} />
          <Row label="Modeled label" value="Forward-looking; depends on execution" />
        </div>
      </details>
    </section>
  )
}

export function UnitEconomics({ projectSlug }: { projectSlug: string }) {
  const config = projections[projectSlug]
  if (!config) return null
  const u = config.unit
  const ltvCacRatio = u.ltvCents / u.cacCents
  const monthlyMargin = Math.round(u.arpaMonthlyCents * u.grossMarginPct - (config.costPerCustomerCents ?? 0))

  return (
    <section className="mt-10">
      <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">Unit economics</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="ARPA / month" value={fmtUSD(u.arpaMonthlyCents)} accent="#a1a1aa" />
        <Stat label="Gross margin" value={`${Math.round(u.grossMarginPct * 100)}%`} accent="#10b981" />
        <Stat label="CAC" value={fmtUSD(u.cacCents)} accent="#f97316" />
        <Stat label="Payback" value={`${u.paybackMonths} mo`} accent="#60a5fa" />
        <Stat label="LTV" value={fmtUSD(u.ltvCents, { compact: true })} accent="#10b981" />
        <Stat label="LTV / CAC" value={`${ltvCacRatio.toFixed(1)}×`} accent={ltvCacRatio >= 3 ? '#10b981' : '#f97316'} />
        <Stat label="Margin / customer / mo" value={fmtUSD(monthlyMargin)} accent="#a1a1aa" />
        <Stat label="Sanity" value={ltvCacRatio >= 3 ? 'Healthy' : 'Marginal'} accent={ltvCacRatio >= 3 ? '#10b981' : '#f97316'} />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Rule of thumb: LTV ≥ 3× CAC and payback ≤ 12 months is the canonical SaaS health check. Anything past that
        suggests room to spend more on acquisition.
      </p>
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1.5 text-lg font-semibold" style={{ color: accent ?? '#fafafa' }}>
        {value}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  )
}
