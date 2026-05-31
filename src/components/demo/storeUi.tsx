// Shared UI + cart state for the demo storefront. Light, modern, real-store look.
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PRODUCTS } from './catalog'

export const STORE = '/medmart/demo-store'
export const storeUrl = (p = '') => STORE + p

/* ------------------------------- icons ---------------------------------- */
const PATHS: Record<string, React.ReactNode> = {
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.2l2.3 12.1a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 7H6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M20 6 9 17l-5-5" />,
  truck: <><path d="M3 6h11v9H3zM14 9h3.5l3.5 3.5V15H14z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
  shield: <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />,
  refresh: <><path d="M3 8a9 9 0 0 1 15-3l3 3M21 16a9 9 0 0 1-15 3l-3-3" /><path d="M21 5v3h-3M3 19v-3h3" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /></>,
  phone: <path d="M5 4h3l1.5 5-2 1a11 11 0 0 0 5 5l1-2 5 1.5V22a1 1 0 0 1-1 1A18 18 0 0 1 4 5a1 1 0 0 1 1-1z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  arrowLeft: <path d="M15 5l-7 7 7 7" />,
  mapPin: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  badge: <><path d="M12 2l2.4 1.8 3-.2.8 2.9 2.4 1.8-1 2.9 1 2.9-2.4 1.8-.8 2.9-3-.2L12 22l-2.4-1.8-3 .2-.8-2.9L3.4 16l1-2.9-1-2.9 2.4-1.8.8-2.9 3 .2z" /><path d="M9 12l2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
}
export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  )
}

export function Stars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  const full = Math.round(rating)
  return (
    <span className="inline-flex text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  )
}

// Real product photo when `src` is given; deterministic gradient placeholder otherwise.
export function ProductImage({ hue, label, src, className = '' }: { hue: number; label: string; src?: string; className?: string }) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-white ${className}`}>
        <img src={src} alt={label} loading="lazy" decoding="async" className="h-full w-full object-contain" />
      </div>
    )
  }
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 92%), hsl(${hue} 45% 82%))` }}
    >
      <div className="px-4 text-center text-[13px] font-medium text-slate-500/80">{label}</div>
      <span className="absolute bottom-2 right-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">demo image</span>
    </div>
  )
}

/* ------------------------------- cart ----------------------------------- */
type Line = { slug: string; qty: number }
type CartCtx = {
  items: Line[]
  add: (slug: string, qty?: number) => void
  setQty: (slug: string, qty: number) => void
  remove: (slug: string) => void
  clear: () => void
  count: number
  subtotal: number
}
const Ctx = createContext<CartCtx | null>(null)
const KEY = 'mm-demo-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Line[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] }
  })
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ } }, [items])

  const add = useCallback((slug: string, qty = 1) => setItems(p => {
    const ex = p.find(l => l.slug === slug)
    return ex ? p.map(l => l.slug === slug ? { ...l, qty: l.qty + qty } : l) : [...p, { slug, qty }]
  }), [])
  const setQty = useCallback((slug: string, qty: number) => setItems(p => qty <= 0 ? p.filter(l => l.slug !== slug) : p.map(l => l.slug === slug ? { ...l, qty } : l)), [])
  const remove = useCallback((slug: string) => setItems(p => p.filter(l => l.slug !== slug)), [])
  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((n, l) => n + l.qty, 0)
  const subtotal = items.reduce((sum, l) => {
    const pr = PRODUCTS.find(p => p.slug === l.slug)
    return sum + (pr ? pr.price * l.qty : 0)
  }, 0)

  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart outside CartProvider')
  return c
}
