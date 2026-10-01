'use client'
import { useEffect, useState } from 'react'

// Efeito visto no chagas.ai: um prefixo fixo + um final que "digita" e
// "apaga" alternando entre frases, com cursor piscando.
export function TypewriterRotator({ phrases, className = '' }: { phrases: string[]; className?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]
    const speed = deleting ? 25 : 45
    const pauseAtEnd = 1800
    const pauseAtStart = 300

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pauseAtEnd)
      return () => clearTimeout(t)
    }
    if (deleting && text === '') {
      const t = setTimeout(() => {
        setDeleting(false)
        setPhraseIndex((i) => (i + 1) % phrases.length)
      }, pauseAtStart)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      setText(current.slice(0, deleting ? text.length - 1 : text.length + 1))
    }, speed)
    return () => clearTimeout(t)
  }, [text, deleting, phraseIndex, phrases])

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" />
    </span>
  )
}
