import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── data ──────────────────────────────────────────────────────────────── */

type ScriptEntry = {
  name: string
  domain: string
  method: string
  pages: string
  status: string
  priority: string
  detail?: {
    purpose: string
    verify: string[]
    consoleCheck?: string
    risk: string
    disable: string
  }
}

const scriptInventory: ScriptEntry[] = [
  { name: 'Google Tag Manager', domain: 'googletagmanager.com', method: 'Layout XML / phtml', pages: 'All', status: 'active', priority: 'critical' },
  {
    name: 'GA4 (Measurement Protocol cron)', domain: 'google-analytics.com', method: 'PHP cron / API', pages: 'Server-side', status: 'suspect', priority: 'critical',
    detail: {
      purpose: 'Custom Magento module (MedMart_GoogleTagManager) that runs a PHP cron every 5 minutes to push completed orders directly to GA4 via the Measurement Protocol API. Designed to capture server-side order data that client-side GTM might miss (e.g. if the user closes the tab before the success page loads).',
      verify: [
        'SSH to server: magento-cloud ssh -p tin2rimoygcaq -e staging',
        'tail -f var/log/googleTagManager.log — look for 200 responses or error codes',
        'Run: SELECT COUNT(*) FROM sales_order WHERE is_sent_to_google_analytics=0 AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR); — should return 0',
        'In GA4 → DebugView, trigger a test order and watch for a "purchase" event arriving within 5 min',
      ],
      consoleCheck: '// No browser check — this is server-side. Check via SSH log above.',
      risk: 'If the GA4 API secret has expired or the Measurement Protocol payload format has drifted from the current GA4 spec, every order silently fails to track. You\'d see $0 revenue or missing transactions in GA4 reports with no frontend error. The sales_order table tracks this via is_sent_to_google_analytics but there\'s no alerting if rows pile up.',
      disable: 'Disable the cron group in Magento: bin/magento cron:remove --group=medmart_gtm (or comment out the cron XML in the module). Verify no duplicate purchase events appear in GA4 if client-side GTM is also sending purchase events.',
    },
  },
  { name: 'Facebook Pixel', domain: 'connect.facebook.net', method: 'Layout XML / phtml', pages: 'All', status: 'active', priority: 'high' },
  { name: 'Klaviyo', domain: 'static.klaviyo.com', method: 'Partytown worker', pages: 'All', status: 'active', priority: 'high' },
  { name: 'Klevu Search', domain: 'klevu.com / ksearchnet.com', method: 'Lazy (interaction)', pages: 'All (lazy)', status: 'active', priority: 'medium' },
  { name: 'AdRoll', domain: 's.adroll.com', method: 'Lazy (interaction)', pages: 'All (lazy)', status: 'active', priority: 'medium' },
  { name: 'SteelHouse Pixel', domain: 'dx.steelhousemedia.com', method: 'Layout XML / phtml', pages: 'Order success only', status: 'active', priority: 'medium' },
  { name: 'Trustpilot Reviews', domain: 'trustpilot.com', method: 'Layout XML / phtml', pages: 'All', status: 'active', priority: 'low' },
  { name: 'Bread Finance', domain: 'getbread.com', method: 'Module', pages: 'Product / Checkout', status: 'active', priority: 'medium' },
  { name: 'Microsoft Clarity', domain: 'clarity.ms', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'low' },
  { name: 'Hotjar', domain: 'hotjar.com', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'low' },
  {
    name: 'Convert.com (A/B)', domain: 'convertexperiments.com', method: 'GTM (likely)', pages: 'All', status: 'suspect', priority: 'high',
    detail: {
      purpose: 'A/B testing and multivariate testing platform. Injects JavaScript that can modify DOM elements, redirect users to variant URLs, show/hide content, and change styles — all controlled from the Convert.com dashboard without code deploys.',
      verify: [
        'GTM Preview → connect to medmartonline.com → look for any tag with "Convert" in the name',
        'DevTools Network tab → filter by "convertexperiments" → reload page and check for requests',
        'DevTools Console: type window._conv_q or window.convert — truthy = script loaded',
      ],
      consoleCheck: 'window._conv_q',
      risk: 'DOM mutations injected by Convert can corrupt Hyva\'s Alpine.js reactive data bindings — Alpine tracks DOM state internally and external mutations cause desync, silently breaking add-to-cart, qty updates, and checkout steps. Running simultaneously with VWO, Omniconvert, Yieldify, and Mida means 5 tools are competing to mutate the same DOM nodes. Test data from any single tool is also invalidated — you can\'t attribute a conversion lift to one tool when 4 others are running.',
      disable: 'Pause all Convert tags in GTM Preview for testing. To permanently disable: GTM → find Convert tag → unpublish or set trigger to "Never". Contact Convert.com account team to pause active experiments before removing.',
    },
  },
  {
    name: 'VWO (A/B)', domain: 'visualwebsiteoptimizer.com', method: 'GTM (likely)', pages: 'All', status: 'suspect', priority: 'high',
    detail: {
      purpose: 'Visual Website Optimizer — A/B testing, multivariate testing, heatmaps, session recordings, and funnel analysis. The VWO script (~100KB+) typically loads synchronously in the <head> to prevent flicker on page variants, which blocks rendering until it resolves.',
      verify: [
        'GTM Preview → look for VWO or "Visual Website Optimizer" tag',
        'DevTools Network → filter "visualwebsiteoptimizer" or "vwo" → check on page load',
        'DevTools Console: type window._vwo_code — truthy = script loaded and initialized',
      ],
      consoleCheck: 'window._vwo_code',
      risk: 'VWO\'s synchronous head loading adds render-blocking time (typically 200–600ms) before anything paints — directly tanks Core Web Vitals LCP and TBT. On Hyva, VWO\'s DOM mutations on checkout elements trigger Alpine.js errors that can break the reactive checkout state machine. If running alongside Convert/Omniconvert, the tools\' variant logic may conflict (one tool shows variant A while another shows variant B on the same element).',
      disable: 'Pause VWO tag in GTM. In VWO dashboard: Campaigns → pause all active campaigns before removing the tag to avoid showing broken half-loaded variants. Check Lighthouse TBT score before and after to measure render-blocking impact.',
    },
  },
  {
    name: 'Omniconvert (A/B)', domain: 'omniconvert.com', method: 'GTM (likely)', pages: 'All', status: 'suspect', priority: 'high',
    detail: {
      purpose: 'A/B testing, personalization, web surveys, and NPS tools. Similar to Convert/VWO — injects JS to modify page variants and display overlays. Also includes on-site survey popups and exit-intent forms.',
      verify: [
        'GTM Preview → look for Omniconvert tag',
        'DevTools Network → filter "omniconvert" on page load',
        'DevTools Console: type window.omniconvert or window._ocp — truthy = loaded',
      ],
      consoleCheck: 'window.omniconvert',
      risk: 'Third simultaneous A/B tool on the same pages. Its survey and overlay popups can interrupt the checkout flow by hijacking focus or pushing content down (CLS). Any test results are statistically meaningless when 4 other tools are simultaneously changing the same pages. DOM mutations risk the same Alpine.js breakage as Convert and VWO.',
      disable: 'Pause tag in GTM. Log into Omniconvert dashboard and deactivate all running experiments before removing to avoid partial experiment states being shown to users.',
    },
  },
  {
    name: 'Yieldify', domain: 'yieldify.com', method: 'GTM (likely)', pages: 'All', status: 'suspect', priority: 'high',
    detail: {
      purpose: 'Behavioral personalization platform focused on overlays and triggered campaigns: exit-intent popups, basket abandonment overlays, welcome banners, and personalized product recommendations displayed as overlay widgets.',
      verify: [
        'GTM Preview → look for Yieldify tag',
        'DevTools Network → filter "yieldify" on page load',
        'DevTools Console: type window.yieldify — truthy = loaded',
        'Check for overlay div elements injected into <body> (inspect DOM for yieldify- prefixed IDs)',
      ],
      consoleCheck: 'window.yieldify',
      risk: 'Exit-intent and overlay popups inject full DOM subtrees into the page body. On Hyva checkout, if an overlay fires while a user is filling in address fields, the injected overlay can steal keyboard focus and break Alpine\'s form reactivity. Basket abandonment overlays that fire on /checkout can directly interrupt the purchase flow and increase drop-off. Also causes Cumulative Layout Shift (CLS) failures when banners push content down after paint.',
      disable: 'Pause tag in GTM. In Yieldify dashboard, pause all active campaigns. Remove the GTM tag once confirmed paused. Measure CLS score before and after in PageSpeed Insights.',
    },
  },
  {
    name: 'Mida (A/B)', domain: 'mida.so', method: 'GTM (likely)', pages: 'All', status: 'suspect', priority: 'high',
    detail: {
      purpose: 'Newer no-code A/B testing and experimentation platform. Designed to let non-technical teams create and launch experiments without developer involvement. Injects JS to modify DOM elements based on experiment configurations stored on Mida\'s servers.',
      verify: [
        'GTM Preview → look for Mida tag',
        'DevTools Network → filter "mida.so" on page load',
        'DevTools Console: type window.mida — truthy = loaded',
      ],
      consoleCheck: 'window.mida',
      risk: 'Fifth simultaneous A/B tool. At this point any experiment data from any of the 5 tools is statistically invalid — cross-contamination between experiments makes it impossible to isolate what caused a conversion change. Mida\'s DOM mutations carry the same Alpine.js desync risk on Hyva checkout. Being a newer platform, its Magento/Hyva compatibility is less tested than VWO or Convert.',
      disable: 'Pause tag in GTM. Log into mida.so and pause active experiments. This is the lowest-risk tool to consolidate away from — its functionality overlaps entirely with the other 4 tools already running.',
    },
  },
  { name: 'Criteo', domain: 'criteo.com', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'medium' },
  { name: 'AdRoll Retargeting', domain: 'adroll.com', method: 'phtml', pages: 'All', status: 'active', priority: 'medium' },
  { name: 'Pinterest Tag', domain: 'ct.pinterest.com', method: 'GTM (likely)', pages: 'Checkout', status: 'unverified', priority: 'medium' },
  { name: 'Zendesk / Zopim Chat', domain: 'zendesk.com / zopim.com', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'low' },
  { name: 'Signifyd (Fraud)', domain: 'signifyd.com', method: 'Module', pages: 'Checkout', status: 'active', priority: 'low' },
  { name: 'Cometly Attribution', domain: 'cometlytrack.com', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'medium' },
  { name: 'New Relic APM', domain: 'nr-data.net', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'low' },
  { name: 'Attentive Mobile', domain: 'attentivemobile.com', method: 'GTM (likely)', pages: 'All', status: 'unverified', priority: 'medium' },
]

const gmcChecks = [
  { label: 'RocketWeb feed URL accessible', status: 'todo', note: 'Retrieve from Stores → RocketWeb → Shopping Feeds admin' },
  { label: 'Feed price matches live page price (sample 20 SKUs)', status: 'todo', note: 'Tax-included vs excluded is a common mismatch on Magento' },
  { label: 'Feed availability matches live stock status', status: 'todo', note: 'Patch maps backorders → in_stock — verify no late-ship disapprovals' },
  { label: 'Product URLs in feed resolve without 301 redirects', status: 'todo', note: 'Googlebot penalizes redirect chains in Shopping feeds' },
  { label: 'Rich Results Test: offers.price matches feed', status: 'todo', note: 'Run on 3 product pages at search.google.com/test/rich-results' },
  { label: 'Rich Results Test: offers.availability matches feed', status: 'todo', note: '' },
  { label: 'JSON-LD has gtin / mpn / sku identifiers', status: 'todo', note: 'Missing identifiers = automatic disapproval for many categories' },
  { label: 'Hyva Alpine.js price matches server-side JSON-LD price', status: 'todo', note: 'Hyva renders price client-side — if JSON-LD uses a different value, GMC sees a mismatch' },
  { label: 'Merchant Center Diagnostics: zero "price" errors', status: 'todo', note: '' },
  { label: 'Merchant Center Diagnostics: zero "availability" errors', status: 'todo', note: '' },
  { label: 'GA4 dataLayer: purchase event fires on order success', status: 'todo', note: 'Open DevTools console → type dataLayer → look for event: "purchase"' },
  { label: 'GA4 purchase event revenue is non-zero', status: 'todo', note: '$0 revenue = broken order value tracking' },
  { label: 'sales_order: no stuck is_sent_to_google_analytics=0 rows', status: 'todo', note: 'Run: SELECT COUNT(*) FROM sales_order WHERE is_sent_to_google_analytics=0 AND created_at < NOW() - INTERVAL 1 HOUR' },
  { label: 'var/log/googleTagManager.log: no API errors', status: 'todo', note: 'Check for 401/403 = expired API secret; 400 = bad payload' },
]

const checkoutChecks = [
  { label: 'Zero JS errors on /checkout (DevTools console)', status: 'todo', note: '' },
  { label: 'No "$ is not defined" jQuery errors on checkout', status: 'todo', note: 'Hyva has no jQuery — legacy scripts (AdRoll, SteelHouse) may need shim' },
  { label: 'All A/B tools disabled → checkout completes cleanly', status: 'todo', note: 'Use GTM Preview → Pause all A/B tags → complete test purchase' },
  { label: 'dataLayer: begin_checkout fires at step 1', status: 'todo', note: '' },
  { label: 'dataLayer: add_shipping_info fires when method selected', status: 'todo', note: '' },
  { label: 'dataLayer: purchase fires on success page with correct revenue', status: 'todo', note: '' },
  { label: 'No Swissup Firecheckout Alpine.js mutation errors', status: 'todo', note: 'A/B tools mutating DOM outside Alpine context will break reactivity' },
  { label: 'Partytown proxy /medmart/proxy/index returns 200', status: 'todo', note: 'If 500, Klaviyo and Klevu fail silently with no console error' },
  { label: 'Checkout TBT (Total Blocking Time) < 300ms', status: 'todo', note: 'Run Lighthouse on /checkout in Chrome DevTools' },
]

const findings: { date: string; severity: 'critical' | 'high' | 'medium' | 'info'; title: string; detail: string; fix?: string }[] = [
  {
    date: '—',
    severity: 'critical',
    title: '5 simultaneous A/B testing tools on checkout',
    detail: 'Convert.com, VWO, Omniconvert, Yieldify, and Mida are all CSP-whitelisted — almost certainly running concurrently on every page including checkout. Each injects DOM mutations that can break Hyva\'s Alpine.js reactivity and conflict with each other.',
    fix: 'Run GTM Preview → disable all 5 → complete test checkout → re-enable one at a time. Consolidate to a single A/B platform.',
  },
  {
    date: '—',
    severity: 'high',
    title: 'RocketWeb patch maps backorders → in_stock',
    detail: 'm2-hotfixes/RocketWebShoppingFeedsPatch.patch forces backorder products to show availability="in_stock" in the Google Shopping feed. If those items have extended lead times, Merchant Center will flag an availability mismatch.',
    fix: 'Audit backorder products in feed vs actual delivery times. Consider mapping to "preorder" or "out_of_stock" for items > 2 week lead time.',
  },
  {
    date: '—',
    severity: 'high',
    title: 'Hyva renders prices client-side — JSON-LD mismatch risk',
    detail: 'Hyva theme uses Alpine.js to render prices after page load. If JSON-LD structured data is output server-side with a different price (e.g., ex-tax vs inc-tax, or without sale price applied), Googlebot sees a price mismatch between JSON-LD and visible content.',
    fix: 'Audit JSON-LD output template → ensure price matches exactly what Alpine.js renders. Consider rendering JSON-LD via Alpine as well.',
  },
  {
    date: '—',
    severity: 'high',
    title: 'GA4 Measurement Protocol cron — verify not silently failing',
    detail: 'Custom MedMart_GoogleTagManager cron pushes orders to GA4 every 5 min. If the API secret has expired or the payload format changed, orders fail silently. The sales_order table tracks this via is_sent_to_google_analytics but nobody may be watching the log.',
    fix: 'SSH staging → tail -f var/log/googleTagManager.log. Check DB for stuck rows. Verify GA4 API secret is current in Merchant Center → Account → Connected accounts.',
  },
  {
    date: '—',
    severity: 'medium',
    title: '146+ CSP-whitelisted domains — attack surface',
    detail: 'The MedMart_Csp whitelist has grown to 146+ domains. Many appear unused (Adobe DTM, multiple chat platforms, redundant pixel domains). Each whitelisted domain is a potential XSS injection vector if that service is ever compromised.',
    fix: 'Audit whitelist against actually-loaded scripts. Remove any domain that does not correspond to an active, verified service.',
  },
  {
    date: '—',
    severity: 'medium',
    title: 'Legacy jQuery-era scripts on Hyva (no jQuery loaded)',
    detail: 'AdRoll, Trustpilot, and SteelHouse scripts were built expecting jQuery (window.$ / window.jQuery). Hyva does not load jQuery. If any of these call $ they will throw a silent ReferenceError that cascades and kills subsequent scripts.',
    fix: 'Open DevTools → Console on each page type → filter "Error" → look for "$ is not defined". Add jQuery shim only for affected scripts via RequireJS if needed.',
  },
]

type TrimCategory = 'consolidate' | 'remove' | 'campaign'

const trimSuggestions: {
  category: TrimCategory
  scripts: string[]
  title: string
  saving: string
  why: string
  revenueRisk: 'none' | 'low' | 'check'
  action: string
}[] = [
  {
    category: 'consolidate',
    scripts: ['Convert.com (A/B)', 'VWO (A/B)', 'Omniconvert (A/B)', 'Yieldify', 'Mida (A/B)'],
    title: 'Consolidate 5 A/B tools → 1',
    saving: 'Remove 4 scripts, fix checkout conflicts, get valid test data',
    why: 'Running 5 A/B and personalization tools simultaneously makes every experiment\'s results statistically invalid — you can\'t attribute a lift to one tool when 4 others are changing the same pages. Each tool also injects DOM mutations that conflict with Hyva\'s Alpine.js, the most likely cause of silent checkout failures. Pick one platform (Convert.com or VWO are the most mature) and remove the rest. The checkout reliability gain alone is worth the consolidation.',
    revenueRisk: 'low',
    action: 'Audit which tool has the most active experiments right now (GTM Preview + check each dashboard). Pick the one with the most running tests to keep. Pause all others in GTM → confirm checkout completes cleanly → remove the paused tags permanently.',
  },
  {
    category: 'consolidate',
    scripts: ['Microsoft Clarity', 'Hotjar'],
    title: 'Consolidate session recording: Clarity + Hotjar → pick one',
    saving: 'Remove 1 script, eliminate duplicate data collection',
    why: 'Both tools record sessions, generate heatmaps, and track user flows. Running both doubles the data collection overhead with no additional insight — you\'d never watch two sets of session recordings for the same user. Microsoft Clarity is free and has no session limits. Hotjar has a cost. Unless Hotjar\'s specific features (surveys, funnels) are actively used, Clarity alone covers the use case.',
    revenueRisk: 'none',
    action: 'Check Hotjar dashboard — if no active surveys or scheduled recordings, cancel the subscription and remove the GTM tag. Clarity data will continue uninterrupted. If Hotjar surveys are live, migrate them to a form tool and then remove.',
  },
  {
    category: 'remove',
    scripts: ['AdRoll', 'AdRoll Retargeting'],
    title: 'AdRoll loaded twice — remove the duplicate',
    saving: 'Remove 1 redundant script load',
    why: 's.adroll.com is loaded lazily via interaction trigger, and adroll.com is also loaded via phtml layout. These are two load paths for the same vendor. Duplicate pixel fires mean AdRoll is receiving doubled event data, which inflates audience sizes and can cause campaign overspend from duplicate conversion attribution.',
    revenueRisk: 'none',
    action: 'In GTM Preview, check which AdRoll tag fires on which events. The phtml version (Layout XML) is the more controlled load — keep that one and remove the GTM/lazy version, or vice versa. Verify AdRoll\'s event count drops by ~50% after removing one.',
  },
  {
    category: 'remove',
    scripts: ['New Relic APM'],
    title: 'New Relic via GTM — wrong implementation',
    saving: 'Remove 1 heavy browser agent (~50KB)',
    why: 'New Relic is a server-side APM tool. If it\'s being injected via GTM as a browser script, it\'s the New Relic Browser agent — a ~50KB script that runs on every page to collect frontend performance data. If the team isn\'t actively reviewing New Relic Browser dashboards, this is pure overhead. Real server APM (PHP agent) should be installed at the server level, not via GTM.',
    revenueRisk: 'none',
    action: 'Check if anyone on the team uses New Relic Browser dashboards. If not, pause the GTM tag. Server-side New Relic (if installed) is separate and unaffected. If Browser data IS being used, move the agent install to Layout XML so it\'s controlled and not dependent on GTM loading.',
  },
  {
    category: 'remove',
    scripts: ['Zendesk / Zopim Chat'],
    title: 'Zendesk/Zopim chat — remove if no active support queue',
    saving: 'Remove live chat widget script (~80KB) and eliminate CLS from chat bubble',
    why: 'Zopim is the old name for Zendesk Chat, acquired in 2014. If this tag is still in GTM unchanged since then, the account may be inactive or unmanned. A chat widget with no one responding is worse for conversion than no chat widget — users who click it and get no response leave with a negative impression. It also causes CLS from the chat bubble appearing post-load.',
    revenueRisk: 'check',
    action: 'Log into Zendesk → check the chat queue — is anyone monitoring it and responding? If the queue is unmanned or the account is expired, remove the GTM tag immediately. If chat IS active, keep it but move the script load to be deferred/lazy so it doesn\'t affect initial page performance.',
  },
  {
    category: 'campaign',
    scripts: ['SteelHouse Pixel'],
    title: 'SteelHouse Pixel — remove if no active SteelHouse campaigns',
    saving: 'Remove 1 script from order success page',
    why: 'SteelHouse (now Criteo Commerce Media) is a retargeting and display ad platform. Its pixel only fires on the order success page, so performance impact is minimal. But if no active SteelHouse/Criteo Commerce campaigns are running, it\'s collecting purchase data for no reason and unnecessarily widening the data-sharing footprint.',
    revenueRisk: 'check',
    action: 'Check with the paid media team — are SteelHouse/Criteo Commerce campaigns currently running and attributed? If not, remove from Layout XML phtml. If campaigns are active but paused, keep the pixel so audience data continues to build.',
  },
  {
    category: 'campaign',
    scripts: ['Pinterest Tag'],
    title: 'Pinterest Tag — remove if not running Pinterest ads',
    saving: 'Remove 1 script from checkout pages',
    why: 'The Pinterest Tag is a conversion and audience-building pixel for Pinterest Ads. It\'s currently unverified (only in CSP whitelist, not found in code) and scoped to checkout pages. If the team isn\'t actively running Pinterest ad campaigns, this collects checkout data for an unused channel.',
    revenueRisk: 'check',
    action: 'Ask the paid media team if Pinterest ads are active. If yes, verify the tag is actually firing (GTM Preview on checkout). If no Pinterest campaigns are running or planned, remove the tag from GTM.',
  },
  {
    category: 'campaign',
    scripts: ['Cometly Attribution'],
    title: 'Cometly — redundant if GA4 + ad pixels cover attribution',
    saving: 'Remove 1 third-party attribution script',
    why: 'Cometly is a paid media attribution tool that aggregates data from ad platforms (Facebook, Google, TikTok) into a single dashboard. If the team is already using GA4 + individual ad platform pixels (Facebook Pixel, AdRoll, Pinterest) for attribution, Cometly is a third layer that largely duplicates what\'s already tracked. It also adds another domain to the CSP whitelist.',
    revenueRisk: 'check',
    action: 'Check if the paid media team actively uses the Cometly dashboard for campaign decisions. If the data is being used, keep it. If nobody references it, cancel and remove the GTM tag.',
  },
]

/* ─── sub-components ─────────────────────────────────────────────────────── */

const statusColors: Record<string, string> = {
  active:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  suspect:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  unverified:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  disabled:    'bg-red-500/15 text-red-400 border-red-500/25',
}

const priorityColors: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-zinc-500',
}

const severityColors: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/5',
  high:     'border-orange-500/40 bg-orange-500/5',
  medium:   'border-yellow-500/40 bg-yellow-500/5',
  info:     'border-zinc-600/40 bg-zinc-800/30',
}

const severityLabel: Record<string, string> = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  info:     'INFO',
}

type CheckStatus = 'todo' | 'pass' | 'fail' | 'na'

function CheckRow({ label, status, note, onChange }: {
  label: string
  status: CheckStatus
  note: string
  onChange: (s: CheckStatus) => void
}) {
  const cycle: CheckStatus[] = ['todo', 'pass', 'fail', 'na']
  const colors: Record<CheckStatus, string> = {
    todo: 'text-zinc-500',
    pass: 'text-emerald-400',
    fail: 'text-red-400',
    na:   'text-zinc-600',
  }
  const icons: Record<CheckStatus, string> = {
    todo: '○',
    pass: '✓',
    fail: '✗',
    na:   '—',
  }
  return (
    <tr className="border-b border-border-subtle/40 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 pr-4 align-top">
        <button
          onClick={() => onChange(cycle[(cycle.indexOf(status) + 1) % cycle.length])}
          className={`font-mono text-sm font-bold w-6 text-center cursor-pointer select-none ${colors[status]}`}
          title="Click to cycle: todo → pass → fail → n/a"
        >
          {icons[status]}
        </button>
      </td>
      <td className="py-3 pr-6 align-top text-sm text-ink/90">{label}</td>
      <td className="py-3 align-top text-xs text-muted leading-relaxed">{note}</td>
    </tr>
  )
}

/* ─── page ───────────────────────────────────────────────────────────────── */

export default function MedmartGMCPage() {
  const [tab, setTab] = useState<'findings' | 'scripts' | 'gmc' | 'checkout' | 'debug' | 'trim'>('findings')
  const [expandedScript, setExpandedScript] = useState<string | null>(null)

  const [gmcState, setGmcState] = useState<CheckStatus[]>(() => gmcChecks.map(() => 'todo'))
  const [coState, setCoState]   = useState<CheckStatus[]>(() => checkoutChecks.map(() => 'todo'))

  const gmcPass = gmcState.filter(s => s === 'pass').length
  const coPass  = coState.filter(s => s === 'pass').length

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'findings',  label: 'Findings' },
    { id: 'trim',      label: `Trim (${trimSuggestions.length})` },
    { id: 'scripts',   label: `Scripts (${scriptInventory.length})` },
    { id: 'gmc',       label: `GMC Audit (${gmcPass}/${gmcChecks.length})` },
    { id: 'checkout',  label: `Cart Audit (${coPass}/${checkoutChecks.length})` },
    { id: 'debug',     label: 'Debug Guide' },
  ]

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* Header */}
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/medmart/demo" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            MedMart
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">GMC &amp; Conversion Audit</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">medmartonline.com</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">
            Front-End Audit — Google Merchant &amp; Cart Conversion
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            Diagnostic hub for medmartonline.com. Covers Google Merchant Center feed/schema issues,
            GTM datalayer gaps, cart conversion bottlenecks, and the full third-party script inventory
            across the Adobe Commerce + Hyva stack.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Active scripts', value: scriptInventory.filter(s => s.status === 'active').length.toString(), sub: 'confirmed in code', color: 'text-ink' },
            { label: 'Suspect scripts', value: scriptInventory.filter(s => s.status === 'suspect').length.toString(), sub: 'need investigation', color: 'text-yellow-400' },
            { label: 'A/B tools running', value: '5', sub: 'simultaneously on checkout', color: 'text-red-400' },
            { label: 'CSP domains', value: '146+', sub: 'whitelisted third-parties', color: 'text-orange-400' },
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

        {/* ── Findings tab ── */}
        {tab === 'findings' && (
          <div className="space-y-4">
            <p className="text-sm text-muted mb-6">
              Issues identified from codebase audit and live site analysis. Click a finding to expand. Dates will be filled as diagnostics are run.
            </p>
            {findings.map((f, i) => (
              <div key={i} className={`border rounded-lg p-5 ${severityColors[f.severity]}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold font-mono mt-0.5 shrink-0 ${priorityColors[f.severity]}`}>
                    {severityLabel[f.severity]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                      {f.date !== '—' && <span className="text-xs text-muted shrink-0">{f.date}</span>}
                    </div>
                    <p className="text-sm text-muted leading-relaxed mb-3">{f.detail}</p>
                    {f.fix && (
                      <div className="bg-white/[0.04] rounded-md px-3 py-2">
                        <span className="text-xs font-semibold text-gold mr-2">Fix:</span>
                        <span className="text-xs text-ink/80">{f.fix}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Trim tab ── */}
        {tab === 'trim' && (() => {
          const categoryMeta: Record<TrimCategory, { label: string; color: string; desc: string }> = {
            consolidate: { label: 'Consolidate', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5', desc: 'Redundant tools doing the same job — keep one, remove the rest' },
            remove:      { label: 'Safe to Remove', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', desc: 'Dead weight with no meaningful function or revenue tie' },
            campaign:    { label: 'Remove if Campaign Inactive', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5', desc: 'Only worth keeping if the associated paid media channel is actively running' },
          }
          const riskLabel: Record<'none' | 'low' | 'check', { text: string; color: string }> = {
            none:  { text: 'No revenue risk', color: 'text-emerald-400' },
            low:   { text: 'Minimal risk', color: 'text-yellow-400' },
            check: { text: 'Confirm first', color: 'text-orange-400' },
          }
          const groups: TrimCategory[] = ['consolidate', 'remove', 'campaign']
          return (
            <div className="space-y-8">
              <p className="text-sm text-muted">
                Scripts and tools that can be removed or consolidated without impacting revenue — based on redundancy, wrong implementation, or dependency on inactive campaigns. Each recommendation includes how to safely verify before removing.
              </p>
              {groups.map(cat => {
                const items = trimSuggestions.filter(s => s.category === cat)
                const meta = categoryMeta[cat]
                return (
                  <div key={cat}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${meta.color}`}>
                      {meta.label}
                      <span className="font-normal opacity-70">— {meta.desc}</span>
                    </div>
                    <div className="space-y-4">
                      {items.map((item, i) => (
                        <div key={i} className="bg-white/[0.02] border border-border-subtle rounded-lg p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                            <span className={`text-xs font-medium shrink-0 ${riskLabel[item.revenueRisk].color}`}>
                              {riskLabel[item.revenueRisk].text}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.scripts.map(s => (
                              <span key={s} className="inline-block px-2 py-0.5 rounded bg-white/[0.05] border border-border-subtle text-xs font-mono text-muted">
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-muted leading-relaxed mb-3">{item.why}</p>
                          <div className="bg-white/[0.04] rounded-md px-3 py-2">
                            <span className="text-xs font-semibold text-gold mr-2">Action:</span>
                            <span className="text-xs text-ink/80">{item.action}</span>
                          </div>
                          {item.saving && (
                            <p className="text-xs text-emerald-400/70 mt-2 flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              {item.saving}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* ── Scripts tab ── */}
        {tab === 'scripts' && (
          <div>
            <p className="text-sm text-muted mb-2">
              Complete third-party script inventory. "Unverified" = in CSP whitelist but not found in codebase — likely GTM-injected.
              Confirm with GTM Preview mode.
            </p>
            <p className="text-xs text-yellow-400/70 mb-4 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              Click any <span className="font-semibold">suspect</span> row to see purpose, risk, verification steps, and how to disable.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-white/[0.03]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Script</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Domain</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Load method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Pages</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scriptInventory.map((s, i) => {
                    const isExpanded = expandedScript === s.name
                    const isSuspect = s.status === 'suspect' && s.detail
                    return (
                      <>
                        <tr
                          key={i}
                          onClick={isSuspect ? () => setExpandedScript(isExpanded ? null : s.name) : undefined}
                          className={`border-b border-border-subtle/40 transition-colors ${isSuspect ? 'cursor-pointer hover:bg-yellow-500/[0.04]' : 'hover:bg-white/[0.02]'} ${isExpanded ? 'bg-yellow-500/[0.04]' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium text-ink text-sm">
                            <span className="flex items-center gap-2">
                              {isSuspect && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-yellow-500/60 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              )}
                              {s.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">{s.domain}</td>
                          <td className="px-4 py-3 text-xs text-muted">{s.method}</td>
                          <td className="px-4 py-3 text-xs text-muted">{s.pages}</td>
                          <td className={`px-4 py-3 text-xs font-semibold ${priorityColors[s.priority]}`}>
                            {s.priority.toUpperCase()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[s.status]}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && s.detail && (
                          <tr key={`${i}-detail`} className="border-b border-yellow-500/20 bg-yellow-500/[0.03]">
                            <td colSpan={6} className="px-6 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">What it does</h4>
                                  <p className="text-sm text-muted leading-relaxed">{s.detail.purpose}</p>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Risk</h4>
                                  <p className="text-sm text-muted leading-relaxed">{s.detail.risk}</p>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">How to verify</h4>
                                  <ol className="space-y-1.5">
                                    {s.detail.verify.map((step, vi) => (
                                      <li key={vi} className="text-xs text-muted flex gap-2">
                                        <span className="text-blue-500/60 font-mono shrink-0">{vi + 1}.</span>
                                        <span className="font-mono">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                  {s.detail.consoleCheck && (
                                    <div className="mt-3 bg-zinc-900 rounded px-3 py-2 font-mono text-xs">
                                      <span className="text-zinc-500">// console check → </span>
                                      <span className="text-emerald-400">{s.detail.consoleCheck}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">How to disable</h4>
                                  <p className="text-sm text-muted leading-relaxed">{s.detail.disable}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted mt-3">
              {scriptInventory.filter(s => s.status === 'unverified').length} scripts unverified — run GTM Preview on each page type to confirm.
            </p>
          </div>
        )}

        {/* ── GMC Audit tab ── */}
        {tab === 'gmc' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                Click the status circle to cycle: <span className="text-zinc-400">○ todo</span> → <span className="text-emerald-400">✓ pass</span> → <span className="text-red-400">✗ fail</span> → <span className="text-zinc-600">— n/a</span>
              </p>
              <span className="text-sm font-mono text-muted">{gmcPass}/{gmcChecks.length} passed</span>
            </div>
            <div className="rounded-lg border border-border-subtle overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-white/[0.03]">
                    <th className="px-4 py-3 w-8" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Check</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {gmcChecks.map((c, i) => (
                    <CheckRow
                      key={i}
                      label={c.label}
                      status={gmcState[i]}
                      note={c.note}
                      onChange={(s) => setGmcState(prev => { const n = [...prev]; n[i] = s; return n })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-white/[0.03] rounded-lg border border-border-subtle text-xs text-muted space-y-1">
              <p><span className="text-gold font-semibold">Key files:</span></p>
              <p className="font-mono">app/code/MedMart/GoogleTagManager/Cron/PushOrderToGoogleAnalytics.php</p>
              <p className="font-mono">app/code/MedMart/GoogleTagManager/Model/Service/MeasurementOrder.php</p>
              <p className="font-mono">m2-hotfixes/RocketWebShoppingFeedsPatch.patch</p>
              <p className="font-mono">var/log/googleTagManager.log</p>
            </div>
          </div>
        )}

        {/* ── Checkout Audit tab ── */}
        {tab === 'checkout' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                Cart conversion bottleneck checklist. Run through checkout on a staging order.
              </p>
              <span className="text-sm font-mono text-muted">{coPass}/{checkoutChecks.length} passed</span>
            </div>
            <div className="rounded-lg border border-border-subtle overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle bg-white/[0.03]">
                    <th className="px-4 py-3 w-8" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Check</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {checkoutChecks.map((c, i) => (
                    <CheckRow
                      key={i}
                      label={c.label}
                      status={coState[i]}
                      note={c.note}
                      onChange={(s) => setCoState(prev => { const n = [...prev]; n[i] = s; return n })}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* A/B conflict callout */}
            <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-red-400 mb-2">A/B Tool Conflict — Highest Priority</h3>
              <p className="text-sm text-muted leading-relaxed mb-3">
                5 A/B/personalization tools (Convert, VWO, Omniconvert, Yieldify, Mida) are likely running simultaneously.
                Each injects DOM mutations. Hyva's Alpine.js reactive components break if the DOM is mutated outside Alpine's
                tracking context. This is the most likely cause of silent checkout failures.
              </p>
              <div className="bg-white/[0.05] rounded p-3 font-mono text-xs text-muted space-y-1">
                <p className="text-gold">Isolation test protocol:</p>
                <p>1. GTM → Preview → connect to production</p>
                <p>2. Pause all tags matching: Convert, VWO, Omniconvert, Yieldify, Mida</p>
                <p>3. Complete full test checkout</p>
                <p>4. Re-enable one tool at a time → repeat checkout after each</p>
                <p>5. The tool that breaks it = the conflict source</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Debug Guide tab ── */}
        {tab === 'debug' && (
          <div className="space-y-6">

            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">GTM Preview Mode — Full Script Audit</h3>
              <ol className="space-y-2 text-sm text-muted list-decimal list-inside leading-relaxed">
                <li>Open <span className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">tagmanager.google.com</span> → select medmartonline container → <strong className="text-ink">Preview</strong></li>
                <li>Enter <span className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">https://medmartonline.com</span> → Connect</li>
                <li>Navigate through: Home → Category → Product → Add to Cart → Checkout → Order Success</li>
                <li>In GTM Debug panel: screenshot every tag that fires per page, noting trigger condition</li>
                <li>Use <strong className="text-ink">Pause</strong> on any tag to disable it for your session without touching production config</li>
              </ol>
            </div>

            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">DevTools Script Waterfall</h3>
              <ol className="space-y-2 text-sm text-muted list-decimal list-inside leading-relaxed">
                <li>Open Chrome → <span className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">F12</span> → Network tab → filter: <span className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">JS</span></li>
                <li>Hard refresh (<span className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">Ctrl+Shift+R</span>) on each page type</li>
                <li>Sort by "Waterfall" column — identify anything loading before DOMContentLoaded that isn't GTM or critical</li>
                <li>Filter by "Failed" — any red rows = broken script load = silent downstream failures</li>
                <li>Check Console tab → filter "Errors" → document every unique error and which page it appears on</li>
              </ol>
            </div>

            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">DataLayer Inspector</h3>
              <div className="space-y-2 text-sm text-muted">
                <p>Open DevTools Console and run these on each page type:</p>
                <div className="bg-zinc-900 rounded-md p-4 font-mono text-xs space-y-3 text-zinc-300">
                  <p><span className="text-zinc-500">// See all dataLayer events pushed so far</span></p>
                  <p>dataLayer.filter(e =&gt; e.event)</p>
                  <p className="mt-2"><span className="text-zinc-500">// Monitor new pushes in real time</span></p>
                  <p>{'const orig = dataLayer.push.bind(dataLayer)'}</p>
                  <p>{'dataLayer.push = (...args) => { console.log("[dL]", args); return orig(...args) }'}</p>
                  <p className="mt-2"><span className="text-zinc-500">// Check for purchase event (run on order success page)</span></p>
                  <p>dataLayer.find(e =&gt; e.event === 'purchase')</p>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Staging SSH Diagnostics</h3>
              <div className="bg-zinc-900 rounded-md p-4 font-mono text-xs space-y-3 text-zinc-300">
                <p><span className="text-zinc-500"># Connect to staging</span></p>
                <p>magento-cloud ssh -p tin2rimoygcaq -e staging</p>
                <p className="mt-2"><span className="text-zinc-500"># Watch GA4 cron log in real time</span></p>
                <p>tail -f var/log/googleTagManager.log</p>
                <p className="mt-2"><span className="text-zinc-500"># Orders stuck in GA4 queue (should be 0)</span></p>
                <p>{"bin/magento db:query \"SELECT COUNT(*) as stuck FROM sales_order WHERE is_sent_to_google_analytics=0 AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);\""}</p>
                <p className="mt-2"><span className="text-zinc-500"># Verify Partytown proxy route works</span></p>
                <p>curl -I https://medmartonline.com/medmart/proxy/index</p>
                <p className="mt-2"><span className="text-zinc-500"># Run cron manually to test</span></p>
                <p>bin/magento cron:run --group=medmart_gtm</p>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-5">
              <h3 className="text-sm font-semibold text-ink mb-3">Google Merchant Center — External Tools</h3>
              <div className="space-y-2 text-sm text-muted">
                {[
                  { label: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', desc: 'Paste any product URL — verify JSON-LD matches feed' },
                  { label: 'Merchant Center Diagnostics', url: 'https://merchants.google.com', desc: 'Diagnostics → Feed → filter by error type' },
                  { label: 'Schema Markup Validator', url: 'https://validator.schema.org', desc: 'Deeper schema validation than Rich Results Test' },
                  { label: 'PageSpeed Insights', url: 'https://pagespeed.web.dev', desc: 'Run on product page + checkout for TBT and script audit' },
                  { label: 'WebPageTest', url: 'https://www.webpagetest.org', desc: 'Filmstrip view on checkout — see when Place Order button becomes interactive' },
                ].map(t => (
                  <div key={t.label} className="flex items-start gap-3 py-1.5">
                    <span className="text-gold text-xs font-mono mt-0.5 w-4 shrink-0">→</span>
                    <div>
                      <span className="text-ink text-sm font-medium">{t.label}</span>
                      <span className="text-muted text-xs"> — {t.desc}</span>
                      <p className="font-mono text-xs text-muted/60 mt-0.5">{t.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
