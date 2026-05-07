import { useState } from 'react'
import { experience, education, languages } from '../../data/content'

const COLLAPSED_HIGHLIGHTS = 3
const VISIBLE_JOBS = 3

export default function Experience() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [showAllJobs, setShowAllJobs] = useState(false)

  const toggle = (i: number) =>
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))

  const hiddenJobCount = Math.max(0, experience.length - VISIBLE_JOBS)

  return (
    <section id="experience" className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle">
      <span className="section-number">03</span>

      <div className="max-w-3xl">
        <div className="reveal">
          <h2 className="section-title">Experience</h2>
          <div className="section-divider" />
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-gold via-border-subtle to-transparent" />

          <div className="space-y-12 pl-8">
            {experience.map((job, i) => {
              const isOpen = expanded[i] ?? false
              const hasMore = job.highlights.length > COLLAPSED_HIGHLIGHTS
              const jobHidden = i >= VISIBLE_JOBS && !showAllJobs

              return (
                <div
                  key={i}
                  className={`reveal relative ${jobHidden ? 'hidden' : ''}`}
                >
                  {/* Dot */}
                  <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-gold border-2 border-bg" />

                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-ink text-lg leading-tight">{job.title}</h3>
                      <div className="text-gold font-medium text-sm mt-0.5">{job.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted text-sm">{job.period}</div>
                      <div className="text-muted/70 text-xs mt-0.5">{job.location}</div>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {job.highlights.map((point, j) => {
                      const isExtra = j >= COLLAPSED_HIGHLIGHTS
                      const screenHidden = isExtra && !isOpen
                      return (
                        <li
                          key={j}
                          className={`flex items-start gap-2.5 text-muted text-sm leading-relaxed ${
                            screenHidden ? 'hidden print:flex' : ''
                          }`}
                        >
                          <span className="text-gold/70 mt-1.5 flex-shrink-0">▸</span>
                          {point}
                        </li>
                      )
                    })}
                  </ul>

                  {hasMore && (
                    <button
                      onClick={() => toggle(i)}
                      className="mt-3 text-xs font-medium text-gold hover:text-gold-light transition-colors inline-flex items-center gap-1.5 print:hidden"
                    >
                      {isOpen ? 'Show less' : `Show ${job.highlights.length - COLLAPSED_HIGHLIGHTS} more`}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {hiddenJobCount > 0 && (
            <div className="pl-8 mt-6">
              <button
                onClick={() => setShowAllJobs((v) => !v)}
                className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-light transition-colors px-4 py-2 rounded-lg border border-gold/30 hover:border-gold/60 hover:bg-gold/5"
              >
                {showAllJobs
                  ? 'Show fewer positions'
                  : `Show ${hiddenJobCount} earlier position${hiddenJobCount === 1 ? '' : 's'}`}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showAllJobs ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Education */}
        <div className="reveal mt-16">
          <h3 className="font-display font-semibold text-ink text-lg mb-4">Education</h3>
          <div className="space-y-3">
            {education.map((ed) => (
              <div key={ed.school} className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-ink font-medium text-sm">{ed.school}</div>
                  <div className="text-muted text-xs mt-0.5">{ed.degree}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted text-sm">{ed.period}</div>
                  <div className="text-muted/70 text-xs mt-0.5">{ed.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="reveal mt-10">
          <h3 className="font-display font-semibold text-ink text-lg mb-4">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="text-xs text-ink/80 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
