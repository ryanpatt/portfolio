import { useEffect, useRef, useState } from 'react'

const W = 240
const H = 140
const PADDLE_H = 32
const PADDLE_W = 3
const BALL = 4

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)
  const stateRef = useRef({
    ball: { x: W / 2, y: H / 2, vx: 1.4, vy: 0.9 },
    leftY: H / 2 - PADDLE_H / 2,
    rightY: H / 2 - PADDLE_H / 2,
    score: { l: 0, r: 0 },
  })
  const mouseYRef = useRef<number | null>(null)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)

    let raf = 0

    const draw = () => {
      const s = stateRef.current
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(W / 2, 4)
      ctx.lineTo(W / 2, H - 4)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#c9a84c'
      ctx.fillRect(3, s.leftY, PADDLE_W, PADDLE_H)
      ctx.fillRect(W - PADDLE_W - 3, s.rightY, PADDLE_W, PADDLE_H)

      ctx.fillStyle = '#e8edf5'
      ctx.fillRect(s.ball.x, s.ball.y, BALL, BALL)

      ctx.font = 'bold 11px ui-monospace, monospace'
      ctx.fillStyle = 'rgba(201, 168, 76, 0.55)'
      ctx.textAlign = 'center'
      ctx.fillText(String(s.score.l), W / 4, 16)
      ctx.fillText(String(s.score.r), (3 * W) / 4, 16)
    }

    const tick = () => {
      const s = stateRef.current

      if (activeRef.current) {
        if (mouseYRef.current !== null) {
          s.rightY = Math.max(
            0,
            Math.min(H - PADDLE_H, mouseYRef.current - PADDLE_H / 2),
          )
        }

        const target = s.ball.y - PADDLE_H / 2
        const diff = target - s.leftY
        s.leftY += Math.sign(diff) * Math.min(Math.abs(diff), 1.5)
        s.leftY = Math.max(0, Math.min(H - PADDLE_H, s.leftY))

        s.ball.x += s.ball.vx
        s.ball.y += s.ball.vy

        if (s.ball.y <= 0) {
          s.ball.y = 0
          s.ball.vy *= -1
        }
        if (s.ball.y >= H - BALL) {
          s.ball.y = H - BALL
          s.ball.vy *= -1
        }

        if (
          s.ball.x <= 3 + PADDLE_W &&
          s.ball.y + BALL >= s.leftY &&
          s.ball.y <= s.leftY + PADDLE_H &&
          s.ball.vx < 0
        ) {
          s.ball.vx = Math.min(Math.abs(s.ball.vx) * 1.04, 3.2)
          s.ball.vy += (s.ball.y - (s.leftY + PADDLE_H / 2)) * 0.05
        }
        if (
          s.ball.x + BALL >= W - PADDLE_W - 3 &&
          s.ball.y + BALL >= s.rightY &&
          s.ball.y <= s.rightY + PADDLE_H &&
          s.ball.vx > 0
        ) {
          s.ball.vx = -Math.min(Math.abs(s.ball.vx) * 1.04, 3.2)
          s.ball.vy += (s.ball.y - (s.rightY + PADDLE_H / 2)) * 0.05
        }

        if (s.ball.x < -BALL) {
          s.score.r += 1
          s.ball = {
            x: W / 2,
            y: H / 2,
            vx: 1.4,
            vy: (Math.random() - 0.5) * 1.6,
          }
        }
        if (s.ball.x > W) {
          s.score.l += 1
          s.ball = {
            x: W / 2,
            y: H / 2,
            vx: -1.4,
            vy: (Math.random() - 0.5) * 1.6,
          }
        }
      }

      draw()
      raf = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => {
        setActive(false)
        mouseYRef.current = null
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        mouseYRef.current = ((e.clientY - rect.top) / rect.height) * H
      }}
      className="hidden md:block absolute top-8 right-8 lg:top-12 lg:right-12 z-20 rounded-lg overflow-hidden border border-gold/20 hover:border-gold/40 bg-card transition-colors print:hidden shadow-lg shadow-black/20"
      style={{ width: W, height: H }}
      aria-label="Pong mini-game — hover to play"
    >
      <canvas ref={canvasRef} className="block" />
      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/75 backdrop-blur-[1px] pointer-events-none">
          <span className="font-display font-semibold text-gold text-sm tracking-wider uppercase">
            Pong
          </span>
          <span className="text-muted text-[10px] tracking-wider uppercase mt-1">
            Hover to play
          </span>
        </div>
      )}
    </div>
  )
}
