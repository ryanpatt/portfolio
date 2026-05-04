import { integrations } from '../../data/content'

const icons: Record<string, JSX.Element> = {
  bestbuy: (
    <svg viewBox="0 0 60 60" className="w-8 h-8" fill="none">
      <rect width="60" height="60" rx="10" fill="#0046be" opacity="0.15" />
      <text x="30" y="40" textAnchor="middle" fontSize="20" fontWeight="800" fill="#4a9eff" fontFamily="Arial">BB</text>
    </svg>
  ),
  magento: (
    <svg viewBox="0 0 60 60" className="w-8 h-8" fill="none">
      <rect width="60" height="60" rx="10" fill="#ee6e3d" opacity="0.15" />
      <path d="M30 12L48 22v16L30 48 12 38V22L30 12z" stroke="#ee6e3d" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 12v36M12 22l18 10 18-10" stroke="#ee6e3d" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  netsuite: (
    <svg viewBox="0 0 60 60" className="w-8 h-8" fill="none">
      <rect width="60" height="60" rx="10" fill="#3498db" opacity="0.15" />
      <text x="30" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4a9eff" fontFamily="Arial">NS</text>
    </svg>
  ),
  sap: (
    <svg viewBox="0 0 60 60" className="w-8 h-8" fill="none">
      <rect width="60" height="60" rx="10" fill="#0076cb" opacity="0.15" />
      <text x="30" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill="#4a9eff" fontFamily="Arial">SAP</text>
    </svg>
  ),
  salesforce: (
    <svg viewBox="0 0 60 60" className="w-8 h-8" fill="none">
      <rect width="60" height="60" rx="10" fill="#00a1e0" opacity="0.15" />
      <path d="M30 20c-2 0-3.5 1-4.5 2.5a5 5 0 00-8 5.5 6 6 0 00.5 11H41a5 5 0 00.5-10c0-.2 0-.4-.02-.6A5 5 0 0030 20z" fill="#4a9eff" opacity="0.7" />
    </svg>
  ),
}

export default function Integrations() {
  return (
    <section
      id="integrations"
      className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle bg-surface/30"
    >
      <span className="section-number">04</span>

      <div className="max-w-5xl">
        <div className="reveal">
          <h2 className="section-title">Enterprise Integrations</h2>
          <div className="section-divider" />
          <p className="text-muted text-sm mb-10 max-w-xl">
            Built and deployed production integrations connecting global commerce platforms with
            enterprise systems across three continents.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((item) => (
            <div key={item.name} className="card reveal group">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-border-subtle flex items-center justify-center group-hover:border-gold/20 transition-colors">
                  {icons[item.icon]}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink text-base leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-70" />
                    <span className="text-xs text-muted">Production</span>
                  </div>
                </div>
              </div>

              <p className="text-muted text-sm leading-relaxed mb-4">{item.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {item.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs text-gold/80 bg-gold/10 border border-gold/20 px-2 py-0.5 rounded"
                  >
                    {t}
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
