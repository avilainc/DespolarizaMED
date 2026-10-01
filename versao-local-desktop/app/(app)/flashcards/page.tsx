'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sparkles, RotateCw, Plus, Trash2, Check, BookOpen, ArrowUp, ArrowDown, ArrowLeft, X, Play } from 'lucide-react'
import { FLASHCARDS_FALLBACK, type FallbackFlashcard } from '@/lib/flashcardsFallback'
import { ALL_SUBJECTS, subjectColor } from '@/lib/subjectColors'
import { nextReviewInterval, addDays, type Difficulty } from '@/lib/spacedRepetition'
import { format } from 'date-fns'

type Card = { id: string; subject: string; front: string; back: string }
type Deck = { id: string; name: string; cardIds: string[] }
type ReviewInfo = { interval_days: number; next_review_date: string }

const QUANTITIES = [5, 10, 15, 20]
const DIFFICULTY_LABELS: { key: Difficulty; label: string }[] = [
  { key: 'dificil', label: 'Difícil' },
  { key: 'media', label: 'Média' },
  { key: 'facil', label: 'Fácil' },
]

const emptyForm = { subject: ALL_SUBJECTS[0], front: '', back: '' }

export default function FlashcardsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'estudar' | 'meus' | 'baralhos'>('estudar')

  // Banco geral (admin/IA) + os que o próprio aluno criou — juntos formam
  // o pool disponível pra sessão de estudo.
  const [globalCards, setGlobalCards] = useState<Card[]>([])
  const [myCards, setMyCards] = useState<Card[]>([])
  const [reviews, setReviews] = useState<Record<string, ReviewInfo>>({})

  // Configuração da sessão de estudo
  const [studySubject, setStudySubject] = useState('todas')
  const [studyQty, setStudyQty] = useState(10)
  const [session, setSession] = useState<Card[] | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  // Formulário "Meus Flashcards"
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [myFilter, setMyFilter] = useState('todas')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id)
    })
    loadGlobalCards()
  }, [])

  useEffect(() => {
    if (userId) {
      loadMyCards(userId)
      loadReviews(userId)
    }
  }, [userId])

  async function loadReviews(uid: string) {
    const { data } = await supabase
      .from('flashcard_reviews')
      .select('flashcard_id, interval_days, next_review_date')
      .eq('user_id', uid)
    const map: Record<string, ReviewInfo> = {}
    for (const r of (data as any[]) ?? []) {
      map[r.flashcard_id] = { interval_days: r.interval_days, next_review_date: r.next_review_date }
    }
    setReviews(map)
  }

  async function loadGlobalCards() {
    const { data } = await supabase.from('flashcards').select('id, subject, front, back')
    const rows = (data as Card[]) ?? []
    setGlobalCards(rows.length > 0 ? rows : (FLASHCARDS_FALLBACK as FallbackFlashcard[]))
  }

  async function loadMyCards(uid: string) {
    const { data } = await supabase
      .from('user_flashcards')
      .select('id, subject, front, back')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setMyCards((data as Card[]) ?? [])
  }

  const pool = useMemo(() => [...globalCards, ...myCards], [globalCards, myCards])

  const poolBySubject = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of pool) counts[c.subject] = (counts[c.subject] || 0) + 1
    return counts
  }, [pool])

  // Cartões "vencidos" pra revisão (ou nunca revisados) entram primeiro na
  // sessão; só completa com os que ainda não venceram se sobrar espaço.
  const startSession = () => {
    const filtered = studySubject === 'todas' ? pool : pool.filter((c) => c.subject === studySubject)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const due = filtered.filter((c) => !reviews[c.id] || reviews[c.id].next_review_date <= todayStr)
    const notDue = filtered.filter((c) => reviews[c.id] && reviews[c.id].next_review_date > todayStr)
    const combined = [...due.sort(() => Math.random() - 0.5), ...notDue.sort(() => Math.random() - 0.5)].slice(0, studyQty)
    setSession(combined)
    setStepIndex(0)
    setFlipped(false)
    setReviewed(0)
  }

  const recordDifficulty = async (difficulty: Difficulty) => {
    if (!current) return
    if (userId) {
      const prevInterval = reviews[current.id]?.interval_days ?? null
      const interval = nextReviewInterval(difficulty, prevInterval)
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const nextDate = addDays(todayStr, interval)
      await supabase.from('flashcard_reviews').upsert(
        { user_id: userId, flashcard_id: current.id, interval_days: interval, next_review_date: nextDate, last_difficulty: difficulty },
        { onConflict: 'user_id,flashcard_id' }
      )
      setReviews((prev) => ({ ...prev, [current.id]: { interval_days: interval, next_review_date: nextDate } }))
    }
    setReviewed((r) => r + 1)
    setFlipped(false)
    setStepIndex((i) => i + 1)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !form.front.trim() || !form.back.trim()) return
    setSaving(true)
    await supabase.from('user_flashcards').insert({ user_id: userId, subject: form.subject, front: form.front, back: form.back })
    setForm({ ...emptyForm, subject: form.subject })
    setSaving(false)
    loadMyCards(userId)
  }

  const handleDelete = async (id: string) => {
    if (!userId) return
    await supabase.from('user_flashcards').delete().eq('id', id)
    loadMyCards(userId)
  }

  const filteredMyCards = myFilter === 'todas' ? myCards : myCards.filter((c) => c.subject === myFilter)
  // ---- Baralhos (salvos neste navegador, por conta) ----
  const cardsById = useMemo(() => new Map(pool.map((card) => [card.id, card])), [pool])
  const [decks, setDecks] = useState<Deck[]>([])
  const [decksKey, setDecksKey] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deckSearch, setDeckSearch] = useState('')
  const [deckSubject, setDeckSubject] = useState('todas')

  useEffect(() => {
    const key = `dm_decks_${userId ?? 'guest'}`
    try {
      const raw = localStorage.getItem(key)
      setDecks(raw ? JSON.parse(raw) : [])
    } catch {
      setDecks([])
    }
    setDecksKey(key)
  }, [userId])

  useEffect(() => {
    if (!decksKey) return
    try {
      localStorage.setItem(decksKey, JSON.stringify(decks))
    } catch {}
  }, [decks, decksKey])

  const editing = decks.find((d) => d.id === editingId) ?? null
  const patchDeck = (id: string, fn: (d: Deck) => Deck) => setDecks((ds) => ds.map((d) => (d.id === id ? fn(d) : d)))

  const createDeck = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newDeckName.trim()
    if (!name) return
    const deck: Deck = { id: `deck-${Date.now()}`, name, cardIds: [] }
    setDecks((ds) => [...ds, deck])
    setNewDeckName('')
    setEditingId(deck.id)
  }

  const moveCard = (deckId: string, index: number, dir: -1 | 1) =>
    patchDeck(deckId, (d) => {
      const j = index + dir
      if (j < 0 || j >= d.cardIds.length) return d
      const ids = [...d.cardIds]
      ;[ids[index], ids[j]] = [ids[j], ids[index]]
      return { ...d, cardIds: ids }
    })

  const studyDeck = (deck: Deck, shuffle: boolean) => {
    let cards = deck.cardIds.map((id) => cardsById.get(id)).filter(Boolean) as Card[]
    if (shuffle) cards = [...cards].sort(() => Math.random() - 0.5)
    if (cards.length === 0) return
    setSession(cards)
    setStepIndex(0)
    setFlipped(false)
    setReviewed(0)
    setTab('estudar')
  }

  const addable = editing
    ? pool.filter(
        (card) =>
          !editing.cardIds.includes(card.id) &&
          (deckSubject === 'todas' || card.subject === deckSubject) &&
          (!deckSearch.trim() || (card.front + ' ' + card.back).toLowerCase().includes(deckSearch.trim().toLowerCase()))
      )
    : []

  const current = session && stepIndex < session.length ? session[stepIndex] : null
  const sessionDone = session && stepIndex >= session.length

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1">Flashcards</h1>
      <p className="text-muted text-sm mb-6">Revise rapidinho ou crie os seus próprios cartões de estudo.</p>

      <div className="flex gap-2 mb-6 border-b border-edge">
        <button
          onClick={() => setTab('estudar')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === 'estudar' ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}
        >
          Estudar
        </button>
        <button
          onClick={() => setTab('meus')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === 'meus' ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}
        >
          Meus Flashcards {myCards.length > 0 && <span className="text-faint">({myCards.length})</span>}
        </button>
        <button
          onClick={() => setTab('baralhos')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === 'baralhos' ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}
        >
          Baralhos {decks.length > 0 && <span className="text-faint">({decks.length})</span>}
        </button>
      </div>

      {tab === 'estudar' && !session && (
        <div className="bg-surface border border-edge rounded-2xl p-6">
          <p className="text-fg font-semibold mb-3">Escolha a matéria</p>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStudySubject('todas')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition"
              style={
                studySubject === 'todas'
                  ? { backgroundColor: '#4F80AC26', borderColor: '#4F80AC', color: '#4F80AC' }
                  : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
              }
            >
              Todas <span className="opacity-70">({pool.length})</span>
            </button>
            {ALL_SUBJECTS.map((s) => {
              const color = subjectColor(s)
              const active = studySubject === s
              const count = poolBySubject[s] || 0
              return (
                <button
                  key={s}
                  onClick={() => setStudySubject(s)}
                  disabled={count === 0}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition disabled:opacity-30 disabled:cursor-not-allowed"
                  style={
                    active
                      ? { backgroundColor: `${color}26`, borderColor: color, color }
                      : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
                  }
                >
                  {s} <span className="opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          <p className="text-fg font-semibold mb-3">Quantos você quer fazer?</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {QUANTITIES.map((q) => (
              <button
                key={q}
                onClick={() => setStudyQty(q)}
                className={`w-14 h-10 rounded-lg text-sm font-semibold border transition ${
                  studyQty === q ? 'bg-primary text-white border-primary' : 'border-edge text-muted hover:border-primary/50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={startSession}
            disabled={pool.length === 0}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            <Sparkles size={16} /> Começar revisão
          </button>
        </div>
      )}

      {tab === 'estudar' && session && !sessionDone && current && (
        <div className="bg-surface border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-faint font-semibold uppercase">Cartão {stepIndex + 1} de {session.length}</span>
            <button onClick={() => setSession(null)} className="text-xs text-muted hover:text-fg transition">Encerrar</button>
          </div>

          <div className="flex gap-1 mb-6">
            {session.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: subjectColor(current.subject), opacity: i < stepIndex ? 1 : i === stepIndex ? 0.6 : 0.15 }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-faint mb-3">
            <Sparkles size={11} /> {current.subject}
          </div>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full min-h-[160px] bg-app border border-edge rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:border-primary/50 transition"
          >
            <p className="text-fg text-base font-medium">{flipped ? current.back : current.front}</p>
            <span className="flex items-center gap-1.5 text-xs text-faint">
              <RotateCw size={12} /> {flipped ? 'Verso' : 'Toque pra ver a resposta'}
            </span>
          </button>

          {flipped && (
            <div className="mt-4">
              <p className="text-faint text-xs text-center mb-2">Quão fácil foi lembrar?</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => recordDifficulty('dificil')} className="py-2.5 rounded-lg text-sm font-semibold bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition">
                  Difícil
                </button>
                <button onClick={() => recordDifficulty('media')} className="py-2.5 rounded-lg text-sm font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition">
                  Média
                </button>
                <button onClick={() => recordDifficulty('facil')} className="py-2.5 rounded-lg text-sm font-semibold bg-teal/15 border border-teal/40 text-teal-dark hover:bg-teal/25 transition">
                  Fácil
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'estudar' && session && sessionDone && (
        <div className="bg-surface border border-edge rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-teal" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-1">Revisão concluída!</h2>
          <p className="text-muted text-sm mb-6">Você revisou {reviewed} flashcard{reviewed === 1 ? '' : 's'}.</p>
          <button
            onClick={() => setSession(null)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Fazer outra revisão
          </button>
        </div>
      )}

      {tab === 'baralhos' && !editing && (
        <div>
          <form onSubmit={createDeck} className="bg-surface border border-edge rounded-2xl p-5 mb-5 flex flex-col sm:flex-row gap-3">
            <input
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Nome do novo baralho (ex.: Revisão de Genética)"
              className="flex-1 px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" disabled={!newDeckName.trim()} className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
              <Plus size={16} /> Criar baralho
            </button>
          </form>

          {decks.length === 0 ? (
            <div className="bg-surface border border-edge rounded-2xl px-5 py-10 text-center">
              <BookOpen size={26} className="text-faint mx-auto mb-2" />
              <p className="text-muted text-sm max-w-md mx-auto">Crie baralhos com os cartões que quiser, na ordem que quiser, e volte a eles quando precisar revisar.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {decks.map((d) => {
                const count = d.cardIds.filter((id) => cardsById.has(id)).length
                return (
                  <div key={d.id} className="bg-surface border border-edge rounded-2xl p-4">
                    <p className="text-fg font-bold truncate">{d.name}</p>
                    <p className="text-faint text-xs mb-3">{count} {count === 1 ? 'cartão' : 'cartões'}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => studyDeck(d, false)} disabled={count === 0} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40">
                        <Play size={12} /> Estudar
                      </button>
                      <button onClick={() => setEditingId(d.id)} className="text-xs px-3 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition">Editar</button>
                      <button
                        onClick={() => { if (window.confirm(`Excluir o baralho "${d.name}"? Os cartões não são apagados.`)) setDecks((ds) => ds.filter((x) => x.id !== d.id)) }}
                        className="text-xs px-2 py-1.5 rounded-lg text-faint hover:text-red-500 transition ml-auto"
                        aria-label="Excluir baralho"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="text-faint text-xs mt-4">Os baralhos ficam salvos neste navegador, na sua conta.</p>
        </div>
      )}

      {tab === 'baralhos' && editing && (
        <div>
          <button onClick={() => { setEditingId(null); setDeckSearch(''); setDeckSubject('todas') }} className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-3 transition">
            <ArrowLeft size={15} /> Todos os baralhos
          </button>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={editing.name}
              onChange={(e) => patchDeck(editing.id, (d) => ({ ...d, name: e.target.value }))}
              className="flex-1 px-3 py-2 bg-surface border border-edge rounded-lg text-fg font-bold focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button onClick={() => studyDeck(editing, false)} disabled={editing.cardIds.length === 0} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-40">
                <Play size={14} /> Estudar na ordem
              </button>
              <button onClick={() => studyDeck(editing, true)} disabled={editing.cardIds.length === 0} className="text-sm px-3 py-2 rounded-lg border border-edge text-muted hover:text-fg transition disabled:opacity-40">Embaralhar</button>
            </div>
          </div>

          <p className="text-faint text-xs font-semibold uppercase mb-2">Neste baralho ({editing.cardIds.length}), na ordem de estudo</p>
          <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden mb-6">
            {editing.cardIds.length === 0 && <p className="px-4 py-6 text-center text-muted text-sm">Vazio. Adicione cartões abaixo.</p>}
            {editing.cardIds.map((id, i) => {
              const card = cardsById.get(id)
              return (
                <div key={id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-6 text-faint text-xs text-right">{i + 1}</span>
                  {card ? (
                    <>
                      <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${subjectColor(card.subject)}26`, color: subjectColor(card.subject) }}>{card.subject}</span>
                      <span className="flex-1 min-w-0 truncate text-fg text-sm">{card.front}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-faint text-sm italic">Cartão indisponível</span>
                  )}
                  <button onClick={() => moveCard(editing.id, i, -1)} disabled={i === 0} aria-label="Subir" className="p-1 text-muted hover:text-fg disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button onClick={() => moveCard(editing.id, i, 1)} disabled={i === editing.cardIds.length - 1} aria-label="Descer" className="p-1 text-muted hover:text-fg disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button onClick={() => patchDeck(editing.id, (d) => ({ ...d, cardIds: d.cardIds.filter((x) => x !== id) }))} aria-label="Remover do baralho" className="p-1 text-faint hover:text-red-500"><X size={14} /></button>
                </div>
              )
            })}
          </div>

          <p className="text-faint text-xs font-semibold uppercase mb-2">Adicionar cartões</p>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input value={deckSearch} onChange={(e) => setDeckSearch(e.target.value)} placeholder="Buscar nos cartões..." className="flex-1 px-3 py-2 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary" />
            <select value={deckSubject} onChange={(e) => setDeckSubject(e.target.value)} className="px-3 py-2 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary">
              <option value="todas">Todas as matérias</option>
              {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => patchDeck(editing.id, (d) => ({ ...d, cardIds: [...d.cardIds, ...addable.map((card) => card.id)] }))}
              disabled={addable.length === 0}
              className="text-sm px-3 py-2 rounded-lg border border-edge text-muted hover:text-fg transition disabled:opacity-40 whitespace-nowrap"
            >
              Adicionar todos ({addable.length})
            </button>
          </div>
          <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden max-h-[420px] overflow-y-auto">
            {addable.length === 0 && <p className="px-4 py-6 text-center text-muted text-sm">Nenhum cartão encontrado.</p>}
            {addable.slice(0, 80).map((card) => (
              <button key={card.id} onClick={() => patchDeck(editing.id, (d) => ({ ...d, cardIds: [...d.cardIds, card.id] }))} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-app transition">
                <Plus size={14} className="text-primary shrink-0" />
                <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${subjectColor(card.subject)}26`, color: subjectColor(card.subject) }}>{card.subject}</span>
                <span className="flex-1 min-w-0 truncate text-fg text-sm">{card.front}</span>
              </button>
            ))}
            {addable.length > 80 && <p className="px-4 py-2 text-faint text-xs text-center">Mostrando 80 de {addable.length}. Use a busca para refinar.</p>}
          </div>
        </div>
      )}

      {tab === 'meus' && (
        <div>
          <form onSubmit={handleAdd} className="bg-surface border border-edge rounded-2xl p-5 mb-6 space-y-3">
            <p className="text-fg font-semibold text-sm mb-1">Criar novo flashcard</p>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary"
            >
              {ALL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
            <button type="submit" disabled={saving || !userId} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
              <Plus size={16} /> Adicionar flashcard
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setMyFilter('todas')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
              style={
                myFilter === 'todas'
                  ? { backgroundColor: '#4F80AC26', borderColor: '#4F80AC', color: '#4F80AC' }
                  : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
              }
            >
              Todas
            </button>
            {ALL_SUBJECTS.filter((s) => myCards.some((c) => c.subject === s)).map((s) => {
              const color = subjectColor(s)
              const active = myFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setMyFilter(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
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

          <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
            {filteredMyCards.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-fg text-sm font-medium truncate">{c.front}</p>
                    <span className="text-xs shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${subjectColor(c.subject)}26`, color: subjectColor(c.subject) }}>
                      {c.subject}
                    </span>
                  </div>
                  <p className="text-muted text-xs">{c.back}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-faint hover:text-red-500 transition shrink-0" aria-label="Remover">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {filteredMyCards.length === 0 && (
              <div className="px-5 py-8 text-center">
                <BookOpen size={24} className="text-faint mx-auto mb-2" />
                <p className="text-muted text-sm">Você ainda não criou nenhum flashcard{myFilter !== 'todas' ? ` de ${myFilter}` : ''}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
