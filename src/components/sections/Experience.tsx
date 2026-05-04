import { experience } from '../../data/content'

export default function Experience() {
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
            {experience.map((job, i) => (
              <div key={i} className="reveal relative">
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
                  {job.highlights.map((point, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-muted text-sm leading-relaxed">
                      <span className="text-gold/70 mt-1.5 flex-shrink-0">▸</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
