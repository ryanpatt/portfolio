import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─── data ──────────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'findings' | 'executed' | 'flagged' | 'deferred' | 'workflow'

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

const riskColors: Record<RiskLevel, string> = {
  low:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
}

const scopeRows: {
  module: string
  defaultScope: number
  perWebsite: string
  perStore: string
  risk: RiskLevel
  note: string
}[] = [
  { module: 'Amasty_Affiliate', defaultScope: 38, perWebsite: '—', perStore: '—', risk: 'low', note: 'Single scope only — removed' },
  { module: 'Astound_Affirm', defaultScope: 58, perWebsite: '4 + 1 payment on website 3 (MM Supply)', perStore: '1 payment on store 3', risk: 'high', note: '"Buy Now. Pay Later" enabled per-website — needs payments team confirmation' },
  { module: 'Magetop_Bookingonline', defaultScope: 17, perWebsite: '—', perStore: '—', risk: 'low', note: 'Default scope only; blocked by ShipExpress code coupling' },
  { module: 'Magetop_Bookpremium', defaultScope: 7, perWebsite: '—', perStore: '—', risk: 'low', note: 'Same as above' },
  { module: 'Kount_Kount360', defaultScope: 15, perWebsite: '—', perStore: '—', risk: 'low', note: 'Module already removed from staging; orphan rows cleaned' },
  { module: 'MedMart_Klevu', defaultScope: 51, perWebsite: '8 on website 1', perStore: '26 / 1 / 3 across stores 1/2/3', risk: 'medium', note: '89 orphan rows scattered across all 3 storefronts; pending Live Search transition confirmation' },
  { module: 'Magento_TwoFactorAuth', defaultScope: 15, perWebsite: '—', perStore: '—', risk: 'low', note: 'Leave disabled per direction' },
  { module: 'Tatvam_Wisernotify', defaultScope: 0, perWebsite: '—', perStore: '—', risk: 'low', note: 'Never configured — clean removal' },
  { module: 'Invoca (legacy paths)', defaultScope: 28, perWebsite: '—', perStore: '—', risk: 'critical', note: 'Vestigial schema from a prior, much broader Invoca integration — call tracking, AdWords sync, etc. Hands off per direction.' },
  { module: 'Criteo (legacy paths)', defaultScope: 0, perWebsite: '—', perStore: '—', risk: 'low', note: 'Clean — new module is the first' },
]

const trueModuleDeltas: { module: string; direction: string; reason: string; risk: RiskLevel }[] = [
  { module: 'Magento_TwoFactorAuth', direction: 'Disabled on staging, enabled on prod', reason: 'Security FLAG — confirm posture with team', risk: 'high' },
  { module: 'Kount_Kount360', direction: 'Removed from staging entirely', reason: 'Fraud detection removed; payment-team confirmation needed', risk: 'high' },
  { module: 'MedMart_Klevu → MedMart_LiveSearch', direction: 'Search engine swap', reason: 'Klevu replaced; 89 orphan config rows still in DB across all stores', risk: 'medium' },
  { module: 'Amasty_LibSwiperJs → Amasty_LibSplideJs', direction: 'Slider library swap', reason: 'Routine — Hyvä migration adjacent', risk: 'low' },
  { module: '9× new GraphQL modules', direction: 'Added to staging', reason: 'CmsGraphQl, CmsUrlRewriteGraphQl, CustomerGraphQl, DirectoryGraphQl, QuoteGraphQl, StoreGraphQl, UrlRewriteGraphQl, WishlistGraphQl, DataExporterStatus', risk: 'low' },
  { module: 'Hyva_* (24 modules) + Mollie_Payment + Mageplaza_Smtp + Avalara_DiagnosticSuite + Perspective_Partytown + 7× new MedMart_*', direction: 'Added to staging', reason: 'Active Hyvä migration in flight — not cleanup candidates', risk: 'low' },
]

const executed: { item: string; detail: string }[] = [
  { item: 'Delete app/code/Tatvam/Wisernotify/', detail: 'Parent app/code/Tatvam/ also pruned (was empty)' },
  { item: 'Delete app/code/MedMart/AmastyAffiliate/', detail: 'Wrapper for a disabled parent module' },
  { item: 'Delete app/design/frontend/Magento/Medmart/Amasty_Affiliate/', detail: '4 leftover Luma theme files' },
  { item: 'composer remove amasty/affiliate', detail: 'Package v2.2.1 removed from vendor/ and composer.lock' },
  { item: 'Remove 3 entries from app/etc/config.php', detail: 'Amasty_Affiliate, MedMart_AmastyAffiliate, Tatvam_Wisernotify' },
  { item: 'DELETE FROM core_config_data WHERE path LIKE \'amasty_affiliate/%\'', detail: '38 rows cleaned' },
  { item: 'DELETE FROM core_config_data WHERE path LIKE \'kount360/%\' OR path LIKE \'payment/kount360/%\'', detail: '15 rows cleaned (module was already removed from composer)' },
  { item: 'Fold SwissupCheckoutfieldsFix into SwissupCheckoutFields', detail: 'Moved swissup_checkoutfields_values table override + 2 disabled FKs into the wrapper\'s db_schema.xml; updated db_schema_whitelist.json' },
  { item: 'Delete app/code/MedMart/SwissupCheckoutfieldsFix/', detail: 'Eliminates 3 naming/casing bugs at once: Medmart_ vs MedMart_, lowercase-f Swissup reference in <sequence>, missing whitelist' },
  { item: 'Remove Medmart_SwissupCheckoutfieldsFix from app/etc/config.php', detail: 'Module no longer registered' },
  { item: 'Add **/.DS_Store to .gitignore + git rm 3 tracked .DS_Store files', detail: 'gitignore deny-all pattern silently allowed macOS metadata' },
  { item: 'Fix dev/nginx-magento2-multistore.conf', detail: 'Added /pub/static/ location with /static.php?resource= fallback so cache:flush doesn\'t break local CSS/JS' },
  { item: 'New dev/WARDEN_COMMANDS.md', detail: 'Documents the Warden exec wrapper, Adobe Cloud patches workflow, cache-tag cheat sheet' },
]

const flagged: { id: string; title: string; risk: RiskLevel; problem: string; decision: string }[] = [
  {
    id: 'F1',
    title: 'Magetop bundle (4 booking modules)',
    risk: 'high',
    problem: 'MedMart_Catalog/ViewModel/ShipExpress.php:116,145 references Magetop\\Bookingonline\\Model\\Product\\Type\\Bookingonline::TYPE_CODE. Even though all 4 Magetop_* modules are disabled in app/etc/config.php, the PHP class still autoloads from disk. Deleting the directories produces a class-not-found fatal on every product-page render. The 4 modules are also tightly inter-coupled.',
    decision: 'Confirm booking product type is unused. Then a coordinated change: remove the Bookingonline::TYPE_CODE check from ShipExpress.php AND remove all 4 Magetop_* directories together.',
  },
  {
    id: 'F2',
    title: 'Astound_Affirm (composer affirm/magento2)',
    risk: 'high',
    problem: 'Module disabled in config.php, but MM Supply website has 6 non-default-scope rows including websites/3 affirm/affirm_aslowas/enabled_cc=1, websites/3 affirm/affirm_aslowas/enabled_mcc=1, and stores/3 payment/affirm_gateway/title="Buy Now. Pay Later". Suggests Affirm was actively configured per-website.',
    decision: 'Was "Buy Now. Pay Later" ever active on the MM Supply storefront? If stale config — clean removal. If active — leave alone or coordinate with payments team.',
  },
  {
    id: 'F3',
    title: 'MedMart_Klevu orphan config (89 rows)',
    risk: 'medium',
    problem: 'MedMart_Klevu was removed from staging code and replaced by MedMart_LiveSearch. 89 orphan klevu_* config rows remain across all 3 websites (51 default, 8 website 1, 26+1+3 across stores 1/2/3). Inert — no module reads them — but stale operator intent.',
    decision: 'Confirm Live Search rollout is complete across all 3 storefronts. Then DELETE FROM core_config_data WHERE path LIKE \'klevu_%\'.',
  },
  {
    id: 'F4',
    title: 'Magento_TwoFactorAuth',
    risk: 'medium',
    problem: 'Disabled on staging branch, enabled on production branch. Security control posture mismatch.',
    decision: 'Leave disabled locally and on staging per direction. Escalate to team for production-vs-staging posture decision separately.',
  },
  {
    id: 'F5',
    title: 'MedMart_Criteo and MedMart_Invoca scope',
    risk: 'critical',
    problem: 'The 28 invoca/* rows in the local DB are NOT from the new MedMart_Invoca module — they\'re from a prior, much broader Invoca integration (call tracking, Criteo FTP sync, AdWords + Microsoft Ads attribution, scheduled order/quote sync jobs, bulk sync settings). All values empty in local DB, no module declares those paths anymore.',
    decision: 'Per direction: hands off both new modules + the orphan invoca paths. Worth confirming the new module\'s narrower scope is intentional vs. unaware of the prior integration\'s footprint.',
  },
  {
    id: 'F6',
    title: 'Committed-built CSS smell',
    risk: 'low',
    problem: 'app/design/frontend/Magento/MedmartHyva/web/css/styles.css and web/tailwind/generated/*.css are tracked in git but are build outputs of npm run build. They appear modified in git status after running the Tailwind build.',
    decision: 'Add generated/ and web/css/styles.css to .gitignore. Rebuild as part of CI rather than committing artifacts. Backlog ticket.',
  },
]

const deferred: { item: string; reason: string }[] = [
  { item: '69× Magento_Inventory* (MSI) modules, all disabled, all installed', reason: 'Bundled with magento/product-enterprise-edition. Removal requires composer replace directives and breaks future Magento upgrades. Disabled = inert. No perf or attack-surface cost. Only revisit on adoption of a minimal-Magento stance.' },
  { item: 'GA plugin consolidation (MedMart_ReferenceNumber/Plugin/Ga.php + GtagGa.php → MedMart_GoogleTagManager)', reason: 'Medium effort, requires coordinating two modules\' enable order and dependency declarations. Backlog ticket.' },
  { item: '8× MedMart_Amasty* wrapper modules — possible common base', reason: 'Could refactor to a shared MedMart_AmastyBase after Phase 4 settles which Amasty integrations stay long-term. Backlog ticket.' },
  { item: '3× thin stub modules (MedMart_PartytownProxy, MedMart_PaymentDescriptions, MedMart_ProductSpinImage)', reason: 'Small footprint but unclear if still actively serving a feature. Backlog ticket — review per module.' },
]

/* ─── page ───────────────────────────────────────────────────────────────── */

const validTabs: TabId[] = ['overview', 'findings', 'executed', 'flagged', 'deferred', 'workflow']
const flaggedIds = flagged.map(f => f.id) // F1..F6 — sub-anchors that auto-scroll inside the Flagged tab

function readHash(): { tab: TabId; scrollTo: string | null } {
  if (typeof window === 'undefined') return { tab: 'overview', scrollTo: null }
  const raw = window.location.hash.replace('#', '')
  if (validTabs.includes(raw as TabId)) return { tab: raw as TabId, scrollTo: null }
  if (flaggedIds.includes(raw)) return { tab: 'flagged', scrollTo: raw }
  return { tab: 'overview', scrollTo: null }
}

export default function MedmartConfigReview() {
  const [tab, setTab] = useState<TabId>(() => readHash().tab)

  // Keep URL hash in sync with active tab (replaceState avoids polluting history)
  useEffect(() => {
    const desired = `#${tab}`
    // Don't overwrite a flagged-item sub-anchor (#F1..#F6) while it's still pointing at the flagged tab
    if (tab === 'flagged' && flaggedIds.includes(window.location.hash.replace('#', ''))) return
    if (window.location.hash !== desired) {
      window.history.replaceState(null, '', desired)
    }
  }, [tab])

  // React to browser back/forward and external hash changes
  useEffect(() => {
    const onHashChange = () => {
      const { tab: next, scrollTo } = readHash()
      setTab(next)
      if (scrollTo) {
        // wait for the flagged tab content to render
        setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // On first mount, if landed on a flagged sub-anchor, scroll once the content paints
  useEffect(() => {
    const { scrollTo } = readHash()
    if (scrollTo) {
      setTimeout(() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'findings',  label: 'Findings' },
    { id: 'executed',  label: `Executed (${executed.length})` },
    { id: 'flagged',   label: `Flagged (${flagged.length})` },
    { id: 'deferred',  label: 'Deferred' },
    { id: 'workflow',  label: 'Workflow' },
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
          <span className="text-sm font-medium text-ink">Module & Configuration Review</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">2026-05-16</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">
            Module &amp; Configuration Audit
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">
            A scope-aware cleanup pass on the Adobe Commerce Enterprise 2.4.7-p9 codebase: identified disabled-but-installed modules,
            traced per-store core_config_data rows that survived their owning modules&apos; deletion, folded a misnamed schema-patch
            module into its sibling, and flagged 6 items where business-domain risk or runtime coupling required team review before removal.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Modules removed',          value: '3', sub: 'Tatvam, AmastyAffiliate, SwissupFix', color: 'text-emerald-400' },
            { label: 'Composer packages removed', value: '1', sub: 'amasty/affiliate', color: 'text-gold' },
            { label: 'Orphan config rows cleaned', value: '53', sub: '38 amasty + 15 kount + 0 wisernotify', color: 'text-blue-400' },
            { label: 'Items flagged for review',  value: '6', sub: 'business risk or runtime coupling', color: 'text-yellow-400' },
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

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Why this audit happened</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The repository had accumulated several layers of cruft over the years: composer packages paid for but disabled,
                in-repo modules with no operational role, configuration rows in <code className="text-xs text-gold bg-black/30 px-1 rounded">core_config_data</code> that
                survived their owning modules&apos; deletion, and one schema-patch module with three case-mismatch bugs in its name and sequence.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                A scope-aware audit confirmed three real risks (multi-website per-store overrides on payment + search modules),
                folded a misnamed schema-patch module into its sibling, and removed four genuinely safe-to-delete modules from the local working tree.
                Six items were flagged for team review rather than executed — each had either business-domain risk or runtime coupling
                that required code changes before the cleanup was safe.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Methodology</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Branch deltas</div>
                  <p className="text-muted leading-relaxed">
                    <code className="text-xs text-gold bg-black/30 px-1 rounded">git diff production..staging</code> on <code className="text-xs text-gold bg-black/30 px-1 rounded">app/etc/config.php</code> and <code className="text-xs text-gold bg-black/30 px-1 rounded">composer.json/lock</code> with module-name comm-diff to separate true changes from alphabetical reordering.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Per-scope DB</div>
                  <p className="text-muted leading-relaxed">
                    Live queries against the local Warden MariaDB <code className="text-xs text-gold bg-black/30 px-1 rounded">core_config_data</code> table — scopes <code className="text-xs text-gold bg-black/30 px-1 rounded">default</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">websites/1-3</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">stores/1-3</code> — for every removal candidate.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Code coupling</div>
                  <p className="text-muted leading-relaxed">
                    Grep for <code className="text-xs text-gold bg-black/30 px-1 rounded">use</code> statements and class references across <code className="text-xs text-gold bg-black/30 px-1 rounded">app/code</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">app/design</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">vendor</code> before any deletion — caught the Magetop&nbsp;↔&nbsp;ShipExpress coupling before it caused a fatal.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Patches baseline</div>
                  <p className="text-muted leading-relaxed">
                    <code className="text-xs text-gold bg-black/30 px-1 rounded">php vendor/bin/ece-patches status</code> confirmed all 371 patches applied (175 local from <code className="text-xs text-gold bg-black/30 px-1 rounded">m2-hotfixes/</code>, 196 Adobe quality patches). Confirmed the cleanup wasn&apos;t a missing-patch issue.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Multi-store reality</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Three customer-facing websites — <code className="text-xs text-gold bg-black/30 px-1 rounded">base</code> · <code className="text-xs text-gold bg-black/30 px-1 rounded">canada</code> · <code className="text-xs text-gold bg-black/30 px-1 rounded">mm_supply</code> — each with its own Default Store View.
                Module disablement in <code className="text-xs text-gold bg-black/30 px-1 rounded">app/etc/config.php</code> is global, but configuration values live per-scope.
                A removed module can leave orphaned per-store rows that error out on the store front-end without surfacing at default scope —
                the single most common &quot;it worked on staging, broke on prod&quot; failure mode.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {['base', 'canada', 'mm_supply'].map(site => (
                  <div key={site} className="bg-black/30 border border-border-subtle rounded p-3 text-center">
                    <div className="text-xs font-mono text-gold">{site}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* FINDINGS */}
        {tab === 'findings' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">Per-scope DB findings</h2>
              <p className="text-xs text-muted mb-4">The highest-risk surface. Counts are rows in <code className="text-xs text-gold bg-black/30 px-1 rounded">core_config_data</code> grouped by scope.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs text-muted uppercase tracking-wider text-left">
                      <th className="py-2 pr-3 font-medium">Module</th>
                      <th className="py-2 pr-3 font-medium text-right">default</th>
                      <th className="py-2 pr-3 font-medium">per-website</th>
                      <th className="py-2 pr-3 font-medium">per-store</th>
                      <th className="py-2 pr-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopeRows.map(r => (
                      <tr key={r.module} className="border-b border-border-subtle/40 align-top">
                        <td className="py-3 pr-3 text-ink text-xs font-mono">{r.module}</td>
                        <td className="py-3 pr-3 text-right text-muted font-mono text-xs">{r.defaultScope}</td>
                        <td className="py-3 pr-3 text-muted text-xs">{r.perWebsite}</td>
                        <td className="py-3 pr-3 text-muted text-xs">{r.perStore}</td>
                        <td className="py-3 pr-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[r.risk]}`}>
                            {r.risk}
                          </span>
                          <div className="text-xs text-muted mt-1.5 leading-snug">{r.note}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-1">True module deltas (staging branch vs production branch)</h2>
              <p className="text-xs text-muted mb-4">After teasing apart the 484-line config.php diff that&apos;s mostly alphabetical reordering.</p>
              <div className="space-y-2">
                {trueModuleDeltas.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 bg-black/20 border border-border-subtle/60 rounded-lg p-3">
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[d.risk]}`}>
                      {d.risk}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink font-mono">{d.module}</div>
                      <div className="text-xs text-muted mt-0.5">{d.direction}</div>
                      <div className="text-xs text-muted/80 mt-1 leading-relaxed">{d.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-red-500/5 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">⚠</span>
                <div>
                  <h2 className="text-base font-semibold text-red-400">The Invoca surprise</h2>
                  <p className="text-xs text-muted mt-0.5">Critical finding worth highlighting.</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The 28 <code className="text-xs text-gold bg-black/30 px-1 rounded">invoca/*</code> rows in the local DB are <strong className="text-red-400">NOT</strong> from
                the new <code className="text-xs text-gold bg-black/30 px-1 rounded">MedMart_Invoca</code> module. They&apos;re vestigial from a <strong className="text-ink">prior, much more featureful Invoca integration</strong> that
                included:
              </p>
              <ul className="space-y-1.5 text-xs text-muted mb-3">
                {[
                  'Call tracking — destination_phone_number, enable_call_in_progress, calls_in_progress_api_endpoint',
                  'Criteo FTP sync — ftp_host, ftp_password, ftp_port, ftp_username',
                  'AdWords + Microsoft Ads attribution — adwords/admin_conversion_name, microsoft/admin_conversion_name',
                  'Scheduled order/quote sync jobs — schedule/syncing_orders, syncing_quotes',
                  'Bulk sync settings — sync_settings/orders_sync_limit, quotations_sync_*',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-border-subtle mt-0.5 shrink-0">—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted leading-relaxed">
                All values are empty in this DB, no current module declares <code className="text-xs text-gold bg-black/30 px-1 rounded">invoca/general</code> paths.
                The new <code className="text-xs text-gold bg-black/30 px-1 rounded">MedMart_Invoca</code> is a transaction-push integration only — substantially narrower scope.
                Worth confirming the new module&apos;s scope is intentional vs. unaware of the prior integration&apos;s footprint.
              </p>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Module-naming hygiene defect</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">
                The <code className="text-xs text-gold bg-black/30 px-1 rounded">MedMart/SwissupCheckoutfieldsFix/</code> module — which fixes real ongoing Swissup upstream
                schema bugs at v1.6.15 — had three casing/naming bugs lurking:
              </p>
              <ol className="space-y-2 text-sm text-muted list-decimal list-inside mb-3">
                <li>Module registered as <code className="text-xs text-gold bg-black/30 px-1 rounded">Medmart_SwissupCheckoutfieldsFix</code> (lowercase m) — inconsistent with the other 53 MedMart_* modules</li>
                <li><code className="text-xs text-gold bg-black/30 px-1 rounded">&lt;sequence&gt;</code> declared <code className="text-xs text-gold bg-black/30 px-1 rounded">Swissup_Checkoutfields</code> (lowercase f) — does not match upstream <code className="text-xs text-gold bg-black/30 px-1 rounded">Swissup_CheckoutFields</code> (capital F), so the sequence was silently ignored</li>
                <li>Directory <code className="text-xs text-gold bg-black/30 px-1 rounded">SwissupCheckoutfieldsFix</code> didn&apos;t match canonical CamelCase</li>
              </ol>
              <p className="text-sm text-muted leading-relaxed">
                Didn&apos;t break anything at runtime because declarative schema processes all modules together at <code className="text-xs text-gold bg-black/30 px-1 rounded">setup:upgrade</code> time —
                but a maintenance booby-trap. Folding the fix&apos;s schema into the wrapper module (<code className="text-xs text-gold bg-black/30 px-1 rounded">MedMart_SwissupCheckoutFields</code>) eliminated all three at once.
              </p>
            </section>
          </div>
        )}

        {/* EXECUTED */}
        {tab === 'executed' && (
          <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-1">Executed changes</h2>
            <p className="text-xs text-muted mb-4">
              All in the local working tree on <code className="text-xs text-gold bg-black/30 px-1 rounded">staging</code> branch. Each batch verified with <code className="text-xs text-gold bg-black/30 px-1 rounded">setup:upgrade</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">cache:flush</code>, multi-store HTTP smoke, and log scan for the removed module&apos;s class names. No errors surfaced in any phase.
            </p>
            <div className="space-y-2">
              {executed.map((e, i) => (
                <div key={i} className="flex items-start gap-3 bg-black/20 border border-border-subtle/60 rounded-lg p-3">
                  <span className="shrink-0 text-emerald-400 mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink font-mono break-all">{e.item}</div>
                    <div className="text-xs text-muted mt-1 leading-relaxed">{e.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FLAGGED */}
        {tab === 'flagged' && (
          <div className="space-y-3">
            {flagged.map(f => (
              <section
                key={f.id}
                id={f.id}
                className="bg-white/[0.02] border border-border-subtle rounded-xl p-6 scroll-mt-20"
              >
                <div className="flex items-start gap-3 mb-3">
                  <a
                    href={`#${f.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      window.history.replaceState(null, '', `#${f.id}`)
                      navigator.clipboard?.writeText(window.location.href)
                    }}
                    className="shrink-0 text-xs font-mono font-semibold text-muted hover:text-gold transition-colors"
                    title="Copy link to this item"
                  >
                    {f.id}
                  </a>
                  <h2 className="text-base font-semibold text-ink flex-1">{f.title}</h2>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[f.risk]}`}>
                    {f.risk}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">The problem</div>
                  <p className="text-sm text-muted leading-relaxed">{f.problem}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1.5">Decision needed</div>
                  <p className="text-sm text-ink leading-relaxed">{f.decision}</p>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* DEFERRED */}
        {tab === 'deferred' && (
          <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-1">Deferred items</h2>
            <p className="text-xs text-muted mb-4">Items intentionally left for a later cleanup pass, with rationale for the deferral.</p>
            <div className="space-y-3">
              {deferred.map((d, i) => (
                <div key={i} className="bg-black/20 border border-border-subtle/60 rounded-lg p-4">
                  <div className="text-sm text-ink font-medium mb-1.5">{d.item}</div>
                  <div className="text-xs text-muted leading-relaxed">{d.reason}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WORKFLOW */}
        {tab === 'workflow' && (
          <div className="space-y-6">
            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Branching workflow note</h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                This cleanup was executed directly on the local <code className="text-xs text-gold bg-black/30 px-1 rounded">staging</code> branch because no branch had been decided yet — fine for exploratory work,
                but not the right long-term pattern. Working directly on <code className="text-xs text-gold bg-black/30 px-1 rounded">staging</code> skips the isolation/review gate and means a single rollback target.
              </p>
              <div className="bg-black/40 border border-border-subtle rounded p-4 font-mono text-xs text-muted leading-relaxed mb-4">
                <div><span className="text-blue-400">feature/*</span> <span className="text-border-subtle">← branch off production (or main)</span></div>
                <div className="ml-4 text-border-subtle">↓</div>
                <div><span className="text-yellow-400">staging</span> <span className="text-border-subtle">← PR target for QA; deployed to staging environment</span></div>
                <div className="ml-4 text-border-subtle">↓</div>
                <div><span className="text-emerald-400">production</span> <span className="text-border-subtle">← PR target for release; deployed to production environment</span></div>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Recommended split when committing this work:
              </p>
              <ul className="space-y-2 mt-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-border-subtle shrink-0 mt-0.5">—</span>
                  <span><code className="text-xs text-gold bg-black/30 px-1 rounded">feat/conversion-tracking-medmart</code> — MedMart_Criteo + MedMart_Invoca modules + Conversion Tracking section refactor + nginx /pub/static fix + dev/WARDEN_COMMANDS.md</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-border-subtle shrink-0 mt-0.5">—</span>
                  <span><code className="text-xs text-gold bg-black/30 px-1 rounded">cleanup/module-audit-2026-05</code> — all the deletions, consolidations, and .DS_Store hygiene from this audit + the audit document itself</span>
                </li>
              </ul>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Verification performed</h2>
              <p className="text-sm text-muted leading-relaxed mb-3">After every destructive batch:</p>
              <ul className="space-y-1.5 text-xs text-muted">
                {[
                  'bin/magento setup:upgrade — clean run, no pending changes',
                  'bin/magento cache:flush — clean',
                  'Frontend https://app.medmartonline.test/ → HTTP 200',
                  'MM Supply https://supply.medmartonline.test/ → HTTP 200',
                  'Admin /admin/admin/dashboard/ → HTTP 200',
                  'var/log/exception.log and system.log grepped for removed-module names — zero new entries',
                  'Swissup fold: SHOW COLUMNS and information_schema.TABLE_CONSTRAINTS confirmed varchar(255) + 2 FKs absent',
                ].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white/[0.02] border border-border-subtle rounded-xl p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Source provenance</h2>
              <p className="text-sm text-muted leading-relaxed">
                This page was produced from a single audit session on 2026-05-16 with two parallel read-only exploration agents,
                live queries against the local Warden MariaDB <code className="text-xs text-gold bg-black/30 px-1 rounded">core_config_data</code> table,
                direct grep against <code className="text-xs text-gold bg-black/30 px-1 rounded">app/code</code>, <code className="text-xs text-gold bg-black/30 px-1 rounded">app/design</code>, and <code className="text-xs text-gold bg-black/30 px-1 rounded">vendor</code> for code coupling,
                and patch state confirmed via <code className="text-xs text-gold bg-black/30 px-1 rounded">php vendor/bin/ece-patches status</code>.
                Every removal was preceded by an external-reference scan before the directory was deleted.
              </p>
              <p className="text-xs text-muted mt-3 leading-relaxed">
                Production and staging environments were never touched during this work — all changes were local to a Warden Docker stack.
                The full audit document with file paths and SQL queries lives at <code className="text-xs text-gold bg-black/30 px-1 rounded">dev/CONFIG_AUDIT_2026_05_16.md</code> in the mmr-web-m2 repo.
              </p>
            </section>
          </div>
        )}

      </div>
    </div>
  )
}
