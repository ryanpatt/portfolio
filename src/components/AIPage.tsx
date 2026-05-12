import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedItem { name: string; modifier: string | null; qty: number; price: number }
interface VoicePreset { label: string; transcript: string; parsed: ParsedItem[] }
type VoiceStage = 'idle' | 'listening' | 'parsing' | 'done'
type StepStatus = 'pending' | 'running' | 'done'
interface AgentStepDef { tool: string; input: string; output: string; ms: number }
interface AgentStep extends AgentStepDef { status: StepStatus }

// ─── Models & Tools ───────────────────────────────────────────────────────────
const MODELS = [
  { name: 'Claude Sonnet / Haiku', provider: 'Anthropic', badge: 'Primary' },
  { name: 'GPT-4o', provider: 'OpenAI', badge: 'Vision + Tools' },
  { name: 'Whisper v3', provider: 'OpenAI', badge: 'Speech → Text' },
  { name: 'text-embedding-3-large', provider: 'OpenAI', badge: 'Embeddings' },
  { name: 'Mistral Large 2', provider: 'Mistral AI', badge: 'EU Residency' },
  { name: 'Llama 3.1 70B', provider: 'Meta / Ollama', badge: 'Local Inference' },
]

const TOOL_STACK = [
  'Vercel AI SDK', 'Tool Calling / Function Schemas', 'RAG + pgvector',
  'Streaming UI', 'Structured Output (Zod)', 'Web Speech API',
  'Agent Loops', 'Pinecone', 'LangChain', 'MCP Servers',
  'OpenAI Embeddings', 'Retrieval Augmented Generation',
]

// ─── Case Studies ─────────────────────────────────────────────────────────────
const CASE_STUDIES = [
  {
    client: 'Adobe Commerce',
    tag: 'Enterprise E-Commerce',
    accentColor: 'text-red-400',
    badgeBg: 'bg-red-900/30 text-red-300',
    title: 'Semantic Product Discovery & Catalog AI',
    problem: 'Keyword search returned poor results for conversational queries like "warm hiking boots for snow". Writing product descriptions for 40k+ SKUs was a bottleneck requiring dedicated copywriters.',
    solution: [
      'Replaced Elasticsearch keyword matching with OpenAI text-embedding-3-large — queries and products are both embedded and matched by cosine similarity via pgvector.',
      'Admin panel AI tool drafts descriptions from structured attribute data. Editors review and approve rather than write from scratch, cutting per-SKU time from 15 min to 2.',
      'Image embedding pipeline generates "visually similar" product recommendations from thumbnail vectors, improving cross-sell on product detail pages.',
    ],
    tech: ['OpenAI Embeddings', 'pgvector', 'Claude 3.5 Sonnet', 'Magento 2 Module', 'PHP 8', 'React Admin'],
    outcomes: [
      { label: 'Search → purchase', delta: '+23%' },
      { label: 'Description time', delta: '−80%' },
      { label: 'Zero-result queries', delta: '−61%' },
    ],
  },
  {
    client: 'ClockHQ',
    tag: 'B2B SaaS',
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-900/30 text-blue-300',
    title: 'Scheduling Assistant & Nightly Compliance Agent',
    problem: 'Managers manually reviewed timesheets for overtime. Employees frequently forgot to clock out. No natural language interface for ad-hoc questions like "who hit 45h last week?"',
    solution: [
      'NL query interface via Claude + tool calling: natural language questions translate to structured DB queries, returned as plain English summaries with source data.',
      'Nightly compliance agent (Vercel Cron) scans entries against configurable rules — overtime thresholds, break requirements, open sessions — and surfaces action items before payroll runs.',
      'Voice clock-in via Web Speech API: "clock in on the Johnson project" → intent parsed by Claude Haiku → time entry created with the correct project tag.',
    ],
    tech: ['Claude Sonnet', 'Vercel AI SDK', 'Tool Calling', 'Vercel Cron', 'Web Speech API', 'tRPC', 'Prisma'],
    outcomes: [
      { label: 'Manual review time', delta: '−70%' },
      { label: 'Missed clock-outs', delta: '−85%' },
      { label: 'Compliance catch rate', delta: '100%' },
    ],
  },
  {
    client: 'Jamestown Cafe',
    tag: 'Hospitality / POS',
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-900/30 text-amber-300',
    title: 'Voice-to-Cart Kiosk Ordering',
    problem: 'Staff bottleneck at peak hours without budget for proprietary kiosk hardware. Regulars wanted frictionless reordering of their usual.',
    solution: [
      'Browser-based voice kiosk using Web Speech API with OpenAI Whisper as a server-side fallback for noisy environments.',
      'Spoken orders are transcribed and passed to Claude Haiku with the live Square catalog as context — items, sizes, and modifiers are parsed into a structured cart object.',
      '"The usual" feature: returning customers\' last 3 orders are included as context, and the likeliest repeat order is suggested for one-tap confirmation.',
    ],
    tech: ['Web Speech API', 'OpenAI Whisper', 'Claude Haiku', 'Square POS API', 'React', 'Vercel Functions'],
    outcomes: [
      { label: 'Avg. order time', delta: '−40%' },
      { label: 'Order accuracy', delta: '97.4%' },
      { label: 'Return customer NPS', delta: '+31%' },
    ],
  },
]

// ─── Voice Demo ───────────────────────────────────────────────────────────────
const VOICE_PRESETS: VoicePreset[] = [
  {
    label: 'Morning order',
    transcript: "I'll have a large iced coffee and the avocado toast, please.",
    parsed: [
      { name: 'Iced Coffee', modifier: 'Large', qty: 1, price: 5.25 },
      { name: 'Avocado Toast', modifier: null, qty: 1, price: 11.00 },
    ],
  },
  {
    label: 'Quick run',
    transcript: 'Just an oat milk latte to go.',
    parsed: [
      { name: 'Oat Milk Latte', modifier: 'Medium', qty: 1, price: 6.00 },
    ],
  },
  {
    label: 'Lunch for two',
    transcript: 'Can I get a turkey club and two espressos?',
    parsed: [
      { name: 'Turkey Club', modifier: null, qty: 1, price: 13.50 },
      { name: 'Espresso', modifier: 'Double', qty: 2, price: 3.75 },
    ],
  },
]

// ─── Agent Demo ───────────────────────────────────────────────────────────────
const AGENT_STEP_DEFS: AgentStepDef[] = [
  { tool: 'fetch_time_entries', input: '{ "week": "2026-05-05", "scope": "all_employees" }', output: '42 entries across 8 employees — 280.5h total', ms: 900 },
  { tool: 'load_compliance_rules', input: '{ "state": "FL", "plan": "standard" }', output: 'Rules: daily OT >10h · weekly OT >40h · 30m break after 6h', ms: 500 },
  { tool: 'scan_for_violations', input: '{ "checks": ["overtime", "open_sessions", "duplicates"] }', output: '3 overtime flags · 1 duplicate entry · 2 open sessions', ms: 1400 },
  { tool: 'enrich_employee_context', input: '{ "ids": ["emp_004", "emp_007", "emp_012"] }', output: 'Profiles loaded: J. Rivera · M. Chen · T. Okafor', ms: 700 },
  { tool: 'generate_compliance_report', input: '{ "sort": "severity_desc", "deadline": "2026-05-14" }', output: 'Report ready — 3 action items, payroll closes May 14', ms: 1100 },
]

const AGENT_FINDINGS = [
  {
    sev: 'HIGH',
    sevColor: 'text-red-400',
    sevBg: 'bg-red-900/20 border-red-500/30',
    employee: 'J. Rivera',
    issue: '47.5h logged week of May 5–9 — 7.5h unapproved overtime on record.',
    action: 'Request manager approval before payroll closes May 14.',
  },
  {
    sev: 'MEDIUM',
    sevColor: 'text-amber-400',
    sevBg: 'bg-amber-900/20 border-amber-500/30',
    employee: 'M. Chen',
    issue: 'Duplicate entry: "Client call — Acme" logged twice on May 7 at 2 PM (1.5h each).',
    action: 'Flagged for employee review. One entry queued for deletion.',
  },
  {
    sev: 'LOW',
    sevColor: 'text-blue-400',
    sevBg: 'bg-blue-900/20 border-blue-500/30',
    employee: 'T. Okafor',
    issue: 'Two open sessions (May 6, May 8) — forgot to clock out.',
    action: 'Nudge sent via push notification. Manager sign-off needed to finalize hours.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIPage() {
  const [expandedStudy, setExpandedStudy] = useState<number | null>(null)

  // Voice demo state
  const [voiceStage, setVoiceStage] = useState<VoiceStage>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsedText, setParsedText] = useState('')
  const [cart, setCart] = useState<ParsedItem[]>([])
  const voiceTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Agent demo state
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [agentRunning, setAgentRunning] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const agentTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      voiceTimers.current.forEach(clearTimeout)
      agentTimers.current.forEach(clearTimeout)
    }
  }, [])

  // ── Typewriter helper ──────────────────────────────────────────────────────
  const typewriter = (
    text: string,
    setter: (s: string) => void,
    charStep: number,
    delay: number,
    timersRef: { current: ReturnType<typeof setTimeout>[] },
    onDone: () => void
  ) => {
    let i = 0
    const tick = () => {
      i = Math.min(i + charStep, text.length)
      setter(text.slice(0, i))
      if (i < text.length) {
        const t = setTimeout(tick, delay)
        timersRef.current.push(t)
      } else {
        onDone()
      }
    }
    const t = setTimeout(tick, delay)
    timersRef.current.push(t)
  }

  // ── Voice demo ─────────────────────────────────────────────────────────────
  const runVoiceDemo = (preset: VoicePreset) => {
    voiceTimers.current.forEach(clearTimeout)
    voiceTimers.current = []
    setVoiceStage('listening')
    setTranscript('')
    setParsedText('')
    setCart([])

    typewriter(preset.transcript, setTranscript, 2, 28, voiceTimers, () => {
      const t = setTimeout(() => {
        setVoiceStage('parsing')
        const jsonStr = JSON.stringify(
          preset.parsed.map((p) => ({
            item: p.name,
            ...(p.modifier ? { size: p.modifier } : {}),
            qty: p.qty,
          })),
          null,
          2
        )
        typewriter(jsonStr, setParsedText, 4, 16, voiceTimers, () => {
          const t2 = setTimeout(() => {
            setCart(preset.parsed)
            setVoiceStage('done')
          }, 400)
          voiceTimers.current.push(t2)
        })
      }, 700)
      voiceTimers.current.push(t)
    })
  }

  const resetVoice = () => {
    voiceTimers.current.forEach(clearTimeout)
    voiceTimers.current = []
    setVoiceStage('idle')
    setTranscript('')
    setParsedText('')
    setCart([])
  }

  // ── Agent demo ─────────────────────────────────────────────────────────────
  const runAgent = () => {
    if (agentRunning) return
    agentTimers.current.forEach(clearTimeout)
    agentTimers.current = []
    setAgentRunning(true)
    setShowReport(false)
    setAgentSteps(AGENT_STEP_DEFS.map((s) => ({ ...s, status: 'pending' })))

    let delay = 300
    AGENT_STEP_DEFS.forEach((step, i) => {
      const t1 = setTimeout(() => {
        setAgentSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s)))
      }, delay)
      delay += step.ms
      const t2 = setTimeout(() => {
        setAgentSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'done' } : s)))
      }, delay)
      delay += 150
      agentTimers.current.push(t1, t2)
    })

    const t3 = setTimeout(() => {
      setShowReport(true)
      setAgentRunning(false)
    }, delay + 500)
    agentTimers.current.push(t3)
  }

  const resetAgent = () => {
    agentTimers.current.forEach(clearTimeout)
    agentTimers.current = []
    setAgentRunning(false)
    setAgentSteps([])
    setShowReport(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border-subtle">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            ryanpatt.com
          </Link>
          <span className="text-xs text-muted font-mono">AI Integrations</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* ── Hero ── */}
        <section>
          <div className="inline-flex items-center gap-2 text-xs text-gold-light bg-gold/10 border border-gold/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            AI &amp; LLM Integrations
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4 leading-tight">
            Building with<br />
            <span className="text-gold">Language Models</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl leading-relaxed">
            Practical AI integration work across e-commerce, SaaS, and hospitality — semantic search,
            agent loops, voice interfaces, and LLM-driven automation embedded into real product stacks.
          </p>
        </section>

        {/* ── Models & Tools ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-8">Models &amp; Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {MODELS.map((m) => (
              <div key={m.name} className="bg-card border border-border-subtle rounded-xl p-4">
                <div className="text-sm font-medium text-ink mb-1">{m.name}</div>
                <div className="text-xs text-muted mb-2">{m.provider}</div>
                <span className="text-xs bg-surface text-muted border border-border-subtle rounded-full px-2 py-0.5">
                  {m.badge}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {TOOL_STACK.map((t) => (
              <span
                key={t}
                className="text-xs text-gold-light border border-gold/20 bg-gold/5 rounded-full px-3 py-1"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Case Studies ── */}
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Case Studies</h2>
          <p className="text-muted text-sm mb-8">AI features built into existing client product stacks.</p>
          <div className="space-y-4">
            {CASE_STUDIES.map((cs, i) => (
              <div key={cs.client} className="bg-card border border-border-subtle rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left p-6 hover:bg-card-hover transition-colors"
                  onClick={() => setExpandedStudy(expandedStudy === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${cs.badgeBg}`}>
                          {cs.tag}
                        </span>
                        <span className="text-xs text-muted">{cs.client}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-ink">{cs.title}</h3>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      {cs.outcomes.map((o) => (
                        <div key={o.label} className="text-right hidden md:block">
                          <div className={`font-display font-bold text-lg ${cs.accentColor}`}>{o.delta}</div>
                          <div className="text-xs text-muted">{o.label}</div>
                        </div>
                      ))}
                      <svg
                        className={`text-muted transition-transform duration-200 ${expandedStudy === i ? 'rotate-180' : ''}`}
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </button>

                {expandedStudy === i && (
                  <div className="px-6 pb-6 border-t border-border-subtle">
                    <div className="grid md:grid-cols-2 gap-8 pt-6">
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Problem</h4>
                        <p className="text-muted text-sm leading-relaxed">{cs.problem}</p>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mt-6 mb-3">Solution</h4>
                        <ul className="space-y-3">
                          {cs.solution.map((s, si) => (
                            <li key={si} className="text-sm text-muted leading-relaxed flex gap-2">
                              <span className="text-gold mt-0.5 shrink-0">›</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Stack</h4>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {cs.tech.map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-surface border border-border-subtle text-muted rounded-full px-2 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Outcomes</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {cs.outcomes.map((o) => (
                            <div key={o.label} className="bg-surface rounded-xl p-3 text-center">
                              <div className={`font-display font-bold text-xl ${cs.accentColor}`}>{o.delta}</div>
                              <div className="text-xs text-muted mt-1">{o.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Voice-to-Cart Demo ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-display text-xl font-semibold text-ink">Voice-to-Cart Demo</h2>
            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-full px-2 py-0.5">
              Jamestown Cafe
            </span>
          </div>
          <p className="text-muted text-sm mb-8">
            Simulate the kiosk ordering flow — speech transcription → LLM intent parsing → Square cart.
          </p>

          <div className="bg-card border border-border-subtle rounded-2xl overflow-hidden">
            <div className="bg-surface px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div>
                <div className="font-display font-semibold text-ink text-sm">Jamestown Cafe</div>
                <div className="text-xs text-muted">Kiosk Ordering Terminal</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted">Online</span>
              </div>
            </div>

            <div className="p-6">
              {voiceStage === 'idle' && (
                <div>
                  <p className="text-sm text-muted mb-4">Select a sample order to simulate:</p>
                  <div className="flex flex-wrap gap-3">
                    {VOICE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => runVoiceDemo(p)}
                        className="px-4 py-2 bg-surface hover:bg-card-hover border border-border-subtle rounded-xl text-sm text-ink transition-colors flex items-center gap-2"
                      >
                        <svg className="text-gold" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                        </svg>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {voiceStage !== 'idle' && (
                <div className="space-y-5">
                  {/* Transcript */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {voiceStage === 'listening' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs text-muted font-mono">Transcribing via Whisper...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-muted font-mono">Transcript</span>
                        </>
                      )}
                    </div>
                    <div className="bg-surface rounded-xl px-4 py-3 text-sm text-ink font-mono min-h-10">
                      {transcript}
                      {voiceStage === 'listening' && <span className="animate-pulse">▌</span>}
                    </div>
                  </div>

                  {/* Parsed JSON */}
                  {(voiceStage === 'parsing' || voiceStage === 'done') && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {voiceStage === 'parsing' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                            <span className="text-xs text-muted font-mono">Claude Haiku — parsing intent...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs text-muted font-mono">Parsed order (structured output)</span>
                          </>
                        )}
                      </div>
                      <pre className="bg-surface rounded-xl px-4 py-3 text-xs text-gold-light font-mono overflow-x-auto min-h-16">
                        {parsedText}
                        {voiceStage === 'parsing' && <span className="animate-pulse text-ink">▌</span>}
                      </pre>
                    </div>
                  )}

                  {/* Cart */}
                  {voiceStage === 'done' && cart.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted font-mono">Square cart populated</span>
                      </div>
                      <div className="bg-surface rounded-xl overflow-hidden">
                        {cart.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-4 py-3 ${idx < cart.length - 1 ? 'border-b border-border-subtle' : ''}`}
                          >
                            <div>
                              <span className="text-sm text-ink">{item.name}</span>
                              {item.modifier && (
                                <span className="text-xs text-muted ml-2">— {item.modifier}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted">×{item.qty}</span>
                              <span className="text-ink font-mono">${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="px-4 py-3 border-t border-border-subtle flex justify-between">
                          <span className="text-sm text-muted">Total</span>
                          <span className="text-sm font-bold text-gold font-mono">
                            ${cart.reduce((s, item) => s + item.price * item.qty, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {voiceStage === 'done' && (
                    <button
                      onClick={resetVoice}
                      className="text-xs text-muted hover:text-ink transition-colors"
                    >
                      ← Try another order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Agent Loop Demo ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-display text-xl font-semibold text-ink">Agent Loop Demo</h2>
            <span className="text-xs text-blue-400 bg-blue-900/20 border border-blue-500/30 rounded-full px-2 py-0.5">
              ClockHQ
            </span>
          </div>
          <p className="text-muted text-sm mb-8">
            Nightly compliance agent: tool calls, result synthesis, and actionable report output.
          </p>

          <div className="bg-card border border-border-subtle rounded-2xl overflow-hidden">
            <div className="bg-surface px-6 py-3 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-muted font-mono">compliance-agent — ClockHQ</span>
              </div>
              {agentSteps.length === 0 ? (
                <button
                  onClick={runAgent}
                  className="text-xs bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Run Agent ›
                </button>
              ) : (
                <button
                  onClick={resetAgent}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {agentSteps.length === 0 && (
                <p className="text-sm text-muted">Click "Run Agent" to simulate the nightly compliance scan.</p>
              )}

              {agentSteps.map((step, i) => (
                <div
                  key={i}
                  className={`transition-opacity duration-300 ${step.status === 'pending' ? 'opacity-25' : 'opacity-100'}`}
                >
                  <div className="flex items-start gap-3 font-mono text-sm">
                    <span className="mt-0.5 shrink-0 w-4 text-center">
                      {step.status === 'pending' && <span className="text-muted">○</span>}
                      {step.status === 'running' && <span className="text-gold animate-pulse">◉</span>}
                      {step.status === 'done' && <span className="text-green-400">✓</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-ink">
                        <span className="text-muted text-xs">tool_call</span>
                        <span className="text-gold mx-1">›</span>
                        <span className="text-blue-300">{step.tool}</span>
                      </div>
                      {step.status !== 'pending' && (
                        <div className="text-xs text-muted mt-0.5 break-all">{step.input}</div>
                      )}
                      {step.status === 'done' && (
                        <div className="text-xs text-green-400/80 mt-1">↳ {step.output}</div>
                      )}
                      {step.status === 'running' && (
                        <div className="text-xs text-gold/60 mt-1 animate-pulse">running…</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {showReport && (
                <div className="mt-2 border-t border-border-subtle pt-6 space-y-3">
                  <div className="text-xs text-muted font-mono mb-4">
                    agent_output › compliance_report — 3 findings
                  </div>
                  {AGENT_FINDINGS.map((f, i) => (
                    <div key={i} className={`rounded-xl border p-4 ${f.sevBg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${f.sevColor}`}>{f.sev}</span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-ink">{f.employee}</span>
                      </div>
                      <p className="text-sm text-muted mb-2">{f.issue}</p>
                      <p className="text-xs text-ink/70">
                        <span className="text-muted">Action: </span>{f.action}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Patterns ── */}
        <section className="border-t border-border-subtle pt-16">
          <h2 className="font-display text-xl font-semibold text-ink mb-8">Patterns I Use</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Tool Calling / Function Schemas',
                desc: 'LLMs invoke typed functions to fetch data, run queries, or trigger actions — keeping model output structured and actionable without brittle string parsing.',
              },
              {
                title: 'RAG — Retrieval Augmented Generation',
                desc: 'Embed domain knowledge (catalogs, employee records, menu items) in a vector store and retrieve relevant chunks at query time — grounding answers in live data.',
              },
              {
                title: 'Streaming UI',
                desc: 'Wire Vercel AI SDK\'s useChat / useCompletion directly to streaming model responses. Users see output as it generates, not after a blank loading screen.',
              },
              {
                title: 'Agent Loops with Cron',
                desc: 'Long-running agents triggered on a schedule: fetch → reason → act → report, without user interaction. Ideal for compliance checks, anomaly scans, and digests.',
              },
              {
                title: 'Structured Output + Zod',
                desc: 'Force JSON-schema-compliant output using structured output mode or few-shot prompting, validated with Zod before writing to the database.',
              },
              {
                title: 'Voice Input + Whisper Fallback',
                desc: 'Start with the Web Speech API for zero-latency in-browser transcription. Fall back to Whisper via an edge function when the environment is noisy or the browser unsupported.',
              },
            ].map((p) => (
              <div key={p.title} className="bg-card border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-semibold text-ink mb-2">{p.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="pb-8 flex items-center justify-between border-t border-border-subtle pt-8">
          <Link
            to="/"
            className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to portfolio
          </Link>
          <span className="text-xs text-muted">ryanpatt.com/ai</span>
        </div>

      </main>
    </div>
  )
}
