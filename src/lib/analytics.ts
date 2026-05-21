declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export function isPortfolioRoute() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  return p === '/' || p === '/resume'
}

export interface ClickInfo {
  tag: string
  id?: string
  classes?: string
  text?: string
  aria_label?: string
  href?: string
  section?: string
}

export function describeClick(target: EventTarget | null): ClickInfo | null {
  if (!(target instanceof Element)) return null
  const interactive = target.closest(
    'a, button, [role="button"], [data-track], input, label, summary, [onclick]'
  )
  const el = (interactive ?? target) as Element
  const linkEl = el.closest('a') as HTMLAnchorElement | null
  const sectionEl = el.closest('[id]') as HTMLElement | null
  const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)
  const classes =
    typeof el.className === 'string' ? el.className.slice(0, 120) : undefined
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    classes: classes || undefined,
    text: text || undefined,
    aria_label: el.getAttribute('aria-label') || undefined,
    href: linkEl?.href || undefined,
    section: sectionEl?.id || undefined,
  }
}
