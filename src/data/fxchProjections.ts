// FTCH marketplace financial model.
// Honest, defensible numbers — every assumption is editable in the UI so
// reviewers can pressure-test the math themselves.

export type ScenarioKey = 'bear' | 'base' | 'bull'

export type Assumptions = {
  // --- Market ramp ---
  monthsBetweenLaunches: number   // how often a new market opens
  merchantsPerMarketMature: number
  monthsToMatureMerchants: number // months from market launch to full merchant count
  ordersPerMerchantDayMature: number
  monthsToMatureOrders: number    // ramp from 1 → mature

  // --- Per-order economics (dollars) ---
  averageItemValue: number        // AOV of items in cart
  deliveryFee: number             // customer-paid delivery fee
  tip: number                     // customer-paid tip (passes through to driver)
  ftchShareOfDelivery: number     // 0..1, FTCH's cut of delivery fee
  driverShareOfFtchCut: number    // 0..1, what FTCH pays driver from its cut
  itemMarkupTakenByFtch: number   // 0..1, hypothetical FTCH cut of merchant items

  // --- One-time merchant onboarding ---
  merchantRegistrationFee: number // $99 in master plan
  merchantOnboardingFee: number   // $75 in master plan
  merchantChurnMonthly: number    // 0..1 monthly churn

  // --- Costs ---
  infraBaseMonthly: number
  infraPerMarketMonthly: number
  aiBaseMonthly: number
  smsPerOrder: number             // ~3 SMS per order at ~$0.008
  backgroundChecksPerMarketMonthly: number
  marketLaunchCost: number        // one-time marketing per launch
  insuranceMonthly: number
  // Headcount cost is a step function — see headcountCost() below

  // --- Modeling horizon ---
  months: number
}

export type Scenario = {
  key: ScenarioKey
  label: string
  blurb: string
  assumptions: Assumptions
}

// =========================================================
// SCENARIOS
// =========================================================
// Every number here is defended in the FxchModel.tsx "What this assumes" section.
// The bear case is closer to honest small-town reality. The bull case requires
// near-perfect execution.

const SHARED: Pick<
  Assumptions,
  | 'averageItemValue'
  | 'deliveryFee'
  | 'tip'
  | 'ftchShareOfDelivery'
  | 'driverShareOfFtchCut'
  | 'itemMarkupTakenByFtch'
  | 'merchantRegistrationFee'
  | 'merchantOnboardingFee'
  | 'merchantChurnMonthly'
  | 'infraBaseMonthly'
  | 'infraPerMarketMonthly'
  | 'aiBaseMonthly'
  | 'smsPerOrder'
  | 'backgroundChecksPerMarketMonthly'
  | 'marketLaunchCost'
  | 'insuranceMonthly'
  | 'months'
> = {
  averageItemValue: 25,
  deliveryFee: 4,
  tip: 3,
  ftchShareOfDelivery: 0.75,
  driverShareOfFtchCut: 0.6,
  itemMarkupTakenByFtch: 0, // master plan: 0%. Try 0.05 to see what 5% markup does.
  merchantRegistrationFee: 99,
  merchantOnboardingFee: 75,
  merchantChurnMonthly: 0.04, // 4%/mo ≈ 38% annual — realistic for small-biz SMB
  infraBaseMonthly: 400,
  infraPerMarketMonthly: 60,
  aiBaseMonthly: 150,
  smsPerOrder: 0.025,           // 3 SMS × ~$0.008
  backgroundChecksPerMarketMonthly: 200,
  marketLaunchCost: 3000,
  insuranceMonthly: 1500,
  months: 36,
}

export const scenarios: Scenario[] = [
  {
    key: 'bear',
    label: 'Bear',
    blurb:
      'Small-town reality: slow merchant ramp, customers order ~3×/merchant/day at maturity, launches every 90 days.',
    assumptions: {
      ...SHARED,
      monthsBetweenLaunches: 3,
      merchantsPerMarketMature: 8,
      monthsToMatureMerchants: 9,
      ordersPerMerchantDayMature: 3,
      monthsToMatureOrders: 9,
    },
  },
  {
    key: 'base',
    label: 'Base',
    blurb:
      'Disciplined ramp: new market every 60 days, 12 merchants/market, 5 orders/merchant/day. Reflects realistic small-town demand.',
    assumptions: {
      ...SHARED,
      monthsBetweenLaunches: 2,
      merchantsPerMarketMature: 12,
      monthsToMatureMerchants: 6,
      ordersPerMerchantDayMature: 5,
      monthsToMatureOrders: 6,
    },
  },
  {
    key: 'bull',
    label: 'Bull',
    blurb:
      'Master-plan ramp: new market every month, 15 merchants/market, 8 orders/merchant/day. Requires productized launch motion and near-perfect execution.',
    assumptions: {
      ...SHARED,
      monthsBetweenLaunches: 1,
      merchantsPerMarketMature: 15,
      monthsToMatureMerchants: 4,
      ordersPerMerchantDayMature: 8,
      monthsToMatureOrders: 4,
    },
  },
]

// =========================================================
// MODEL
// =========================================================

export type MonthRow = {
  month: number
  marketsActive: number
  newMarketsThisMonth: number
  merchantsActive: number
  newMerchantsThisMonth: number
  ordersThisMonth: number
  gmv: number                  // total transaction value through platform
  ftchGrossRevenue: number     // FTCH's share of delivery + markup + onboarding
  driverPayouts: number        // driver share of FTCH cut (tips are pass-through, excluded)
  stripeFees: number           // 2.9% + $0.30 per order, paid by platform
  variableCosts: number        // SMS, AI, background checks
  fixedCosts: number           // infra + insurance + headcount + launch marketing
  totalCosts: number
  netIncome: number            // ftchGrossRevenue - driverPayouts - stripeFees - variableCosts - fixedCosts
  cumulativeCash: number       // running sum of netIncome (negative = funding needed)
  headcountCost: number        // for transparency
}

export function headcountCost(month: number): {
  monthly: number
  phase: string
  detail: string
} {
  // Step function — based on realistic comp (US, partially deferred founders)
  if (month <= 6) {
    return {
      monthly: 35000,
      phase: 'Phase 1 — Pilot',
      detail: 'Founder $10k + CTO $12k + tech specialist $5k + 2 CMs $4k each',
    }
  }
  if (month <= 12) {
    return {
      monthly: 75000,
      phase: 'Phase 1.5 — Validation',
      detail: 'Above + 2 engineers $15k each + ops coord $8k',
    }
  }
  if (month <= 24) {
    return {
      monthly: 165000,
      phase: 'Phase 2 — Regional',
      detail: 'Above + 3 engineers + designer + 5 more CMs + finance/legal fraction',
    }
  }
  return {
    monthly: 280000,
    phase: 'Phase 3 — Scale',
    detail: 'Engineering team of 8 + ops team of 6 + 12+ CMs + leadership',
  }
}

// Per-order FTCH-side P&L (in dollars). Tips are passthrough — excluded.
export function perOrderEconomics(a: Assumptions) {
  const customerCharge =
    a.averageItemValue + a.deliveryFee + a.tip + a.averageItemValue * a.itemMarkupTakenByFtch
  const stripeFee = 0.029 * customerCharge + 0.3

  const ftchDeliveryGross = a.deliveryFee * a.ftchShareOfDelivery
  const driverPayout = ftchDeliveryGross * a.driverShareOfFtchCut
  const ftchDeliveryNet = ftchDeliveryGross - driverPayout

  const ftchMarkupRevenue = a.averageItemValue * a.itemMarkupTakenByFtch

  const ftchTotalGross = ftchDeliveryNet + ftchMarkupRevenue
  const ftchNetAfterStripe = ftchTotalGross - stripeFee

  return {
    customerCharge,
    stripeFee,
    ftchDeliveryGross,
    driverPayout,
    ftchDeliveryNet,
    ftchMarkupRevenue,
    ftchTotalGross,
    ftchNetAfterStripe,
  }
}

export function simulate(a: Assumptions): MonthRow[] {
  const rows: MonthRow[] = []
  // Track each market's age so merchants + orders ramp per market
  const markets: { ageMonths: number; merchants: number }[] = []

  let cumulativeCash = 0

  for (let m = 1; m <= a.months; m++) {
    // Open new markets according to cadence
    let newMarketsThisMonth = 0
    if ((m - 1) % a.monthsBetweenLaunches === 0) {
      markets.push({ ageMonths: 0, merchants: 0 })
      newMarketsThisMonth = 1
    }

    // Age existing markets, recalc merchant ramp per market
    let newMerchantsThisMonth = 0
    let merchantsActive = 0
    for (const mk of markets) {
      mk.ageMonths += 1
      const targetMerchants = Math.min(
        a.merchantsPerMarketMature,
        Math.round((mk.ageMonths / a.monthsToMatureMerchants) * a.merchantsPerMarketMature),
      )
      const added = Math.max(0, targetMerchants - mk.merchants)
      mk.merchants = targetMerchants
      newMerchantsThisMonth += added
      merchantsActive += mk.merchants
    }

    // Apply churn (kills the same number from oldest markets first — simple approximation)
    const churned = Math.round(merchantsActive * a.merchantChurnMonthly)
    if (churned > 0) {
      let toKill = churned
      for (let i = 0; i < markets.length && toKill > 0; i++) {
        const drop = Math.min(markets[i].merchants, toKill)
        markets[i].merchants -= drop
        toKill -= drop
      }
      merchantsActive -= churned
    }

    // Orders per merchant per day ramps with market age (use oldest market's ramp as average)
    const avgMarketAge =
      markets.length > 0
        ? markets.reduce((sum, mk) => sum + mk.ageMonths, 0) / markets.length
        : 0
    const orderRampPct = Math.min(1, avgMarketAge / a.monthsToMatureOrders)
    const ordersPerMerchantDay = a.ordersPerMerchantDayMature * orderRampPct
    const ordersThisMonth = Math.round(merchantsActive * ordersPerMerchantDay * 30)

    // Per-order P&L
    const eco = perOrderEconomics(a)
    const gmv = ordersThisMonth * eco.customerCharge
    const ftchOrderGross = ordersThisMonth * eco.ftchTotalGross
    const driverPayouts = ordersThisMonth * eco.driverPayout
    const stripeFees = ordersThisMonth * eco.stripeFee

    // Onboarding fee revenue
    const onboardingRevenue =
      newMerchantsThisMonth * (a.merchantRegistrationFee + a.merchantOnboardingFee)

    const ftchGrossRevenue = ftchOrderGross + onboardingRevenue

    // Variable costs
    const smsCost = ordersThisMonth * a.smsPerOrder
    const aiCost = a.aiBaseMonthly + markets.length * 10
    const bgChecks = markets.length * a.backgroundChecksPerMarketMonthly
    const variableCosts = smsCost + aiCost + bgChecks

    // Fixed costs
    const infra = a.infraBaseMonthly + markets.length * a.infraPerMarketMonthly
    const hc = headcountCost(m).monthly
    const launchMarketing = newMarketsThisMonth * a.marketLaunchCost
    const fixedCosts = infra + a.insuranceMonthly + hc + launchMarketing

    const totalCosts = driverPayouts + stripeFees + variableCosts + fixedCosts
    const netIncome = ftchGrossRevenue - totalCosts
    cumulativeCash += netIncome

    rows.push({
      month: m,
      marketsActive: markets.length,
      newMarketsThisMonth,
      merchantsActive,
      newMerchantsThisMonth,
      ordersThisMonth,
      gmv,
      ftchGrossRevenue,
      driverPayouts,
      stripeFees,
      variableCosts,
      fixedCosts,
      totalCosts,
      netIncome,
      cumulativeCash,
      headcountCost: hc,
    })
  }

  return rows
}

export type Summary = {
  peakCashNeed: number          // max negative cumulative cash = total funding need
  breakEvenMonth: number | null // first month with positive netIncome
  y1Gmv: number
  y2Gmv: number
  y3Gmv: number
  y1Revenue: number
  y2Revenue: number
  y3Revenue: number
  finalMarkets: number
  finalMerchants: number
  finalMonthlyOrders: number
  netMarginAtEnd: number
}

export function summarize(rows: MonthRow[]): Summary {
  const yearSum = (start: number, end: number, key: keyof MonthRow): number =>
    rows.slice(start, end).reduce((s, r) => s + (r[key] as number), 0)

  const peakCashNeed = Math.abs(Math.min(0, ...rows.map((r) => r.cumulativeCash)))
  const breakEvenIdx = rows.findIndex((r) => r.netIncome > 0)
  const last = rows[rows.length - 1]

  return {
    peakCashNeed,
    breakEvenMonth: breakEvenIdx === -1 ? null : breakEvenIdx + 1,
    y1Gmv: yearSum(0, 12, 'gmv'),
    y2Gmv: yearSum(12, 24, 'gmv'),
    y3Gmv: yearSum(24, 36, 'gmv'),
    y1Revenue: yearSum(0, 12, 'ftchGrossRevenue'),
    y2Revenue: yearSum(12, 24, 'ftchGrossRevenue'),
    y3Revenue: yearSum(24, 36, 'ftchGrossRevenue'),
    finalMarkets: last?.marketsActive ?? 0,
    finalMerchants: last?.merchantsActive ?? 0,
    finalMonthlyOrders: last?.ordersThisMonth ?? 0,
    netMarginAtEnd:
      last && last.ftchGrossRevenue > 0 ? last.netIncome / last.ftchGrossRevenue : 0,
  }
}

export const fmtUSD = (n: number, opts: { compact?: boolean } = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(n)

export const fmtPct = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(n)
