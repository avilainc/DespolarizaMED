'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WEEKDAYS, type OfficeHour } from '@/lib/officeHours'
import { Plus, Trash2 } from 'lucide-react'

const emptyForm = { title: '', description: '', mode: 'weekly' as 'weekly' | 'once', weekday: 4, time: '19:00', specific_date: '', meet_url: '' }

export default function AdminOfficeHoursPage() {
  const [items, setItems] = useState<OfficeHour[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('office_hours').select('*').order('created_at', { ascending: false })
    setItems((data as OfficeHour[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.meet_url.trim()) return
    setSaving(true)
    await supabase.from('office_hours').insert({
      title: form.title,
      description: form.description || null,
      weekday: form.mode === 'weekly' ? form.weekday : null,
      time: form.time || null,
      specific_date: form.mode === 'once' ? form.specific_date : null,
      meet_url: form.meet_url,
      active: true,
    })
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const toggleActive = async (item: OfficeHour) => {
    await supabase.from('office_hours').update({ active: !item.active }).eq('id', item.id)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('office_hours').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-1">Plantões</h1>
      <p className="text-muted text-sm mb-6">Configure o encontro semanal (ou avulso) que os alunos vão ver.</p>

      <form onSubmit={handleAdd} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Título (ex: Plantão de dúvidas — Biologia)"
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição (opcional)"
          rows={2}
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
        />

        <div className="flex gap-2">
          <button type="button" onClick={() => setForm({ ...form, mode: 'weekly' })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${form.mode === 'weekly' ? 'bg-primary/15 border-primary text-primary-light' : 'bg-app border-edge text-muted'}`}>
            Toda semana
          </button>
          <button type="button" onClick={() => setForm({ ...form, mode: 'once' })} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${form.mode === 'once' ? 'bg-primary/15 border-primary text-primary-light' : 'bg-app border-edge text-muted'}`}>
            Data avulsa
          </button>
        </div>

        {form.mode === 'weekly' ? (
          <select
            value={form.weekday}
            onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm capitalize focus:outline-none focus:border-primary"
          >
            {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
          </select>
        ) : (
          <input
            type="date"
            value={form.specific_date}
            onChange={(e) => setForm({ ...form, specific_date: e.target.value })}
            className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
          <input
            value={form.meet_url}
            onChange={(e) => setForm({ ...form, meet_url: e.target.value })}
            placeholder="Link do Google Meet"
            className="px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Criar plantão
        </button>
      </form>

      <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-fg text-sm font-medium">{item.title}</p>
              <p className="text-faint text-xs">
                {item.specific_date ? item.specific_date : `Toda ${WEEKDAYS[item.weekday ?? 0]}`} {item.time?.slice(0, 5)} · {item.active ? 'ativo' : 'inativo'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => toggleActive(item)} className="text-xs text-primary-light hover:text-fg transition">
                {item.active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-faint hover:text-red-500 transition" aria-label="Remover">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="px-5 py-4 text-muted text-sm">Nenhum plantão criado ainda.</p>}
      </div>
    </div>
  )
}
