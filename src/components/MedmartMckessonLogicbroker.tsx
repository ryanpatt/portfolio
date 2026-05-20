import { Link } from 'react-router-dom'

/* ─── data ──────────────────────────────────────────────────────────────── */

const sections: { id: string; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'sync',      label: 'Daily sync' },
  { id: 'freight',   label: 'Freight' },
  { id: 'pricing',   label: 'Pricing formula' },
  { id: 'alerts',    label: 'Status alerts' },
  { id: 'scope',     label: 'Scope of work' },
  { id: 'questions', label: 'Open questions' },
]

const syncFields: { field: string; purpose: string }[] = [
  { field: 'Unit cost',           purpose: 'Drives the selling-price formula' },
  { field: 'Case pack / UOM',     purpose: 'Determines $2.20/case freight for Incontinence & Nutritional' },
  { field: 'Stock status',        purpose: 'Maps to in-stock / non-stock / out-of-stock badges' },
  { field: 'Discontinued flag',   purpose: 'Triggers the "Discontinued" PDP message' },
  { field: 'Returnability flag',  purpose: 'Triggers the "Final Sale" badge and disables RMA' },
  { field: 'Restrictions',        purpose: 'Any category, state, or licensing restriction surfaced by McKesson' },
]

const alerts: {
  trigger: string
  badge: string
  body: string
  tone: string
}[] = [
  {
    trigger: 'Non-Stock',
    badge: 'Special Order Item',
    body: 'This product is available to order but may require additional processing time before shipment.',
    tone: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    trigger: 'Out of Stock',
    badge: 'Temporarily Out of Stock',
    body: 'We expect this item to be available again soon. Please contact us for the latest availability.',
    tone: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  {
    trigger: 'Recently Discontinued',
    badge: 'This Product Has Been Discontinued',
    body: 'This item is no longer available. Please contact us and we’ll be happy to recommend a similar alternative.',
    tone: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    trigger: 'Non-Returnable',
    badge: 'Final Sale Item',
    body: 'This product is non-returnable and cannot be returned once purchased.',
    tone: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
]

const youOwn: { item: string; detail: string }[] = [
  { item: 'Margin strategy',          detail: 'Target margin %, per-category overrides, competitive research, when to undercut vs. hold' },
  { item: 'Pricing-formula sign-off', detail: 'Confirm formula handles edge cases: case-units, rounding, mid-cart cost shifts, promo stacking' },
  { item: 'Sync architecture',        detail: 'Pull cadence (daily vs. event-driven), retry / alerting on sync failures, source-of-truth rules' },
  { item: 'Data contract w/ McKesson',detail: 'Which fields LB exposes, field-name mapping, what to do when a field is missing' },
  { item: 'Status → messaging map', detail: 'Final approval on which McKesson flag triggers which badge & copy (PDP, cart, checkout)' },
  { item: 'PR review & QA gate',      detail: 'Approve module structure, attribute model, and frontend wiring before go-live' },
]

const delegate: { item: string; detail: string; who: string }[] = [
  { item: 'Magento module build',     detail: 'Cost-sync cron, product attribute model, observer wiring for price calc', who: 'Dev' },
  { item: 'LogicBroker API client',   detail: 'Request, parse, persist McKesson payload to staging attributes', who: 'Dev' },
  { item: 'Frontend badge components',detail: 'PDP, cart, and checkout badges from designer mockups; tied to product attributes', who: 'Dev + Designer' },
  { item: 'Admin UI for margin %',    detail: 'Backend form for target margin and per-category overrides', who: 'Dev' },
  { item: 'Badge visual design',      detail: 'Color, placement, mobile/desktop variants', who: 'Designer' },
  { item: 'QA & UAT',                 detail: 'Sync correctness, formula correctness, badge display across SKU samples', who: 'QA' },
  { item: 'Sprint planning',          detail: 'Ticket breakdown, estimates, sequencing', who: 'PM' },
]

const openQuestions: { id: string; q: string; why: string }[] = [
  { id: 'Q1', q: 'What is the target margin %?',                  why: 'Currently a placeholder at 30% pending competitive research. Will it be flat or per-category?' },
  { id: 'Q2', q: 'How is a "case" identified for the $2.20 fee?', why: 'Is it a McKesson UOM field, a Magento category, or a manual product flag? Decides where the freight logic lives.' },
  { id: 'Q3', q: 'Push or pull from Logicbroker?',                why: 'Daily pull is the default assumption; LB may support event-driven push. Affects cadence and failure handling.' },
  { id: 'Q4', q: 'How are mid-checkout cost changes handled?',    why: 'If a price changes between add-to-cart and checkout, do we honor the cart price or update? Affects customer trust and margin.' },
  { id: 'Q5', q: 'Does Non-Returnable disable RMA in admin too?', why: 'The badge handles the customer-facing message. Internal flow for blocking returns is a separate question.' },
  { id: 'Q6', q: 'Where do promotional / sale prices fit?',       why: 'Formula gives a list price. Sale & coupon stacking is a separate layer that needs to be defined.' },
]

/* ─── component ─────────────────────────────────────────────────────────── */

export default function MedmartMckessonLogicbroker() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/medmart" className="font-display font-bold text-gold text-base tracking-tight hover:text-gold/80 transition-colors">
              MedMart
            </Link>
            <span className="text-border-subtle">·</span>
            <span className="text-sm text-muted">McKesson + Logicbroker</span>
          </div>
          <Link to="/medmart" className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Hub
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            Integration · Pricing &amp; Availability
          </div>
          <h1 className="text-3xl font-display font-bold text-ink mb-3">
            McKesson + Logicbroker
          </h1>
          <p className="text-muted text-base leading-relaxed max-w-2xl mb-6">
            One pipeline that keeps the storefront in sync with McKesson — unit cost, freight, stock status, and returnability — so the price and messaging a customer sees match the source of truth, every day, with no manual touch.
          </p>

          <nav className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs text-muted hover:text-gold border border-border-subtle hover:border-gold/30 rounded-full px-3 py-1 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Overview */}
        <section id="overview" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Why this matters</h2>
          <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-6 text-sm text-muted leading-relaxed">
            <p className="mb-3">
              McKesson is the cost-and-availability source of truth. Today, that data is not flowing into the site automatically — which means margins drift, restrictions can be missed, and customers can see stale info on products that have moved status.
            </p>
            <p>
              The fix is a daily, automated pull from McKesson via Logicbroker that updates four things on every product: <span className="text-ink">cost</span>, <span className="text-ink">case pack</span>, <span className="text-ink">stock status</span>, and <span className="text-ink">returnability</span>. The selling price is then computed from a formula, and the storefront displays the right badge for the product’s current state.
            </p>
          </div>
        </section>

        {/* Daily sync */}
        <section id="sync" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Daily sync from McKesson</h2>
          <p className="text-sm text-muted leading-relaxed mb-5 max-w-2xl">
            A scheduled job pulls the McKesson catalog payload through Logicbroker every day. The payload feeds a product attribute set on the Magento side; the price calculation and badge display read from those attributes.
          </p>
          <div className="bg-white/[0.02] border border-border-subtle rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-border-subtle">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Field</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {syncFields.map((row, i) => (
                  <tr key={row.field} className={i % 2 === 0 ? '' : 'bg-white/[0.015]'}>
                    <td className="px-5 py-3 text-ink font-medium whitespace-nowrap">{row.field}</td>
                    <td className="px-5 py-3 text-muted">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Freight */}
        <section id="freight" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Freight structure</h2>
          <p className="text-sm text-muted leading-relaxed mb-5 max-w-2xl">
            Confirmed with McKesson. Both components must roll into the selling-price calculation — not be tacked on at checkout.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Flat fee</div>
              <div className="text-2xl font-display font-bold text-ink mb-1">$7.15</div>
              <div className="text-sm text-muted">Per order, applied to every McKesson-fulfilled order.</div>
            </div>
            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Per-case fee</div>
              <div className="text-2xl font-display font-bold text-ink mb-1">$2.20 / case</div>
              <div className="text-sm text-muted">Applied to <span className="text-ink">Incontinence</span> and <span className="text-ink">Nutritional</span> products only.</div>
            </div>
          </div>
        </section>

        {/* Pricing formula */}
        <section id="pricing" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Pricing formula</h2>
          <p className="text-sm text-muted leading-relaxed mb-5 max-w-2xl">
            The site-displayed selling price is computed on every sync, not hand-edited. Margin is applied after freight so the storefront price covers cost + freight + target margin.
          </p>

          <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/20 rounded-xl p-6 mb-5">
            <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Formula</div>
            <div className="font-mono text-sm md:text-base text-ink leading-relaxed">
              <span className="text-blue-400">McKesson Cost</span>
              <span className="text-muted"> + </span>
              <span className="text-blue-400">Freight</span>
              <span className="text-muted"> ($7.15 flat + $2.20/case if applicable)</span>
              <span className="text-muted"> + </span>
              <span className="text-blue-400">Target Margin %</span>
              <span className="text-muted"> = </span>
              <span className="text-gold font-semibold">Customer Selling Price</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Worked example — 30% target margin</div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between"><span className="text-muted">McKesson cost (COG)</span><span className="text-ink">$9.00</span></div>
              <div className="flex justify-between"><span className="text-muted">+ Flat freight fee</span><span className="text-ink">$7.15</span></div>
              <div className="flex justify-between border-t border-border-subtle pt-2"><span className="text-muted">Subtotal</span><span className="text-ink">$16.15</span></div>
              <div className="flex justify-between"><span className="text-muted">+ 30% target margin</span><span className="text-ink">$6.92</span></div>
              <div className="flex justify-between border-t border-gold/30 pt-2"><span className="text-gold font-semibold">Customer selling price</span><span className="text-gold font-semibold">$23.07</span></div>
            </div>
          </div>

          <p className="text-xs text-muted/80 mt-4 italic">
            30% is a working assumption. Final target margin is open — see <a href="#questions" className="text-gold hover:underline">Q1</a>.
          </p>
        </section>

        {/* Status alerts */}
        <section id="alerts" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Product status alerts</h2>
          <p className="text-sm text-muted leading-relaxed mb-5 max-w-2xl">
            Four status conditions from the McKesson feed each trigger a specific PDP / cart message. Designer is producing the visual treatment; copy is locked.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {alerts.map((a) => (
              <div key={a.trigger} className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold mb-3 ${a.tone}`}>
                  {a.trigger}
                </div>
                <div className="text-base font-semibold text-ink mb-1.5">{a.badge}</div>
                <p className="text-sm text-muted leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scope */}
        <section id="scope" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Scope of work</h2>
          <p className="text-sm text-muted leading-relaxed mb-6 max-w-2xl">
            A clean split between strategic decisions that need your sign-off and implementation work that runs in parallel once those calls are made.
          </p>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                </svg>
                <div className="text-xs font-semibold text-gold uppercase tracking-wider">You own</div>
              </div>
              <ul className="space-y-4">
                {youOwn.map((row) => (
                  <li key={row.item}>
                    <div className="text-sm font-semibold text-ink mb-0.5">{row.item}</div>
                    <div className="text-xs text-muted leading-relaxed">{row.detail}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div className="text-xs font-semibold text-muted uppercase tracking-wider">Delegate</div>
              </div>
              <ul className="space-y-4">
                {delegate.map((row) => (
                  <li key={row.item}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-ink">{row.item}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-border-subtle text-muted/80">{row.who}</span>
                    </div>
                    <div className="text-xs text-muted leading-relaxed">{row.detail}</div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* Open questions */}
        <section id="questions" className="mb-14 scroll-mt-20">
          <h2 className="text-xl font-display font-semibold text-ink mb-3">Open questions</h2>
          <p className="text-sm text-muted leading-relaxed mb-5 max-w-2xl">
            These need answers before dev work locks in — they each touch the data model or business logic.
          </p>
          <div className="space-y-3">
            {openQuestions.map((q) => (
              <div key={q.id} className="bg-white/[0.02] border border-border-subtle rounded-xl p-5 flex gap-4">
                <div className="text-xs font-semibold text-gold tracking-wider shrink-0 pt-0.5">{q.id}</div>
                <div>
                  <div className="text-sm font-semibold text-ink mb-1">{q.q}</div>
                  <div className="text-xs text-muted leading-relaxed">{q.why}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-xs text-muted/60 pt-8 border-t border-border-subtle">
          MedMart · McKesson + Logicbroker integration brief · working document
        </div>

      </div>
    </div>
  )
}
