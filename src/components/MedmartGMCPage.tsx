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
  { name: 'Google Tag Manager', domain: 'googletagmanager.com', method: 'Inline init (container GTM-54HV66)', pages: 'All', status: 'active', priority: 'critical' },
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
  {
    name: 'Facebook Pixel', domain: 'connect.facebook.net', method: 'Apptrian_FacebookPixel module', pages: 'All', status: 'broken', priority: 'high',
    detail: {
      purpose: 'Meta Pixel for Facebook/Instagram ad attribution. Module Apptrian_FacebookPixel is enabled in module:status, but the connect.facebook.net script is ABSENT from rendered HTML on home, PDP, and cart (verified via curl 2026-05-19).',
      verify: [
        'magento-cloud ssh -p tin2rimoygcaq -e production -- php bin/magento module:status | grep -i facebook',
        'curl -sL https://medmartonline.com/ | grep -c connect.facebook.net  # currently returns 0',
        'Admin → Stores → Configuration → Apptrian → Facebook Pixel — check Enabled flag + Pixel ID',
      ],
      consoleCheck: 'window.fbq',
      risk: 'Meta ad campaigns are running without conversion attribution. Every Meta-driven purchase is invisible in Ads Manager → audiences are stale, lookalikes degrade, ROAS optics are wrong, and you can\'t optimize spend. Cumulative invisible-conversion debt grows daily.',
      disable: 'If Meta ads are NOT running, disable the module to stop adding configuration confusion. If Meta ads ARE running, fix the admin config so the pixel actually emits, and re-verify by curl-ing the home page for "connect.facebook.net".',
    },
  },
  {
    name: 'Klaviyo', domain: 'static.klaviyo.com', method: 'MedMart_Klaviyo + Klaviyo_Reclaim', pages: 'All', status: 'broken', priority: 'high',
    detail: {
      purpose: 'Email marketing + abandoned-browse / abandoned-cart capture. Two Klaviyo-related modules enabled (MedMart_Klaviyo, Klaviyo_Reclaim), but no static.klaviyo.com script tag is present in rendered HTML on home, PDP, or cart (verified 2026-05-19). Only static-forms.klaviyo.com referenced via <link> tags, no JS.',
      verify: [
        'curl -sL https://medmartonline.com/ | grep -c static.klaviyo.com  # currently returns 0 for script src',
        'Admin → Stores → Configuration → Klaviyo — check public API key and Enabled flag',
        'DevTools Console → type _learnq — should be an array if Klaviyo is loaded',
      ],
      consoleCheck: 'window._learnq',
      risk: 'Abandoned-cart and browse-abandonment flows are not collecting on-site behavior data. Klaviyo flows that depend on Viewed Product / Started Checkout events have no source data → those automation revenue streams are silently dark.',
      disable: 'If no longer using Klaviyo, disable both modules to clean up. If still using Klaviyo for email, check whether onboarding is happening only via API (server-side order events) — if so, the broken frontend tracking is the only gap; otherwise both broken.',
    },
  },
  { name: 'Klevu Search', domain: 'js.klevu.com', method: 'Direct script tag (head)', pages: 'All', status: 'active', priority: 'medium' },
  { name: 'AdRoll', domain: 's.adroll.com', method: 'AdRoll module + GTM', pages: 'All (lazy)', status: 'unverified', priority: 'medium' },
  { name: 'SteelHouse Pixel', domain: 'dx.steelhousemedia.com', method: 'Layout XML / phtml', pages: 'Order success only', status: 'unverified', priority: 'medium' },
  { name: 'Trustpilot Reviews', domain: 'trustpilot.com', method: 'Trustpilot_Reviews module', pages: 'All (lazy)', status: 'unverified', priority: 'low' },
  {
    name: 'Bread Finance', domain: 'getbread.com', method: 'Bread_BreadCheckout module', pages: 'Product / Cart / Checkout', status: 'broken', priority: 'critical',
    detail: {
      purpose: 'Pay Over Time financing button on PDP, cart, and checkout. Configured for cart page (enabled_on_cart_page=1), product page (enabled_on_product_page=1), and category page (enabled_on_category_page=1).',
      verify: [
        'magento-cloud ssh -p tin2rimoygcaq -e production -- php bin/magento config:show payment/breadcheckout/bread_auth_token',
        'Decode the JWT — exp field is a Unix timestamp. Currently exp=1755892279 = Fri Aug 22 19:51 UTC 2025',
        'Compare to today\'s date — token is expired',
      ],
      consoleCheck: 'document.querySelector(\'#bread-button\')',
      risk: 'CRITICAL: the bread_auth_token JWT expired on 2025-08-22, nine months ago. Customers cannot complete Bread financing applications — the "Pay Over Time" button either silently fails or shows a generic error. Every customer who would have used financing is either falling back to another payment method or abandoning. Direct revenue loss; size depends on financing share of orders.',
      disable: 'IMMEDIATE: log into Bread Finance dashboard and generate a new OAuth token. Update payment/breadcheckout/bread_auth_token in admin config. If Bread is no longer being used, set enabled_on_cart_page / enabled_on_product_page / enabled_on_category_page = 0 to remove the broken UI.',
    },
  },
  { name: 'Microsoft Clarity', domain: 'clarity.ms', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'Hotjar', domain: 'hotjar.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  {
    name: 'Convert.com (A/B)', domain: 'convertexperiments.com', method: 'MedMart\\Base\\Block\\DefaultScript (server-rendered)', pages: 'All', status: 'active', priority: 'high',
    detail: {
      purpose: 'A/B and multivariate testing. Verified loading on home, PDP, and cart as cdn-4.convertexperiments.com/v1/js/10046048-10046305.js?environment=production (account ID 10046048, project 10046305). Rendered server-side via layout XML block, not GTM.',
      verify: [
        'curl -sL https://medmartonline.com/ | grep convertexperiments  # confirms script src is in HTML',
        'DevTools Console on any page: window._conv_q — should be truthy',
        'Convert dashboard → check which experiments are currently active on the site',
      ],
      consoleCheck: 'window._conv_q',
      risk: 'Convert is the ONLY A/B tool actually loading on the storefront (verified 2026-05-19 — VWO is disabled in config, Omniconvert\'s block emits nothing, Yieldify/Mida not installed). So no multi-tool conflict, but Convert\'s own DOM mutations can still desync Hyva Alpine.js reactivity on checkout. If add-to-cart / qty / checkout behave erratically, this is the first suspect to pause.',
      disable: 'Pause active Convert experiments in the Convert.com dashboard. To remove entirely: comment out the convertexperiments.default.script block in app/code/MedMart/Base/view/frontend/layout/default.xml.',
    },
  },
  {
    name: 'VWO (A/B)', domain: 'visualwebsiteoptimizer.com', method: 'Layout block (config-gated)', pages: 'None', status: 'disabled', priority: 'low',
    detail: {
      purpose: 'Visual Website Optimizer A/B testing. Layout XML block vwo.default.script exists in app/code/MedMart/Base/view/frontend/layout/default.xml, but config flag vwo/general/enabled = 0 — the block emits nothing.',
      verify: [
        'magento-cloud ssh -p tin2rimoygcaq -e production -- php bin/magento config:show vwo/general/enabled  # returns 0',
        'curl -sL https://medmartonline.com/ | grep -c visualwebsiteoptimizer  # returns 0',
        'Account ID 622608 is configured but inactive',
      ],
      consoleCheck: 'window._vwo_code  // undefined',
      risk: 'No active runtime impact — script does not load. Dead code with admin-config rot. Risk is only if someone toggles vwo/general/enabled back to 1 without realizing five other A/B tools were originally planned to run alongside it.',
      disable: 'Already disabled. To clean up: remove the vwo.default.script layout block, delete the vwo/general/* config rows, and remove visualwebsiteoptimizer.com from the CSP whitelist.',
    },
  },
  {
    name: 'Omniconvert (A/B)', domain: 'omniconvert.com', method: 'Layout block (no script emitted)', pages: 'None', status: 'disabled', priority: 'low',
    detail: {
      purpose: 'A/B testing and personalization. Layout XML block omniconvert.default.script exists in app/code/MedMart/Base/view/frontend/layout/default.xml, but no omniconvert.com script appears in rendered HTML (verified 2026-05-19) — either config-gated off or the block has no template body.',
      verify: [
        'curl -sL https://medmartonline.com/ | grep -c omniconvert  # returns 0',
        'Check app/code/MedMart/Base/Block/DefaultScript.php for the config flag this block reads',
        'DevTools Console: window.omniconvert  // expected undefined',
      ],
      consoleCheck: 'window.omniconvert',
      risk: 'No active runtime impact — script does not load. Same dead-code situation as VWO.',
      disable: 'Already inert. Remove the layout block and any associated config to clean up.',
    },
  },
  { name: 'Yieldify', domain: 'yieldify.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'Mida (A/B)', domain: 'mida.so', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'Criteo', domain: 'criteo.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'AdRoll Retargeting', domain: 'adroll.com', method: 'AdRoll module + GTM', pages: 'All', status: 'unverified', priority: 'medium' },
  { name: 'Pinterest Tag', domain: 'ct.pinterest.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  {
    name: 'Zendesk / Zopim Chat', domain: 'zendesk.com / zopim.com', method: 'MedMart_Zendesk + Wagento_Zendesk (duplicate)', pages: 'All', status: 'broken', priority: 'medium',
    detail: {
      purpose: 'Live chat widget. Two competing Zendesk modules are both enabled in module:status: MedMart_Zendesk AND Wagento_Zendesk. Likely a legacy install + replacement that was never finished.',
      verify: [
        'magento-cloud ssh -p tin2rimoygcaq -e production -- php bin/magento module:status | grep -i zendesk',
        'find app/code/MedMart/Zendesk app/code/Wagento/Zendesk -name "layout" -type d 2>/dev/null  # see which one registers frontend blocks',
        'DevTools Console on the storefront: look for two zopim/zendesk widget initializations',
      ],
      consoleCheck: 'window.$zopim || window.zE',
      risk: 'Two modules registering for the same chat widget can cause double-loading of the chat script, conflicting widget initialization, or one silently shadowing the other. May also explain any "chat works inconsistently" reports — the active module depends on module load order.',
      disable: 'Determine which Zendesk module is the intended one (likely the newer Wagento_Zendesk if MedMart_Zendesk is the legacy in-house version). Disable the other via bin/magento module:disable. Verify the chat widget still loads and behaves correctly afterward.',
    },
  },
  { name: 'Signifyd (Fraud)', domain: 'signifyd.com', method: 'Module', pages: 'Checkout', status: 'unverified', priority: 'low' },
  { name: 'Cometly Attribution', domain: 'cometlytrack.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'New Relic APM', domain: 'nr-data.net', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  { name: 'Attentive Mobile', domain: 'attentivemobile.com', method: '—', pages: 'None', status: 'not-installed', priority: 'low' },
  {
    name: 'Adobe Helix RUM', domain: 'rum.hlx.page', method: 'Unknown — origin TBD', pages: 'All', status: 'suspect', priority: 'medium',
    detail: {
      purpose: 'Adobe Edge Delivery Services Real-User Monitoring. Loaded on every page as rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/rum-standalone.js with attribute data-routing="commerce=rum". Adobe RUM ships page-view timing data to Adobe Experience Cloud.',
      verify: [
        'curl -sL https://medmartonline.com/ | grep rum.hlx.page  # confirms script src',
        'grep -rE "rum\\.hlx\\.page|helix-rum" app/code/ app/design/ vendor/magento/ 2>/dev/null  # find what emits it',
        'Check whether MedMart is enrolled in an Adobe Edge Delivery / Storefront program — if not, this is rogue telemetry',
      ],
      consoleCheck: 'window.helixrum  // or check DevTools Network for rum.hlx.page',
      risk: 'If MedMart is part of an Adobe SaaS / Edge Delivery program, this is expected. If not, page-view + performance data is being shipped to Adobe with no clear business reason — vendor telemetry with no opt-out and no documented purpose.',
      disable: 'Find which module/template emits the script tag (most likely an Adobe Commerce SaaS connector module recently installed). Remove from the template OR disable the connector module if not needed.',
    },
  },
  {
    name: 'Epsilon Conversant', domain: '560658.tctm.co', method: 'Direct script tag', pages: 'All', status: 'active', priority: 'medium',
    detail: {
      purpose: 'Epsilon Conversant retargeting and display advertising pixel. Loads on every page as 560658.tctm.co/t.js (async) with inline payload var epsilon = { fid: "7724", promo_id: "1" }. Account 560658.',
      verify: [
        'curl -sL https://medmartonline.com/ | grep tctm.co  # confirms script src',
        'Ask paid media team: are Epsilon Conversant campaigns currently running and being attributed?',
        'DevTools Console → check for window.epsilon or window.cnv objects after page load',
      ],
      consoleCheck: 'window.epsilon',
      risk: 'If no active Epsilon Conversant campaigns are running, this is a tracking pixel collecting visitor data for an unused channel. Adds a domain to CSP whitelist and slightly delays page load. If campaigns ARE running, low priority — pixel appears functional.',
      disable: 'If Epsilon Conversant is not actively being used, locate the template emitting the tctm.co/t.js + epsilon payload and remove it. Search the codebase: grep -rE "tctm\\.co|epsilon.*fid" app/code/ app/design/ — likely in a custom MedMart_* module.',
    },
  },
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
    date: '2026-05-19',
    severity: 'critical',
    title: 'PDP has no Product JSON-LD schema — only VideoObject',
    detail: 'Verified by curl on https://medmartonline.com/catalog/product/view/id/34424 — the only structured-data block emitted is a VideoObject for the YouTube embed. Zero Product schema, zero offers/price/availability/sku/gtin/mpn/brand. Without Product JSON-LD, Google has no structured signal to match the GMC feed against the live page, which puts items into "limited functionality" and risks "missing structured data" disapprovals.',
    fix: 'Extend app/code/MedMart/GoogleTagManager/view/frontend/templates/detailproduct.phtml (or add a dedicated PDP schema template) to emit a Product JSON-LD block with @type, name, sku, gtin/mpn, brand, image, offers { price, priceCurrency, availability, url, priceValidUntil }. Values MUST match whatever Hyva renders client-side — otherwise the schema introduces its own mismatch.',
  },
  {
    date: '2026-05-19',
    severity: 'critical',
    title: 'Bread Finance JWT auth token expired 2025-08-22',
    detail: 'payment/breadcheckout/bread_auth_token is a JWT with exp=1755892279 = Fri Aug 22 19:51 UTC 2025 — nine months stale as of today. Bread is configured for product page, cart page, and category page. The Pay Over Time button either silently fails or shows a generic error to customers attempting to finance. Every Bread-eligible order since August 2025 has been falling back to another payment method or abandoning.',
    fix: 'IMMEDIATE: log into Bread Finance dashboard → generate a new OAuth token → update payment/breadcheckout/bread_auth_token in admin config. If Bread is no longer in use, set enabled_on_cart_page / enabled_on_product_page / enabled_on_category_page = 0 to remove the broken UI.',
  },
  {
    date: '2026-05-19',
    severity: 'critical',
    title: 'GMC feed exports 263 of 9,719 in-stock products (97% missing)',
    detail: 'RocketWeb_ShoppingFeeds is silently dropping 97% of in-stock products from the Google Shopping feed (verified 2026-05-19). Catalog has 11,208 total / 9,719 in-stock; rw_shoppingfeeds_feed rows show added=2,760 → exported=263. Facebook feed worse — progress: 74, didn\'t finish. Last RocketWeb config update was 2025-08-05; regression has been running daily for ~9 months. Feedonomics is alerting because of this.',
    fix: 'Triage path: (1) Run a single feed manually with verbose logging — confirm where products drop. (2) Compare "added" vs "exported" filters in Stores → Shopping Feeds admin. (3) Sample 5 in-feed and 5 out-of-feed products, diff their attributes to find the silently-dropping field. (4) Also fix Fastly TTL on /media/feeds/* — currently max-age=31536000 (1 year), should be ~12h with stale-while-revalidate.',
  },
  {
    date: '2026-05-19',
    severity: 'high',
    title: '7+ Magento modules enabled but emit nothing in rendered HTML',
    detail: 'Module:status reports these as enabled, but rendered HTML on home / PDP / cart contains zero corresponding scripts: Apptrian_FacebookPixel (no connect.facebook.net), MedMart_Klaviyo + Klaviyo_Reclaim (no static.klaviyo.com), Astound_Affirm (no Affirm script), Tatvam_Wisernotify (no wisernotify script), Wagento_Zendesk (duplicate of MedMart_Zendesk). Each is either (a) config-disabled in admin → harmless module rot, or (b) admin-enabled but broken → silent tracking loss. The two are indistinguishable without checking each module\'s admin config.',
    fix: 'Walk Stores → Configuration in admin for each module. If "Enabled" = No, just disable the module via bin/magento module:disable to clean up. If "Enabled" = Yes but script absent, the module is broken — fix it OR replace with a GTM-managed tag.',
  },
  {
    date: '2026-05-19',
    severity: 'high',
    title: 'Original "5 simultaneous A/B tools" finding — corrected: only 1 actually runs',
    detail: 'Verified by curl on home / PDP / cart: only Convert.com loads (cdn-4.convertexperiments.com). VWO is config-disabled (vwo/general/enabled=0). Omniconvert\'s layout block emits nothing. Yieldify, Mida, Criteo, Pinterest, Cometly, Attentive, and New Relic Browser are NOT installed in code — they\'re only in the CSP whitelist as leftover entries. So checkout-A/B-tool conflict scenario is mostly a phantom; the real risks are (a) Convert.com\'s own DOM mutations vs Hyva Alpine.js, and (b) CSP whitelist bloat without corresponding code.',
    fix: 'Trim the CSP whitelist to actually-loaded domains. If checkout still misbehaves with all third-party tools removed, the cause is internal Magento/Hyva not external A/B.',
  },
  {
    date: '2026-05-19',
    severity: 'high',
    title: 'No client-side GA4 ecommerce events visible in initial HTML',
    detail: 'curl of home / PDP / cart finds zero dataLayer.push entries for view_item, add_to_cart, begin_checkout, or purchase. The magentoStorefrontEvents SDK is present (Adobe Commerce SaaS connector) but its events fire post-load via JS. If GA4 reports have been showing $0 revenue or no funnel events, the dataLayer pipeline is the suspect — combined with the MedMart_GoogleTagManager server-side cron, this is a two-headed tracking system where either head could fail silently.',
    fix: 'Open DevTools console on a real PDP → run dataLayer.filter(e => e.event) → confirm view_item, add_to_cart fire. Also tail var/log/googleTagManager.log on prod and query sales_order where is_sent_to_google_analytics=0 AND created_at < NOW() - INTERVAL 1 HOUR — should be 0.',
  },
  {
    date: '2026-05-19',
    severity: 'medium',
    title: 'Two Zendesk modules both enabled',
    detail: 'module:status shows MedMart_Zendesk AND Wagento_Zendesk both enabled simultaneously. Likely a legacy in-house install + a replacement that was never finished. If both register frontend blocks, the chat widget script may double-load or one may silently shadow the other.',
    fix: 'Determine which Zendesk module is the intended one (probably the newer Wagento_Zendesk). bin/magento module:disable the other. Verify the chat widget loads and works on a fresh page after the disable + cache flush.',
  },
  {
    date: '2026-05-19',
    severity: 'medium',
    title: 'Adobe Helix RUM script loading on every page — origin unclear',
    detail: 'rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/rum-standalone.js is loaded with attribute data-routing="commerce=rum" on home, PDP, and cart. This is Adobe Edge Delivery Services\' Real-User Monitoring agent. If MedMart is enrolled in an Adobe SaaS or Edge Delivery program, expected. If not, this is unexplained telemetry shipping page-view + performance data to Adobe Experience Cloud.',
    fix: 'grep -rE "rum\\.hlx\\.page|helix-rum" app/code/ app/design/ vendor/magento/ to find what emits the tag. Confirm with Adobe account team whether enrollment is real. If not enrolled, remove the emission.',
  },
  {
    date: '—',
    severity: 'medium',
    title: 'RocketWeb patch maps backorders → in_stock',
    detail: 'm2-hotfixes/RocketWebShoppingFeedsPatch.patch forces backorder products to show availability="in_stock" in the feed. Compounds with the volume gap above — even the 263 products that DO ship are flagged with wrong availability if any are backorders with long lead times.',
    fix: 'Audit which products in the feed are backorders. Map > 2-week-lead-time items to "preorder" or "out_of_stock" instead of forcing in_stock.',
  },
  {
    date: '—',
    severity: 'medium',
    title: 'Hyva renders prices client-side — future-state JSON-LD mismatch risk',
    detail: 'When the Product JSON-LD is added (see CRITICAL above), the price value must match what Hyva\'s Alpine.js renders post-hydration. If the schema uses a server-side price that differs from the displayed price (tax-included vs excluded, customer-group price, sale vs base), GMC will flag a price mismatch — same problem we don\'t have today but will create the moment schema is added incorrectly.',
    fix: 'When implementing Product schema, source the price from the same model Alpine uses (post-final-price calculation) — not the raw catalog_product_entity_decimal price.',
  },
  {
    date: '—',
    severity: 'medium',
    title: 'GA4 Measurement Protocol cron — verify not silently failing',
    detail: 'Custom MedMart_GoogleTagManager cron pushes orders to GA4 every 5 min via Measurement Protocol. If the API secret has expired or the payload format has drifted from GA4 spec, every order silently fails. sales_order.is_sent_to_google_analytics is the tracker, but nobody is watching var/log/googleTagManager.log.',
    fix: 'SSH prod → tail -f var/log/googleTagManager.log. Check sales_order WHERE is_sent_to_google_analytics=0 AND created_at < NOW() - INTERVAL 1 HOUR — should be 0. Verify GA4 API secret in admin and GA4 Admin → Data Streams → Measurement Protocol API secrets.',
  },
  {
    date: '—',
    severity: 'medium',
    title: '146+ CSP-whitelisted domains — most don\'t correspond to loaded scripts',
    detail: 'CSP whitelist has grown to 146+ domains. Cross-check against verified-loading scripts: most entries (Pinterest, Cometly, Attentive, Criteo, Mida, Yieldify, Hotjar, Clarity, New Relic Browser) have NO corresponding script in HTML and NO corresponding installed module. Each whitelisted domain is a potential XSS sink if that service is ever compromised.',
    fix: 'Trim CSP to actually-loaded domains. Anything not present in the home/PDP/cart HTML or in a real installed module can be removed.',
  },
  {
    date: '—',
    severity: 'medium',
    title: 'Legacy jQuery-era scripts on Hyva (no jQuery loaded)',
    detail: 'Any third-party script that expects window.$ / window.jQuery (older AdRoll, Trustpilot, SteelHouse variants) will throw a silent ReferenceError on Hyva. The cascade can kill subsequent script execution.',
    fix: 'DevTools Console on each page type → filter "Error" → search for "$ is not defined" or "jQuery is not defined". Add a minimal jQuery shim only for the affected scripts (via RequireJS) if any are found.',
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
    category: 'remove',
    scripts: ['VWO (A/B)', 'Omniconvert (A/B)', 'Yieldify', 'Mida (A/B)', 'Criteo', 'Pinterest Tag', 'Cometly Attribution', 'New Relic APM', 'Attentive Mobile', 'Microsoft Clarity', 'Hotjar'],
    title: 'Trim CSP whitelist — 11 entries with no corresponding code',
    saving: 'Remove ~11 CSP domains; clean up audit surface; no traffic to fix because they were never loading',
    why: 'Verified 2026-05-19: VWO is config-disabled. Omniconvert layout block emits nothing. Yieldify, Mida, Criteo, Pinterest, Cometly, Attentive, New Relic Browser, Clarity, and Hotjar are NOT in the codebase at all — they only exist as entries in the MedMart_Csp whitelist. The earlier audit framed these as "5 simultaneous A/B tools" or "Clarity + Hotjar both running" — none of that is true. They never run. The action is purely CSP hygiene.',
    revenueRisk: 'none',
    action: 'For each domain listed above: confirm with paid media + analytics teams that no campaign currently depends on it. Remove the entry from MedMart_Csp\'s whitelist. Also remove the disabled-but-present VWO + Omniconvert layout blocks in app/code/MedMart/Base/view/frontend/layout/default.xml.',
  },
  {
    category: 'consolidate',
    scripts: ['Zendesk / Zopim Chat'],
    title: 'Resolve duplicate Zendesk modules (MedMart_Zendesk + Wagento_Zendesk)',
    saving: 'Eliminate double-loading risk; restore predictable chat widget behavior',
    why: 'Two Zendesk modules are both enabled in module:status. This is a legacy + replacement pattern that was never finished. Both may register frontend layout blocks; the chat widget either double-loads or one silently shadows the other depending on module load order.',
    revenueRisk: 'low',
    action: 'find app/code/MedMart/Zendesk app/code/Wagento/Zendesk -name "layout" -type d 2>/dev/null  — find which one actually registers frontend blocks. Keep the maintained one (likely Wagento_Zendesk if newer). bin/magento module:disable the other and verify chat still works after cache flush.',
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
  active:          'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  suspect:         'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  unverified:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  disabled:        'bg-zinc-700/40 text-zinc-500 border-zinc-700/40',
  broken:          'bg-red-500/15 text-red-400 border-red-500/25',
  'not-installed': 'bg-zinc-800/40 text-zinc-600 border-zinc-800/40',
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
          <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
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
            { label: 'Active scripts', value: scriptInventory.filter(s => s.status === 'active').length.toString(), sub: 'verified loading in HTML', color: 'text-emerald-400' },
            { label: 'Broken (enabled, silent)', value: scriptInventory.filter(s => s.status === 'broken').length.toString(), sub: 'module on, no script emitted', color: 'text-red-400' },
            { label: 'A/B tools loading', value: '1', sub: 'Convert.com only (verified 2026-05-19)', color: 'text-orange-400' },
            { label: 'Not installed', value: scriptInventory.filter(s => s.status === 'not-installed').length.toString(), sub: 'CSP-whitelisted but no code', color: 'text-zinc-500' },
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
