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

const morningReport = `MEDMART MONDAY.COM — MORNING BRIEFING
Generated: Wed May 14, 2026 · 8:00 AM

BOARD SNAPSHOT
══════════════════════════════════════
● Working on it   7 items
● Done            3 items (since yesterday)
● Stuck           2 items  ← needs attention
● Not started    14 items

COMPLETED SINCE YESTERDAY
──────────────────────────
✓ MM-82 Fix add-to-cart link for recommended products
✓ MM-79 Front-end pop-up implementation
✓ MM-74 Hyva checkout step improvements

DUE TODAY
──────────────────────────
⚡ MM-86 Staging deployment — Yurii T
⚡ MM-88 OpenSearch index rebuild — Faisal K

STUCK / NEEDS ACTION
──────────────────────────
🔴 MM-81 Avalara tax config (3 days no update) — no owner
🔴 MM-77 ShipperHQ rate debug (5 days no update) — Max A

STALE (no activity 4+ days)
──────────────────────────
⚠  MM-70, MM-69, MM-65 · recommend triaging or closing`

const eveningReport = `MEDMART MONDAY.COM — END OF DAY SUMMARY
Generated: Wed May 14, 2026 · 5:30 PM

WHAT MOVED TODAY
══════════════════════════════════════
→ MM-86 Staging deployment   [In Progress → Done]   Yurii T
→ MM-88 OpenSearch rebuild   [In Progress → Done]   Faisal K
→ MM-90 Font demo bug fix    [New → Done]            Ryan P
→ MM-83 Hyva PDP polish      [In Progress → Review]  Max A

NOT TOUCHED TODAY (were "working on it")
──────────────────────────────────────────
○ MM-81 Avalara tax config     — 4 days since last update
○ MM-77 ShipperHQ rate debug   — 6 days since last update
○ MM-85 B2B quote flow         — 2 days since last update

SUGGESTED FOR STANDUP TOMORROW
──────────────────────────────────────────
1. Who picks up MM-81 and MM-77?
2. MM-83 ready for Ryan to review?
3. Sprint scope — 3 new items added today`

const agentCode = `// Monday.com daily report agent
// Runs via cron at 8am + 5:30pm
// Delivers to Slack as rpatt

import Anthropic from '@anthropic-ai/sdk'

const monday = async (query: string) => {
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.MONDAY_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

const getBoardItems = () => monday(\`{
  boards(ids: [YOUR_BOARD_ID]) {
    items_page {
      items {
        name
        state
        column_values {
          id
          text
        }
        updated_at
      }
    }
  }
}\`)

async function generateReport(type: 'morning' | 'evening') {
  const { data } = await getBoardItems()
  const items = data.boards[0].items_page.items

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: \`You are a dev team assistant for MedMart.
Analyze these Monday.com board items and write a concise
\${type} team report. Flag stale items (4+ days no update),
blocked items, and what moved since yesterday.

Board data:
\${JSON.stringify(items, null, 2)}\`
    }]
  })

  // Post to Slack as rpatt
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.SLACK_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: '#dev-standup',
      text: message.content[0].text,
    }),
  })
}`

const pipelineCode = `// GitHub webhook → Monday.com middleware
// Deploy on Vercel Edge Function at /api/github-webhook

import { createHmac } from 'crypto'

export async function POST(req: Request) {
  // 1. Verify the webhook is from GitHub
  const sig = req.headers.get('x-hub-signature-256')
  const body = await req.text()
  const expected = 'sha256=' + createHmac('sha256', process.env.GITHUB_SECRET!)
    .update(body).digest('hex')
  if (sig !== expected) return new Response('Unauthorized', { status: 401 })

  const event = JSON.parse(body)

  // 2. Extract ticket IDs from commit messages  e.g. "MM-74: fix checkout"
  const ticketIds = extractTicketIds(event.commits ?? [])

  for (const ticketId of ticketIds) {
    const item = await findMondayItem(ticketId)
    if (!item) continue

    if (event.pull_request?.merged) {
      // PR merged → move ticket to Done
      await updateMondayStatus(item.id, 'Done')
    } else if (event.pull_request?.state === 'open') {
      // PR opened → move to In Review
      await updateMondayStatus(item.id, 'In Review')
    }

    // Post commit summary as an update on the Monday card
    await postMondayUpdate(item.id,
      \`🔀 \${event.commits?.length ?? 1} commit(s) pushed\\n\` +
      (event.commits ?? []).map((c: any) =>
        \`• \${c.message} (\${c.id.slice(0, 7)})\`
      ).join('\\n')
    )
  }

  return new Response('ok')
}

function extractTicketIds(commits: any[]) {
  const pattern = /MM-\\d+/gi
  return [...new Set(
    commits.flatMap(c => c.message.match(pattern) ?? [])
           .map(id => id.toUpperCase())
  )]
}`

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

function CodeBlock({ code, lang = 'ts' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative bg-[#070a12] border border-border-subtle rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <span className="text-muted text-xs">{lang}</span>
        <button onClick={copy} className="text-xs text-muted hover:text-ink transition-colors">
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="p-4 text-xs text-muted leading-relaxed overflow-x-auto whitespace-pre font-mono">
        {code}
      </pre>
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
          <nav className="flex items-center gap-6 text-xs text-muted">
            <a href="#usecases" className="hover:text-ink transition-colors">Use Cases</a>
            <a href="#agent" className="hover:text-ink transition-colors">Daily Agent</a>
            <a href="#pipeline" className="hover:text-ink transition-colors">Dev Pipeline</a>
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
            Three areas where AI can move the needle immediately — grounded in the actual stack,
            extensions, and workflows already in place at MedMart.
          </p>
          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            <a href="#usecases" className="px-5 py-2.5 bg-gold text-bg text-sm font-semibold rounded-lg hover:bg-gold-light transition-colors">
              Ecommerce Use Cases
            </a>
            <a href="#agent" className="px-5 py-2.5 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Monday Agent
            </a>
            <a href="#pipeline" className="px-5 py-2.5 bg-card border border-border-subtle text-ink text-sm font-semibold rounded-lg hover:bg-card-hover transition-colors">
              Dev Pipeline
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
          <div className="mt-8 p-5 bg-surface border border-gold/20 rounded-xl">
            <p className="text-gold text-sm font-semibold mb-1">Already in the codebase</p>
            <p className="text-muted text-xs leading-relaxed">
              <code className="text-ink bg-card px-1 rounded text-[11px]">ApplyMetaGenerationObserver.php</code> was
              added to <code className="text-ink bg-card px-1 rounded text-[11px]">app/code/MedMart/Base/</code> in the
              most recent production deploy. AI meta generation is already happening — the opportunity is to
              expand its scope and wire it to a Claude model for higher-quality output at scale.
            </p>
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
          <CodeBlock code={reportTab === 'morning' ? morningReport : eveningReport} lang="report output" />

          <div className="mt-8">
            <p className="text-muted text-xs mb-3 uppercase tracking-widest">Implementation — ~50 lines</p>
            <CodeBlock code={agentCode} lang="typescript" />
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
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Commits & PRs Visible in Monday</h2>
            <p className="text-muted text-sm max-w-2xl">
              A thin middleware layer (deployed as a Vercel Edge Function) listens to GitHub webhooks
              and keeps Monday.com cards in sync with the actual code — automatically and without anyone
              having to manually update two systems.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="bg-surface border border-border-subtle rounded-xl p-6 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {[
                { label: 'Dev pushes commit', sub: '"MM-74: fix checkout"', icon: '💻' },
                { label: 'GitHub webhook fires', sub: 'POST /api/github-webhook', icon: '🔗' },
                { label: 'Middleware extracts IDs', sub: 'MM-74 → Monday item', icon: '⚙️' },
                { label: 'Monday card updates', sub: 'status + commit note', icon: '✅' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-card border border-border-subtle rounded-lg px-4 py-3 text-center min-w-[130px]">
                    <div className="text-xl mb-1">{step.icon}</div>
                    <div className="text-ink text-xs font-medium">{step.label}</div>
                    <div className="text-muted text-[10px] mt-0.5">{step.sub}</div>
                  </div>
                  {i < 3 && <span className="text-gold text-lg">→</span>}
                </div>
              ))}
            </div>
          </div>

          <CodeBlock code={pipelineCode} lang="typescript (vercel edge function)" />

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-3">What syncs automatically</h3>
              <ul className="space-y-2 text-muted text-xs">
                {[
                  'Commit messages with MM-XX → posted as card update',
                  'PR opened → card moves to "In Review"',
                  'PR merged → card moves to "Done"',
                  'PR review requested → @mention on Monday card',
                  'Failed CI → card flagged with ⚠ warning',
                ].map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold mt-0.5">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-3">AI layer — prompt from Monday</h3>
              <ul className="space-y-2 text-muted text-xs">
                {[
                  'Button on card: "Summarise this ticket\'s git activity"',
                  'Button: "Draft a PR description from these commits"',
                  'Button: "Estimate effort from ticket description"',
                  'Button: "Write release notes for merged PRs this week"',
                  'Webhook → Claude → Monday update (all stays in-platform)',
                ].map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold mt-0.5">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-5 bg-surface border border-border-subtle rounded-xl">
            <p className="text-ink text-sm font-semibold mb-2">Middleware or Monday App?</p>
            <p className="text-muted text-xs leading-relaxed">
              The middleware approach (above) is fastest to ship — a single Vercel Edge Function, no Monday
              marketplace approval needed, full control. A proper Monday App adds a sidebar panel inside the
              Monday UI where the team can prompt Claude directly from a ticket — more polished, ~2 extra weeks
              of build. Both are viable; start with the middleware, promote to a Monday App once the workflow
              is proven.
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
