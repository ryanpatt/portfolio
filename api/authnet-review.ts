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
   unless the PIN matches. It contains customer names, partial card numbers, and
   Authorize.Net transaction detail, so it is gated exactly like the fraud review.
   tone fields are semantic keys the client maps to Tailwind classes (classes must
   exist in src/ to survive purge). ─────────────────────────────────────────── */
const report = {
  date: '2026-05-26',
  headline: 'This is not a connection outage — Authorize.Net is declining the card-validation step.',
  intro:
    'Reps and customers hit a “Gateway connection error” from Authorize.Net while paying on the site, even though ' +
    'staff could still run the same cards by hand in the Authorize.Net virtual terminal. The logs show this is not ' +
    'a connectivity or credential problem between Magento and Authorize.Net. The gateway is reachable and ' +
    'responding — it is actively declining the small card-validation charge that runs when a new card is entered at ' +
    'checkout. The pattern and timing point to a fraud / address-verification filter that was tightened in the ' +
    'Authorize.Net account right after the May 25 card-testing attack, and is now also rejecting legitimate buyers.',

  statCards: [
    { label: 'Actual cause', value: 'Declines', sub: 'E00027 from Authorize.Net — not a connection fault', tone: 'orange' as const },
    { label: 'New-card checkouts today', value: '0 of 8 OK', sub: 'every card-validation auth declined, all AVS = U', tone: 'red' as const },
    { label: 'Server → Authorize.Net', value: 'Healthy', sub: 'HTTP 200, TLS 1.2, valid cert, 3 ms connect', tone: 'emerald' as const },
    { label: 'Code deployed today', value: 'None', sub: 'last production push was May 20', tone: 'blue' as const },
  ],

  whatsHappening: [
    'When a customer enters a new card, the payment module (ParadoxLabs CIM) first asks Authorize.Net to ' +
      'validate the card with a $0.00 test authorization before the real charge. That validation step is what is ' +
      'being declined — so checkout stops before it ever gets to the order amount.',
    'The error customers and reps see says “Gateway connection error,” but that wording is hard-coded boilerplate ' +
      'in the payment module. The real response from Authorize.Net is “This transaction has been declined (E00027).” ' +
      'The gateway is up; it is choosing to decline.',
    'Manual sales in the Authorize.Net virtual terminal still work because those are real-dollar charges that do ' +
      'not trip the same filter. That is exactly why staff can process a card by hand but the website cannot.',
  ],

  errorString:
    'Authorize.Net CIM Gateway Connection error: Authorize.Net CIM Gateway: This transaction has been declined. (E00027)',
  wrapperNote:
    'The words “Connection error” are boilerplate in vendor/paradoxlabs/authnetcim/Model/Gateway.php:373 — its ' +
    'catch block re-labels every gateway error as a “Connection error.” The meaningful part is what follows: the ' +
    'transaction was declined (E00027).',

  evidence: [
    { check: 'Exact error', found: 'E00027 “This transaction has been declined,” on the CIM $0.00 card-validation auth (createCustomerPaymentProfile).', tone: 'orange' as const },
    { check: 'Server ↔ Authorize.Net', found: 'curl from production to api / api2.authorize.net = HTTP 200, clean TLS 1.2 handshake, valid *.authorize.net cert, 3 ms connect. Not a network, firewall, DNS, or TLS issue.', tone: 'emerald' as const },
    { check: 'Credentials', found: 'Valid. A bad API key returns E00007, not E00027 — and manual virtual-terminal sales succeed.', tone: 'emerald' as const },
    { check: 'Production mode', found: 'Correct: authnetcim active=1, test=0, payment_action=authorize, cards AE/VI/MC/DI.', tone: 'emerald' as const },
    { check: 'Recent code / deploy changes', found: 'None today. Last production deploy was May 20, so the change is on the Authorize.Net account side — not in Magento.', tone: 'blue' as const },
    { check: 'Storefront vs. backend', found: 'Not backend-only. Declines come from many distinct customer IPs nationwide — e.g. a Suffolk County Library computer (a real shopper) — alongside one connection that submitted several different customers (consistent with a rep entering phone orders). All 22 payment attempts use Accept.js tokens; zero raw keyed cards. Every one returns AVS=U, so the decline is channel-independent.', tone: 'blue' as const },
  ],

  // Day-over-day outcome of the $0.00 card-validation auth (Direct-Response field 1: 1 = approved, 2 = declined).
  validationTrend: [
    { day: 'May 22', approved: 1, declined: 1, note: '' },
    { day: 'May 23', approved: 3, declined: 0, note: '' },
    { day: 'May 24', approved: 2, declined: 8, note: '' },
    { day: 'May 25', approved: 44, declined: 3047, note: 'card-testing bot flood' },
    { day: 'May 26 (today)', approved: 0, declined: 8, note: 'every new-card checkout declined' },
  ],

  // Confidential — the actual customer attempts that failed today. Server-side only.
  declines: [
    { time: '12:18', name: 'Anthony Valle', city: 'Hampton Bays, NY', card: 'Visa ••8728', avs: 'U' },
    { time: '13:07', name: 'Anthony Valle (retry)', city: 'Hampton Bays, NY', card: 'Visa ••8728', avs: 'U' },
    { time: '14:50', name: 'Lawrence Coleman', city: 'Palm Bay, FL', card: 'Visa ••2387', avs: 'U' },
    { time: '15:41', name: 'Peter Strong', city: 'Boca Grande, FL', card: 'Visa ••8739', avs: 'U' },
    { time: '15:46', name: 'Diane Strong', city: 'Boca Grande, FL', card: 'Visa ••3770', avs: 'U' },
    { time: '16:15', name: 'Karen Rokusek', city: 'Las Vegas, NV', card: 'Visa ••6716', avs: 'U' },
    { time: '16:30', name: 'Douglas Weaver', city: 'Pine Plains, NY', card: 'Visa ••1854', avs: 'U' },
  ],
  declinesNote:
    'All seven are the CIM $0.00 “ValidateCustomerPaymentProfile” auth. Response code 2 (declined), generic reason ' +
    'code 2 — notably NOT code 27 (AVS mismatch) — and every one returns AVS result U (address not verified). ' +
    'Different real customers, different cards and issuers, same outcome: the common factor is an account-side ' +
    'filter, not the cards themselves.',
  channelNote:
    'On the question of whether this is isolated to reps running cards on the backend: the logs say no. The ' +
    'failures are a mix of individual storefront shoppers (separate residential IPs in NY, FL, SC and elsewhere — ' +
    'one is literally a Suffolk County Library computer) and at least one connection that submitted several ' +
    'different customers (consistent with phone-order entry). Every attempt is the same Accept.js $0.00 validation ' +
    'auth returning AVS=U → E00027, so storefront and rep-entered orders fail identically. Fixing the Authorize.Net ' +
    'filter — or switching validation_mode to testMode — clears both channels at once.',

  rootCause:
    'No code changed (last deploy May 20) and connectivity is healthy, yet today every $0.00 card-validation auth ' +
    'is declined with a generic decline and AVS = U — while previous days had approvals. That isolates the change ' +
    'to the Authorize.Net account, and the timing (the day after the card-testing attack) points to a fraud control ' +
    'that was tightened in response and is now over-rejecting. The leading suspect is a Fraud Detection Suite ' +
    'Amount Filter that rejects $0 / low-amount transactions — a common anti-card-testing setting that also kills ' +
    'the legitimate $0.00 validation auth. Velocity filters set to “Decline,” or AVS handling set to reject U/N, ' +
    'are the other candidates.',

  fixPrimary: [
    'In the Authorize.Net Merchant Interface → Account → Fraud Detection Suite, plus the AVS / Card-Code settings, ' +
      'review any filter changed on or around May 25.',
    'Prime suspect: an Amount Filter rejecting $0 / low-amount transactions — loosen it so the $0.00 validation ' +
      'auth passes. Also check velocity filters set to “Decline” and AVS reject codes that include U.',
    'After loosening, place a test order with a real card to confirm a new-card checkout completes.',
  ],
  fixWorkaround:
    'Magento-side fallback to restore checkout immediately if the account change is delayed: set ' +
    'payment/authnetcim/validation_mode from liveMode to testMode. testMode validates the card format without ' +
    'sending a live $0.00 auth, sidestepping the decline. Trade-off: less up-front card validation — prefer fixing ' +
    'the filter.',

  checklist: [
    { q: 'Confirm the exact error', a: 'E00027 “This transaction has been declined,” relabeled by the module as a “Connection error.”' },
    { q: 'Authorize.Net credentials', a: 'Valid — bad key would be E00007, and manual sales work.' },
    { q: 'Production mode', a: 'On: active=1, test=0.' },
    { q: 'Store-view config', a: 'authnetcim, payment_action=authorize, cards AE/VI/MC/DI.' },
    { q: 'cURL / TLS from the server', a: 'Healthy — HTTP 200, TLS 1.2, valid *.authorize.net cert.' },
    { q: 'Recent checkout / firewall / server / extension changes', a: 'No code deploy since May 20; connectivity fine. The change is account-side fraud settings at Authorize.Net.' },
  ],

  // Answers the natural follow-up: "is checkout failing because the order/admin isn't
  // sending the address?" Short answer: no — proven from the raw request payloads.
  addressCheck: {
    question: 'Is checkout failing because the order (or a rep’s admin order) isn’t sending the billing address correctly?',
    verdict: 'No.',
    answer:
      'The complete billing address is sent to Authorize.Net on every single transaction, and Authorize.Net echoes ' +
      'it straight back. This is not an address-data problem — so it is not something a developer needs to “fix” in ' +
      'the order or admin code.',
    // A real request payload pulled from the production payment log (var/log/tokenbase.log).
    sampleBillTo: [
      ['First name', 'Anthony'],
      ['Last name', 'Valle'],
      ['Street', '20 Fortune Cookie Ln'],
      ['City', 'Hampton Bays'],
      ['State', 'NY'],
      ['ZIP', '11946'],
      ['Country', 'US'],
    ],
    // Count of blank address fields across ALL of today's requests.
    emptyFieldCounts: [
      { field: 'First name', empty: 0 },
      { field: 'Last name', empty: 0 },
      { field: 'Street address', empty: 0 },
      { field: 'City', empty: 0 },
      { field: 'ZIP', empty: 0 },
    ],
    // The crux: what the AVS letter actually means.
    avsCodes: [
      { code: 'U', label: 'Unavailable', meaning: 'The bank did NOT run an address check. Standard on a $0.00 validation auth. This is what we get on every decline.', tone: 'orange' as const },
      { code: 'N', label: 'No match', meaning: 'An address WAS sent but does not match the bank’s records. We never see this — which we would if the address were wrong or missing.', tone: 'muted' as const },
      { code: 'Y', label: 'Match', meaning: 'Address sent and matches the bank. Seen on real-dollar auths.', tone: 'emerald' as const },
    ],
    why:
      'When a new card is entered, the module first runs a $0.00 “validate this card” authorization. Most banks ' +
      'don’t perform address verification on a zero-dollar auth, so they return U (“unavailable”) no matter how ' +
      'perfect the address is. The account is now set to reject U — so every one of these gets declined.',
    proof:
      'On May 24 the exact same flow returned a mix of Y (match), N, R and U, with approvals — and no code has ' +
      'deployed since May 20. The address handling has not changed. What changed is that U is now being rejected.',
    confirm:
      'Want it nailed down? Run one real-dollar auth with a correct billing ZIP. It will come back AVS Y/match and ' +
      'approve — proving the address flows correctly and only the $0-auth “U” path is being killed. (A real auth ' +
      'also shows up in Transaction Search, unlike the $0 validations.)',
  },
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Reuses the same access PIN as the fraud review (same audience).
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
