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
          {SECTIONS.map((s) => (
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
