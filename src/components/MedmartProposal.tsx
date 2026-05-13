import { Link } from 'react-router-dom'

const DATE = 'May 13, 2026'

const scopeItems = [
  { icon: '⬡', label: 'Technical Ownership', desc: 'Own the full Magento / Adobe Commerce stack — architecture decisions, dependency management, security patch cadence, and extension vetting.' },
  { icon: '⬡', label: 'Project & Task Ownership', desc: 'Drive features from spec to deploy. Own timelines, surface blockers early, and report project and task status upward to David L weekly.' },
  { icon: '⬡', label: 'Team Standups & Code Quality', desc: 'Run daily standups, enforce PR review gates, normalize commit structure, and maintain a clean, reviewable development pipeline.' },
  { icon: '⬡', label: 'Monday.com / Monday Dev Integration', desc: 'Migrate or upgrade the board to Monday Dev — connecting the repo, automating ticket transitions on commits, and introducing a clear ticket hierarchy and definition of done.' },
  { icon: '⬡', label: 'Team Analysis Report', desc: 'Deliver a written analysis covering individual strengths, skill gaps, and adoption of new time tracking and workflow procedures — with a recommended action plan.' },
  { icon: '⬡', label: 'AI & In-House Feature Builds', desc: 'Build features and integrations in-house that would otherwise require expensive third-party SaaS or agency contracts — particularly in Magento customization and AI-powered tooling.' },
  { icon: '⬡', label: 'Weekly Reporting', desc: 'Submit a weekly report under either engagement model: hours by category (non-dev / dev), completed items, in-progress work, and blockers.' },
  { icon: '⬡', label: 'Development Assistance', desc: 'Available for direct development contributions — custom modules, API integrations, performance work, and bug resolution — as needed alongside ownership responsibilities.' },
]

const comparison = [
  { item: 'Agency monthly retainer (comparable scope)', external: '$15,000 – $25,000 / mo', fractional: '$3,000 / mo' },
  { item: 'Senior Magento dev, agency billing rate', external: '$125 – $175 / hr', fractional: '~$23 / hr effective' },
  { item: 'Dedicated technical PM / project lead', external: '$8,000 – $15,000 / mo', fractional: 'Included' },
  { item: 'Custom Magento module build (per module)', external: '$5,000 – $15,000 each', fractional: 'Covered in monthly' },
  { item: 'AI integration (e.g. semantic search, agent)', external: '$20,000 – $45,000', fractional: 'Covered in monthly' },
  { item: 'Third-party SaaS replaced by in-house build', external: '$500 – $2,000 / mo per tool', fractional: '$0 — built in-house' },
  { item: 'Security patch audit + remediation sprint', external: '$4,000 – $8,000', fractional: 'Covered in monthly' },
  { item: 'Performance optimization engagement', external: '$5,000 – $12,000', fractional: 'Covered in monthly' },
]

const examples = [
  {
    title: 'Worldpay Compliance Fix',
    external: 'External consultant or agency engagement to diagnose and resolve a compliance gap: $3,000–$6,000 plus coordination overhead.',
    fractional: '~8–12 hours of focused work. Covered within the monthly allocation with no separate SOW or invoice.',
  },
  {
    title: 'Semantic Product Search (AI)',
    external: 'Agency scoping, build, and QA for an AI-powered semantic search layer on Adobe Commerce: $25,000–$40,000.',
    fractional: '2–3 weeks of dedicated sprint work. Delivered in-house, no third-party contract required.',
  },
  {
    title: 'Custom ERP / Third-Party Integration',
    external: 'Integration agency or freelance specialist for a bi-directional data sync: $8,000–$20,000 depending on complexity.',
    fractional: 'Scoped, built, and maintained internally. Covered in the monthly rate.',
  },
  {
    title: 'AI-Powered Product Recommendation Engine',
    external: 'End-to-end build through a development agency or ML contractor: $30,000–$60,000.',
    fractional: 'Built in-house over 4–8 weeks. No external contract, no vendor dependency going forward.',
  },
]

export default function MedmartProposal() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40 print:static">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/medmart/demo" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <span className="text-xs text-muted font-mono">Confidential · {DATE}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14 space-y-20">

        {/* ── Title ── */}
        <section>
          <p className="text-xs font-mono text-gold-light tracking-widest uppercase mb-4">Partnership Proposal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink leading-tight mb-4">
            Fractional Technical<br />Leadership for MedMart
          </h1>
          <p className="text-muted text-lg max-w-2xl leading-relaxed mb-6">
            Prepared for <span className="text-ink font-medium">David L</span> and <span className="text-ink font-medium">David F</span> — a proposal for ongoing technical ownership, product leadership, and development partnership.
          </p>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>Ryan Patt</span>
            <span className="text-border-subtle">·</span>
            <span>ryanpatt.com</span>
            <span className="text-border-subtle">·</span>
            <span>{DATE}</span>
          </div>
        </section>

        {/* ── Options ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Engagement Options</h2>
          <p className="text-muted text-sm mb-8">Both options include the same level of dedication, access, and deliverables. The difference is billing structure.</p>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Option A */}
            <div className="relative bg-card rounded-2xl overflow-hidden border border-gold/30">
              <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5">Recommended</span>
                    <h3 className="font-display text-xl font-bold text-ink mt-2">Option A — Fractional</h3>
                    <p className="text-muted text-sm mt-0.5">Flat monthly rate, predictable cost</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-ink">$3,000</span>
                  <span className="text-muted text-sm ml-2">/ month</span>
                </div>

                <ul className="space-y-2.5 text-sm mb-6">
                  {[
                    'Approximately 30–35 hrs / week — no hard cap',
                    'Some weeks may run higher or lower — one stable cost',
                    'Full dedication to product and project ownership',
                    'Development contribution as needed',
                    'Contract (1099) or direct hire (W2)',
                    'No benefits or bonus required',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-muted">
                      <span className="text-gold mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="bg-surface rounded-xl p-4 text-xs text-muted border border-border-subtle">
                  <span className="text-ink font-medium">Effective rate: </span>~$21–25 / hr at 30–35 hrs/week. For context, a comparable agency engagement runs $125–175 / hr for the same profile.
                </div>
              </div>
            </div>

            {/* Option B */}
            <div className="bg-card rounded-2xl overflow-hidden border border-border-subtle">
              <div className="h-0.5 w-full bg-border-subtle" />
              <div className="p-6">
                <div className="mb-5">
                  <span className="text-xs font-semibold text-muted bg-surface border border-border-subtle rounded-full px-2 py-0.5">Flexible</span>
                  <h3 className="font-display text-xl font-bold text-ink mt-2">Option B — Hourly</h3>
                  <p className="text-muted text-sm mt-0.5">Time tracked, weekly invoice</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                    <div className="font-display text-2xl font-bold text-ink">$30</div>
                    <div className="text-xs text-muted mt-1">/ hr · Non-development</div>
                    <div className="text-xs text-muted/70 mt-2">Standups, planning, reporting, ticket management, analysis</div>
                  </div>
                  <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                    <div className="font-display text-2xl font-bold text-ink">$40</div>
                    <div className="text-xs text-muted mt-1">/ hr · Development</div>
                    <div className="text-xs text-muted/70 mt-2">Active coding sessions exceeding 2 hrs. Quick fixes under 2 hrs billed at $30.</div>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm mb-6">
                  {[
                    'Time tracked — full transparency on hours spent',
                    'Weekly report: hours by category + completed work',
                    'Quick fixes (&lt; 2 hrs) billed at non-dev rate',
                    'Same scope of ownership and responsibilities',
                    'Contract (1099) or direct hire (W2)',
                    'No benefits or bonus required',
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-muted">
                      <span className="text-gold mt-0.5 shrink-0">✓</span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>

                <div className="bg-surface rounded-xl p-4 text-xs text-muted border border-border-subtle">
                  <span className="text-ink font-medium">Estimate: </span>At 30 hrs/week non-dev + 10 hrs/week dev, monthly cost ≈ $3,600–$4,000. Variability depends on active development load.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Scope of Work ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">What's Included</h2>
          <p className="text-muted text-sm mb-8">The following is the full scope of responsibility under either engagement option.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {scopeItems.map((s) => (
              <div key={s.label} className="bg-card border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-1.5">{s.label}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Value Comparison ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">The Business Case</h2>
          <p className="text-muted text-sm mb-8">
            The value of Option A is in what gets built in-house. Every feature, integration, or automation that would otherwise require a third-party vendor or agency engagement is covered within the monthly rate. Below is a realistic market comparison.
          </p>

          {/* Table */}
          <div className="bg-card border border-border-subtle rounded-2xl overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider w-1/2">Work Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">External Market</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gold uppercase tracking-wider">Option A</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={row.item} className={i < comparison.length - 1 ? 'border-b border-border-subtle' : ''}>
                      <td className="px-5 py-3.5 text-ink">{row.item}</td>
                      <td className="px-5 py-3.5 text-muted">{row.external}</td>
                      <td className="px-5 py-3.5 text-gold font-medium">{row.fractional}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real examples */}
          <h3 className="font-display text-base font-semibold text-ink mb-5">Real Examples</h3>
          <div className="space-y-4">
            {examples.map((ex) => (
              <div key={ex.title} className="bg-card border border-border-subtle rounded-xl p-5">
                <div className="font-medium text-ink mb-3 text-sm">{ex.title}</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">External</div>
                    <p className="text-sm text-muted leading-relaxed">{ex.external}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1.5">Fractional</div>
                    <p className="text-sm text-muted leading-relaxed">{ex.fractional}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why It Works ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-8">Why This Works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { heading: 'Stable, Predictable Cost', body: 'One number on the P&L each month. No surprise invoices, no per-feature contracts, no agency markup on top of developer time.' },
              { heading: 'Institutional Knowledge Stays In-House', body: 'Features, integrations, and architecture decisions are documented and owned internally — not locked inside an agency or a vendor relationship.' },
              { heading: 'No Ramp-Up Cost', body: 'Already familiar with the codebase, the team, and the product. Day one is productive — not a discovery sprint at billable rate.' },
              { heading: 'Faster Delivery', body: 'Direct ownership means no back-and-forth between stakeholder and vendor. Decisions get made and work gets done in the same loop.' },
              { heading: 'Scales with the Business', body: 'As priorities shift — more AI, more integrations, new storefronts — the engagement adapts without re-scoping a contract.' },
              { heading: 'Code Quality by Default', body: 'PR gates, normalized commits, and a clean pipeline protect the codebase long-term. Quality is built into the process, not audited after the fact.' },
            ].map((c) => (
              <div key={c.heading} className="bg-card border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">{c.heading}</h3>
                <p className="text-sm text-muted leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-4 pb-8 border-t border-border-subtle flex items-center justify-between text-xs text-muted">
          <span>Ryan Patt · Confidential</span>
          <span>{DATE}</span>
        </footer>

      </main>
    </div>
  )
}
