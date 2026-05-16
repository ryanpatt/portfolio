import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── data ──────────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'invoca' | 'criteo' | 'questions' | 'setup'

const openQuestions: {
  id: string
  module: 'Criteo' | 'Invoca' | 'CTM'
  question: string
  context: string
  action: string
}[] = [
  {
    id: 'Q1',
    module: 'Criteo',
    question: 'CSV column format',
    context: 'The Criteo Offline Conversions bulk-upload template must be obtained from the client\'s Criteo account. Log in → Conversions → Offline → Download Template. The current column set is our best guess from the public spec.',
    action: 'If the template differs, update MedMart\\Criteo\\Model\\CsvExporter::CSV_HEADERS and the corresponding writeCsv() row array.',
  },
  {
    id: 'Q2',
    module: 'Criteo',
    question: 'Match key field name',
    context: 'Criteo\'s offline upload template may call the match key field GUM ID, Criteo ID, or just UserID depending on the account type.',
    action: 'Confirm which field name and type Criteo expects.',
  },
  {
    id: 'Q3',
    module: 'Criteo',
    question: 'Email hashing',
    context: 'Current implementation SHA-256 hashes the email (lowercased, trimmed) before writing to CSV.',
    action: 'Confirm Criteo expects SHA-256 hashed email or plain-text. If plain-text is required, remove hashEmail() in CsvExporter.',
  },
  {
    id: 'Q4',
    module: 'Criteo',
    question: 'Upload automation',
    context: 'Currently the CSV is generated daily and sits at media/feeds/criteo_offline_conversions.csv for manual upload.',
    action: 'Is manual upload acceptable long-term, or should we build automated SFTP / API push? Criteo has an S2S API for offline conversions.',
  },
  {
    id: 'Q5',
    module: 'Invoca',
    question: 'Webhook payload structure',
    context: 'The webhook receiver handles both invoca_transaction_id and transaction_id as fallbacks. GCLID field assumed to be google_click_id.',
    action: 'Confirm exact JSON field names Invoca sends. Does their webhook include the Magento order_id, or only caller phone?',
  },
  {
    id: 'Q6',
    module: 'Invoca',
    question: 'Invoca JS API version',
    context: 'marketing-data.js polls for three possible APIs: window.__invocanr.getId() (Network Response tag), window.Invoca.PNAPI.getTransactionId() (Tag Manager / PNAPI), and [data-invoca-id] DOM attribute.',
    action: 'Confirm which one the installed tag exposes so we can simplify the polling logic.',
  },
  {
    id: 'Q7',
    module: 'Invoca',
    question: 'Conversion name in fallback CSV',
    context: 'The fallback CSV uses "Invoca Phone Order" as the Conversion Name column.',
    action: 'Confirm this matches the conversion action name in the Google Ads account.',
  },
  {
    id: 'Q8',
    module: 'CTM',
    question: 'Incoming webhook',
    context: 'Unknown whether CTM fires a webhook to Magento when a call comes in.',
    action: 'Does CTM fire an incoming webhook to Magento? If yes, what is the payload format and authentication method?',
  },
  {
    id: 'Q9',
    module: 'CTM',
    question: 'Tracking cookie',
    context: 'CTM likely sets a frontend cookie to tie ad clicks to phone calls, but the name is unknown.',
    action: 'What is the CTM frontend cookie name (e.g. _ctm_token)? Is it set by a JS snippet or GTM tag?',
  },
  {
    id: 'Q10',
    module: 'CTM',
    question: 'Outbound API',
    context: 'Unknown whether CTM has an endpoint where completed order data can be pushed for attribution.',
    action: 'Does CTM have an outbound API where we push completed order data? What is the endpoint URL and authentication?',
  },
  {
    id: 'Q11',
    module: 'CTM',
    question: 'GCLID source',
    context: 'Invoca supplies GCLID directly in their webhook. Unknown if CTM does the same.',
    action: 'Does CTM supply the GCLID directly in their webhook, or do we correlate it from the SwissUp google_click_id field?',
  },
  {
    id: 'Q12',
    module: 'CTM',
    question: 'Coexistence with Invoca',
    context: 'The MedMart_Invoca module is already built. CTM may be an addition or a replacement.',
    action: 'Will CTM run alongside Invoca (different phone numbers/campaigns) or replace it?',
  },
  {
    id: 'Q13',
    module: 'CTM',
    question: 'Attribution tracking flag',
    context: 'Invoca uses is_sent_to_invoca on sales_order to track push status.',
    action: 'Should we track is_sent_to_ctm on sales_order the same way as is_sent_to_invoca?',
  },
  {
    id: 'Q14',
    module: 'CTM',
    question: 'Credentials / docs',
    context: 'No CTM credentials or API documentation available yet.',
    action: 'Do you have a CTM account ID, API key, or developer documentation URL?',
  },
]

const setupChecklist: {
  module: 'Invoca' | 'Criteo'
  steps: string[]
}[] = [
  {
    module: 'Invoca',
    steps: [
      'Enter API Key in Stores → Config → Marketing → Invoca → General',
      'Enter Network ID',
      'Enter Webhook Secret (must match what Invoca is configured to send)',
      'Enable the integration',
      'Configure Invoca dashboard to POST webhooks to: https://<domain>/rest/V1/invoca/webhook',
      'Verify cron is running: bin/magento cron:run --group=invoca_push',
    ],
  },
  {
    module: 'Criteo',
    steps: [
      'Enter Account ID in Stores → Config → Marketing → Criteo',
      'Confirm Event Name matches the conversion event in your Criteo account',
      'Enable the integration',
      'Verify Criteo OneTag is firing and setting _cto_tuid or _cto_cid cookie',
      'After first cron run, manually upload media/feeds/criteo_offline_conversions.csv in Criteo UI',
      'Verify CSV columns match the template in your Criteo account (see open questions)',
    ],
  },
]

const moduleColors: Record<'Criteo' | 'Invoca' | 'CTM', string> = {
  Invoca: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Criteo: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  CTM:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
}

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function MedmartCriteoPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set())

  const toggleStep = (key: string) => {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'invoca',     label: 'MedMart_Invoca' },
    { id: 'criteo',     label: 'MedMart_Criteo' },
    { id: 'questions',  label: `Open Questions (${openQuestions.length})` },
    { id: 'setup',      label: 'Setup' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">Marketing Attribution Modules</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">Invoca · Criteo</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">
            Offline Conversion Attribution
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            Custom Magento 2 modules that capture phone-order data and push it to Invoca and Criteo
            for offline conversion attribution. Bridges the gap between admin-placed orders and
            upstream ad click data so paid media teams can measure true ROI on phone campaigns.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Modules built', value: '2', sub: 'MedMart_Invoca + MedMart_Criteo', color: 'text-gold' },
            { label: 'Cron jobs', value: '3', sub: 'push, fallback CSV, Criteo CSV', color: 'text-ink' },
            { label: 'Webhook endpoint', value: '1', sub: 'POST /V1/invoca/webhook', color: 'text-blue-400' },
            { label: 'Open questions', value: openQuestions.length.toString(), sub: 'need client answers', color: 'text-yellow-400' },
          ].map(card => (
            <div key={card.label} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className={`text-2xl font-bold font-mono mb-1 ${card.color}`}>{card.value}</div>
              <div className="text-xs font-medium text-ink mb-0.5">{card.label}</div>
              <div className="text-xs text-muted">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border-subtle overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              Phone orders placed by sales reps in the Magento admin have no ad-click cookie data — the customer called instead of clicking a checkout button. These modules reconstruct the attribution chain by matching the caller's phone number to a recent order and pushing the order value back to Invoca and Criteo.
            </p>

            {/* Architecture flow */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-6">
              <h2 className="text-sm font-semibold text-ink mb-4">Attribution Pipeline</h2>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Customer calls Invoca number',
                    detail: 'Invoca intercepts the call before routing it to the sales rep.',
                    color: 'text-blue-400',
                  },
                  {
                    step: '2',
                    title: 'Invoca fires pre-call webhook → POST /V1/invoca/webhook',
                    detail: 'Payload includes caller_id (phone), invoca_transaction_id, and optionally google_click_id and order_id. Magento validates the HMAC-SHA256 signature against the stored webhook secret.',
                    color: 'text-blue-400',
                  },
                  {
                    step: '3',
                    title: 'OrderAttributionService matches caller to order',
                    detail: 'Tries exact match by order_id first, then fuzzy match by billing telephone within a configurable time window. Writes caller_id, invoca_transaction_id, and invoca_google_click_id to SwissUp checkout fields. Sets is_sent_to_invoca = 0.',
                    color: 'text-blue-400',
                  },
                  {
                    step: '4',
                    title: 'Sales rep creates admin order',
                    detail: 'Magento admin order with remote_ip IS NULL, linked to the caller via the SwissUp fields already written.',
                    color: 'text-zinc-400',
                  },
                  {
                    step: '5',
                    title: 'Cron: PushTransactionsToInvoca (every 30 min)',
                    detail: 'Finds admin orders where is_sent_to_invoca = 0 and invoca_transaction_id is set. If GCLID present → pushes revenue + GCLID to Invoca API. If no GCLID → marks sent (fallback CSV handles it). On success: is_sent_to_invoca = 1.',
                    color: 'text-emerald-400',
                  },
                  {
                    step: '6',
                    title: 'Cron: GenerateFallbackCsv (daily 02:00 UTC)',
                    detail: 'Finds admin orders where google_click_id IS SET and invoca_google_click_id IS NULL. Exports Google Ads Offline Conversions CSV to media/feeds/invoca_adwords_fallback.csv.',
                    color: 'text-emerald-400',
                  },
                  {
                    step: '7',
                    title: 'Cron: GenerateAdminOrders / Criteo (daily 03:00 UTC)',
                    detail: 'Finds admin orders where is_sent_to_criteo IS NULL. Match key = criteo_cookie_id (preferred) or google_click_id (fallback). Exports to media/feeds/criteo_offline_conversions.csv. Sets is_sent_to_criteo = 1.',
                    color: 'text-purple-400',
                  },
                ].map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold ${s.color} border-current opacity-60`}>
                      {s.step}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className={`text-sm font-medium mb-0.5 ${s.color}`}>{s.title}</div>
                      <div className="text-xs text-muted leading-relaxed">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DB columns */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Database Columns Added</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted border-b border-border-subtle">
                    <th className="text-left pb-2 font-medium">Table</th>
                    <th className="text-left pb-2 font-medium">Column</th>
                    <th className="text-left pb-2 font-medium">Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {[
                    { table: 'sales_order', col: 'is_sent_to_invoca', values: 'NULL = not yet processed, 0 = webhook matched (pending push), 1 = pushed to API' },
                    { table: 'sales_order', col: 'is_sent_to_criteo', values: 'NULL = not yet exported, 1 = exported to CSV' },
                    { table: 'sales_order_grid', col: 'invoca_google_click_id', values: 'GCLID supplied by Invoca (may differ from ad-click GCLID)' },
                    { table: 'sales_order_grid', col: 'criteo_cookie_id', values: 'Criteo OneTag cookie value from checkout (_cto_tuid / _cto_cid)' },
                  ].map(r => (
                    <tr key={r.col} className="text-xs">
                      <td className="py-2 pr-4 font-mono text-muted">{r.table}</td>
                      <td className="py-2 pr-4 font-mono text-ink">{r.col}</td>
                      <td className="py-2 text-muted">{r.values}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SwissUp fields */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">SwissUp CheckoutFields Used</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted border-b border-border-subtle">
                    <th className="text-left pb-2 font-medium">Code</th>
                    <th className="text-left pb-2 font-medium">Description</th>
                    <th className="text-left pb-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {[
                    { code: 'caller_id', desc: 'Caller phone number from Invoca webhook', source: 'Invoca webhook payload' },
                    { code: 'invoca_transaction_id', desc: 'Invoca call/session ID', source: 'Invoca webhook / frontend JS cookie' },
                    { code: 'invoca_google_click_id', desc: 'GCLID as reported by Invoca', source: 'Invoca webhook payload' },
                    { code: 'google_click_id', desc: 'Ad-click GCLID captured at checkout', source: 'Frontend JS (existing)' },
                    { code: 'criteo_cookie_id', desc: 'Criteo OneTag cookie (_cto_tuid / _cto_cid)', source: 'checkout-fields-assigner.js' },
                  ].map(r => (
                    <tr key={r.code} className="text-xs">
                      <td className="py-2 pr-4 font-mono text-gold">{r.code}</td>
                      <td className="py-2 pr-4 text-ink">{r.desc}</td>
                      <td className="py-2 text-muted">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Invoca tab ── */}
        {tab === 'invoca' && (
          <div className="space-y-6">

            <div className="grid md:grid-cols-2 gap-4">

              {/* Admin config */}
              <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold text-ink mb-1">Admin Configuration</h2>
                <p className="text-xs text-muted mb-3">Stores → Configuration → Marketing → Invoca</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted border-b border-border-subtle">
                      <th className="text-left pb-2 font-medium">Field</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {[
                      { field: 'Enable Invoca Integration', desc: 'Master on/off switch' },
                      { field: 'API Key', desc: 'Invoca API token (encrypted at rest)' },
                      { field: 'Network ID', desc: 'Your Invoca network ID (from Invoca dashboard)' },
                      { field: 'Webhook Secret', desc: 'HMAC-SHA256 secret for validating incoming webhooks' },
                      { field: 'API Base URL', desc: 'Default: https://api.invoca.net' },
                      { field: 'Transaction Push Look-Back (hours)', desc: 'Orders to consider per cron run. Default: 24' },
                      { field: 'Fallback CSV Look-Back (hours)', desc: 'Orders to consider per cron run. Default: 48' },
                    ].map(r => (
                      <tr key={r.field}>
                        <td className="py-2 pr-3 font-medium text-ink">{r.field}</td>
                        <td className="py-2 text-muted">{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cron jobs */}
              <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold text-ink mb-3">Cron Jobs</h2>
                <div className="space-y-3">
                  {[
                    {
                      job: 'medmart_invoca_push_transactions',
                      schedule: '*/30 * * * *',
                      desc: 'Pushes pending admin orders to Invoca API. Sets is_sent_to_invoca = 1 on success.',
                      cmd: 'bin/magento cron:run --group=invoca_push',
                    },
                    {
                      job: 'medmart_invoca_fallback_csv',
                      schedule: '0 2 * * *',
                      desc: 'Generates Google Ads Offline Conversions CSV for orders without Invoca GCLID.',
                      cmd: 'bin/magento cron:run --group=invoca_fallback',
                    },
                  ].map(c => (
                    <div key={c.job} className="border border-border-subtle rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-ink">{c.job}</span>
                        <span className="text-xs font-mono text-gold">{c.schedule}</span>
                      </div>
                      <p className="text-xs text-muted mb-2">{c.desc}</p>
                      <div className="bg-zinc-900 rounded px-2.5 py-1.5 font-mono text-xs text-zinc-300">{c.cmd}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Webhook endpoint */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Webhook Endpoint</h2>
              <div className="bg-zinc-900 rounded-md p-4 font-mono text-xs text-zinc-300 space-y-1 mb-4">
                <p><span className="text-zinc-500">POST</span> https://app.medmartonline.com/rest/V1/invoca/webhook</p>
                <p><span className="text-zinc-500">Authorization:</span> none (secured by HMAC header)</p>
                <p><span className="text-zinc-500">Content-Type:</span> application/json</p>
                <p><span className="text-zinc-500">X-Invoca-Signature:</span> &lt;hmac-sha256 of JSON body using webhook_secret&gt;</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-border-subtle">
                    <th className="text-left pb-2 font-medium">Field</th>
                    <th className="text-left pb-2 font-medium">Required</th>
                    <th className="text-left pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {[
                    { field: 'caller_id', req: true, notes: "Caller's phone number" },
                    { field: 'invoca_transaction_id / transaction_id', req: true, notes: 'Invoca-assigned call ID (both accepted as fallback)' },
                    { field: 'google_click_id', req: false, notes: "GCLID from Invoca's attribution data" },
                    { field: 'order_id', req: false, notes: 'Magento order increment ID for exact match' },
                  ].map(r => (
                    <tr key={r.field}>
                      <td className="py-2 pr-3 font-mono text-gold">{r.field}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs font-semibold ${r.req ? 'text-red-400' : 'text-zinc-500'}`}>
                          {r.req ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2 text-muted">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fallback CSV */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-1">Fallback CSV</h2>
              <p className="text-xs text-muted mb-3">
                Output: <span className="font-mono text-ink">media/feeds/invoca_adwords_fallback.csv</span>
                &nbsp;— Google Ads Offline Conversions format. Upload at: Google Ads → Tools → Conversions → Upload.
              </p>
              <div className="bg-zinc-900 rounded-md p-4 font-mono text-xs text-zinc-300 space-y-1">
                <p className="text-zinc-500">### INSTRUCTIONS ###</p>
                <p>Parameters:TimeZone=+0000</p>
                <p>Google Click ID,Conversion Name,Attributed Credit,Conversion Time,Conversion Value,Conversion Currency</p>
              </div>
            </div>

            {/* Frontend JS */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Frontend JavaScript</h2>
              <div className="space-y-4">
                {[
                  {
                    file: 'marketing-data.js',
                    desc: 'Loaded on every page via default.xml layout. Polls for the Invoca JS tag on every page load. When the tag fires, reads the transaction ID via window.__invocanr.getId() or window.Invoca.PNAPI.getTransactionId() and stores it in cookie _invoca_txn_id (1-day expiry).',
                  },
                  {
                    file: 'recently-data.js',
                    desc: 'RequireJS mixin on MedMart_Base/js/model/checkout-fields-assigner. At the checkout payment step, reads the _invoca_txn_id cookie and adds invoca_transaction_id to the order\'s extension_attributes.base_fields before the order API call is made.',
                  },
                ].map(f => (
                  <div key={f.file} className="flex gap-3">
                    <span className="shrink-0 font-mono text-xs text-gold mt-0.5">→</span>
                    <div>
                      <span className="text-sm font-medium text-ink">{f.file}</span>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Criteo tab ── */}
        {tab === 'criteo' && (
          <div className="space-y-6">

            <div className="grid md:grid-cols-2 gap-4">

              {/* Admin config */}
              <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold text-ink mb-1">Admin Configuration</h2>
                <p className="text-xs text-muted mb-3">Stores → Configuration → Marketing → Criteo</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted border-b border-border-subtle">
                      <th className="text-left pb-2 font-medium">Field</th>
                      <th className="text-left pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {[
                      { field: 'Enable Criteo Integration', desc: 'Master on/off switch' },
                      { field: 'Account ID', desc: 'Criteo advertiser/account ID' },
                      { field: 'Event Name', desc: 'Conversion event name. Default: purchase' },
                      { field: 'Cron Look-Back (hours)', desc: 'Orders to consider per run. Default: 48' },
                      { field: 'Cookie Field Code', desc: 'SwissUp attribute code for Criteo cookie. Default: criteo_cookie_id' },
                    ].map(r => (
                      <tr key={r.field}>
                        <td className="py-2 pr-3 font-medium text-ink">{r.field}</td>
                        <td className="py-2 text-muted">{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cron job */}
              <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                <h2 className="text-sm font-semibold text-ink mb-3">Cron Job</h2>
                <div className="border border-border-subtle rounded-md p-3 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-ink">medmart_criteo_generate_admin_orders</span>
                    <span className="text-xs font-mono text-gold">0 3 * * *</span>
                  </div>
                  <p className="text-xs text-muted mb-2">Exports admin orders to Criteo offline conversions CSV daily at 03:00 UTC.</p>
                  <div className="bg-zinc-900 rounded px-2.5 py-1.5 font-mono text-xs text-zinc-300">bin/magento cron:run --group=criteo</div>
                </div>

                <h2 className="text-sm font-semibold text-ink mb-2">Match Key Priority</h2>
                <div className="space-y-2 text-xs text-muted">
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-mono shrink-0">1.</span>
                    <span><span className="font-mono text-ink">criteo_cookie_id</span> — SwissUp field, captured from <span className="font-mono">_cto_tuid</span> / <span className="font-mono">_cto_cid</span> cookie at checkout (preferred)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-mono shrink-0">2.</span>
                    <span><span className="font-mono text-ink">google_click_id</span> — fallback if no Criteo cookie was set</span>
                  </div>
                  <p className="text-zinc-600 mt-2">Orders with neither match key are excluded from the export.</p>
                </div>
              </div>
            </div>

            {/* CSV format */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-sm font-semibold text-ink">CSV Format</h2>
                <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full shrink-0">⚠ Verify columns</span>
              </div>
              <p className="text-xs text-muted mb-3">
                Output: <span className="font-mono text-ink">media/feeds/criteo_offline_conversions.csv</span>.
                Column names below are based on the standard Criteo Offline Conversions bulk-upload spec.
                <strong className="text-yellow-400"> Confirm against the actual template in the client's Criteo account before running in production.</strong>
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-border-subtle">
                    <th className="text-left pb-2 font-medium">Column</th>
                    <th className="text-left pb-2 font-medium">Source</th>
                    <th className="text-left pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {[
                    { col: 'TransactionID', source: 'sales_order.increment_id', notes: 'Magento order number' },
                    { col: 'EventType', source: 'Admin config event_name', notes: 'e.g. purchase' },
                    { col: 'TransactionAmount', source: 'sales_order.base_grand_total', notes: '2 decimal places' },
                    { col: 'Currency', source: 'sales_order.base_currency_code', notes: 'ISO 4217' },
                    { col: 'Email', source: 'sales_order.customer_email', notes: 'SHA-256 hashed (lowercased, trimmed)' },
                    { col: 'MatchKey', source: 'Criteo cookie ID or GCLID', notes: 'See match priority above' },
                    { col: 'MatchType', source: 'Derived', notes: '"criteo_cookie" or "gclid"' },
                    { col: 'OrderDate', source: 'sales_order.created_at', notes: 'UTC timestamp' },
                  ].map(r => (
                    <tr key={r.col}>
                      <td className="py-2 pr-3 font-mono text-purple-400">{r.col}</td>
                      <td className="py-2 pr-3 text-muted">{r.source}</td>
                      <td className="py-2 text-muted">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cookie capture */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Criteo Cookie Capture</h2>
              <p className="text-xs text-muted leading-relaxed mb-3">
                The Criteo OneTag cookie is read by <span className="font-mono text-ink">MedMart_Base/js/model/checkout-fields-assigner.js</span> at the checkout payment step and sent as <span className="font-mono text-ink">criteo_cookie_id</span> in the checkout extension attributes. The SwissUp persistence layer saves it to <span className="font-mono">swissup_checkoutfields_values</span>.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">Cookie names checked (in order):</span>
                <span className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">_cto_tuid</span>
                <span className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">_cto_cid</span>
              </div>
            </div>

          </div>
        )}

        {/* ── Questions tab ── */}
        {tab === 'questions' && (
          <div className="space-y-6">
            <p className="text-sm text-muted leading-relaxed">
              These questions must be answered by the client before the integration can be fully validated or the CTM module scoped. Each is tagged by the affected module.
            </p>

            {(['Criteo', 'Invoca', 'CTM'] as const).map(mod => {
              const qs = openQuestions.filter(q => q.module === mod)
              return (
                <div key={mod}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-4 ${moduleColors[mod]}`}>
                    {mod === 'CTM' ? 'CTM — Future Module' : `MedMart_${mod}`}
                  </div>
                  <div className="space-y-3">
                    {qs.map(q => (
                      <div key={q.id} className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs text-muted shrink-0 mt-0.5">{q.id}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-ink mb-2">{q.question}</h3>
                            <p className="text-xs text-muted leading-relaxed mb-3">{q.context}</p>
                            <div className="bg-white/[0.04] rounded-md px-3 py-2">
                              <span className="text-xs font-semibold text-gold mr-2">Action:</span>
                              <span className="text-xs text-ink/80">{q.action}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Setup tab ── */}
        {tab === 'setup' && (
          <div className="space-y-6">
            <p className="text-sm text-muted">
              Step-by-step activation checklist per environment. Check off steps as you go — state is saved in this browser session.
            </p>

            {setupChecklist.map(section => {
              const done = section.steps.filter((_, i) => checkedSteps.has(`${section.module}-${i}`)).length
              return (
                <div key={section.module} className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${moduleColors[section.module]}`}>
                      MedMart_{section.module}
                    </div>
                    <span className="text-xs text-muted font-mono">{done}/{section.steps.length} complete</span>
                  </div>
                  <div className="space-y-2">
                    {section.steps.map((step, i) => {
                      const key = `${section.module}-${i}`
                      const checked = checkedSteps.has(key)
                      return (
                        <button
                          key={key}
                          onClick={() => toggleStep(key)}
                          className="w-full flex items-start gap-3 text-left group"
                        >
                          <div className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            checked
                              ? 'bg-gold border-gold'
                              : 'border-border-subtle group-hover:border-muted'
                          }`}>
                            {checked && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-bg">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm leading-relaxed transition-colors ${
                            checked ? 'text-muted line-through' : 'text-ink group-hover:text-ink'
                          }`}>
                            {step}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Verification commands */}
            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h2 className="text-sm font-semibold text-ink mb-3">Verification Commands</h2>
              <div className="bg-zinc-900 rounded-md p-4 font-mono text-xs text-zinc-300 space-y-4">
                <div>
                  <p className="text-zinc-500 mb-1"># Confirm DB columns exist after setup:upgrade</p>
                  <p>{"bin/magento db:query \"SHOW COLUMNS FROM sales_order LIKE 'is_sent_to%';\""}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1"># Test Invoca webhook (replace SECRET and ORDER_ID)</p>
                  <p>{"curl -X POST https://app.medmartonline.com/rest/V1/invoca/webhook \\"}</p>
                  <p>{"  -H 'Content-Type: application/json' \\"}</p>
                  <p>{"  -H 'X-Invoca-Signature: <hmac>' \\"}</p>
                  <p>{"  -d '{\"caller_id\":\"+15551234567\",\"transaction_id\":\"test-123\",\"order_id\":\"100012345\"}'"}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1"># Run Invoca push cron manually</p>
                  <p>bin/magento cron:run --group=invoca_push</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1"># Run fallback CSV cron manually</p>
                  <p>bin/magento cron:run --group=invoca_fallback</p>
                  <p className="text-zinc-500 mt-1"># Then check the file was written</p>
                  <p>ls -la pub/media/feeds/invoca_adwords_fallback.csv</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1"># Run Criteo cron manually</p>
                  <p>bin/magento cron:run --group=criteo</p>
                  <p className="text-zinc-500 mt-1"># Then check the file was written</p>
                  <p>ls -la pub/media/feeds/criteo_offline_conversions.csv</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1"># Confirm SwissUp criteo_cookie_id field exists</p>
                  <p>{"bin/magento db:query \"SELECT field_id, attribute_code, is_active FROM swissup_checkoutfields_field WHERE attribute_code = 'criteo_cookie_id';\""}</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
