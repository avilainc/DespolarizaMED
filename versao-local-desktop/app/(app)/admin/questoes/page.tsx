'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

type Question = { id: string; subject: string | null; question: string; options: { letra: string; texto: string }[]; correct_option: string }

const emptyForm = {
  subject: '',
  question: '',
  options: [{ letra: 'A', texto: '' }, { letra: 'B', texto: '' }, { letra: 'C', texto: '' }, { letra: 'D', texto: '' }],
  correct_option: 'A',
}

export default function AdminQuickQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('quick_questions').select('*').order('created_at', { ascending: false })
    setQuestions((data as Question[]) ?? [])
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question.trim() || form.options.some((o) => !o.texto.trim())) return
    setSaving(true)
    await supabase.from('quick_questions').insert({
      subject: form.subject || null,
      question: form.question,
      options: form.options,
      correct_option: form.correct_option,
    })
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('quick_questions').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-fg mb-1">Questões rápidas</h1>
      <p className="text-muted text-sm mb-6">Alimentam o desafio diário dos alunos na aba Conquistas.</p>

      <form onSubmit={handleAdd} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Matéria (opcional)"
            className="px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <textarea
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="Enunciado da questão"
          rows={2}
          className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none"
        />
        {form.options.map((opt, i) => (
          <div key={opt.letra} className="flex items-center gap-2">
            <span className="w-6 text-faint text-sm font-medium">{opt.letra}</span>
            <input
              value={opt.texto}
              onChange={(e) => {
                const options = [...form.options]
                options[i] = { ...options[i], texto: e.target.value }
                setForm({ ...form, options })
              }}
              placeholder={`Alternativa ${opt.letra}`}
              className="flex-1 px-3 py-1.5 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="radio"
              name="correct"
              checked={form.correct_option === opt.letra}
              onChange={() => setForm({ ...form, correct_option: opt.letra })}
              title="Correta"
            />
          </div>
        ))}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Adicionar questão
        </button>
      </form>

      <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
        {questions.map((q) => (
          <div key={q.id} className="px-5 py-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-fg text-sm">{q.question}</p>
              <p className="text-faint text-xs">{q.subject || 'sem matéria'} · correta: {q.correct_option}</p>
            </div>
            <button onClick={() => handleDelete(q.id)} className="text-faint hover:text-red-500 transition shrink-0" aria-label="Remover">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {questions.length === 0 && <p className="px-5 py-4 text-muted text-sm">Nenhuma questão ainda.</p>}
      </div>
    </div>
  )
}
