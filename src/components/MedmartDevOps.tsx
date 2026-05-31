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

const WHY_BULLETS: { title: string; detail: string }[] = [
  { title: 'Nothing breaks production by surprise', detail: 'Every change passes CI and a review, gets QA on a prod-like environment, and is deployed deliberately by one owner — not pushed ad hoc.' },
  { title: 'A new dev ships on day one', detail: 'The path from ticket to live is written down: same branch names, same gates, same deploy steps every time.' },
  { title: 'The unreleased Supply store stays isolated', detail: 'Long-lived work lives on its own branch + environment, so weekly releases to the live store are never blocked or contaminated by it.' },
  { title: 'Every change is auditable', detail: 'Conventional commits + ticket references + tagged releases mean you can answer "what shipped, when, and why" in seconds.' },
  { title: 'The pipeline survives people leaving', detail: 'Responsibilities are seats (Developer, Reviewer/Lead, Release Owner), not individuals — hand-off is a name change, not a rebuild.' },
]

export default function MedmartDevOps() {
  void Pill // temporary: keeps the build green until Pill is used in a later task
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

          {/* placeholders — replaced in later tasks */}
          {SECTIONS.filter((s) => s.id !== 'why').map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-10">
              <h2 className="font-display text-2xl text-ink">{s.label}</h2>
              <p className="mt-2 text-muted">Section content — built in later tasks.</p>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
