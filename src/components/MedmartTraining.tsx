import { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Shared primitives ────────────────────────────────────────────────────────

function Cmd({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group bg-[#070a12] border border-border-subtle rounded-lg overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle">
        <span className="text-muted text-[10px] uppercase tracking-wider">shell</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="text-[10px] text-muted hover:text-ink transition-colors"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-sm text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  )
}

function Note({ type = 'info', title, children }: { type?: 'info' | 'warn' | 'danger' | 'tip'; title: string; children: React.ReactNode }) {
  const styles = {
    info:   { border: 'border-blue-800/50',   bg: 'bg-blue-900/10',   icon: 'ℹ', color: 'text-blue-400' },
    warn:   { border: 'border-amber-800/50',  bg: 'bg-amber-900/10',  icon: '⚠', color: 'text-amber-400' },
    danger: { border: 'border-red-800/50',    bg: 'bg-red-900/10',    icon: '🔴', color: 'text-red-400' },
    tip:    { border: 'border-emerald-800/50',bg: 'bg-emerald-900/10',icon: '✓', color: 'text-emerald-400' },
  }[type]
  return (
    <div className={`border ${styles.border} ${styles.bg} rounded-xl p-4 my-4`}>
      <p className={`${styles.color} font-semibold text-sm mb-1.5`}>{styles.icon} {title}</p>
      <div className="text-muted text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">
          {n}
        </div>
        <div className="w-px flex-1 bg-border-subtle mt-1" />
      </div>
      <div className="flex-1 pb-2">
        <p className="text-ink font-semibold mb-2">{title}</p>
        <div className="text-muted text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Section({ id, label, title, subtitle, children }: {
  id: string; label: string; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="py-14 border-t border-border-subtle">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-muted text-xs uppercase tracking-widest">{label}</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      <h2 className="font-display text-2xl font-bold text-ink mb-2">{title}</h2>
      {subtitle && <p className="text-muted text-base max-w-2xl mb-8 leading-relaxed">{subtitle}</p>}
      {children}
    </section>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MedmartTraining() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Sticky header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/medmart/demo" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-xs text-muted">
            <a href="#board"    className="hover:text-ink transition-colors">Board Guide</a>
            <a href="#workflow" className="hover:text-ink transition-colors">Dev Workflow</a>
            <a href="#pipeline" className="hover:text-ink transition-colors">Release Pipeline</a>
            <a href="#sync"     className="hover:text-ink transition-colors">Monday Sync</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">

        {/* Hero */}
        <div className="py-16">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Internal · MedMart Dev Team
          </div>
          <h1 className="font-display text-4xl font-bold text-ink mb-4 leading-tight">
            Dev Team Training Docs
          </h1>
          <p className="text-muted text-lg max-w-2xl leading-relaxed mb-8">
            How we work: the Monday board, branching conventions, and the full release pipeline
            from local to Adobe Commerce Cloud production.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '#board',    label: 'Board Guide' },
              { href: '#workflow', label: 'Dev Workflow' },
              { href: '#pipeline', label: 'Release Pipeline' },
              { href: '#sync',     label: 'Monday ↔ GitHub' },
            ].map(l => (
              <a key={l.href} href={l.href}
                className="px-4 py-2 bg-card border border-border-subtle text-ink text-sm font-medium rounded-lg hover:bg-card-hover transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* ── 01: Board Guide ── */}
        <Section id="board" label="01 · Monday.com" title="Board Guide" subtitle="How to use the MedMart Dev Sprint board — what every column means and how to keep it accurate.">

          {/* Board screenshot */}
          <div className="mb-10 rounded-xl overflow-hidden border border-border-subtle shadow-2xl">
            <img src="/board-example.png" alt="MedMart Dev Sprint board" className="w-full block" />
          </div>

          {/* Board URL */}
          <Note type="info" title="Board location">
            <strong className="text-ink">MedMart Dev Sprint</strong> —{' '}
            <a href="https://medmart.monday.com/boards/18413273901" target="_blank" rel="noopener noreferrer"
               className="text-blue-400 hover:underline">
              medmart.monday.com/boards/18413273901
            </a>
          </Note>

          {/* Groups */}
          <h3 className="text-ink font-semibold mb-3 mt-8">Board groups</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              { name: 'Sprint 1 — Active', desc: 'Current sprint work. Everything here is in flight or recently closed. Keep this group current — it feeds the daily agent report.' },
              { name: 'Backlog / Upcoming', desc: 'Scoped and ready to pick up. Items move here once acceptance criteria are written and they\'re estimated with story points.' },
            ].map(g => (
              <div key={g.name} className="bg-card border border-border-subtle rounded-xl p-4">
                <p className="text-ink font-medium text-sm mb-1">{g.name}</p>
                <p className="text-muted text-xs leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>

          {/* Column table */}
          <h3 className="text-ink font-semibold mb-3">Column reference</h3>
          <div className="overflow-x-auto rounded-xl border border-border-subtle mb-8">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-border-subtle bg-surface">
                  <th className="py-3 px-4 text-muted text-xs uppercase tracking-wider">Column</th>
                  <th className="py-3 px-4 text-muted text-xs uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-muted text-xs uppercase tracking-wider">What it tracks</th>
                  <th className="py-3 px-4 text-muted text-xs uppercase tracking-wider">Who updates it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle px-4">
                {[
                  { col: 'Status',        type: 'status',       desc: 'Where the ticket is in the workflow (see status guide below)',           usage: 'Assignee — keep current daily' },
                  { col: 'Assignee',      type: 'people',       desc: 'Who is actively working this ticket. Use multi-select for pairing.',      usage: 'Assignee / lead' },
                  { col: 'Story Points',  type: 'number',       desc: 'Rough effort estimate in Fibonacci (1, 2, 3, 5, 8). Not hours.',         usage: 'Set before sprint start' },
                  { col: 'Time Tracked',  type: 'time tracker', desc: 'Actual time logged per person. Start/stop directly on the card.',        usage: 'Everyone — start when you begin' },
                  { col: 'Branch',        type: 'text',         desc: 'Git branch name. Filled in when branch is created.',                     usage: 'Assignee when branch is cut' },
                  { col: 'PR Link',       type: 'link',         desc: 'GitHub PR URL + display text (e.g. "PR #149 — In Review").',            usage: 'Assignee when PR is opened' },
                  { col: 'Timeline',      type: 'date range',   desc: 'Planned start and end dates for this ticket in the sprint.',             usage: 'Set at sprint planning' },
                  { col: 'Environment',   type: 'status',       desc: 'Where the code is deployed: Not Deployed / Local / Staging / Production',usage: 'Auto-updated or assignee' },
                  { col: 'Release',       type: 'status',       desc: 'Which sprint or release this belongs to: Sprint 1 / Sprint 2 / Hotfix',  usage: 'Set at sprint planning' },
                  { col: 'Blocks',        type: 'dependency',   desc: 'Links to items this ticket is blocked by or blocking.',                  usage: 'Assignee when dependency exists' },
                ].map(r => (
                  <tr key={r.col} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 text-ink font-medium text-sm whitespace-nowrap">{r.col}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-surface border border-border-subtle text-muted px-2 py-0.5 rounded font-mono">{r.type}</span>
                    </td>
                    <td className="py-3 px-4 text-muted text-sm">{r.desc}</td>
                    <td className="py-3 px-4 text-muted text-sm">{r.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status guide */}
          <h3 className="text-ink font-semibold mb-3">Status definitions</h3>
          <div className="space-y-2 mb-8">
            {[
              { label: 'Not Started',    color: 'bg-[#2c2c2c] text-[#949ba4]',   def: 'In backlog or sprint but not yet picked up. Move to Working on it the moment you begin.' },
              { label: 'Working on it',  color: 'bg-[#3d2b0a] text-[#fdab3d]',   def: 'Actively in development. If you go more than a day without touching it, update the card so others know the state.' },
              { label: 'In Review',      color: 'bg-[#2d1b4e] text-[#a78bfa]',   def: 'PR is open and waiting for code review. Reviewer should be tagged in the PR and on the card.' },
              { label: 'Stuck',          color: 'bg-[#3d0f1f] text-[#e01e5a]',   def: 'Blocked — waiting on a dependency, external party, or unresolved decision. Must have a comment explaining what\'s blocking it.' },
              { label: 'Done',           color: 'bg-[#0b3d2e] text-[#2bac76]',   def: 'PR merged to staging (or production for hotfixes). Code is deployed and verified.' },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-3 p-3 bg-card border border-border-subtle rounded-lg">
                <span className={`text-xs px-2.5 py-1 rounded font-semibold flex-shrink-0 ${s.color}`}>{s.label}</span>
                <p className="text-muted text-sm leading-relaxed">{s.def}</p>
              </div>
            ))}
          </div>

          {/* Environment guide */}
          <h3 className="text-ink font-semibold mb-3">Environment column values</h3>
          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Not Deployed', color: 'bg-[#2c2c2c] text-[#949ba4]', desc: 'Code exists but hasn\'t been deployed anywhere yet.' },
              { label: 'Local',        color: 'bg-[#1a2a40] text-[#579bfc]', desc: 'Running in a local Warden dev environment only.' },
              { label: 'Staging',      color: 'bg-[#3d2b0a] text-[#fdab3d]', desc: 'Deployed to the Cloud staging environment and ready for QA.' },
              { label: 'Production',   color: 'bg-[#0b3d2e] text-[#2bac76]', desc: 'Deployed to production. Work is live on medmartonline.com.' },
            ].map(e => (
              <div key={e.label} className="bg-card border border-border-subtle rounded-xl p-3">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${e.color} block w-fit mb-2`}>{e.label}</span>
                <p className="text-muted text-xs leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>

          {/* Time tracking */}
          <Note type="tip" title="Time tracking — how to use it">
            Open the card, click <strong className="text-ink">Time Tracked</strong>, hit the play button to start the timer. Stop it when you step away.
            You don't need to be exact — within 15 minutes is fine. This data feeds sprint velocity reports and helps with future estimation.
            Do not log time in comments or task names.
          </Note>
        </Section>

        {/* ── 02: Dev Workflow ── */}
        <Section id="workflow" label="02 · Git" title="Dev Workflow" subtitle="The day-to-day process from picking up a ticket to getting code into staging.">

          {/* Branching */}
          <h3 className="text-ink font-semibold mb-3">Branch naming</h3>
          <p className="text-muted text-sm mb-3">All branches follow this pattern:</p>
          <Cmd>{`<type>/mm-<number>-<short-slug>

# Examples
feat/mm-92-ai-meta-generation
fix/mm-74-checkout-address-validation
fix/mm-90-fontscope-referenceerror
ops/mm-86-deploy-pipeline
hotfix/mm-101-avalara-tax-crash`}</Cmd>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {[
              { prefix: 'feat/',    desc: 'New feature or enhancement' },
              { prefix: 'fix/',     desc: 'Bug fix — expected as part of normal sprint' },
              { prefix: 'hotfix/',  desc: 'Emergency fix to production — bypasses standard flow' },
              { prefix: 'ops/',     desc: 'Infrastructure, deployment, CI/CD' },
              { prefix: 'refactor/',desc: 'Refactor with no functional change' },
              { prefix: 'docs/',    desc: 'Documentation only' },
            ].map(b => (
              <div key={b.prefix} className="bg-card border border-border-subtle rounded-lg p-3">
                <code className="text-gold text-xs font-mono">{b.prefix}</code>
                <p className="text-muted text-xs mt-1">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Commit messages */}
          <h3 className="text-ink font-semibold mb-3">Commit message format</h3>
          <p className="text-muted text-sm mb-2">
            Always prefix with the Monday ticket ID. This is how the GitHub↔Monday sync knows which card to update.
          </p>
          <Cmd>{`MM-74: fix multi-step checkout address validation
MM-74: add unit tests for address validator
MM-74: remove legacy billing fallback

# Format: MM-<number>: <imperative short description>
# Use the imperative mood: "fix", "add", "remove" — not "fixed", "added"`}</Cmd>

          <Note type="warn" title="Missing ticket ID = no Monday sync">
            Commits without an <code className="text-ink bg-surface px-1 rounded">MM-XX:</code> prefix won't trigger
            any automatic card updates. The middleware looks for this pattern — always include it.
          </Note>

          {/* Day-to-day steps */}
          <h3 className="text-ink font-semibold mb-5 mt-8">Picking up a ticket — step by step</h3>
          <div>
            <Step n={1} title="Move the card to Working on it">
              Open the ticket in Monday. Set Status → <strong className="text-ink">Working on it</strong>, make sure your name is in Assignee, and start the Time Tracked timer.
            </Step>
            <Step n={2} title="Cut a branch from staging">
              Always branch off the latest <code className="text-ink bg-surface px-1 rounded text-xs">staging</code> branch, not <code className="text-ink bg-surface px-1 rounded text-xs">main</code> or a stale local.
              <Cmd>{`git fetch origin
git checkout -b fix/mm-74-checkout origin/staging`}</Cmd>
            </Step>
            <Step n={3} title="Fill in the Branch column">
              Copy the branch name into the Monday card's <strong className="text-ink">Branch</strong> column so anyone can find it.
            </Step>
            <Step n={4} title="Work and commit with ticket prefix">
              <Cmd>{`git add app/code/MedMart/Base/Model/Cart/Quote.php
git commit -m "MM-74: fix address validation on multi-step checkout"`}</Cmd>
            </Step>
            <Step n={5} title="Open a PR targeting staging">
              Push and open the PR against <code className="text-ink bg-surface px-1 rounded text-xs">staging</code>.
              <Cmd>{`git push -u origin fix/mm-74-checkout`}</Cmd>
              Then on GitHub: base branch = <code className="text-ink bg-surface px-1 rounded text-xs">staging</code>. Add the PR URL to the card's <strong className="text-ink">PR Link</strong> column and move Status to <strong className="text-ink">In Review</strong>.
            </Step>
            <Step n={6} title="After merge — verify on staging">
              Once the PR is merged, the staging environment redeploys automatically (see pipeline section). Verify the fix, then update the card: Status → <strong className="text-ink">Done</strong>, Environment → <strong className="text-ink">Staging</strong>.
            </Step>
          </div>

          {/* PR checklist */}
          <h3 className="text-ink font-semibold mb-3 mt-2">PR checklist</h3>
          <div className="bg-card border border-border-subtle rounded-xl p-5">
            <div className="space-y-2 text-sm text-muted">
              {[
                'PR targets staging branch (not main, not production)',
                'Branch name follows feat/fix/ops/mm-XX-slug format',
                'All commit messages start with MM-XX:',
                'PR description explains what broke (or what was added) and why',
                'Self-review completed — no debug logs, no commented-out code, no hardcoded values',
                'Static analysis passes locally (bin/phpstan analyse or equivalent)',
                'If touching templates: tested in both desktop and mobile',
                'Monday card PR Link column updated, Status moved to In Review',
              ].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-border-subtle mt-0.5 flex-shrink-0">☐</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 03: Release Pipeline ── */}
        <Section id="pipeline" label="03 · Adobe Commerce Cloud" title="Release Pipeline"
          subtitle="How code moves from local to production on Adobe Commerce Cloud — including what the platform does automatically and what requires manual action.">

          {/* Environment diagram */}
          <div className="mb-10">
            <p className="text-muted text-xs uppercase tracking-widest mb-5">Environment hierarchy</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Local',
                  sub: 'Warden / Docker',
                  detail: 'Your machine. Run bin/magento commands here freely. Database is a local copy — not synced with staging.',
                  color: 'border-blue-800/40',
                  dot: 'bg-blue-400',
                },
                {
                  label: 'Staging',
                  sub: 'tin2rimoygcaq · us-5',
                  detail: 'Adobe Commerce Cloud staging. Shares the same hardware tier as production. Database is a periodic snapshot of production data. PRs merged here deploy automatically.',
                  color: 'border-amber-800/40',
                  dot: 'bg-amber-400',
                },
                {
                  label: 'Production',
                  sub: 'medmartonline.com',
                  detail: 'Live site. Deploys triggered by merging staging → production branch, or via magento-cloud CLI. Requires explicit sign-off before promoting.',
                  color: 'border-emerald-800/40',
                  dot: 'bg-emerald-400',
                },
              ].map((env, i) => (
                <div key={env.label} className="relative">
                  <div className={`bg-card border ${env.color} rounded-xl p-5 h-full`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${env.dot}`} />
                      <span className="text-ink font-semibold">{env.label}</span>
                    </div>
                    <p className="text-muted text-[11px] font-mono mb-3">{env.sub}</p>
                    <p className="text-muted text-xs leading-relaxed">{env.detail}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* How deploys work */}
          <h3 className="text-ink font-semibold mb-3">How Adobe Commerce Cloud deploys work</h3>
          <p className="text-muted text-sm mb-4 leading-relaxed">
            Adobe Commerce Cloud uses <strong className="text-ink">git push = deploy</strong>. Pushing to the <code className="text-ink bg-surface px-1 rounded text-xs">staging</code> branch triggers
            a staging deploy; pushing to <code className="text-ink bg-surface px-1 rounded text-xs">production</code> triggers a production deploy.
            The platform runs three phases automatically:
          </p>

          <div className="space-y-3 mb-8">
            {[
              {
                phase: 'Build',
                timing: '~4–8 min · site stays up',
                color: 'border-blue-800/40 bg-blue-900/5',
                dot: 'bg-blue-400',
                steps: [
                  'composer install (if composer.lock changed — slow; otherwise cached)',
                  'bin/magento setup:di:compile — dependency injection compilation',
                  'bin/magento setup:static-content:deploy — CSS, JS, fonts per locale',
                  'Generated files written to shared filesystem',
                ],
                note: 'No database or live services available during build. DI compile errors surface here — test locally first.',
              },
              {
                phase: 'Deploy',
                timing: '~2–5 min · maintenance mode active',
                color: 'border-amber-800/40 bg-amber-900/5',
                dot: 'bg-amber-400',
                steps: [
                  'Site enters maintenance mode (503 for visitors)',
                  'bin/magento setup:upgrade — applies new schema/data patches',
                  'Cache flushed automatically',
                  'Site exits maintenance mode',
                ],
                note: 'This is the window where the site is down. Typically 2–5 minutes. Production deploys should be scheduled outside peak hours.',
              },
              {
                phase: 'Post-deploy',
                timing: 'Background · site is live',
                color: 'border-emerald-800/40 bg-emerald-900/5',
                dot: 'bg-emerald-400',
                steps: [
                  'Varnish/FPC cache warm (critical pages prefetched)',
                  'Health checks run',
                  'Deploy notification sent',
                ],
                note: 'The site is live but cold — first visitors hit origin until Varnish warms. This resolves within a few minutes.',
              },
            ].map(p => (
              <div key={p.phase} className={`border ${p.color} rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span className="text-ink font-semibold">{p.phase} phase</span>
                  <span className="text-muted text-xs ml-auto">{p.timing}</span>
                </div>
                <ul className="space-y-1 text-muted text-sm mb-3">
                  {p.steps.map(s => <li key={s} className="flex gap-2"><span className="text-gold flex-shrink-0">›</span>{s}</li>)}
                </ul>
                <p className="text-muted text-xs bg-surface border border-border-subtle rounded px-3 py-2">{p.note}</p>
              </div>
            ))}
          </div>

          {/* Deploying to staging */}
          <h3 className="text-ink font-semibold mb-3">Deploying to staging</h3>
          <p className="text-muted text-sm mb-3">Merge your feature branch PR into <code className="text-ink bg-surface px-1 rounded text-xs">staging</code> via GitHub — the deploy starts automatically.</p>
          <Cmd>{`# Merge via GitHub UI (preferred), or via CLI:
git checkout staging
git merge fix/mm-74-checkout
git push origin staging

# Watch the deploy log:
magento-cloud log -p tin2rimoygcaq -e staging --tail`}</Cmd>

          <Note type="warn" title="Never push directly to staging">
            Always go through a PR. Direct pushes bypass code review and break the Monday sync
            (the webhook only fires on PR events, not raw pushes to protected branches).
          </Note>

          {/* Promoting to production */}
          <h3 className="text-ink font-semibold mb-3 mt-8">Promoting to production</h3>
          <p className="text-muted text-sm mb-4 leading-relaxed">
            Production deploys require deliberate action — staging does not auto-promote.
            Run through this checklist before every production release.
          </p>

          <div className="bg-card border border-border-subtle rounded-xl p-5 mb-4">
            <p className="text-ink font-semibold text-sm mb-3">Pre-production checklist</p>
            <div className="space-y-2 text-sm text-muted">
              {[
                'All sprint items targeting this release are Done and verified on staging',
                'No Stuck items in the sprint that should block this release',
                'Database backup taken (automatic on Adobe Cloud, but confirm)',
                'Release notes drafted (use the Monday AI action or write manually)',
                'Deploy timed for off-peak — avoid 10am–6pm EST weekdays for major releases',
                'At least one other person has reviewed the staging state',
                'Rollback plan confirmed (see rollback section below)',
              ].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-border-subtle mt-0.5 flex-shrink-0">☐</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Cmd>{`# Option 1: Merge staging → production via GitHub PR (preferred for audit trail)
# Open PR: staging → production on GitHub, have it reviewed, then merge.

# Option 2: Adobe Commerce Cloud CLI merge
magento-cloud environment:merge staging -p tin2rimoygcaq -e production

# Watch production deploy:
magento-cloud log -p tin2rimoygcaq -e production --tail

# Verify after deploy — flush any remaining cache:
magento-cloud ssh -p tin2rimoygcaq -e production "bin/magento cache:flush"
magento-cloud ssh -p tin2rimoygcaq -e production "bin/magento cache:clean"`}</Cmd>

          {/* Adobe Commerce Cloud nuances */}
          <h3 className="text-ink font-semibold mb-4 mt-8">Adobe Commerce Cloud — things to know</h3>
          <div className="space-y-3">
            <Note type="warn" title="SSH cert expires every 12 hours">
              Raw SSH fails with "Permission denied" when the cert is stale. Before any SSH work, run:
              <Cmd>{`magento-cloud ssh-cert:load`}</Cmd>
              Then use <code className="text-ink bg-surface px-1 rounded">magento-cloud ssh</code> or the <code className="text-ink bg-surface px-1 rounded">mmr-staging</code> alias.
            </Note>

            <Note type="danger" title="Project admin ≠ environment access">
              Being an admin on the Cloud project does <strong>not</strong> give you SSH access to each environment.
              Staging and production are granted separately. If you get "service doesn't exist", your env-level role is missing.
              Contact the project owner (dlykins@medmartonline.com) to grant access per environment.
            </Note>

            <Note type="warn" title="Never commit to pub/static, var/, or generated/">
              These directories are written during the build phase. Committing them bloats the repo,
              causes merge conflicts, and is overwritten on every deploy anyway.
              They are in <code className="text-ink bg-surface px-1 rounded">.gitignore</code> — keep it that way.
            </Note>

            <Note type="warn" title="Environment variables — not in code">
              Never put API keys, secrets, or environment-specific config in committed files.
              Use the Cloud variable system:
              <Cmd>{`# Set a variable on staging:
magento-cloud variable:set MONDAY_TOKEN "..." -p tin2rimoygcaq -e staging

# Set on production:
magento-cloud variable:set MONDAY_TOKEN "..." -p tin2rimoygcaq -e production

# Or set via the Cloud Console UI at console.adobecommerce.com`}</Cmd>
            </Note>

            <Note type="info" title="Staging database is a snapshot of production">
              The staging environment runs on a periodic copy of the production database.
              Data you create on staging may be wiped when the next snapshot is taken.
              Don't use staging as persistent storage for test data.
            </Note>
          </div>

          {/* Hotfixes */}
          <h3 className="text-ink font-semibold mb-3 mt-8">Hotfixes</h3>
          <p className="text-muted text-sm mb-3 leading-relaxed">
            A hotfix is an emergency fix applied directly to production, bypassing the normal staging flow.
            Use only when production is actively broken and waiting for a staging cycle is not an option.
          </p>
          <Cmd>{`# Branch from production, not staging:
git fetch origin
git checkout -b hotfix/mm-101-avalara-crash origin/production

# Fix, commit, push:
git commit -m "MM-101: fix Avalara tax crash on checkout"
git push origin hotfix/mm-101-avalara-crash

# Open PR → production (not staging)
# After merge, also merge production back into staging to keep branches in sync:
git checkout staging
git merge production
git push origin staging`}</Cmd>

          <Note type="danger" title="Always back-merge hotfixes to staging">
            If you merge a hotfix directly to production without back-merging to staging,
            the next staging → production promotion will revert your fix. Always close the loop.
          </Note>

          {/* Rollback */}
          <h3 className="text-ink font-semibold mb-3 mt-8">Rollback</h3>
          <p className="text-muted text-sm mb-3">Adobe Commerce Cloud keeps recent snapshots. Two rollback paths:</p>
          <Cmd>{`# Option 1: Redeploy a previous git commit (fastest, no data risk)
magento-cloud environment:redeploy -p tin2rimoygcaq -e production

# Option 2: Restore a database snapshot (use only if schema migration went wrong)
# Via Cloud Console: console.adobecommerce.com → project → environment → Snapshots
# This restores the full database — all orders/data since snapshot are lost.
# Coordinate with the team before doing this.`}</Cmd>

          {/* Useful commands */}
          <h3 className="text-ink font-semibold mb-3 mt-8">Common commands</h3>
          <Cmd>{`# SSH into staging
magento-cloud ssh -p tin2rimoygcaq -e staging

# SSH using alias (after ssh-cert:load)
ssh mmr-staging

# Tail deploy log
magento-cloud log -p tin2rimoygcaq -e staging --tail

# Flush all caches
bin/magento cache:flush
bin/magento cache:clean

# Check environment list and status
magento-cloud environments -p tin2rimoygcaq

# Get environment URL and info
magento-cloud environment:info -p tin2rimoygcaq -e staging

# Run cron manually (if needed)
bin/magento cron:run

# Reindex
bin/magento indexer:reindex`}</Cmd>
        </Section>

        {/* ── 04: Monday ↔ GitHub Sync ── */}
        <Section id="sync" label="04 · Automation" title="Monday ↔ GitHub Sync"
          subtitle="What happens automatically when you push code or open a PR — and what stays manual.">

          {/* How it works */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">What syncs automatically</h3>
              <div className="space-y-3 text-sm">
                {[
                  { trigger: 'Commit with MM-XX:',    result: 'Commit note posted on the Monday card' },
                  { trigger: 'PR opened',              result: 'Card status → In Review' },
                  { trigger: 'PR merged',              result: 'Card status → Done' },
                  { trigger: 'Review requested',       result: 'Reviewer @mentioned on Monday card' },
                  { trigger: 'CI check fails',         result: 'Card flagged with warning update' },
                ].map(r => (
                  <div key={r.trigger} className="flex items-start gap-3">
                    <div className="bg-surface border border-border-subtle rounded px-2 py-0.5 text-muted text-[11px] flex-shrink-0 mt-0.5 whitespace-nowrap">{r.trigger}</div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold flex-shrink-0">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                      <span className="text-muted">{r.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border-subtle rounded-xl p-5">
              <h3 className="text-ink font-semibold text-sm mb-4">What you still do manually</h3>
              <div className="space-y-2 text-sm text-muted">
                {[
                  'Set Environment column when you deploy to staging/production',
                  'Add PR URL to the PR Link column when you open the PR',
                  'Set Release column at sprint planning',
                  'Start/stop the Time Tracked timer',
                  'Mark Stuck and leave a comment explaining the blocker',
                  'Move Not Started → Working on it when you pick up a ticket',
                ].map((i, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-muted flex-shrink-0 mt-0.5">›</span>
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily reports */}
          <h3 className="text-ink font-semibold mb-3">Daily agent reports</h3>
          <p className="text-muted text-sm mb-4 leading-relaxed">
            An automated agent posts to <strong className="text-ink">#dev-standup</strong> in Slack twice daily.
            Keep your cards accurate — this is what the agent reads.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              { time: '8:00 AM', label: 'Morning briefing', items: ['Board snapshot by status', 'What completed since yesterday', 'What\'s due today', 'Items stuck 3+ days'] },
              { time: '5:30 PM', label: 'End of day summary', items: ['What moved today (with status transitions)', 'Items untouched today', 'Suggested standup talking points for tomorrow'] },
            ].map(r => (
              <div key={r.time} className="bg-card border border-border-subtle rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gold font-mono text-xs">{r.time}</span>
                  <span className="text-muted text-xs">·</span>
                  <span className="text-ink text-sm font-medium">{r.label}</span>
                </div>
                <ul className="space-y-1 text-muted text-xs">
                  {r.items.map(i => <li key={i} className="flex gap-1.5"><span className="text-gold">›</span>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <Note type="tip" title="Stale = flagged">
            Items with no activity for 3+ days are automatically highlighted in the morning report
            and flagged for standup. If you're blocked, set Status to <strong className="text-ink">Stuck</strong> and
            leave a comment — that resets the stale clock and tells the team why.
          </Note>
        </Section>

        {/* Footer */}
        <div className="py-14 border-t border-border-subtle text-center">
          <p className="text-muted text-xs">
            MedMart Dev Team · Internal training docs · ryanpatt.com/medmart/training
          </p>
        </div>
      </main>
    </div>
  )
}
