import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const SUGGESTED = [
  "What's Ryan's most recent role?",
  'What AI or LLM work has Ryan done?',
  'Tell me about ClockHQ',
  'Is Ryan available for hire?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [labelDone, setLabelDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-show the "Ask AI" label after 2s, dismiss after 5s
  useEffect(() => {
    if (labelDone) return
    const t1 = setTimeout(() => setShowLabel(true), 2000)
    const t2 = setTimeout(() => {
      setShowLabel(false)
      setLabelDone(true)
    }, 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [labelDone])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const dismissLabel = () => {
    setShowLabel(false)
    setLabelDone(true)
  }

  const toggleOpen = () => {
    dismissLabel()
    setOpen((v) => !v)
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string }
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              accumulated += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: accumulated, streaming: true }
                return updated
              })
            }
          } catch { /* skip malformed */ }
        }
      }

      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: accumulated }
        return updated
      })
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, I couldn't connect right now. Try again in a moment.",
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <>
      {/* Chat panel — sits above the trigger button */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
          style={{ height: 'min(520px, calc(100vh - 110px))', border: '1px solid rgba(201,168,76,0.2)', background: '#0f1524' }}
        >
          {/* Gold top accent line */}
          <div className="h-0.5 w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden border-2 border-gold/50 shadow-sm shadow-gold/20">
                <img src="/video.gif" alt="Ryan" className="w-full h-full object-cover object-center" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink leading-none">Ask about Ryan</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-muted">AI · Powered by Claude</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted hover:text-ink transition-colors p-1 -mr-1"
              aria-label="Close chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div>
                <p className="text-xs text-muted mb-3">Try asking something:</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-xs text-muted hover:text-ink bg-card hover:bg-card-hover border border-border-subtle rounded-xl px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gold/15 border border-gold/25 text-ink rounded-br-sm'
                      : 'bg-card border border-border-subtle text-muted rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-gold ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border-subtle px-3 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about Ryan…"
              disabled={loading}
              className="flex-1 bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-gold/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Send"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-bg">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating label — animates in, auto-dismisses */}
      {showLabel && !open && (
        <div
          className="fixed z-50 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium text-ink shadow-lg shadow-black/30 cursor-pointer select-none"
          style={{
            bottom: '5.25rem',
            right: '4.5rem',
            background: 'linear-gradient(135deg, #1a2540, #141d30)',
            border: '1px solid rgba(201,168,76,0.35)',
            animation: 'fadeSlideIn 0.35s ease forwards',
          }}
          onClick={toggleOpen}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold shrink-0">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          <span>Ask AI about Ryan</span>
        </div>
      )}

      {/* Trigger button — positioned above the PDF print button */}
      <button
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Chat with AI about Ryan'}
        className="fixed z-50 flex items-center justify-center transition-all duration-200 print:hidden"
        style={{
          bottom: '4.75rem',
          right: '1rem',
          width: '3rem',
          height: '3rem',
          borderRadius: '9999px',
          ...(open
            ? {
                background: '#0f1524',
                border: '1px solid #1e2d42',
                color: '#8d97aa',
              }
            : {
                background: 'linear-gradient(135deg, #e4c76b, #c9a84c)',
                border: '1px solid rgba(201,168,76,0.6)',
                color: '#090c15',
                boxShadow: '0 0 0 0 rgba(201,168,76,0.4), 0 4px 20px rgba(201,168,76,0.35)',
              }),
        }}
      >
        {/* Pulse rings when closed */}
        {!open && (
          <>
            <span
              className="absolute inset-0 rounded-full"
              style={{ animation: 'chatPulse 2s ease-out infinite', background: 'rgba(201,168,76,0.25)' }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{ animation: 'chatPulse 2s ease-out 0.6s infinite', background: 'rgba(201,168,76,0.15)' }}
            />
          </>
        )}

        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            <path d="M20 3v4M22 5h-4" />
          </svg>
        )}
      </button>

      {/* Keyframe animations */}
      <style>{`
        @keyframes chatPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.9); opacity: 0;   }
          100% { transform: scale(1.9); opacity: 0;   }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0);   }
        }
      `}</style>
    </>
  )
}
