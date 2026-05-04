import { NavPosition } from '../App'
import { navItems } from '../data/content'

interface NavProps {
  position: NavPosition
  activeSection: string
  onTogglePosition: () => void
  onScrollTo: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Nav({
  position,
  activeSection,
  onTogglePosition,
  onScrollTo,
}: NavProps) {
  const isLeft = position === 'left'

  return (
    <aside
      className={`hidden md:flex flex-col w-72 h-screen bg-surface border-border-subtle flex-shrink-0 ${
        isLeft ? 'border-r' : 'border-l'
      }`}
    >
      {/* Logo / Identity */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
            <span className="font-display font-bold text-gold text-sm tracking-wide">RP</span>
          </div>
          <div>
            <div className="font-display font-semibold text-ink text-base leading-tight">Ryan Patt</div>
            <div className="text-muted text-xs leading-tight mt-0.5">Solutions Architect</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-gold" />
          <span className="text-xs text-muted">Available for opportunities</span>
        </div>
      </div>

      <div className="mx-8 h-px bg-border-subtle" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <p className="text-xs font-medium text-muted/60 uppercase tracking-widest px-4 mb-3">Navigation</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onScrollTo(item.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted hover:text-ink hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-1 h-4 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-gold' : 'bg-transparent group-hover:bg-white/20'
                    }`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mx-8 h-px bg-border-subtle" />

      {/* Footer */}
      <div className="px-8 py-6 space-y-5">
        {/* Social links */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ryanpatt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink transition-colors p-2 hover:bg-white/5 rounded-lg"
            aria-label="GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/ryan-patt-9963956b/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-ink transition-colors p-2 hover:bg-white/5 rounded-lg"
            aria-label="LinkedIn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="mailto:r.patt9134@gmail.com"
            className="text-muted hover:text-ink transition-colors p-2 hover:bg-white/5 rounded-lg"
            aria-label="Email"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>

        {/* Nav toggle */}
        <button
          onClick={onTogglePosition}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-gold transition-colors py-2 px-4 rounded-lg border border-border-subtle hover:border-gold/30 hover:bg-gold/5"
          title={`Move nav to ${isLeft ? 'right' : 'left'}`}
        >
          {isLeft ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
              Move nav right
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
              Move nav left
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
