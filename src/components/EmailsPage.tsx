import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailLog {
  MsgID: string
  To: string
  From: string
  Subject: string
  Date: string
  Status: string
  StatusName: string
  Opens: number
  Clicks: number
  ErrorMessage?: string
  ChannelName?: string
  Categories?: string[]
}

interface EmailView {
  Subject: string
  From: string
  To: string
  Body?: { ContentType: string; Content: string; Charset: string }[]
}

interface Stats {
  Recipients?: number
  EmailTotal?: number
  Delivered?: number
  Bounced?: number
  InProgress?: number
  Opened?: number
  Clicked?: number
  Unsubscribed?: number
  Complaints?: number
  NotDelivered?: number
}

type SortKey = 'Date' | 'To' | 'Subject' | 'Status' | 'Opens' | 'Clicks'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

const ALL_STATUSES = [
  'All', 'Delivered', 'Opened', 'Clicked', 'Bounced',
  'Error', 'NotDelivered', 'Unsubscribed', 'Abuse',
  'WaitingToRetry', 'Sending', 'ReadyToSend', 'Expired',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'Delivered':     return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
    case 'Opened':        return 'bg-blue-900/50 text-blue-300 border border-blue-700/40'
    case 'Clicked':       return 'bg-purple-900/50 text-purple-300 border border-purple-700/40'
    case 'Bounced':
    case 'Error':
    case 'NotDelivered':  return 'bg-red-900/50 text-red-300 border border-red-700/40'
    case 'Unsubscribed':  return 'bg-orange-900/50 text-orange-300 border border-orange-700/40'
    case 'Abuse':         return 'bg-pink-900/50 text-pink-300 border border-pink-700/40'
    case 'WaitingToRetry':
    case 'Sending':       return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/40'
    case 'ReadyToSend':   return 'bg-sky-900/50 text-sky-300 border border-sky-700/40'
    default:              return 'bg-surface text-muted border border-border-subtle'
  }
}

function statusDot(status: string) {
  switch (status) {
    case 'Delivered':     return 'bg-emerald-400'
    case 'Opened':        return 'bg-blue-400'
    case 'Clicked':       return 'bg-purple-400'
    case 'Bounced':
    case 'Error':
    case 'NotDelivered':  return 'bg-red-400'
    case 'Unsubscribed':  return 'bg-orange-400'
    case 'Abuse':         return 'bg-pink-400'
    case 'WaitingToRetry':
    case 'Sending':       return 'bg-yellow-400 animate-pulse'
    default:              return 'bg-gray-400'
  }
}

function relativeTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString()
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function exportCsv(rows: EmailLog[]) {
  const headers = ['Date', 'To', 'From', 'Subject', 'Status', 'Opens', 'Clicks', 'MsgID', 'Error']
  const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(formatDate(r.Date)),
      escape(r.To),
      escape(r.From),
      escape(r.Subject),
      escape(r.Status),
      r.Opens,
      r.Clicks,
      escape(r.MsgID),
      escape(r.ErrorMessage || ''),
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `elasticemail-${isoDate(new Date())}.csv`
  a.click()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="bg-card border border-border-subtle rounded-xl p-4 flex flex-col gap-1 min-w-[100px]">
      <span className={`text-2xl font-bold font-display ${color}`}>
        {value?.toLocaleString() ?? '—'}
      </span>
      <span className="text-muted text-xs uppercase tracking-wider">{label}</span>
    </div>
  )
}

function SortBtn({ col, current, dir, onClick }: {
  col: SortKey; current: SortKey; dir: SortDir; onClick: (k: SortKey) => void
}) {
  const active = col === current
  return (
    <button onClick={() => onClick(col)} className="flex items-center gap-1 group">
      <span className={active ? 'text-gold' : 'text-muted group-hover:text-ink transition-colors'}>{col}</span>
      <span className="text-muted text-xs">
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmailsPage() {
  // Auth
  const [password, setPassword] = useState(() => sessionStorage.getItem('ee_pw') || '')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  // Data
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date(Date.now() - 7 * 86400000)))
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()))

  // Table state
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('Date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Email preview modal
  const [previewMsgId, setPreviewMsgId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<EmailView | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Auto-refresh
  const [refreshInterval, setRefreshInterval] = useState<number>(0)
  const [countdown, setCountdown] = useState(0)
  const refreshRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── API helpers ─────────────────────────────────────────────────────────────

  const apiFetch = useCallback(async (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`/api/elasticemail?${qs}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('ee_pw') || ''}` },
    })
    if (res.status === 401) {
      sessionStorage.removeItem('ee_pw')
      setAuthed(false)
      throw new Error('Unauthorized')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // ── Auth ────────────────────────────────────────────────────────────────────

  const tryLogin = async () => {
    setAuthError('')
    try {
      await apiFetch({ action: 'stats' })
      sessionStorage.setItem('ee_pw', password)
      setAuthed(true)
    } catch {
      setAuthError('Incorrect password.')
    }
  }

  // ── Load emails ─────────────────────────────────────────────────────────────

  const loadEmails = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {
        action: 'emails',
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        startDate: dateFrom ? `${dateFrom}T00:00:00` : '',
        endDate: dateTo ? `${dateTo}T23:59:59` : '',
      }
      if (filterStatus !== 'All') params.status = filterStatus
      if (filterFrom) params.from = filterFrom
      if (filterTo) params.to = filterTo
      if (search) params.searchTerm = search

      // Remove empty params
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })

      const data: EmailLog[] = await apiFetch(params)
      setEmails(Array.isArray(data) ? data : [])
      // ElasticEmail doesn't return total count, approximate from page
      if (Array.isArray(data)) {
        if (data.length === PAGE_SIZE) setTotal((page + 2) * PAGE_SIZE)
        else setTotal(page * PAGE_SIZE + data.length)
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== 'Unauthorized') {
        setError(e.message || 'Failed to load emails')
      }
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, filterStatus, filterFrom, filterTo, search, apiFetch])

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch({
        action: 'stats',
        from: dateFrom ? `${dateFrom}T00:00:00` : '',
        to: dateTo ? `${dateTo}T23:59:59` : '',
      })
      setStats(data)
    } catch { /* non-critical */ }
  }, [dateFrom, dateTo, apiFetch])

  useEffect(() => {
    if (authed) { loadEmails(); loadStats() }
  }, [authed, loadEmails, loadStats])

  // ── Auto-refresh ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (refreshRef.current) clearTimeout(refreshRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (!refreshInterval || !authed) { setCountdown(0); return }

    setCountdown(refreshInterval)
    countdownRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? refreshInterval : c - 1))
    }, 1000)
    refreshRef.current = setTimeout(function tick() {
      loadEmails()
      loadStats()
      setCountdown(refreshInterval)
      refreshRef.current = setTimeout(tick, refreshInterval * 1000)
    }, refreshInterval * 1000)

    return () => {
      if (refreshRef.current) clearTimeout(refreshRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [refreshInterval, authed, loadEmails, loadStats])

  // ── Sorting (client-side within page) ────────────────────────────────────────

  const sorted = [...emails].sort((a, b) => {
    let av: string | number = a[sortKey] ?? ''
    let bv: string | number = b[sortKey] ?? ''
    if (sortKey === 'Date') { av = new Date(av as string).getTime(); bv = new Date(bv as string).getTime() }
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // ── Email preview ─────────────────────────────────────────────────────────────

  const openPreview = async (msgid: string) => {
    setPreviewMsgId(msgid)
    setPreviewData(null)
    setPreviewLoading(true)
    try {
      const data = await apiFetch({ action: 'view', msgid })
      setPreviewData(data)
    } catch (e: unknown) {
      setPreviewData({ Subject: 'Error loading email', From: '', To: '', Body: [] })
    } finally {
      setPreviewLoading(false)
    }
  }

  const previewHtml = previewData?.Body?.find(b => b.ContentType === 'HTML')?.Content
    || previewData?.Body?.find(b => b.ContentType === 'PlainText')?.Content?.replace(/\n/g, '<br>')
    || '<p style="color:#888;font-family:sans-serif;padding:20px">No body content available.</p>'

  // ── Render ────────────────────────────────────────────────────────────────────

  // Password gate
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-card border border-border-subtle rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📧</span>
            <h1 className="font-display text-xl font-bold text-ink">Email Monitor</h1>
          </div>
          <p className="text-muted text-sm mb-5">Enter the dashboard password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
            placeholder="Password"
            className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-ink placeholder-muted text-sm mb-3 focus:outline-none focus:border-gold/50"
            autoFocus
          />
          {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
          <button
            onClick={tryLogin}
            className="w-full bg-gold hover:bg-gold-dark text-bg font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">

      {/* ── Header ── */}
      <div className="bg-surface border-b border-border-subtle px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">📧</span>
          <h1 className="font-display text-lg font-bold text-ink">ElasticEmail Monitor</h1>
          <span className="text-xs text-muted bg-card px-2 py-0.5 rounded-full border border-border-subtle">
            clearchoicelaundry.com
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh */}
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs">Auto-refresh:</span>
            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              className="bg-card border border-border-subtle text-ink text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-gold/50"
            >
              <option value={0}>Off</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
            </select>
            {refreshInterval > 0 && (
              <span className="text-gold text-xs font-mono w-6 text-center">{countdown}s</span>
            )}
          </div>
          <button
            onClick={() => { loadEmails(); loadStats() }}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <span className={loading ? 'animate-spin' : ''}>⟳</span> Refresh
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('ee_pw'); setAuthed(false) }}
            className="text-muted hover:text-ink text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-[1600px] mx-auto">

        {/* ── Stats cards ── */}
        {stats && (
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Sent"    value={stats.EmailTotal}   color="text-ink" />
            <StatCard label="Delivered"     value={stats.Delivered}    color="text-emerald-400" />
            <StatCard label="Opened"        value={stats.Opened}       color="text-blue-400" />
            <StatCard label="Clicked"       value={stats.Clicked}      color="text-purple-400" />
            <StatCard label="Bounced"       value={stats.Bounced}      color="text-red-400" />
            <StatCard label="Unsubscribed"  value={stats.Unsubscribed} color="text-orange-400" />
            <StatCard label="Complaints"    value={stats.Complaints}   color="text-pink-400" />
            <StatCard label="Not Delivered" value={stats.NotDelivered} color="text-red-400" />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-card border border-border-subtle rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-muted text-xs">Search</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (setPage(0), loadEmails())}
                placeholder="Email, subject, domain..."
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-gold/50"
              />
            </div>
            {/* From address filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-muted text-xs">From address</label>
              <input
                type="text"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                placeholder="sender@..."
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-gold/50"
              />
            </div>
            {/* To address filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-muted text-xs">To address</label>
              <input
                type="text"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                placeholder="recipient@..."
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-gold/50"
              />
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-muted text-xs">Status</label>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              >
                {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {/* Date range */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-muted text-xs">From date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-muted text-xs">To date</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              />
            </div>
            {/* Actions */}
            <div className="flex gap-2 items-end flex-wrap">
              <button
                onClick={() => { setPage(0); loadEmails(); loadStats() }}
                className="bg-gold hover:bg-gold-dark text-bg font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setSearch(''); setFilterStatus('All'); setFilterFrom(''); setFilterTo('')
                  setDateFrom(isoDate(new Date(Date.now() - 7 * 86400000)))
                  setDateTo(isoDate(new Date()))
                  setPage(0)
                }}
                className="bg-surface hover:bg-card-hover border border-border-subtle text-muted hover:text-ink text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => exportCsv(emails)}
                disabled={emails.length === 0}
                className="bg-surface hover:bg-card-hover border border-border-subtle text-muted hover:text-ink text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                title="Export current page to CSV"
              >
                ↓ CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[160px_220px_1fr_130px_52px_52px_100px] gap-0 px-4 py-2.5 border-b border-border-subtle text-xs text-muted bg-surface">
            <SortBtn col="Date"    current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="To"      current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="Subject" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="Status"  current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="Opens"   current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="Clicks"  current={sortKey} dir={sortDir} onClick={handleSort} />
            <span className="text-right">Actions</span>
          </div>

          {/* Loading skeleton */}
          {loading && emails.length === 0 && (
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[160px_220px_1fr_130px_52px_52px_100px] gap-0 px-4 py-3 border-b border-border-subtle animate-pulse">
                  {[140, 180, 220, 110, 30, 30, 80].map((w, j) => (
                    <div key={j} className="flex items-center">
                      <div className="bg-surface rounded h-3" style={{ width: w }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && emails.length === 0 && !error && (
            <div className="py-16 text-center text-muted text-sm">
              No emails found for the selected filters.
            </div>
          )}

          {/* Rows */}
          {sorted.map(email => {
            const isExpanded = expanded === email.MsgID
            return (
              <div key={email.MsgID} className="border-b border-border-subtle last:border-0">
                {/* Main row */}
                <div
                  className="grid grid-cols-[160px_220px_1fr_130px_52px_52px_100px] gap-0 px-4 py-3 hover:bg-card-hover cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : email.MsgID)}
                >
                  {/* Date */}
                  <div className="flex flex-col justify-center">
                    <span className="text-ink text-xs font-medium" title={formatDate(email.Date)}>
                      {relativeTime(email.Date)}
                    </span>
                    <span className="text-muted text-[10px]">{new Date(email.Date).toLocaleDateString()}</span>
                  </div>

                  {/* To */}
                  <div className="flex items-center pr-2">
                    <span className="text-ink text-xs truncate" title={email.To}>{email.To}</span>
                  </div>

                  {/* Subject */}
                  <div className="flex items-center pr-2">
                    <span className="text-ink text-sm truncate" title={email.Subject}>
                      {email.Subject || <span className="text-muted italic">No subject</span>}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(email.Status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(email.Status)}`} />
                      {email.Status}
                    </span>
                  </div>

                  {/* Opens */}
                  <div className="flex items-center justify-center">
                    {email.Opens > 0
                      ? <span className="text-blue-400 text-sm font-semibold">{email.Opens}</span>
                      : <span className="text-muted text-xs">—</span>}
                  </div>

                  {/* Clicks */}
                  <div className="flex items-center justify-center">
                    {email.Clicks > 0
                      ? <span className="text-purple-400 text-sm font-semibold">{email.Clicks}</span>
                      : <span className="text-muted text-xs">—</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openPreview(email.MsgID)}
                      className="text-xs text-gold/80 hover:text-gold bg-gold/5 hover:bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View Email
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : email.MsgID)}
                      className="text-muted hover:text-ink text-xs p-1 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded detail row */}
                {isExpanded && (
                  <div className="bg-surface/50 border-t border-border-subtle px-4 py-3 grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-muted w-20 shrink-0">Message ID</span>
                        <span className="text-ink font-mono text-[10px] break-all">{email.MsgID}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted w-20 shrink-0">From</span>
                        <span className="text-ink">{email.From}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted w-20 shrink-0">Sent at</span>
                        <span className="text-ink">{formatDate(email.Date)}</span>
                      </div>
                      {email.ChannelName && (
                        <div className="flex gap-2">
                          <span className="text-muted w-20 shrink-0">Channel</span>
                          <span className="text-ink">{email.ChannelName}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {email.ErrorMessage && (
                        <div className="flex gap-2">
                          <span className="text-muted w-20 shrink-0">Error</span>
                          <span className="text-red-400 break-all">{email.ErrorMessage}</span>
                        </div>
                      )}
                      {email.Categories && email.Categories.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-muted w-20 shrink-0">Categories</span>
                          <span className="text-ink">{email.Categories.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex gap-4 mt-1">
                        <span className="text-muted">Opens: <span className="text-blue-400 font-semibold">{email.Opens}</span></span>
                        <span className="text-muted">Clicks: <span className="text-purple-400 font-semibold">{email.Clicks}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Pagination ── */}
        {(total > 0 || emails.length > 0) && (
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of ~{total}
              {loading && <span className="ml-2 text-gold text-xs">Loading...</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-1.5 bg-card border border-border-subtle rounded-lg hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-ink text-xs"
              >
                ← Prev
              </button>
              <span className="text-xs px-2">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={emails.length < PAGE_SIZE || loading}
                className="px-3 py-1.5 bg-card border border-border-subtle rounded-lg hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-ink text-xs"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Email Preview Modal ── */}
      {previewMsgId && (
        <div
          className="fixed inset-0 z-50 bg-bg/80 backdrop-blur flex items-center justify-center p-4"
          onClick={() => { setPreviewMsgId(null); setPreviewData(null) }}
        >
          <div
            className="bg-card border border-border-subtle rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border-subtle flex-shrink-0">
              <div className="space-y-0.5 min-w-0">
                <p className="text-ink font-semibold text-sm truncate">{previewData?.Subject || '—'}</p>
                <p className="text-muted text-xs">From: {previewData?.From} &nbsp;→&nbsp; {previewData?.To}</p>
              </div>
              <button
                onClick={() => { setPreviewMsgId(null); setPreviewData(null) }}
                className="text-muted hover:text-ink shrink-0 text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64 text-muted text-sm">
                  <span className="animate-spin mr-2">⟳</span> Loading email...
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[70vh]"
                  sandbox="allow-same-origin"
                  title="Email preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
