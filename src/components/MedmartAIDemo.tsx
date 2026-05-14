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
              Include a ticket ID in the commit message and the rest happens automatically.
              No context-switching. No manual status updates. Both systems stay in sync.
            </p>
          </div>

          {/* ── Live example: push event → Monday card ── */}
          <div className="mb-12">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">Example — push event</p>
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">

              {/* GitHub side */}
              <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden font-mono text-xs">
                {/* repo header */}
                <div className="px-4 py-2.5 border-b border-[#30363d] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#e6edf3]">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <span className="text-[#7d8590]">Med-mart /</span>
                  <span className="text-[#e6edf3] font-semibold">mmr-web-m2</span>
                </div>

                {/* push event */}
                <div className="px-4 py-3 border-b border-[#21262d]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-[#1a7f37] flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <path d="M8.5 6.5L15 12l-6.5 5.5V6.5z"/>
                      </svg>
                    </div>
                    <span className="text-[#7d8590]">max-a pushed</span>
                    <span className="text-[#e6edf3]">3 commits</span>
                    <span className="text-[#7d8590]">to</span>
                    <span className="text-[#79c0ff] bg-[#1f2937] px-1.5 py-0.5 rounded-md">fix/mm-74-checkout</span>
                  </div>
                  <div className="space-y-1.5 pl-7">
                    {[
                      { sha: 'a3f9c12', msg: 'MM-74: fix multi-step checkout address validation' },
                      { sha: 'd8e1047', msg: 'MM-74: add unit tests for address validator' },
                      { sha: '2b5a883', msg: 'MM-74: remove legacy billing fallback' },
                    ].map(c => (
                      <div key={c.sha} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7d8590] flex-shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/>
                        </svg>
                        <span className="text-[#58a6ff] w-12 flex-shrink-0">{c.sha}</span>
                        <span className="text-[#e6edf3]">{c.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PR opened */}
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex items-center gap-1 bg-[#1a7f37] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="6" y1="9" x2="6" y2="15"/>
                        <path d="M21 9h-4a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h1"/><polyline points="18 6 21 9 18 12"/>
                      </svg>
                      Open
                    </div>
                    <div>
                      <p className="text-[#e6edf3] font-semibold">MM-74: Hyva checkout — address validation fix <span className="text-[#7d8590] font-normal">#149</span></p>
                      <p className="text-[#7d8590] text-[11px] mt-0.5">max-a wants to merge 3 commits into <span className="text-[#79c0ff]">staging</span> from <span className="text-[#79c0ff]">fix/mm-74-checkout</span></p>
                    </div>
                  </div>
                  <div className="pl-8 flex gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-[#3fb950] text-[10px]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      3 checks passed
                    </span>
                    <span className="text-[#7d8590] text-[10px]">Review requested: ryan-p</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex lg:flex-col items-center justify-center gap-2 px-2">
                <div className="hidden lg:block w-px flex-1 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
                <div className="bg-gold/10 border border-gold/30 rounded-full p-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold rotate-90 lg:rotate-0">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <div className="hidden lg:block w-px flex-1 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
                <span className="text-gold text-[10px] font-medium uppercase tracking-widest whitespace-nowrap">auto-synced</span>
              </div>

              {/* Monday card */}
              <div className="flex-1 bg-[#1c1f3a] border border-[#3d3f6e] rounded-xl overflow-hidden text-xs">
                {/* monday header */}
                <div className="px-4 py-2.5 border-b border-[#3d3f6e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#f65f7c] flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">m</span>
                    </div>
                    <span className="text-[#b0b3d6] font-semibold">monday.com</span>
                    <span className="text-[#5c5f8a]">·</span>
                    <span className="text-[#5c5f8a]">Dev Sprint Board</span>
                  </div>
                  <span className="text-[#5c5f8a] text-[10px]">just now</span>
                </div>

                {/* card header */}
                <div className="px-4 py-3 border-b border-[#2a2d52]">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[#7b7fbe] font-mono font-bold flex-shrink-0">MM-74</span>
                    <span className="text-[#e2e4f3] font-semibold leading-snug">Hyva checkout — address validation fix</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#7b52e8]/20 text-[#a78bfa] border border-[#7b52e8]/30 text-[10px] px-2 py-0.5 rounded font-medium">In Review</span>
                    <span className="bg-[#1a3a2a] text-[#4ade80] border border-[#166534]/40 text-[10px] px-2 py-0.5 rounded font-medium">Staging</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-[#5c5f8a] flex items-center justify-center">
                        <span className="text-white text-[8px]">M</span>
                      </div>
                      <span className="text-[#7b7fbe] text-[10px]">Max A</span>
                    </div>
                  </div>
                </div>

                {/* activity feed */}
                <div className="px-4 py-3">
                  <p className="text-[#5c5f8a] text-[10px] uppercase tracking-wider mb-2.5">Activity</p>
                  <div className="space-y-3">
                    {/* commit update */}
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2a2d52] border border-[#3d3f6e] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#7b7fbe]">
                          <circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#b0b3d6] leading-relaxed">🔀 <span className="font-medium">3 commits pushed</span> by max-a</p>
                        <div className="mt-1 space-y-0.5 pl-1 border-l border-[#3d3f6e]">
                          {['a3f9c12 · fix multi-step address validation', 'd8e1047 · add unit tests', '2b5a883 · remove legacy fallback'].map(c => (
                            <p key={c} className="text-[#5c5f8a]">{c}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* status change */}
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2a2d52] border border-[#3d3f6e] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a78bfa]">
                          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                      </div>
                      <p className="text-[#b0b3d6]">Status <span className="text-[#5c5f8a]">Working on it</span> → <span className="text-[#a78bfa] font-medium">In Review</span></p>
                    </div>
                    {/* review */}
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1a3a2a] border border-[#166534]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#4ade80] text-[8px] font-bold">R</span>
                      </div>
                      <p className="text-[#b0b3d6]">Review requested: <span className="text-[#a78bfa] font-medium">@ryan-p</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PR Lifecycle ── */}
          <div className="mb-12">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">PR lifecycle → Monday status</p>
            <div className="relative">
              {/* connecting line */}
              <div className="hidden md:block absolute top-8 left-[calc(12.5%)] right-[calc(12.5%)] h-px bg-gradient-to-r from-border-subtle via-gold/40 to-emerald-600/60" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    event: 'Dev pushes branch',
                    ghLabel: 'Branch pushed',
                    ghColor: 'bg-[#1f2937] text-[#7d8590] border-[#30363d]',
                    mondayStatus: 'Working on it',
                    mondayColor: 'bg-[#0f3460] text-[#579dff]',
                    dot: 'bg-[#30363d]',
                  },
                  {
                    event: 'PR opened',
                    ghLabel: '● Open',
                    ghColor: 'bg-[#1a3a2a] text-[#3fb950] border-[#166534]/60',
                    mondayStatus: 'In Review',
                    mondayColor: 'bg-[#2d1b4e] text-[#a78bfa]',
                    dot: 'bg-[#3fb950]',
                  },
                  {
                    event: 'CI passes + reviewed',
                    ghLabel: '✓ Checks passed',
                    ghColor: 'bg-[#1a3a2a] text-[#3fb950] border-[#166534]/60',
                    mondayStatus: 'In Review ✓',
                    mondayColor: 'bg-[#2d1b4e] text-[#a78bfa]',
                    dot: 'bg-[#3fb950]',
                  },
                  {
                    event: 'PR merged',
                    ghLabel: '⬤ Merged',
                    ghColor: 'bg-[#271a4a] text-[#a371f7] border-[#6e40c9]/40',
                    mondayStatus: 'Done',
                    mondayColor: 'bg-[#0b3d2e] text-[#2bac76]',
                    dot: 'bg-[#a371f7]',
                  },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    {/* step dot */}
                    <div className={`w-4 h-4 rounded-full border-2 border-bg z-10 ${step.dot}`} />
                    <div className="w-full space-y-2">
                      <p className="text-muted text-[10px] text-center">{step.event}</p>
                      {/* github badge */}
                      <div className={`border rounded-lg px-3 py-2 text-center text-[11px] font-medium ${step.ghColor}`}>
                        <div className="flex items-center justify-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                          {step.ghLabel}
                        </div>
                      </div>
                      {/* down arrow */}
                      <div className="flex justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                        </svg>
                      </div>
                      {/* monday status */}
                      <div className={`rounded-lg px-3 py-2 text-center text-[11px] font-medium border border-transparent ${step.mondayColor}`}>
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-3 h-3 rounded bg-[#f65f7c] flex items-center justify-center">
                            <span className="text-white text-[6px] font-bold">m</span>
                          </div>
                          {step.mondayStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Actions from inside Monday ── */}
          <div className="mb-10">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">AI actions — available on every ticket</p>
            <div className="bg-[#1c1f3a] border border-[#3d3f6e] rounded-xl overflow-hidden">
              {/* monday sidebar header */}
              <div className="px-4 py-2.5 border-b border-[#3d3f6e] flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#f65f7c] flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">m</span>
                </div>
                <span className="text-[#b0b3d6] text-xs font-semibold">AI Assistant</span>
                <span className="ml-auto text-[10px] text-[#5c5f8a] bg-[#2a2d52] px-2 py-0.5 rounded-full">MM-74</span>
              </div>
              <div className="p-4 grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Summarise git activity', desc: 'Distills all linked commits into a plain-English summary of what changed and why', icon: '📋' },
                  { label: 'Draft PR description',   desc: 'Generates a full PR body from commit history — ready to paste into GitHub',         icon: '✍️' },
                  { label: 'Estimate effort',         desc: 'Reads the ticket description and returns a rough dev-hour estimate',               icon: '⏱' },
                  { label: 'Write release notes',     desc: 'Customer-facing summary of all merged PRs in the current sprint',                  icon: '📣' },
                ].map(a => (
                  <div key={a.label} className="bg-[#2a2d52] border border-[#3d3f6e] hover:border-[#7b52e8]/60 rounded-lg p-3 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{a.icon}</span>
                      <span className="text-[#e2e4f3] text-xs font-semibold group-hover:text-[#a78bfa] transition-colors">{a.label}</span>
                    </div>
                    <p className="text-[#5c5f8a] text-[11px] leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Security + deployment ── */}
          <div className="grid md:grid-cols-2 gap-4 mb-0">
            <div className="bg-card border border-emerald-800/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔒</span>
                <h3 className="text-ink font-semibold text-sm">Security</h3>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { t: 'Webhook signature verified',  d: 'Every event is signed. Anything that doesn\'t match is rejected before processing.' },
                  { t: 'Tokens in environment only',  d: 'No credentials in code or git — Vercel env vars only.' },
                  { t: 'Read-only GitHub access',     d: 'Receives push/PR events. Cannot write to the repository.' },
                  { t: 'Stateless — nothing stored',  d: 'Receives, processes, responds. No database, no log retention.' },
                ].map(i => (
                  <div key={i.t} className="flex gap-2">
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    <div><span className="text-ink font-medium">{i.t} — </span><span className="text-muted">{i.d}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🚀</span>
                <h3 className="text-ink font-semibold text-sm">Deployment path</h3>
              </div>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gold/10 text-gold border border-gold/20 text-[10px] px-2 py-0.5 rounded-full font-medium">Phase 1</span>
                    <span className="text-ink font-medium">Vercel Edge Function</span>
                  </div>
                  <p className="text-muted pl-1">Private webhook endpoint — no marketplace, full control, ships in a day.</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-surface text-muted border border-border-subtle text-[10px] px-2 py-0.5 rounded-full font-medium">Phase 2</span>
                    <span className="text-ink font-medium">Native Monday App</span>
                  </div>
                  <p className="text-muted pl-1">Sidebar panel inside Monday — prompt Claude from any ticket. ~2 weeks extra build.</p>
                </div>
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
            <h2 className="font-display text-2xl font-bold text-ink mb-2">An Agent That Triages, Fixes, and Opens PRs</h2>
            <p className="text-muted text-base max-w-2xl">
              The agent monitors error logs and open bug tickets, writes a fix on an isolated branch,
              validates it against tests, and opens a PR. Developers review a finished solution — not a raw error.
            </p>
          </div>

          {/* ── Process flow with mock log + mock PR ── */}
          <div className="mb-10">
            <p className="text-muted text-xs uppercase tracking-widest mb-6">How it works — end to end</p>

            {/* Step 1: Error detected */}
            <div className="mb-6 flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-700/50 flex items-center justify-center">
                  <span className="text-red-400 text-xs font-bold">01</span>
                </div>
                <div className="w-px flex-1 bg-border-subtle min-h-[40px]" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-ink font-semibold text-sm mb-3">Error detected in logs</p>
                {/* Magento log mockup */}
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden font-mono text-xs">
                  <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                    <span className="text-[#7d8590]">var/log/exception.log · Magento staging</span>
                    <span className="flex items-center gap-1 text-red-400 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />New error</span>
                  </div>
                  <div className="p-4 space-y-1 text-[11px] leading-relaxed">
                    <p className="text-red-400">[2026-05-14 09:12:33] main.CRITICAL: Deprecated: Return type of MedMart\Base\Model\Cart\Quote::serialize()</p>
                    <p className="text-[#7d8590]">  must be explicitly declared in app/code/MedMart/Base/Model/Cart/Quote.php on line 84</p>
                    <p className="text-[#7d8590]">  PHP 8.2 strict deprecation · first seen 6 times this hour</p>
                    <p className="text-[#3fb950] mt-2">→ Agent triggered · analyzing context...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Context gathered */}
            <div className="mb-6 flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">02</span>
                </div>
                <div className="w-px flex-1 bg-border-subtle min-h-[40px]" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-ink font-semibold text-sm mb-3">Context gathered automatically</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: '📄', label: 'Source file read', detail: 'Quote.php · 214 lines · last changed 3 weeks ago' },
                    { icon: '🕐', label: 'Git history scanned', detail: '8 commits touching this file — pattern understood' },
                    { icon: '🧾', label: 'PHP 8.2 rule checked', detail: 'Return type declaration required — fix is straightforward' },
                  ].map(c => (
                    <div key={c.label} className="bg-surface border border-border-subtle rounded-lg p-3 text-xs">
                      <span className="text-lg block mb-1">{c.icon}</span>
                      <p className="text-ink font-medium mb-0.5">{c.label}</p>
                      <p className="text-muted">{c.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Fix written + tests pass */}
            <div className="mb-6 flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-700/50 flex items-center justify-center">
                  <span className="text-purple-400 text-xs font-bold">03</span>
                </div>
                <div className="w-px flex-1 bg-border-subtle min-h-[40px]" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-ink font-semibold text-sm mb-3">Fix written on an isolated branch</p>
                {/* diff mockup */}
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden font-mono text-[11px]">
                  <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                    <span className="text-[#7d8590]">app/code/MedMart/Base/Model/Cart/Quote.php</span>
                    <span className="text-[#7d8590] text-[10px]">agent/fix-quote-serialize-return-type</span>
                  </div>
                  <div className="p-4 space-y-0.5 leading-relaxed">
                    <p className="text-[#7d8590]">@@ -82,7 +82,7 @@</p>
                    <p className="bg-red-900/30 text-red-400 px-2 -mx-2">-  public function serialize()</p>
                    <p className="bg-emerald-900/30 text-emerald-400 px-2 -mx-2">+  public function serialize(): string</p>
                    <p className="text-[#e6edf3] mt-1 pl-2">{'{'}</p>
                    <p className="text-[#e6edf3] pl-6">return json_encode($this-&gt;getData());</p>
                    <p className="text-[#e6edf3] pl-2">{'}'}</p>
                    <div className="mt-3 flex items-center gap-3 border-t border-[#30363d] pt-3">
                      <span className="flex items-center gap-1 text-[#3fb950] text-[10px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Tests pass · 3/3</span>
                      <span className="flex items-center gap-1 text-[#3fb950] text-[10px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Static analysis clean</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: PR opened */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs font-bold">04</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-ink font-semibold text-sm mb-3">PR opened — ready for one-click review</p>
                {/* GitHub PR mockup */}
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden text-xs">
                  <div className="px-4 py-3 border-b border-[#30363d] flex items-start gap-3">
                    <div className="flex items-center gap-1.5 bg-[#1a7f37] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="6" y1="9" x2="6" y2="15"/><path d="M21 9h-4a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h1"/><polyline points="18 6 21 9 18 12"/></svg>
                      Open
                    </div>
                    <div>
                      <p className="text-[#e6edf3] font-semibold">[AI Fix] Quote::serialize() return type declaration — PHP 8.2 deprecation <span className="text-[#7d8590] font-normal">#152</span></p>
                      <p className="text-[#7d8590] mt-0.5 text-[11px]">medmart-ai-agent wants to merge 1 commit into <span className="text-[#79c0ff]">staging</span> from <span className="text-[#79c0ff]">agent/fix-quote-serialize-return-type</span></p>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-b border-[#21262d] text-[#e6edf3] text-[11px] leading-relaxed space-y-2">
                    <p className="font-semibold text-[#e6edf3]">What broke</p>
                    <p className="text-[#7d8590]">PHP 8.2 requires explicit return type declarations. <span className="font-mono text-[#e6edf3]">Quote::serialize()</span> was missing one, triggering a CRITICAL deprecation logged 6 times in the last hour on staging.</p>
                    <p className="font-semibold text-[#e6edf3] pt-1">What was changed</p>
                    <p className="text-[#7d8590]">Added <span className="font-mono text-[#e6edf3]">: string</span> return type to <span className="font-mono text-[#e6edf3]">serialize()</span> in <span className="font-mono text-[#e6edf3]">Quote.php:84</span>. All 3 existing tests pass. Static analysis clean.</p>
                  </div>
                  <div className="px-4 py-2.5 flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[#3fb950] text-[10px] font-medium"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>3 checks passed</span>
                    <span className="text-[#7d8590] text-[10px]">1 file · +1 −1</span>
                    <span className="ml-auto text-[#7d8590] text-[10px]">Review requested: ryan-p</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Handles vs escalates ── */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-emerald-800/40 rounded-xl p-5">
              <h3 className="text-emerald-400 font-semibold mb-4">✓ Agent handles autonomously</h3>
              <div className="space-y-2 text-sm text-muted">
                {[
                  'PHP deprecation warnings (return types, null-safety)',
                  'Broken imports or missing null checks from static analysis',
                  'Template typos and incorrect escaper calls in .phtml files',
                  'Missing translation keys in i18n CSV files',
                  'Outdated vendor API calls after a minor version bump',
                  'Simple CSS/layout regressions flagged by visual diff',
                ].map(i => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    {i}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold mb-4">⚠ Always escalates to a human</h3>
              <div className="space-y-2 text-sm text-muted">
                {[
                  'Business logic — pricing, tax, checkout, B2B rules',
                  'Database schema changes of any kind',
                  'Security or authentication code',
                  'Fixes that span multiple services',
                  'Ambiguous root cause with multiple possible explanations',
                  'Any area without tests to validate against',
                ].map(i => (
                  <div key={i} className="flex gap-2">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">⚠</span>
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Impact stats ── */}
          <div className="bg-surface border border-border-subtle rounded-xl p-8 mb-6">
            <p className="text-ink font-semibold mb-6 text-center">Where the time savings come from</p>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { stat: '~30%', label: 'of bug tickets', sub: 'are low-complexity fixes a developer spends 30–90 min on per ticket' },
                { stat: '< 5 min', label: 'detection to PR',  sub: 'from error detected to a reviewed, tested PR ready for approval' },
                { stat: '1 review', label: 'to close it',     sub: 'approve or close — no triage, no reproduction, no context-switching' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-gold font-display text-4xl font-bold mb-1">{s.stat}</p>
                  <p className="text-ink font-semibold mb-1">{s.label}</p>
                  <p className="text-muted text-sm leading-relaxed">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-surface border border-border-subtle rounded-xl">
            <p className="text-ink font-semibold mb-2">Human always in the loop</p>
            <p className="text-muted text-sm leading-relaxed">
              The agent opens PRs. It never merges them. Every fix goes through the standard review process —
              the difference is that developers review a complete, tested solution rather than a raw stack trace.
              The team defines what the agent is allowed to touch; it works within those boundaries.
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
