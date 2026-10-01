'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LayoutDashboard, Calendar, Trophy, BookOpen, Settings, ShieldCheck, LogOut, Video, Sparkles, LayoutGrid, FileText } from 'lucide-react'
import { InstagramIcon, YoutubeIcon } from '@/components/SocialIcons'

const navLinks = [
  { href: '/dashboard', label: 'Cursos', icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/plantoes', label: 'Plantões', icon: Video },
  { href: '/conquistas', label: 'Conquistas', icon: Trophy },
  { href: '/glossario', label: 'Glossário', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: Sparkles },
  { href: '/simulado', label: 'Simulado', icon: FileText },
  { href: '/apps', label: 'Labs', icon: LayoutGrid },
]

// Admin tem sidebar própria (app/(app)/admin/layout.tsx) — essa casca
// só entra nas telas do aluno, pra não duplicar navegação.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
      setIsAdmin(profile?.role === 'admin')
    }
    check()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (pathname?.startsWith('/admin')) return <>{children}</>

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-edge sticky top-0 bg-app/95 backdrop-blur z-10">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <img src="/logo-icon.png" className="w-8 h-8 object-contain" alt="DespolarizaMed" />
            <span className="hidden sm:inline text-fg font-bold">Despolariza<span className="text-accent">Med</span></span>
          </Link>

          <nav className="flex items-center gap-1 flex-1 min-w-0 justify-center">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  (pathname === href || pathname?.startsWith(href + '/')) ? 'bg-primary/15 text-primary-light' : 'text-muted hover:text-fg hover:bg-surface'
                }`}
              >
                <Icon size={15} /> <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-teal-dark hover:bg-surface transition whitespace-nowrap">
                <ShieldCheck size={15} /> <span className="hidden md:inline">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <a href="https://instagram.com/despolarizamed" target="_blank" rel="noreferrer" className="hidden sm:flex text-muted hover:text-fg transition p-2 rounded-lg hover:bg-surface" aria-label="Instagram">
              <InstagramIcon size={17} />
            </a>
            <a href="https://www.youtube.com/@despolarizamed" target="_blank" rel="noreferrer" className="hidden sm:flex text-muted hover:text-fg transition p-2 rounded-lg hover:bg-surface" aria-label="YouTube">
              <YoutubeIcon size={17} />
            </a>
            <ThemeToggle />
            <Link href="/configuracoes" aria-label="Configurações" title="Configurações" className={`text-muted hover:text-fg transition p-2 rounded-lg hover:bg-surface ${pathname === '/configuracoes' ? 'bg-primary/15 text-primary-light' : ''}`}>
              <Settings size={17} />
            </Link>
            <button onClick={handleLogout} className="text-muted hover:text-fg transition p-2 rounded-lg hover:bg-surface" aria-label="Sair">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
