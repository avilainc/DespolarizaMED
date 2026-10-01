'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, Lock, CalendarClock, Dna, Atom, Sigma, FlaskConical, Globe, Landmark, Feather } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { subjectColor } from '@/lib/subjectColors'

// Placeholder — troca pra dado real (tabela courses) assim que o schema
// estiver aplicado no Supabase. Assinatura dá acesso a todas as matérias;
// as que ainda não têm aula gravada aparecem desabilitadas.
// Cor por matéria vem de lib/subjectColors.ts (fonte única — evita duas
// paletas que podem ficar dessincronizadas). Ícone por matéria também
// pedido por Paulo — trocou o "caderninho" genérico por um símbolo
// minimalista específico de cada uma.
const myCourses = [
  { slug: 'biologia', title: 'Biologia', progress: 0, lessons: 41, ready: true, color: subjectColor('Biologia'), icon: Dna },
  { slug: 'matematica', title: 'Matemática', progress: 0, lessons: 0, ready: false, color: subjectColor('Matemática'), icon: Sigma },
  { slug: 'fisica', title: 'Física', progress: 0, lessons: 0, ready: false, color: subjectColor('Física'), icon: Atom },
  { slug: 'quimica', title: 'Química', progress: 0, lessons: 0, ready: false, color: subjectColor('Química'), icon: FlaskConical },
  { slug: 'geografia', title: 'Geografia', progress: 0, lessons: 0, ready: false, color: subjectColor('Geografia'), icon: Globe },
  { slug: 'historia', title: 'História', progress: 0, lessons: 0, ready: false, color: subjectColor('História'), icon: Landmark },
  { slug: 'redacao', title: 'Redação', progress: 0, lessons: 0, ready: false, color: subjectColor('Redação'), icon: Feather },
]

type TodayEvent = { id: string; title: string; event_time: string | null }

export default function DashboardPage() {
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title, event_time')
        .eq('user_id', data.user.id)
        .eq('event_date', todayStr)
      setTodayEvents(events ?? [])
    })
  }, [])

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {todayEvents.length > 0 && (
          <Link
            href="/calendario"
            className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 mb-6 hover:border-accent/60 transition"
          >
            <CalendarClock size={18} className="text-accent shrink-0" />
            <p className="text-sm text-fg">
              Você tem {todayEvents.length} {todayEvents.length === 1 ? 'compromisso' : 'compromissos'} hoje:{' '}
              <span className="text-muted">{todayEvents.map((e) => e.title).join(', ')}</span>
            </p>
          </Link>
        )}

        <h1 className="text-2xl font-bold text-fg mb-1">Meus cursos</h1>
        <p className="text-muted mb-8">Continue de onde parou.</p>

        <div className="grid sm:grid-cols-2 gap-5">
          {myCourses.map((course) => {
            const Icon = course.icon
            return course.ready ? (
              <Link
                key={course.slug}
                href={`/cursos/${course.slug}`}
                className="border rounded-2xl p-5 transition flex items-center gap-4 hover:brightness-110"
                style={{ borderColor: `${course.color}80`, backgroundColor: `${course.color}40` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${course.color}66` }}>
                  <Icon size={22} style={{ color: course.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-fg truncate">{course.title}</h3>
                  <p className="text-muted text-xs mb-2">{course.lessons} aulas</p>
                  <div className="h-1.5 bg-edge rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                  </div>
                </div>
                <Play size={18} style={{ color: course.color }} className="shrink-0" />
              </Link>
            ) : (
              <div key={course.slug} className="border rounded-2xl p-5 flex items-center gap-4" style={{ borderColor: `${course.color}55`, backgroundColor: `${course.color}29` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${course.color}4d` }}>
                  <Icon size={22} style={{ color: course.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-fg truncate">{course.title}</h3>
                  <p className="text-faint text-xs">Em produção</p>
                </div>
                <Lock size={16} className="text-faint shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
