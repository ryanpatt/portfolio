export const config = { runtime: 'edge' }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  })
}

// Length-independent compare to avoid leaking match progress via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/* ── The protected report. Lives server-side only; never shipped to the browser
   unless the PIN matches. Color/tone fields are semantic keys the client maps to
   Tailwind classes (classes must exist in src/ to survive purge). ───────────── */
const report = {
  date: '2026-05-24',
  intro:
    'An automated bot has been testing stolen credit cards against the MedMart checkout since February. ' +
    'Most attempts failed, but starting in April a wave of fraudulent orders using valid stolen cards succeeded — ' +
    'pushing chargebacks to about three times the normal rate. This is a plain-language summary for management, ' +
    'with the orders that need checking and the steps to stop it.',
  statCards: [
    { label: 'Confirmed net loss — April', value: '$18,875', sub: '9 chargebacks, after $4,036 refunds', color: 'red' },
    { label: 'Charged & at risk — May',    value: '$7,818',  sub: '4 orders flagged fraud — verify', color: 'orange' },
    { label: 'Chargeback spike',           value: '9 vs ~2', sub: 'April vs monthly baseline', color: 'gold' },
    { label: 'Bot card-tests blocked',     value: '17,000+', sub: 'one IP — now blocked at Cloudflare', color: 'emerald' },
  ],
  whatHappened: [
    'Criminals buy lists of stolen card numbers. Before using them, they "test" the cards by attempting small ' +
      'purchases to see which ones still work. Our checkout was being used as that testing ground: a single ' +
      'automated program created hundreds of fake orders, each with a throwaway email address, to try one card ' +
      'at a time against a cheap $25 product.',
    'The testing itself was almost entirely blocked — none of those test orders went through. The real damage ' +
      'came afterward: the cards that passed the test were used on separate, larger orders ($600–$3,140 each). ' +
      'Those went through, the goods shipped, and weeks later the banks reversed the payments as fraud ' +
      '(a "chargeback").',
  ],
  money: [
    { period: '2025 baseline', what: '~2 chargebacks / month (normal)', amount: '~$7,000/mo', tone: 'muted' },
    { period: 'April 2026', what: '9 chargebacks (gross; $18,875 net after refunds)', amount: '$22,911', tone: 'orange' },
    { period: 'May 2026', what: '10 orders flagged as fraud — 4 already charged', amount: '$7,818 at risk', tone: 'gold' },
  ],
  moneyNote:
    'How to read these figures: April’s $22,911 is gross order value — $4,036 was clawed back via refunds, so ' +
    'the net confirmed loss is $18,875. The May $7,818 was charged but only flagged (at risk of becoming a ' +
    'chargeback, not yet confirmed); the 6 other May orders ($7,597) were caught before any money moved. Combined, ' +
    'that is roughly $30,700 of gross exposure, or about $26,700 net-plus-at-risk. The normal pre-spike baseline ' +
    'was ~2 chargebacks per month (~$7,000).',
  moneyOrders: {
    aprilChargebacks: ['1000337091', '1000334916', '1000333002', '1000325523', '1000323474', '1000311885', '1000310769', '1000308720', '1000305696'],
    mayFraud: ['1000379154', '1000378608', '1000377354', '1000377270', '1000375689', '1000374924', '1000350198', '1000350006', '1000342806', '1000341984'],
    mayCaptured: ['1000374924', '1000350198', '1000342806', '1000341984'],
  },
  priorities: [
    ['Stop the bot now', 'Block its internet address at the website edge — instant, no customer impact.'],
    ['Check 4 orders', 'Two are fully recoverable, one can be pulled from the warehouse today, one has shipped.'],
    ['Close the gap', 'Turn on bot protection and stricter card checks so this cannot recur at this scale.'],
  ],
  orders: [
    { order: '1000374924', amount: '$617.95',   shipTo: 'Toledo, OH',      state: 'Charged, NOT shipped',            action: 'Refund + cancel — money fully recoverable', sev: 'recoverable' },
    { order: '1000350198', amount: '$1,311.49', shipTo: 'Surprise, AZ',    state: 'Charged, NOT shipped',            action: 'Refund + cancel — money fully recoverable', sev: 'recoverable' },
    { order: '1000342806', amount: '$3,140.84', shipTo: 'Los Angeles, CA', state: 'Packed, no tracking yet',         action: 'Pull from warehouse TODAY before it ships', sev: 'urgent' },
    { order: '1000341984', amount: '$2,747.98', shipTo: 'Los Angeles, CA', state: 'Shipped (tracking 871507334536)', action: 'Attempt carrier intercept; likely a loss',  sev: 'lost' },
  ],
  ordersNote:
    'These four May orders were charged successfully but flagged as suspected fraud. Status reflects the production ' +
    'database as of 2026-05-24. Money is recoverable until the goods physically ship.',
  patternNote:
    'Two of these orders ship to adjacent Los Angeles ZIP codes (90027 / 90029) and use 818 area-code phone ' +
    'numbers — a likely "reshipping" address used by the fraud ring. Add these addresses and phone numbers to a ' +
    'manual-review watchlist so future orders to them are held automatically.',
  prevention: [
    {
      when: 'Immediate — stops the active attack',
      tone: 'red',
      items: [
        { title: 'Block the bot at the website edge', detail: 'The attacker is a single data-center address (94.72.160.10), not a real shopper. Blocking it stops the attack instantly with zero impact on customers.' },
        { title: 'Verify the 4 charged orders', detail: 'Two are still recoverable, one can be pulled from the warehouse today, one has shipped. See the "Orders to Verify" tab.' },
      ],
    },
    {
      when: 'Short-term — breaks automated card testing',
      tone: 'orange',
      items: [
        { title: 'Turn on the "are you human?" check at checkout', detail: 'A reCAPTCHA on the checkout page stops automated bots from submitting hundreds of orders.' },
        { title: 'Tighten card security rules in Authorize.Net', detail: 'Set address and security-code mismatches to REJECT (not just flag), and add speed limits that block many rapid attempts from the same source.' },
        { title: 'Add a checkout speed limit at the edge', detail: 'Limit how many checkout attempts a single visitor can make per minute.' },
      ],
    },
    {
      when: 'Medium-term — durable protection',
      tone: 'emerald',
      items: [
        { title: 'Add a fraud-screening service', detail: 'A service like Signifyd or NoFraud scores every order and can guarantee against chargebacks. At the current loss rate it pays for itself quickly.' },
        { title: 'Turn on spike alerts', detail: 'Automatically notify the team within minutes when declines surge — this attack ran for weeks before anyone noticed.' },
      ],
    },
  ],
  preventionNote:
    'Each item maps to a concrete change at the Cloudflare edge, in the store admin (reCAPTCHA), or in the ' +
    'Authorize.Net dashboard. Production changes are applied carefully and are reversible.',
  actionsTaken: {
    asOf: '2026-05-25',
    items: [
      { status: 'done', text: 'Blocked the attacker IP (94.72.160.10) at the Cloudflare edge — the layer that actually sees the real client IP.' },
      { status: 'done', text: 'Repaired the Cloudflare checkout rate-limit rule: it now issues a Managed Challenge to any IP exceeding 20 order-submits/minute on the payment endpoint. It had been scoped to a checkout path the bot never used, so it never fired.' },
      { status: 'progress', text: 'Google reCAPTCHA on checkout — being enabled as the complementary in-app layer.' },
      { status: 'note', text: 'Architecture finding: traffic flows Cloudflare → Fastly → store. An earlier block placed at Fastly was ineffective because Fastly only sees Cloudflare’s IPs — edge blocking must be done at Cloudflare.' },
    ],
  },
  attacker: [
    ['Source', 'One data-center address — 94.72.160.10, Dallas TX (Hivelocity / HostVenom), flagged DATACENTER. Not a real shopper.'],
    ['Activity', '208 fake carts using 143 throwaway emails, Feb 7 → May 25.'],
    ['Target', 'One cheap product (~$25 TENS electrodes) hit 126 times — the test item.'],
    ['Result', '0 completed orders from this address — every card it tested was declined.'],
  ],
  declineReasons: [
    { reason: 'Transaction declined by bank', count: 92 },
    { reason: 'Billing address mismatch (AVS)', count: 52 },
    { reason: 'Invalid card number (testing random numbers)', count: 50 },
    { reason: 'Transaction declined', count: 48 },
    { reason: 'Duplicate / rapid retry', count: 22 },
    { reason: 'Expired card', count: 12 },
  ],
  evidenceNote:
    'On May 24 alone there were 66 failed order attempts, versus a normal 2–16 per day. The successful fraudulent ' +
    'orders came from separate residential addresses using the cards that passed testing.',
  method:
    'Read-only analysis of the Adobe Commerce Cloud production database (orders, payments, and shopping carts) ' +
    'cross-referenced with the server payment-error logs. No customer data was modified and no changes were made ' +
    'to the live site during the investigation. The authoritative approved-vs-declined totals will be confirmed ' +
    'directly in the Authorize.Net dashboard.',
  sources: {
    cardTesting: {
      ip: '94.72.160.10',
      host: 'Dallas, TX data center — Hivelocity / HostVenom (rDNS static.hvvc.us), flagged DATACENTER, not a home connection',
      attempts: 17030,
      emails: 4106,
      window: 'Feb 7 → May 25, 2026 — major surge May 24–25 (~4,900 attempts/hour at peak)',
      target: 'agf-101 — TENS electrodes (~$25), hit 126 times',
      comboNote:
        'The 143 emails are real, varied addresses across many providers (gmail, yahoo, business and school ' +
        'domains) — not random fakes. That signature means the attacker is working from a stolen "combo list" of ' +
        'card number + cardholder email, testing them one at a time.',
      sampleEmails: [
        'jenniferhicks115@gmail.com', 'kwhittenburg@accresinc.com', 'preschool@teesd.org',
        'MARKRODGERS1@FUSE.NET', 'dietrichc@hotmail.com', 'Levi712013@yahoo.com',
      ],
    },
    geoNote:
      'Geolocation shows a sharp contrast. The card-testing bot runs from a Dallas data center (Hivelocity) — ' +
      'clearly automated. The successful fraudulent orders, by contrast, came from ordinary residential and mobile ' +
      'ISPs (Comcast, Verizon, AT&T, Charter, T-Mobile…) scattered across ~18 states, and most geolocate near their ' +
      'own shipping address. That makes the cash-out orders look like normal local shoppers — which is why they ' +
      'slipped past while the bot was being blocked. (IP origins via ip-api.com.)',
    fraudOrders: [
      { ord: '1000379154', d: '05-24', st: 'fraud', email: 'duhon1troy@gmail.com', ip: '139.55.36.159', ipGeo: 'Abilene, TX · Windstream', amt: '$1,164.88', ship: 'Munday, TX' },
      { ord: '1000378608', d: '05-23', st: 'fraud', email: 'Jackal4078@yahoo.com', ip: '74.218.150.58', ipGeo: 'Lexington, KY · Charter', amt: '$849.65', ship: 'Ravenna, OH' },
      { ord: '1000377354', d: '05-22', st: 'fraud', email: 'chelleboudwin@yahoo.com', ip: '12.75.115.88', ipGeo: 'Baton Rouge, LA · AT&T mobile', amt: '$662.26', ship: 'Larose, LA' },
      { ord: '1000377270', d: '05-22', st: 'fraud', email: 'chelleboudwin@yahoo.com', ip: '12.75.115.88', ipGeo: 'Baton Rouge, LA · AT&T mobile', amt: '$662.26', ship: 'Larose, LA (dup)' },
      { ord: '1000375689', d: '05-21', st: 'fraud', email: 'zaltsmani14@gmail.com', ip: '24.144.224.45', ipGeo: 'Slippery Rock, PA · Armstrong', amt: '$1,235.90', ship: 'Butler, PA' },
      { ord: '1000374924', d: '05-20', st: 'fraud', email: 'sherhol14@outlook.com', ip: '134.228.218.116', ipGeo: 'Toledo, OH · Buckeye', amt: '$617.95', ship: 'Toledo, OH' },
      { ord: '1000350198', d: '05-08', st: 'fraud', email: 'grebnaiki@outlook.com', ip: '38.188.128.38', ipGeo: 'Surprise, AZ · Wyyerd', amt: '$1,311.49', ship: 'Surprise, AZ' },
      { ord: '1000350006', d: '05-07', st: 'fraud', email: 'miapia1577@gmail.com', ip: '2600:1006:b1a7…', ipGeo: 'Orlando, FL · Verizon mobile', amt: '$3,022.02', ship: 'Tallahassee, FL' },
      { ord: '1000342806', d: '05-05', st: 'fraud', email: 'levonagasian@gmail.com', ip: '174.255.221.75', ipGeo: 'Littleton, CO · Verizon mobile', amt: '$3,140.84', ship: 'Los Angeles, CA' },
      { ord: '1000341984', d: '05-04', st: 'fraud', email: 'hayktovmasyan92@gmail.com', ip: '174.255.164.78', ipGeo: 'Hillsboro, OR · Verizon mobile', amt: '$2,747.98', ship: 'Los Angeles, CA' },
      { ord: '1000337091', d: '04-29', st: 'Chargeback', email: 'rldook@yahoo.com', ip: '—', ipGeo: '—', amt: '$2,362.70', ship: 'Bennettsville, SC' },
      { ord: '1000334916', d: '04-27', st: 'Chargeback', email: '157RoseMarie@gmail.com', ip: '64.222.98.170', ipGeo: 'Biddeford, ME · Consolidated', amt: '$1,698.47', ship: 'Bedford, NH' },
      { ord: '1000333002', d: '04-24', st: 'Chargeback', email: 'foundyller@pm.me', ip: '2600:387:15…', ipGeo: 'Country Club, FL · AT&T mobile', amt: '$1,259.10', ship: 'Naples, FL' },
      { ord: '1000325523', d: '04-20', st: 'Chargeback', email: 'Julisa.caraballo@gmail.com', ip: '2607:fb90:cb0b…', ipGeo: 'El Paso, TX · T-Mobile', amt: '$1,779.81', ship: 'Anthony, NM' },
      { ord: '1000323474', d: '04-17', st: 'Chargeback', email: 'myhamsc1994@gmail.com', ip: '2601:640:cb80…', ipGeo: 'Vacaville, CA · Comcast', amt: '$1,204.54', ship: 'Vacaville, CA' },
      { ord: '1000311885', d: '04-09', st: 'Chargeback', email: 'ndobbins4556@gmail.com', ip: '—', ipGeo: '—', amt: '$6,458.67', ship: 'Pebble Beach, CA' },
      { ord: '1000310769', d: '04-08', st: 'Chargeback', email: 'mariam@safesidehomes.com', ip: '—', ipGeo: '—', amt: '$4,036.99', ship: 'Renton, WA' },
      { ord: '1000308720', d: '04-06', st: 'Chargeback', email: 'ronmassey02@gmail.com', ip: '2600:8805:538b…', ipGeo: 'IPv6 (not resolved)', amt: '$3,346.64', ship: 'Providence Forge, VA' },
      { ord: '1000305696', d: '04-03', st: 'Chargeback', email: 'dsfs4542@sbcglobal.net', ip: '35.39.117.10', ipGeo: 'San Jose, CA · Boost mobile', amt: '$764.12', ship: 'Folsom, CA' },
      { ord: '1000301040', d: '03-31', st: 'Chargeback', email: 'faithhhar_ss@outlook.com', ip: '69.248.162.61', ipGeo: 'Bloomfield, NJ · Comcast', amt: '$4,118.97', ship: 'Dunn, NC' },
      { ord: '1000291953', d: '03-28', st: 'Chargeback', email: 'taillefern758@gmail.com', ip: '2601:8c:4c80…', ipGeo: 'Rahway, NJ · Comcast', amt: '$738.51', ship: 'Linden, NJ' },
      { ord: '1000287936', d: '03-20', st: 'Chargeback', email: 'dmzemann@hotmail.com', ip: '104.237.102.169', ipGeo: 'Linn, MO · RadioWire', amt: '$8,205.66', ship: 'Linn, MO' },
      { ord: '1000284771', d: '02-20', st: 'Chargeback', email: 'dsmerrymacs@verizon.net', ip: '—', ipGeo: '—', amt: '$2,897.57', ship: 'Peabody, MA' },
      { ord: '1000284390', d: '02-18', st: 'Chargeback', email: 'darshanassociates2016@gmail.com', ip: '2600:4808:98b4…', ipGeo: 'Glen Head, NY · Cablevision', amt: '$1,011.46', ship: 'Glen Head, NY' },
      { ord: '1000284116', d: '02-16', st: 'Chargeback', email: 'rubykcailsson@outlook.com', ip: '—', ipGeo: '—', amt: '$3,752.40', ship: 'Farmington Hills, MI' },
    ],
  },
  providers: {
    intro:
      'Card payments today are spread across several providers: Authorize.Net (via the ParadoxLabs CIM module) ' +
      'carries ~88% of card volume, with Adobe Commerce Payments (PayPal / Apple Pay / Google Pay wallets) and ' +
      'Affirm / BNPL handling the rest. This is a recommendation to consolidate the card processing onto Stripe.',
    volumeNote:
      'Volume basis: ~$16.5M/yr through Authorize.Net (9,275 transactions, ~$1,814 average ticket) plus ~$1.25M/yr ' +
      'of Adobe Commerce Payments wallet volume. Figures from production order data; cost rows use published rates.',
    comparison: [
      { provider: 'Authorize.Net (current)', headline: '2.9% + $0.30 + $25/mo (list)', annual: '~$491k', note: 'Gateway only — true % is set by the acquirer behind it (unknown without the statement)', tone: 'muted' },
      { provider: 'Stripe', headline: '2.9% + $0.30, no monthly fee; interchange-plus at your volume', annual: '~$371k–$491k', note: 'Negotiable IC+ (~2.2–2.5% effective) at $16.5M/yr', tone: 'gold' },
      { provider: 'Adobe Commerce Payments', headline: '~2.9% + $0.30, no Adobe markup', annual: '~$491k', note: 'PayPal / Braintree-backed; would replace Auth.Net too', tone: 'muted' },
    ],
    caseForStripe: [
      { title: 'It directly answers the attack you just had', detail: 'Stripe Radar is machine-learning fraud scoring built into every charge — automatic card-testing detection, velocity limits, and 3-D Secure triggers. The bot wave we just blocked by hand is exactly what Radar stops automatically. Today that protection lives in Authorize.Net’s AFDS, which is under-configured.' },
      { title: 'One provider instead of five', detail: 'Cards, Apple Pay, Google Pay, and wallets are currently split across Authorize.Net CIM + Adobe Commerce Payments + others — separate dashboards, reconciliation, and support. Stripe handles cards, Apple Pay, Google Pay, Link, and ACH in a single integration with one dashboard and one settlement.' },
      { title: 'Competitive, negotiable pricing at your scale', detail: 'At ~$16.5M/yr you qualify for Stripe interchange-plus / custom pricing (~2.2–2.5% effective) with no monthly gateway fee. At list it matches Authorize.Net; negotiated, it can land roughly $70k–$120k/yr lower.' },
      { title: 'Higher approval rates = more revenue', detail: 'Stripe’s network tokens and adaptive retries typically lift card authorization rates 1–2%. On $16.5M that is real recovered revenue, not just a cost line — often outweighing the rate difference entirely.' },
      { title: 'Lower PCI scope + better disputes', detail: 'Stripe vaults the cards (shrinking your PCI footprint) and automates chargeback evidence submission. Given the chargeback trend, automated dispute handling pays for itself.' },
    ],
    considerations: [
      'Card-vault migration: ~75,000 stored Authorize.Net CIM card profiles must move to Stripe via a PCI-compliant processor-to-processor transfer. Stripe supports this, but it is a coordinated project, not a config flip.',
      'Re-integration: install and configure the official Stripe module in Adobe Commerce, test checkout across all three storefronts, and run in parallel before cutover.',
      'Exact savings require your processing statement — until the real effective rate is known, the cost rows assume published list pricing.',
    ],
    verdict:
      'Recommendation: move card processing to Stripe. At this volume the headline rate is essentially a wash, so the ' +
      'decision rides on everything else — and there Stripe wins: built-in Radar fraud protection that directly ' +
      'addresses the attack we just handled, consolidation of a fragmented payment stack into one provider, higher ' +
      'authorization rates via network tokens, and negotiable interchange-plus pricing that should land at or below ' +
      'today’s cost. The main effort is the one-time CIM card-vault migration, which Stripe is built to support.',
  },
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expected = (process.env.FRAUD_REVIEW_PIN || '').trim()
  if (!expected) return json({ error: 'Report access is not configured.' }, 500)

  let body: { pin?: string }
  try {
    body = (await request.json()) as { pin?: string }
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  const provided = (body.pin || '').trim()
  if (!provided || !safeEqual(provided, expected)) {
    return json({ error: 'Incorrect PIN.' }, 401)
  }

  return json({ ok: true, report })
}
