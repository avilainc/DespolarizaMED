'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, Users, CreditCard } from 'lucide-react'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ courses: 0, students: 0, activeSubs: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: courses }, { count: students }, { count: activeSubs }] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setStats({ courses: courses ?? 0, students: students ?? 0, activeSubs: activeSubs ?? 0 })
    }
    load()
  }, [])

  const cards = [
    { label: 'Cursos', value: stats.courses, icon: BookOpen },
    { label: 'Alunos cadastrados', value: stats.students, icon: Users },
    { label: 'Assinaturas ativas', value: stats.activeSubs, icon: CreditCard },
  ]

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">Visão geral</h1>
      <div className="grid sm:grid-cols-3 gap-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-edge rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
              <Icon size={18} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-fg">{value}</p>
            <p className="text-muted text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
