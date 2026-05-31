// Mock catalog for the medmartonline.com redesign demo storefront.
// Placeholder imagery only (no real product photos). Prices illustrative.

export type Product = {
  slug: string
  name: string
  brand: string
  category: string // category slug
  price: number
  rating: number
  reviews: number
  inStock: boolean
  blurb: string
  bullets: string[]
  hue: number // for the placeholder gradient
  tags: string[] // feature/use tags powering category filters
  img?: string
  bestSeller?: boolean
  overallPick?: boolean // the single top recommendation in its category (Amazon-style)
}

export type Category = { slug: string; name: string; tagline: string; hue: number }

export const CATEGORIES: Category[] = [
  { slug: 'mobility-scooters', name: 'Mobility Scooters', tagline: 'Regain your independence', hue: 205 },
  { slug: 'lift-chairs', name: 'Lift Chairs', tagline: 'Sit and stand with ease', hue: 25 },
  { slug: 'power-wheelchairs', name: 'Power Wheelchairs', tagline: 'All-day comfort & control', hue: 265 },
  { slug: 'hospital-beds', name: 'Hospital Beds', tagline: 'Safe, comfortable home care', hue: 160 },
  { slug: 'bath-safety', name: 'Bath Safety', tagline: 'Confidence in the bathroom', hue: 190 },
  { slug: 'stair-lifts', name: 'Stair Lifts', tagline: 'Every floor, within reach', hue: 330 },
]

export const PRODUCTS: Product[] = [
  {
    slug: 'golden-buzzaround-hd', name: 'Golden Buzzaround HD Mobility Scooter', brand: 'Golden Technologies',
    category: 'mobility-scooters', price: 1899, rating: 4.9, reviews: 214, inStock: true,
    blurb: 'A travel scooter that disassembles in seconds and supports up to 350 lbs — the most-recommended pick for everyday independence.',
    bullets: ['Up to 13.5 miles per charge', 'Disassembles into 5 lightweight pieces', '350 lb weight capacity', 'Delta tiller for easy steering'],
    hue: 205, img: '/medmart/demo-store/products/mobility-scooters-1.jpg', tags: ['Travel-friendly', 'Foldable', 'Heavy-duty', '4-wheel'], bestSeller: true, overallPick: true,
  },
  {
    slug: 'pride-go-go-sport', name: 'Pride Go-Go Sport 4-Wheel Scooter', brand: 'Pride Mobility',
    category: 'mobility-scooters', price: 1299, rating: 4.7, reviews: 156, inStock: true,
    blurb: 'Compact, dependable, and feather-light to transport — perfect for errands, travel, and tight spaces.',
    bullets: ['Feather-touch disassembly', 'Up to 9 miles per charge', '325 lb capacity', 'LED battery gauge'],
    hue: 212, img: '/medmart/demo-store/products/mobility-scooters-2.jpg', tags: ['Travel-friendly', 'Foldable', 'Compact', '4-wheel'],
  },
  {
    slug: 'golden-maxicomfort', name: 'Golden MaxiComfort Lift Chair', brand: 'Golden Technologies',
    category: 'lift-chairs', price: 1749, rating: 4.8, reviews: 389, inStock: true,
    blurb: 'Zero-gravity positioning that floats your legs above your heart — clinically loved for circulation and pressure relief.',
    bullets: ['Infinite zero-gravity recline', 'Power lumbar & headrest', 'USB charging port', 'Up to 375 lb capacity'],
    hue: 25, img: '/medmart/demo-store/products/lift-chairs-1.jpg', tags: ['Zero-gravity', 'Power recline', 'Heavy-duty'], bestSeller: true, overallPick: true,
  },
  {
    slug: 'pride-heritage-lift-chair', name: 'Pride Heritage Collection Lift Chair', brand: 'Pride Mobility',
    category: 'lift-chairs', price: 1099, rating: 4.6, reviews: 203, inStock: true,
    blurb: 'A classic three-position recliner that gently lifts you to standing — comfort that pays for itself daily.',
    bullets: ['3-position power recline', 'Heat & massage option', 'Plush biscuit back', '375 lb capacity'],
    hue: 32, img: '/medmart/demo-store/products/lift-chairs-2.jpg', tags: ['3-position', 'Heat & massage', 'Value'],
  },
  {
    slug: 'contesa-floorbed', name: 'Contesa FloorBed Hi-Low Homecare Bed', brand: 'Med Mart',
    category: 'hospital-beds', price: 3599, rating: 4.8, reviews: 126, inStock: true,
    blurb: 'Lowers to just inches off the floor for fall safety, then raises to caregiver height — the gold standard for home care.',
    bullets: ['Floor-level to 30" height range', 'Full electric hi-low', 'Fall-safety design', 'Free white-glove delivery & setup'],
    hue: 160, img: '/medmart/demo-store/products/hospital-beds-1.jpg', tags: ['Hi-low', 'Fall safety', 'White-glove setup'], overallPick: true,
  },
  {
    slug: 'drive-full-electric-bed', name: 'Drive Medical Full-Electric Hospital Bed', brand: 'Drive Medical',
    category: 'hospital-beds', price: 1149, rating: 4.5, reviews: 97, inStock: true,
    blurb: 'Head, foot, and height all at the touch of a button — a dependable, value-priced home hospital bed.',
    bullets: ['Full electric adjustment', 'Half-rails included', 'Tool-free assembly', '450 lb capacity'],
    hue: 152, img: '/medmart/demo-store/products/hospital-beds-2.jpg', tags: ['Full electric', 'Value', 'Heavy-duty'],
  },
  {
    slug: 'jazzy-air-2', name: 'Jazzy Air 2 Power Wheelchair', brand: 'Pride Jazzy',
    category: 'power-wheelchairs', price: 4795, rating: 4.9, reviews: 64, inStock: true,
    blurb: 'Elevates you up to 12 inches while driving — reach the top shelf, meet people eye to eye, live at full height.',
    bullets: ['12" of powered seat elevation', 'Drive while elevated up to 3.5 mph', 'Up to 18 mile range', 'iLevel stability technology'],
    hue: 265, img: '/medmart/demo-store/products/power-wheelchairs-1.jpg', tags: ['Seat elevation', 'Long range', 'Premium'], bestSeller: true, overallPick: true,
  },
  {
    slug: 'drive-cirrus-plus', name: 'Drive Cirrus Plus Power Wheelchair', brand: 'Drive Medical',
    category: 'power-wheelchairs', price: 1599, rating: 4.6, reviews: 142, inStock: true,
    blurb: 'Tight 23.5" turning radius and a foldable frame — capable indoors, transportable anywhere.',
    bullets: ['Folds for transport', 'Flip-back desk arms', 'Up to 15 mile range', '300 lb capacity'],
    hue: 258, img: '/medmart/demo-store/products/power-wheelchairs-2.jpg', tags: ['Foldable', 'Compact', 'Transportable'],
  },
  {
    slug: 'drive-shower-transfer-bench', name: 'Drive Shower Transfer Bench', brand: 'Drive Medical',
    category: 'bath-safety', price: 129, rating: 4.7, reviews: 512, inStock: true,
    blurb: 'Slide safely in and out of the tub without standing — the #1 bathroom-safety upgrade families buy.',
    bullets: ['Height-adjustable legs', 'Reversible for any tub', 'Drainage holes prevent slips', '400 lb capacity'],
    hue: 190, img: '/medmart/demo-store/products/bath-safety-1.jpg', tags: ['Budget', 'Tub transfer', 'Heavy-duty'], bestSeller: true, overallPick: true,
  },
  {
    slug: 'harmar-sl600-stair-lift', name: 'Harmar SL600 Pinnacle Stair Lift', brand: 'Harmar',
    category: 'stair-lifts', price: 3199, rating: 4.8, reviews: 88, inStock: true,
    blurb: 'Quiet, smooth, and battery-backed so it works in a power outage — professionally measured and installed.',
    bullets: ['Battery backup operation', 'Swivel seat with safety sensors', 'Folds flush to the wall', 'Pro install included'],
    hue: 330, img: '/medmart/demo-store/products/stair-lifts-1.jpg', tags: ['Battery backup', 'Pro install', 'Swivel seat'], overallPick: true,
  },
]

export const monthly = (price: number) => Math.round(price / 24)
export const usd = (n: number) => '$' + n.toLocaleString('en-US')
export const productBySlug = (slug: string) => PRODUCTS.find(p => p.slug === slug)
export const productsByCategory = (cat: string) => PRODUCTS.filter(p => p.category === cat)
export const categoryImages = (slug: string) => [1, 2, 3].map(n => `/medmart/demo-store/products/${slug}-${n}.jpg`)
