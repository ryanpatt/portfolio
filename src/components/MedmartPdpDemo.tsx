import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ──────────────────────────────────────────────────────────────────────────
   MedMart — Buzzaround XL+ PDP demo  (route: /medmart/pdp-demo)

   Self-contained, dependency-free conversion-focused product page tuned for a
   senior / caregiver audience. The LCP visual is an inline SVG scooter (instant,
   recolors with the swatch picker); real product photos load lazily below the
   fold with fixed aspect ratios so CLS stays at zero. Built to score 95+ on
   Lighthouse. Demo only — no real cart.
   ────────────────────────────────────────────────────────────────────────── */

const PHONE = '1-888-260-4430'
const PHONE_HREF = 'tel:+18882604430'
const LIST_PRICE = 4139
const BASE_PRICE = 1659
const BATTERY_UPGRADE = 300

type Color = 'blue' | 'red'

const PLANS = [
  { id: 'none', label: 'No plan', price: 0, blurb: 'Standard warranty only' },
  { id: '1yr', label: '1-Year Service Pro', price: 150, blurb: '2 in-home visits / yr' },
  { id: '2yr', label: '2-Year Service Pro', price: 216, blurb: 'Best value · most popular' },
  { id: '3yr', label: '3-Year Service Pro', price: 283, blurb: 'Longest coverage' },
] as const
type PlanId = (typeof PLANS)[number]['id']

const SPECS: [string, string][] = [
  ['Weight capacity', '325 lbs'],
  ['Top speed', '4.7 mph'],
  ['Driving range', 'Up to 18 miles'],
  ['Turning radius', '39 in (MicroTurn™)'],
  ['Total weight', '97 lbs'],
  ['Heaviest piece', '42.5 lbs'],
  ['Ground clearance', '3.5 in'],
  ['Seat size', '16" W × 15.5" D'],
  ['Suspension', 'Front & rear'],
  ['Tires', '8" flat-free'],
  ['Battery', '24V Lithium-Ion'],
  ['Warranty', 'Lifetime frame'],
]

const GALLERY: { src: string; alt: string; tag: string }[] = [
  {
    src: 'https://medmartonline.com/media/catalog/product/p/r/product_image_-_gb152_blue_right_turn.jpg',
    alt: 'Buzzaround XL+ scooter in blue, three-quarter front view',
    tag: 'Blue shroud',
  },
  {
    src: 'https://medmartonline.com/media/catalog/product/p/r/product_image_-_gb152_red_microturn_v2.jpg',
    alt: 'Buzzaround XL+ scooter in red demonstrating its tight MicroTurn radius',
    tag: 'MicroTurn™ in action',
  },
  {
    src: 'https://medmartonline.com/media/catalog/product/p/r/product_image_-_gb152_suspension.jpg',
    alt: 'Close-up of the Buzzaround XL+ front and rear suspension system',
    tag: 'Front & rear suspension',
  },
]

const REVIEWS = [
  {
    name: 'Carol M.',
    note: 'Bought for my mother',
    stars: 5,
    text: 'Mom got her independence back. It comes apart easily so I can lift the pieces into my trunk, and the seat is genuinely comfortable for her.',
  },
  {
    name: 'Daniel R.',
    note: 'Verified buyer',
    stars: 5,
    text: 'The MicroTurn really is tight — I can spin it around in my hallway. Suspension makes the sidewalk cracks disappear. Worth every penny.',
  },
  {
    name: 'Patricia L.',
    note: 'Verified buyer',
    stars: 5,
    text: 'Ordering was simple and a real person answered the phone to help me pick the battery. It arrived faster than promised.',
  },
]

const FAQS = [
  {
    q: 'Does it come assembled?',
    a: 'It arrives in a few light, manageable sections that click together in minutes — no tools and no special skills required. The heaviest single piece is just 42.5 lbs, so it lifts into a car trunk easily.',
  },
  {
    q: 'How far can it go on one charge?',
    a: 'Up to 9.2 miles on the included battery, or up to 18 miles with the optional extended-range battery — plenty for a full day of errands, the park, or a trip to the store.',
  },
  {
    q: 'Can I use it indoors?',
    a: 'Yes. The MicroTurn™ 39-inch turning radius is designed for tight indoor spaces — hallways, kitchens, and stores — while the suspension keeps outdoor rides smooth.',
  },
  {
    q: 'Is it covered by a warranty?',
    a: 'Yes — a lifetime warranty on the frame, 2 years on the drive train and electronics, and 1 year on the battery. You can add an in-home Service Pro plan for extra peace of mind.',
  },
  {
    q: 'Can I pay over time or use HSA/FSA?',
    a: 'Absolutely. Choose Affirm or PayPal at checkout for low monthly payments (0% financing available to qualified buyers). This scooter is also HSA/FSA eligible.',
  },
]

/* ─── tiny inline icons (no icon library = smaller bundle) ─────────────────── */
function Icon({ d, className = 'w-6 h-6' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
const I = {
  truck: 'M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 17a2 2 0 104 0 2 2 0 10-4 0M16 17a2 2 0 104 0 2 2 0 10-4 0',
  shield: 'M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  heart: 'M12 20s-7-4.3-9.3-8.6C1.3 8.6 2.6 5.5 5.6 5.5c1.8 0 3.1 1 4.4 2.6C11.3 6.5 12.6 5.5 14.4 5.5c3 0 4.3 3.1 2.9 5.9C19 15.7 12 20 12 20z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  turn: 'M4 12a8 8 0 018-8 8 8 0 018 8M16 8l4-4M20 4l-4 0M20 4l0 4',
  spring: 'M5 4h14M5 8c4-2 10 2 14 0M5 12c4-2 10 2 14 0M5 16c4-2 10 2 14 0M5 20h14',
  phone: 'M3 5c0 9 7 16 16 16l2-3-4-2-2 2c-3-1-6-4-7-7l2-2-2-4-3 2z',
  check: 'M5 13l4 4L19 7',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  battery: 'M3 8h15v8H3zM18 11h2v2h-2M6 10v4M9 10v4',
  basket: 'M4 9h16l-1.5 10.5a1 1 0 01-1 .5H6.5a1 1 0 01-1-.5L4 9zM8 9V6a4 4 0 018 0v3',
  usb: 'M12 3v14M12 17l3-3M12 17l-3-3M10 7l2-3 2 3M12 21a1 1 0 100-2 1 1 0 000 2z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
}

function Stars({ n = 5, className = 'w-5 h-5' }: { n?: number; className?: string }) {
  return (
    <span className="inline-flex text-amber-400">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
        </svg>
      ))}
    </span>
  )
}

/* ─── the hero scooter, drawn in SVG so it recolors instantly & never breaks ─ */
function ScooterSVG({ color }: { color: Color }) {
  const body = color === 'red' ? '#dc2626' : '#2563eb'
  const bodyDark = color === 'red' ? '#991b1b' : '#1d4ed8'
  const bodyLight = color === 'red' ? '#f87171' : '#60a5fa'
  return (
    <svg viewBox="0 0 520 380" className="w-full h-auto" role="img"
      aria-label={`Golden Technologies Buzzaround XL Plus mobility scooter in ${color}`}>
      <defs>
        <linearGradient id="pdp-shroud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bodyLight} />
          <stop offset="0.5" stopColor={body} />
          <stop offset="1" stopColor={bodyDark} />
        </linearGradient>
        <radialGradient id="pdp-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f172a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pdp-seat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="260" cy="338" rx="210" ry="26" fill="url(#pdp-floor)" />

      {/* rear wheel */}
      <g>
        <circle cx="135" cy="300" r="44" fill="#1e293b" />
        <circle cx="135" cy="300" r="44" fill="none" stroke="#0f172a" strokeWidth="6" />
        <circle cx="135" cy="300" r="20" fill="#cbd5e1" />
        <circle cx="135" cy="300" r="8" fill="#64748b" />
      </g>
      {/* front wheel */}
      <g>
        <circle cx="400" cy="300" r="44" fill="#1e293b" />
        <circle cx="400" cy="300" r="44" fill="none" stroke="#0f172a" strokeWidth="6" />
        <circle cx="400" cy="300" r="20" fill="#cbd5e1" />
        <circle cx="400" cy="300" r="8" fill="#64748b" />
      </g>

      {/* deck / base */}
      <path d="M112 286 h300 a14 14 0 0 0 14-14 v-10 a16 16 0 0 0-16-16 H150 l-44 18 a14 14 0 0 0-8 13 v9 a14 14 0 0 0 14 14 z"
        fill="url(#pdp-shroud)" />
      <path d="M150 246 h160 v22 H120 z" fill={bodyDark} opacity="0.35" />
      {/* footplate */}
      <rect x="150" y="262" width="150" height="12" rx="3" fill="#0f172a" opacity="0.55" />

      {/* LED accent strip (the 60-color lighting feature) */}
      <rect x="120" y="278" width="300" height="6" rx="3" fill="#38bdf8" opacity="0.9" />

      {/* rear body / battery housing */}
      <path d="M104 250 q-8-48 34-58 l40 0 0 60 z" fill="url(#pdp-shroud)" />
      <rect x="120" y="208" width="44" height="26" rx="6" fill={bodyDark} opacity="0.5" />

      {/* seat post */}
      <rect x="196" y="150" width="20" height="100" rx="6" fill="#475569" />
      {/* seat */}
      <path d="M150 150 q-6-26 26-26 h70 q26 0 22 26 z" fill="url(#pdp-seat)" />
      <rect x="150" y="146" width="120" height="14" rx="7" fill="#1e293b" />
      {/* backrest */}
      <path d="M150 150 q-30-6-30-50 q0-16 16-16 h12 q10 0 10 14 z" fill="url(#pdp-seat)" />
      {/* armrest */}
      <rect x="150" y="108" width="60" height="10" rx="5" fill="#1e293b" />
      <rect x="204" y="108" width="10" height="40" rx="5" fill="#334155" />

      {/* tiller column */}
      <rect x="372" y="150" width="20" height="104" rx="8" fill="#475569" transform="rotate(8 382 200)" />
      {/* handlebar */}
      <g>
        <rect x="330" y="120" width="110" height="16" rx="8" fill="#1e293b" />
        <circle cx="334" cy="128" r="13" fill="#0f172a" />
        <circle cx="436" cy="128" r="13" fill="#0f172a" />
        {/* dashboard */}
        <rect x="362" y="96" width="48" height="30" rx="6" fill="#0f172a" />
        <rect x="368" y="102" width="36" height="8" rx="4" fill="#38bdf8" opacity="0.85" />
        <circle cx="372" cy="118" r="3" fill="#22c55e" />
        <circle cx="386" cy="118" r="3" fill="#eab308" />
        <circle cx="400" cy="118" r="3" fill="#ef4444" />
      </g>

      {/* front basket */}
      <path d="M398 150 h54 a6 6 0 0 1 6 6 v22 a6 6 0 0 1-6 6 h-54 z" fill="none"
        stroke="#475569" strokeWidth="4" />
      <path d="M404 162 h44 M404 172 h44 M414 150 v34 M428 150 v34 M442 150 v34"
        stroke="#64748b" strokeWidth="2.5" />

      {/* headlight */}
      <circle cx="452" cy="232" r="12" fill="#fde68a" />
      <circle cx="452" cy="232" r="12" fill="none" stroke="#0f172a" strokeWidth="3" />
    </svg>
  )
}

/* ─── reusable bits ───────────────────────────────────────────────────────── */
function Section({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</section>
}

export default function MedmartPdpDemo() {
  const [color, setColor] = useState<Color>('blue')
  const [extendedBattery, setExtendedBattery] = useState(false)
  const [plan, setPlan] = useState<PlanId>('2yr')
  const [toast, setToast] = useState<string | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const buyRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const planPrice = PLANS.find((p) => p.id === plan)?.price ?? 0
  const total = BASE_PRICE + (extendedBattery ? BATTERY_UPGRADE : 0) + planPrice
  const monthly = Math.round(total / 12)
  const savings = LIST_PRICE - BASE_PRICE
  const pctOff = Math.round((savings / LIST_PRICE) * 100)
  const fmt = (n: number) => '$' + n.toLocaleString('en-US')

  // SEO + preconnect to the image CDN (scoped to this page; cleaned up on unmount)
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Buzzaround XL+ Mobility Scooter — Golden Technologies | MedMart'
    const pre = document.createElement('link')
    pre.rel = 'preconnect'
    pre.href = 'https://medmartonline.com'
    pre.crossOrigin = ''
    document.head.appendChild(pre)
    return () => {
      document.title = prevTitle
      pre.remove()
    }
  }, [])

  // sticky buy bar appears once the main buy box scrolls out of view
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setShowStickyBar(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const addToCart = () => {
    setToast(`Added to cart — ${fmt(total)} · ${color === 'red' ? 'Red' : 'Blue'}`)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans text-[17px] leading-relaxed antialiased selection:bg-emerald-200">
      {/* ── announcement / trust bar ─────────────────────────────────────── */}
      <div className="bg-slate-900 text-slate-100 text-[14px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
          <span className="inline-flex items-center gap-2"><Icon d={I.truck} className="w-4 h-4 text-emerald-400" /> Free shipping</span>
          <span className="inline-flex items-center gap-2"><Icon d={I.shield} className="w-4 h-4 text-emerald-400" /> HSA / FSA eligible</span>
          <span className="hidden sm:inline-flex items-center gap-2"><Icon d={I.heart} className="w-4 h-4 text-emerald-400" /> Trusted for 30 years</span>
          <a href={PHONE_HREF} className="inline-flex items-center gap-2 font-semibold text-white hover:text-emerald-300">
            <Icon d={I.phone} className="w-4 h-4" /> {PHONE}
          </a>
        </div>
      </div>

      {/* ── header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold tracking-tight">
            Med<span className="text-emerald-600">Mart</span>
          </span>
          <a href={PHONE_HREF}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[15px] font-semibold text-white hover:bg-emerald-700 transition-colors">
            <Icon d={I.phone} className="w-4 h-4" /> <span className="hidden sm:inline">Call to order</span> {PHONE}
          </a>
        </div>
      </header>

      {/* ── HERO / buy box ───────────────────────────────────────────────── */}
      <Section className="pt-8 sm:pt-12 pb-10">
        <nav className="text-[14px] text-slate-500 mb-5">
          <Link to="/medmart" className="hover:text-emerald-700">MedMart</Link>
          <span className="px-2">/</span> Mobility Scooters
          <span className="px-2">/</span>
          <span className="text-slate-700">Buzzaround XL+</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* visual */}
          <div className="lg:sticky lg:top-24">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 p-6 sm:p-10 overflow-hidden">
              <span className="absolute left-5 top-5 rounded-full bg-rose-600 text-white text-[13px] font-bold px-3 py-1 shadow-sm">
                Save {fmt(savings)} · {pctOff}% off
              </span>
              <ScooterSVG color={color} />
              {/* floating spec chips */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[['4.7 mph', I.bolt], ['18 mi range', I.battery], ['325 lb capacity', I.shield]].map(([label, d]) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-slate-200 px-3 py-1.5 text-[14px] font-medium text-slate-700">
                    <Icon d={d} className="w-4 h-4 text-emerald-600" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* details + buy box */}
          <div ref={buyRef}>
            <p className="text-[15px] font-semibold uppercase tracking-wide text-emerald-700">Golden Technologies</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Buzzaround XL+ Portable HD 4-Wheel Mobility Scooter
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <Stars n={5} />
              <span className="text-[15px] text-slate-600">4.8 · 312 verified reviews</span>
            </div>

            <p className="mt-4 text-[18px] text-slate-600">
              Go farther, turn tighter, and ride smoother — a comfortable, full-size scooter that still
              comes apart in seconds to fit in your trunk.
            </p>

            {/* price */}
            <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-4xl font-extrabold text-slate-900">{fmt(total)}</span>
              <span className="text-xl text-slate-400 line-through">{fmt(LIST_PRICE)}</span>
              <span className="rounded-md bg-rose-50 text-rose-700 font-semibold text-[15px] px-2 py-0.5">
                You save {fmt(savings)}
              </span>
            </div>
            <p className="mt-1 text-[15px] text-slate-600">
              or <span className="font-semibold text-slate-900">{fmt(monthly)}/mo</span> with Affirm — 0% financing available
            </p>

            {/* color picker */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">Color: <span className="font-normal text-slate-600">{color === 'red' ? 'Red' : 'Blue'}</span></span>
                <span className="text-[13px] text-slate-500">Both shrouds included</span>
              </div>
              <div className="mt-2 flex gap-3">
                {(['blue', 'red'] as Color[]).map((c) => (
                  <button key={c} onClick={() => setColor(c)} aria-pressed={color === c}
                    aria-label={`Select ${c} shroud`}
                    className={`h-12 w-12 rounded-full ring-2 ring-offset-2 transition ${
                      color === c ? 'ring-slate-900 scale-105' : 'ring-transparent hover:ring-slate-300'
                    } ${c === 'red' ? 'bg-red-600' : 'bg-blue-600'}`} />
                ))}
              </div>
            </div>

            {/* battery option */}
            <fieldset className="mt-6">
              <legend className="text-[15px] font-semibold mb-2">Battery range</legend>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${!extendedBattery ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="battery" className="mt-1 accent-emerald-600 w-5 h-5" checked={!extendedBattery} onChange={() => setExtendedBattery(false)} />
                  <span>
                    <span className="block font-semibold">Standard · 9.2 mi</span>
                    <span className="block text-[14px] text-slate-500">Included</span>
                  </span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${extendedBattery ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="battery" className="mt-1 accent-emerald-600 w-5 h-5" checked={extendedBattery} onChange={() => setExtendedBattery(true)} />
                  <span>
                    <span className="block font-semibold">Extended · up to 18 mi</span>
                    <span className="block text-[14px] text-slate-500">+{fmt(BATTERY_UPGRADE)}</span>
                  </span>
                </label>
              </div>
            </fieldset>

            {/* protection plan */}
            <fieldset className="mt-5">
              <legend className="text-[15px] font-semibold mb-2">Add an in-home Service Pro plan <span className="font-normal text-slate-500">(optional)</span></legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLANS.map((p) => (
                  <button key={p.id} onClick={() => setPlan(p.id)} aria-pressed={plan === p.id}
                    className={`rounded-xl border p-2.5 text-left transition ${plan === p.id ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'}`}>
                    <span className="block text-[14px] font-semibold leading-tight">{p.label}</span>
                    <span className="block text-[13px] text-slate-500">{p.price ? '+' + fmt(p.price) : '—'}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-3">
              <button onClick={addToCart}
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white text-[19px] font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] transition">
                Add to Cart — {fmt(total)}
                <Icon d={I.arrow} className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href={PHONE_HREF}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 text-[18px] font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 transition">
                <Icon d={I.phone} className="w-5 h-5" /> Prefer to call? {PHONE}
              </a>
            </div>

            {/* reassurance */}
            <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[15px]">
              {[
                'Free shipping — ships by Mon, Jun 22',
                '30-day satisfaction guarantee',
                'Lifetime frame warranty',
                'Real people answer the phone',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-slate-700">
                  <span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <Icon d={I.check} className="w-4 h-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── benefits strip ───────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-y border-slate-200">
        <Section className="py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              [I.turn, 'Turns on a dime', 'MicroTurn™ 39" radius glides through hallways, doorways, and store aisles.'],
              [I.spring, 'Smooth, gentle ride', 'Front and rear suspension softens every bump, crack, and curb cut.'],
              [I.battery, 'Goes the distance', 'Up to 18 miles on a charge — a full day of errands without a worry.'],
              [I.bolt, 'Lifts into your trunk', 'Comes apart into light pieces; the heaviest is just 42.5 lbs.'],
            ].map(([d, h, p]) => (
              <div key={h} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon d={d} className="w-7 h-7" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{h}</h3>
                <p className="mt-1.5 text-[15px] text-slate-600 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── real-photo gallery (lazy, fixed ratio → no layout shift) ──────── */}
      <Section className="py-12 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-center">See it in real life</h2>
        <p className="mt-2 text-center text-slate-600 max-w-xl mx-auto">Real photos of the Buzzaround XL+ — comes with both a red and a blue shroud, so you can switch the look any time.</p>
        <div className="mt-8 grid sm:grid-cols-3 gap-5">
          {GALLERY.map((g) => (
            <figure key={g.src} className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-slate-50">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img src={g.src} alt={g.alt} loading="lazy" decoding="async" width={800} height={600}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <figcaption className="px-4 py-3 text-[14px] font-medium text-slate-600">{g.tag}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── feature highlights with included accessories ─────────────────── */}
      <div className="bg-slate-50 border-y border-slate-200">
        <Section className="py-12 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Thoughtful comfort, included</h2>
              <p className="mt-3 text-slate-600">Everything you need to feel at home on day one — no extra shopping, no surprises.</p>
              <ul className="mt-6 space-y-3">
                {[
                  [I.heart, 'Stadium-style mesh seat', 'Breathable, height-adjustable, and genuinely comfortable for long rides.'],
                  [I.basket, 'Front basket & drink holder', 'Carry your groceries, water, and essentials wherever you go.'],
                  [I.usb, 'USB charging & phone holder', 'Keep your phone charged and in easy reach on the dashboard.'],
                  [I.bolt, '60+ LED accent colors', 'Personalize your ride and stay visible day or night.'],
                ].map(([d, h, p]) => (
                  <li key={h} className="flex gap-4">
                    <span className="grid place-items-center w-11 h-11 rounded-xl bg-white ring-1 ring-slate-200 text-emerald-700 shrink-0">
                      <Icon d={d} className="w-6 h-6" />
                    </span>
                    <span>
                      <span className="block font-semibold">{h}</span>
                      <span className="block text-[15px] text-slate-600">{p}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-8">
              <h3 className="font-display text-lg font-bold">What's in the box</h3>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                {[
                  'Buzzaround XL+ scooter (easy-assemble sections)',
                  'Both red and blue color shrouds',
                  'Lithium-Ion battery + off-board charger',
                  'Front basket, drink holder & phone holder',
                  'Full owner\'s manual and support line',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Icon d={I.check} className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-[14px] text-emerald-900">
                <strong>HSA / FSA eligible.</strong> Use pre-tax dollars and pay over time with Affirm or PayPal.
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── specs ─────────────────────────────────────────────────────────── */}
      <Section className="py-12 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-center">The specifics</h2>
        <dl className="mt-8 grid sm:grid-cols-2 gap-x-10 max-w-3xl mx-auto">
          {SPECS.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between gap-4 py-3.5 ${i < SPECS.length - (SPECS.length % 2 === 0 ? 2 : 1) ? 'border-b border-slate-200' : ''}`}>
              <dt className="text-slate-600">{k}</dt>
              <dd className="font-semibold text-slate-900 text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── reviews ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-y border-slate-200">
        <Section className="py-12 sm:py-16">
          <div className="flex flex-col items-center text-center">
            <Stars n={5} className="w-7 h-7" />
            <p className="mt-2 font-display text-2xl font-extrabold">4.8 out of 5</p>
            <p className="text-slate-600">Based on 312 verified reviews</p>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {REVIEWS.map((r) => (
              <blockquote key={r.name} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <Stars n={r.stars} />
                <p className="mt-3 text-slate-700 leading-relaxed">“{r.text}”</p>
                <footer className="mt-4 text-[14px]">
                  <span className="font-semibold text-slate-900">{r.name}</span>
                  <span className="text-slate-500"> · {r.note}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </Section>
      </div>

      {/* ── FAQ (native accordion = accessible + zero JS) ────────────────── */}
      <Section className="py-12 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-center">Common questions</h2>
        <div className="mt-8 max-w-3xl mx-auto divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200 overflow-hidden">
          {FAQS.map((f) => (
            <details key={f.q} className="group bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[18px] font-semibold text-slate-900 list-none hover:bg-slate-50">
                {f.q}
                <span className="grid place-items-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-45 shrink-0 text-xl leading-none">+</span>
              </summary>
              <p className="px-6 pb-5 -mt-1 text-slate-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── final CTA band ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white">
        <Section className="py-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to get moving again?</h2>
          <p className="mt-3 text-slate-300 text-lg max-w-xl mx-auto">
            {fmt(BASE_PRICE)} today — that's {fmt(savings)} off. Free shipping, 30-day guarantee, and a real person a phone call away.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={addToCart}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 text-[19px] font-bold text-slate-900 hover:bg-emerald-400 transition">
              Add to Cart <Icon d={I.arrow} className="w-5 h-5" />
            </button>
            <a href={PHONE_HREF}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-8 text-[18px] font-semibold text-white hover:bg-white/10 transition">
              <Icon d={I.phone} className="w-5 h-5" /> {PHONE}
            </a>
          </div>
        </Section>
      </div>

      {/* ── demo footer ──────────────────────────────────────────────────── */}
      <footer className="py-10 text-center text-[14px] text-slate-500">
        <p className="max-w-xl mx-auto px-5">
          Demo concept by Ryan Patt — not affiliated with a live MedMart cart. Product data &amp; photos from medmartonline.com for demonstration only.
        </p>
        <Link to="/medmart" className="mt-3 inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:text-emerald-800">
          ← Back to MedMart hub
        </Link>
      </footer>

      {/* ── sticky mobile/desktop buy bar ────────────────────────────────── */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-3 flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-[13px] text-slate-500 leading-none">Buzzaround XL+ · {color === 'red' ? 'Red' : 'Blue'}</p>
              <p className="text-xl font-extrabold leading-tight">{fmt(total)} <span className="text-[13px] font-medium text-slate-500">· {fmt(monthly)}/mo</span></p>
            </div>
            <div className="flex-1 sm:hidden">
              <p className="text-lg font-extrabold leading-tight">{fmt(total)}</p>
              <p className="text-[12px] text-slate-500 leading-none">{fmt(monthly)}/mo · Free shipping</p>
            </div>
            <a href={PHONE_HREF} className="grid place-items-center h-12 w-12 rounded-xl border border-slate-300 text-slate-700 shrink-0" aria-label={`Call ${PHONE}`}>
              <Icon d={I.phone} className="w-5 h-5" />
            </a>
            <button onClick={addToCart}
              className="flex-1 sm:flex-none inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-[17px] font-bold text-white hover:bg-emerald-700 transition">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* ── toast ────────────────────────────────────────────────────────── */}
      <div aria-live="polite" className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        {toast && (
          <div className="flex items-center gap-2.5 rounded-full bg-slate-900 text-white px-5 py-3 shadow-xl text-[15px] font-medium">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-emerald-500"><Icon d={I.check} className="w-4 h-4 text-white" /></span>
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
