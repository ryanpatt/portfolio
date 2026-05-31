// Full, fully-branded MedMart email-campaign mockups (route: /medmart/email-campaigns).
// Complete templates — header, hero, body, trust bar, branded footer — at 600px email width.
// Prototype only; nothing is sent.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Stars, ProductImage } from './storeUi'

const LOGO = '/medmart/demo-store/logo.png'
const BLUE = '#0076bc', NAVY = '#1c3251', RED = '#e3252b'

function Btn({ children, color = BLUE }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-block rounded-lg px-7 py-3 text-sm font-bold text-white" style={{ background: color }}>{children}</span>
}

function Social() {
  const paths: Record<string, React.ReactNode> = {
    f: <path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9z" />,
    in: <><rect x="4" y="9" width="3" height="11" /><circle cx="5.5" cy="5.5" r="1.6" /><path d="M11 20v-6a2.5 2.5 0 0 1 5 0v6M11 13h0" /></>,
    yt: <><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" /></>,
  }
  return (
    <div className="mt-3 flex justify-center gap-2">
      {Object.entries(paths).map(([k, p]) => (
        <span key={k} className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">{p}</svg>
        </span>
      ))}
    </div>
  )
}

function EmailFrame({ preheader, children }: { preheader: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-50 px-6 py-1.5 text-center text-[11px] text-slate-400">{preheader}</div>
      {/* header */}
      <div className="border-b border-slate-100 px-6 py-4 text-center">
        <img src={LOGO} alt="MedMart" className="mx-auto h-9 w-auto" />
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] font-semibold uppercase tracking-wide text-[#1c3251]">
          {['Scooters', 'Lift Chairs', 'Beds', 'Bath Safety', 'For Business'].map(x => <span key={x}>{x}</span>)}
        </div>
      </div>
      {children}
      {/* trust strip */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 px-6 py-4 text-center text-[11px] text-slate-600">
        {[['truck', 'Free shipping'], ['card', 'Financing & HSA/FSA'], ['chat', 'Expert help 7 days']].map(([i, t]) => (
          <div key={t} className="flex flex-col items-center gap-1"><Icon name={i} className="h-5 w-5 text-[#0076bc]" /> {t}</div>
        ))}
      </div>
      {/* footer */}
      <div className="px-6 py-7 text-center text-[12px] text-blue-100" style={{ background: NAVY }}>
        <div className="font-display text-lg font-extrabold tracking-wide text-white">MED<span style={{ color: '#7fc3e8' }}>MART</span></div>
        <div className="mt-2">Family-owned since 1992</div>
        <div className="mt-1"><a className="text-white underline">(833) 317-6140</a> · help@medmartonline.com</div>
        <Social />
        <div className="mt-4 text-blue-200/70">MedMart · 100 Commerce Drive · Your City, ST 00000</div>
        <div className="mt-1 text-blue-200/70">You’re receiving this because you shopped with MedMart.</div>
        <div className="mt-1"><span className="text-blue-200 underline">Unsubscribe</span> · <span className="text-blue-200 underline">Email preferences</span></div>
        <div className="mt-3 text-[11px] text-blue-200/60">Visa · Mastercard · Amex · PayPal · Affirm</div>
      </div>
    </div>
  )
}

/* ------- reusable email content blocks ------- */
function ProductBlock({ name, price, mo, rating, reviews, hue }: { name: string; price: string; mo: string; rating: number; reviews: number; hue: number }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 p-3">
      <ProductImage hue={hue} label={name} className="h-24 w-24 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col">
        <div className="text-sm font-semibold text-slate-900">{name}</div>
        <div className="mt-1 flex items-center gap-1.5"><Stars rating={rating} className="h-4 w-4" /><span className="text-xs text-slate-500">{rating} ({reviews})</span></div>
        <div className="mt-1 text-lg font-bold text-slate-900">{price} <span className="text-xs font-normal text-slate-500">or {mo}/mo</span></div>
        <div className="mt-auto pt-2 text-[11px]"><span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">HSA/FSA</span> <span className="rounded bg-[#e6f1f8] px-1.5 py-0.5 font-medium text-[#005f96]">In stock</span></div>
      </div>
    </div>
  )
}

/* =============================== campaigns =============================== */
type Campaign = { id: string; name: string; trigger: string; audience: string; goal: string; kpi: string; subject: string; preheader: string; body: React.ReactNode }

const ABANDONED: Campaign = {
  id: 'abandoned', name: 'Abandoned cart recovery', trigger: '3-touch · 1 hour, 1 day, 3 days after a cart is left',
  audience: 'Shoppers who added to cart but didn’t check out', goal: 'Recover the highest-intent lost revenue', kpi: 'Recovery rate, revenue/recipient',
  subject: 'Your cart misses you, Jordan', preheader: 'Still deciding? We saved your cart — and we’re here to help.',
  body: (
    <>
      <div className="px-6 py-8 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Still thinking it over?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">We saved your cart. Whether it’s fit, financing or delivery on your mind, a real specialist can help in minutes.</p>
      </div>
      <div className="px-6">
        <ProductBlock name="Golden Buzzaround HD Mobility Scooter" price="$1,899" mo="$79" rating={4.9} reviews={214} hue={205} />
        <div className="mt-5 text-center"><Btn>Complete your order</Btn></div>
        <p className="mt-3 text-center text-xs text-slate-400">Free shipping · 30-day returns · price-match guarantee</p>
      </div>
      <div className="mx-6 my-7 rounded-xl bg-[#e6f1f8] p-5 text-center">
        <div className="flex items-center justify-center gap-2 font-semibold text-[#1c3251]"><Icon name="chat" className="h-5 w-5" /> Not sure it’s the right fit?</div>
        <p className="mt-1 text-sm text-slate-600">Reply to this email or call <strong>(833) 317-6140</strong> — we’ll help you choose with no pressure.</p>
      </div>
      <p className="px-6 pb-2 text-center text-[11px] text-slate-400">Touch 3 of this flow includes a small first-order incentive.</p>
    </>
  ),
}

const NEW_ARRIVALS: Campaign = {
  id: 'new-arrivals', name: 'New arrivals', trigger: 'On new product launch · segmented by category interest',
  audience: 'Browsers & past buyers in a category', goal: 'Drive discovery & repeat visits', kpi: 'CTR, new-product revenue',
  subject: 'Just landed: new mobility scooters', preheader: 'Lighter, longer range, and ready to ship.',
  body: (
    <>
      <div className="text-center" style={{ background: NAVY }}>
        <ProductImage hue={205} label="New mobility scooters" className="aspect-[16/7] w-full" />
        <div className="px-6 py-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#7fc3e8]">New for 2026</div>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Fresh arrivals in Mobility Scooters</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-blue-100">Lighter frames, longer range, and the same family-owned service.</p>
          <div className="mt-4"><Btn>Shop new arrivals</Btn></div>
        </div>
      </div>
      <div className="space-y-3 px-6 py-7">
        <ProductBlock name="Pride Go-Go Sport 4-Wheel Scooter" price="$1,299" mo="$54" rating={4.7} reviews={156} hue={212} />
        <ProductBlock name="Golden Buzzaround HD Mobility Scooter" price="$1,899" mo="$79" rating={4.9} reviews={214} hue={205} />
        <div className="text-center"><Btn color={NAVY}>See everything new</Btn></div>
      </div>
    </>
  ),
}

const ACCESSORIES: Campaign = {
  id: 'accessories', name: 'Accessory cross-sell', trigger: '7 days after delivery · or browse-based',
  audience: 'Recent buyers of a matching product', goal: 'Lift AOV & attach rate', kpi: 'Attach rate, AOV',
  subject: 'Complete your setup, Jordan', preheader: 'The add-ons Buzzaround HD owners love most.',
  body: (
    <>
      <div className="px-6 py-8 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Get the most from your scooter</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Owners of the <strong>Buzzaround HD</strong> add these to keep it protected and ready to go.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 px-6">
        {[['Deluxe scooter cover', '$39', 18], ['Cup & cane holder', '$19', 30], ['Spare battery pack', '$189', 205]].map(([n, p, h]) => (
          <div key={n as string} className="rounded-xl border border-slate-200 p-2 text-center">
            <ProductImage hue={h as number} label={n as string} className="aspect-square rounded-lg" />
            <div className="mt-1.5 text-xs font-medium leading-tight text-slate-800">{n}</div>
            <div className="text-sm font-bold text-slate-900">{p}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center"><Btn>Shop accessories</Btn></div>
      <p className="mt-3 px-6 pb-2 text-center text-xs text-slate-400">Bundle any two and save 10% — auto-applied at checkout.</p>
    </>
  ),
}

const SURVEY: Campaign = {
  id: 'survey', name: 'Survey for discount', trigger: 'After a support call · or 30 days post-purchase',
  audience: 'Recent customers', goal: 'Reviews, list growth & “why people hesitate” insight', kpi: 'Response rate, reviews, NPS',
  subject: 'How are we doing? Here’s 10% off to say thanks', preheader: 'Two minutes of feedback = 10% off your next order.',
  body: (
    <>
      <div className="px-6 py-8 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">How did we do?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Your feedback decides what we stock and how we help. It takes about two minutes.</p>
        <div className="mt-5 flex items-center justify-center gap-2"><Stars rating={5} className="h-9 w-9" /></div>
        <p className="mt-1 text-xs text-slate-400">Tap a rating to begin</p>
        <div className="mt-5"><Btn>Take the 2-minute survey</Btn></div>
      </div>
      <div className="mx-6 mb-7 rounded-xl border-2 border-dashed p-5 text-center" style={{ borderColor: RED, background: '#fdeaea' }}>
        <span className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: RED }}>10% OFF</span>
        <p className="mt-2 text-sm text-slate-700">Finish the survey and we’ll email your code instantly — use it on anything, including financing-eligible orders.</p>
      </div>
    </>
  ),
}

const WINBACK: Campaign = {
  id: 'winback', name: 'Win-back', trigger: '90 days inactive',
  audience: 'Lapsed customers & subscribers', goal: 'Re-activate dormant revenue', kpi: 'Reactivation rate, revenue/recipient',
  subject: 'We miss you — here’s 15% off, on us', preheader: 'It’s been a while. Let’s find what you need next.',
  body: (
    <>
      <div className="px-6 py-8 text-center">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">It’s been a while, Jordan.</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Whatever you need next, we’ll help you choose — and handle delivery and setup, the way we always have.</p>
      </div>
      <div className="mx-6 rounded-2xl p-6 text-center text-white" style={{ background: NAVY }}>
        <div className="font-display text-4xl font-extrabold" style={{ color: '#ffd9d9' }}>15% OFF</div>
        <div className="mt-1 text-sm text-blue-100">your next order</div>
        <div className="mt-3 inline-block rounded-lg bg-white px-4 py-2 font-mono text-sm font-bold" style={{ color: NAVY }}>WELCOME15</div>
        <div className="mt-4"><Btn color={RED}>Come back & save</Btn></div>
        <div className="mt-3 text-xs text-blue-200">Plus free shipping — always.</div>
      </div>
      <div className="space-y-3 px-6 py-7">
        <div className="text-center text-sm font-semibold text-slate-700">Picked for you</div>
        <ProductBlock name="Golden MaxiComfort Lift Chair" price="$1,749" mo="$73" rating={4.8} reviews={389} hue={25} />
      </div>
    </>
  ),
}

const CAMPAIGNS: Campaign[] = [ABANDONED, NEW_ARRIVALS, ACCESSORIES, SURVEY, WINBACK]

/* =============================== page =============================== */
export default function EmailCampaigns() {
  const [active, setActive] = useState(CAMPAIGNS[0].id)
  const c = CAMPAIGNS.find(x => x.id === active)!
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <div className="bg-amber-400 text-amber-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 px-4 py-1.5 text-center text-[13px] font-medium">
          <span>Prototype email designs for medmartonline.com. Nothing is sent.</span>
          <Link to="/medmart/roadmap2026" className="underline underline-offset-2">Back to the roadmap</Link>
        </div>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src={LOGO} alt="MedMart" className="h-7 w-auto" />
          <span className="font-display text-lg font-bold text-slate-900">Email Campaigns</span>
          <Link to="/medmart/demo-store" className="ml-auto text-sm font-medium text-[#0076bc] hover:underline">Open the demo store →</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {CAMPAIGNS.map(x => (
              <button key={x.id} onClick={() => setActive(x.id)} className={`shrink-0 rounded-xl border px-4 py-3 text-left transition-colors lg:w-full ${active === x.id ? 'border-[#0076bc] bg-white shadow-sm' : 'border-slate-200 bg-white/60 hover:bg-white'}`}>
                <div className="text-sm font-semibold text-slate-900">{x.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{x.trigger}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 hidden rounded-xl border border-slate-200 bg-white p-4 text-sm lg:block">
            <Meta c={c} />
          </div>
        </aside>

        <main>
          <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Subject line</div>
            <div className="font-semibold text-slate-900">{c.subject}</div>
            <div className="text-sm text-slate-500">{c.preheader}</div>
          </div>
          <div className="rounded-2xl bg-slate-200 p-3 sm:p-6">
            <EmailFrame preheader={c.preheader}>{c.body}</EmailFrame>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm lg:hidden">
            <Meta c={c} />
          </div>
        </main>
      </div>
    </div>
  )
}

function Meta({ c }: { c: Campaign }) {
  const rows: [string, string][] = [['Trigger', c.trigger], ['Audience', c.audience], ['Goal', c.goal], ['KPI', c.kpi]]
  return (
    <>
      <div className="font-display text-base font-semibold text-slate-900">{c.name}</div>
      <dl className="mt-2 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></div>
        ))}
      </dl>
    </>
  )
}
