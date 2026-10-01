'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

type Flashcard = { id: string; subject: string; front: string; back: string }

const emptyForm = { subject: '', front: '', back: '' }

export default function AdminFlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false })
    setCards((data as Flashcard[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.front.trim() || !form.back.trim()) return
    setSaving(true)
    await supabase.from('flashcards').insert(form)
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-1">Flashcards</h1>
      <p className="text-muted text-sm mb-6">Revisão rápida (frente/verso) — entram no desafio diário junto com o quiz.</p>

      <form onSubmit={handleAdd} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Matéria (ex: Biologia)"
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
        />
        <input
          value={form.front}
          onChange={(e) => setForm({ ...form, front: e.target.value })}
          placeholder="Frente (termo/pergunta)"
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
        />
        <textarea
          value={form.back}
          onChange={(e) => setForm({ ...form, back: e.target.value })}
          placeholder="Verso (resposta/explicação)"
          rows={2}
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
        />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Adicionar flashcard
        </button>
      </form>

      <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
        {cards.map((c) => (
          <div key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-fg text-sm font-medium">{c.front} <span className="text-faint text-xs">· {c.subject}</span></p>
              <p className="text-muted text-xs">{c.back}</p>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-faint hover:text-red-500 transition shrink-0" aria-label="Remover">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {cards.length === 0 && <p className="px-5 py-4 text-muted text-sm">Nenhum flashcard ainda.</p>}
      </div>
    </div>
  )
}
