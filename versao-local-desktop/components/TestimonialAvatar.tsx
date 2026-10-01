'use client'
import { useEffect, useRef, useState } from 'react'

type Props = { name: string; photo: string | null; color: string }

// Enquanto a foto real não existir em public/depoimentos, o <img> falha
// silenciosamente e caímos no círculo com as iniciais (em vez de mostrar
// o ícone de imagem quebrada do navegador). O onError sozinho pode perder
// o evento se o 404 chegar antes do React terminar de hidratar, então
// também conferimos img.complete/naturalWidth assim que monta.
export function TestimonialAvatar({ name, photo, color }: Props) {
  const [errored, setErrored] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const initials = name.split(' ').map((n) => n[0]).join('')

  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth === 0) setErrored(true)
  }, [photo])

  if (photo && !errored) {
    return (
      <img
        ref={imgRef}
        src={photo}
        alt={name}
        onError={() => setErrored(true)}
        className="w-16 h-16 rounded-full object-cover shrink-0 border-2"
        style={{ borderColor: color }}
      />
    )
  }

  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0" style={{ backgroundColor: color }}>
      {initials}
    </div>
  )
}
