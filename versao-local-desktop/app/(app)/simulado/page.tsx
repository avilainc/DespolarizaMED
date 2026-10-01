'use client'
import { useEffect, useMemo, useState } from 'react'
import { EXAM_BANK, type ExamQuestion } from '@/lib/examBank'
import { ALL_SUBJECTS, subjectColor } from '@/lib/subjectColors'
import { groupTopic } from '@/lib/topicGroups'
import { generateSimuladoPdf } from '@/lib/generateSimuladoPdf'
import { FileText, Check, X, RotateCw, Trophy, Download, Loader2 } from 'lucide-react'
import ProvasPdf from '@/components/ProvasPdf'

const QUANTITIES = [5, 10, 15, 20, 30]

// Matérias com pelo menos 1 questão real cadastrada em lib/examBank.ts —
// as outras (Redação/Português já cobre esse lugar) aparecem desabilitadas
// até novas provas serem processadas.
const SUBJECTS_WITH_CONTENT = ALL_SUBJECTS.filter((s) => EXAM_BANK.some((q) => q.subject === s))

export default function SimuladoPage() {
  const [subject, setSubject] = useState(SUBJECTS_WITH_CONTENT[0])
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [qty, setQty] = useState(10)
  const [session, setSession] = useState<ExamQuestion[] | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [mode, setMode] = useState<'montar' | 'provas'>('montar')

  const bySubject = useMemo(() => EXAM_BANK.filter((q) => q.subject === subject), [subject])

  // Os `topic` de cada questão são bem granulares (um quase por prova/fonte);
  // agrupamos em ~15-20 "assuntos" por matéria via lib/topicGroups.ts pra o
  // filtro não virar uma lista de dezenas de chips. O `topic` original
  // continua aparecendo normalmente durante a resolução da prova.
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of bySubject) {
      const g = groupTopic(subject, q.topic)
      counts.set(g, (counts.get(g) || 0) + 1)
    }
    return counts
  }, [bySubject, subject])

  const topics = useMemo(() => Array.from(topicCounts.keys()), [topicCounts])

  // Trocar de matéria (inclusive a inicial, no primeiro render) reseta os
  // assuntos pra "todos marcados" daquela matéria.
  useEffect(() => {
    setSelectedTopics(new Set(topics))
  }, [subject]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const available = useMemo(
    () => bySubject.filter((q) => selectedTopics.has(groupTopic(subject, q.topic))),
    [bySubject, selectedTopics, subject]
  )
  const maxQty = Math.min(qty, available.length)

  const pickShuffled = () => [...available].sort(() => Math.random() - 0.5).slice(0, maxQty)

  const startSimulado = () => {
    setSession(pickShuffled())
    setStepIndex(0)
    setAnswers({})
  }

  const baixarPdf = async () => {
    setDownloadingPdf(true)
    try {
      await generateSimuladoPdf(subject, pickShuffled())
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o PDF agora. Tenta de novo em alguns segundos.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const current = session && stepIndex < session.length ? session[stepIndex] : null
  const done = session && stepIndex >= session.length
  const correctCount = session ? session.filter((q) => answers[q.id] === q.correct_option).length : 0

  const restart = () => {
    setSession(null)
    setStepIndex(0)
    setAnswers({})
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1 flex items-center gap-2">
        <FileText size={22} className="text-primary" /> Simulado
      </h1>
      <p className="text-muted text-sm mb-6">Questões reais de vestibulares — escolha a matéria, os assuntos e quantas questões quer fazer.</p>

      {!session && (
        <div className="flex gap-2 mb-5">
          {([['montar', 'Montar simulado'], ['provas', 'Provas em PDF']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition"
              style={
                mode === m
                  ? { backgroundColor: '#4F80AC26', borderColor: '#4F80AC', color: '#4F80AC' }
                  : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!session && mode === 'provas' && <ProvasPdf />}

      {!session && mode === 'montar' && (
        <div className="bg-surface border border-edge rounded-2xl p-6">
          <p className="text-fg font-semibold mb-3">Matéria</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_SUBJECTS.map((s) => {
              const has = SUBJECTS_WITH_CONTENT.includes(s)
              const color = subjectColor(s)
              const active = subject === s
              const count = EXAM_BANK.filter((q) => q.subject === s).length
              return (
                <button
                  key={s}
                  onClick={() => has && setSubject(s)}
                  disabled={!has}
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

          <p className="text-fg font-semibold mb-3">Assuntos de {subject}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setSelectedTopics(new Set(topics))}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Marcar todos
            </button>
            <span className="text-faint text-xs">·</span>
            <button
              onClick={() => setSelectedTopics(new Set())}
              className="text-xs text-muted font-semibold hover:underline"
            >
              Desmarcar todos
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {topics.map((t) => {
              const active = selectedTopics.has(t)
              const color = subjectColor(subject)
              return (
                <button
                  key={t}
                  onClick={() => toggleTopic(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                  style={
                    active
                      ? { backgroundColor: `${color}26`, borderColor: color, color }
                      : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }
                  }
                >
                  {t} <span className="opacity-70">({topicCounts.get(t)})</span>
                </button>
              )
            })}
          </div>

          <p className="text-fg font-semibold mb-3">Quantas questões?</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUANTITIES.map((q) => (
              <button
                key={q}
                onClick={() => setQty(q)}
                disabled={q > available.length}
                className={`w-14 h-10 rounded-lg text-sm font-semibold border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                  qty === q ? 'bg-primary text-white border-primary' : 'border-edge text-muted hover:border-primary/50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="text-faint text-xs mb-6">
            {available.length === 0
              ? 'Nenhuma questão disponível com esses filtros — marque pelo menos um assunto.'
              : `${available.length} ${available.length === 1 ? 'questão disponível' : 'questões disponíveis'} com esse filtro. Vai fazer ${maxQty}.`}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startSimulado}
              disabled={available.length === 0}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
            >
              <FileText size={16} /> Começar simulado
            </button>
            <button
              onClick={baixarPdf}
              disabled={available.length === 0 || downloadingPdf}
              className="inline-flex items-center gap-2 border border-edge text-fg font-semibold px-6 py-3 rounded-lg transition hover:border-primary/50 disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {downloadingPdf ? 'Gerando PDF...' : 'Baixar em PDF'}
            </button>
          </div>
        </div>
      )}

      {session && !done && current && (
        <div className="bg-surface border border-edge rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-faint font-semibold uppercase">Questão {stepIndex + 1} de {session.length}</span>
            <button onClick={restart} className="text-xs text-muted hover:text-fg transition">Encerrar</button>
          </div>

          <div className="flex gap-1 mb-5">
            {session.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: subjectColor(current.subject), opacity: i < stepIndex ? 1 : i === stepIndex ? 0.6 : 0.15 }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: `${subjectColor(current.subject)}26`, color: subjectColor(current.subject) }}>
              {current.subject}
            </span>
            <span className="text-faint text-[11px]">{current.topic} · {current.source}</span>
          </div>

          {current.image && (
            <div className="mb-4 bg-white border border-edge rounded-lg p-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.image} alt="Figura da questão" className="max-w-full max-h-[420px] object-contain" />
            </div>
          )}

          <p className="text-fg text-sm font-medium mb-4 whitespace-pre-wrap leading-relaxed">{current.question}</p>

          <div className="grid gap-2">
            {current.options.map((opt) => {
              const answered = answers[current.id]
              const isSelected = answered === opt.letra
              const isCorrect = opt.letra === current.correct_option
              const feedbackClass = isSelected
                ? isCorrect
                  ? 'border-teal bg-teal/15 text-fg'
                  : 'border-red-500 bg-red-500/15 text-fg'
                : answered && isCorrect
                ? 'border-teal bg-teal/10 text-fg'
                : 'border-edge bg-app text-muted hover:border-primary/40'
              return (
                <button
                  key={opt.letra}
                  onClick={() => !answered && setAnswers((prev) => ({ ...prev, [current.id]: opt.letra }))}
                  disabled={!!answered}
                  className={`text-left px-3 py-2 rounded-lg text-sm border transition flex items-start justify-between gap-2 ${feedbackClass}`}
                >
                  <span><span className="font-semibold mr-1.5">{opt.letra})</span>{opt.texto}</span>
                  {(isSelected || (answered && isCorrect)) && (
                    isCorrect
                      ? <Check size={16} className="text-teal-dark shrink-0 mt-0.5" />
                      : isSelected
                      ? <X size={16} className="text-red-700 shrink-0 mt-0.5" />
                      : null
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-edge text-muted hover:text-fg hover:bg-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!answers[current.id]}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:brightness-95 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {stepIndex < session.length - 1 ? 'Próxima' : 'Concluir'}
            </button>
          </div>
        </div>
      )}

      {done && session && (
        <div className="bg-surface border border-edge rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Trophy size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-1">Simulado concluído!</h2>
          <p className="text-muted text-sm mb-6">
            Você acertou {correctCount} de {session.length} questões ({Math.round((correctCount / session.length) * 100)}%).
          </p>

          <div className="text-left bg-app border border-edge rounded-xl divide-y divide-edge overflow-hidden mb-6">
            {session.map((q, i) => {
              const ok = answers[q.id] === q.correct_option
              return (
                <div key={q.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-teal/20 text-teal-dark' : 'bg-red-500/20 text-red-700'}`}>
                    {ok ? <Check size={12} /> : <X size={12} />}
                  </span>
                  <span className="text-xs text-faint w-6 shrink-0">{i + 1}.</span>
                  <span className="text-fg text-sm truncate flex-1">{q.topic}</span>
                  <span className="text-faint text-xs shrink-0">{answers[q.id]} {!ok && `(certa: ${q.correct_option})`}</span>
                </div>
              )
            })}
          </div>

          <button
            onClick={restart}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            <RotateCw size={16} /> Fazer outro simulado
          </button>
        </div>
      )}
    </div>
  )
}
