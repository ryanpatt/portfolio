// Revenue / unit-economics projection models for the Kloy portfolio pages.
// Designed for transparency: the funder picks a scenario, the math is visible.

export type ScenarioKey = "conservative" | "base" | "aggressive"

export type Scenario = {
  key: ScenarioKey
  label: string
  blurb: string
  // SaaS-style monthly customer-add model
  startingCustomers: number
  monthlyNewCustomersY1: number
  monthlyNewCustomersY2: number
  monthlyNewCustomersY3: number
  monthlyChurn: number // 0-1
}

export type UnitEconomics = {
  arpaMonthlyCents: number   // average revenue per account (monthly)
  grossMarginPct: number     // 0-1
  cacCents: number           // customer acquisition cost
  paybackMonths: number      // expected payback (months)
  ltvCents: number           // lifetime value (computed externally or set)
}

export type ProjectionConfig = {
  projectSlug: string
  customerNoun: string  // "shops", "locations", "subscribers"
  revenueNoun: string   // "MRR", "subscription revenue"
  scenarios: Scenario[]
  unit: UnitEconomics
  // Optional fixed cost-per-customer for margin sanity
  costPerCustomerCents?: number
}

// =========================================================
// Per-project assumptions
// =========================================================

export const projections: Record<string, ProjectionConfig> = {
  clockhq: {
    projectSlug: "clockhq",
    customerNoun: "shops",
    revenueNoun: "MRR",
    unit: {
      // Avg 8 users × $79 = $632/mo per shop
      arpaMonthlyCents: 63200,
      grossMarginPct: 0.85, // hosting/Supabase/Vercel per tenant is small
      cacCents: 80000,      // outbound sales-led, ~$800 CAC
      paybackMonths: 2,
      ltvCents: 63200 * 24, // 24-mo avg life
    },
    costPerCustomerCents: 3000, // ~$30/mo per tenant for infra
    scenarios: [
      {
        key: "conservative",
        label: "Conservative",
        blurb: "Sales-led, 1 paid shop / quarter for 12 months, slow acceleration after referrals kick in.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0.33,
        monthlyNewCustomersY2: 1.0,
        monthlyNewCustomersY3: 1.5,
        monthlyChurn: 0.02,
      },
      {
        key: "base",
        label: "Base",
        blurb: "1 paid shop / month Y1, 2/mo Y2, 3/mo Y3. Reflects light marketing + referrals.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 1,
        monthlyNewCustomersY2: 2,
        monthlyNewCustomersY3: 3,
        monthlyChurn: 0.02,
      },
      {
        key: "aggressive",
        label: "Aggressive",
        blurb: "Funded sales hire: 3/mo Y1, 6/mo Y2, 10/mo Y3. Still below ServiceTitan-tier velocity.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 3,
        monthlyNewCustomersY2: 6,
        monthlyNewCustomersY3: 10,
        monthlyChurn: 0.02,
      },
    ],
  },

  "prime-air": {
    projectSlug: "prime-air",
    customerNoun: "shops (Prime Air-style)",
    revenueNoun: "MRR",
    unit: {
      // Prime Air is the reference deployment; projection here is "what happens if we sell to similar HVAC shops"
      arpaMonthlyCents: 63200,
      grossMarginPct: 0.85,
      cacCents: 80000,
      paybackMonths: 2,
      ltvCents: 63200 * 30, // HVAC has lower churn — longer LTV
    },
    costPerCustomerCents: 3000,
    scenarios: [
      {
        key: "conservative",
        label: "Conservative",
        blurb: "Prime Air remains the only customer; revenue is just their seats × ARPA.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0,
        monthlyNewCustomersY2: 0.25,
        monthlyNewCustomersY3: 0.5,
        monthlyChurn: 0.01,
      },
      {
        key: "base",
        label: "Base",
        blurb: "Prime Air's word-of-mouth lands 1 referral / quarter Y1, accelerating as case study matures.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0.33,
        monthlyNewCustomersY2: 1,
        monthlyNewCustomersY3: 2,
        monthlyChurn: 0.01,
      },
      {
        key: "aggressive",
        label: "Aggressive",
        blurb: "Use Prime Air as marquee case study with focused HVAC sales motion.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 1.5,
        monthlyNewCustomersY2: 3,
        monthlyNewCustomersY3: 5,
        monthlyChurn: 0.01,
      },
    ],
  },

  bentinos: {
    projectSlug: "bentinos",
    customerNoun: "locations",
    revenueNoun: "MRR",
    unit: {
      // $74/mo (midpoint of $49-99) per location + Stripe processing pass-through at cost
      arpaMonthlyCents: 7400,
      grossMarginPct: 0.78, // Supabase + Vercel + SMS scale with usage
      cacCents: 30000, // partly sales-led, partly inbound (the demo page itself)
      paybackMonths: 5,
      ltvCents: 7400 * 36,
    },
    costPerCustomerCents: 1500,
    scenarios: [
      {
        key: "conservative",
        label: "Conservative",
        blurb: "Just Bentino's plus 1 new pizzeria per quarter. Proves the model without sales investment.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0.33,
        monthlyNewCustomersY2: 0.5,
        monthlyNewCustomersY3: 1,
        monthlyChurn: 0.015,
      },
      {
        key: "base",
        label: "Base",
        blurb: "1 / mo Y1, 3 / mo Y2 (referrals + content), 6 / mo Y3 (regional expansion).",
        startingCustomers: 1,
        monthlyNewCustomersY1: 1,
        monthlyNewCustomersY2: 3,
        monthlyNewCustomersY3: 6,
        monthlyChurn: 0.015,
      },
      {
        key: "aggressive",
        label: "Aggressive",
        blurb: "Land a small franchise group (10 locations) Y1; 5 / mo independents + 1 small chain / month after.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 5,
        monthlyNewCustomersY2: 10,
        monthlyNewCustomersY3: 18,
        monthlyChurn: 0.015,
      },
    ],
  },

  "jamestown-cafe": {
    projectSlug: "jamestown-cafe",
    customerNoun: "cafes (post-launch)",
    revenueNoun: "MRR",
    unit: {
      // Built as a paid project, but the playbook (Square POS + block CMS + driver PWA) is reusable
      arpaMonthlyCents: 7400, // similar service tier as Bentino's
      grossMarginPct: 0.78,
      cacCents: 30000,
      paybackMonths: 5,
      ltvCents: 7400 * 36,
    },
    costPerCustomerCents: 1500,
    scenarios: [
      {
        key: "conservative",
        label: "Conservative",
        blurb: "Cafe launches solo, no further rollout — just the build-out revenue.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0,
        monthlyNewCustomersY2: 0.25,
        monthlyNewCustomersY3: 0.5,
        monthlyChurn: 0.01,
      },
      {
        key: "base",
        label: "Base",
        blurb: "Word-of-mouth from launch lands 1 / quarter Y1, then 1 / month after.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 0.33,
        monthlyNewCustomersY2: 1,
        monthlyNewCustomersY3: 2,
        monthlyChurn: 0.01,
      },
      {
        key: "aggressive",
        label: "Aggressive",
        blurb: "Productize the cafe playbook & sell to a regional cafe group.",
        startingCustomers: 1,
        monthlyNewCustomersY1: 2,
        monthlyNewCustomersY2: 5,
        monthlyNewCustomersY3: 8,
        monthlyChurn: 0.01,
      },
    ],
  },

  "clear-choice": {
    projectSlug: "clear-choice",
    customerNoun: "active subscribers",
    revenueNoun: "subscription revenue",
    unit: {
      // Avg subscription ~$80/mo (bi-weekly @ $20/bag × 4 bags) — order of magnitude
      arpaMonthlyCents: 8000,
      grossMarginPct: 0.45, // physical service, route cost, supplies
      cacCents: 4000, // local ads, ~$40 CAC residential
      paybackMonths: 1,
      ltvCents: 8000 * 18, // 18-mo avg sub life in laundry sector
    },
    scenarios: [
      {
        key: "conservative",
        label: "Conservative",
        blurb: "Steady local growth: 5 new subs/month Y1, 8/mo Y2, 10/mo Y3.",
        startingCustomers: 30,
        monthlyNewCustomersY1: 5,
        monthlyNewCustomersY2: 8,
        monthlyNewCustomersY3: 10,
        monthlyChurn: 0.05, // residential subs churn higher
      },
      {
        key: "base",
        label: "Base",
        blurb: "Light paid acquisition + referrals: 15/mo Y1, 25/mo Y2, 40/mo Y3.",
        startingCustomers: 30,
        monthlyNewCustomersY1: 15,
        monthlyNewCustomersY2: 25,
        monthlyNewCustomersY3: 40,
        monthlyChurn: 0.05,
      },
      {
        key: "aggressive",
        label: "Aggressive",
        blurb: "Funded local marketing + market #2: 40/mo Y1, 80/mo Y2, 150/mo Y3.",
        startingCustomers: 30,
        monthlyNewCustomersY1: 40,
        monthlyNewCustomersY2: 80,
        monthlyNewCustomersY3: 150,
        monthlyChurn: 0.05,
      },
    ],
  },
}

// =========================================================
// Helpers
// =========================================================

export function fmtUSD(cents: number, opts?: { compact?: boolean }) {
  const n = cents / 100
  if (opts?.compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    return `$${(n / 1000).toFixed(1)}K`
  }
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

export function simulate(scenario: Scenario, arpaCents: number, months = 36) {
  const data: {
    month: number
    label: string
    customers: number
    newCustomers: number
    churned: number
    mrrCents: number
    cumRevenueCents: number
  }[] = []

  let customers = scenario.startingCustomers
  let cumRevenue = 0

  for (let m = 1; m <= months; m++) {
    const year = Math.ceil(m / 12)
    const rate =
      year === 1 ? scenario.monthlyNewCustomersY1
      : year === 2 ? scenario.monthlyNewCustomersY2
      : scenario.monthlyNewCustomersY3

    // Apply churn on existing base, then add new (fractional rounded)
    const churned = customers * scenario.monthlyChurn
    customers = customers - churned + rate
    if (customers < 0) customers = 0

    const mrr = Math.round(customers * arpaCents)
    cumRevenue += mrr

    data.push({
      month: m,
      label: `M${m}`,
      customers: Math.round(customers * 10) / 10,
      newCustomers: Math.round(rate * 10) / 10,
      churned: Math.round(churned * 10) / 10,
      mrrCents: mrr,
      cumRevenueCents: cumRevenue,
    })
  }

  return data
}

export function summarize(data: ReturnType<typeof simulate>) {
  const m12 = data[11]
  const m24 = data[23]
  const m36 = data[35]
  return {
    y1AnnualizedCents: m12 ? m12.mrrCents * 12 : 0,
    y2AnnualizedCents: m24 ? m24.mrrCents * 12 : 0,
    y3AnnualizedCents: m36 ? m36.mrrCents * 12 : 0,
    y3Customers: m36 ? Math.round(m36.customers) : 0,
    cum36Cents: m36 ? m36.cumRevenueCents : 0,
  }
}
