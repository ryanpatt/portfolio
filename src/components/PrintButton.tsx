interface PrintButtonProps {
  variant?: 'floating' | 'inline'
}

export default function PrintButton({ variant = 'floating' }: PrintButtonProps) {
  const handlePrint = () => {
    window.open('/#resume', '_blank', 'noopener,noreferrer')
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handlePrint}
        className="px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold rounded-lg transition-all text-sm font-semibold inline-flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
        </svg>
        Download Resume
      </button>
    )
  }

  return (
    <button
      onClick={handlePrint}
      title="Print or save as PDF resume"
      aria-label="Print or save as PDF resume"
      className="print:hidden fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 group flex items-center gap-2 px-4 py-3 bg-gold text-bg font-semibold rounded-full shadow-lg shadow-gold/30 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/40 transition-all text-sm"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
      </svg>
      <span className="hidden sm:inline">Resume / PDF</span>
    </button>
  )
}
