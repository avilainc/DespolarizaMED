'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, BookOpen, Library, HelpCircle, ArrowLeft, Video, Sparkles } from 'lucide-react'

// Gate simples por role — qualquer usuário logado sem profiles.role='admin'
// é chutado pro dashboard normal. Paulo precisa ter uma linha em `profiles`
// com role='admin' (dá pra setar direto na tabela pelo Supabase Studio).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let active = true

    async function check() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        router.replace('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle()

      if (!active) return
      if (profile?.role === 'admin') {
        setAllowed(true)
      } else {
        router.replace('/dashboard')
      }
      setChecking(false)
    }

    check()
    return () => { active = false }
  }, [router])

  if (checking) {
    return <div className="min-h-screen bg-app flex items-center justify-center text-muted text-sm">Verificando acesso...</div>
  }

  if (!allowed) return null

  const links = [
    { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
    { href: '/admin/cursos', label: 'Cursos', icon: BookOpen },
    { href: '/admin/glossario', label: 'Glossário', icon: Library },
    { href: '/admin/questoes', label: 'Questões rápidas', icon: HelpCircle },
    { href: '/admin/flashcards', label: 'Flashcards', icon: Sparkles },
    { href: '/admin/plantoes', label: 'Plantões', icon: Video },
  ]

  return (
    <div className="min-h-screen bg-app flex">
      <aside className="w-56 shrink-0 border-r border-edge px-3 py-6 hidden sm:block">
        <div className="px-3 mb-6">
          <span className="text-fg font-bold">Despolariza<span className="text-accent">Med</span></span>
          <p className="text-faint text-xs">Admin</p>
        </div>
        <nav className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === href ? 'bg-primary/15 text-primary-light' : 'text-muted hover:bg-surface hover:text-fg'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 mt-4 rounded-lg text-sm font-medium text-faint hover:bg-surface hover:text-fg transition">
          <ArrowLeft size={16} /> Voltar ao site
        </Link>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
