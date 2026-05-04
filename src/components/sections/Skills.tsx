import { skills } from '../../data/content'

const categoryColors: Record<string, string> = {
  Frontend: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  Backend: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  Commerce: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  Enterprise: 'text-gold border-gold/30 bg-gold/10',
  Mobile: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  DevOps: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
}

export default function Skills() {
  return (
    <section id="skills" className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle bg-surface/30">
      <span className="section-number">02</span>

      <div className="max-w-5xl">
        <div className="reveal">
          <h2 className="section-title">Skills</h2>
          <div className="section-divider" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category} className="card reveal">
              <div className="flex items-center gap-2 mb-4">
                <span className={`tag text-[10px] font-semibold uppercase tracking-wider ${categoryColors[category]}`}>
                  {category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs text-ink/80 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
