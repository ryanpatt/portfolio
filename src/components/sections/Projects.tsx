import { useState } from 'react'
import { projects } from '../../data/content'

const categoryColors: Record<string, string> = {
  'SaaS Platform': 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  'B2B SaaS': 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  'Full-Stack + Mobile': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  'POS & Booking': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  'Service Platform': 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  'E-Commerce': 'text-gold border-gold/30 bg-gold/10',
  'Headless Commerce': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
}

export default function Projects() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <section id="projects" className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle">
      <span className="section-number">05</span>

      <div className="max-w-5xl">
        <div className="reveal">
          <h2 className="section-title">Projects</h2>
          <div className="section-divider" />
          <p className="text-muted text-sm mb-10 max-w-xl">
            A selection of products designed and built end-to-end — from architecture and backend
            to deployed front-end and mobile apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((project) => {
            const isExpanded = expanded === project.name
            const catColor = categoryColors[project.category] ?? 'text-muted border-muted/30 bg-muted/10'

            return (
              <div
                key={project.name}
                className="card reveal cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : project.name)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className={`tag text-[10px] uppercase tracking-wider font-semibold mb-2 ${catColor}`}>
                      {project.category}
                    </span>
                    <h3 className="font-display font-semibold text-ink text-lg leading-tight">{project.name}</h3>
                    <p className="text-muted/80 text-xs mt-0.5">{project.tagline}</p>
                  </div>
                  <button className="text-muted hover:text-gold transition-colors flex-shrink-0 mt-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <p className="text-muted text-sm leading-relaxed mb-4">{project.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs text-ink/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"
                  >
                    Visit site
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </a>
                )}

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border-subtle">
                    <p className="text-xs text-muted/60 uppercase tracking-wider font-medium mb-2">Highlights</p>
                    <ul className="space-y-1.5">
                      {project.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-muted">
                          <span className="text-gold/60 mt-1.5 flex-shrink-0 text-xs">▸</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
