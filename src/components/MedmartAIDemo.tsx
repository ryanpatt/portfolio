import { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Types ───────────────────────────────────────────────────────────────────
interface UseCase {
  icon: string
  title: string
  desc: string
  detail: string
  effort: 'Low' | 'Medium' | 'High'
  impact: 'High' | 'Very High'
  status?: 'In Codebase'
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const useCases: UseCase[] = [
  {
    icon: '🏷️',
    title: 'AI Product Meta Generation',
    desc: 'Auto-generate SEO titles, descriptions, and Open Graph tags for every product and category page.',
    detail: 'Already partially built — ApplyMetaGenerationObserver.php exists in the codebase. Extend it with Claude to produce brand-consistent, keyword-rich meta copy at scale across thousands of SKUs without manual copywriting.',
    effort: 'Low',
    impact: 'High',
    status: 'In Codebase',
  },
  {
    icon: '🔍',
    title: 'Semantic Product Search',
    desc: 'Replace keyword-only search with meaning-aware search that understands intent.',
    detail: 'A customer searching "something for a sore back" should surface ergonomic chairs, lumbar supports, and heating pads — not just products with the word "back" in the title. Built with embeddings + OpenSearch (already in the stack) and a thin Claude layer to interpret ambiguous queries.',
    effort: 'Medium',
    impact: 'Very High',
  },
  {
    icon: '💬',
    title: 'AI-Assisted B2B Quote Responses',
    desc: 'Draft professional quote responses and negotiate counter-offers using order history and pricing rules.',
    detail: 'Cart2Quote is already installed. When a B2B buyer submits a quote request, Claude drafts a response using the buyer\'s account history, margin targets, and comparable past quotes — the sales team reviews and sends with one click. Cuts quote turnaround from hours to minutes.',
    effort: 'Medium',
    impact: 'Very High',
  },
  {
    icon: '🛒',
    title: 'Intelligent Abandoned Cart Recovery',
    desc: 'Generate personalized recovery emails based on what the customer actually browsed and bought before.',
    detail: 'Instead of a generic "You left something behind!", Claude writes copy tuned to the specific products in the cart, the customer\'s segment (B2B vs. consumer), and past purchase patterns. Klaviyo is already integrated — plug Claude into the email generation step.',
    effort: 'Low',
    impact: 'High',
  },
  {
    icon: '⭐',
    title: 'Review Summarization on PDPs',
    desc: 'Condense dozens of customer reviews into a 3-bullet AI summary displayed on the product page.',
    detail: 'Surfaces the most common praise and concerns at a glance — reduces decision friction and builds trust faster than raw review lists. Built as a Magento block with a daily cron to refresh summaries. Amasty FAQ is already in the stack; this pairs naturally alongside it.',
    effort: 'Low',
    impact: 'High',
  },
  {
    icon: '📦',
    title: 'Smart Reorder & Replenishment Alerts',
    desc: 'Predict when B2B accounts are due to reorder based on their purchase cadence and prompt them proactively.',
    detail: 'Analyze each account\'s historical order intervals for specific SKUs. When Claude detects a customer is overdue for a repeat order, trigger a Klaviyo flow with a personalized "Time to restock?" nudge. Particularly valuable for consumables and recurring supply purchases.',
    effort: 'Medium',
    impact: 'Very High',
  },
  {
    icon: '🚨',
    title: 'Order Anomaly Detection',
    desc: 'Flag unusual orders — potential fraud, fat-finger quantities, or pricing errors — before they ship.',
    detail: 'Kount360 is being removed from the stack. A lightweight Claude-powered layer can review orders that deviate from a customer\'s norm (unusual quantity, new ship-to address, odd payment method) and surface them for human review. Not a Kount replacement — a lightweight first pass.',
    effort: 'Medium',
    impact: 'High',
  },
  {
    icon: '📝',
    title: 'AI Category & Landing Page Copy',
    desc: 'Generate and refresh category descriptions and landing page content on a schedule.',
    detail: 'Thin category pages hurt SEO. Claude can produce unique, on-brand descriptions for every category and subcategory, injected via a Magento content block or directly into the CMS. Scheduled monthly refresh keeps content from going stale. Works with the existing Hyva/Luma CMS infrastructure.',
    effort: 'Low',
    impact: 'High',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  )
}

function UseCaseCard({ uc }: { uc: UseCase }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="bg-card border border-border-subtle rounded-xl p-5 hover:bg-card-hover transition-colors cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{uc.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-ink font-semibold text-sm">{uc.title}</h3>
            {uc.status && (
              <Badge label={uc.status} color="bg-gold/10 text-gold border border-gold/20" />
            )}
          </div>
          <p className="text-muted text-xs leading-relaxed">{uc.desc}</p>
          {open && (
            <p className="text-muted text-xs leading-relaxed mt-3 pt-3 border-t border-border-subtle">
              {uc.detail}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Badge
              label={`Effort: ${uc.effort}`}
              color={uc.effort === 'Low' ? 'bg-emerald-900/30 text-emerald-400' : uc.effort === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}
            />
            <Badge
              label={`Impact: ${uc.impact}`}
              color={uc.impact === 'Very High' ? 'bg-gold/10 text-gold' : 'bg-surface text-muted'}
            />
          </div>
        </div>
        <span className="text-muted text-xs mt-1">{open ? '▲' : '▼'}</span>
      </div>
    </div>
  )
}


function Section({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-16 border-t border-border-subtle">
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-muted text-xs uppercase tracking-widest">{label}</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      {children}
    </section>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Working on it': 'bg-[#0f3460] text-[#579dff]',
    'In Progress':   'bg-[#0f3460] text-[#579dff]',
    'Done':          'bg-[#0b3d2e] text-[#2bac76]',
    'Stuck':         'bg-[#3d0f1f] text-[#e01e5a]',
    'Not started':   'bg-[#2c2c2c] text-[#949ba4]',
    'In Review':     'bg-[#2d1b4e] text-[#b98eff]',
    'New':           'bg-[#2c2c2c] text-[#949ba4]',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${map[status] ?? 'bg-surface text-muted'}`}>
      {status}
    </span>
  )
}

function MorningReportContent() {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="font-bold text-[#d1d2d3] text-sm">📋 Morning Briefing</p>
        <p className="text-[#949ba4] text-[11px]">Wed May 14, 2026 · Generated by MedMart Agent</p>
      </div>

      <div className="bg-[#222529] rounded-lg p-3">
        <p className="text-[#949ba4] text-[10px] uppercase tracking-wider mb-2">Board Snapshot</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { status: 'Working on it', count: 7 },
            { status: 'Done',          count: 3 },
            { status: 'Stuck',         count: 2 },
            { status: 'Not started',   count: 14 },
          ].map(({ status, count }) => (
            <div key={status} className="flex items-center justify-between bg-[#1a1d21] rounded px-2 py-1.5">
              <StatusPill status={status} />
              <span className="text-[#d1d2d3] text-xs font-semibold ml-2">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[#2bac76] text-[10px] font-semibold uppercase tracking-wider mb-1.5">Completed since yesterday</p>
        {[
          'MM-82 · Fix add-to-cart link for recommended products',
          'MM-79 · Front-end pop-up implementation',
          'MM-74 · Hyva checkout step improvements',
        ].map(item => (
          <div key={item} className="flex items-start gap-2 py-0.5 text-[#d1d2d3]">
            <span className="text-[#2bac76] mt-0.5 flex-shrink-0">✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[#ecb22e] text-[10px] font-semibold uppercase tracking-wider mb-1.5">Due today</p>
        {[
          { id: 'MM-86', title: 'Staging deployment',    owner: 'Yurii T' },
          { id: 'MM-88', title: 'OpenSearch index rebuild', owner: 'Faisal K' },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[#ecb22e]">⚡</span>
              <span className="text-[#579dff] font-medium">{item.id}</span>
              <span className="text-[#d1d2d3]">{item.title}</span>
            </div>
            <span className="text-[#949ba4] text-[10px] ml-4">{item.owner}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#3d0f1f]/40 border border-[#e01e5a]/20 rounded-lg p-3">
        <p className="text-[#e01e5a] text-[10px] font-semibold uppercase tracking-wider mb-1.5">🔴 Stuck — needs action</p>
        {[
          { id: 'MM-81', title: 'Avalara tax config',   days: 3, owner: 'no owner' },
          { id: 'MM-77', title: 'ShipperHQ rate debug', days: 5, owner: 'Max A' },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[#579dff] font-medium">{item.id}</span>
              <span className="text-[#d1d2d3]">{item.title}</span>
            </div>
            <span className="text-[#e01e5a] text-[10px] ml-4">{item.days}d · {item.owner}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EveningReportContent() {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="font-bold text-[#d1d2d3] text-sm">📊 End of Day Summary</p>
        <p className="text-[#949ba4] text-[11px]">Wed May 14, 2026 · Generated by MedMart Agent</p>
      </div>

      <div>
        <p className="text-[#949ba4] text-[10px] font-semibold uppercase tracking-wider mb-2">What moved today</p>
        <div className="divide-y divide-[#383838]">
          {[
            { id: 'MM-86', title: 'Staging deployment',  from: 'In Progress', to: 'Done',      owner: 'Yurii T' },
            { id: 'MM-88', title: 'OpenSearch rebuild',  from: 'In Progress', to: 'Done',      owner: 'Faisal K' },
            { id: 'MM-90', title: 'Font demo bug fix',   from: 'New',         to: 'Done',      owner: 'Ryan P' },
            { id: 'MM-83', title: 'Hyva PDP polish',     from: 'In Progress', to: 'In Review', owner: 'Max A' },
          ].map(item => (
            <div key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
              <span className="text-[#579dff] font-medium w-12">{item.id}</span>
              <span className="text-[#d1d2d3] flex-1 min-w-[120px]">{item.title}</span>
              <div className="flex items-center gap-1">
                <StatusPill status={item.from} />
                <span className="text-[#949ba4] text-[10px]">→</span>
                <StatusPill status={item.to} />
              </div>
              <span className="text-[#949ba4] text-[10px] w-14 text-right">{item.owner}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#222529] rounded-lg p-3">
        <p className="text-[#949ba4] text-[10px] font-semibold uppercase tracking-wider mb-1.5">Not touched today</p>
        {[
          { id: 'MM-81', title: 'Avalara tax config',   days: 4 },
          { id: 'MM-77', title: 'ShipperHQ rate debug', days: 6 },
          { id: 'MM-85', title: 'B2B quote flow',       days: 2 },
        ].map(item => (
          <div key={item.id} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[#949ba4]">○</span>
              <span className="text-[#579dff] font-medium">{item.id}</span>
              <span className="text-[#949ba4]">{item.title}</span>
            </div>
            <span className="text-[#e01e5a] text-[10px]">{item.days}d no update</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0f3460]/40 border border-[#579dff]/20 rounded-lg p-3">
        <p className="text-[#579dff] text-[10px] font-semibold uppercase tracking-wider mb-2">💬 Suggested for standup</p>
        {[
          'Who picks up MM-81 (Avalara) and MM-77 (ShipperHQ)?',
          'MM-83 ready for Ryan to review?',
          'Sprint scope — 3 new items added today',
        ].map((item, i) => (
          <div key={i} className="flex gap-2 py-0.5 text-[#d1d2d3]">
            <span className="text-[#579dff] font-semibold flex-shrink-0">{i + 1}.</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlackPreview({ type }: { type: 'morning' | 'evening' }) {
  return (
    <div className="bg-[#1a1d21] rounded-xl overflow-hidden border border-[#383838]">
      <div className="px-4 py-2.5 border-b border-[#383838] flex items-center gap-2">
        <span className="text-[#949ba4] font-bold text-sm">#</span>
        <span className="text-[#d1d2d3] text-sm font-semibold">dev-standup</span>
        <div className="h-3 w-px bg-[#383838] mx-1" />
        <span className="text-[#949ba4] text-[11px]">medmart-marketing.slack.com</span>
      </div>
      <div className="px-4 py-4 flex gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-gold text-[11px] font-bold">RP</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[#d1d2d3] text-sm font-bold">rpatt</span>
            <span className="text-[#949ba4] text-[11px]">Today at {type === 'morning' ? '8:00 AM' : '5:30 PM'}</span>
          </div>
          {type === 'morning' ? <MorningReportContent /> : <EveningReportContent />}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MedmartAIDemo() {
  const [reportTab, setReportTab] = useState<'morning' | 'evening'>('morning')

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/medmart/demo" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-xs text-muted">
            <a href="#usecases" className="hover:text-ink transition-colors">Use Cases</a>
            <a href="#agent" className="hover:text-ink transition-colors">Daily Agent</a>
            <a href="#pipeline" className="hover:text-ink transition-colors">Pipeline</a>
            <a href="#monday" className="hover:text-ink transition-colors">Board</a>
            <a href="#autofix" className="hover:text-ink transition-colors">Fix Agent</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            AI Capabilities Demo · May 2026
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4 leading-tight">
            AI for MedMart<br />
            <span className="text-gold">Practical. Specific. Buildable.</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Five areas where AI moves the needle immediately — grounded in the actual stack
            and workflows already in place at MedMart.
          </p>
          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            <a href="#usecases" className="px-4 py-2 bg-gold text-bg text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors">
              Use Cases
            </a>
            <a href="#agent" className="px-4 py-2 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Daily Agent
            </a>
            <a href="#pipeline" className="px-4 py-2 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Dev Pipeline
            </a>
            <a href="#monday" className="px-4 py-2 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Board Upgrade
            </a>
            <a href="#autofix" className="px-4 py-2 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Fix Agent
            </a>
          </div>
        </div>

        {/* ── Section 1: Use Cases ── */}
        <Section id="usecases" label="01 · Ecommerce AI Use Cases">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Built for MedMart's Stack</h2>
            <p className="text-muted text-sm max-w-2xl">
              Every suggestion below maps to the actual Magento 2.4.7 / Adobe Commerce / Hyva setup —
              existing extensions, OpenSearch, Klaviyo, and the B2B + B2C customer mix.
              Click any card for implementation detail.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {useCases.map(uc => <UseCaseCard key={uc.title} uc={uc} />)}
          </div>
        </Section>

        {/* ── Section 2: Monday Agent ── */}
        <Section id="agent" label="02 · Monday.com Daily Agent">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Start & End of Day Reports</h2>
            <p className="text-muted text-sm max-w-2xl">
              A lightweight agent runs twice daily — pulls board state from Monday.com, asks Claude to
              analyze it, and posts a plain-English report to a Slack channel. Zero dashboards to check.
              The team gets the signal in the place they're already working.
            </p>
          </div>

          {/* Report tabs */}
          <div className="flex gap-2 mb-4">
            {(['morning', 'evening'] as const).map(t => (
              <button
                key={t}
                onClick={() => setReportTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportTab === t
                    ? 'bg-gold text-bg'
                    : 'bg-card border border-border-subtle text-muted hover:text-ink'
                }`}
              >
                {t === 'morning' ? '☀️ Morning Briefing' : '🌙 End of Day'}
              </button>
            ))}
          </div>
          <SlackPreview type={reportTab} />

          {/* How it works — process */}
          <div className="mt-10 mb-2">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">How the agent works</p>
            <div className="grid md:grid-cols-4 gap-3">
              {[
                { step: '01', icon: '⏰', label: 'Cron fires', detail: '8:00 AM and 5:30 PM daily — no server, no manual trigger' },
                { step: '02', icon: '📋', label: 'Reads Monday', detail: 'Fetches the full board: all items, statuses, owners, and last-updated timestamps' },
                { step: '03', icon: '🧠', label: 'Claude analyzes', detail: 'Identifies what completed, what\'s stuck, what\'s stale, and drafts talking points' },
                { step: '04', icon: '💬', label: 'Posts to Slack', detail: 'Delivered to #dev-standup as a regular message — no bot icon, no noise' },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border-subtle rounded-xl p-4 relative">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[10px] text-muted font-mono bg-surface px-1.5 py-0.5 rounded">{s.step}</span>
                  </div>
                  <p className="text-ink font-semibold text-sm mb-1.5">{s.label}</p>
                  <p className="text-muted text-xs leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { icon: '⏱', title: 'Runs on a cron', desc: '8:00 AM + 5:30 PM daily via Vercel Cron Jobs. No server to maintain.' },
              { icon: '📬', title: 'Posts to Slack', desc: 'Delivered to #dev-standup as a user message. Team sees it where they work.' },
              { icon: '🧠', title: 'Understands context', desc: 'Flags stale items, surfaces blockers, and drafts standup talking points — not just raw data.' },
            ].map(f => (
              <div key={f.title} className="bg-card border border-border-subtle rounded-xl p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-ink text-sm font-semibold mb-1">{f.title}</div>
                <div className="text-muted text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Section 3: Dev Pipeline ── */}
        <Section id="pipeline" label="03 · Repo ↔ Monday.com Pipeline">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Commits & PRs Visible in Monday</h2>
            <p className="text-muted text-sm max-w-2xl">
              A thin middleware layer listens to GitHub webhooks and keeps Monday.com cards
              in sync with actual code — no one has to update two systems manually.
            </p>
          </div>

          {/* Flow diagram — expanded visual */}
          <div className="mb-10">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">How it flows</p>
            <div className="grid md:grid-cols-4 gap-3">
              {[
                {
                  icon: '💻',
                  step: '01',
                  label: 'Dev commits',
                  detail: 'Commit message includes the ticket ID — e.g. "MM-74: fix checkout step"',
                  color: 'border-border-subtle',
                },
                {
                  icon: '🔗',
                  step: '02',
                  label: 'GitHub fires webhook',
                  detail: 'GitHub sends the push/PR event to a secure endpoint — verified with a secret signature',
                  color: 'border-border-subtle',
                },
                {
                  icon: '⚙️',
                  step: '03',
                  label: 'Middleware processes it',
                  detail: 'Parses the ticket ID, looks up the Monday card, and decides what to update based on the event type',
                  color: 'border-border-subtle',
                },
                {
                  icon: '✅',
                  step: '04',
                  label: 'Monday card updates',
                  detail: 'Status changes, a commit note is posted on the card, and the team sees the activity instantly',
                  color: 'border-gold/30',
                },
              ].map((s, i) => (
                <div key={i} className="relative">
                  <div className={`bg-card border ${s.color} rounded-xl p-5 h-full`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-[10px] text-muted font-mono bg-surface px-1.5 py-0.5 rounded">{s.step}</span>
                    </div>
                    <p className="text-ink font-semibold text-sm mb-2">{s.label}</p>
                    <p className="text-muted text-xs leading-relaxed">{s.detail}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 items-center justify-center">
                      <span className="text-gold text-lg">›</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What syncs */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">What syncs automatically</h3>
              <div className="space-y-3">
                {[
                  { trigger: 'Commit pushed',      result: 'Commit note posted on Monday card', icon: '→' },
                  { trigger: 'PR opened',           result: 'Card moves to "In Review"',         icon: '→' },
                  { trigger: 'PR merged',           result: 'Card moves to "Done"',              icon: '→' },
                  { trigger: 'Review requested',    result: '@mention on Monday card',           icon: '→' },
                  { trigger: 'CI check fails',      result: 'Card flagged with warning',         icon: '→' },
                ].map(row => (
                  <div key={row.trigger} className="flex items-start gap-3 text-xs">
                    <div className="bg-surface border border-border-subtle rounded px-2 py-1 text-muted w-32 flex-shrink-0">{row.trigger}</div>
                    <span className="text-gold mt-1 flex-shrink-0">{row.icon}</span>
                    <div className="text-muted pt-1">{row.result}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">AI actions from inside Monday</h3>
              <div className="space-y-3">
                {[
                  { action: 'Summarise git activity',       who: 'Pulls all linked commits and distills what changed' },
                  { action: 'Draft PR description',          who: 'Generates a ready-to-paste PR body from commit history' },
                  { action: 'Estimate effort',               who: 'Reads the ticket and returns a rough dev-hour estimate' },
                  { action: 'Write release notes',           who: 'Produces customer-facing notes for all merged PRs this sprint' },
                ].map(row => (
                  <div key={row.action} className="text-xs">
                    <p className="text-ink font-medium mb-0.5">"{row.action}"</p>
                    <p className="text-muted leading-relaxed">{row.who}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security callout */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <h3 className="text-ink font-semibold text-sm mb-3">Security — how it's kept safe</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    { label: 'Webhook signature verified', desc: 'Every GitHub event is signed with a shared secret. The middleware rejects anything that doesn\'t match before processing a single byte.' },
                    { label: 'Tokens never leave the server', desc: 'Monday.com and Slack tokens are environment variables on Vercel — not in the code, not in git, not logged anywhere.' },
                    { label: 'Read-only GitHub scope', desc: 'The webhook only receives push/PR events. The middleware has no write access to the repository.' },
                    { label: 'No data stored', desc: 'The middleware is stateless — it receives, processes, and responds. Nothing is written to a database or disk.' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-2 text-xs">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                      <div>
                        <span className="text-ink font-medium">{item.label} — </span>
                        <span className="text-muted">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Middleware vs Monday App */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-gold/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full font-medium">Start here</span>
                <h3 className="text-ink font-semibold text-sm">Middleware approach</h3>
              </div>
              <p className="text-muted text-xs leading-relaxed mb-3">A single Vercel Edge Function — no Monday marketplace approval, full control, ships in a day. This is the right first step.</p>
              <div className="space-y-1.5 text-xs text-muted">
                {['Lives at a private URL — not exposed publicly', 'Deployed in minutes, no approval process', 'Easy to extend or modify'].map(i => (
                  <div key={i} className="flex gap-2"><span className="text-gold">›</span>{i}</div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-surface text-muted border border-border-subtle px-2 py-0.5 rounded-full font-medium">Phase 2</span>
                <h3 className="text-ink font-semibold text-sm">Monday App (sidebar panel)</h3>
              </div>
              <p className="text-muted text-xs leading-relaxed mb-3">Adds a native sidebar inside Monday where the team prompts Claude directly from a ticket. More polished — ~2 extra weeks to build and submit for marketplace approval.</p>
              <div className="space-y-1.5 text-xs text-muted">
                {['Prompt Claude without leaving Monday', 'Approve once, installed across the account', 'Feels like a native Monday feature'].map(i => (
                  <div key={i} className="flex gap-2"><span className="text-gold">›</span>{i}</div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 4: Monday Board Upgrade ── */}
        <Section id="monday" label="04 · Monday.com Board Upgrade">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">A Board Built for How the Team Actually Works</h2>
            <p className="text-muted text-sm max-w-2xl">
              The current Monday setup tracks tasks. This upgrade makes it a live control panel —
              time, environment state, releases, and multi-person collaboration all in one view.
            </p>
          </div>

          {/* Column upgrades */}
          <div className="mb-8">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">New column types & what they unlock</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: '⏱',
                  label: 'Time Tracking',
                  current: 'Estimates live in task names or comments',
                  upgrade: 'Built-in time log per person, per task. Reports show actual vs. estimated hours each sprint.',
                  color: 'border-blue-800/40',
                  dot: 'bg-blue-400',
                },
                {
                  icon: '🚦',
                  label: 'Environment Status',
                  current: 'No visibility into what\'s on staging vs. production',
                  upgrade: 'Columns for Staging / Production / Local show exactly where each ticket is deployed. Updated automatically when PRs merge.',
                  color: 'border-emerald-800/40',
                  dot: 'bg-emerald-400',
                },
                {
                  icon: '🏷️',
                  label: 'Release Tags',
                  current: 'No grouping by release — everything is a flat list',
                  upgrade: 'Tag tickets to a sprint/release. Automated release notes pulled from merged PRs at the end of each cycle.',
                  color: 'border-purple-800/40',
                  dot: 'bg-purple-400',
                },
                {
                  icon: '👥',
                  label: 'Multi-Owner',
                  current: 'Single "owner" field — pairs and handoffs are invisible',
                  upgrade: 'Multi-person assignment shows who\'s pairing, reviewing, or blocked waiting on someone else.',
                  color: 'border-yellow-800/40',
                  dot: 'bg-yellow-400',
                },
                {
                  icon: '🔗',
                  label: 'Dependency Links',
                  current: 'Blocking relationships written as text comments',
                  upgrade: 'Dependency columns surface blockers in timeline view and alert the next person automatically when their dependency clears.',
                  color: 'border-orange-800/40',
                  dot: 'bg-orange-400',
                },
                {
                  icon: '📊',
                  label: 'Effort vs. Velocity',
                  current: 'No sprint-level velocity data',
                  upgrade: 'Story points column feeds a dashboard widget. Team sees throughput trends — useful for sprint planning and budget conversations.',
                  color: 'border-gold/30',
                  dot: 'bg-gold',
                },
              ].map(col => (
                <div key={col.label} className={`bg-card border ${col.color} rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{col.icon}</span>
                    <span className="text-ink font-semibold text-sm">{col.label}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0 mt-1.5" />
                      <span className="text-muted">{col.current}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot} flex-shrink-0 mt-1.5`} />
                      <span className="text-ink leading-relaxed">{col.upgrade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Board views */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">Views to add</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { view: 'Timeline / Gantt', desc: 'Sprint overview with dependency arcs — instantly shows if a release is at risk' },
                  { view: 'Team Workload',    desc: 'Who has capacity, who\'s overallocated, across all active sprints' },
                  { view: 'Release Board',    desc: 'Kanban grouped by release tag — shows what\'s shipping this cycle at a glance' },
                  { view: 'Stale Radar',      desc: 'Auto-filters to items untouched for 3+ days — AI flags them in the daily report' },
                ].map(row => (
                  <div key={row.view} className="flex gap-3">
                    <span className="text-gold flex-shrink-0 mt-0.5">›</span>
                    <div>
                      <span className="text-ink font-medium">{row.view} — </span>
                      <span className="text-muted">{row.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">Automations to wire up</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { trigger: 'PR merged',                result: 'Ticket moves to Done; time log closed' },
                  { trigger: 'Item stale 3 days',        result: 'Owner pinged in Slack; flagged in morning report' },
                  { trigger: 'Status → In Review',       result: 'Reviewer @mentioned automatically' },
                  { trigger: 'New sprint starts',        result: 'Unfinished items auto-carry over with a "rolled" label' },
                  { trigger: 'Release tag finalised',    result: 'AI drafts release notes and posts to #releases' },
                ].map(row => (
                  <div key={row.trigger} className="flex items-start gap-3">
                    <div className="bg-surface border border-border-subtle rounded px-2 py-1 text-muted text-[11px] flex-shrink-0 w-36">{row.trigger}</div>
                    <span className="text-gold text-xs mt-1 flex-shrink-0">→</span>
                    <span className="text-muted text-[11px] pt-1">{row.result}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 5: Autonomous Fix Agent ── */}
        <Section id="autofix" label="05 · Autonomous Fix Agent">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Low-Level Bugs Fixed While the Team Sleeps</h2>
            <p className="text-muted text-sm max-w-2xl">
              An agent monitors error logs and open tickets, attempts fixes on a sandboxed branch,
              and opens a PR for human review. Developers approve or close — they never triage.
            </p>
          </div>

          {/* Flow */}
          <div className="mb-10">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">Agent loop</p>
            <div className="relative">
              <div className="grid md:grid-cols-5 gap-3">
                {[
                  { step: '01', icon: '🪵', label: 'Error detected',    detail: 'Magento logs, Sentry, or a Monday card tagged "bug" triggers the agent' },
                  { step: '02', icon: '🔍', label: 'Context gathered',  detail: 'Agent reads the stack trace, the relevant source files, and recent git history for that area' },
                  { step: '03', icon: '🛠️', label: 'Fix attempted',     detail: 'Claude edits the files on an isolated branch — it can access only what\'s relevant, nothing more' },
                  { step: '04', icon: '✅', label: 'Tests run',         detail: 'The fix is validated against existing tests. If tests fail, the agent tries again or flags it as too complex' },
                  { step: '05', icon: '📬', label: 'PR opened',         detail: 'A PR is created with a plain-English explanation of what broke, why, and what was changed' },
                ].map((s, i) => (
                  <div key={i} className="bg-card border border-border-subtle rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-[10px] text-muted font-mono bg-surface px-1.5 py-0.5 rounded">{s.step}</span>
                    </div>
                    <p className="text-ink font-semibold text-sm mb-1.5">{s.label}</p>
                    <p className="text-muted text-xs leading-relaxed">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What it handles vs escalates */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-emerald-800/40 rounded-xl p-5">
              <h3 className="text-emerald-400 font-semibold text-sm mb-4">✓ What the agent handles</h3>
              <div className="space-y-2 text-xs text-muted">
                {[
                  'Deprecated function calls surfaced in PHP logs',
                  'Broken imports or missing null checks flagged by static analysis',
                  'Template typos or incorrect escaper calls in .phtml files',
                  'Missing translation keys in i18n files',
                  'Outdated API calls when a vendor ships a breaking change',
                  'Simple CSS/layout regressions caught by visual diff',
                ].map(i => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-400 flex-shrink-0">✓</span>
                    {i}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">⚠ What it escalates to a human</h3>
              <div className="space-y-2 text-xs text-muted">
                {[
                  'Business logic changes — pricing, tax, checkout flow',
                  'Database schema modifications',
                  'Anything that touches security or authentication',
                  'Fixes that require cross-service coordination',
                  'Cases where the root cause is genuinely ambiguous',
                  'Any fix where tests don\'t exist to validate the change',
                ].map(i => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted flex-shrink-0">⚠</span>
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6 mb-6">
            <p className="text-ink font-semibold text-sm mb-4">Where this saves budget</p>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { stat: '~30%', label: 'of bug reports', sub: 'are low-complexity issues a developer spends 30–90 min on per ticket' },
                { stat: '< 5 min', label: 'agent response time', sub: 'from error detected to PR open — vs. hours waiting for dev capacity' },
                { stat: '1 review', label: 'is all it takes', sub: 'developers approve or close — no triage, no reproduction, no context-switching' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-gold font-display text-3xl font-bold mb-1">{s.stat}</p>
                  <p className="text-ink text-sm font-medium mb-1">{s.label}</p>
                  <p className="text-muted text-xs leading-relaxed">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-surface border border-border-subtle rounded-xl">
            <p className="text-ink text-sm font-semibold mb-2">Human always in the loop</p>
            <p className="text-muted text-xs leading-relaxed">
              The agent never merges its own PRs. Every fix goes through the normal review process —
              the only difference is that a developer reviews a complete, tested solution instead of
              starting from scratch. The team sets the boundaries; the agent works within them.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="py-16 text-center border-t border-border-subtle">
          <p className="text-muted text-xs">
            ryanpatt.com/medmart/ai-demo · May 2026
          </p>
        </div>
      </main>
    </div>
  )
}
