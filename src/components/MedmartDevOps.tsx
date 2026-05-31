import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── section model (drives the sticky nav + scrollspy) ───────────────────── */

type SectionId =
  | 'why' | 'topology' | 'branching' | 'lifecycle'
  | 'ci' | 'environments' | 'deploy' | 'hotfix-rollback'
  | 'onboarding' | 'hardening'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'why',              label: 'Why this matters' },
  { id: 'topology',         label: 'System topology' },
  { id: 'branching',        label: 'Branching model' },
  { id: 'lifecycle',        label: 'Change lifecycle' },
  { id: 'ci',               label: 'CI gates' },
  { id: 'environments',     label: 'Environments' },
  { id: 'deploy',           label: 'Deploy & promote' },
  { id: 'hotfix-rollback',  label: 'Hotfix & rollback' },
  { id: 'onboarding',       label: 'Onboarding' },
  { id: 'hardening',        label: 'Target hardening' },
]

/* ─── shared primitives ───────────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border-subtle bg-card p-5 ${className}`}>{children}</div>
}

function Pill({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'sky' | 'emerald' | 'red' | 'muted' }) {
  const tones: Record<string, string> = {
    gold:    'bg-gold/10 text-gold border-gold/25',
    sky:     'bg-sky-500/10 text-sky-400 border-sky-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    red:     'bg-red-500/10 text-red-400 border-red-500/25',
    muted:   'bg-white/5 text-muted border-border-subtle',
  }
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-2 text-sm text-muted">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-xs text-gold">{i + 1}</span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  )
}

const WHY_BULLETS: { title: string; detail: string }[] = [
  { title: 'Nothing breaks production by surprise', detail: 'Every change passes CI and a review, gets QA on a prod-like environment, and is deployed deliberately by one owner — not pushed ad hoc.' },
  { title: 'A new dev ships on day one', detail: 'The path from ticket to live is written down: same branch names, same gates, same deploy steps every time.' },
  { title: 'The unreleased Supply store stays isolated', detail: 'Long-lived work lives on its own branch + environment, so weekly releases to the live store are never blocked or contaminated by it.' },
  { title: 'Every change is auditable', detail: 'Conventional commits + ticket references + tagged releases mean you can answer "what shipped, when, and why" in seconds.' },
  { title: 'The pipeline survives people leaving', detail: 'Responsibilities are seats (Developer, Reviewer/Lead, Release Owner), not individuals — hand-off is a name change, not a rebuild.' },
]

const ONBOARDING: string[] = [
  'GitHub access to Med-mart/mmr-web-m2.',
  'SSH key registered on Magento Cloud (for the magento remote).',
  'Warden local environment running; auth.json credentials in place.',
  'Conventions internalized: branch off production, MM-<id>-<slug>, Conventional Commits.',
  'Bookmark this runbook.',
]
const HARDENING: { title: string; detail: string }[] = [
  { title: 'Branch protection', detail: 'Require CI green + ≥1 review on production and staging; restrict who can push production.' },
  { title: 'Refresh CODEOWNERS', detail: 'Point reviews at the current team — the prior external @swiftotter/mmr-architects group is defunct.' },
  { title: 'Realign the ticket validator', detail: 'Confirm the commit-message check targets the real tracker (Monday.com) rather than Jira.' },
  { title: 'Confirm the Integration env', detail: 'Verify the development Cloud environment is active and sized to host the Supply store.' },
]

const DEPLOY_STEPS: string[] = [
  'Merge the PR on GitHub — nothing happens on Cloud yet (no GitHub→Cloud integration).',
  'Release Owner pushes the branch to the Cloud git remote (triggers build + deploy).',
  'Cloud auto-builds + deploys (~9 min; brief stop/start downtime mid-deploy).',
  'Run the post-deploy smoke test on the target environment; watch logs.',
]
const DEPLOY_CMD = 'git push magento staging:staging      # QA\ngit push magento production:production # go-live'

const HOTFIX_STEPS: string[] = [
  'Branch off production: git switch -c MM-###-hotfix origin/production',
  'Expedited PR into production; CI still runs.',
  'Release Owner pushes production to Cloud.',
  'Back-merge production into staging and mm-supply so they stay current.',
]
const ROLLBACK_STEPS: string[] = [
  'Identify the last known-good commit on the target branch.',
  'Redeploy it: push the prior SHA to the Cloud env, or use Magento Cloud environment rollback.',
  'Same ~9 min + brief downtime applies.',
  'Caution: DB migrations are NOT auto-reversed — treat schema changes as higher-risk and plan a forward-fix.',
]

const CI_GATES: { gate: string; catches: string; local: string; fix: string }[] = [
  { gate: 'Commit message (ticket)', catches: 'Commits not tied to a tracked ticket', local: '—', fix: 'Reference the ticket id in the commit/PR' },
  { gate: 'Conventional Commits',    catches: 'Non-conventional commit subjects',     local: 'follow type(scope): subject', fix: 'Reword/squash to feat:, fix:, etc.' },
  { gate: 'PHPCS (changed lines)',   catches: 'Magento coding-standard violations',   local: 'vendor/bin/phpcs --standard=phpcs.xml <files>', fix: 'Auto-fix with phpcbf where possible' },
  { gate: 'PHPStan',                 catches: 'Static-analysis errors (after di:compile)', local: 'bin/magento setup:di:compile && vendor/bin/phpstan', fix: 'Fix the reported type/usage issues' },
]

const ENVIRONMENTS: { name: string; branch: string; cloud: string; purpose: string; deployer: string }[] = [
  { name: 'Local',       branch: 'feature branch', cloud: 'Warden (local)', purpose: 'build / verify',          deployer: 'Developer' },
  { name: 'Staging',     branch: 'staging',        cloud: 'Staging',        purpose: 'release-candidate QA',     deployer: 'Release Owner' },
  { name: 'Production',  branch: 'production',      cloud: 'Production',     purpose: 'live store',               deployer: 'Release Owner' },
  { name: 'Integration', branch: 'mm-supply',      cloud: 'Development',     purpose: 'incubate Supply store',    deployer: 'Developer / Release Owner' },
]

const LIFECYCLE: { n: number; key: string; title: string; detail: string; cmd?: string }[] = [
  { n: 1, key: 'ticket',  title: 'Ticket',  detail: 'Start from a Monday.com Dev Sprint item. The ticket id becomes the branch prefix.' },
  { n: 2, key: 'branch',  title: 'Branch',  detail: 'Cut a feature branch off the latest production (default lane).', cmd: 'git fetch origin && git switch -c MM-123-short-slug origin/production' },
  { n: 3, key: 'build',   title: 'Build',   detail: 'Develop locally in Warden. Verify the change in a browser before pushing.' },
  { n: 4, key: 'commit',  title: 'Commit',  detail: 'Conventional Commits + ticket reference in the message.', cmd: 'git commit -m "feat(checkout): add HSA field [MM-123]"' },
  { n: 5, key: 'pr',      title: 'PR',      detail: 'Open a PR into staging (production for a hotfix, mm-supply for Supply work).' },
  { n: 6, key: 'ci',      title: 'CI',      detail: 'Four gates run automatically: ticket check, conventional commits, PHPCS (changed lines), PHPStan.' },
  { n: 7, key: 'review',  title: 'Review',  detail: 'Reviewer/Lead approves per CODEOWNERS. No self-merge of unreviewed code.' },
  { n: 8, key: 'promote', title: 'Promote', detail: 'Merge to staging, QA on the Staging env. At release, merge staging → production; Release Owner pushes to Cloud.', cmd: 'git push magento production:production' },
  { n: 9, key: 'verify',  title: 'Verify',  detail: 'Smoke-test critical paths on the target environment after deploy; watch logs.' },
]

function LifecycleStrip() {
  const [open, setOpen] = useState(0)
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {LIFECYCLE.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setOpen(i)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
              open === i ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border-subtle bg-card text-muted hover:text-ink'
            }`}
          >
            <span className="font-mono">{s.n}</span>{s.title}
          </button>
        ))}
      </div>
      <Card className="mt-4">
        <h3 className="font-display text-base text-ink">
          {LIFECYCLE[open].n}. {LIFECYCLE[open].title}
        </h3>
        <p className="mt-1.5 text-sm text-muted">{LIFECYCLE[open].detail}</p>
        {LIFECYCLE[open].cmd && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-emerald-300">{LIFECYCLE[open].cmd}</pre>
        )}
      </Card>
    </div>
  )
}

const BRANCHES: { branch: string; env: string; job: string; tone: 'red' | 'gold' | 'sky' }[] = [
  { branch: 'production', env: 'Production', job: 'Source of truth = what is live. Protected. Only release merges + hotfixes land here.', tone: 'red' },
  { branch: 'staging',    env: 'Staging',    job: 'Release candidate. Prod-like. Holds only what ships next; reset from production each cycle so it never drifts.', tone: 'gold' },
  { branch: 'mm-supply',  env: 'Development (Integration)', job: 'Incubator for the unreleased MedMart Supply store. Long-lived, isolated from the weekly release train until launch.', tone: 'sky' },
]

function BranchFlowDiagram() {
  return (
    <svg viewBox="0 0 760 230" className="w-full" role="img" aria-label="Branch flow">
      {/* three lanes */}
      {[
        { y: 40,  name: 'production', cls: 'stroke-red-400' },
        { y: 120, name: 'staging',    cls: 'stroke-gold' },
        { y: 200, name: 'mm-supply',  cls: 'stroke-sky-400' },
      ].map((lane) => (
        <g key={lane.name}>
          <line x1={120} y1={lane.y} x2={740} y2={lane.y} className={lane.cls} strokeWidth={2} />
          <text x={10} y={lane.y + 4} className="fill-ink text-[11px]">{lane.name}</text>
        </g>
      ))}
      {/* feature off production → staging */}
      <path d="M220,40 C220,80 300,90 300,120" className="fill-none stroke-muted" strokeWidth={1.5} markerEnd="url(#a)" />
      <text x={150} y={78} className="fill-muted text-[9px]">cut MM-… off production</text>
      {/* staging → production (release) */}
      <path d="M520,120 C520,80 600,75 600,40" className="fill-none stroke-emerald-400" strokeWidth={1.5} markerEnd="url(#a)" />
      <text x={520} y={100} className="fill-emerald-400 text-[9px]">release: staging → production</text>
      {/* hotfix off production back to staging */}
      <path d="M680,40 C680,90 660,110 660,120" className="fill-none stroke-orange-400" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#a)" />
      <text x={600} y={150} className="fill-orange-400 text-[9px]">hotfix back-merge</text>
      <defs>
        <marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" className="fill-none stroke-muted" strokeWidth={1.5} />
        </marker>
      </defs>
    </svg>
  )
}

function TopologyDiagram() {
  const box = 'fill-card stroke-border-subtle'
  const label = 'fill-ink text-[11px] font-medium'
  const sub = 'fill-muted text-[9px]'
  return (
    <svg viewBox="0 0 760 200" className="w-full" role="img" aria-label="System topology">
      {/* nodes */}
      {[
        { x: 10,  t: 'Local', s: 'Warden' },
        { x: 160, t: 'GitHub', s: 'branches' },
        { x: 320, t: 'Cloud', s: '3 environments' },
        { x: 480, t: 'Fastly', s: 'CDN' },
        { x: 630, t: 'Users', s: 'storefront' },
      ].map((n) => (
        <g key={n.t}>
          <rect x={n.x} y={70} width={120} height={56} rx={8} className={box} strokeWidth={1.5} />
          <text x={n.x + 60} y={94} textAnchor="middle" className={label}>{n.t}</text>
          <text x={n.x + 60} y={110} textAnchor="middle" className={sub}>{n.s}</text>
        </g>
      ))}
      {/* solid links */}
      {[130, 600].map((x1, i) => (
        <line key={i} x1={x1} y1={98} x2={x1 + 30} y2={98} className="stroke-muted" strokeWidth={1.5} markerEnd="url(#arrow)" />
      ))}
      <line x1={440} y1={98} x2={470} y2={98} className="stroke-muted" strokeWidth={1.5} markerEnd="url(#arrow)" />
      {/* dashed manual-push gap GitHub→Cloud */}
      <line x1={290} y1={98} x2={310} y2={98} className="stroke-red-400" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#arrowred)" />
      <text x={300} y={150} textAnchor="middle" className="fill-red-400 text-[9px]">manual push — no auto-deploy</text>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" className="fill-none stroke-muted" strokeWidth={1.5} />
        </marker>
        <marker id="arrowred" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" className="fill-none stroke-red-400" strokeWidth={1.5} />
        </marker>
      </defs>
    </svg>
  )
}

export default function MedmartDevOps() {
  const [active, setActive] = useState<SectionId>('why')

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id as SectionId)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border-subtle px-6 py-8 md:px-12">
        <Link to="/medmart" className="text-sm text-muted hover:text-gold">← MedMart hub</Link>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">MedMart DevOps Runbook</h1>
        <p className="mt-2 max-w-2xl text-muted">
          How a change goes from ticket to live on the Adobe Commerce Cloud / GitHub stack —
          one consistent, role-based pipeline the whole team follows.
        </p>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10 md:px-12">
        {/* sticky section nav */}
        <nav className="sticky top-10 hidden h-max w-52 shrink-0 lg:block print:hidden">
          <ul className="space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block rounded px-3 py-1.5 transition-colors ${
                    active === s.id ? 'bg-card text-gold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 space-y-16">
          <section id="why" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Why this matters</h2>
            <p className="mt-2 max-w-2xl text-muted">
              A pipeline is not bureaucracy — it is what lets a small team move fast without breaking the live
              store. Five things this one buys you:
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {WHY_BULLETS.map((b) => (
                <Card key={b.title}>
                  <h3 className="font-display text-base text-gold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{b.detail}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="topology" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">System topology</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Code flows left to right. The one thing to internalize: there is <span className="text-red-400">no GitHub→Cloud
              integration</span> — a merged PR does not deploy. Someone in the Release Owner seat must push the branch to the
              Cloud git remote to trigger a build.
            </p>
            <Card className="mt-5"><TopologyDiagram /></Card>
          </section>

          <section id="branching" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Branching model</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Three long-lived branches, each pinned to one Cloud environment. This is what removes cherry-picking:
              the only work that ever touches <code className="text-gold">staging</code> is work approved for the next
              release, so promoting <code className="text-gold">staging → production</code> is a clean whole-branch merge.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {BRANCHES.map((b) => (
                <Card key={b.branch}>
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-ink">{b.branch}</code>
                    <Pill tone={b.tone}>{b.env}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-muted">{b.job}</p>
                </Card>
              ))}
            </div>
            <Card className="mt-4"><BranchFlowDiagram /></Card>
            <Card className="mt-4 border-gold/30">
              <p className="text-sm text-ink"><span className="text-gold">Habit change:</span> branch off
                <code className="mx-1 text-gold">production</code>, not <code className="mx-1 text-gold">staging</code> —
                your change is based on what is actually live, so it promotes without dragging unreleased work.</p>
            </Card>
          </section>

          <section id="lifecycle" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Change lifecycle</h2>
            <p className="mt-2 max-w-2xl text-muted">Nine stages from ticket to verified-live. Click a stage for the rule + commands.</p>
            <div className="mt-5"><LifecycleStrip /></div>
          </section>

          <section id="ci" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">CI gates</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Every PR runs four checks on self-hosted runners (Warden PHP 8.2 image). Green is required to merge.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-muted">
                    <th className="py-2 pr-4 font-medium">Gate</th>
                    <th className="py-2 pr-4 font-medium">Catches</th>
                    <th className="py-2 pr-4 font-medium">Run locally</th>
                    <th className="py-2 font-medium">Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {CI_GATES.map((g) => (
                    <tr key={g.gate} className="border-b border-border-subtle/50 align-top">
                      <td className="py-2.5 pr-4 text-ink">{g.gate}</td>
                      <td className="py-2.5 pr-4 text-muted">{g.catches}</td>
                      <td className="py-2.5 pr-4"><code className="text-xs text-emerald-300">{g.local}</code></td>
                      <td className="py-2.5 text-muted">{g.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Hardening note: the ticket validator currently targets a Jira integration — confirm it points at the team's
              actual tracker (Monday.com) or realign it.
            </p>
          </section>

          <section id="environments" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Environments</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-muted">
                    <th className="py-2 pr-4 font-medium">Environment</th>
                    <th className="py-2 pr-4 font-medium">Branch</th>
                    <th className="py-2 pr-4 font-medium">Cloud env</th>
                    <th className="py-2 pr-4 font-medium">Purpose</th>
                    <th className="py-2 font-medium">Who deploys</th>
                  </tr>
                </thead>
                <tbody>
                  {ENVIRONMENTS.map((e) => (
                    <tr key={e.name} className="border-b border-border-subtle/50">
                      <td className="py-2.5 pr-4 text-ink">{e.name}</td>
                      <td className="py-2.5 pr-4"><code className="text-xs text-gold">{e.branch}</code></td>
                      <td className="py-2.5 pr-4 text-muted">{e.cloud}</td>
                      <td className="py-2.5 pr-4 text-muted">{e.purpose}</td>
                      <td className="py-2.5 text-muted">{e.deployer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="deploy" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Deploy & promote</h2>
            <p className="mt-2 max-w-2xl text-muted">Deploying is a deliberate, owned act — not a side effect of merging.</p>
            <Card className="mt-5"><Steps items={DEPLOY_STEPS} /></Card>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-emerald-300 whitespace-pre">{DEPLOY_CMD}</pre>
            <p className="mt-2 text-xs text-muted">Cloud remote: <code>tin2rimoygcaq@git.us-5.magento.cloud:tin2rimoygcaq.git</code> (the <code>magento</code> remote).</p>
          </section>

          <section id="hotfix-rollback" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Hotfix & rollback</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Card>
                <div className="flex items-center gap-2"><Pill tone="red">Hotfix</Pill><span className="text-sm text-muted">urgent prod fix</span></div>
                <Steps items={HOTFIX_STEPS} />
              </Card>
              <Card>
                <div className="flex items-center gap-2"><Pill tone="muted">Rollback</Pill><span className="text-sm text-muted">undo a bad deploy</span></div>
                <Steps items={ROLLBACK_STEPS} />
              </Card>
            </div>
          </section>

          <section id="onboarding" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Onboarding</h2>
            <p className="mt-2 max-w-2xl text-muted">What a new developer needs before their first PR.</p>
            <Card className="mt-5"><Steps items={ONBOARDING} /></Card>
          </section>

          <section id="hardening" className="scroll-mt-10">
            <h2 className="font-display text-2xl text-ink">Target hardening</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Recommendations to schedule — <span className="text-ink">not changes made by this document</span>.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {HARDENING.map((h) => (
                <Card key={h.title}>
                  <h3 className="font-display text-base text-gold">{h.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{h.detail}</p>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
