'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { nextOccurrence, weekdayLabel, type OfficeHour } from '@/lib/officeHours'
import { Calendar } from 'lucide-react'
import { GoogleMeetIcon } from '@/components/SocialIcons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Mesmos 3 plantões já seedados em create-tables.sql — usados aqui como
// fallback enquanto o SQL não roda no Supabase, pra já mostrar como vai
// ficar. Some sozinho assim que a tabela real tiver dados.
const FALLBACK_OFFICE_HOURS: OfficeHour[] = [
  { id: 'fallback-1', title: 'Plantão de dúvidas', description: null, weekday: 1, time: '17:00:00', specific_date: null, meet_url: 'https://meet.google.com/rwe-jydk-ocs', active: true },
  { id: 'fallback-2', title: 'Planejamento de estudos', description: null, weekday: 2, time: '14:00:00', specific_date: null, meet_url: 'https://meet.google.com/rwe-jydk-ocs', active: true },
  { id: 'fallback-3', title: 'Tutoria com o mentor', description: null, weekday: 5, time: '14:00:00', specific_date: null, meet_url: 'https://meet.google.com/rwe-jydk-ocs', active: true },
]

export default function OfficeHoursPage() {
  const [items, setItems] = useState<OfficeHour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('office_hours').select('*').eq('active', true).then(({ data }) => {
      setItems(data && data.length > 0 ? (data as OfficeHour[]) : FALLBACK_OFFICE_HOURS)
      setLoading(false)
    })
  }, [])

  const sorted = [...items].sort((a, b) => {
    const da = nextOccurrence(a)?.getTime() ?? Infinity
    const db = nextOccurrence(b)?.getTime() ?? Infinity
    return da - db
  })

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1">Plantões</h1>
      <p className="text-muted text-sm mb-6">Encontros ao vivo pra tirar dúvida direto comigo.</p>

      {loading ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted text-sm">Nenhum plantão agendado por enquanto.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((oh) => {
            const when = nextOccurrence(oh)
            return (
              <div key={oh.id} className="bg-surface border border-edge rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <h3 className="text-fg font-semibold mb-1">{oh.title}</h3>
                  {oh.description && <p className="text-muted text-sm mb-2">{oh.description}</p>}
                  <div className="flex items-center gap-1.5 text-faint text-xs">
                    <Calendar size={13} />
                    {oh.specific_date
                      ? when && format(when, "dd 'de' MMMM, HH:mm", { locale: ptBR })
                      : `Toda ${weekdayLabel(oh.weekday)}${oh.time ? `, ${oh.time.slice(0, 5)}` : ''}`}
                  </div>
                </div>
                <a
                  href={oh.meet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shrink-0"
                >
                  <GoogleMeetIcon size={17} /> Entrar na chamada
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
