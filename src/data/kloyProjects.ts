export type Status = "shipping_revenue" | "launching" | "closing" | "in_negotiation" | "production"

export type ProjectStat = { label: string; value: string }

export type Project = {
  slug: string
  name: string
  oneLiner: string
  status: Status
  badge: string
  accent: string // tailwind color stem, e.g. "tomato" or "blue"
  liveUrls?: { label: string; url: string; note?: string }[]
  privateAccess?: string // "Demo on request" / "Paying customer — production"
  stack: string[]
  whatItDoes: string[]
  marketAndModel: string[]
  traction: ProjectStat[]
  whyDefensible: string[]
  techHighlights: string[]
  links?: { label: string; url: string }[]
}

const STATUS_LABEL: Record<Status, { label: string; tone: string }> = {
  shipping_revenue: { label: "Live · Generating revenue", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  launching: { label: "Launching in 2 weeks", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  closing: { label: "In final close", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  in_negotiation: { label: "In negotiation", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  production: { label: "Production · Paying customer", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
}

export function statusPill(s: Status) {
  return STATUS_LABEL[s]
}

export const projects: Project[] = [
  {
    slug: "clockhq",
    name: "ClockHQ",
    oneLiner:
      "Multi-tenant SaaS field-service platform — every HVAC / plumbing / electrical / landscaping shop gets its own isolated deployment from one codebase.",
    status: "production",
    badge: "Vertical SaaS",
    accent: "blue",
    liveUrls: [
      { label: "Marketing + pricing", url: "https://clock-hq.com" },
      { label: "Platform portal (admin)", url: "https://platform.clock-hq.com", note: "internal — for tenant provisioning + billing" },
    ],
    privateAccess: "Per-customer product instances are provisioned per tenant; demo on request.",
    stack: [
      "Next.js 14 App Router",
      "tRPC v11",
      "Prisma + PostgreSQL (Supabase)",
      "NextAuth v5 JWT",
      "Turborepo monorepo",
      "Vercel · per-tenant deploys",
      "Stripe (Sandbox + Live)",
      "Cloudflare R2 (file storage)",
    ],
    whatItDoes: [
      "Two Next.js apps share one tRPC API: a dispatcher/admin web hub and a field-worker PWA timeclock.",
      "Each customer company is provisioned its own Vercel deployment + Supabase schema, isolated by tenant slug.",
      "Dispatchers see live crew location, work-order status, and a smart-assign queue; technicians clock in/out, capture photos, collect signatures, generate invoices on-site.",
      "Platform portal handles client onboarding, billing, and one-click provisioning of new tenants.",
    ],
    marketAndModel: [
      "Target market: small-to-mid US field-service companies, 3–50 technicians.",
      "TAM: ~600,000 US field-service businesses (HVAC + plumbing + electrical + landscaping combined). Direct competitors: Workyard ($60M+ funding, ~$50/user/mo), Jobber ($60M+ funding, ~$45/user/mo), ServiceTitan (IPO'd 2024, ~$300/user/mo).",
      "Pricing: $39/user/mo entry, $79/user/mo standard, $129/user/mo enterprise. Average customer 8 users = $632 MRR.",
      "Multi-tenant deploy-per-customer architecture means margin scales linearly — each $632 MRR customer adds ~$30 in infra cost.",
    ],
    traction: [
      { label: "Live customers", value: "1 paying (Prime Air Conditioning)" },
      { label: "Pipeline", value: "3 in discovery" },
      { label: "ARR per customer", value: "~$7.6K" },
      { label: "Stack proven on", value: "Multi-tenant prod" },
    ],
    whyDefensible: [
      "Two interconnected apps (hub + timeclock PWA) sharing a single tRPC layer — competitors usually have one or the other.",
      "Per-tenant Vercel deployments give the data-isolation story a regulated customer (insurance, healthcare-adjacent) actually buys.",
      "Built once, runs N customers — onboarding a new shop is a `vercel deploy` + Supabase schema create, not a re-implementation.",
    ],
    techHighlights: [
      "tRPC end-to-end type-safety means a backend change immediately type-errors the frontend; zero drift.",
      "NextAuth v5 with JWT + per-tenant secrets isolates sessions even though customers share infra.",
      "Real-time location + dispatch updates via Postgres LISTEN/NOTIFY pushed through tRPC subscriptions.",
    ],
  },
  {
    slug: "prime-air",
    name: "Prime Air Conditioning",
    oneLiner:
      "Production deployment of the ClockHQ platform for a real HVAC company — first paying customer, full FSM stack in daily use.",
    status: "production",
    badge: "Reference customer",
    accent: "blue",
    liveUrls: [
      { label: "ClockHQ codebase + pricing", url: "https://clock-hq.com", note: "Prime Air is a deployed instance of this product" },
    ],
    privateAccess: "Live, paying production system with real customer data. Walkthrough on request — customer is willing to talk to investors with notice.",
    stack: [
      "ClockHQ codebase, customer-provisioned tenant",
      "Customer-branded subdomains: hub + timeclock",
      "Stripe billing live",
      "Supabase Postgres dedicated schema",
      "Cloudflare R2 for job photos + signed PDFs",
    ],
    whatItDoes: [
      "Office staff use the hub for dispatch, scheduling, customer/asset management, invoicing, and reporting.",
      "Field techs use the PWA timeclock — clock in, see today's stops, capture photos, get customer signatures, and collect payment on-site.",
      "Customer portal lets homeowners see upcoming service, approve estimates, and pay invoices.",
    ],
    marketAndModel: [
      "Validates the ClockHQ platform with a real customer — proves multi-tenant provisioning works in production.",
      "Operates as the reference implementation for sales conversations with other HVAC shops.",
    ],
    traction: [
      { label: "Status", value: "Live, daily use" },
      { label: "Tenant", value: "Provisioned from clockhq" },
      { label: "Role", value: "Reference customer" },
      { label: "Stripe", value: "Production charges flowing" },
    ],
    whyDefensible: [
      "Already in daily production use — not vaporware. The customer's office and field crews actually depend on it.",
      "Demonstrates the per-tenant provisioning model works at the operational level: paid billing, real invoicing, real photos, real signatures.",
    ],
    techHighlights: [
      "Same codebase as ClockHQ — every improvement to the platform automatically lands here on next deploy.",
      "Stripe Connect-style billing isolation per tenant.",
    ],
  },
  {
    slug: "jamestown-cafe",
    name: "Jamestown Cafe",
    oneLiner:
      "Coffee + brunch cafe ordering site with Square POS integration, custom block-CMS, and PWA-installable driver app.",
    status: "launching",
    badge: "Restaurant",
    accent: "orange",
    liveUrls: [
      { label: "Customer site", url: "https://thejamestowncafe.com", note: "launching publicly in ~2 weeks" },
    ],
    privateAccess: "Admin + driver apps gated to staff; full walkthrough on request.",
    stack: [
      "PHP 8.1 (custom MVC)",
      "MySQL 8 + Redis 7",
      "Slim 4 REST API",
      "Square PHP SDK (catalog + payments)",
      "JWT auth, CSRF double-submit, RBAC",
      "Docker dev · shared hosting prod",
    ],
    whatItDoes: [
      "Customer orders coffee, brunch, and pastries; Square catalog drives the menu and payments are tokenized.",
      "Owner edits page hero, copy, images, and announcements through a block-based admin CMS (hero / text / image / announcement / features blocks).",
      "Driver PWA installable to home screen for delivery routing; service worker handles offline.",
    ],
    marketAndModel: [
      "Paid build for a single-location independent cafe. Validates the 'modernize an existing Square POS shop without ripping it out' playbook.",
      "Same playbook is being applied to Bentino's (sibling project) on a more modern stack.",
    ],
    traction: [
      { label: "Launch", value: "~2 weeks" },
      { label: "Revenue", value: "Paid project (delivered)" },
      { label: "Square sync", value: "Live + sandbox" },
      { label: "PWA", value: "Customer + driver" },
    ],
    whyDefensible: [
      "Square POS integration is non-trivial and slow to build — having it done is the moat for follow-on cafes.",
      "The block-CMS lets the owner update their site without a developer — eliminates the typical 'site rots after launch' failure mode.",
    ],
    techHighlights: [
      "Square Web Payments SDK on the front-end tokenizes cards directly to Square, so server never touches PAN.",
      "Custom MVC framework shared with Clear Choice Laundry — same patterns, two production sites.",
      "Two service workers (customer + driver) with separate manifests served from one PHP app.",
    ],
  },
  {
    slug: "bentinos",
    name: "Bentino's Pizza",
    oneLiner:
      "Full three-app pizza ecosystem (customer site + admin KDS + driver app) on a modern Vercel-native stack with live Stripe and Supabase Realtime.",
    status: "closing",
    badge: "Restaurant · Multi-app",
    accent: "tomato",
    liveUrls: [
      { label: "Customer site", url: "https://bentinos.ryanpatt.com" },
      { label: "Admin KDS", url: "https://adminbentinos.ryanpatt.com", note: "live order queue + menu manager + reports" },
      { label: "Driver app", url: "https://driverbentinos.ryanpatt.com", note: "PWA-installable" },
      { label: "POS evaluation page", url: "https://bentinos.ryanpatt.com/pos-demo-options", note: "owner-facing buy-vs-build deck" },
    ],
    stack: [
      "Next.js 16 App Router (3 apps in Turborepo monorepo)",
      "Supabase Postgres + Realtime + Auth + RLS",
      "Drizzle ORM",
      "Stripe (Payment Element, Apple/Google Pay, webhooks)",
      "Cloudflare DNS · Vercel Functions",
      "Resend (email) + Twilio (SMS) wired",
      "Tailwind v4 + custom brand system",
    ],
    whatItDoes: [
      "Customer site: real menu sourced from the owner's printed PDF (56 items, real prices), pizza builder with half/half + double toppings, suggested upsells, tip + schedule + delivery address, Stripe checkout, live order tracker.",
      "Admin app: real-time KDS with audible alerts, menu manager with inline edit + 86 toggle, hours editor with 'we're slammed' pause toggle that instantly hides ordering, daily reports, driver invite flow.",
      "Driver app: dark-themed for in-vehicle use, live deliveries via Realtime, Google Maps deep-link nav, status flow (accept → picked up → delivered).",
      "Every status transition flows live through Supabase Realtime — customer's tracker page updates in real time when admin advances the order.",
    ],
    marketAndModel: [
      "Service model: $49–$99/mo per location depending on enabled options (SMS, real-time tracking, KDS, admin seats). Stripe pass-through at cost (2.7% + 5¢).",
      "Designed multi-tenant from day one — every domain row carries location_id, so a small chain or a franchise group plugs in without migrations.",
      "Replaces or runs alongside legacy POS (ArrowPOS in Bentino's case) — see /pos-demo-options for the owner-facing buy-vs-build deck.",
      "TAM: ~75,000 US independent pizzerias. Direct competitors: Slice (acquired), ChowNow (~$100M ARR), Toast Online Ordering (Toast does $1B+/yr).",
    ],
    traction: [
      { label: "Status", value: "In final close with owner" },
      { label: "Apps shipped", value: "3 (customer + admin + driver)" },
      { label: "Menu items live", value: "56 with real prices" },
      { label: "End-to-end", value: "Stripe payment → DB → KDS → driver → tracker" },
    ],
    whyDefensible: [
      "Most pizza-ordering startups give the shop one app and call it done. This is a full operational stack (KDS + driver + admin) on infrastructure the owner doesn't have to babysit.",
      "Real-time updates between three apps via Supabase Realtime is the kind of thing 'simpler' competitors charge enterprise to enable.",
      "Built on a stack one engineer can maintain — no Kubernetes, no Kafka, no devops team. Margin story is excellent.",
    ],
    techHighlights: [
      "Three Vercel projects share one Drizzle schema (@bentinos/db workspace package) — every type from DB to UI is end-to-end safe.",
      "Stripe Payment Element via Checkout-Sessions-style flow; idempotent PaymentIntent creation prevents double-charges on retry.",
      "Webhook-driven order lifecycle with full event-log audit trail (every status change records actor + when + why).",
      "Force-dynamic on menu/product pages so owner price edits land on the customer site on the next request — no cache to bust.",
    ],
    links: [
      { label: "GitHub (private)", url: "https://github.com/ryanpatt/bentinos" },
    ],
  },
  {
    slug: "clear-choice",
    name: "Clear Choice Laundry",
    oneLiner:
      "Subscription laundry service with web booking + iOS/Android customer app, Stripe billing, route-optimized pickup/delivery, and full admin workflow.",
    status: "shipping_revenue",
    badge: "Subscription + Mobile",
    accent: "blue",
    liveUrls: [
      { label: "Customer web app", url: "https://clearchoicelaundry.com" },
    ],
    privateAccess: "Mobile apps published to iOS App Store + Google Play — search 'Clear Choice Laundry'. Admin dashboard internal-only; demo on request.",
    stack: [
      "PHP 8 custom MVC (web + admin)",
      "Slim 4 REST API",
      "MySQL 8 + Stripe Connect billing",
      "React Native + Expo SDK 54 (mobile)",
      "Expo Router file-based nav",
      "Cloudways managed VPS + GitHub Actions CI/CD",
    ],
    whatItDoes: [
      "Customers book pickup/delivery online or in the mobile app, sign up for weekly / bi-weekly / monthly subscriptions, pay via Stripe.",
      "Admin dashboard manages bookings, routes, customers, subscription state, and operational workflows (pickup → wash → fold → deliver).",
      "Mobile app handles auth, booking, subscription management, in-app messaging, and order history.",
    ],
    marketAndModel: [
      "Subscription pricing: weekly $X / bi-weekly $X / monthly $X (set per market). Per-bag à la carte option for non-subscribers.",
      "Operationally proven: real customers, real routes, real bags being washed.",
      "TAM: ~20,000 independent laundromats and dry cleaners in the US, most underserved by tech. Closest competitor: Cents (focused on coin-op laundromats), Rinse ($45M funded, San Francisco-only initially).",
    ],
    traction: [
      { label: "Status", value: "Live · taking subscriptions" },
      { label: "Apps", value: "Published on iOS + Android" },
      { label: "Stack", value: "Web + mobile + admin all live" },
      { label: "Payments", value: "Stripe production" },
    ],
    whyDefensible: [
      "Already operating with real subscribers — proves unit economics work at the small-business level.",
      "Same custom MVC framework as Jamestown Cafe — playbook is portable to other vertical service businesses (dog grooming pickup, lawn care, mobile car wash, etc.).",
      "Mobile + web + admin all built and shipped — competitors with one channel are at a disadvantage.",
    ],
    techHighlights: [
      "Expo Router file-based navigation lets one mobile codebase target iOS, Android, and web from a single source.",
      "Stripe subscription handling with prorated charges, plan changes, and dunning all production-tested.",
      "Custom route-optimization for pickup runs reduces driver time per pickup.",
    ],
  },
]
