import { Link } from 'react-router-dom'

export default function FxchPolc() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-8"
        >
          ← Home
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-amber-500/15 text-amber-300 border-amber-500/30">
            Internal honesty check
          </span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-300 border-blue-500/30">
            POLC analysis
          </span>
        </div>
        <h1 className="font-semibold text-4xl md:text-6xl text-zinc-50 leading-[1.05]">
          FTCH — POLC Analysis
        </h1>
        <p className="mt-3 text-zinc-400 text-sm uppercase tracking-wider">
          Planning · Organizing · Leading · Controlling
        </p>
        <p className="mt-4 text-zinc-300 leading-relaxed text-lg md:text-xl">
          An honest assessment of the FTCH Master Plan — strengths, gaps, and the
          calls that look optimistic. Not a polished pitch.
        </p>

        <Link
          to="/kloy/fxch/model"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200 hover:bg-emerald-500/15"
        >
          → Open the interactive financial model
        </Link>

        <Section title="Summary">
          <p className="text-zinc-300 leading-relaxed">
            FTCH is well-planned at the <em>feature and tooling</em> level and weakly
            planned at the <em>operating</em> level. The product spec, tech stack,
            and marketing playbook are unusually thorough for a pre-pilot startup.
            What&apos;s thin: financial modeling, headcount realism, control thresholds,
            and the management infrastructure required to run 25 markets by month 18.
            The plan describes <strong className="text-zinc-100">what</strong> to
            build and <strong className="text-zinc-100">what</strong> to sell —
            it does not yet describe <strong className="text-zinc-100">who decides
            what, when</strong>, or <strong className="text-zinc-100">what triggers
            a stop</strong>.
          </p>
        </Section>

        <Pillar
          number="1"
          title="Planning"
          strong={[
            'Product scope is fully decomposed. Six platforms, feature-by-feature spec, AI integration plan, POS tiering, and an order-lifecycle data flow that engineers can build against.',
            'Vendor stack is priced. Section 18 lands at ~$900–$1,750/month for Year 1 infra — a credible number, and the AWS tier ramps (Year 1 / 2 / 3) are reasonable.',
            'Launch playbook is concrete. The 8-week pre-launch checklist is the strongest operational artifact in the document.',
          ]}
          weak={[
            'No financial model. GMV, ARPO, CAC, LTV, retention — all stated as targets, no spreadsheet behind them. Seed sizing is therefore a guess.',
            'Seed size is light for stated scope. Five apps + four services + Stripe Connect + POS integrations is not a $250K project. Realistic floor: $750K–$1.2M to a 2-market pilot with a 4-engineer team for 9 months.',
            'Phase 1 → Phase 2 ramp is aggressive. 2 → 25 markets in 12 months requires a launch every ~2 weeks. The 8-week pre-launch checklist assumes a community manager per market and 6+ weeks of pre-work. Math doesn’t line up unless launches overlap heavily.',
            'No risk register. Top 5 risks (driver supply collapse, merchant churn, app store rejection, AB5-style reclassification, payment fraud) are unnamed and unassigned.',
            'Pilot market selection has no criteria. Which two towns? Why? What’s the success threshold to advance vs. pivot?',
          ]}
          actions={[
            'Build a 36-month unit-economics model with bear/base/bull. Anchor the seed ask to it.',
            'Write a one-page risk register with named owners.',
            'Define explicit go/no-go criteria at the end of Phase 1.',
          ]}
        />

        <Pillar
          number="2"
          title="Organizing"
          strong={[
            'Tech architecture is sound. Monorepo with apps/packages/services, Fastify + Postgres + Redis + ECS Fargate — defensible, no exotic bets.',
            'Workflows are documented. Merchant 7-step and driver 6-step onboarding flows are clear enough to hand to an ops coordinator.',
            'Stripe Connect choice is correct. Connect Express on both sides pushes KYC, payouts, and 1099 burden onto Stripe.',
          ]}
          weak={[
            'Phase 1 team is impossibly small for the stated build. 4–5 people cannot build six platforms, integrate five POS systems, run two pilot markets, and handle support. Realistic floor: ~9 people.',
            'No org chart or decision rights. Who approves a merchant suspension? Who can refund >$50? Who owns the AI prompt library? These are operating-model questions, and they will become bottlenecks at 10+ markets.',
            'POS specialist role doesn’t scale. A 30-min call per merchant works for 30 merchants. It does not work for 375 (Phase 2).',
            'Community manager model is the load-bearing wall — and untested. No playbook for sourcing, comp, firing without burning the market, or backfilling when one leaves.',
            'No engineering management plan. Phase 2 hires "1 full-stack engineer, 1 ops coordinator" — that’s not a team, that’s two contractors.',
          ]}
          actions={[
            'Draft a realistic Phase 1 org chart with named roles and reporting lines.',
            'Build a decision-rights matrix (RACI) for the top 20 operating decisions.',
            'Pilot the community-manager role as a job — JD, comp plan, 30/60/90 — before the first market launches.',
          ]}
        />

        <Pillar
          number="3"
          title="Leading"
          strong={[
            'Brand voice is clear and differentiated. "Neighborly, no-nonsense, straight shooter" is a real position, defensible against DoorDash’s corporate tone.',
            'Sales philosophy fits the customer. "Neighbor helping a neighbor, not a software company closing a deal" — correct read on small-town merchant psychology.',
            'Founder presence on launch day is the right instinct. Showing up matters in this segment.',
          ]}
          weak={[
            'No founder narrative. Who is the founder? Why are they uniquely positioned? Small-town merchants and local newspapers will both want a story. There isn’t one in the plan.',
            'No mission / values statement. The internal north star — what FTCH refuses to do, what tradeoffs it will always make — is absent.',
            'Driver leadership is transactional. Drivers are treated as supply (acceptance rate, badges, suspensions). No driver-community strategy, no advisory group, no in-person meetups. In gig work, that’s how you lose your best earners.',
            'Merchant advocacy stops at testimonials. No merchant advisory board, no quarterly merchant calls, no product-feedback loop — which is how you keep retention >85%.',
            'Hiring philosophy is undefined. The hiring plan is a count of seats, not a culture.',
          ]}
          actions={[
            'Write the founder story (one page). It gets used in press, sales decks, and hiring.',
            'Define 3–5 operating principles that resolve real tradeoffs.',
            'Stand up a driver advisory group of 5–8 drivers per market by Phase 2.',
          ]}
        />

        <Pillar
          number="4"
          title="Controlling"
          strong={[
            'KPI list is comprehensive. Growth, operational, quality, and financial metrics are all named.',
            'Monitoring stack is real. Sentry + CloudWatch + BetterUptime + Mixpanel + Metabase covers the obvious bases.',
            'Stripe Radar + dispute management is named, not dismissed.',
          ]}
          weak={[
            'No leading vs. lagging breakdown. "85% 90-day retention" is lagging — by the time you miss it, the merchants are gone. What’s the leading indicator?',
            'No threshold-triggered actions. Targets are stated but the plan never says "if X drops below Y for Z days, this happens." Without thresholds, dashboards are decoration.',
            'No market kill criteria. What does FTCH do with a pilot that hits month 6 with <2 orders/merchant/day? Only growth scenarios are described.',
            'Financial controls are absent. No monthly close, no Stripe reconciliation owner, no AP/AR, no budget vs. actual cadence.',
            'Fraud playbook is one line. "Stripe Radar applied" is detection. No reviewer, no offboarding flow, no chargeback split policy.',
            'IC classification risk is acknowledged but not operationalized. No state tracker, no trigger, no escalation path.',
            'Customer support SLAs are aspirational. <4 hours for P1 with Intercom Starter and no named support staff means founder/CTO absorb support — which means they aren’t building product.',
          ]}
          actions={[
            'For each KPI define: leading indicator, threshold, owner, action when breached.',
            'Write a one-page market kill criteria doc.',
            'Stand up a monthly financial close with a real bookkeeper before the first merchant pays $99.',
            'Build a fraud playbook: detection → review → offboarding → chargebacks.',
            'Maintain a state-by-state IC-classification risk tracker with quarterly review.',
          ]}
        />

        <Section title="Top 10 honest risks (not in the plan)">
          <ol className="space-y-2.5 list-decimal pl-5 marker:text-zinc-500">
            {[
              'Seed is undersized by ~2–3× for the stated build and team.',
              'Phase 2 ramp (25 markets in 12 months) is operationally infeasible without a productized launch motion the plan doesn’t yet have.',
              'Community manager model is the single point of failure and is untested.',
              'No founder story = harder fundraising and harder local-press wins.',
              'Drivers will leave for DoorDash as soon as it arrives unless retention is built deliberately.',
              'Merchant $99 + $75 fee is a real friction point — the plan doesn’t model how many merchants refuse at the door. Biggest unknown in Year 1 unit economics.',
              'POS integration timelines slip. Every marketplace says "Square in 2 weeks" and every marketplace learns it takes 6.',
              'AI catalog parsing is wrong often enough to matter. A 70% confidence floor means 30% of items need fixes — and merchants will blame FTCH for the bad ones.',
              'IC classification could close a state overnight. No contingency today.',
              'The plan optimizes for build correctness, not feedback velocity. First 90 days depend on tight loops with 5–10 real merchants, not on shipping every Phase 1 feature.',
            ].map((r) => (
              <li key={r} className="text-zinc-300 leading-relaxed pl-1">{r}</li>
            ))}
          </ol>
        </Section>

        <Section title="Bottom line">
          <p className="text-zinc-300 leading-relaxed">
            The FTCH plan is{' '}
            <strong className="text-zinc-100">above average for product and tooling, below average for operating discipline</strong>.
            To make it true and honest, the next pass should add:
          </p>
          <ul className="mt-4 space-y-2 text-zinc-300">
            {[
              'A unit-economics model',
              'A realistic org chart + RACI',
              'A risk register with owners',
              'KPI thresholds and triggered actions',
              'Market kill criteria',
              'A founder narrative',
            ].map((b) => (
              <li key={b} className="flex gap-2.5 leading-relaxed">
                <span className="mt-2 size-1.5 rounded-full shrink-0 bg-amber-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            These are 4–6 weeks of founder + advisor work, not engineering work.
            They will not be done by the engineering team. They have to be owned
            by whoever runs the company.
          </p>
        </Section>

        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          <div className="font-medium text-zinc-100 mb-1">Notes on this document</div>
          <p>
            Prepared as an internal honesty check against the FTCH Master Plan
            (April 2025). Not for investor distribution without further work.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href="mailto:r.patt9134@gmail.com" className="text-zinc-200 hover:text-white underline">r.patt9134@gmail.com</a>
            <span className="text-zinc-600">·</span>
            <Link to="/" className="text-zinc-200 hover:text-white underline">Back to ryanpatt.com</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Pillar({
  number,
  title,
  strong,
  weak,
  actions,
}: {
  number: string
  title: string
  strong: string[]
  weak: string[]
  actions: string[]
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-zinc-500 font-mono text-sm">{number}</span>
        <h2 className="font-semibold text-2xl md:text-3xl text-zinc-50">{title}</h2>
      </div>

      <SubBlock label="What's strong" tone="emerald" items={strong} />
      <SubBlock label="What's missing or optimistic" tone="amber" items={weak} />
      <SubBlock label="Action items" tone="blue" items={actions} />
    </section>
  )
}

function SubBlock({
  label,
  tone,
  items,
}: {
  label: string
  tone: 'emerald' | 'amber' | 'blue'
  items: string[]
}) {
  const dot = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    blue: 'bg-blue-400',
  }[tone]
  const chip = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  }[tone]

  return (
    <div className="mt-5">
      <div className="mb-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${chip}`}>
          {label}
        </span>
      </div>
      <ul className="space-y-2.5">
        {items.map((b) => (
          <li key={b} className="flex gap-2.5 text-zinc-300 leading-relaxed">
            <span className={`mt-2 size-1.5 rounded-full shrink-0 ${dot}`} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
