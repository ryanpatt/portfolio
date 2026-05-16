import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailLog {
  TransactionID: string
  MsgID: string
  To: string
  FromEmail: string
  Subject: string
  EventDate: string
  EventType: string
  ChannelName?: string
  MessageCategory?: string
  Message?: string
  IPAddress?: string
  PoolName?: string
}

interface EmailView {
  Preview?: { Body?: string; Subject?: string; From?: string }
  Status?: { From?: string; To?: string; Date?: string }
}

interface Stats {
  EmailTotal?: number
  Delivered?: number
  Bounced?: number
  Opened?: number
  Clicked?: number
  Unsubscribed?: number
  Complaints?: number
  NotDelivered?: number
}

type SortKey = 'EventDate' | 'To' | 'Subject' | 'EventType'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

const ALL_EVENT_TYPES = [
  'All', 'Sent', 'Delivered', 'Open', 'Click',
  'Bounce', 'Complaint', 'Unsubscribe', 'Submission',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(type: string) {
  switch (type) {
    case 'Delivered':    return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
    case 'Open':         return 'bg-blue-900/50 text-blue-300 border border-blue-700/40'
    case 'Click':        return 'bg-purple-900/50 text-purple-300 border border-purple-700/40'
    case 'Bounce':       return 'bg-red-900/50 text-red-300 border border-red-700/40'
    case 'Complaint':    return 'bg-pink-900/50 text-pink-300 border border-pink-700/40'
    case 'Unsubscribe':  return 'bg-orange-900/50 text-orange-300 border border-orange-700/40'
    case 'Sent':         return 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30'
    case 'Submission':   return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/40'
    default:             return 'bg-surface text-muted border border-border-subtle'
  }
}

function statusDot(type: string) {
  switch (type) {
    case 'Delivered':    return 'bg-emerald-400'
    case 'Open':         return 'bg-blue-400'
    case 'Click':        return 'bg-purple-400'
    case 'Bounce':       return 'bg-red-400'
    case 'Complaint':    return 'bg-pink-400'
    case 'Unsubscribe':  return 'bg-orange-400'
    case 'Sent':         return 'bg-emerald-500'
    case 'Submission':   return 'bg-yellow-400 animate-pulse'
    default:             return 'bg-gray-400'
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
  const headers = ['Date', 'EventType', 'To', 'From', 'Subject', 'Channel', 'MsgID', 'TransactionID', 'Message']
  const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(formatDate(r.EventDate)),
      escape(r.EventType),
      escape(r.To),
      escape(r.FromEmail),
      escape(r.Subject),
      escape(r.ChannelName || ''),
      escape(r.MsgID),
      escape(r.TransactionID),
      escape(r.Message || ''),
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
  const label = col === 'EventDate' ? 'Date' : col === 'EventType' ? 'Event' : col
  return (
    <button onClick={() => onClick(col)} className="flex items-center gap-1 group">
      <span className={active ? 'text-gold' : 'text-muted group-hover:text-ink transition-colors'}>{label}</span>
      <span className="text-muted text-xs">
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmailsPage() {
  // Data
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)

  // Filters — eventtype is client-side; date range triggers API refetch
  const [filterEventType, setFilterEventType] = useState('All')
  const [dateFrom, setDateFrom] = useState(() => isoDate(new Date(Date.now() - 7 * 86400000)))
  const [dateTo, setDateTo] = useState(() => isoDate(new Date()))
  const [pendingDateFrom, setPendingDateFrom] = useState(() => isoDate(new Date(Date.now() - 7 * 86400000)))
  const [pendingDateTo, setPendingDateTo] = useState(() => isoDate(new Date()))

  // Table state
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('EventDate')
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
    const res = await fetch(`/api/elasticemail?${qs}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // ── Load emails ─────────────────────────────────────────────────────────────

  const loadEmails = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {
        action: 'emails',
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      }
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      // eventtype filtering is done client-side (API uses undocumented numeric enums)

      const data: EmailLog[] = await apiFetch(params)
      setEmails(Array.isArray(data) ? data : [])
      if (Array.isArray(data)) {
        if (data.length === PAGE_SIZE) setTotal((page + 2) * PAGE_SIZE)
        else setTotal(page * PAGE_SIZE + data.length)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load emails')
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, apiFetch])

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch({ action: 'stats', from: dateFrom, to: dateTo })
      setStats(data)
    } catch { /* non-critical */ }
  }, [dateFrom, dateTo, apiFetch])

  useEffect(() => {
    loadEmails(); loadStats()
  }, [loadEmails, loadStats])

  // ── Auto-refresh ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (refreshRef.current) clearTimeout(refreshRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (!refreshInterval) { setCountdown(0); return }

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
  }, [refreshInterval, loadEmails, loadStats])

  // ── Client-side filter + sort ────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = filterEventType === 'All'
    ? emails
    : emails.filter(e => e.EventType === filterEventType)

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortKey] ?? ''
    let bv: string | number = b[sortKey] ?? ''
    if (sortKey === 'EventDate') {
      av = new Date(av as string).getTime()
      bv = new Date(bv as string).getTime()
    }
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  // ── Email preview ─────────────────────────────────────────────────────────────

  const openPreview = async (msgid: string) => {
    setPreviewMsgId(msgid)
    setPreviewData(null)
    setPreviewLoading(true)
    try {
      const data = await apiFetch({ action: 'view', msgid })
      setPreviewData(data)
    } catch {
      setPreviewData({})
    } finally {
      setPreviewLoading(false)
    }
  }

  const previewHtml = previewData?.Preview?.Body
    || '<p style="color:#888;font-family:sans-serif;padding:20px">No body content available.</p>'

  // ── Render ────────────────────────────────────────────────────────────────────

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
        <div className="bg-card border border-border-subtle rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Event type */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-muted text-xs">Event type</label>
              <select
                value={filterEventType}
                onChange={e => { setFilterEventType(e.target.value); setPage(0) }}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              >
                {ALL_EVENT_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {/* Date range */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-muted text-xs">From date</label>
              <input
                type="date"
                value={pendingDateFrom}
                onChange={e => setPendingDateFrom(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-muted text-xs">To date</label>
              <input
                type="date"
                value={pendingDateTo}
                onChange={e => setPendingDateTo(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold/50"
              />
            </div>
            {/* Actions */}
            <div className="flex gap-2 items-end flex-wrap">
              <button
                onClick={() => { setDateFrom(pendingDateFrom); setDateTo(pendingDateTo); setPage(0) }}
                className="bg-gold hover:bg-gold-dark text-bg font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  const df = isoDate(new Date(Date.now() - 7 * 86400000))
                  const dt = isoDate(new Date())
                  setFilterEventType('All')
                  setDateFrom(df); setDateTo(dt)
                  setPendingDateFrom(df); setPendingDateTo(dt)
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
          <div className="grid grid-cols-[160px_200px_1fr_120px_100px] gap-0 px-4 py-2.5 border-b border-border-subtle text-xs text-muted bg-surface">
            <SortBtn col="EventDate" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="To"        current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="Subject"   current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortBtn col="EventType" current={sortKey} dir={sortDir} onClick={handleSort} />
            <span className="text-right">Actions</span>
          </div>

          {/* Loading skeleton */}
          {loading && emails.length === 0 && (
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[160px_200px_1fr_120px_100px] gap-0 px-4 py-3 border-b border-border-subtle animate-pulse">
                  {[140, 160, 220, 90, 80].map((w, j) => (
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
              No events found for the selected filters.
            </div>
          )}

          {/* Rows */}
          {sorted.map(email => {
            const rowKey = email.TransactionID || email.MsgID
            const isExpanded = expanded === rowKey
            return (
              <div key={rowKey} className="border-b border-border-subtle last:border-0">
                <div
                  className="grid grid-cols-[160px_200px_1fr_120px_100px] gap-0 px-4 py-3 hover:bg-card-hover cursor-pointer transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rowKey)}
                >
                  {/* Date */}
                  <div className="flex flex-col justify-center">
                    <span className="text-ink text-xs font-medium" title={formatDate(email.EventDate)}>
                      {relativeTime(email.EventDate)}
                    </span>
                    <span className="text-muted text-[10px]">{new Date(email.EventDate).toLocaleDateString()}</span>
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

                  {/* Event type badge */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(email.EventType)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(email.EventType)}`} />
                      {email.EventType}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openPreview(email.MsgID)}
                      className="text-xs text-gold/80 hover:text-gold bg-gold/5 hover:bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : rowKey)}
                      className="text-muted hover:text-ink text-xs p-1 transition-colors"
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
                        <span className="text-muted w-24 shrink-0">Message ID</span>
                        <span className="text-ink font-mono text-[10px] break-all">{email.MsgID}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted w-24 shrink-0">Transaction ID</span>
                        <span className="text-ink font-mono text-[10px] break-all">{email.TransactionID}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted w-24 shrink-0">From</span>
                        <span className="text-ink">{email.FromEmail}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted w-24 shrink-0">Event date</span>
                        <span className="text-ink">{formatDate(email.EventDate)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {email.ChannelName && (
                        <div className="flex gap-2">
                          <span className="text-muted w-24 shrink-0">Channel</span>
                          <span className="text-ink">{email.ChannelName}</span>
                        </div>
                      )}
                      {email.MessageCategory && (
                        <div className="flex gap-2">
                          <span className="text-muted w-24 shrink-0">Category</span>
                          <span className="text-ink">{email.MessageCategory}</span>
                        </div>
                      )}
                      {email.IPAddress && (
                        <div className="flex gap-2">
                          <span className="text-muted w-24 shrink-0">IP</span>
                          <span className="text-ink font-mono">{email.IPAddress}</span>
                        </div>
                      )}
                      {email.Message && (
                        <div className="flex gap-2">
                          <span className="text-muted w-24 shrink-0">Message</span>
                          <span className="text-red-400 break-all">{email.Message}</span>
                        </div>
                      )}
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
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of ~{total} events
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
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border-subtle flex-shrink-0">
              <div className="space-y-0.5 min-w-0">
                <p className="text-ink font-semibold text-sm truncate">
                  {previewData?.Preview?.Subject || previewData?.Status?.From || '—'}
                </p>
                <p className="text-muted text-xs">
                  From: {previewData?.Preview?.From || previewData?.Status?.From || '—'}
                  &nbsp;→&nbsp;
                  {previewData?.Status?.To || '—'}
                </p>
              </div>
              <button
                onClick={() => { setPreviewMsgId(null); setPreviewData(null) }}
                className="text-muted hover:text-ink shrink-0 text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>
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
