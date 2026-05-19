import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── data verified from git ──────────────────────────────────────────────── */

type Verified = 'verified' | 'partial' | 'unverifiable' | 'concern'

const verdictColors: Record<Verified, string> = {
  verified:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  partial:       'bg-blue-500/15 text-blue-400 border-blue-500/25',
  unverifiable:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  concern:       'bg-orange-500/15 text-orange-400 border-orange-500/25',
}

const verdictLabel: Record<Verified, string> = {
  verified:     'Verified in git',
  partial:      'Partially verified',
  unverifiable: 'Cannot verify from here',
  concern:      'Concern',
}

// Max's PRs merged into staging — pulled from gh pr list on Med-mart/mmr-web-m2
const maxPRs: { num: number; title: string; date: string; state: string; note: string }[] = [
  { num: 157, title: 'Trustpilot load delay (iteration 2)',          date: '2026-05-18', state: 'OPEN',   note: 'Second iteration of #153' },
  { num: 155, title: 'M2 PDP BL aligning',                            date: '2026-05-18', state: 'OPEN',   note: 'PDP layout polish' },
  { num: 153, title: 'Trustpilot load delay',                         date: '2026-05-18', state: 'MERGED', note: 'Defers Trustpilot widget (+379 lines, custom head + blind placeholder)' },
  { num: 151, title: 'PDP resources tab aligning fix',                date: '2026-05-14', state: 'MERGED', note: 'CSS-only cosmetic fix' },
  { num: 145, title: 'M2 print.css down',                             date: '2026-05-13', state: 'MERGED', note: 'Moves print.css to before.body.end — real render-blocking removal' },
  { num: 143, title: 'Montserrat MM font demo',                       date: '2026-05-12', state: 'MERGED', note: 'Adds 36 woff/woff2 files + demo CMS page' },
  { num: 138, title: 'M2 fonts revision',                             date: '2026-05-05', state: 'MERGED', note: 'Replaces Montserrat with Open Sans in _typography.less' },
  { num: 137, title: 'M2 small performance fixes 2',                  date: '2026-05-04', state: 'MERGED', note: 'fetchpriority="high" on main PDP image' },
  { num: 135, title: 'before-footer-contacts CMS block fix',          date: '2026-05-04', state: 'MERGED', note: 'CSS-only cosmetic fix' },
  { num: 132, title: 'Doubling in picture removed, preloader removed', date: '2026-04-30', state: 'MERGED', note: 'Removes duplicate preload markup on PDP' },
  // Earlier: m2-gallery-optimization (gallery-mixin.js) merged via internal release flow
]

// Map from the VP/President ask → what's actually verifiable
const askMatrix: {
  metric: string
  ask: string
  status: Verified
  finding: string
}[] = [
  {
    metric: 'PageSpeed — Home',
    ask: 'Score for the homepage',
    status: 'partial',
    finding: 'Stage: 51.2% → 61.4% mobile, 67.9% → 71.6% desktop (10-run median, May 7 → May 13). Still below the 90 threshold on both devices. Production number does not exist — nothing has shipped.',
  },
  {
    metric: 'PageSpeed — Category',
    ask: 'Score for a category page',
    status: 'unverifiable',
    finding: 'No category page in the two stage spreadsheets. Max\'s commits target PDPs and global CSS, not category templates. The executives\' ask is unanswered for category pages.',
  },
  {
    metric: 'PageSpeed — PDP',
    ask: 'Score for a product page (Total Care VLX)',
    status: 'partial',
    finding: 'Stage: 50.8% → 68.3% mobile, 68.0% → 76.5% desktop (Apr 7 baseline → May 7 "Deploy with many small fixes"). Biggest single win in the whole work — but still failing the 90 threshold and CWV LCP target on mobile.',
  },
  {
    metric: 'LCP',
    ask: 'Largest Contentful Paint',
    status: 'partial',
    finding: 'Real improvements: Home mobile 7.0s → 5.6s (still failing), PDP mobile 9.16s → 4.56s (still failing CWV ≤2.5s), Home desktop 1.24s → 0.84s (passes). Direction correct, mobile still off-target.',
  },
  {
    metric: 'TBT',
    ask: 'Total Blocking Time',
    status: 'concern',
    finding: 'PDP mobile 791ms → 617ms (improved, still 3× the CWV target). Home mobile 552ms → 701ms (REGRESSED +149ms — wrong direction, deserves an explanation given that "defer 3rd-party scripts" was a stated goal).',
  },
  {
    metric: 'TTFB',
    ask: 'Time to First Byte',
    status: 'unverifiable',
    finding: 'Not measured in either spreadsheet. Server-side metric — outside Max\'s commit footprint. Owner needs to be assigned separately.',
  },
  {
    metric: 'Cache hit ratio',
    ask: 'Server caching efficiency',
    status: 'concern',
    finding: 'Out of scope for the work Max actually did — no Fastly / Varnish / FPC commits in his history. The prior MedMart audit (/medmart/demo) flagged a 4% Fastly hit rate; that is unaddressed in this work.',
  },
  {
    metric: 'Server response times',
    ask: 'TTFB at origin',
    status: 'concern',
    finding: 'Front-end commits cannot move this. Needs a separate work item against the application/infra layer.',
  },
  {
    metric: 'Google Merchant Center',
    ask: 'Feed health, page-availability issues',
    status: 'unverifiable',
    finding: 'Not in scope for performance work. GMC status lives in /medmart/convert-gmc; no Max commits touch it.',
  },
  {
    metric: 'Add-to-cart / checkout starts / CVR',
    ask: 'Funnel metrics',
    status: 'unverifiable',
    finding: 'Analytics output, not code. Will only move after production deployment + a measurement window of at least 7–14 days.',
  },
]

const verifiedShipped: { area: string; what: string; files: string; impact: string; status: Verified }[] = [
  {
    area: 'PDP — Mobile gallery',
    what: 'Mobile gallery optimization on m2-gallery-optimization branch',
    files: 'app/design/frontend/Magento/Medmart/web/mage/gallery/gallery-mixin.js, requirejs-config.js, preload-gallery-placeholder.phtml',
    impact: 'Real JS-side change on the highest-traffic template family. Plausible LCP impact pending Lighthouse confirmation.',
    status: 'verified',
  },
  {
    area: 'PDP — Image fetch priority',
    what: 'fetchpriority="high" on the main product image',
    files: 'app/code/MedMart/Catalog/view/frontend/templates/product/view/preload-gallery-placeholder.phtml',
    impact: 'Standard LCP win. Small change, correct direction.',
    status: 'verified',
  },
  {
    area: 'PDP — Doubled preload removed',
    what: 'Eliminated duplicate <picture>/<link rel=preload> on PDP',
    files: 'catalog_product_view.xml, image-preload.phtml, preload-gallery-placeholder.phtml',
    impact: 'Removes redundant image fetch. Net positive.',
    status: 'verified',
  },
  {
    area: 'Global — print.css render-blocking',
    what: 'Moved print.css from <head> to before.body.end with a small lazy-loader template',
    files: 'Magento_Theme/layout/default.xml, default_head_blocks.xml, templates/print-css-lazy-loader.phtml',
    impact: 'Genuine render-blocking-CSS removal — exactly the kind of fix PageSpeed flags.',
    status: 'verified',
  },
  {
    area: 'Third-party defer — Trustpilot',
    what: 'Custom Trustpilot head override with a blind/placeholder template',
    files: 'Trustpilot_Reviews/templates/head/head.phtml, trustpilot-header-blind.phtml, _extend.less (+379 lines)',
    impact: 'Matches the "deferred 3rd-party scripts" claim — but only for Trustpilot. GTM, GA, Klaviyo, OneTrust etc. are not deferred in any Max commit.',
    status: 'partial',
  },
  {
    area: 'Fonts — Montserrat → Open Sans swap',
    what: 'Replaced Montserrat references in global typography variables',
    files: 'web/css/source/_typography.less, web/css/source/lib/variables/_typography.less, web/fonts/opensans/* (10 woff/woff2 files added)',
    impact: 'Standardization is real. Net font payload depends on how many Montserrat weights are still referenced elsewhere.',
    status: 'partial',
  },
  {
    area: 'Fonts — Montserrat-mm self-hosted',
    what: 'Added 36 woff/woff2 files for a self-hosted Montserrat variant + a CMS demo page',
    files: 'web/fonts/Montserrat-mm/* (×36), Magento_Cms/templates/montserrat-mm-font-demo.phtml, web/css/source/components/_montserrat-mm-font-demo.less',
    impact: 'Conflicts with the Montserrat→Open Sans swap above unless one of the two is provisional. Demo page caused two regressions (see Concerns).',
    status: 'concern',
  },
]

const concerns: { id: string; title: string; detail: string; severity: Verified }[] = [
  {
    id: 'C1',
    title: 'The Montserrat demo page shipped with a fontScope ReferenceError — twice',
    detail:
      'PR #143 (merged 2026-05-12) introduced /montserrat-mm-font-demo with an Alpine x-data="fontScope" attribute, but Alpine\'s CDN script was loaded synchronously and evaluated x-data before fontScope was defined → ReferenceError that broke the page. Ryan submitted PR #149 (merged 2026-05-14) to fix it. A regression in that fix landed (smart-quote in inline JS, PR #154 closed), then PR #156 (merged 2026-05-18) superseded #149 by deferring Alpine\'s CDN load. Two follow-up patches by another contributor were required to ship a page Max said was complete.',
    severity: 'concern',
  },
  {
    id: 'C2',
    title: 'Self-described "completed" work is partly cosmetic',
    detail:
      'Of 17 Max commits since 2026-04-22, ~6 are CSS micro-fixes ("Line clamp fix", "Css fixes", "Clean up", "Remove method", "darkMode: false", "PDP resources tab aligning fix") that do not affect performance. The substantive performance commits are 5: gallery optimization, fetchpriority, doubled-preload removal, print.css deferral, Trustpilot defer.',
    severity: 'concern',
  },
  {
    id: 'C3',
    title: 'Two parallel font tracks running at once',
    detail:
      'PR #138 (2026-05-05) replaced Montserrat with Open Sans in the global typography variables. One week later PR #143 (2026-05-12) added a 36-file Montserrat-mm self-hosted set and a demo page. It is unclear which is the intended end state. Either way, before claiming "font standardization across the entire project" the team should confirm exactly one font family is loaded site-wide.',
    severity: 'concern',
  },
  {
    id: 'C4',
    title: '"Deferred aggressive third-party scripts" is one script, not a sweep',
    detail:
      'Trustpilot was deferred. That is real and useful. But GTM, Google Analytics, Klaviyo, OneTrust, Affirm, and the other ~20 vendors inventoried on /medmart/convert-gmc have no corresponding Max commits. The verbal summary suggests a broad pass that the commit log does not show.',
    severity: 'concern',
  },
  {
    id: 'C5',
    title: 'Nothing has been deployed to production',
    detail:
      'Max confirms this directly. Every "stage" metric on the linked spreadsheets is provisional; PageSpeed scores on stage rarely reflect production CDN, cache warmth, or third-party order. Real-user CWVs (LCP/INP/CLS) cannot be claimed until a production rollout + measurement window.',
    severity: 'concern',
  },
]

const missing: { topic: string; why: string }[] = [
  { topic: 'Lighthouse before/after evidence', why: 'Spreadsheet numbers exist but the methodology (mobile/desktop, throttling, run count) is not in the repo. Recommend running PSI 5× and reporting the median for both stage and production after deploy.' },
  { topic: 'TTFB / origin response time',     why: 'Application/server-side. Not in any front-end commit Max has made. Owner needs to be assigned.' },
  { topic: 'Cache hit ratio',                  why: 'Fastly/Varnish config. The prior audit recorded 4% Fastly hit rate — unaddressed by this work.' },
  { topic: 'GMC page availability',            why: 'Out of scope of performance work; tracked separately on /medmart/convert-gmc.' },
  { topic: 'Conversion-rate / ATC / checkout starts', why: 'Analytics. Cannot be evaluated until production rollout + 7–14 day measurement window.' },
  { topic: 'Bundle-size / 3rd-party budget',   why: 'No CI gate or budget exists. Without one, performance regressions will silently re-accumulate.' },
]

// Verified from the two xlsx files (median of 10 mobile runs / 4-10 desktop runs)
// Home: "Med mart - Home - stage.xlsx", May 7 (Before banner refactor) vs May 13 (After)
// PDP:  "Med mart - Total Care VLX - stage.xlsx", Apr 7 (baseline) vs May 7 (Deploy with many small fixes)
const stageMetrics: {
  page: string
  device: string
  metric: string
  before: string
  after: string
  delta: string
  good: 'win' | 'loss' | 'neutral'
  cwvTarget: string
  cwvAfter: 'pass' | 'fail' | 'na'
}[] = [
  // HOME — Mobile
  { page: 'Home', device: 'Mobile',  metric: 'Performance score', before: '51.2%', after: '61.4%', delta: '+10.2',  good: 'win',     cwvTarget: '90+',   cwvAfter: 'fail' },
  { page: 'Home', device: 'Mobile',  metric: 'LCP',               before: '7.0s',  after: '5.6s',  delta: '-1.4s',  good: 'win',     cwvTarget: '≤2.5s', cwvAfter: 'fail' },
  { page: 'Home', device: 'Mobile',  metric: 'TBT',               before: '552ms', after: '701ms', delta: '+149ms', good: 'loss',    cwvTarget: '≤200ms',cwvAfter: 'fail' },
  { page: 'Home', device: 'Mobile',  metric: 'CLS',               before: '0.145', after: '0.005', delta: '-0.140', good: 'win',     cwvTarget: '≤0.1',  cwvAfter: 'pass' },
  { page: 'Home', device: 'Mobile',  metric: 'Speed Index',       before: '4.85s', after: '4.64s', delta: '-0.21s', good: 'neutral', cwvTarget: '—',     cwvAfter: 'na' },
  // HOME — Desktop
  { page: 'Home', device: 'Desktop', metric: 'Performance score', before: '67.9%', after: '71.6%', delta: '+3.7',   good: 'neutral', cwvTarget: '90+',   cwvAfter: 'fail' },
  { page: 'Home', device: 'Desktop', metric: 'LCP',               before: '1.24s', after: '0.84s', delta: '-0.4s',  good: 'win',     cwvTarget: '≤2.5s', cwvAfter: 'pass' },
  { page: 'Home', device: 'Desktop', metric: 'TBT',               before: '613ms', after: '599ms', delta: '-14ms',  good: 'neutral', cwvTarget: '≤200ms',cwvAfter: 'fail' },
  { page: 'Home', device: 'Desktop', metric: 'CLS',               before: '0.301', after: '0.079', delta: '-0.222', good: 'win',     cwvTarget: '≤0.1',  cwvAfter: 'pass' },
  { page: 'Home', device: 'Desktop', metric: 'Speed Index',       before: '1.59s', after: '1.35s', delta: '-0.24s', good: 'neutral', cwvTarget: '—',     cwvAfter: 'na' },
  // PDP (Total Care VLX) — Mobile
  { page: 'PDP',  device: 'Mobile',  metric: 'Performance score', before: '50.8%', after: '68.3%', delta: '+17.5',  good: 'win',     cwvTarget: '90+',   cwvAfter: 'fail' },
  { page: 'PDP',  device: 'Mobile',  metric: 'LCP',               before: '9.16s', after: '4.56s', delta: '-4.6s',  good: 'win',     cwvTarget: '≤2.5s', cwvAfter: 'fail' },
  { page: 'PDP',  device: 'Mobile',  metric: 'TBT',               before: '791ms', after: '617ms', delta: '-174ms', good: 'win',     cwvTarget: '≤200ms',cwvAfter: 'fail' },
  { page: 'PDP',  device: 'Mobile',  metric: 'CLS',               before: '0.008', after: '0.001', delta: '-0.007', good: 'neutral', cwvTarget: '≤0.1',  cwvAfter: 'pass' },
  { page: 'PDP',  device: 'Mobile',  metric: 'Speed Index',       before: '5.91s', after: '4.23s', delta: '-1.68s', good: 'win',     cwvTarget: '—',     cwvAfter: 'na' },
  // PDP — Desktop
  { page: 'PDP',  device: 'Desktop', metric: 'Performance score', before: '68.0%', after: '76.5%', delta: '+8.5',   good: 'win',     cwvTarget: '90+',   cwvAfter: 'fail' },
  { page: 'PDP',  device: 'Desktop', metric: 'LCP',               before: '1.45s', after: '0.85s', delta: '-0.6s',  good: 'win',     cwvTarget: '≤2.5s', cwvAfter: 'pass' },
  { page: 'PDP',  device: 'Desktop', metric: 'TBT',               before: '629ms', after: '509ms', delta: '-120ms', good: 'win',     cwvTarget: '≤200ms',cwvAfter: 'fail' },
  { page: 'PDP',  device: 'Desktop', metric: 'CLS',               before: '0.009', after: '0.009', delta: '0',      good: 'neutral', cwvTarget: '≤0.1',  cwvAfter: 'pass' },
  { page: 'PDP',  device: 'Desktop', metric: 'Speed Index',       before: '1.45s', after: '1.72s', delta: '+0.27s', good: 'loss',    cwvTarget: '—',     cwvAfter: 'na' },
]

type TabId = 'summary' | 'ask' | 'metrics' | 'shipped' | 'concerns' | 'gap' | 'recommend'

/* ─── component ───────────────────────────────────────────────────────────── */

export default function MedmartMaxReview() {
  const [tab, setTab] = useState<TabId>('summary')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabId
    const valid: TabId[] = ['summary', 'ask', 'metrics', 'shipped', 'concerns', 'gap', 'recommend']
    if (valid.includes(hash)) setTab(hash)
  }, [])

  useEffect(() => {
    if (window.location.hash.replace('#', '') !== tab) {
      window.history.replaceState(null, '', `#${tab}`)
    }
  }, [tab])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'summary',    label: 'Summary' },
    { id: 'ask',        label: `The Ask vs. What's Available (${askMatrix.length})` },
    { id: 'metrics',    label: `Stage Metrics (${stageMetrics.length})` },
    { id: 'shipped',    label: `Verified Work (${verifiedShipped.length})` },
    { id: 'concerns',   label: `Concerns (${concerns.length})` },
    { id: 'gap',        label: `Gaps (${missing.length})` },
    { id: 'recommend',  label: 'Recommendation' },
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
          <span className="text-sm font-medium text-ink">Performance Work — Honest Review</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">For David L. &amp; David F. · 2026-05-19</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">
            Performance &amp; Speed — Verified Review of Max&apos;s Recent Work
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-3xl">
            A claim-by-claim audit of the performance work Max summarized, cross-checked against the
            <code className="text-xs text-gold bg-black/30 px-1 rounded mx-1">Med-mart/mmr-web-m2</code> commit history and pull-request log on GitHub.
            Verified items are in git. Items the executives asked for that depend on stage spreadsheets, analytics, or production deployment
            are explicitly labelled as not verifiable from the code review alone.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'PDP mobile Perf score',  value: '+17.5', sub: '50.8% → 68.3% (stage, 10-run median)', color: 'text-emerald-400' },
            { label: 'Home mobile TBT',        value: '+149ms', sub: 'REGRESSION — wrong direction', color: 'text-orange-400' },
            { label: 'Real perf changes',      value: '5',     sub: 'Out of 17 commits', color: 'text-gold' },
            { label: 'Production deploys',     value: '0',     sub: 'Stage only — confirmed by Max', color: 'text-blue-400' },
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
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* SUMMARY */}
        {tab === 'summary' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Bottom line</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                Max has shipped <span className="text-ink font-medium">five substantive performance changes</span> over three weeks —
                mobile gallery optimization, image <code className="text-xs text-gold bg-black/30 px-1 rounded">fetchpriority</code>, a duplicated-preload removal,
                a print.css render-blocking fix, and a Trustpilot-script defer. The PDP work is the strongest single result in the engagement:
                <span className="text-ink font-medium"> mobile Performance 50.8% → 68.3% (+17.5)</span>, mobile LCP 9.16s → 4.56s, mobile TBT 791ms → 617ms.
              </p>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The Home page result is more mixed. Mobile Performance moved 51.2% → 61.4% and CLS collapsed from 0.145 to 0.005,
                but <span className="text-orange-400 font-medium">Home mobile TBT regressed from 552ms to 701ms (+149ms)</span> — moving in the wrong direction on a metric
                the executives specifically named, and the opposite of what &ldquo;defer 3rd-party scripts&rdquo; is supposed to produce. That regression
                needs an explanation from Max before any deployment.
              </p>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The verbal summary stretches the work somewhat. &ldquo;Deferred loading of aggressive third-party scripts that typically attempt to load within the first 500ms&rdquo;
                describes <span className="text-ink font-medium">one script</span> (Trustpilot) in the commit log, not the broader sweep the phrasing implies. &ldquo;Font optimization and standardization across the entire project&rdquo;
                covers a real Montserrat → Open Sans swap in the global variables — but the same engineer one week later added a 36-file self-hosted
                Montserrat-mm set plus a demo page that broke twice and required external fixes.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Nothing is in production yet. Every metric the President and VP asked for — PageSpeed scores, LCP/TTFB/TBT, cache hit ratio,
                server response time, GMC status, ATC / checkout-start / CVR — is either a stage-only number above (now verified against Max&apos;s own xlsx files)
                or a server/analytics signal that front-end commits cannot move. <span className="text-ink font-medium">The credible next step
                is a production rollout followed by a measured Lighthouse + RUM comparison</span>, not more pre-deploy work — after Max explains the Home mobile TBT regression.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">What this review can and cannot tell you</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">What is verified</div>
                  <ul className="text-muted leading-relaxed space-y-1.5">
                    <li>— Every commit Max authored on staging since 2026-04-22</li>
                    <li>— Every Max-authored PR title, merge date, and file list</li>
                    <li>— Who fixed what when (including two follow-up patches on his Montserrat demo)</li>
                    <li>— The actual files changed vs. the verbal description</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">What is not verifiable here</div>
                  <ul className="text-muted leading-relaxed space-y-1.5">
                    <li>— Production PageSpeed scores (no deploy yet)</li>
                    <li>— TTFB, cache hit ratio, origin response times</li>
                    <li>— GMC feed health</li>
                    <li>— Add-to-cart / checkout-start / CVR (analytics, post-deploy)</li>
                    <li>— Category-page PageSpeed (not measured by Max)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">How Max summarized it — and how it actually reads</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Max&apos;s claim 1 — PDP optimization, mobile focus, completed</div>
                  <p className="text-muted leading-relaxed">
                    <span className="text-emerald-400">Largely supported.</span> Mobile gallery JS, image fetch priority, and the doubled-preload fix
                    are real and on the right templates. &ldquo;Completed&rdquo; should be qualified as &ldquo;completed pre-deploy&rdquo; — the
                    last two PDP commits on 2026-05-14 (#150 closed, #151 merged) are cosmetic alignment fixes, not perf.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Max&apos;s claim 2 — Deferred loading of aggressive 3rd-party scripts</div>
                  <p className="text-muted leading-relaxed">
                    <span className="text-orange-400">Overstated.</span> One vendor (Trustpilot) is deferred in PR #153. There are no commits
                    deferring GTM, GA, Klaviyo, OneTrust, Affirm, or the other ~20 vendors inventoried on the existing
                    <Link to="/medmart/convert-gmc" className="text-gold hover:underline mx-1">/medmart/convert-gmc</Link>
                    page.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Max&apos;s claim 3 — Font optimization and standardization</div>
                  <p className="text-muted leading-relaxed">
                    <span className="text-orange-400">Mixed.</span> The Montserrat → Open Sans swap in the global typography variables is a real standardization win.
                    The 36-file self-hosted Montserrat-mm set added one week later, plus a demo page that broke twice (fontScope ReferenceError, then a smart-quote regression),
                    works against the standardization framing and consumed external review time.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* THE ASK */}
        {tab === 'ask' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">The President and VP asked for these metrics</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                For each requested metric, this table records what is available right now and how much of it Max&apos;s code
                changes can actually move. &ldquo;Cannot verify from here&rdquo; means the data lives outside the GitHub repo (stage spreadsheet,
                Search Console, analytics, or a yet-to-happen production deploy).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gold uppercase tracking-wider">Metric requested</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gold uppercase tracking-wider">Status</th>
                      <th className="text-left py-2 text-xs font-semibold text-gold uppercase tracking-wider">Finding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {askMatrix.map((row, i) => (
                      <tr key={i} className="border-b border-border-subtle/50 align-top">
                        <td className="py-3 pr-4">
                          <div className="text-ink font-medium">{row.metric}</div>
                          <div className="text-xs text-muted mt-0.5">{row.ask}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${verdictColors[row.status]}`}>
                            {verdictLabel[row.status]}
                          </span>
                        </td>
                        <td className="py-3 text-muted leading-relaxed">{row.finding}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* METRICS */}
        {tab === 'metrics' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Stage PageSpeed — verified from Max&apos;s xlsx files</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Numbers below are the median across the run set Max measured (10 mobile + 4–10 desktop runs per snapshot)
                on <code className="text-xs text-gold bg-black/30 px-1 rounded">mcstaging.medmartonline.com</code>. These are
                stage numbers, not production. Note the column labelled <span className="text-ink">CWV after</span> — whether the
                current stage value meets Google&apos;s Core Web Vitals threshold.
              </p>

              {(['Home', 'PDP'] as const).map(pageName => (
                <div key={pageName} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-gold mb-2 uppercase tracking-wider">
                    {pageName === 'Home' ? 'Home page (mcstaging.medmartonline.com/)' : 'PDP — Total Care VLX (mcstaging.medmartonline.com/medplus-vlx-total-care)'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th className="text-left py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">Device</th>
                          <th className="text-left py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">Metric</th>
                          <th className="text-right py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">Before</th>
                          <th className="text-right py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">After</th>
                          <th className="text-right py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">Δ</th>
                          <th className="text-right py-2 pr-3 text-xs font-semibold text-muted uppercase tracking-wider">CWV target</th>
                          <th className="text-right py-2 text-xs font-semibold text-muted uppercase tracking-wider">CWV after</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageMetrics.filter(m => m.page === pageName).map((m, i) => (
                          <tr key={i} className="border-b border-border-subtle/50">
                            <td className="py-2 pr-3 text-muted">{m.device}</td>
                            <td className="py-2 pr-3 text-ink">{m.metric}</td>
                            <td className="py-2 pr-3 text-right text-muted font-mono text-xs">{m.before}</td>
                            <td className="py-2 pr-3 text-right text-ink font-mono text-xs">{m.after}</td>
                            <td className={`py-2 pr-3 text-right font-mono text-xs ${
                              m.good === 'win' ? 'text-emerald-400' : m.good === 'loss' ? 'text-orange-400' : 'text-muted'
                            }`}>{m.delta}</td>
                            <td className="py-2 pr-3 text-right text-muted text-xs">{m.cwvTarget}</td>
                            <td className="py-2 text-right">
                              {m.cwvAfter === 'pass' && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">pass</span>}
                              {m.cwvAfter === 'fail' && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">fail</span>}
                              {m.cwvAfter === 'na'   && <span className="text-xs text-muted/60">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">What the metrics actually say</h2>
              <ul className="text-sm text-muted leading-relaxed space-y-2.5 list-disc list-outside pl-5">
                <li><span className="text-emerald-400 font-medium">PDP work is the strongest result.</span> +17.5 points mobile, +8.5 points desktop, large LCP and TBT improvements on both. This is the optimization Max should lead with.</li>
                <li><span className="text-orange-400 font-medium">Home mobile TBT regressed by +149ms.</span> This contradicts the stated goal of deferring third-party scripts (which is exactly the work that reduces TBT). Possible explanations: new Montserrat-mm font payload, unrelated banner refactor, or a measurement-variance artifact. Needs investigation before deploy.</li>
                <li><span className="text-emerald-400 font-medium">CLS is a clean win on Home.</span> Mobile 0.145 → 0.005, desktop 0.301 → 0.079. Both now within or near the CWV threshold.</li>
                <li><span className="text-orange-400 font-medium">No page passes the 90-point performance threshold on either device.</span> Every after-state is still in the &ldquo;needs improvement&rdquo; band.</li>
                <li><span className="text-yellow-400 font-medium">Category pages were not measured.</span> The President and VP explicitly asked for a category-page score and one does not exist in the spreadsheets.</li>
                <li><span className="text-yellow-400 font-medium">Sample size on some snapshots is small.</span> The May 13 desktop Home snapshot is only 4 runs, where mobile is 10. Median-of-4 is reasonable for a checkpoint but not for a final claim.</li>
              </ul>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Caveats on the source data</h2>
              <ul className="text-sm text-muted leading-relaxed space-y-2 list-disc list-outside pl-5">
                <li>Both files contain Excel formatting artifacts where values like &ldquo;2.7s&rdquo; were auto-parsed as dates (&ldquo;2026-07-02&rdquo;). The Avg cells appear to be calculated correctly; individual-run cells were not used for this review.</li>
                <li>Measurements are PageSpeed/Lighthouse lab runs, not field/RUM data. Production CWV scores (from CrUX) will differ once a deploy lands.</li>
                <li>The Home page comparison brackets a banner refactor on May 7 → May 13; this is a real visual change and could account for the CLS collapse independently of Max&apos;s performance work.</li>
              </ul>
            </section>
          </div>
        )}

        {/* SHIPPED */}
        {tab === 'shipped' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Verified work from the commit log</h2>
              <p className="text-sm text-muted leading-relaxed mb-5">
                Each row below was confirmed against <code className="text-xs text-gold bg-black/30 px-1 rounded">git log --author=&quot;Alekseyev&quot;</code>
                {' '}on the <code className="text-xs text-gold bg-black/30 px-1 rounded">Med-mart/mmr-web-m2</code> repository. File paths are the actual paths touched.
              </p>

              <div className="space-y-3">
                {verifiedShipped.map((item, i) => (
                  <div key={i} className="border border-border-subtle rounded-lg p-4 bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink mb-0.5">{item.area}</div>
                        <div className="text-sm text-muted">{item.what}</div>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${verdictColors[item.status]}`}>
                        {verdictLabel[item.status]}
                      </span>
                    </div>
                    <div className="text-xs text-muted/80 font-mono leading-relaxed mt-2">{item.files}</div>
                    <div className="text-xs text-muted mt-2 leading-relaxed">{item.impact}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">All Max-authored PRs (most recent first)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-gold uppercase tracking-wider">PR</th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-gold uppercase tracking-wider">Title</th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-gold uppercase tracking-wider">Date</th>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-gold uppercase tracking-wider">State</th>
                      <th className="text-left py-2 text-xs font-semibold text-gold uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maxPRs.map(p => (
                      <tr key={p.num} className="border-b border-border-subtle/50">
                        <td className="py-2 pr-3 text-muted font-mono text-xs">#{p.num}</td>
                        <td className="py-2 pr-3 text-ink">{p.title}</td>
                        <td className="py-2 pr-3 text-muted text-xs font-mono">{p.date}</td>
                        <td className="py-2 pr-3">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            p.state === 'MERGED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : p.state === 'OPEN'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-zinc-500/15 text-zinc-400'
                          }`}>
                            {p.state}
                          </span>
                        </td>
                        <td className="py-2 text-muted text-xs leading-relaxed">{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted/70 mt-4 leading-relaxed">
                Source: <code className="text-xs text-gold bg-black/30 px-1 rounded">gh -R Med-mart/mmr-web-m2 pr list --state all --author MaxAlekseyev</code> on 2026-05-19.
              </p>
            </section>
          </div>
        )}

        {/* CONCERNS */}
        {tab === 'concerns' && (
          <div className="space-y-4">
            {concerns.map(c => (
              <section key={c.id} className="bg-white/[0.02] border border-border-subtle rounded-xl p-5">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-xs font-mono text-muted bg-black/30 px-1.5 py-0.5 rounded shrink-0">{c.id}</span>
                  <h3 className="text-sm font-semibold text-ink flex-1">{c.title}</h3>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${verdictColors[c.severity]}`}>
                    {verdictLabel[c.severity]}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{c.detail}</p>
              </section>
            ))}
          </div>
        )}

        {/* GAP */}
        {tab === 'gap' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Asked-for items the current work cannot move on its own</h2>
              <p className="text-sm text-muted leading-relaxed mb-5">
                The President and VP&apos;s metric list is broader than a front-end performance pass can address. For each item below,
                this is who needs to own it and why front-end commits will not produce the number.
              </p>

              <div className="space-y-3">
                {missing.map((m, i) => (
                  <div key={i} className="border border-border-subtle rounded-lg p-4 bg-white/[0.02]">
                    <div className="text-sm font-semibold text-ink mb-1">{m.topic}</div>
                    <div className="text-sm text-muted leading-relaxed">{m.why}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* RECOMMEND */}
        {tab === 'recommend' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Recommendation</h2>
              <ol className="text-sm text-muted leading-relaxed space-y-3 list-decimal list-outside pl-5">
                <li>
                  <span className="text-ink font-medium">Deploy what is on staging to production.</span> Without a deploy, every spreadsheet
                  number is provisional and no real-user CWVs can be claimed. The PDP-side changes (gallery, fetchpriority,
                  doubled-preload removal, print.css defer, Trustpilot defer) are correct moves and worth shipping.
                </li>
                <li>
                  <span className="text-ink font-medium">Resolve the font split before deploying.</span> Pick one: Open Sans as the global default
                  (PR #138), or self-hosted Montserrat-mm (PR #143). Loading both wastes the gain.
                </li>
                <li>
                  <span className="text-ink font-medium">Reframe &ldquo;deferred third-party scripts&rdquo; as a named, ticketed sweep.</span> Trustpilot is done.
                  GTM, GA, Klaviyo, OneTrust, Affirm — each needs its own commit/PR. Use the existing 24-vendor inventory on
                  <Link to="/medmart/convert-gmc" className="text-gold hover:underline mx-1">/medmart/convert-gmc</Link>
                  as the work list.
                </li>
                <li>
                  <span className="text-ink font-medium">Run Lighthouse 5× on production after deploy.</span> Report the median for home, a category page, and a PDP — mobile and desktop.
                  That is the apples-to-apples comparison the executives actually asked for. Stage numbers do not substitute.
                </li>
                <li>
                  <span className="text-ink font-medium">Assign the server-side metrics to a different owner.</span> TTFB, cache hit ratio, and origin response time
                  do not move from front-end commits. The prior MedMart audit recorded a 4% Fastly hit rate — that is an infra
                  ticket, not a Max ticket.
                </li>
                <li>
                  <span className="text-ink font-medium">Hold conversion metrics until measurement is possible.</span> Add-to-cart, checkout-start, and CVR
                  require a 7–14 day post-deploy window. Reporting them now would be guessing.
                </li>
                <li>
                  <span className="text-ink font-medium">Tighten the verbal summary.</span> The work is real. Describing one Trustpilot defer as
                  &ldquo;deferred aggressive third-party scripts&rdquo; and a single Open Sans swap (plus a parallel Montserrat-mm addition) as
                  &ldquo;font standardization across the entire project&rdquo; will not survive an executive read of the commit log.
                </li>
              </ol>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">How this review was produced</h2>
              <ul className="text-sm text-muted leading-relaxed space-y-2 list-disc list-outside pl-5">
                <li>Local clone of <code className="text-xs text-gold bg-black/30 px-1 rounded">Med-mart/mmr-web-m2</code> on staging at 2026-05-19</li>
                <li><code className="text-xs text-gold bg-black/30 px-1 rounded">git log --all --author=&quot;Alekseyev&quot; --since=&quot;3 months ago&quot;</code> with per-commit file lists</li>
                <li><code className="text-xs text-gold bg-black/30 px-1 rounded">gh -R Med-mart/mmr-web-m2 pr list --state all --limit 30</code> for PR-level state and merge dates</li>
                <li><code className="text-xs text-gold bg-black/30 px-1 rounded">gh -R Med-mart/mmr-web-m2 pr view 153</code> to verify the Trustpilot defer footprint</li>
                <li>Cross-reference with the existing <Link to="/medmart/convert-gmc" className="text-gold hover:underline">/medmart/convert-gmc</Link> 24-vendor third-party inventory</li>
                <li>The two stage spreadsheets Max referenced (Home and Total Care VLX) were opened locally and the median values transcribed into the Stage Metrics tab above</li>
              </ul>
            </section>
          </div>
        )}

      </div>
    </div>
  )
}
