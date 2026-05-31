// Full navigable demo storefront — a redesign concept for medmartonline.com.
// Standalone pages (Home, Category, PDP, Cart, Checkout, Confirmation, Business)
// with a shared cart. Mounted at /medmart/demo-store/* . Nothing is submitted.
import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { Routes, Route, Outlet, Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { CATEGORIES, PRODUCTS, productBySlug, productsByCategory, monthly, usd, type Product } from './catalog'
import { Icon, Stars, ProductImage, CartProvider, useCart, storeUrl } from './storeUi'

/* ---- guided product finder (modal, opened from header / home / category) ---- */
const FinderCtx = createContext<{ open: () => void }>({ open: () => {} })
const useFinder = () => useContext(FinderCtx)

/* ============================== layout ================================== */

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Banner() {
  return (
    <div className="bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 py-1.5 text-center text-[13px] font-medium">
        <span>Prototype — a redesign concept for medmartonline.com. Nothing here is real or submitted.</span>
        <Link to="/medmart/roadmap2026" className="underline underline-offset-2 hover:opacity-80">Back to the roadmap</Link>
      </div>
    </div>
  )
}

function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="bg-[#1c3251] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[13px]">
          <span className="hidden sm:inline">Family-owned since 1992 · Free shipping · BBB Accredited A+</span>
          <a href="tel:18333176140" className="flex items-center gap-1.5 font-medium"><Icon name="phone" className="h-4 w-4" /> (833) 317-6140</a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="lg:hidden" onClick={() => setOpen(o => !o)} aria-label="menu"><Icon name="menu" className="h-6 w-6 text-slate-700" /></button>
        <Link to={storeUrl()} className="shrink-0"><img src="/medmart/demo-store/logo.png" alt="MedMart" className="h-8 w-auto" /></Link>
        <div className="hidden flex-1 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 md:flex">
          <Icon name="search" className="h-5 w-5 text-slate-400" />
          <input className="w-full text-sm outline-none placeholder:text-slate-400" placeholder="Search scooters, lift chairs, beds…" />
        </div>
        <nav className="ml-auto flex items-center gap-5 text-sm font-medium text-slate-700">
          <FinderButton className="hidden items-center gap-1.5 rounded-lg bg-[#e6f1f8] px-3 py-1.5 font-semibold text-[#0076bc] hover:bg-[#d3e7f4] md:flex"><Icon name="badge" className="h-5 w-5" /> Find your product</FinderButton>
          <Link to={storeUrl('/business')} className="hidden items-center gap-1.5 hover:text-[#1c3251] sm:flex"><Icon name="building" className="h-5 w-5" /> For Business</Link>
          <Link to={storeUrl()} className="hidden items-center gap-1.5 hover:text-[#1c3251] sm:flex"><Icon name="user" className="h-5 w-5" /> Account</Link>
          <Link to={storeUrl('/cart')} className="relative flex items-center gap-1.5 hover:text-[#1c3251]">
            <Icon name="cart" className="h-6 w-6" />
            {count > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#0076bc] px-1 text-xs font-bold text-white">{count}</span>}
            <span className="hidden lg:inline">Cart</span>
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-100 bg-slate-50">
        <div className={`mx-auto max-w-7xl gap-6 px-4 py-2 text-sm font-medium text-slate-700 ${open ? 'flex flex-col' : 'hidden lg:flex'}`}>
          <Link to={storeUrl('/shop')} className="hover:text-[#1c3251]">Shop All</Link>
          {CATEGORIES.map(c => <Link key={c.slug} to={storeUrl('/shop/' + c.slug)} className="hover:text-[#1c3251]">{c.name}</Link>)}
        </div>
      </div>
    </header>
  )
}

function TrustBar() {
  const items = [
    { icon: 'truck', t: 'Free shipping', s: 'On every order' },
    { icon: 'card', t: 'Financing & HSA/FSA', s: 'As low as 0% APR' },
    { icon: 'chat', t: 'Talk to an expert', s: '7 days a week' },
    { icon: 'refresh', t: '30-day returns', s: 'Hassle-free' },
  ]
  return (
    <div className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 md:grid-cols-4">
        {items.map(i => (
          <div key={i.t} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e6f1f8] text-[#005f96]"><Icon name={i.icon} className="h-5 w-5" /></span>
            <div><div className="text-sm font-semibold text-slate-900">{i.t}</div><div className="text-xs text-slate-500">{i.s}</div></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Footer() {
  const cols: { h: string; links: string[] }[] = [
    { h: 'Customer Service', links: ['Shipping Policy', 'Returns', 'Order Tracking', 'Contact Us'] },
    { h: 'About', links: ['Our Story', 'Reviews', 'Insurance', 'Careers'] },
    { h: 'Account', links: ['Sign In', 'My Orders', 'Financing', 'HSA/FSA'] },
    { h: 'Savings & More', links: ['Price Match', 'Open-Box Deals', 'For Business', 'Become a Tech'] },
  ]
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {cols.map(c => (
          <div key={c.h}>
            <div className="font-display text-sm font-semibold text-white">{c.h}</div>
            <ul className="mt-3 space-y-2 text-sm">{c.links.map(l => <li key={l}><span className="hover:text-white">{l}</span></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row">
          <span>© 2002–2026 MedMart. All rights reserved.</span>
          <span className="flex items-center gap-2"><Icon name="lock" className="h-4 w-4" /> Secure checkout · Visa · Mastercard · Amex · PayPal · Affirm</span>
        </div>
      </div>
    </footer>
  )
}

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <ScrollTop />
      <Banner />
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

/* ============================ shared bits =============================== */

function ProductCard({ p }: { p: Product }) {
  const { add } = useCart()
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <Link to={storeUrl('/product/' + p.slug)} className="relative block">
        {p.overallPick
          ? <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded bg-[#0076bc] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"><Icon name="badge" className="h-3.5 w-3.5" /> Overall Pick</span>
          : p.bestSeller && <span className="absolute left-2 top-2 z-10 rounded bg-[#e3252b] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Best Seller</span>}
        <ProductImage hue={p.hue} label={p.name} className="aspect-[4/3]" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{p.brand}</div>
        <Link to={storeUrl('/product/' + p.slug)} className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-[#1c3251]">{p.name}</Link>
        <div className="mt-1.5 flex items-center gap-1.5"><Stars rating={p.rating} className="h-4 w-4" /><span className="text-xs text-slate-500">{p.rating} ({p.reviews})</span></div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-lg font-bold text-slate-900">{usd(p.price)}</span>
          <span className="pb-0.5 text-xs text-slate-500">or {usd(monthly(p.price))}/mo</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded bg-[#e6f1f8] px-1.5 py-0.5 font-medium text-[#005f96]">Free shipping</span>
          {p.inStock && <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-[#0076bc]">In stock</span>}
          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">HSA/FSA</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => add(p.slug)} className="flex-1 rounded-lg bg-[#0076bc] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005f96]">Add to Cart</button>
        </div>
      </div>
    </div>
  )
}

function Breadcrumb({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      {trail.map((t, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {t.to ? <Link to={t.to} className="hover:text-[#1c3251]">{t.label}</Link> : <span className="text-slate-700">{t.label}</span>}
          {i < trail.length - 1 && <Icon name="chevron" className="h-3.5 w-3.5 text-slate-300" />}
        </span>
      ))}
    </nav>
  )
}

/* =============================== pages ================================== */

function Home() {
  const audiences = [
    { icon: 'user', t: 'For myself', s: 'Stay independent at home', to: storeUrl('/shop') },
    { icon: 'heart', t: 'For a loved one', s: 'Help someone you care for', to: storeUrl('/shop') },
    { icon: 'building', t: 'For my facility', s: 'Volume pricing & Net-30', to: storeUrl('/business') },
  ]
  const featured = ['golden-buzzaround-hd', 'golden-maxicomfort', 'jazzy-air-2', 'contesa-floorbed'].map(productBySlug).filter(Boolean) as Product[]
  const reviews = [
    { n: 'Margaret R.', t: 'The scooter gave my mom her freedom back. The expert on the phone helped us pick the right one in 10 minutes.', p: 'Golden Buzzaround HD' },
    { n: 'James T.', t: 'White-glove delivery set up the hospital bed and took away the packaging. Could not have done it myself.', p: 'Contesa FloorBed' },
    { n: 'Dana W.', t: 'Used my HSA card at checkout and financed the rest. Lift chair arrived in 4 days.', p: 'MaxiComfort Lift Chair' },
  ]
  return (
    <main>
      {/* hero */}
      <section className="bg-gradient-to-br from-[#1c3251] to-[#0076bc] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"><Stars rating={5} className="h-4 w-4" /> 12,000+ five-star reviews</div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">Mobility & home-care equipment, with the experts to guide you.</h1>
            <p className="mt-4 max-w-lg text-blue-100">Family-owned since 1992. Free shipping, financing, HSA/FSA, and real people who help you choose — then deliver and set it up.</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="text-sm font-medium text-blue-100">What brings you here today?</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {audiences.map(a => (
                  <Link key={a.t} to={a.to} className="group rounded-xl bg-white p-3 text-slate-900 transition-transform hover:-translate-y-0.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-[#0076bc]"><Icon name={a.icon} className="h-5 w-5" /></span>
                    <div className="mt-2 text-sm font-semibold">{a.t}</div>
                    <div className="text-xs text-slate-500">{a.s}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <img src="/medmart/demo-store/family.jpg" alt="The MedMart family — family-owned since 1992" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl" />
            <p className="mt-2 text-center text-sm text-blue-100">The family behind MedMart — three generations strong.</p>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* finder band */}
      <section className="border-b border-slate-200 bg-[#e6f1f8]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0076bc]"><Icon name="badge" className="h-5 w-5" /></span>
            <div><div className="font-semibold text-slate-900">Not sure where to start?</div><div className="text-sm text-slate-600">Answer 3 quick questions and we’ll recommend the right product.</div></div>
          </div>
          <FinderButton className="rounded-lg bg-[#0076bc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005f96]">Find your product</FinderButton>
        </div>
      </section>

      {/* categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-slate-900">Shop by department</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(c => (
            <Link key={c.slug} to={storeUrl('/shop/' + c.slug)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
              <ProductImage hue={c.hue} label={c.name} className="aspect-square" />
              <div className="p-3"><div className="text-sm font-semibold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{c.tagline}</div></div>
            </Link>
          ))}
        </div>
      </section>

      {/* best sellers */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-slate-900">Best sellers</h2>
          <Link to={storeUrl('/shop')} className="flex items-center gap-1 text-sm font-medium text-[#0076bc] hover:text-[#1c3251]">Shop all <Icon name="chevron" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map(p => <ProductCard key={p.slug} p={p} />)}</div>
      </section>

      {/* value props */}
      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          {[
            { icon: 'chat', h: 'Talk to a real expert', b: 'Not a chatbot — trained product specialists help you choose the right fit, by phone or chat, 7 days a week.' },
            { icon: 'truck', h: 'White-glove delivery', b: 'On large equipment we deliver, assemble, and remove the packaging — and show you how to use it.' },
            { icon: 'card', h: 'Financing, HSA & insurance', b: 'Pay over time with Affirm, use your HSA/FSA card, or let us help with insurance paperwork.' },
          ].map(v => (
            <div key={v.h} className="rounded-2xl border border-slate-200 p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#0076bc]"><Icon name={v.icon} className="h-6 w-6" /></span>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">{v.h}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* reviews */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center gap-3"><h2 className="font-display text-2xl font-bold text-slate-900">What our customers say</h2><span className="flex items-center gap-1.5 text-sm text-slate-500"><Stars rating={5} className="h-4 w-4" /> 4.8 / 5 · Trustpilot</span></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.map(r => (
            <figure key={r.n} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Stars rating={5} className="h-4 w-4" />
              <blockquote className="mt-2 text-sm text-slate-700">“{r.t}”</blockquote>
              <figcaption className="mt-3 text-sm font-semibold text-slate-900">{r.n} <span className="font-normal text-slate-400">· {r.p}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* financing band */}
      <section className="bg-[#005f96]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-white sm:flex-row">
          <div>
            <h2 className="font-display text-2xl font-bold">Buy now, pay over time.</h2>
            <p className="text-[#cfe6f4]">As low as 0% APR with Affirm. HSA/FSA eligible. No surprises at checkout.</p>
          </div>
          <Link to={storeUrl('/shop')} className="rounded-lg bg-white px-5 py-2.5 font-semibold text-[#005f96] hover:bg-[#e6f1f8]">Start shopping</Link>
        </div>
      </section>
    </main>
  )
}

const PRICE_BUCKETS: { id: string; label: string; test: (n: number) => boolean }[] = [
  { id: 'u500', label: 'Under $500', test: n => n < 500 },
  { id: '500-1500', label: '$500 – $1,500', test: n => n >= 500 && n < 1500 },
  { id: '1500-3000', label: '$1,500 – $3,000', test: n => n >= 1500 && n < 3000 },
  { id: '3000up', label: '$3,000+', test: n => n >= 3000 },
]

function Category() {
  const { cat } = useParams()
  const category = CATEGORIES.find(c => c.slug === cat)
  const base = cat ? productsByCategory(cat) : PRODUCTS

  const [query, setQuery] = useState('')
  const [brandSel, setBrandSel] = useState<string[]>([])
  const [priceSel, setPriceSel] = useState<string>('')
  const [tagSel, setTagSel] = useState<string[]>([])
  const [topRated, setTopRated] = useState(false)
  const [sort, setSort] = useState('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const brands = useMemo(() => [...new Set(base.map(p => p.brand))], [base])
  const tags = useMemo(() => [...new Set(base.flatMap(p => p.tags))], [base])
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  const activeCount = brandSel.length + tagSel.length + (priceSel ? 1 : 0) + (topRated ? 1 : 0) + (query ? 1 : 0)
  const clearAll = () => { setQuery(''); setBrandSel([]); setPriceSel(''); setTagSel([]); setTopRated(false) }

  const results = useMemo(() => {
    let r = base.filter(p => {
      const q = query.trim().toLowerCase()
      if (q && !(p.name + ' ' + p.brand + ' ' + p.tags.join(' ')).toLowerCase().includes(q)) return false
      if (brandSel.length && !brandSel.includes(p.brand)) return false
      if (tagSel.length && !tagSel.every(t => p.tags.includes(t))) return false
      if (priceSel) { const b = PRICE_BUCKETS.find(x => x.id === priceSel); if (b && !b.test(p.price)) return false }
      if (topRated && p.rating < 4.8) return false
      return true
    })
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price)
    else if (sort === 'rating') r = [...r].sort((a, b) => b.rating - a.rating)
    else if (sort === 'popular') r = [...r].sort((a, b) => b.reviews - a.reviews)
    else r = [...r].sort((a, b) => Number(!!b.overallPick) - Number(!!a.overallPick) || b.reviews - a.reviews) // featured: pick first, then popularity
    return r
  }, [base, query, brandSel, tagSel, priceSel, topRated, sort])

  const quickPicks = [
    ...tags.slice(0, 3).map(t => ({ label: t, active: tagSel.includes(t), on: () => toggle(tagSel, t, setTagSel) })),
    { label: 'Under $1,500', active: priceSel === 'u500' || priceSel === '500-1500', on: () => setPriceSel(priceSel === '500-1500' ? '' : '500-1500') },
    { label: 'Top rated', active: topRated, on: () => setTopRated(t => !t) },
  ]

  const FilterPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-semibold text-slate-900">Refine</span>
        {activeCount > 0 && <button onClick={clearAll} className="text-xs font-medium text-[#0076bc] hover:underline">Clear all</button>}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">Brand</div>
        <ul className="mt-2 space-y-1.5">{brands.map(b => {
          const on = brandSel.includes(b)
          return <li key={b}><button onClick={() => toggle(brandSel, b, setBrandSel)} className="flex w-full items-center gap-2 text-sm text-slate-600">
            <span className={`grid h-4 w-4 place-items-center rounded border ${on ? 'border-[#0076bc] bg-[#0076bc] text-white' : 'border-slate-300'}`}>{on && <Icon name="check" className="h-3 w-3" />}</span>
            {b} <span className="text-xs text-slate-400">({base.filter(p => p.brand === b).length})</span>
          </button></li>
        })}</ul>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">Price</div>
        <ul className="mt-2 space-y-1.5">{PRICE_BUCKETS.map(b => {
          const on = priceSel === b.id
          return <li key={b.id}><button onClick={() => setPriceSel(on ? '' : b.id)} className="flex w-full items-center gap-2 text-sm text-slate-600">
            <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? 'border-[#0076bc]' : 'border-slate-300'}`}>{on && <span className="h-2 w-2 rounded-full bg-[#0076bc]" />}</span>{b.label}
          </button></li>
        })}</ul>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">Features</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{tags.map(t => {
          const on = tagSel.includes(t)
          return <button key={t} onClick={() => toggle(tagSel, t, setTagSel)} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${on ? 'border-[#0076bc] bg-[#e6f1f8] text-[#005f96]' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>{t}</button>
        })}</div>
      </div>
      <button onClick={() => setTopRated(t => !t)} className="flex items-center gap-2 text-sm text-slate-600">
        <span className={`grid h-4 w-4 place-items-center rounded border ${topRated ? 'border-[#0076bc] bg-[#0076bc] text-white' : 'border-slate-300'}`}>{topRated && <Icon name="check" className="h-3 w-3" />}</span>
        <Stars rating={5} className="h-3.5 w-3.5" /> 4.8 & up
      </button>
      <div className="rounded-lg bg-[#e6f1f8] p-3 text-xs text-[#1c3251]">
        <div className="flex items-center gap-1.5 font-semibold"><Icon name="chat" className="h-4 w-4" /> Not sure which to pick?</div>
        <FinderButton className="mt-2 w-full rounded-lg bg-[#0076bc] px-3 py-2 text-xs font-semibold text-white hover:bg-[#005f96]">Help me choose</FinderButton>
        <div className="mt-1.5 text-center">or call (833) 317-6140</div>
      </div>
    </div>
  )

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb trail={[{ label: 'Home', to: storeUrl() }, { label: 'Shop', to: storeUrl('/shop') }, ...(category ? [{ label: category.name }] : [{ label: 'All products' }])]} />
      <div className="mt-4">
        <h1 className="font-display text-3xl font-bold text-slate-900">{category ? category.name : 'All products'}</h1>
        <p className="text-sm text-slate-500">{category ? category.tagline : 'Everything we carry'}</p>
      </div>

      {/* search + sort */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <Icon name="search" className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search within ${category ? category.name : 'all products'}…`} className="w-full text-sm outline-none placeholder:text-slate-400" />
          {query && <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-4 w-4" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(o => !o)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 lg:hidden">
            <Icon name="menu" className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600">
            Sort
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent font-medium text-slate-800 outline-none">
              <option value="featured">Featured</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>
      </div>

      {/* quick picks */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Popular:</span>
        {quickPicks.map(q => (
          <button key={q.label} onClick={q.on} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${q.active ? 'border-[#0076bc] bg-[#0076bc] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-[#0076bc] hover:text-[#0076bc]'}`}>{q.label}</button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-28">{FilterPanel}</div>
        </aside>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">{results.length} {results.length === 1 ? 'result' : 'results'}</span>
            {brandSel.map(b => <Chip key={b} label={b} onClear={() => toggle(brandSel, b, setBrandSel)} />)}
            {tagSel.map(t => <Chip key={t} label={t} onClear={() => toggle(tagSel, t, setTagSel)} />)}
            {priceSel && <Chip label={PRICE_BUCKETS.find(b => b.id === priceSel)!.label} onClear={() => setPriceSel('')} />}
            {topRated && <Chip label="4.8 & up" onClear={() => setTopRated(false)} />}
          </div>
          {results.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{results.map(p => <ProductCard key={p.slug} p={p} />)}</div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-slate-600">No products match those filters.</p>
              <button onClick={clearAll} className="mt-3 rounded-lg bg-[#0076bc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005f96]">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f1f8] px-2.5 py-1 text-xs font-medium text-[#005f96]">
      {label}<button onClick={onClear} aria-label={`remove ${label}`}><Icon name="x" className="h-3.5 w-3.5" /></button>
    </span>
  )
}

function Product() {
  const { slug } = useParams()
  const p = slug ? productBySlug(slug) : undefined
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  if (!p) return <main className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Product not found. <Link to={storeUrl('/shop')} className="text-[#0076bc] underline">Back to shop</Link></main>
  const cat = CATEGORIES.find(c => c.slug === p.category)
  const fbt = productsByCategory(p.category).filter(x => x.slug !== p.slug).slice(0, 2)
  const reviews = [
    { n: 'Verified Buyer', r: 5, t: 'Exactly what we needed. The expert helped us pick the right size and it arrived faster than expected.' },
    { n: 'Verified Buyer', r: 5, t: 'Sturdy, easy to use, and the financing made it affordable. Highly recommend.' },
    { n: 'Verified Buyer', r: 4, t: 'Great product. Delivery team was professional and set everything up.' },
  ]
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb trail={[{ label: 'Home', to: storeUrl() }, ...(cat ? [{ label: cat.name, to: storeUrl('/shop/' + cat.slug) }] : []), { label: p.name }]} />
      <div className="mt-5 grid gap-8 lg:grid-cols-2">
        {/* gallery */}
        <div>
          <ProductImage hue={p.hue} label={p.name} className="aspect-[4/3] rounded-2xl border border-slate-200" />
          <div className="mt-3 grid grid-cols-4 gap-3">{[0, 1, 2, 3].map(i => <ProductImage key={i} hue={p.hue + i * 6} label={'view ' + (i + 1)} className="aspect-square cursor-pointer rounded-lg border border-slate-200" />)}</div>
        </div>
        {/* buy box */}
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-slate-400">{p.brand}</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">{p.name}</h1>
          <div className="mt-2 flex items-center gap-2"><Stars rating={p.rating} className="h-5 w-5" /><a href="#reviews" className="text-sm text-[#0076bc] hover:underline">{p.rating} · {p.reviews} reviews</a></div>
          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-4xl font-extrabold text-slate-900">{usd(p.price)}</span>
            <span className="pb-1 text-slate-500">or <span className="font-semibold text-slate-700">{usd(monthly(p.price))}/mo</span> with Affirm</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">HSA/FSA eligible</span>
            <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-[#0076bc]">Price-match guarantee</span>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e6f1f8] px-3 py-2 text-sm font-medium text-[#005f96]">
            <Icon name="truck" className="h-5 w-5" /> In stock · ships in 3–5 days · free white-glove delivery & setup
          </div>
          <p className="mt-4 text-slate-600">{p.blurb}</p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3.5 py-2.5 text-slate-700">–</button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3.5 py-2.5 text-slate-700">+</button>
            </div>
            <button onClick={() => { add(p.slug, qty); setAdded(true) }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0076bc] py-3 text-base font-semibold text-white transition-colors hover:bg-[#005f96]">
              {added ? <><Icon name="check" className="h-5 w-5" /> Added to cart</> : 'Add to Cart'}
            </button>
          </div>
          {added && <Link to={storeUrl('/cart')} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0076bc] hover:text-[#1c3251]">View cart & checkout <Icon name="chevron" className="h-4 w-4" /></Link>}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
            {[['shield', '5-year warranty'], ['refresh', '30-day returns'], ['chat', 'Expert help 7 days']].map(([i, t]) => (
              <div key={t} className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-3"><Icon name={i} className="h-5 w-5 text-[#0076bc]" /> {t}</div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <Icon name="phone" className="h-6 w-6 text-[#0076bc]" />
            <div><div className="font-semibold text-slate-900">Questions? Talk to a specialist.</div><div className="text-slate-500">(833) 317-6140 · live chat · email</div></div>
          </div>
        </div>
      </div>

      <NotReadyForm />

      {/* details */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-slate-900">Product highlights</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{p.bullets.map(b => <li key={b} className="flex items-start gap-2 text-sm text-slate-700"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0076bc]" /> {b}</li>)}</ul>
          <div id="reviews" className="mt-10 scroll-mt-24">
            <h2 className="font-display text-xl font-bold text-slate-900">Reviews <span className="text-slate-400">· {p.rating} ({p.reviews})</span></h2>
            <div className="mt-4 space-y-3">{reviews.map((rv, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2"><Stars rating={rv.r} className="h-4 w-4" /><span className="flex items-center gap-1 text-xs font-medium text-[#005f96]"><Icon name="badge" className="h-4 w-4" /> {rv.n}</span></div>
                <p className="mt-1.5 text-sm text-slate-700">{rv.t}</p>
              </div>
            ))}</div>
          </div>
        </div>
        <aside>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">Frequently bought together</h3>
            <div className="mt-3 space-y-3">{fbt.map(f => (
              <Link key={f.slug} to={storeUrl('/product/' + f.slug)} className="flex items-center gap-3">
                <ProductImage hue={f.hue} label={f.name} className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0"><div className="truncate text-sm font-medium text-slate-900">{f.name}</div><div className="text-sm text-slate-500">{usd(f.price)}</div></div>
              </Link>
            ))}</div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function Cart() {
  const { items, setQty, remove, subtotal } = useCart()
  const lines = items.map(l => ({ ...l, p: productBySlug(l.slug)! })).filter(l => l.p)
  if (!lines.length) return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400"><Icon name="cart" className="h-7 w-7" /></span>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Your cart is empty</h1>
      <p className="mt-1 text-slate-500">Browse our best sellers to get started.</p>
      <Link to={storeUrl('/shop')} className="mt-5 inline-block rounded-lg bg-[#0076bc] px-5 py-2.5 font-semibold text-white hover:bg-[#005f96]">Shop now</Link>
    </main>
  )
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {lines.map(l => (
            <div key={l.slug} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <ProductImage hue={l.p.hue} label={l.p.name} className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link to={storeUrl('/product/' + l.slug)} className="text-sm font-semibold text-slate-900 hover:text-[#1c3251]">{l.p.name}</Link>
                  <span className="font-semibold text-slate-900">{usd(l.p.price * l.qty)}</span>
                </div>
                <div className="text-xs text-slate-500">{l.p.brand} · {usd(l.p.price)} each</div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-slate-300 text-sm">
                    <button onClick={() => setQty(l.slug, l.qty - 1)} className="px-3 py-1.5">–</button>
                    <span className="w-8 text-center">{l.qty}</span>
                    <button onClick={() => setQty(l.slug, l.qty + 1)} className="px-3 py-1.5">+</button>
                  </div>
                  <button onClick={() => remove(l.slug)} className="text-sm text-slate-400 hover:text-rose-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
          <Link to={storeUrl('/shop')} className="inline-flex items-center gap-1 text-sm font-medium text-[#0076bc]"><Icon name="arrowLeft" className="h-4 w-4" /> Continue shopping</Link>
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium">{usd(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd className="font-medium text-[#005f96]">FREE</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><dt>Estimated total</dt><dd>{usd(subtotal)}</dd></div>
          </dl>
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">or as low as <strong>{usd(monthly(subtotal))}/mo</strong> with Affirm · HSA/FSA eligible</div>
          <Link to={storeUrl('/checkout')} className="mt-4 block rounded-lg bg-[#0076bc] py-3 text-center font-semibold text-white hover:bg-[#005f96]">Proceed to checkout</Link>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="lock" className="h-4 w-4" /> Secure 256-bit checkout</div>
        </aside>
      </div>
    </main>
  )
}

function NotReadyForm() {
  const reasons = ['Comparing a few options', 'Price or financing', 'Need to measure / check fit', 'Asking family or my doctor', 'Just browsing for now']
  const [reason, setReason] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid lg:grid-cols-[1.3fr_1fr]">
        <div className="p-6 sm:p-8">
          {!sent ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3252b] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Save 10%</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">Not ready to buy today?</h2>
              <p className="mt-1.5 text-slate-600">Tell us what’s holding you back and we’ll email you <strong className="text-slate-900">10% off</strong> for when you’re ready — plus answers to your question, from a real specialist.</p>
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-700">What’s on your mind?</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reasons.map(r => (
                    <button key={r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${reason === r ? 'border-[#0076bc] bg-[#e6f1f8] text-[#005f96]' : 'border-slate-300 text-slate-600 hover:border-[#0076bc]'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your email address" className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#0076bc]" />
                <button onClick={() => setSent(true)} className="rounded-lg bg-[#0076bc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005f96]">Email my 10% off</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">No spam. One reminder + your code. Demo only — nothing is sent.</p>
            </>
          ) : (
            <div className="flex flex-col items-start">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e6f1f8] text-[#0076bc]"><Icon name="check" className="h-7 w-7" /></span>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">Your 10% off is on the way</h2>
              <p className="mt-1.5 text-slate-600">Use code <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-[#0076bc]">SAVE10-MM</span> at checkout{reason ? `. A specialist will also follow up about “${reason.toLowerCase()}.”` : '.'}</p>
              <button onClick={() => { setSent(false); setReason(''); setEmail('') }} className="mt-4 text-sm font-medium text-[#0076bc] hover:underline">Done</button>
            </div>
          )}
        </div>
        <div className="hidden items-center justify-center bg-[#1c3251] p-8 text-white lg:flex">
          <div className="text-center">
            <Icon name="badge" className="mx-auto h-10 w-10 text-[#7fc3e8]" />
            <div className="mt-2 font-display text-3xl font-extrabold">10% off</div>
            <div className="text-sm text-blue-100">when you’re ready to order</div>
            <div className="mt-3 text-xs text-blue-200">Most customers buy within 2 weeks of asking us a question.</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input {...rest} readOnly className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400" />
    </label>
  )
}

function Checkout() {
  const { items, subtotal, clear } = useCart()
  const nav = useNavigate()
  const lines = items.map(l => ({ ...l, p: productBySlug(l.slug)! })).filter(l => l.p)
  if (!lines.length) { return <main className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500">Your cart is empty. <Link to={storeUrl('/shop')} className="text-[#0076bc] underline">Shop now</Link></main> }
  const place = () => {
    try { sessionStorage.setItem('mm-demo-order', JSON.stringify({ lines: lines.map(l => ({ name: l.p.name, qty: l.qty, price: l.p.price, hue: l.p.hue })), subtotal })) } catch { /* ignore */ }
    clear()
    nav(storeUrl('/confirmation'))
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb trail={[{ label: 'Cart', to: storeUrl('/cart') }, { label: 'Checkout' }]} />
      <h1 className="mt-3 font-display text-3xl font-bold text-slate-900">Checkout</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Contact</h2>
            <div className="mt-3"><Field label="Email address" placeholder="you@email.com" /></div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Shipping address</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="First name" placeholder="Jordan" /><Field label="Last name" placeholder="Avery" />
              <div className="sm:col-span-2"><Field label="Street address" placeholder="123 Main St" /></div>
              <Field label="City" placeholder="Austin" /><Field label="ZIP" placeholder="78701" />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Delivery</h2>
            <div className="mt-3 flex items-center gap-3 rounded-lg border-2 border-[#0076bc] bg-[#e6f1f8] p-3 text-sm">
              <Icon name="truck" className="h-5 w-5 text-[#005f96]" />
              <div><div className="font-semibold text-slate-900">Free white-glove delivery</div><div className="text-slate-500">We deliver, assemble & remove packaging · 3–5 days</div></div>
              <span className="ml-auto font-semibold text-[#005f96]">FREE</span>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Payment</h2>
            <div className="mt-3 space-y-2 text-sm">
              {[['card', 'Credit / debit card', true], ['card', 'Affirm — pay monthly', false], ['card', 'HSA / FSA card', false]].map(([ic, lab, on], i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${on ? 'border-2 border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? 'border-blue-600' : 'border-slate-300'}`}>{on ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}</span>
                  <Icon name={ic as string} className="h-5 w-5 text-slate-500" /> <span className="font-medium text-slate-800">{lab as string}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="h-fit space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">Order summary</h2>
            <div className="mt-3 space-y-3">{lines.map(l => (
              <div key={l.slug} className="flex items-center gap-3">
                <ProductImage hue={l.p.hue} label={l.p.name} className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 text-sm"><div className="truncate font-medium text-slate-900">{l.p.name}</div><div className="text-slate-500">Qty {l.qty}</div></div>
                <div className="text-sm font-semibold">{usd(l.p.price * l.qty)}</div>
              </div>
            ))}</div>
            <dl className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{usd(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd className="text-[#005f96]">FREE</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><dt>Total</dt><dd>{usd(subtotal)}</dd></div>
            </dl>
            <button onClick={place} className="mt-4 w-full rounded-lg bg-[#0076bc] py-3 font-semibold text-white hover:bg-[#005f96]">Place order</button>
            <p className="mt-2 text-center text-xs text-slate-400">Demo only — no payment is taken and nothing is submitted.</p>
          </div>
          <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            {[['lock', 'Secure 256-bit checkout'], ['refresh', '30-day returns'], ['shield', '5-year warranty'], ['phone', 'Experts: (833) 317-6140']].map(([i, t]) => (
              <li key={t} className="flex items-center gap-2"><Icon name={i} className="h-4 w-4 text-[#0076bc]" /> {t}</li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}

function Confirmation() {
  type Order = { lines: { name: string; qty: number; price: number; hue: number }[]; subtotal: number }
  const [order, setOrder] = useState<Order | null>(null)
  useEffect(() => { try { const o = sessionStorage.getItem('mm-demo-order'); if (o) setOrder(JSON.parse(o)) } catch { /* ignore */ } }, [])
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#cfe6f4] text-[#005f96]"><Icon name="check" className="h-8 w-8" /></span>
        <h1 className="mt-4 font-display text-3xl font-bold text-slate-900">Order confirmed</h1>
        <p className="mt-1 text-slate-500">Order #100012345 · a confirmation email is on its way to you.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e6f1f8] px-3 py-2 text-sm font-medium text-[#005f96]"><Icon name="truck" className="h-5 w-5" /> Ships in 3–5 days · free white-glove delivery & setup</div>
        {order && (
          <div className="mt-6 space-y-3 text-left">
            {order.lines.map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <ProductImage hue={l.hue} label={l.name} className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 text-sm"><div className="truncate font-medium text-slate-900">{l.name}</div><div className="text-slate-500">Qty {l.qty}</div></div>
                <div className="text-sm font-semibold">{usd(l.price * l.qty)}</div>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-3 font-bold"><span>Total paid</span><span>{usd(order.subtotal)}</span></div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
          {[['truck', 'Track delivery'], ['card', 'HSA receipt'], ['phone', 'Need help?']].map(([i, t]) => (
            <div key={t} className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 py-3"><Icon name={i} className="h-5 w-5 text-[#0076bc]" /> {t}</div>
          ))}
        </div>
        <Link to={storeUrl()} className="mt-6 inline-block rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Continue shopping</Link>
      </div>
    </main>
  )
}

function Business() {
  const benefits = [
    { icon: 'card', h: 'Volume & contract pricing', b: 'Tiered discounts that scale with your order — quoted fast, honored across reorders.' },
    { icon: 'clock', h: 'Net-30 terms', b: 'Buy now, get invoiced later. Apply once and order on terms going forward.' },
    { icon: 'badge', h: 'Tax-exempt checkout', b: 'Upload your certificate once; tax comes off automatically at checkout.' },
    { icon: 'user', h: 'Dedicated account manager', b: 'A real person who knows your facility, your standing orders, and your budget.' },
  ]
  return (
    <main>
      <section className="bg-gradient-to-br from-slate-900 to-[#1c3251] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm"><Icon name="building" className="h-4 w-4" /> For business & facilities</div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">A buying experience built for facilities, not checkout lanes.</h1>
            <p className="mt-4 max-w-lg text-blue-100">Hospitals, senior living, home-health agencies and clinics buy on terms with volume pricing — separate from the consumer store, the way it should be.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#quote" className="rounded-lg bg-white px-5 py-2.5 font-semibold text-[#1c3251] hover:bg-blue-50">Request a quote</a>
              <a href="#quote" className="rounded-lg border border-white/40 px-5 py-2.5 font-semibold hover:bg-white/10">Open a business account</a>
            </div>
          </div>
          <div className="hidden lg:block"><ProductImage hue={210} label="Facility procurement" className="aspect-[4/3] rounded-2xl shadow-2xl" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map(b => (
            <div key={b.h} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#0076bc]"><Icon name={b.icon} className="h-6 w-6" /></span>
              <h3 className="mt-3 font-display text-base font-semibold text-slate-900">{b.h}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{b.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="quote" className="bg-white py-12 scroll-mt-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Request a quote</h2>
            <p className="mt-2 text-slate-600">Tell us what your facility needs and an account manager will respond within one business day with pricing and terms.</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {['Quote-to-order in one place', 'PO upload & approval routing', 'Multi-seat accounts for your team', 'Standing orders & reorder reminders'].map(t => (
                <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-[#0076bc]" /> {t}</li>
              ))}
            </ul>
          </div>
          <form onSubmit={e => e.preventDefault()} className="rounded-2xl border border-slate-200 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facility / company" placeholder="Sunrise Senior Living" />
              <Field label="Your name" placeholder="Jordan Avery" />
              <Field label="Work email" placeholder="you@facility.org" />
              <Field label="Phone" placeholder="(555) 555-5555" />
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-medium text-slate-500">What do you need?</span>
              <textarea readOnly rows={3} placeholder="e.g. 10 hospital beds + mattresses, Net-30" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400" />
            </label>
            <button className="mt-4 w-full rounded-lg bg-[#1c3251] py-3 font-semibold text-white hover:bg-[#0076bc]">Request quote</button>
            <p className="mt-2 text-center text-xs text-slate-400">Demo only — nothing is submitted.</p>
          </form>
        </div>
      </section>
    </main>
  )
}

/* ============================ product finder ============================ */

const MATTERS = [
  { key: 'mobility', label: 'Easy to move & transport', tags: ['Foldable', 'Travel-friendly', 'Compact', 'Transportable'] },
  { key: 'comfort', label: 'Comfort & premium features', tags: ['Zero-gravity', 'Power recline', 'Seat elevation', 'Premium', 'Heat & massage', 'Battery backup'] },
  { key: 'capacity', label: 'Heavy-duty / higher capacity', tags: ['Heavy-duty'] },
  { key: 'value', label: 'Best value for the money', tags: ['Value', 'Budget'] },
  { key: 'unsure', label: 'Not sure — recommend your best', tags: [] },
]
const BUDGETS = [
  { label: 'Under $1,500', test: (n: number) => n < 1500 },
  { label: '$1,500 – $3,000', test: (n: number) => n >= 1500 && n < 3000 },
  { label: '$3,000+', test: (n: number) => n >= 3000 },
  { label: 'No limit', test: () => true },
]

function ProductFinder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [catSlug, setCatSlug] = useState('')
  const [matters, setMatters] = useState<typeof MATTERS[number] | null>(null)
  const [budget, setBudget] = useState<typeof BUDGETS[number] | null>(null)

  useEffect(() => { if (open) { setStep(0); setCatSlug(''); setMatters(null); setBudget(null) } }, [open])
  if (!open) return null

  const category = CATEGORIES.find(c => c.slug === catSlug)
  const recommend = (): { top?: Product; alt?: Product } => {
    let pool = productsByCategory(catSlug)
    if (budget) { const inB = pool.filter(p => budget.test(p.price)); if (inB.length) pool = inB }
    const score = (p: Product) => (matters && matters.key !== 'unsure' ? p.tags.filter(t => matters.tags.includes(t)).length : 0)
    pool = [...pool].sort((a, b) => {
      if (matters?.key === 'unsure') return Number(!!b.overallPick) - Number(!!a.overallPick) || b.reviews - a.reviews
      if (matters?.key === 'value') return a.price - b.price || score(b) - score(a)
      return score(b) - score(a) || Number(!!b.overallPick) - Number(!!a.overallPick) || b.reviews - a.reviews
    })
    return { top: pool[0], alt: pool[1] }
  }
  const go = (url: string) => { onClose(); nav(url) }
  const goTo = (n: number) => setStep(n)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2 font-display font-semibold text-slate-900"><Icon name="badge" className="h-5 w-5 text-[#0076bc]" /> Find your perfect product</div>
          <button onClick={onClose} aria-label="close" className="text-slate-400 hover:text-slate-700"><Icon name="x" className="h-5 w-5" /></button>
        </div>
        {/* progress */}
        <div className="flex gap-1 px-5 pt-3">{[0, 1, 2, 3].map(i => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#0076bc]' : 'bg-slate-200'}`} />)}</div>

        <div className="overflow-y-auto p-5">
          {step === 0 && (
            <>
              <h3 className="font-display text-xl font-bold text-slate-900">What are you shopping for?</h3>
              <p className="mt-1 text-sm text-slate-500">Pick a category to get a personalized recommendation in 2 quick questions.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map(c => (
                  <button key={c.slug} onClick={() => { setCatSlug(c.slug); goTo(1) }} className="group overflow-hidden rounded-xl border border-slate-200 text-left transition-shadow hover:shadow-md">
                    <ProductImage hue={c.hue} label={c.name} className="aspect-[5/3]" />
                    <div className="p-2.5"><div className="text-sm font-semibold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{c.tagline}</div></div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h3 className="font-display text-xl font-bold text-slate-900">What matters most for your {category?.name.toLowerCase()}?</h3>
              <div className="mt-4 space-y-2">
                {MATTERS.map(m => (
                  <button key={m.key} onClick={() => { setMatters(m); goTo(2) }} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-[#0076bc] hover:bg-[#e6f1f8]">
                    {m.label}<Icon name="chevron" className="h-4 w-4 text-slate-300" />
                  </button>
                ))}
              </div>
              <button onClick={() => goTo(0)} className="mt-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><Icon name="arrowLeft" className="h-4 w-4" /> Back</button>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="font-display text-xl font-bold text-slate-900">What’s your budget?</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {BUDGETS.map(bd => (
                  <button key={bd.label} onClick={() => { setBudget(bd); goTo(3) }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 hover:border-[#0076bc] hover:bg-[#e6f1f8]">{bd.label}</button>
                ))}
              </div>
              <button onClick={() => goTo(1)} className="mt-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><Icon name="arrowLeft" className="h-4 w-4" /> Back</button>
            </>
          )}
          {step === 3 && (() => {
            const { top, alt } = recommend()
            if (!top) return <p className="text-slate-600">No match — <Link to={storeUrl('/shop')} onClick={onClose} className="text-[#0076bc] underline">browse all products</Link>.</p>
            return (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0076bc]"><Icon name="badge" className="h-5 w-5" /> Our recommendation for you</div>
                <div className="mt-3 flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row">
                  <ProductImage hue={top.hue} label={top.name} className="aspect-[4/3] w-full shrink-0 rounded-lg sm:w-44" />
                  <div className="flex flex-1 flex-col">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{top.brand}</div>
                    <div className="font-display text-lg font-bold text-slate-900">{top.name}</div>
                    <div className="mt-1 flex items-center gap-2"><Stars rating={top.rating} className="h-4 w-4" /><span className="text-xs text-slate-500">{top.rating} ({top.reviews})</span></div>
                    <div className="mt-1 text-xl font-bold text-slate-900">{usd(top.price)} <span className="text-sm font-normal text-slate-500">or {usd(monthly(top.price))}/mo</span></div>
                    <p className="mt-1.5 text-sm text-slate-600">{top.blurb}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-3">
                      <button onClick={() => go(storeUrl('/product/' + top.slug))} className="rounded-lg bg-[#0076bc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005f96]">View this product</button>
                      <button onClick={() => go(storeUrl('/shop/' + catSlug))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">See all {category?.name}</button>
                    </div>
                  </div>
                </div>
                {alt && (
                  <button onClick={() => go(storeUrl('/product/' + alt.slug))} className="mt-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-[#0076bc]">
                    <ProductImage hue={alt.hue} label={alt.name} className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1"><div className="text-xs text-slate-400">Also consider</div><div className="truncate text-sm font-medium text-slate-900">{alt.name}</div></div>
                    <div className="text-sm font-semibold text-slate-900">{usd(alt.price)}</div>
                  </button>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => goTo(0)} className="text-sm font-medium text-[#0076bc] hover:underline">Start over</button>
                  <span className="text-xs text-slate-400">Or call an expert: (833) 317-6140</span>
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function FinderButton({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const { open } = useFinder()
  return <button onClick={open} className={className}>{children}</button>
}

/* =============================== router ================================= */

export default function DemoStore() {
  const [finderOpen, setFinderOpen] = useState(false)
  return (
    <CartProvider>
      <FinderCtx.Provider value={{ open: () => setFinderOpen(true) }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Category />} />
            <Route path="shop/:cat" element={<Category />} />
            <Route path="product/:slug" element={<Product />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="confirmation" element={<Confirmation />} />
            <Route path="business" element={<Business />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
        <ProductFinder open={finderOpen} onClose={() => setFinderOpen(false)} />
      </FinderCtx.Provider>
    </CartProvider>
  )
}
