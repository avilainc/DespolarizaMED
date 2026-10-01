'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X } from 'lucide-react'
import { GLOSSARY_FALLBACK, type FallbackTerm } from '@/lib/glossaryFallback'
import { subjectColor } from '@/lib/subjectColors'

type Term = FallbackTerm

// Verbetes de Redação com mais de uma citação armazenam tudo junto no
// campo `definition`, no formato "1. \"frase\"\nexplicação\n\n2. ...".
// Detecta esse padrão e separa frase/explicação pra dar contraste visual
// entre elas (frase em destaque, explicação em tom mais suave).
function parseCitations(text: string): { quote: string; explanation: string }[] | null {
  if (!/\n\n\d+\.\s/.test(text)) return null
  return text.split(/\n\n(?=\d+\.\s)/).map((block) => {
    const breakIndex = block.indexOf('\n')
    const quote = block.slice(0, breakIndex).replace(/^\d+\.\s*/, '')
    const explanation = block.slice(breakIndex + 1)
    return { quote, explanation }
  })
}

export default function GlossaryPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('todas')
  const [open, setOpen] = useState<Term | null>(null)

  useEffect(() => {
    supabase.from('glossary_terms').select('*').order('term').then(({ data }) => {
      setTerms(data && data.length > 0 ? (data as Term[]) : GLOSSARY_FALLBACK)
    })
  }, [])

  const subjects = useMemo(() => ['todas', ...Array.from(new Set(terms.map((t) => t.subject).filter(Boolean) as string[]))], [terms])

  const filtered = terms.filter((t) => {
    const matchesQuery = t.term.toLowerCase().includes(query.toLowerCase()) || t.definition.toLowerCase().includes(query.toLowerCase())
    const matchesSubject = subject === 'todas' || t.subject === subject
    return matchesQuery && matchesSubject
  })

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1">Glossário</h1>
      <p className="text-muted text-sm mb-6">Termos e definições importantes, num lugar só.</p>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar termo..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {subjects.map((s) => {
          const active = subject === s
          const color = s === 'todas' ? '#4F80AC' : subjectColor(s)
          return (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition"
              style={
                active
                  ? { backgroundColor: `${color}26`, borderColor: color, color }
                  : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
              }
            >
              {s}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">{terms.length === 0 ? 'Nenhum termo cadastrado ainda.' : 'Nada encontrado.'}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpen(t)}
              className="text-left bg-surface border border-edge rounded-xl p-4 hover:border-primary/50 transition flex gap-3 items-start"
            >
              {t.image_url && (
                <div className="w-12 h-12 rounded-lg shrink-0 border border-edge bg-white overflow-hidden flex items-center justify-center">
                  <img src={t.image_url} alt={t.term} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-fg">{t.term}</h3>
                  {t.subject && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{ color: subjectColor(t.subject), backgroundColor: `${subjectColor(t.subject)}1a`, borderColor: `${subjectColor(t.subject)}4d` }}
                    >
                      {t.subject}
                    </span>
                  )}
                </div>
                <p className="text-muted text-sm line-clamp-2">{t.definition}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-surface border border-edge rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-fg">{open.term}</h2>
                {open.subject && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ color: subjectColor(open.subject), backgroundColor: `${subjectColor(open.subject)}1a`, borderColor: `${subjectColor(open.subject)}4d` }}
                  >
                    {open.subject}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(null)} className="text-faint hover:text-fg transition shrink-0" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {open.image_url && (
              <div className="w-full h-56 rounded-lg border border-edge bg-white mb-4 flex items-center justify-center overflow-hidden">
                <img src={open.image_url} alt={open.term} className="max-w-full max-h-full object-contain" />
              </div>
            )}

            {(() => {
              const citations = parseCitations(open.definition)
              if (citations) {
                return (
                  <div className="space-y-4 mb-3">
                    {citations.map((c, i) => (
                      <div key={i}>
                        <p className="text-fg text-sm leading-relaxed font-medium mb-1">{c.quote}</p>
                        <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                )
              }
              return <p className="text-fg text-sm leading-relaxed whitespace-pre-wrap mb-3">{open.definition}</p>
            })()}

            {open.category === 'pessoa' && open.extra_info && (
              <p className="text-muted text-sm mb-3"><strong className="text-fg">Datas:</strong> {open.extra_info}</p>
            )}

            {open.category === 'visual' && open.extra_info && (
              <div className="bg-app border border-edge rounded-lg p-3 mb-3">
                <p className="text-faint text-xs font-semibold uppercase mb-1">Aplicação</p>
                <p className="text-muted text-sm whitespace-pre-wrap">{open.extra_info}</p>
              </div>
            )}

            {open.examples && (
              <div>
                <p className="text-faint text-xs font-semibold uppercase mb-1">Exemplos</p>
                <p className="text-muted text-sm whitespace-pre-wrap">{open.examples}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
