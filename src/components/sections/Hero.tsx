import { stats } from '../../data/content'

interface HeroProps {
  onScrollTo: (id: string) => void
}

export default function Hero({ onScrollTo }: HeroProps) {
  return (
    <section
      id="hero"
      className="hero-bg relative min-h-screen flex flex-col justify-center px-10 md:px-16 lg:px-20 py-24"
    >
      {/* Subtle decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#c9a84c 1px, transparent 1px), linear-gradient(to right, #c9a84c 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="h-px w-8 bg-gold" />
          <span className="text-gold text-sm font-medium tracking-widest uppercase">Full-Stack Engineer</span>
        </div>

        <h1 className="font-display font-extrabold leading-[1.05] mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="block text-5xl md:text-6xl lg:text-7xl gradient-text">Ryan Patt</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted font-light leading-relaxed mb-8 max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Solutions architect specialising in{' '}
          <span className="text-ink font-medium">enterprise integrations</span>,{' '}
          <span className="text-ink font-medium">headless commerce</span>, and{' '}
          <span className="text-ink font-medium">cross-platform products</span> — from
          global e-commerce platforms to published mobile apps.
        </p>

        <div className="flex flex-wrap gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => onScrollTo('projects')}
            className="px-6 py-3 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-light transition-colors text-sm"
          >
            View Projects
          </button>
          <button
            onClick={() => onScrollTo('contact')}
            className="px-6 py-3 border border-border-subtle text-muted hover:text-ink hover:border-gold/40 rounded-lg transition-all text-sm"
          >
            Get in Touch
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-bold text-3xl text-gold mb-1">{stat.value}</div>
              <div className="text-muted text-xs uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted/50 animate-float hidden md:flex">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  )
}
