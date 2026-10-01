'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getStoredTheme, applyTheme, type Theme } from '@/lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(getStoredTheme())
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) return <div className={`w-10 h-10 ${className}`} />

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      className={`w-10 h-10 rounded-full bg-surface border border-edge shadow-sm flex items-center justify-center hover:border-primary/50 transition ${className}`}
    >
      {theme === 'dark' ? <Moon size={16} className="text-primary-light" /> : <Sun size={16} className="text-accent" />}
    </button>
  )
}
