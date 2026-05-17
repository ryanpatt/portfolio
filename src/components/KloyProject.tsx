import { Link, useParams, Navigate } from 'react-router-dom'
import { projects, statusPill } from '../data/kloyProjects'
import { RevenueProjection, UnitEconomics } from './RevenueProjection'

const accentClasses: Record<string, { chip: string; bar: string; text: string }> = {
  blue:   { chip: 'bg-blue-500/10 text-blue-300 border-blue-500/30',     bar: 'bg-blue-400',   text: 'text-blue-300' },
  orange: { chip: 'bg-orange-500/10 text-orange-300 border-orange-500/30', bar: 'bg-orange-400', text: 'text-orange-300' },
  tomato: { chip: 'bg-red-500/10 text-red-300 border-red-500/30',         bar: 'bg-red-400',    text: 'text-red-300' },
}

export default function KloyProject() {
  const { slug } = useParams<{ slug: string }>()
  const project = projects.find((p) => p.slug === slug)
  if (!project) return <Navigate to="/kloy/demo" replace />

  const a = accentClasses[project.accent] ?? accentClasses.blue
  const s = statusPill(project.status)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link
          to="/kloy/demo"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-8"
        >
          ← All projects
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${s.tone}`}>
            {s.label}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${a.chip}`}>
            {project.badge}
          </span>
        </div>
        <h1 className="font-semibold text-4xl md:text-6xl text-zinc-50 leading-[1.05]">
          {project.name}
        </h1>
        <p className="mt-4 text-zinc-300 leading-relaxed text-lg md:text-xl">
          {project.oneLiner}
        </p>

        {/* URLs / access */}
        <div className="mt-6 grid gap-3">
          {project.liveUrls?.length ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Live access</div>
              <ul className="space-y-2 text-sm">
                {project.liveUrls.map((u) => (
                  <li key={u.url} className="flex items-baseline justify-between gap-3 flex-wrap">
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-mono ${a.text} hover:underline`}
                    >
                      {u.url}
                    </a>
                    <span className="text-zinc-400 text-xs">
                      {u.label}{u.note ? ` · ${u.note}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {project.privateAccess ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400">
              <span className="font-medium text-zinc-200">Private: </span>
              {project.privateAccess}
            </div>
          ) : null}
        </div>

        {/* Traction stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {project.traction.map((t) => (
            <div key={t.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t.label}</div>
              <div className="mt-1.5 text-base font-semibold text-zinc-50">{t.value}</div>
            </div>
          ))}
        </div>

        {/* What it does */}
        <Section title="What it does">
          <ul className="space-y-2.5">
            {project.whatItDoes.map((b) => (
              <li key={b} className="flex gap-2.5 text-zinc-300 leading-relaxed">
                <span className={`mt-2 size-1.5 rounded-full shrink-0 ${a.bar}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Market + revenue */}
        <Section title="Market & revenue model">
          <ul className="space-y-2.5">
            {project.marketAndModel.map((b) => (
              <li key={b} className="flex gap-2.5 text-zinc-300 leading-relaxed">
                <span className={`mt-2 size-1.5 rounded-full shrink-0 ${a.bar}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Charts — interactive scenarios */}
        <RevenueProjection projectSlug={project.slug} />
        <UnitEconomics projectSlug={project.slug} />

        {/* Why defensible */}
        <Section title="Why it&apos;s defensible">
          <ul className="space-y-2.5">
            {project.whyDefensible.map((b) => (
              <li key={b} className="flex gap-2.5 text-zinc-300 leading-relaxed">
                <span className={`mt-2 size-1.5 rounded-full shrink-0 ${a.bar}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Tech */}
        <Section title="Stack">
          <div className="flex flex-wrap gap-2">
            {project.stack.map((t) => (
              <span key={t} className="rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200">{t}</span>
            ))}
          </div>
          <ul className="mt-5 space-y-2.5">
            {project.techHighlights.map((b) => (
              <li key={b} className="flex gap-2.5 text-zinc-300 leading-relaxed">
                <span className={`mt-2 size-1.5 rounded-full shrink-0 ${a.bar}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Section>

        {project.links?.length ? (
          <Section title="Links">
            <ul className="space-y-1.5 text-sm">
              {project.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className={`${a.text} hover:underline`}>
                    {l.label} →
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          <div className="font-medium text-zinc-100 mb-1">Want to go deeper?</div>
          <p>
            Happy to share screen and walk through the codebase, talk financials,
            or intro you to the customer behind any of these. Or send a question
            and I&apos;ll answer it inline.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href="mailto:r.patt9134@gmail.com" className="text-zinc-200 hover:text-white underline">r.patt9134@gmail.com</a>
            <span className="text-zinc-600">·</span>
            <Link to="/kloy/demo" className="text-zinc-200 hover:text-white underline">Back to all projects</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-semibold text-xl md:text-2xl text-zinc-50 mb-4">{title}</h2>
      {children}
    </section>
  )
}
