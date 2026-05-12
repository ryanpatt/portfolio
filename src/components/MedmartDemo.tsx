import { useEffect, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface SecurityFinding { severity: string; title: string; detail: string; action: string; file: string; credential?: string }
interface TaskRow { name: string; owner: string; status: string; priority: string; created: string; elapsed: number; jrEst: string; srEst: string; flag: string; commitRef: string; type?: string }

// ─── Security Findings ───────────────────────────────────────────────────────
const securityFindings: SecurityFinding[] = [
  {
    severity: 'HIGH',
    title: 'Vendor Credentials in Version-Controlled File (Private Repo)',
    detail:
      'auth.json containing live API keys and passwords for 6 vendors is committed to the repository. The repo is currently private — however, every developer and contractor who has ever cloned the repo has a copy of these credentials locally. Former employees retain access. If the repo is ever made public (accidental settings change, fork, transfer), credentials are instantly exposed. Git history is permanent: even if the file is deleted today, the credentials remain in every historical clone unless git history is rewritten.',
    action: 'Rotate all 6 vendor credentials immediately. Remove auth.json from git history using git-filter-repo. Source credentials from COMPOSER_AUTH environment variable at build time. Add auth.json to .gitignore.',
    file: 'auth.json (root of repository)',
    credential: 'repo.magento.com · dist.aheadworks.com · packages.shipperhq.com · packages.mageworx.com · composer.amasty.com · repo.mageplaza.com · ci.swissuplabs.com',
  },
  {
    severity: 'CRITICAL',
    title: 'Worldpay / Mastercard Compliance — Payment Processing at Risk',
    detail:
      'Worldpay issued a formal notice (Apr 28, 2026) that merchant contact data is missing from payment authorization requests. This is a Mastercard compliance requirement. Non-compliance within 30 days of notice risks: (1) per-transaction noncompliance fees, (2) potential suspension of Mastercard processing, (3) chargeback liability increases. As of today (May 12) approximately 14 days of the 30-day window remain.',
    action: 'Assign owner today. Review merchant data fields passed during Worldpay authorization. Confirm with Worldpay once fixed.',
    file: 'Task #11869091941 — Not Started, Unassigned',
  },
  {
    severity: 'CRITICAL',
    title: 'Fastly CDN Cache: 4% Hit Rate (Industry Standard: 85%+)',
    detail:
      'CDN cache hit rate of 4% means 96% of page loads bypass the cache entirely and hit the origin server directly. Root cause confirmed in staging logs: ESI blocks (used for personalised/dynamic page fragments) are generating "Time to live is a mandatory parameter" errors, meaning cache headers are missing from these blocks. Combined with Fastly using full URLs (including UTM tracking parameters) as cache keys, every unique marketing link creates its own uncached entry. A properly configured Fastly + Magento setup should achieve 80–90% cache hit rate.',
    action: 'Fix ESI block TTL configuration. Normalize Fastly cache keys to ignore UTM/tracking parameters. Task created Mar 25 — 48 days elapsed with no action.',
    file: 'var/log/exception.log: InvalidArgumentException (4 occurrences) · Task #11593623170',
  },
  {
    severity: 'HIGH',
    title: 'PDP Layout Crash: 484 Critical Errors Today on Staging',
    detail:
      'Staging is throwing a critical exception on every Product Detail Page load: "The element header-content can\'t have a child because header-content already has a child with alias compare". This started at 3:25 AM today and has occurred 484 times in under 12 hours. Two layout XML files are both trying to register a "compare" widget in the same header slot — a conflict likely introduced by a recent layout change. This error crashes the page render and causes a 500 error for customers on affected pages.',
    action: 'URGENT: Search all layout XML files for compare block declarations. Identify which custom layout XML conflicts with core. Remove or move the duplicate declaration.',
    file: 'var/log/exception.log · Data/Structure.php:626 · 484 occurrences today',
  },
  {
    severity: 'HIGH',
    title: 'Search Indexer Broken (CatalogSearch Interceptor TypeError)',
    detail:
      'The full-text search indexer is throwing a TypeError on staging: "Argument #7 ($data) must be of type array, null given" when creating Magento\\CatalogSearch\\Model\\Indexer\\Fulltext. This means the search index may not be updating when products are added or modified. Customers could be searching for products and getting no results, or outdated results, without any visible error.',
    action: 'Run bin/magento indexer:status to confirm search indexer state. Regenerate generated/ code. If persists, check if a custom plugin or interceptor is passing null to the indexer constructor.',
    file: 'var/log/system.log · Magento\\CatalogSearch\\Model\\Indexer\\Fulltext\\Interceptor',
  },
  {
    severity: 'HIGH',
    title: 'Magento Security Patch APS B26-05 Not in Production',
    detail:
      'Adobe released a security bulletin for Adobe Commerce/Magento (reference: helpx.adobe.com/security/products/magento/apsb26-05.html). The patch has been applied to a staging branch (APSB26-05-updatem2) but has not been merged to production. The production site is running a version with known security vulnerabilities that are now documented publicly.',
    action: 'Schedule production deployment. Status: Pending Prod Deploy. Assigned to Anna Holubiatnikova.',
    file: 'Task #11479051409 · branch APSB26-05-updatem2',
  },
  {
    severity: 'CRITICAL',
    title: 'eval() Usage in Customer-Facing JavaScript',
    detail:
      'The Klevu search integration uses eval() to parse configuration strings. eval() executes arbitrary JavaScript code at runtime. If the input string is ever sourced from user input, a URL parameter, or a compromised API response, an attacker can run malicious code in every customer\'s browser — stealing session tokens, credit card data entered on the page, or redirecting users to phishing sites. This is a Top 10 OWASP vulnerability (Injection).',
    action: 'Replace eval() with JSON.parse(). This is a one-line fix. Do not wait — this is an active security risk.',
    file: 'app/code/MedMart/Klevu/view/frontend/web/js/custom-search-page.js:173',
  },
  {
    severity: 'HIGH',
    title: 'Unsanitized innerHTML in Admin PageBuilder (XSS)',
    detail:
      'Three admin PageBuilder preview scripts assign raw HTML content directly to element.innerHTML without sanitization. In the admin panel, if a malicious content type or template variable contains injected script tags, this executes in the browser of whoever opens the admin panel. Admin accounts have full store access including order data, customer PII, and payment settings.',
    action: 'Replace innerHTML assignments with DOMParser or use textContent where HTML formatting is not required. Audit all PageBuilder content type previews.',
    file: 'app/code/MedMart/PageBuilder/.../card/preview.js:295 · protection-plan/preview.js:295 · image-modal/preview.js:295',
  },
  {
    severity: 'MEDIUM',
    title: '23 console.log Statements in Production JavaScript',
    detail:
      'Debug logging statements are present across 6+ production JavaScript files. These expose implementation details, error messages, API responses, and internal logic to any visitor who opens their browser console. This aids attackers in understanding system architecture and finding exploitable endpoints. It also indicates code that has not been properly reviewed before deployment.',
    action: 'Grep and remove all console.log/console.error/console.warn before deployment. Add an ESLint rule to prevent new ones from being merged.',
    file: 'MedMart/PageBuilder/.../protection-plan/preview.js:121,225 · MedMart/Route/.../sms-opt-in.js:69 · MedMart/Catalog/.../image_preview_radio.js:40 (+19 more)',
  },
  {
    severity: 'MEDIUM',
    title: 'Input Sanitization Coverage is Low Across 48 Custom Modules',
    detail:
      '48 custom PHP modules with 80,581 lines of code contain only 14 documented uses of input sanitization functions (filter_var, htmlspecialchars, htmlentities, strip_tags). Controllers handling POST data from forms, SMS opt-ins, and admin actions lack explicit validation. While Magento\'s framework provides baseline protection, custom handlers can bypass it.',
    action: 'Audit all POST handlers in MedMart/RequestMessage, MedMart/Route, and MedMart/Theme admin controllers. Implement a validation layer. Priority: any controller that handles phone numbers, order IDs, or payment data.',
    file: 'MedMart/Route/Controller/SmsOptIn/Accept.php · MedMart/RequestMessage/Controller/Adminhtml/Contractor/Save.php',
  },
]

// ─── JS Bad Practices ────────────────────────────────────────────────────────
const jsBadPractices = [
  {
    severity: 'CRITICAL',
    title: 'eval() — Arbitrary Code Execution',
    file: 'app/code/MedMart/Klevu/view/frontend/web/js/custom-search-page.js:173',
    code: `var klevuTagConfig = eval('(' + klevuTagConfigString + ')');`,
    explanation: 'eval() treats a string as executable JavaScript. If klevuTagConfigString is ever influenced by a URL parameter, search query, or API response, an attacker can inject and run arbitrary code in every visitor\'s browser. Fix: replace with JSON.parse(klevuTagConfigString).',
  },
  {
    severity: 'HIGH',
    title: 'Unsanitized innerHTML Assignments (XSS)',
    file: 'app/code/MedMart/PageBuilder/view/adminhtml/web/js/content-type/*/preview.js:295',
    code: `element.innerHTML = this.data.content.html();`,
    explanation: 'Writing raw HTML to innerHTML without sanitization is a classic XSS vector. Found in 3 admin PageBuilder files. If content data contains <script> tags or event handler attributes, they execute immediately in the admin user\'s browser. Use DOMPurify.sanitize() or textContent.',
  },
  {
    severity: 'HIGH',
    title: 'jQuery .html() with Unsanitized Price Data',
    file: 'app/code/MedMart/Klevu/view/frontend/web/js/custom-search-page.js:142,160',
    code: `$priceInfoLower.html(lowerPrice);\n$priceInfoUpper.html(upperPrice);`,
    explanation: 'jQuery .html() behaves like innerHTML — it renders HTML, not just text. If the Klevu search API ever returns tampered price values (e.g. from a man-in-the-middle attack or API compromise), malicious markup would execute in search results for all customers. Use .text() instead.',
  },
  {
    severity: 'MEDIUM',
    title: '23 console.log / console.error in Production Code',
    file: 'MedMart/PageBuilder/.../protection-plan/preview.js:121,225 · MedMart/Route/.../sms-opt-in.js:69 (+more)',
    code: `console.log("Binding Works");\nconsole.error(error);\nconsole.log(JSON.stringify(error));\nconsole.log('called IN IF');`,
    explanation: 'Debug output left in production exposes internal logic, error messages, and data structures to anyone who opens DevTools. This helps attackers map attack surfaces. Also signals the code was not reviewed before deployment.',
  },
  {
    severity: 'MEDIUM',
    title: 'Silent AJAX Failure — Wrong Variable in Error Handler',
    file: 'app/code/MedMart/Route/view/frontend/web/js/sms-opt-in.js:35–70',
    code: `}).done(function (response) {\n  if (response.error) {\n    messageElem.addClass('error-message');\n    message = response.success; // ← BUG: should be response.error\n  }\n}).fail(function (error) {\n  console.log(JSON.stringify(error)); // ← no user feedback\n});`,
    explanation: 'Two bugs in one handler: (1) when the server returns an error, the code displays response.success instead of response.error — showing a success message for a failure; (2) the .fail() handler only logs to console, so network errors are completely invisible to the customer, who sees the form hang forever.',
  },
  {
    severity: 'MEDIUM',
    title: 'Global Variable Pollution (window object)',
    file: 'app/code/MedMart/Base/view/frontend/web/js/business-hours.js:74–75',
    code: `window.isOpening = isOpening;\nwindow.openingHours = openingHours;`,
    explanation: 'Writing to window pollutes the global namespace. Any other script (third-party widget, analytics, payment SDK) that also uses window.isOpening will silently conflict. These should be module-scoped variables or passed through a namespaced object like window.MedMart = window.MedMart || {}.',
  },
  {
    severity: 'MEDIUM',
    title: 'Inline onclick Event Handler (XSS & Maintainability)',
    file: 'app/code/MedMart/YouTubeWidget/view/frontend/templates/widget/youtube.phtml:5',
    code: `<div class="image-wrapper" onclick="loadIframe(this, '<?= $linkId; ?>')">`,
    explanation: 'Inline event handlers mix logic into markup, making it hard to maintain and impossible to unit test. If $linkId is not properly escaped and contains a quote character, an attacker can break out of the attribute and inject JavaScript. Bind events in a separate JS file using addEventListener.',
  },
]

// ─── SOLID Violations ────────────────────────────────────────────────────────
const solidViolations = [
  {
    principle: 'Single Responsibility Principle',
    violation: 'God Class — Image.php Does 6 Different Jobs',
    file: 'app/code/MedMart/Theme/Model/Image.php (961 lines)',
    code: `// Image properties (lines 258–294)\npublic function setWidth($width) { $this->_width = $width; }\npublic function setHeight($height) { $this->_height = $height; }\n\n// Image processing (lines 507–527)\npublic function resize() { $this->getImageProcessor()->resize(...); }\npublic function rotate($angle) { $this->getImageProcessor()->rotate($angle); }\n\n// Watermarking (lines 553–598)\npublic function setWatermark($file, $position, $size, $opacity) { /* 45 lines */ }\n\n// File I/O, caching, URL building also in same class...`,
    explanation: 'A single class handles image dimensions, resizing, rotating, watermarking, file I/O, caching, and URL construction. When one aspect changes (e.g. adding WebP support), the entire 961-line file must be touched, risking unintended side effects. Tests cannot be written for watermarking without instantiating the entire image pipeline. Estimated refactoring cost: 2–3 days senior dev.',
  },
  {
    principle: 'Dependency Inversion Principle',
    violation: 'Direct ObjectManager Usage (Untestable Dependencies)',
    file: 'app/code/MedMart/Theme/Model/Image.php:248–249',
    code: `// WRONG — fetches dependencies from global service locator\n$this->serializer = $serializer\n    ?: ObjectManager::getInstance()->get(SerializerInterface::class);\n$this->paramsBuilder = $paramsBuilder\n    ?: ObjectManager::getInstance()->get(ParamsBuilder::class);\n\n// CORRECT — inject via constructor\npublic function __construct(\n    SerializerInterface $serializer,\n    ParamsBuilder $paramsBuilder\n) { ... }`,
    explanation: 'Using ObjectManager::getInstance() is the Magento equivalent of using globals. It hides what the class actually needs, makes unit testing impossible (you cannot inject mock objects), and causes mysterious runtime failures if the DI container is misconfigured. Magento\'s own coding standards explicitly forbid this pattern outside of factories and proxies.',
  },
  {
    principle: 'Single Responsibility Principle',
    violation: 'One Method Does Query Building, Business Logic, and Data Insertion',
    file: 'app/code/MedMart/Sales/Model/ResourceModel/Report/Order/Createdat.php (1,036 lines)',
    code: `// _aggregateByField() — 300+ lines, does everything:\n\n// 1. Defines 40+ column calculations (lines 51–187)\n$columns = [\n    'orders_count' => new Zend_Db_Expr('COUNT(o.entity_id)'),\n    'total_profit_amount' => new Zend_Db_Expr('SUM((%s-%s-%s) * %s)'),\n    // ... 38 more\n];\n// 2. Joins 25+ tables (lines 207–289)\n$select->from([...])->joinLeft([...])->joinLeft([...]);\n// ... 22 more joins\n// 3. Executes and inserts results (line 299+)`,
    explanation: 'A 300+ line method that builds SQL, joins 25 tables, applies business rules, and writes results is impossible to test in isolation. If profit calculations are wrong, there is no way to test "just the profit formula" — you must run the entire 300-line query. Any change to one metric risks breaking unrelated metrics. Refactoring into separate query builders would cut bug-fix time by 60%+.',
  },
  {
    principle: 'Open/Closed Principle',
    violation: '23 Private Methods That Cannot Be Extended or Reused',
    file: 'app/code/MedMart/Sales/Model/ResourceModel/Report/Order/Createdat.php:337–1007',
    code: `private function selectPhoneRevenueTable($connection) {\n    // 30 lines of query building\n}\nprivate function selectAdminPhoneRevenueTable($connection) {\n    // Same pattern, slightly different\n}\nprivate function selectFrontendPhoneRevenueTable($connection) {\n    // Same pattern again\n}`,
    explanation: 'The same query pattern is repeated 3 times with minor variations, all as private methods. Private methods cannot be overridden or reused by other report classes. Adding a new revenue category (e.g. app orders) requires modifying this already-massive class rather than extending it — violating Open/Closed. This pattern should be extracted into a strategy or builder interface.',
  },
]

// ─── Staging Log Errors ──────────────────────────────────────────────────────
const stagingErrors = [
  {
    severity: 'CRITICAL',
    count: 484,
    period: 'Today (May 12, 2026)',
    title: 'PDP Layout Crash — header-content Duplicate Child',
    error: 'LocalizedException: The element "header-content" can\'t have a child because "header-content" already has a child with alias "compare".',
    file: 'vendor/magento/framework/Data/Structure.php:626',
    trigger: 'Every Product Detail Page load',
    explanation: 'Two layout XML definitions are both trying to add a "compare" widget to the same header position. Magento throws a CRITICAL exception and the page fails to render. This crash occurred 484 times today alone, meaning hundreds of product page views are hitting a 500 error. Likely introduced by a recent layout XML change. This error must be in production too if it is on staging.',
    action: 'Search all layout XML for <block name="compare"> or <referenceContainer name="header-content">. Find and remove the duplicate. Flush layout cache after fix.',
  },
  {
    severity: 'HIGH',
    count: 4,
    period: 'Today (May 12, 2026)',
    title: 'ESI Cache Blocks Missing TTL — Fastly Cache Broken',
    error: 'InvalidArgumentException: Time to live is a mandatory parameter for set public headers.',
    file: 'vendor/magento/module-page-cache/Controller/Block/Esi.php:33',
    trigger: 'ESI block requests from Fastly',
    explanation: 'ESI (Edge Side Includes) are the mechanism by which Fastly caches dynamic page fragments (like the cart count or personalised recommendations) separately from the static page shell. When ESI blocks fail to set a TTL (Time To Live), Fastly cannot cache them — it has to re-request every block on every page load. This directly explains the 4% cache hit rate. Fixing this one issue could bring cache hit rate from 4% to 70%+.',
    action: 'Identify which ESI blocks are missing TTL configuration. Check Fastly module configuration in Stores > Config > Fastly. Ensure all ESI block TTLs are set.',
  },
  {
    severity: 'HIGH',
    count: 1,
    period: 'May 12, 2026',
    title: 'Search Indexer Broken — Products May Be Missing From Search',
    error: 'TypeError: Magento\\CatalogSearch\\Model\\Indexer\\Fulltext\\Interceptor::__construct() Argument #7 ($data) must be of type array, null given.',
    file: 'vendor/magento/framework/ObjectManager/Factory/AbstractFactory.php:121',
    trigger: 'Search indexer run',
    explanation: 'The full-text search indexer is throwing a type error and failing to run. This means any products added, updated, or modified since the last successful index run may not appear in search results. Customers searching for products could get no results or incorrect results silently — there is no customer-facing error message.',
    action: 'Run: bin/magento indexer:status. If search indexer shows "invalid", run: bin/magento indexer:reindex catalogsearch_fulltext. If it fails, delete generated/code and regenerate.',
  },
  {
    severity: 'LOW',
    count: 11,
    period: 'Today (May 12, 2026)',
    title: 'Katapult Logging Same Quote ID Repeatedly',
    error: 'katapultLogger.DEBUG: Saving Quote Id on the current session: 3393629 (same ID, 11 separate log entries)',
    file: 'var/log/katapult.log',
    trigger: 'Multiple page loads throughout the day',
    explanation: 'The Katapult payment module is repeatedly logging the same quote/cart ID (3393629) across 11 separate session events spanning the full day. This suggests the module is not clearing its session state correctly between different user sessions, or a test session is persisting. While low severity now, this could indicate a session isolation bug where different users share cart state.',
    action: 'Investigate Katapult session management. Verify cart ID 3393629 is not a production customer cart leaking into staging.',
  },
]

// ─── Security Patches ────────────────────────────────────────────────────────
const securityPatches = {
  applied: [
    { id: 'VULN-31609', name: 'Email Template Cache Key Vulnerability', risk: 'Attackers bypass cache isolation to read other users\' emails' },
    { id: 'VULN-32437', name: 'Web API Arbitrary Object Injection', risk: 'Remote code execution via REST API — an attacker can instantiate any PHP class' },
    { id: 'ACSD-64178', name: 'GraphQL Security Fix', risk: 'Data exposure via GraphQL queries' },
    { id: 'ACSD-63469', name: 'Order Processing Vulnerability', risk: 'Order manipulation' },
    { id: 'ACSD-51884', name: 'Payment Processing Security', risk: 'Payment data exposure' },
    { id: 'ACSD-53824', name: 'Report Data Exposure', risk: 'Unauthorized access to report data' },
  ],
  pending: [
    { id: 'APSB26-05', name: 'Adobe Commerce Security Bulletin', status: 'Staged — NOT in production', risk: 'Known vulnerabilities publicly documented, production unpatched' },
  ],
  totalHotfixes: 178,
}

// ─── Full Task List ───────────────────────────────────────────────────────────
const allTasks: TaskRow[] = [
  // May 2026
  { name: 'Home page optimization', owner: 'Max Alekseyev', status: 'Working on it', priority: '', created: '2026-05-08', elapsed: 4, jrEst: '3–5 days', srEst: '1–2 days', flag: 'ok', commitRef: '—' },
  { name: 'Main home banner refactoring', owner: 'Max Alekseyev', status: 'Done', priority: '', created: '2026-05-05', elapsed: 2, jrEst: '2–3 days', srEst: '4–6 hrs', flag: 'ok', commitRef: 'PR #139 · May 7' },
  { name: 'CSP errors', owner: 'Unassigned', status: 'On Hold', priority: '', created: '2026-05-05', elapsed: 7, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: '—' },
  { name: 'Fonts revision', owner: 'Max Alekseyev', status: 'In Progress', priority: '', created: '2026-05-05', elapsed: 7, jrEst: '1–2 days', srEst: '2–4 hrs', flag: 'ok', commitRef: '—' },
  { name: 'Small performance fixes', owner: 'Max Alekseyev', status: 'Done', priority: '', created: '2026-05-04', elapsed: 1, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: 'May 4–5 commits' },
  { name: 'Remove Kount from Website', owner: 'Faisal Khalil', status: 'Not Started', priority: '', created: '2026-05-04', elapsed: 8, jrEst: '1 day', srEst: '4 hrs', flag: 'ok', commitRef: '—' },
  { name: 'Disabling Ajax on Amasty layered nav', owner: 'Faisal Khalil', status: 'Working on it', priority: '', created: '2026-05-01', elapsed: 11, jrEst: '4–8 hrs', srEst: '1–2 hrs', flag: 'ok', commitRef: '—' },
  // April 2026
  { name: 'PDP Accessibility, Best practices, SEO fixes', owner: 'Max Alekseyev', status: 'Done', priority: 'Medium', created: '2026-04-30', elapsed: 7, jrEst: '2–4 days', srEst: '1–2 days', flag: 'ok', commitRef: 'Apr 22–30' },
  { name: 'Gallery image preload doubling', owner: 'Max Alekseyev', status: 'Done', priority: 'High', created: '2026-04-30', elapsed: 1, jrEst: '1–2 days', srEst: '2–4 hrs', flag: 'ok', commitRef: 'PR #128/#129 · Apr 30' },
  { name: 'PDP optimization', owner: 'Max Alekseyev', status: 'Working on it', priority: 'High', created: '2026-04-29', elapsed: 13, jrEst: '3–5 days', srEst: '1–2 days', flag: 'ok', commitRef: '—' },
  { name: 'Remove footer image preload (render-blocking)', owner: 'Max Alekseyev', status: 'Closed', priority: 'High', created: '2026-04-29', elapsed: 1, jrEst: '2–4 hrs', srEst: '30 min', flag: 'ok', commitRef: 'Apr 30' },
  { name: 'Fix Missing Merchant Contact Data (Worldpay)', owner: 'Unassigned', status: 'Not Started', priority: 'Critical', created: '2026-04-28', elapsed: 14, jrEst: '1–2 days', srEst: '2–4 hrs', flag: 'concern', commitRef: '—', type: 'Bug' },
  { name: 'Gallery optimization', owner: 'Max Alekseyev', status: 'Done', priority: 'High', created: '2026-04-27', elapsed: 1, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: 'Apr 28' },
  // March 2026
  { name: 'Fix Protection Plan vs Service Pro Plan popup (MM-79)', owner: 'Anna Holubiatnikova', status: 'Working on it', priority: 'High', created: '2026-03-24', elapsed: 49, jrEst: '2–3 days', srEst: '4–8 hrs', flag: 'concern', commitRef: 'MM-79 branch · Apr 8–9', type: 'Bug' },
  { name: 'Fix Fastly Cache Query Parameter Handling', owner: 'Anna Holubiatnikova', status: 'Not Started', priority: 'Critical', created: '2026-03-25', elapsed: 48, jrEst: '5–10 days', srEst: '2–3 days', flag: 'concern', commitRef: '—', type: 'Bug' },
  { name: 'Fix "Add to Cart" 404 Error', owner: 'Anna Holubiatnikova', status: 'Pending Deploy', priority: 'Critical', created: '2026-03-25', elapsed: 48, jrEst: '4–8 hrs', srEst: '1–2 hrs', flag: 'concern', commitRef: 'Pending prod deploy', type: 'Bug' },
  { name: 'Fix "Apply Now" (PayPal) Button Not Working', owner: 'Anna Holubiatnikova', status: 'Not Started', priority: 'Critical', created: '2026-03-25', elapsed: 48, jrEst: '1–2 days', srEst: '2–4 hrs', flag: 'concern', commitRef: '—', type: 'Bug' },
  { name: 'Fix Checkout Page Console Errors', owner: 'Unassigned', status: 'Working on it', priority: 'High', created: '2026-03-25', elapsed: 48, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'concern', commitRef: '—', type: 'Bug' },
  { name: 'Compare Page broken', owner: 'Unassigned', status: 'Not Started', priority: 'Low', created: '2026-03-25', elapsed: 48, jrEst: '4–8 hrs', srEst: '1–2 hrs', flag: 'ok', commitRef: '—', type: 'Bug' },
  { name: 'Review & Apply Magento Security Update (APS B26-05)', owner: 'Anna Holubiatnikova', status: 'Pending Deploy', priority: 'Critical', created: '2026-03-11', elapsed: 62, jrEst: '4–8 hrs', srEst: '2–4 hrs', flag: 'concern', commitRef: 'branch APSB26-05-updatem2' },
  // February 2026
  { name: 'SEO Technical Issues (parent)', owner: 'Faisal Khalil / Anna H.', status: 'Working on it', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '—', srEst: '—', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Pages Loading in Two URL Versions', owner: 'Divesh / Anna H.', status: 'Pending Deploy', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Hreflang Conflicts', owner: 'Divesh / Faisal', status: 'Not Started', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Incorrect Hreflang Links', owner: 'Divesh / Anna H.', status: 'Pending Deploy', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1 day', srEst: '2–4 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Incorrect Pages in sitemap.xml', owner: 'Divesh / Faisal', status: 'In Progress', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1 day', srEst: '2–4 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ HTTPS pages leading to HTTP', owner: 'Divesh / Faisal', status: 'In Progress', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '4–8 hrs', srEst: '1–2 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Duplicate Title Tags', owner: 'Divesh / Anna H.', status: 'Pending Deploy', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Duplicate Meta Descriptions', owner: 'Divesh / Anna H.', status: 'Pending Deploy', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1 day', srEst: '2–4 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Meta Descriptions Missing', owner: 'Divesh / Anna H.', status: 'Working on it', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '2–3 days', srEst: '1 day', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Duplicate Content', owner: 'Divesh / Faisal / Anna H.', status: 'Pending Deploy', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '2–3 days', srEst: '1 day', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Too Large HTML Size', owner: 'Divesh / Faisal', status: 'Not Started', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '3–5 days', srEst: '1–2 days', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Unminified JavaScript', owner: 'Divesh / Faisal', status: 'Not Started', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1 day', srEst: '2–4 hrs', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: '  ↳ No Anchor Text', owner: 'Divesh / Faisal / Anna H.', status: 'Working on it', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'ok', commitRef: '—', type: 'SEO' },
  { name: '  ↳ Slow Load Speed', owner: 'Divesh', status: 'Not Started', priority: '', created: '2026-02-03', elapsed: 98, jrEst: '—', srEst: '—', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: 'Upgrade IWD Order Manager Module', owner: 'Faisal Khalil', status: 'Not Started', priority: '', created: '2026-02-06', elapsed: 95, jrEst: '1–2 days', srEst: '4–8 hrs', flag: 'aged', commitRef: '—' },
  { name: 'Review Magento logs', owner: 'Faisal Khalil', status: 'Not Started', priority: '', created: '2026-02-12', elapsed: 89, jrEst: '4–8 hrs', srEst: '2 hrs', flag: 'aged', commitRef: '—' },
  { name: 'Reduce Production DB Size', owner: 'Anna Holubiatnikova', status: 'Not Started', priority: '', created: '2026-02-12', elapsed: 89, jrEst: '1–2 days', srEst: '4–8 hrs', flag: 'aged', commitRef: '—' },
  { name: 'Order PDF messed up', owner: 'Faisal Khalil', status: 'Pending Deploy', priority: '', created: '2026-02-23', elapsed: 78, jrEst: '4–8 hrs', srEst: '1–2 hrs', flag: 'concern', commitRef: 'Pending prod deploy' },
  // January 2026
  { name: 'Fix URL Trailing Slash Inconsistency (SEO)', owner: 'Anna Holubiatnikova', status: 'Not Started', priority: 'High', created: '2026-01-15', elapsed: 117, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'aged', commitRef: '—', type: 'SEO' },
  { name: 'Configurable Product File Upload Button Overlap (Admin)', owner: 'Unassigned', status: 'Not Started', priority: 'Low', created: '2026-01-09', elapsed: 123, jrEst: '2–4 hrs', srEst: '30 min', flag: 'aged', commitRef: '—', type: 'Bug' },
  // December 2025
  { name: 'Investigate: Place order action performance', owner: 'Anna Holubiatnikova', status: 'Blocked', priority: '', created: '2025-12-30', elapsed: 133, jrEst: '3–5 days', srEst: '1–2 days', flag: 'aged', commitRef: '—' },
  { name: 'ADA Accessibility Audit (parent)', owner: 'Anna H. / Faisal Khalil', status: 'Blocked', priority: 'Medium', created: '2025-12-29', elapsed: 134, jrEst: '2–4 weeks', srEst: '1–2 weeks', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Keyboard Navigation Issues', owner: 'Faisal Khalil', status: 'Pending UAT', priority: 'Highest', created: '2025-12-29', elapsed: 134, jrEst: '2–3 days', srEst: '1 day', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Screen Reader Compatibility', owner: 'Faisal Khalil', status: 'Pending UAT', priority: 'High', created: '2025-12-29', elapsed: 134, jrEst: '2–3 days', srEst: '1 day', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Form Labels & Error Messaging', owner: 'Faisal Khalil', status: 'Not Started', priority: 'High', created: '2025-12-29', elapsed: 134, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Focus Order & Focus Visibility', owner: 'Faisal Khalil', status: 'Not Started', priority: 'High', created: '2025-12-29', elapsed: 134, jrEst: '1–2 days', srEst: '4–6 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Modal / Popup Accessibility', owner: 'Faisal Khalil', status: 'Not Started', priority: 'Medium', created: '2025-12-29', elapsed: 134, jrEst: '1 day', srEst: '4 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Heading Structure & Organization', owner: 'Faisal Khalil', status: 'Not Started', priority: 'Medium', created: '2025-12-29', elapsed: 134, jrEst: '1 day', srEst: '2–4 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Image Text & Link Clarity', owner: 'Unassigned', status: 'Not Started', priority: 'Medium', created: '2025-12-29', elapsed: 134, jrEst: '1 day', srEst: '2–4 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Color Contrast & Visual Readability', owner: 'Unassigned', status: 'Not Started', priority: 'Low', created: '2025-12-29', elapsed: 134, jrEst: '4–8 hrs', srEst: '2–4 hrs', flag: 'aged', commitRef: '—' },
  { name: '  ↳ Automated Tool Findings Cleanup', owner: 'Unassigned', status: 'Not Started', priority: 'Low', created: '2025-12-29', elapsed: 134, jrEst: '4–8 hrs', srEst: '2–4 hrs', flag: 'aged', commitRef: '—' },
  { name: 'Blog Posts on Homepage (A/B Test — On Hold)', owner: 'Faisal Khalil', status: 'Not Started', priority: '', created: '2025-12-23', elapsed: 140, jrEst: '1 day', srEst: '4–6 hrs', flag: 'ok', commitRef: '—', type: 'A/B Test' },
  { name: 'Checkout Optimizations', owner: 'Anna Holubiatnikova', status: 'Done', priority: 'High', created: '2025-12-23', elapsed: 64, jrEst: '3–5 days', srEst: '1–2 days', flag: 'scope', commitRef: 'Feb 25 commits' },
  { name: 'BUG: Protection Plan Pricing Sometimes $0', owner: 'Anna Holubiatnikova', status: 'In Progress', priority: 'Medium', created: '2025-12-15', elapsed: 148, jrEst: '1–2 days', srEst: '4–8 hrs', flag: 'aged', commitRef: '—', type: 'Bug' },
  { name: 'Investigate Admin CC Decline (Accept.js Error)', owner: 'Unassigned', status: 'Not Started', priority: 'Medium', created: '2025-12-13', elapsed: 150, jrEst: '1–2 days', srEst: '4–8 hrs', flag: 'aged', commitRef: '—', type: 'Bug' },
  { name: 'Payment showing "total due" despite captured/settled Auth', owner: 'Anna Holubiatnikova', status: 'Not Started', priority: 'Medium', created: '2025-12-19', elapsed: 144, jrEst: '1–2 days', srEst: '4–8 hrs', flag: 'aged', commitRef: '—', type: 'Bug' },
]

// ─── Vendor Quote Data ────────────────────────────────────────────────────────
const criteoQuote = {
  vendor: 'Peter (external vendor)',
  project: 'Criteo Offline Sales Integration',
  items: [
    { task: 'Implement API for offline conversions', vendorEst: '5–7h', seniorEst: '3–5h', juniorEst: '8–12h', verdict: 'reasonable', note: 'Criteo\'s conversion API is well-documented. A senior dev familiar with Magento order export can do this in 3–5h.' },
    { task: 'Generate the offline sales file', vendorEst: '3–4h', seniorEst: '2–3h', juniorEst: '5–8h', verdict: 'reasonable', note: 'CSV/JSON export of Magento orders. Straightforward mapping task. Reasonable estimate.' },
    { task: 'Push orders to the Criteo FTP', vendorEst: '5–7h', seniorEst: '2–3h', juniorEst: '4–6h', verdict: 'high', note: 'FTP/SFTP upload with a cron job is typically 2–3 hours including error handling and scheduling. 5–7h seems inflated for this step.' },
    { task: 'Testing', vendorEst: '1–2h', seniorEst: '3–5h', juniorEst: '4–6h', verdict: 'low', note: 'Testing a conversion integration requires verifying data arrives correctly, checking attribution accuracy, and confirming nothing breaks on edge cases (refunds, partial orders). 1–2h is insufficient.' },
  ],
  totalVendor: '13–20h',
  totalSenior: '10–16h',
  totalJunior: '21–32h',
  verdict: 'The total range (13–20h) is reasonable but the breakdown has two concerns: the FTP step is over-estimated and testing is under-estimated. More importantly — confirm this is a mid-level developer rate. At $75–100/hr, this is a $975–$2,000 task. Request a fixed-price quote to avoid scope creep on the upper end.',
}

// ─── Monthly commit data ──────────────────────────────────────────────────────
const monthlyCommits = [
  { month: 'Nov 25', count: 18 }, { month: 'Dec 25', count: 22 }, { month: 'Jan 26', count: 14 },
  { month: 'Feb 26', count: 28 }, { month: 'Mar 26', count: 38 }, { month: 'Apr 26', count: 42 }, { month: 'May 26', count: 19 },
]

const teamMembers = [
  { initials: 'FK', name: 'Faisal Khalil', role: 'Tech Lead / DevOps', focus: 'Deployments, integrations, release management', commits: 183, tasks: 10, color: 'from-blue-600 to-blue-800' },
  { initials: 'AH', name: 'Anna Holubiatnikova', role: 'Backend Developer', focus: 'Payment logic, bug fixes, SEO technical', commits: 147, tasks: 14, color: 'from-purple-600 to-purple-800' },
  { initials: 'MA', name: 'Max Alekseyev', role: 'Frontend Developer', focus: 'Design, UX, performance, gallery', commits: 61, tasks: 8, color: 'from-emerald-600 to-emerald-800' },
  { initials: 'DV', name: 'Divesh', role: 'SEO Specialist', focus: 'Technical SEO, sitemap, hreflang', commits: 8, tasks: 12, color: 'from-amber-600 to-amber-800' },
]

const timeline = [
  { date: 'May 7', task: 'Home banner refactoring merged', dev: 'Max Alekseyev', pr: 'PR #139', days: 2 },
  { date: 'Apr 30', task: 'Gallery image doubling bug fixed (+ revert cycle)', dev: 'Max Alekseyev', pr: 'PR #128 / #129', days: 1 },
  { date: 'Apr 28', task: 'Mobile gallery optimization', dev: 'Max Alekseyev', pr: 'release_katapult_pdp', days: 1 },
  { date: 'Apr 22', task: 'PDP CSS fixes & accessibility improvements', dev: 'Max Alekseyev', pr: 'Various commits', days: 7 },
  { date: 'Apr 17', task: 'Payment methods description feature', dev: 'Anna H.', pr: 'payment_methods_description', days: 1 },
  { date: 'Apr 9', task: 'Protection plan modal content (MM-79) — ongoing', dev: 'Anna H.', pr: 'MM-79 branch', days: 16 },
  { date: 'Mar 26', task: 'Affirm & Attentive modules integrated', dev: 'Faisal Khalil', pr: 'release_affirm_attentive', days: 1 },
  { date: 'Mar 26', task: 'Sansec polyshell security fix (MM-73)', dev: 'Anna H.', pr: 'MM-73', days: 2 },
  { date: 'Mar 19', task: 'Klevu search upgraded to v2 templating', dev: 'Faisal Khalil', pr: 'Various commits', days: 3 },
  { date: 'Mar 11', task: 'MM-67: PageSpeed / Core Web Vitals optimizations', dev: 'Anna H.', pr: 'MM-67', days: 8 },
  { date: 'Feb 25', task: 'Checkout popup fix + CSP corrections', dev: 'Faisal Khalil', pr: 'release_20260225', days: 1 },
  { date: 'Feb 27', task: 'MM-61: Price discount calculation bug (4 commits)', dev: 'Anna H.', pr: 'MM-61', days: 4 },
]

const recommendations = [
  {
    timeframe: 'Immediate (This Week)',
    color: 'border-red-500 bg-red-500/10', badge: 'bg-red-500',
    items: [
      { action: 'Fix PDP layout crash (484 errors today on staging) — find duplicate "compare" block in layout XML', owner: 'Faisal Khalil', effort: '1–2 hrs' },
      { action: 'Rotate all 6 vendor Composer credentials — auth.json in repository history', owner: 'Faisal Khalil', effort: '2–4 hrs' },
      { action: 'Assign owner and begin Worldpay merchant data fix — ~14 days left in 30-day compliance window', owner: 'Anna H.', effort: '2–4 hrs' },
      { action: 'Replace eval() with JSON.parse() in Klevu custom-search-page.js:173 — one line change', owner: 'Any dev', effort: '30 min' },
      { action: 'Investigate search indexer TypeError — products may be missing from search results', owner: 'Anna H.', effort: '1–2 hrs' },
    ],
  },
  {
    timeframe: 'Within 30 Days',
    color: 'border-amber-500 bg-amber-500/10', badge: 'bg-amber-500',
    items: [
      { action: 'Fix ESI block TTL configuration — directly causes the 4% Fastly cache hit rate', owner: 'Anna H.', effort: '4–8 hrs (sr)' },
      { action: 'Deploy Magento security patch APS B26-05 to production', owner: 'Faisal Khalil', effort: '2–4 hrs' },
      { action: 'Deploy Add to Cart 404 fix — critical bug pending prod deploy for 48+ days', owner: 'Faisal Khalil', effort: 'Deploy only' },
      { action: 'Fix PayPal "Apply Now" button — broken for 48+ days, direct revenue impact', owner: 'Assign', effort: '2–4 hrs (sr)' },
      { action: 'Remove all console.log statements — add ESLint no-console rule to prevent recurrence', owner: 'Any dev', effort: '2–4 hrs' },
      { action: 'Fix innerHTML XSS in 3 PageBuilder admin preview files — replace with textContent or sanitize', owner: 'Any dev', effort: '2–4 hrs' },
    ],
  },
  {
    timeframe: 'Within 90 Days',
    color: 'border-blue-500 bg-blue-500/10', badge: 'bg-blue-500',
    items: [
      { action: 'Unblock ADA Accessibility audit — 134 days stale, active legal risk under US ADA law', owner: 'Faisal + Anna', effort: '1–2 weeks' },
      { action: 'Investigate Katapult session isolation issue (same quote ID logging across sessions)', owner: 'Faisal Khalil', effort: '4–8 hrs' },
      { action: 'Implement commit message standards — require ticket reference (MM-XX) in all commits', owner: 'Faisal Khalil', effort: '4 hrs' },
      { action: 'Add CI pipeline (GitHub Actions) — no automated testing or security scan currently on PRs', owner: 'Faisal Khalil', effort: '1–2 days' },
      { action: 'Fix URL trailing slash SEO issue — 117 days stale, hurting search ranking', owner: 'Anna H.', effort: '4–6 hrs (sr)' },
      { action: 'Refactor Image.php (961 lines) and Sales Report (1,036 lines) — SOLID violations', owner: 'Anna H.', effort: '2–3 days (sr)' },
      { action: 'Remove ObjectManager::getInstance() from custom classes — replace with DI injection', owner: 'Anna H.', effort: '1 day' },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SeverityBadge({ level }: { level: string }) {
  const s: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
    LOW: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  }
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wider ${s[level] ?? s.LOW}`}>{level}</span>
}

function StatusPill({ status }: { status: string }) {
  const m: Record<string, string> = {
    'Done': 'bg-emerald-500/20 text-emerald-400', 'Working on it': 'bg-blue-500/20 text-blue-400',
    'Pending Deploy': 'bg-purple-500/20 text-purple-400', 'Pending UAT': 'bg-violet-500/20 text-violet-400',
    'In Progress': 'bg-cyan-500/20 text-cyan-400', 'Not Started': 'bg-surface text-muted border border-border-subtle',
    'Blocked': 'bg-red-500/20 text-red-400', 'On Hold': 'bg-yellow-500/20 text-yellow-400', 'Closed': 'bg-emerald-500/20 text-emerald-400',
  }
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${m[status] ?? 'bg-surface text-muted'}`}>{status}</span>
}

function FlagBadge({ flag }: { flag: string }) {
  if (flag === 'ok') return <span className="text-emerald-400 text-xs font-bold">On Track</span>
  if (flag === 'scope') return <span className="text-amber-400 text-xs font-bold">Scope Creep</span>
  if (flag === 'concern') return <span className="text-red-400 text-xs font-bold">Concern</span>
  if (flag === 'aged') return <span className="text-red-500 text-xs font-bold">Stale</span>
  return null
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-bg rounded-lg p-3 text-xs font-mono text-emerald-300/90 overflow-x-auto border border-border-subtle leading-relaxed whitespace-pre-wrap">
      {code}
    </pre>
  )
}

function DonutChart() {
  const segments = [
    { label: 'Done / Closed', count: 8, color: '#10b981' }, { label: 'Active', count: 18, color: '#3b82f6' },
    { label: 'Not Started', count: 26, color: '#4b5563' }, { label: 'Blocked', count: 2, color: '#ef4444' },
    { label: 'On Hold', count: 1, color: '#f59e0b' },
  ]
  const total = segments.reduce((a, s) => a + s.count, 0)
  const r = 40; const cx = 60; const cy = 60; const circ = 2 * Math.PI * r; let off = 0
  return (
    <div className="flex items-center gap-8">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2d42" strokeWidth="18" />
        {segments.map((s) => {
          const d = (s.count / total) * circ; const el = (
            <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="18"
              strokeDasharray={`${d} ${circ - d}`} strokeDashoffset={-off}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
          ); off += d; return el
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#e8edf5" fontSize="18" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#8d97aa" fontSize="9">tasks</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted text-xs">{s.label}</span>
            <span className="text-ink font-semibold ml-auto pl-4 text-xs">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommitBarChart() {
  const max = Math.max(...monthlyCommits.map((m) => m.count))
  return (
    <div className="flex items-end gap-2 h-28">
      {monthlyCommits.map((m) => (
        <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted">{m.count}</span>
          <div className="w-full rounded-t bg-gold/60 hover:bg-gold transition-colors" style={{ height: `${(m.count / max) * 100}%`, minHeight: 4 }} />
          <span className="text-[10px] text-muted text-center leading-tight">{m.month}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MedmartDemo() {
  const [activeSection, setActiveSection] = useState('summary')

  useEffect(() => {
    document.title = 'MedMart Development Audit — Q1/Q2 2026'
    return () => { document.title = 'Ryan Patt' }
  }, [])

  const sections = [
    { id: 'summary', label: 'Summary' }, { id: 'health', label: 'Health Scores' }, { id: 'staging-logs', label: 'Live Errors' },
    { id: 'security', label: 'Security' }, { id: 'js-audit', label: 'JS Audit' },
    { id: 'solid', label: 'Code Quality' }, { id: 'patches', label: 'Patches' },
    { id: 'tasks', label: 'Tasks' }, { id: 'team', label: 'Team' },
    { id: 'timeline', label: 'Timeline' }, { id: 'time-analysis', label: 'Dev Time' },
    { id: 'vendor', label: 'Vendor Quote' }, { id: 'recommendations', label: 'Actions' },
  ]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* Sticky nav */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gold/20 border border-gold/40 flex items-center justify-center">
              <span className="text-gold font-bold text-xs">M2</span>
            </div>
            <div>
              <span className="font-display font-semibold text-ink text-sm">MedMart</span>
              <span className="text-muted text-xs ml-2 hidden sm:inline">Development Audit · Q1/Q2 2026</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-0.5 flex-wrap">
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${activeSection === s.id ? 'bg-gold/20 text-gold' : 'text-muted hover:text-ink'}`}>
                {s.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted hidden sm:block">May 12, 2026</span>
            <a href="/" className="text-xs text-muted hover:text-gold transition-colors border border-border-subtle px-3 py-1.5 rounded">← ryanpatt.com</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">

        {/* ── 1. Executive Summary ─── */}
        <section id="summary">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Executive Summary</span></div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-ink mb-3">MedMart Platform Audit</h1>
            <p className="text-muted text-lg max-w-2xl">Comprehensive review of the Magento 2 e-commerce platform — security posture, staging log errors, code quality, development velocity, and risk exposure. Prepared for non-technical leadership.</p>
            <p className="text-muted text-sm mt-2">Audit period: Feb 1 – May 12, 2026 · Repository: Med-mart/mmr-web-m2 (<span className="text-emerald-400 font-medium">Private</span>) · Prepared by <span className="text-gold">Ryan Patt</span>, Solutions Architect</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { value: '92', label: 'Commits in 90 Days', sub: 'Feb – May 2026', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5' },
              { value: '484', label: 'Critical Errors Today', sub: 'Staging PDP crashes', color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
              { value: '55', label: 'Active Tasks', sub: '26 not yet started', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5' },
              { value: '4%', label: 'CDN Cache Hit Rate', sub: 'Industry standard: 85%+', color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/5' },
            ].map((kpi) => (
              <div key={kpi.label} className={`rounded-xl border p-5 ${kpi.bg}`}>
                <div className={`font-display font-extrabold text-4xl mb-1 ${kpi.color}`}>{kpi.value}</div>
                <div className="text-ink font-semibold text-sm">{kpi.label}</div>
                <div className="text-muted text-xs mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Platform', value: 'Magento 2.4.8 Commerce Cloud (Adobe Commerce Cloud Pro)', icon: '🏗' },
              { label: 'Repository', value: 'Med-mart/mmr-web-m2 — Private · Single codebase, 3 storefronts', icon: '🔒' },
              { label: 'Custom Code', value: '48 modules · 80,581 lines PHP', icon: '💻' },
              { label: 'Storefronts', value: 'medmartonline.com (US) · canada.medmartonline.com · medmartsupply.com', icon: '🌐' },
              { label: 'Infrastructure', value: 'Adobe Commerce Cloud Pro · Fastly CDN · Redis · OpenSearch', icon: '☁️' },
              { label: 'Integrations', value: 'Affirm · Amazon Pay · Worldpay · Katapult · Avalara · Klaviyo', icon: '🔗' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-surface rounded-xl p-4 border border-border-subtle">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div><div className="text-muted text-xs mb-0.5">{item.label}</div><div className="text-ink text-sm font-medium">{item.value}</div></div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Health Scores ─── */}
        <section id="health">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Platform Health</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Health Score Overview</h2>
            <p className="text-muted">Scored 0–10 across 8 dimensions. Each score is based on findings from this audit. Detailed evidence is in the sections below.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Security',
                score: 3,
                concern: 'Credentials in repo, eval() XSS, compliance breach, unpatched production server.',
                action: 'Rotate credentials. Fix eval(). Deploy APS B26-05. Resolve Worldpay compliance.',
                link: '#security',
              },
              {
                label: 'Code Quality',
                score: 4,
                concern: '961-line God class, ObjectManager anti-pattern, 23 console.logs in production, no ESLint enforcement.',
                action: 'Remove debug logs. Fix innerHTML XSS. Plan refactor of top 3 oversized files.',
                link: '#solid',
              },
              {
                label: 'Project Integrity',
                score: 3,
                concern: '26 tasks not started, 4 critical bugs unresolved 48+ days, 3 tickets blocked 130+ days, 4 critical items unassigned.',
                action: 'Assign owners to all critical tasks. Set SLAs for critical bug resolution (target: 72 hrs).',
                link: '#tasks',
              },
              {
                label: 'Dev Velocity',
                score: 6,
                concern: 'Good commit cadence (92/90 days) and weekly releases, but some tasks running 7–10× over senior dev estimates.',
                action: 'Introduce time-boxing. Require escalation when a task exceeds 2× estimate.',
                link: '#time-analysis',
              },
              {
                label: 'Infrastructure',
                score: 4,
                concern: '4% Fastly cache hit rate, 484 staging crashes today, ESI TTL misconfiguration. One codebase serves 3 storefronts (US, Canada, Supply) — shared infrastructure risk.',
                action: 'Fix ESI TTL (resolves cache). Fix PDP layout conflict. Add GitHub Actions CI. Validate per-store Fastly config.',
                link: '#staging-logs',
              },
              {
                label: 'Testing & QA',
                score: 2,
                concern: 'No automated test suite found. No CI checks on pull requests. Staging bugs are reaching production.',
                action: 'Add PHPUnit for custom modules. Add ESLint + build check to CI. Enforce staging UAT gate.',
                link: '#recommendations',
              },
              {
                label: 'Documentation',
                score: 3,
                concern: 'No .env.example, 13 @deprecated/@todo markers in production code, vague commit messages, no onboarding guide.',
                action: 'Add .env.example. Enforce commit message standard (MM-XX prefix). Clean up deprecated markers.',
                link: '#recommendations',
              },
              {
                label: 'Dependency Health',
                score: 5,
                concern: 'minimum-stability: alpha allows pre-release packages in production. No automated composer audit in CI.',
                action: 'Change stability to stable. Add composer audit to CI pipeline. Plan M2.4.9 upgrade assessment.',
                link: '#patches',
              },
            ].map((item) => {
              const pct = (item.score / 10) * 100
              const color =
                item.score <= 3 ? { ring: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/30', label: 'text-red-400', track: 'bg-red-500/20' } :
                item.score <= 5 ? { ring: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30', label: 'text-amber-400', track: 'bg-amber-500/20' } :
                item.score <= 7 ? { ring: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30', label: 'text-yellow-400', track: 'bg-yellow-500/20' } :
                                  { ring: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30', label: 'text-emerald-400', track: 'bg-emerald-500/20' }
              return (
                <a key={item.label} href={item.link}
                  className={`group block rounded-xl border bg-surface p-5 hover:bg-card transition-colors cursor-pointer ${color.border}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-ink font-semibold text-sm">{item.label}</span>
                    <span className={`font-display font-extrabold text-2xl leading-none ${color.ring}`}>{item.score}<span className="text-muted text-sm font-normal">/10</span></span>
                  </div>
                  {/* Score bar */}
                  <div className={`w-full h-1.5 rounded-full mb-3 ${color.track}`}>
                    <div className={`h-full rounded-full ${color.bg}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-muted text-xs leading-relaxed mb-3">{item.concern}</p>
                  <div className="pt-3 border-t border-border-subtle">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">First action</div>
                    <p className={`text-xs leading-relaxed ${color.label} group-hover:opacity-90`}>{item.action}</p>
                  </div>
                </a>
              )
            })}
          </div>
          {/* Overall score bar */}
          <div className="mt-6 bg-surface border border-border-subtle rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-ink font-semibold">Overall Platform Health</div>
                <div className="text-muted text-xs mt-0.5">Average across 8 dimensions · May 12, 2026</div>
              </div>
              <div className="text-right">
                <span className="font-display font-extrabold text-4xl text-amber-400">3.8</span>
                <span className="text-muted text-lg">/10</span>
              </div>
            </div>
            <div className="w-full h-3 rounded-full bg-card overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-amber-400 transition-all" style={{ width: '38%' }} />
            </div>
            <p className="text-muted text-xs mt-3 leading-relaxed">
              The platform scores below average across most dimensions. The two highest-risk areas are <span className="text-red-400 font-medium">Testing & QA (2/10)</span> and <span className="text-red-400 font-medium">Security (3/10)</span>. With targeted remediation of the immediate action items, this score could realistically reach <span className="text-emerald-400 font-medium">6–7/10</span> within 90 days.
            </p>
          </div>
        </section>

        {/* ── 3. Staging Log Errors ─── */}
        <section id="staging-logs">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Live Staging Errors</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Staging Environment — Active Issues</h2>
            <p className="text-muted">Pulled directly from staging logs today (May 12, 2026). These errors are happening right now.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {stagingErrors.map((e) => (
              <div key={e.title} className={`rounded-xl border p-5 ${e.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-500/5' : e.severity === 'HIGH' ? 'border-orange-500/40 bg-orange-500/5' : 'border-border-subtle bg-surface'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge level={e.severity} />
                      {e.count > 10 && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded">{e.count}× today</span>}
                    </div>
                    <h3 className="text-ink font-semibold text-sm leading-tight">{e.title}</h3>
                  </div>
                </div>
                <div className="bg-bg rounded-lg p-2.5 mb-3 border border-border-subtle">
                  <p className="text-red-300/80 text-xs font-mono leading-relaxed">{e.error}</p>
                </div>
                <p className="text-muted text-xs mb-3 leading-relaxed">{e.explanation}</p>
                <div className="text-xs text-gold font-mono">{e.file}</div>
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <div className="text-xs text-muted mb-1 font-medium uppercase tracking-wider">Recommended Fix</div>
                  <div className="text-xs text-ink">{e.action}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Security Risk Report ─── */}
        <section id="security">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Security Risk Report</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Security Findings</h2>
            <p className="text-muted">From static code analysis, repository audit, and staging log review. Sorted by severity.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-xs font-bold">!</span></div>
            <div>
              <div className="text-amber-400 font-semibold text-sm mb-1">Repository is Private — auth.json Risk is Reduced but Not Eliminated</div>
              <div className="text-amber-300/80 text-sm">The GitHub repo is <strong>private</strong>. This means the credentials are not visible to the general public. However: every developer and contractor who has cloned the repo has a local copy; former team members retain those credentials; git history persists permanently even after the file is deleted; and if repo visibility is ever changed to public, all 6 vendor accounts are instantly compromised. Credentials should still be rotated and the file removed from history.</div>
            </div>
          </div>
          <div className="space-y-3">
            {securityFindings.map((f) => (
              <div key={f.title} className="bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3"><SeverityBadge level={f.severity} /><h3 className="text-ink font-semibold text-sm leading-tight">{f.title}</h3></div>
                <p className="text-muted text-sm mb-3 leading-relaxed">{f.detail}</p>
                {f.credential && (
                  <div className="bg-bg rounded-lg p-3 mb-3 border border-border-subtle">
                    <div className="text-xs text-muted mb-1 font-medium uppercase tracking-wider">Exposed Vendor Accounts</div>
                    <div className="text-xs text-red-400 font-mono">{f.credential}</div>
                  </div>
                )}
                <div className="bg-card rounded-lg p-3">
                  <div className="text-xs text-muted mb-1 font-medium uppercase tracking-wider">Recommended Action</div>
                  <div className="text-sm text-ink">{f.action}</div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle">
                    <span className="text-xs text-muted font-medium uppercase tracking-wider flex-shrink-0">Source</span>
                    <span className="text-xs text-gold font-mono truncate">{f.file}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. JS Audit ─── */}
        <section id="js-audit">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Frontend JavaScript Audit</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">JavaScript Bad Practices</h2>
            <p className="text-muted max-w-3xl">Findings across custom JS files in app/code/MedMart and app/design. Each finding includes the exact file, line number, and actual code that was found.</p>
          </div>
          <div className="space-y-4">
            {jsBadPractices.map((f) => (
              <div key={f.title} className="bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3"><SeverityBadge level={f.severity} /><h3 className="text-ink font-semibold text-sm leading-tight">{f.title}</h3></div>
                <div className="text-xs text-gold font-mono mb-3">{f.file}</div>
                <CodeBlock code={f.code} />
                <p className="text-muted text-sm mt-3 leading-relaxed">{f.explanation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. SOLID Violations ─── */}
        <section id="solid">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Code Quality — SOLID Principles</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">SOLID Principles Review</h2>
            <p className="text-muted max-w-3xl mb-4">SOLID is a set of 5 engineering principles that keep code maintainable and testable. Violations mean: changes take longer, bugs are harder to find, and new features break old ones.</p>
            <div className="grid grid-cols-5 gap-2 text-center mb-6">
              {[['S', 'Single Responsibility', 'One class, one job'], ['O', 'Open/Closed', 'Extend, don\'t modify'], ['L', 'Liskov Substitution', 'Subtypes must be replaceable'], ['I', 'Interface Segregation', 'Small, focused interfaces'], ['D', 'Dependency Inversion', 'Depend on abstractions']].map(([letter, name, desc]) => (
                <div key={letter} className="bg-surface border border-border-subtle rounded-lg p-3">
                  <div className="text-gold font-display font-bold text-2xl mb-1">{letter}</div>
                  <div className="text-ink text-xs font-semibold leading-tight mb-1">{name}</div>
                  <div className="text-muted text-[10px] leading-tight">{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {solidViolations.map((v) => (
              <div key={v.violation} className="bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded text-xs font-bold tracking-wider flex-shrink-0">{v.principle.charAt(0)}</span>
                  <div>
                    <div className="text-gold text-xs mb-0.5 font-medium">{v.principle}</div>
                    <h3 className="text-ink font-semibold text-sm leading-tight">{v.violation}</h3>
                  </div>
                </div>
                <div className="text-xs text-gold font-mono mb-3">{v.file}</div>
                <CodeBlock code={v.code} />
                <p className="text-muted text-sm mt-3 leading-relaxed">{v.explanation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Security Patches ─── */}
        <section id="patches">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Security Patches & Updates</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Patch Management Status</h2>
            <p className="text-muted">Magento 2.4.8 running on Adobe Commerce Cloud. {securityPatches.totalHotfixes} hotfix patches applied via m2-hotfixes directory.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 md:col-span-2">
              <h3 className="text-emerald-400 font-semibold mb-4">Applied — Critical Security Patches</h3>
              <div className="space-y-3">
                {securityPatches.applied.map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <div>
                      <div className="text-ink text-sm font-medium">{p.id} — {p.name}</div>
                      <div className="text-muted text-xs">{p.risk}</div>
                    </div>
                  </div>
                ))}
                <div className="text-muted text-xs pt-2 border-t border-border-subtle">+ {securityPatches.totalHotfixes - securityPatches.applied.length} additional ACSD / MDVA patches applied</div>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5">
              <h3 className="text-red-400 font-semibold mb-4">Pending — NOT in Production</h3>
              {securityPatches.pending.map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <div className="text-ink text-sm font-medium">{p.id}</div>
                    <div className="text-muted text-xs mb-1">{p.name}</div>
                    <div className="text-red-400/80 text-xs">{p.status}</div>
                    <div className="text-muted text-xs mt-1">{p.risk}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border-subtle rounded-xl p-4">
            <div className="text-ink font-semibold text-sm mb-2">Overall Patch Health Assessment</div>
            <p className="text-muted text-sm leading-relaxed">
              The team is actively applying security patches — 178 hotfixes applied is a strong sign of ongoing maintenance.
              Two critical vulnerability patches (VULN-31609 and VULN-32437) covering email cache bypass and API object injection are confirmed applied.
              The outstanding item is APSB26-05 which is staged but not deployed to production.
              Individual patches are not a substitute for major version upgrades — accumulating 178+ patches eventually creates its own maintenance burden.
              Recommendation: evaluate Magento 2.4.9 upgrade timeline.
            </p>
          </div>
        </section>

        {/* ── 7. Task Board ─── */}
        <section id="tasks">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Task Board</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Complete Task List</h2>
            <p className="text-muted">All {allTasks.length} tasks from Monday.com export, including all subtasks.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <h3 className="text-ink font-semibold mb-5">Status Distribution</h3>
              <DonutChart />
            </div>
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <h3 className="text-ink font-semibold mb-4">Priority Breakdown</h3>
              {[{ label: 'Critical', count: 5, color: 'bg-red-500' }, { label: 'High', count: 12, color: 'bg-orange-500' }, { label: 'Medium', count: 8, color: 'bg-yellow-500' }, { label: 'Low', count: 4, color: 'bg-blue-500' }, { label: 'Unspecified', count: 26, color: 'bg-surface border border-border-subtle' }].map((p) => (
                <div key={p.label} className="flex items-center gap-3 mb-2">
                  <span className="text-muted text-sm w-24">{p.label}</span>
                  <div className="flex-1 bg-card rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${p.color} transition-all`} style={{ width: `${(p.count / 55) * 100}%` }} />
                  </div>
                  <span className="text-ink text-sm font-semibold w-6 text-right">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-muted font-medium pb-3 pr-4">Task</th>
                  <th className="text-left text-muted font-medium pb-3 pr-3">Owner</th>
                  <th className="text-left text-muted font-medium pb-3 pr-3">Status</th>
                  <th className="text-left text-muted font-medium pb-3 pr-3">Priority</th>
                  <th className="text-right text-muted font-medium pb-3 pr-3">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {allTasks.map((t) => (
                  <tr key={t.name} className={t.flag === 'concern' ? 'bg-red-500/5' : t.flag === 'aged' && t.elapsed > 90 ? 'bg-amber-500/5' : ''}>
                    <td className="py-2 pr-4">
                      <div className={`font-medium leading-tight ${t.name.startsWith('  ↳') ? 'text-muted pl-2' : 'text-ink'}`}>{t.name}</div>
                      {t.type && <span className="inline-block mt-0.5 px-1.5 py-0 rounded bg-surface border border-border-subtle text-muted text-[10px]">{t.type}</span>}
                    </td>
                    <td className="py-2 pr-3 text-muted">{t.owner}</td>
                    <td className="py-2 pr-3"><StatusPill status={t.status} /></td>
                    <td className="py-2 pr-3">
                      {t.priority === 'Critical' ? <span className="text-red-400 font-bold">Critical</span> :
                        t.priority === 'High' ? <span className="text-orange-400">High</span> :
                        t.priority === 'Medium' ? <span className="text-yellow-400">Medium</span> :
                        t.priority === 'Low' ? <span className="text-blue-400">Low</span> :
                        <span className="text-muted">—</span>}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className={`font-semibold ${t.elapsed > 90 ? 'text-red-400' : t.elapsed > 30 ? 'text-amber-400' : 'text-muted'}`}>{t.elapsed}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 8. Team & Velocity ─── */}
        <section id="team">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Team & Velocity</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Development Team</h2>
            <p className="text-muted">4 active contributors. 92 commits across 90 days with a weekly release cadence.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {teamMembers.map((m) => (
              <div key={m.name} className="bg-surface border border-border-subtle rounded-xl p-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center font-bold text-white text-lg mb-4`}>{m.initials}</div>
                <div className="text-ink font-semibold text-sm mb-0.5">{m.name}</div>
                <div className="text-gold text-xs mb-2">{m.role}</div>
                <div className="text-muted text-xs leading-relaxed mb-4">{m.focus}</div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-card rounded-lg p-2 text-center"><div className="text-ink font-bold text-lg">{m.commits}</div><div className="text-muted text-[10px]">commits</div></div>
                  <div className="flex-1 bg-card rounded-lg p-2 text-center"><div className="text-ink font-bold text-lg">{m.tasks}</div><div className="text-muted text-[10px]">tasks</div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border-subtle rounded-xl p-6">
            <h3 className="text-ink font-semibold mb-2">Monthly Commit Activity (Nov 2025 – May 2026)</h3>
            <p className="text-muted text-sm mb-6">Peak in April 2026 (42 commits), corresponding to performance optimization sprint. May is partial month.</p>
            <CommitBarChart />
          </div>
        </section>

        {/* ── 9. Timeline ─── */}
        <section id="timeline">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Completed Work</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Delivery Timeline</h2>
            <p className="text-muted">Completed tasks with commit references, correlated between Monday.com and Git log.</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border-subtle" />
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="relative pl-14">
                  <div className="absolute left-4 top-4 w-4 h-4 rounded-full border-2 border-gold bg-bg" />
                  <div className="bg-surface border border-border-subtle rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="text-gold text-xs font-mono font-semibold">{item.date}</span>
                      <span className="text-ink font-medium text-sm">{item.task}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                      <span>👤 {item.dev}</span>
                      <span className="font-mono text-muted/70">{item.pr}</span>
                      <span className="ml-auto bg-card px-2 py-0.5 rounded">{item.days} day{item.days !== 1 ? 's' : ''} elapsed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. Time Analysis ─── */}
        <section id="time-analysis">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Dev Time Analysis</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Time Estimates: Jr vs Senior Developer</h2>
            <p className="text-muted mb-4">Elapsed time derived from task creation date. Estimates reflect typical time for a developer of each level on Magento 2.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 mb-6">
            <div className="text-amber-400 font-semibold mb-2">Why does this matter?</div>
            <p className="text-muted text-sm leading-relaxed">A mid-level developer in this stack typically bills at <span className="text-ink font-semibold">$60–90/hr</span>. A senior or technical lead bills at <span className="text-ink font-semibold">$100–150/hr</span>. A task that a senior engineer completes in 4 hours — but takes 7 weeks — costs an estimated <span className="text-red-400 font-bold">$8,400–$11,200</span> vs <span className="text-emerald-400 font-bold">$400–600</span>. The table below shows where elapsed time significantly exceeds estimates.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Task', 'Owner', 'Status', 'Elapsed', 'Jr Dev', 'Senior', 'Verdict'].map((h, i) => (
                    <th key={h} className={`text-muted font-medium pb-3 pr-4 ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {allTasks.filter(t => !t.name.startsWith('  ↳') && t.flag !== 'ok' || ['Gallery image preload doubling', 'Gallery optimization', 'PDP Accessibility, Best practices, SEO fixes', 'Small performance fixes', 'Main home banner refactoring'].includes(t.name)).map((t) => (
                  <tr key={t.name} className={t.flag === 'concern' ? 'bg-red-500/5' : t.flag === 'aged' ? 'bg-amber-500/5' : ''}>
                    <td className="py-2.5 pr-4"><div className="text-ink font-medium">{t.name}</div><div className="text-muted font-mono text-[10px] mt-0.5">{t.commitRef}</div></td>
                    <td className="py-2.5 pr-4 text-muted">{t.owner}</td>
                    <td className="py-2.5 pr-4"><StatusPill status={t.status} /></td>
                    <td className="py-2.5 pr-4 text-right"><span className={`font-bold ${t.elapsed > 30 ? 'text-red-400' : t.elapsed > 14 ? 'text-amber-400' : 'text-muted'}`}>{t.elapsed}d</span></td>
                    <td className="py-2.5 pr-4 text-right text-muted">{t.jrEst}</td>
                    <td className="py-2.5 pr-4 text-right text-muted">{t.srEst}</td>
                    <td className="py-2.5 text-right"><FlagBadge flag={t.flag} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 11. Vendor Quote ─── */}
        <section id="vendor">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Vendor Quote Review</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Criteo Offline Sales Integration — Quote Accuracy Review</h2>
            <p className="text-muted">Quote received from {criteoQuote.vendor} for {criteoQuote.project}. Reviewed against typical effort for this type of work.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Vendor Total', value: criteoQuote.totalVendor, color: 'text-ink', bg: 'bg-surface border-border-subtle' },
              { label: 'Senior Dev Estimate', value: criteoQuote.totalSenior, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/30' },
              { label: 'Junior Dev Estimate', value: criteoQuote.totalJunior, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/30' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-5 ${item.bg}`}>
                <div className={`font-display font-extrabold text-3xl mb-1 ${item.color}`}>{item.value}</div>
                <div className="text-muted text-sm">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle">
                <tr>
                  {['Task', 'Vendor Est.', 'Senior Est.', 'Junior Est.', 'Assessment'].map((h) => (
                    <th key={h} className="text-left text-muted text-xs font-medium p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {criteoQuote.items.map((item) => (
                  <tr key={item.task} className={item.verdict === 'high' ? 'bg-orange-500/5' : item.verdict === 'low' ? 'bg-blue-500/5' : ''}>
                    <td className="p-4 text-ink font-medium text-sm">{item.task}</td>
                    <td className="p-4 text-ink font-mono text-sm">{item.vendorEst}</td>
                    <td className="p-4 text-emerald-400 font-mono text-sm">{item.seniorEst}</td>
                    <td className="p-4 text-amber-400 font-mono text-sm">{item.juniorEst}</td>
                    <td className="p-4">
                      {item.verdict === 'reasonable' && <span className="text-emerald-400 text-xs font-bold">Reasonable</span>}
                      {item.verdict === 'high' && <span className="text-orange-400 text-xs font-bold">Over-estimated</span>}
                      {item.verdict === 'low' && <span className="text-blue-400 text-xs font-bold">Under-estimated</span>}
                      <div className="text-muted text-xs mt-1 leading-relaxed">{item.note}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-card border border-border-subtle rounded-xl p-4">
            <div className="text-gold font-semibold text-sm mb-2">Overall Assessment</div>
            <p className="text-muted text-sm leading-relaxed">{criteoQuote.verdict}</p>
          </div>
        </section>

        {/* ── 12. Recommendations ─── */}
        <section id="recommendations">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3"><div className="h-px w-8 bg-gold" /><span className="text-gold text-xs font-medium tracking-widest uppercase">Recommendations</span></div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">Prioritized Action Plan</h2>
            <p className="text-muted">Ordered by urgency and business impact. Each item includes a suggested owner and effort estimate.</p>
          </div>
          <div className="space-y-6">
            {recommendations.map((group) => (
              <div key={group.timeframe} className={`rounded-xl border p-6 ${group.color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${group.badge}`}>{group.timeframe}</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 bg-bg/40 rounded-lg p-4">
                      <div className="w-5 h-5 rounded-full border border-border-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-muted text-xs font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1"><div className="text-ink text-sm font-medium leading-snug">{item.action}</div></div>
                      <div className="flex flex-col items-end gap-1 text-xs flex-shrink-0">
                        <span className="text-gold font-medium">{item.owner}</span>
                        <span className="text-muted">{item.effort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-subtle pt-8 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-muted text-sm">Audit prepared by <a href="/" className="text-gold hover:text-gold-light transition-colors">Ryan Patt</a>, Solutions Architect · May 12, 2026</div>
              <div className="text-muted/60 text-xs mt-1">Data sources: Git log (Med-mart/mmr-web-m2), Monday.com task export, static code analysis, staging log review (Magento Cloud · tin2rimoygcaq · staging)</div>
            </div>
            <a href="/" className="text-sm text-muted hover:text-gold transition-colors border border-border-subtle px-4 py-2 rounded-lg">← Back to ryanpatt.com</a>
          </div>
        </footer>
      </main>
    </div>
  )
}
