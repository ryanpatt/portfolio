import { Link } from 'react-router-dom'

const pages: {
  path: string
  category: string
  categoryColor: string
  title: string
  description: string
  bullets: string[]
  icon: React.ReactNode
}[] = [
  {
    path: '/medmart/demo',
    category: 'Security',
    categoryColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    title: 'Technical Audit',
    description: 'Critical issues, security vulnerabilities, and task board across the Adobe Commerce + Hyva stack.',
    bullets: [
      'Worldpay compliance, auth.json credentials, eval() usage',
      'Fastly CDN 4% hit rate, PDP crashes, search indexer',
      'Task tracker with owner, status, and elapsed time',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    path: '/medmart/convert-gmc',
    category: 'Marketing',
    categoryColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    title: 'GMC & Conversion Audit',
    description: 'Google Merchant Center feed issues, checkout conversion blockers, and full third-party script inventory.',
    bullets: [
      'Script inventory: 24 vendors across 3 status tiers',
      'Interactive GMC + cart audit checklists',
      'Trim suggestions — what to cut without revenue impact',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    path: '/medmart/ai-demo',
    category: 'Strategy',
    categoryColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    title: 'AI Opportunities',
    description: "AI use cases scoped to the MedMart stack — effort, impact, and what's already in the codebase.",
    bullets: [
      'Semantic search, meta generation, B2B quote drafting',
      'Effort × impact grid across 8+ use cases',
      "Flags what's already partially built in-house",
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 6v6l4 2" />
        <circle cx="19" cy="5" r="3" />
      </svg>
    ),
  },
  {
    path: '/medmart/training',
    category: 'Dev',
    categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Dev Setup & Training',
    description: 'Onboarding guide for the MedMart development environment — SSH, CLI, local setup, and workflow.',
    bullets: [
      'Magento Cloud CLI setup and SSH access',
      'Local env, composer, and module structure',
      'Branch naming, deploy workflow, and PR conventions',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    path: '/medmart/criteo',
    category: 'Integrations',
    categoryColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: 'Criteo & Invoca',
    description: 'Offline conversion tracking and call attribution integration specs for Criteo and Invoca/CTM.',
    bullets: [
      'Criteo CSV offline conversion upload — schema and cron',
      'Invoca call tracking pixel and postback setup',
      'Open questions and implementation checklist',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    path: '/medmart/config-review',
    category: 'Cleanup',
    categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Module & Config Review',
    description: 'Scope-aware audit of disabled-but-installed modules, orphan per-store config rows, and consolidation candidates across the Adobe Commerce Enterprise stack.',
    bullets: [
      'Per-scope core_config_data scan across all 3 websites',
      '3 modules removed, 1 composer package dropped, 53 orphan rows cleaned',
      '6 items flagged for team review with business-domain rationale',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h18M3 12h18M3 18h18" />
        <circle cx="8" cy="6" r="1.5" fill="currentColor" />
        <circle cx="16" cy="12" r="1.5" fill="currentColor" />
        <circle cx="10" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
]

export default function MedmartHub() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-gold text-base tracking-tight">MedMart</span>
            <span className="text-border-subtle">·</span>
            <span className="text-sm text-muted">Internal tools</span>
          </div>
          <Link to="/" className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            ryanpatt.com
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-4">
            medmartonline.com · Adobe Commerce + Hyva
          </div>
          <h1 className="text-3xl font-display font-bold text-ink mb-3">
            MedMart Project Hub
          </h1>
          <p className="text-muted text-base leading-relaxed max-w-xl">
            All audit work, strategy docs, and integration specs for the MedMart engagement — organized by area.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="group block bg-white/[0.02] hover:bg-white/[0.045] border border-border-subtle hover:border-gold/30 rounded-xl p-6 transition-all duration-150"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-muted group-hover:text-gold transition-colors">
                    {page.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${page.categoryColor}`}>
                    {page.category}
                  </span>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-border-subtle group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                >
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </div>

              <h2 className="text-base font-semibold text-ink mb-1.5 group-hover:text-gold transition-colors">
                {page.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {page.description}
              </p>

              <ul className="space-y-1.5">
                {page.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted/80">
                    <span className="text-border-subtle mt-0.5 shrink-0">—</span>
                    {b}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
