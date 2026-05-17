import { Link } from 'react-router-dom'
import { projects, statusPill } from '../data/kloyProjects'

const accentClasses: Record<string, { ring: string; chip: string; text: string }> = {
  blue:   { ring: 'hover:border-blue-400/50',  chip: 'bg-blue-500/10 text-blue-300 border-blue-500/30',     text: 'text-blue-300' },
  orange: { ring: 'hover:border-orange-400/50',chip: 'bg-orange-500/10 text-orange-300 border-orange-500/30', text: 'text-orange-300' },
  tomato: { ring: 'hover:border-red-400/50',   chip: 'bg-red-500/10 text-red-300 border-red-500/30',         text: 'text-red-300' },
}

export default function KloyHub() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Private — for Kevin
          </div>
          <h1 className="mt-5 font-semibold text-4xl md:text-6xl text-zinc-50 leading-[1.05]">
            Five live projects.
            <br className="hidden sm:block" />
            <span className="text-zinc-400">Pick one to dig in.</span>
          </h1>
          <p className="mt-5 text-zinc-400 leading-relaxed text-lg">
            Hey Kevin — here's a quick tour of what I&apos;ve been building. Two of these
            generate revenue today, one launches in two weeks, one is mid-close
            with the owner, and one is a multi-tenant SaaS with its first paying
            customer in production. Tap any card for the deep dive — what it
            does, what stack it&apos;s on, market sizing, and where the dollars come
            from.
          </p>
          <p className="mt-3 text-zinc-500 text-sm">
            For projects where customer data is live and private I can walk you
            through a demo on a call. Bentino&apos;s is fully open — every URL on
            that card you can hit right now.
          </p>
        </div>

        {/* Project grid */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {projects.map((p) => {
            const a = accentClasses[p.accent] ?? accentClasses.blue
            const s = statusPill(p.status)
            return (
              <div
                key={p.slug}
                className={`group relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-7 transition-colors ${a.ring}`}
              >
                {/* The whole card is clickable to the detail page, except the live-link chips */}
                <Link
                  to={`/kloy/demo/${p.slug}`}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={`Open ${p.name} detail`}
                />

                <div className="relative flex items-center justify-between gap-3 mb-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${s.tone}`}>
                    {s.label}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${a.chip}`}>
                    {p.badge}
                  </span>
                </div>
                <h2 className="relative font-semibold text-2xl md:text-3xl text-zinc-50 leading-tight">
                  {p.name}
                </h2>
                <p className="relative mt-2 text-zinc-400 leading-relaxed text-sm md:text-base">
                  {p.oneLiner}
                </p>
                <div className="relative mt-5 grid grid-cols-2 gap-3">
                  {p.traction.slice(0, 4).map((t) => (
                    <div key={t.label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{t.label}</div>
                      <div className="mt-0.5 text-xs md:text-sm font-medium text-zinc-200">{t.value}</div>
                    </div>
                  ))}
                </div>

                {/* Live URLs — visible right on the card */}
                {p.liveUrls?.length ? (
                  <div className="relative mt-4 pt-4 border-t border-zinc-800">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Live URLs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.liveUrls.map((u) => (
                        <a
                          key={u.url}
                          href={u.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`relative z-10 inline-flex items-center gap-1 rounded-md border ${a.chip} px-2 py-1 text-[11px] font-medium hover:bg-white/5 transition-colors`}
                          title={u.label}
                        >
                          <span className="font-mono">{u.url.replace(/^https?:\/\//, '')}</span>
                          <span aria-hidden>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-4 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 italic">
                    Private / production — demo on request
                  </div>
                )}

                <div className="relative mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>
                    ))}
                    {p.stack.length > 4 ? (
                      <span className="text-[10px] text-zinc-500">+{p.stack.length - 4} more</span>
                    ) : null}
                  </div>
                  <span className={`text-sm font-medium ${a.text} group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1`}>
                    Details →
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          <div className="font-medium text-zinc-100 mb-1">A note on this page</div>
          <p>
            This is a private link Ryan shared with you. None of these projects are
            advertised here — happy to walk through any of them on a call, share
            financials, intro you to the customers, or look at where outside
            capital could move things along.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a href="mailto:r.patt9134@gmail.com" className="text-zinc-200 hover:text-white underline">r.patt9134@gmail.com</a>
            <span className="text-zinc-600">·</span>
            <a href="https://ryanpatt.com/resume" className="text-zinc-200 hover:text-white underline">Full resume</a>
          </div>
        </div>
      </div>
    </div>
  )
}
