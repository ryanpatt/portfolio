import { apps } from '../../data/content'

export default function Apps() {
  return (
    <section
      id="apps"
      className="relative px-10 md:px-16 lg:px-20 py-24 border-t border-border-subtle bg-surface/30"
    >
      <span className="section-number">06</span>

      <div className="max-w-5xl">
        <div className="reveal">
          <h2 className="section-title">Published Apps</h2>
          <div className="section-divider" />
          <p className="text-muted text-sm mb-10 max-w-xl">
            Native cross-platform apps built with React Native and Expo — live on the iOS App Store
            and Google Play.
          </p>
        </div>

        <div className="space-y-6">
          {apps.map((app) => (
            <div key={app.name} className="card reveal md:flex gap-8 items-start">
              {/* App icon */}
              <div className="flex-shrink-0 mb-6 md:mb-0">
                <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center shadow-lg shadow-gold/10">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {app.platforms.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {p === 'iOS' ? 'App Store' : 'Google Play'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-display font-semibold text-ink text-xl mb-1">{app.name}</h3>
                <p className="text-muted text-sm leading-relaxed mb-5">{app.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {app.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-gold/60 mt-1 flex-shrink-0">▸</span>
                      {h}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {app.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs text-emerald-400/80 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {app.appStoreUrl && (
                  <a
                    href={app.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-light transition-colors"
                  >
                    View on the App Store
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expertise callout */}
        <div className="mt-10 reveal">
          <div className="card border-gold/20 bg-gold/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-ink mb-1">Fluent in React Native & Headless Systems</h4>
                <p className="text-muted text-sm leading-relaxed">
                  I design and ship cross-platform apps that share business logic with the web — using
                  React Native with Expo for iOS/Android and headless architectures to decouple
                  front-ends from commerce backends. The result: maintainable codebases that scale
                  without compromise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
