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
    { label: 'Lost or at risk (8 weeks)', value: '~$30,700', sub: 'vs ~$7k/mo normal', color: 'red' },
    { label: 'Chargebacks in April',      value: '9',         sub: '$22,911 — about 3× normal', color: 'orange' },
    { label: 'Orders to verify now',      value: '4',         sub: '$7,818 already charged', color: 'gold' },
    { label: 'Bot card tests blocked',    value: '200+',      sub: 'all declined — 0 succeeded', color: 'emerald' },
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
    { period: 'April 2026', what: '9 chargebacks — confirmed losses', amount: '$22,911', tone: 'orange' },
    { period: 'May 2026', what: '10 orders flagged as fraud — 4 already charged', amount: '$7,818 at risk', tone: 'gold' },
  ],
  moneyNote:
    'The 6 other May orders ($7,597) were caught before any money changed hands. Total lost or at risk over the ' +
    'last 8 weeks is roughly $30,700, against a normal run-rate of about $7,000 per month.',
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
    'Each item above maps to a concrete change in either the website edge (Fastly), the store admin (reCAPTCHA), ' +
    'or the Authorize.Net dashboard. Any production change is staged and reviewed before going live.',
  attacker: [
    ['Source', 'One data-center address — 94.72.160.10 (HostVenom). Not a real shopper.'],
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
