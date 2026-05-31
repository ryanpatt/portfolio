import { useState } from 'react'
import { Link } from 'react-router-dom'
import roster from '../data/teamRosterLocal.json'

/* LOCAL READ-ONLY PROTOTYPE.
   Data is a gitignored snapshot (GitHub + Adobe Commerce Cloud + Monday are live read-only
   reads; Slack + M365 not yet connected). No credentials live in this app, no destructive
   actions exist, and this is never committed/deployed. The production version will be gated
   by Microsoft Entra SSO + an admin allowlist before any of this goes public. */

type Group = 'contractor' | 'agency' | 'adobe' | 'internal' | 'service' | 'marketing'
type Priority = 'high' | 'med' | 'low'

const groupColor: Record<Group, string> = {
  contractor: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  agency: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  adobe: 'bg-white/10 text-muted border-border-subtle',
  internal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  service: 'bg-red-500/15 text-red-400 border-red-500/25',
  marketing: 'bg-gold/15 text-gold border-gold/30',
}
const prioColor: Record<Priority, string> = {
  high: 'bg-red-500/15 text-red-400 border-red-500/25',
  med: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  low: 'bg-white/5 text-muted border-border-subtle',
}

export default function MedmartTeamManagement() {
  const [filter, setFilter] = useState<'all' | 'offboard'>('all')
  const people = roster.people as {
    name: string; group: Group; priority: Priority
    github: string | null; cloud: string | null; monday: string | null; slack: string | null; m365: string | null; flag: string
  }[]
  const shown = filter === 'offboard' ? people.filter(p => p.priority !== 'low') : people
  const sysKeys = ['github', 'cloud', 'monday', 'slack', 'm365'] as const
  const connected = roster.systems.filter(s => s.state === 'connected').length

  const stats = [
    { v: String(people.length), l: 'People discovered', s: 'across connected systems', c: 'text-ink' },
    { v: String(people.filter(p => p.priority === 'high').length), l: 'Full-offboard priority', s: 'multi-system contractors', c: 'text-red-400' },
    { v: `${connected}/5`, l: 'Systems connected', s: 'GitHub · Cloud · Monday', c: 'text-emerald-400' },
    { v: '0', l: 'Destructive actions', s: 'read-only prototype', c: 'text-gold' },
  ]

  const cell = (v: string | null) =>
    v
      ? <span className="text-xs text-ink">{v}</span>
      : <span className="text-xs text-muted/40">—</span>

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      <header className="border-b border-border-subtle bg-bg/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/medmart" className="text-muted hover:text-ink transition-colors text-sm flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            MedMart
          </Link>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="text-sm font-medium text-ink">Team Access Management</span>
          <span className="ml-auto text-xs text-muted">{roster.snapshot}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Safety banner */}
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.06] px-4 py-3 text-xs text-yellow-200/90 leading-relaxed">
          <strong className="text-yellow-400">Local read-only prototype.</strong> This view only <em>lists</em> access — it cannot
          revoke, disable, or delete anyone, and contains no credentials. Not committed, not deployed. The production version at
          this URL will require Microsoft Entra SSO (admin allowlist) before going public; the one-click offboarding “kill-switch”
          is a separate, hardened v2.
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Team Access Roster</h1>
          <p className="text-muted text-sm leading-relaxed max-w-2xl">{roster.note}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.l} className="bg-white/[0.03] border border-border-subtle rounded-lg p-4">
              <div className={`text-2xl font-bold font-mono mb-1 ${s.c}`}>{s.v}</div>
              <div className="text-xs font-medium text-ink mb-0.5">{s.l}</div>
              <div className="text-xs text-muted">{s.s}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'offboard'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                filter === f ? 'border-gold text-gold bg-gold/10' : 'border-border-subtle text-muted hover:text-ink'}`}>
              {f === 'all' ? `All people (${people.length})` : `Offboard candidates (${people.filter(p => p.priority !== 'low').length})`}
            </button>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-border-subtle rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-muted uppercase tracking-wider text-left">
                  <th className="py-3 px-4 font-medium">Person</th>
                  <th className="py-3 px-3 font-medium">Group</th>
                  {roster.systems.map(s => (
                    <th key={s.key} className="py-3 px-3 font-medium">
                      {s.label}{s.state !== 'connected' && <span className="block text-[9px] text-muted/60 normal-case">not connected</span>}
                    </th>
                  ))}
                  <th className="py-3 px-3 font-medium">Offboard</th>
                  <th className="py-3 px-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p, i) => (
                  <tr key={i} className="border-b border-border-subtle/40 align-top hover:bg-white/[0.015]">
                    <td className="py-3 px-4 text-ink text-xs font-medium whitespace-nowrap">{p.name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${groupColor[p.group]}`}>{p.group}</span>
                    </td>
                    {sysKeys.map(k => <td key={k} className="py-3 px-3">{cell(p[k])}</td>)}
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prioColor[p.priority]}`}>{p.priority}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted leading-snug min-w-[200px]">{p.flag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border-subtle bg-white/[0.02] p-4 opacity-70">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">v2 — Offboarding kill-switch (not built)</div>
          <p className="text-xs text-muted leading-relaxed">
            A future, separately-hardened version adds a per-person “revoke all access” action with confirmation, a two-person rule,
            and a full audit log — using least-privilege admin tokens server-side. Disabled and intentionally absent from this prototype.
          </p>
        </div>

        <footer className="mt-8 pt-6 border-t border-border-subtle text-xs text-muted">
          Local read-only prototype · {roster.snapshot} · no credentials, no destructive actions, not deployed.
        </footer>
      </div>
    </div>
  )
}
