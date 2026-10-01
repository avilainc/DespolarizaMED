'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'

type CalendarEvent = {
  id: string
  title: string
  event_date: string
  event_time: string | null
  color: string
  notes: string | null
}

// Mesmo esquema de cores/categorias do calendário do SinapseMed — Paulo
// pediu explicitamente esse estilo (grade de mês + cores de destaque),
// só que aqui gravado no Supabase em vez de localStorage.
const COLORS: { id: string; label: string; dot: string; bg: string; border: string; text: string; ring: string }[] = [
  { id: 'blue', label: 'Estudo', dot: 'bg-blue-500', bg: 'bg-blue-500/15', border: 'border-blue-500', text: 'text-blue-400', ring: 'ring-blue-500' },
  { id: 'orange', label: 'Prova', dot: 'bg-orange-500', bg: 'bg-orange-500/15', border: 'border-orange-500', text: 'text-orange-400', ring: 'ring-orange-500' },
  { id: 'red', label: 'Urgente', dot: 'bg-red-500', bg: 'bg-red-500/15', border: 'border-red-500', text: 'text-red-400', ring: 'ring-red-500' },
  { id: 'green', label: 'Pessoal', dot: 'bg-green-500', bg: 'bg-green-500/15', border: 'border-green-500', text: 'text-green-400', ring: 'ring-green-500' },
  { id: 'purple', label: 'Plantão', dot: 'bg-purple-500', bg: 'bg-purple-500/15', border: 'border-purple-500', text: 'text-purple-400', ring: 'ring-purple-500' },
  { id: 'yellow', label: 'Lembrete', dot: 'bg-yellow-500', bg: 'bg-yellow-500/15', border: 'border-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500' },
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function colorMeta(id: string) {
  return COLORS.find((c) => c.id === id) ?? COLORS[0]
}

const emptyForm = { title: '', time: '', color: 'blue', notes: '' }

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Nomes das categorias (Estudo, Prova, Urgente...) são só o ponto de
  // partida — o aluno pode renomear cada uma pra o que quiser (ex.: trocar
  // "Plantão" por "Simulado"). Fica salvo por aluno no localStorage, mesmo
  // padrão já usado em dm_decks_ nos flashcards.
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [labelsKey, setLabelsKey] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)

  const labelFor = (colorId: string) => labels[colorId] ?? colorMeta(colorId).label

  useEffect(() => {
    const key = `dm_calendar_labels_${userId ?? 'guest'}`
    try {
      const raw = localStorage.getItem(key)
      setLabels(raw ? JSON.parse(raw) : {})
    } catch {
      setLabels({})
    }
    setLabelsKey(key)
  }, [userId])

  const saveLabel = (colorId: string, value: string) => {
    const trimmed = value.trim()
    const fallback = colorMeta(colorId).label
    setLabels((prev) => {
      const next = { ...prev, [colorId]: trimmed || fallback }
      if (labelsKey) {
        try { localStorage.setItem(labelsKey, JSON.stringify(next)) } catch {}
      }
      return next
    })
  }

  async function load(uid: string) {
    const { data } = await supabase.from('calendar_events').select('*').eq('user_id', uid)
    setEvents((data as CalendarEvent[]) ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUserId(data.user.id); load(data.user.id) }
    })
  }, [])

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      map[ev.event_date] = map[ev.event_date] || []
      map[ev.event_date].push(ev)
    }
    return map
  }, [events])

  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const startOffset = firstOfMonth.getDay()
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewDate])

  const selectedKey = toDateKey(selectedDate)
  const selectedEvents = (eventsByDay[selectedKey] || []).sort((a, b) => (a.event_time || '99').localeCompare(b.event_time || '99'))
  const todayKey = toDateKey(new Date())

  const changeMonth = (delta: number) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1))

  const handleAddEvent = async () => {
    if (!form.title.trim() || saving || !userId) return
    setSaving(true)
    await supabase.from('calendar_events').insert({
      user_id: userId,
      title: form.title.trim(),
      event_date: selectedKey,
      event_time: form.time || null,
      color: form.color,
      notes: form.notes.trim() || null,
    })
    setForm(emptyForm)
    setSaving(false)
    load(userId)
  }

  const handleDeleteEvent = async (id: string) => {
    if (!userId) return
    await supabase.from('calendar_events').delete().eq('id', id)
    load(userId)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="bg-surface border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-surface-2 text-fg transition" aria-label="Mês anterior">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-fg">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-surface-2 text-fg transition" aria-label="Próximo mês">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-edge">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-medium text-faint py-2 border-r border-b border-edge">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-edge">
            {gridDays.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[72px] sm:min-h-[88px] border-r border-b border-edge" />
              const key = toDateKey(day)
              const dayEvents = eventsByDay[key] || []
              const isSelected = key === selectedKey
              const isToday = key === todayKey

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[72px] sm:min-h-[88px] p-1 flex flex-col items-start gap-0.5 border-r border-b border-edge transition text-left overflow-hidden ${
                    isSelected ? 'bg-primary/20' : 'hover:bg-surface-2/60'
                  }`}
                >
                  <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-primary text-white font-semibold' : 'text-fg'}`}>
                    {day.getDate()}
                  </span>
                  <div className="w-full flex-1 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const c = colorMeta(ev.color)
                      return (
                        <span key={ev.id} className={`w-full text-[9px] leading-tight px-1 py-0.5 rounded truncate border-l-2 font-bold ${c.bg} ${c.border} ${c.text}`}>
                          {ev.title}
                        </span>
                      )
                    })}
                    {dayEvents.length > 2 && <span className="text-[9px] text-faint px-1">+{dayEvents.length - 2}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex gap-4 mt-6 flex-wrap">
            {COLORS.map((c) => (
              <div key={c.id} className="group flex items-center gap-1.5 text-xs text-muted">
                <span className={`w-2 h-2 rounded-full shrink-0 ring-1 ring-edge ${c.dot}`} />
                {editingLabel === c.id ? (
                  <input
                    autoFocus
                    defaultValue={labelFor(c.id)}
                    maxLength={20}
                    onBlur={(e) => { saveLabel(c.id, e.target.value); setEditingLabel(null) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingLabel(null)
                    }}
                    className="bg-app border border-primary rounded px-1 py-0.5 text-xs text-fg w-20 focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setEditingLabel(c.id)}
                    className="flex items-center gap-1 hover:text-fg transition"
                    title="Clique pra renomear"
                  >
                    {labelFor(c.id)}
                    <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition shrink-0" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-faint text-[11px] mt-2">Clique em uma categoria pra renomear do seu jeito.</p>
        </div>

        <div className="bg-surface border border-edge rounded-2xl p-6">
          <h3 className="text-fg font-semibold mb-1 capitalize">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h3>
          <p className="text-faint text-xs mb-4">{selectedEvents.length === 0 ? 'Nada marcado' : `${selectedEvents.length} item(ns)`}</p>

          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className={`flex items-start gap-2 border-l-4 ${colorMeta(ev.color).border} bg-app/60 rounded-lg p-3`}>
                <div className="flex-1 min-w-0">
                  <p className="text-fg text-sm font-semibold truncate">{ev.title}</p>
                  {ev.event_time && <p className="text-muted text-xs mt-0.5">🕒 {ev.event_time.slice(0, 5)}</p>}
                  {ev.notes && <p className="text-faint text-xs mt-1 whitespace-pre-wrap">{ev.notes}</p>}
                </div>
                <button onClick={() => handleDeleteEvent(ev.id)} className="text-faint hover:text-red-400 transition p-1 shrink-0" aria-label="Remover">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-edge pt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Título</label>
              <input
                type="text"
                placeholder="Ex: Prova de Biologia"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-app border border-edge rounded-lg px-3 py-2 text-sm font-medium text-fg placeholder-faint focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Descrição <span className="text-faint">(opcional)</span></label>
              <textarea
                placeholder="Detalhes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full bg-app border border-edge rounded-lg px-3 py-2 text-xs text-fg placeholder-faint focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Horário <span className="text-faint">(opcional)</span></label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-app border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm({ ...form, color: c.id })}
                  className={`w-7 h-7 rounded-full ${c.dot} ${form.color === c.id ? `ring-2 ring-offset-2 ring-offset-surface ${c.ring}` : 'ring-1 ring-edge'}`}
                  aria-label={labelFor(c.id)}
                  title={labelFor(c.id)}
                />
              ))}
            </div>
            <button
              onClick={handleAddEvent}
              disabled={!form.title.trim() || saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
