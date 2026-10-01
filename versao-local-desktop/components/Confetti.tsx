'use client'
import { useEffect, useState } from 'react'

const COLORS = ['#4F80AC', '#F4801E', '#4FC7B8', '#22c55e', '#facc15']

// Confete leve em CSS puro (sem lib externa) — dispara uma vez quando
// `trigger` muda, pensado pra "aula não é game engine" (Trophy UI):
// pequeno, ancorado no elemento, não a tela inteira.
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number; rotate: number }[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const next = Array.from({ length: 24 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.15,
      rotate: Math.random() * 360,
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 1400)
    return () => clearTimeout(t)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 w-2 h-2 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
