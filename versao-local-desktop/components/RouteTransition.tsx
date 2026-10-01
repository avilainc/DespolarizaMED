'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingScreen } from './LoadingScreen'

// Overlay de transição entre páginas — pega cliques em qualquer <Link>
// interno (fase de captura, antes do próprio Next.js navegar) e mostra a
// tela de carregamento com a logo girando até a nova página montar.
// MIN_VISIBLE_MS evita "piscar" em navegações muito rápidas.
const MIN_VISIBLE_MS = 300

const TransitionContext = createContext<{ start: () => void } | null>(null)

export function useRouteTransition() {
  return useContext(TransitionContext)
}

export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const shownAt = useRef<number | null>(null)
  const prevPathname = useRef(pathname)

  const start = () => {
    setActive((prev) => {
      if (!prev) shownAt.current = Date.now()
      return true
    })
  }

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    if (!active) return
    const elapsed = shownAt.current ? Date.now() - shownAt.current : MIN_VISIBLE_MS
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)
    const t = setTimeout(() => setActive(false), remaining)
    return () => clearTimeout(t)
  }, [pathname, active])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement)?.closest('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return
      start()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <TransitionContext.Provider value={{ start }}>
      {children}
      {active && (
        <div className="fixed inset-0 z-[999]">
          <LoadingScreen message="Carregando página..." />
        </div>
      )}
    </TransitionContext.Provider>
  )
}
