'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

type Term = {
  id: string
  term: string
  definition: string
  subject: string | null
  category: 'definicao' | 'pessoa' | 'visual'
  examples: string | null
  image_url: string | null
  extra_info: string | null
}

const emptyForm = { term: '', subject: '', category: 'definicao' as Term['category'], definition: '', examples: '', image_url: '', extra_info: '' }

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('glossary_terms').select('*').order('term')
    setTerms((data as Term[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.term.trim() || !form.definition.trim()) return
    setSaving(true)
    await supabase.from('glossary_terms').insert({
      term: form.term,
      subject: form.subject || null,
      category: form.category,
      definition: form.definition,
      examples: form.examples || null,
      image_url: form.image_url || null,
      extra_info: form.extra_info || null,
    })
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('glossary_terms').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-6">Glossário</h1>

      <form onSubmit={handleAdd} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            placeholder="Termo (ex: Mitocôndria)"
            className="px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Matéria (opcional)"
            className="px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          {([
            { id: 'definicao', label: 'Definição' },
            { id: 'pessoa', label: 'Pessoa histórica' },
            { id: 'visual', label: 'Visual (imagem/fórmula)' },
          ] as const).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setForm({ ...form, category: c.id })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                form.category === c.id ? 'bg-primary/15 border-primary text-primary-light' : 'bg-app border-edge text-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          value={form.definition}
          onChange={(e) => setForm({ ...form, definition: e.target.value })}
          placeholder={form.category === 'pessoa' ? 'Biografia: nascimento, o que fez...' : 'Definição'}
          rows={3}
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
        />

        {(form.category === 'pessoa' || form.category === 'visual') && (
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="URL da imagem"
            className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        )}

        {form.category === 'pessoa' && (
          <input
            value={form.extra_info}
            onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
            placeholder="Datas (ex: 1769 – 1821)"
            className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        )}

        {form.category === 'visual' && (
          <textarea
            value={form.extra_info}
            onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
            placeholder="Aplicação / exemplo de uso"
            rows={2}
            className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
          />
        )}

        <textarea
          value={form.examples}
          onChange={(e) => setForm({ ...form, examples: e.target.value })}
          placeholder="Exemplos (opcional)"
          rows={2}
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
        />

        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Adicionar termo
        </button>
      </form>

      <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
        {terms.map((t) => (
          <div key={t.id} className="px-5 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-fg font-medium text-sm">{t.term} {t.subject && <span className="text-faint text-xs">· {t.subject}</span>} <span className="text-faint text-xs">· {t.category}</span></p>
              <p className="text-muted text-xs line-clamp-1">{t.definition}</p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-faint hover:text-red-500 transition shrink-0" aria-label="Remover">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {terms.length === 0 && <p className="px-5 py-4 text-muted text-sm">Nenhum termo ainda.</p>}
      </div>
    </div>
  )
}
