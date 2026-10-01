'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, subDays, differenceInCalendarDays } from 'date-fns'
import { Flame, Trophy, Target, PlayCircle, Lock, Check, X, TrendingUp, Medal, Snowflake, ArrowUp, ArrowDown, RotateCw, Sparkles } from 'lucide-react'
import { getLevel } from '@/lib/gamification'
import { Confetti } from '@/components/Confetti'
import { ALL_SUBJECTS, subjectColor } from '@/lib/subjectColors'
import { QUICK_QUESTIONS_FALLBACK } from '@/lib/quickQuestionsFallback'
import { FLASHCARDS_FALLBACK } from '@/lib/flashcardsFallback'
import { nextReviewInterval, addDays, type Difficulty } from '@/lib/spacedRepetition'

type QuickQuestion = { id: string; subject: string | null; question: string; options: { letra: string; texto: string }[]; correct_option: string }
type Flashcard = { id: string; subject: string | null; front: string; back: string }
type ReviewInfo = { interval_days: number; next_review_date: string }
type ChallengeLog = { challenge_date: string; questions_answered: number; correct_count: number; completed: boolean }
type Achievement = { id: string; code: string; title: string; description: string | null; icon: string | null }
type LeaderboardRow = { id: string; name: string | null; avatar_url: string | null; xp: number }

const ICONS: Record<string, typeof Flame> = { flame: Flame, trophy: Trophy, target: Target, 'play-circle': PlayCircle }
const FLASHCARDS_PER_DAY = 3

export default function AchievementsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuickQuestion[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [history, setHistory] = useState<ChallengeLog[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedCodes, setUnlockedCodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [xp, setXp] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [freezeDates, setFreezeDates] = useState<Set<string>>(new Set())
  const [streakFreezes, setStreakFreezes] = useState(0)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  // Fluxo do desafio: uma questão de cada vez, depois os flashcards.
  const [phase, setPhase] = useState<'quiz' | 'flashcards'>('quiz')
  const [stepIndex, setStepIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashcardsReviewed, setFlashcardsReviewed] = useState(0)
  const [reviews, setReviews] = useState<Record<string, ReviewInfo>>({})
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLog = history.find((l) => l.challenge_date === todayStr)
  const doneToday = todayLog?.completed || !!result

  async function load(uid: string) {
    const [{ data: questionData }, { data: flashcardData }, { data: logData }, { data: achData }, { data: userAchData }, { data: profileData }, { data: leaderboardData }, { data: freezeData }, { data: reviewData }] = await Promise.all([
      supabase.from('quick_questions').select('*'),
      supabase.from('flashcards').select('*'),
      supabase.from('daily_challenge_log').select('challenge_date, questions_answered, correct_count, completed').eq('user_id', uid).order('challenge_date', { ascending: false }).limit(30),
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('achievement_id, achievements(code)').eq('user_id', uid),
      supabase.from('profiles').select('xp, streak_freezes').eq('id', uid).maybeSingle(),
      supabase.rpc('get_leaderboard', { limit_count: 10 }),
      supabase.from('streak_freeze_uses').select('used_date').eq('user_id', uid),
      supabase.from('flashcard_reviews').select('flashcard_id, interval_days, next_review_date').eq('user_id', uid),
    ])

    const reviewMap: Record<string, ReviewInfo> = {}
    for (const r of (reviewData as any[]) ?? []) {
      reviewMap[r.flashcard_id] = { interval_days: r.interval_days, next_review_date: r.next_review_date }
    }
    setReviews(reviewMap)

    // 1 questão sorteada por matéria disponível (não todas as matérias vão
    // ter conteúdo ainda — só entra quem tem pelo menos 1 questão). Sem
    // dado no Supabase ainda, cai no fallback local (mesmo padrão do
    // glossário/flashcards) — inclui 5 questões reais de vestibular
    // (Unifesp 2025) já conferidas contra o gabarito oficial.
    const rawQuestions = (questionData as QuickQuestion[]) ?? []
    const allQuestions = rawQuestions.length > 0 ? rawQuestions : (QUICK_QUESTIONS_FALLBACK as QuickQuestion[])
    const bySubject = new Map<string, QuickQuestion[]>()
    for (const q of allQuestions) {
      const key = q.subject || 'Geral'
      if (!bySubject.has(key)) bySubject.set(key, [])
      bySubject.get(key)!.push(q)
    }
    const picked = Array.from(bySubject.values()).map((qs) => qs[Math.floor(Math.random() * qs.length)])
    setQuizQuestions(picked)

    // Cartões vencidos pra revisão (ou nunca revisados) entram primeiro;
    // só completa com os que ainda não venceram se sobrar espaço.
    const rawFlashcards = (flashcardData as Flashcard[]) ?? []
    const allFlashcards = rawFlashcards.length > 0 ? rawFlashcards : (FLASHCARDS_FALLBACK as Flashcard[])
    const due = allFlashcards.filter((c) => !reviewMap[c.id] || reviewMap[c.id].next_review_date <= todayStr)
    const notDue = allFlashcards.filter((c) => reviewMap[c.id] && reviewMap[c.id].next_review_date > todayStr)
    setFlashcards([...due.sort(() => Math.random() - 0.5), ...notDue.sort(() => Math.random() - 0.5)].slice(0, FLASHCARDS_PER_DAY))

    const logs = (logData as ChallengeLog[]) ?? []
    setHistory(logs)
    setAchievements((achData as Achievement[]) ?? [])
    const codes = new Set<string>((userAchData ?? []).map((u: any) => u.achievements?.code).filter(Boolean))
    setUnlockedCodes(codes)
    setXp(profileData?.xp ?? 0)
    setLeaderboard((leaderboardData as LeaderboardRow[]) ?? [])
    let freezes = profileData?.streak_freezes ?? 0
    const freezeSet = new Set<string>((freezeData ?? []).map((f: any) => f.used_date))
    setStreakFreezes(freezes)
    setFreezeDates(freezeSet)

    // Se ontem foi pulado e ainda não foi coberto por um freeze, aplica
    // automaticamente um (se tiver disponível) pra não quebrar a sequência —
    // efeito "streak freeze" do Duolingo, aplicado de forma silenciosa.
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const yesterdayDone = logs.find((l) => l.challenge_date === yesterdayStr)?.completed
    const todayDone = logs.find((l) => l.challenge_date === todayStr)?.completed
    if (!yesterdayDone && !todayDone && !freezeSet.has(yesterdayStr) && freezes > 0) {
      const hadStreakBefore = logs.some((l) => l.challenge_date === format(subDays(new Date(), 2), 'yyyy-MM-dd') && l.completed)
      if (hadStreakBefore) {
        const { error } = await supabase.from('streak_freeze_uses').insert({ user_id: uid, used_date: yesterdayStr })
        if (!error) {
          await supabase.from('profiles').update({ streak_freezes: freezes - 1 }).eq('id', uid)
          freezeSet.add(yesterdayStr)
          setFreezeDates(new Set(freezeSet))
          setStreakFreezes(freezes - 1)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUserId(data.user.id); load(data.user.id) }
      else setLoading(false)
    })
  }, [])

  function dayCounts(dateStr: string) {
    return history.find((l) => l.challenge_date === dateStr)?.completed || freezeDates.has(dateStr)
  }

  function currentStreak() {
    let count = 0
    let cursor = new Date()
    if (!dayCounts(todayStr)) cursor = subDays(cursor, 1)
    while (dayCounts(format(cursor, 'yyyy-MM-dd'))) {
      count++
      cursor = subDays(cursor, 1)
    }
    return count
  }

  const unlock = async (uid: string, code: string, already: Set<string>) => {
    if (already.has(code)) return
    const achievement = achievements.find((a) => a.code === code)
    if (!achievement) return
    await supabase.from('user_achievements').insert({ user_id: uid, achievement_id: achievement.id })
    setUnlockedCodes((prev) => new Set(prev).add(code))
  }

  // Só registra a resposta — quem decide quando avança é o aluno, pelos
  // botões de Anterior/Próximo (sem avanço automático).
  const selectQuizAnswer = (questionId: string, letra: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: letra }))
  }

  const goToPrevQuiz = () => setStepIndex((i) => Math.max(0, i - 1))

  const goToNextQuiz = () => {
    if (stepIndex < quizQuestions.length - 1) {
      setStepIndex((i) => i + 1)
    } else if (flashcards.length > 0) {
      setPhase('flashcards')
      setStepIndex(0)
    } else {
      finishChallenge(quizAnswers, 0)
    }
  }

  const reviewFlashcard = async (difficulty: Difficulty) => {
    const card = flashcards[stepIndex]
    if (card && userId) {
      const prevInterval = reviews[card.id]?.interval_days ?? null
      const interval = nextReviewInterval(difficulty, prevInterval)
      const nextDate = addDays(todayStr, interval)
      await supabase.from('flashcard_reviews').upsert(
        { user_id: userId, flashcard_id: card.id, interval_days: interval, next_review_date: nextDate, last_difficulty: difficulty },
        { onConflict: 'user_id,flashcard_id' }
      )
      setReviews((prev) => ({ ...prev, [card.id]: { interval_days: interval, next_review_date: nextDate } }))
    }
    const reviewed = flashcardsReviewed + 1
    setFlashcardsReviewed(reviewed)
    setFlashcardFlipped(false)
    if (stepIndex < flashcards.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finishChallenge(quizAnswers, reviewed)
    }
  }

  const finishChallenge = async (finalAnswers: Record<string, string>, reviewedCount: number) => {
    if (!userId) return
    const correctCount = quizQuestions.filter((q) => finalAnswers[q.id] === q.correct_option).length
    const streakBefore = currentStreak()

    await supabase.from('daily_challenge_log').upsert(
      { user_id: userId, challenge_date: todayStr, questions_answered: quizQuestions.length, correct_count: correctCount, completed: true },
      { onConflict: 'user_id,challenge_date' }
    )
    setHistory((prev) => [{ challenge_date: todayStr, questions_answered: quizQuestions.length, correct_count: correctCount, completed: true }, ...prev.filter((l) => l.challenge_date !== todayStr)])
    setResult({ correct: correctCount, total: quizQuestions.length })
    setConfettiTrigger((n) => n + 1)

    const isPerfect = quizQuestions.length > 0 && correctCount === quizQuestions.length
    const coveredAllSubjects = ALL_SUBJECTS.every((s) => quizQuestions.some((q) => q.subject === s))
    const earned = correctCount * 10 + (isPerfect ? 15 : 0) + reviewedCount * 5 + (coveredAllSubjects ? 20 : 0)
    const { data: newXp } = await supabase.rpc('increment_xp', { amount: earned })
    if (typeof newXp === 'number') setXp(newXp)

    const newStreak = streakBefore + 1
    const already = unlockedCodes

    if (newStreak >= 3) await unlock(userId, 'streak_3', already)
    if (newStreak >= 7) await unlock(userId, 'streak_7', already)
    if (newStreak >= 30) await unlock(userId, 'streak_30', already)
    if (newStreak >= 100) await unlock(userId, 'streak_100', already)
    if (isPerfect) await unlock(userId, 'perfect_day', already)
    if (coveredAllSubjects) await unlock(userId, 'multidisciplinar', already)

    const perfectDaysCount = history.filter((l) => l.completed && l.questions_answered > 0 && l.correct_count === l.questions_answered).length + (isPerfect ? 1 : 0)
    if (perfectDaysCount >= 7) await unlock(userId, 'perfect_week', already)

    if (typeof newXp === 'number' && getLevel(newXp).name === 'Lenda do Vestibular') {
      await unlock(userId, 'level_max', already)
    }

    if (new Date().getHours() < 8) await unlock(userId, 'early_bird', already)

    const previousLog = history.find((l) => l.challenge_date !== todayStr)
    if (previousLog) {
      const gapDays = differenceInCalendarDays(new Date(), new Date(previousLog.challenge_date + 'T00:00:00'))
      if (gapDays >= 4) await unlock(userId, 'comeback', already)
    }

    const { data: freshLeaderboard } = await supabase.rpc('get_leaderboard', { limit_count: 10 })
    const rows = (freshLeaderboard as LeaderboardRow[]) ?? []
    setLeaderboard(rows)
    const myIndex = rows.findIndex((r) => r.id === userId)
    if (myIndex !== -1 && myIndex < 3) await unlock(userId, 'top_3', already)
  }

  function achievementProgress(code: string): { current: number; target: number } | null {
    const streak = currentStreak()
    if (code === 'streak_3') return { current: Math.min(streak, 3), target: 3 }
    if (code === 'streak_7') return { current: Math.min(streak, 7), target: 7 }
    if (code === 'streak_30') return { current: Math.min(streak, 30), target: 30 }
    if (code === 'streak_100') return { current: Math.min(streak, 100), target: 100 }
    if (code === 'perfect_week') {
      const count = history.filter((l) => l.completed && l.questions_answered > 0 && l.correct_count === l.questions_answered).length
      return { current: Math.min(count, 7), target: 7 }
    }
    return null
  }

  if (loading) return <div className="px-6 py-8 text-muted text-sm">Carregando...</div>

  const level = getLevel(xp)
  const heatmapDays = Array.from({ length: 35 }, (_, i) => subDays(new Date(), 34 - i))
  const myRankIndex = leaderboard.findIndex((r) => r.id === userId)
  const currentQuiz = quizQuestions[stepIndex]
  const currentFlashcard = flashcards[stepIndex]
  const totalSteps = quizQuestions.length + flashcards.length
  const doneSteps = phase === 'quiz' ? stepIndex : quizQuestions.length + stepIndex

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-edge rounded-2xl p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <Flame size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-fg leading-none">{currentStreak()}</p>
            <p className="text-muted text-xs">{currentStreak() === 1 ? 'dia seguido' : 'dias seguidos'}</p>
          </div>
          <div className="flex items-center gap-1 text-faint text-xs" title="Congela sua sequência se você perder 1 dia">
            <Snowflake size={14} className={streakFreezes > 0 ? 'text-blue-400' : ''} /> {streakFreezes}
          </div>
        </div>

        <div className="bg-surface border border-edge rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-fg font-semibold text-sm">{level.name}</p>
            <p className="text-faint text-xs">{xp} XP</p>
          </div>
          <div className="h-1.5 bg-edge rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${level.progress}%` }} />
          </div>
          {level.next && <p className="text-faint text-xs mt-1.5">{level.next.min - xp} XP pro próximo nível ({level.next.name})</p>}
        </div>
      </div>

      <div className="bg-surface border border-edge rounded-2xl p-5 mb-8">
        <p className="text-faint text-xs font-semibold uppercase mb-3">Últimos 35 dias</p>
        <div className="grid grid-cols-7 gap-1.5">
          {heatmapDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const done = history.find((l) => l.challenge_date === key)?.completed
            const frozen = freezeDates.has(key)
            const isFuture = d > new Date()
            return (
              <div
                key={key}
                title={`${format(d, 'dd/MM')}${done ? ' · feito' : frozen ? ' · congelado' : ''}`}
                className={`aspect-square rounded-sm ${
                  isFuture ? 'bg-transparent' : done ? 'bg-teal' : frozen ? 'bg-blue-400/60' : 'bg-edge'
                }`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-faint">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal inline-block" /> feito</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400/60 inline-block" /> congelado</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-edge inline-block" /> nada</span>
        </div>
      </div>

      <div className="relative bg-surface border border-edge rounded-2xl p-6 mb-8 overflow-hidden">
        <Confetti trigger={confettiTrigger} />
        <h2 className="font-bold text-fg mb-1 flex items-center gap-2">
          Desafio de hoje
          {doneToday && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-dark bg-teal/15 border border-teal/30 px-2 py-0.5 rounded-full">
              Concluído
            </span>
          )}
        </h2>

        {doneToday ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 rounded-full bg-teal/15 border border-teal/30 flex items-center justify-center">
              <Check size={18} className="text-teal-dark" />
            </div>
            <div>
              <p className="text-fg text-sm font-medium">
                Feito! {result ? `${result.correct}/${result.total} acertos no quiz` : `${todayLog?.correct_count}/${todayLog?.questions_answered} acertos`}
              </p>
              <p className="text-muted text-xs">Volta amanhã pra manter a sequência.</p>
            </div>
          </div>
        ) : totalSteps === 0 ? (
          <p className="text-muted text-sm mt-2">Ainda não tem questões nem flashcards cadastrados — peça pro admin adicionar.</p>
        ) : (
          <div className="mt-4">
            {/* Barra de progresso segmentada por matéria/etapa */}
            <div className="flex gap-1 mb-5">
              {quizQuestions.map((q, i) => (
                <div key={q.id} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i < doneSteps || (phase === 'flashcards') ? subjectColor(q.subject) : 'rgb(var(--color-edge))', opacity: i < doneSteps || phase === 'flashcards' ? 1 : 0.3 }} />
              ))}
              {flashcards.map((_, i) => (
                <div key={`f${i}`} className="h-1.5 flex-1 rounded-full bg-teal" style={{ opacity: phase === 'flashcards' && i < stepIndex ? 1 : phase === 'flashcards' && i === stepIndex ? 0.6 : 0.15 }} />
              ))}
            </div>

            {phase === 'quiz' && currentQuiz && (
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: `${subjectColor(currentQuiz.subject)}26`, color: subjectColor(currentQuiz.subject) }}>
                  {currentQuiz.subject || 'Geral'}
                </span>
                <p className="text-fg text-sm font-medium mb-3 whitespace-pre-wrap leading-relaxed">{currentQuiz.question}</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {currentQuiz.options.map((opt) => {
                    const answered = quizAnswers[currentQuiz.id]
                    const isSelected = answered === opt.letra
                    const isCorrect = opt.letra === currentQuiz.correct_option
                    const feedbackClass = isSelected
                      ? isCorrect
                        ? 'border-teal bg-teal/15 text-fg'
                        : 'border-red-500 bg-red-500/15 text-fg'
                      : 'border-edge bg-app text-muted hover:border-primary/40'
                    return (
                      <button
                        key={opt.letra}
                        onClick={() => selectQuizAnswer(currentQuiz.id, opt.letra)}
                        disabled={!!answered}
                        className={`text-left px-3 py-2 rounded-lg text-sm border transition flex items-center justify-between gap-2 ${feedbackClass} ${answered ? '' : 'cursor-pointer'}`}
                      >
                        <span><span className="font-semibold mr-1.5">{opt.letra})</span>{opt.texto}</span>
                        {isSelected && (
                          isCorrect
                            ? <Check size={16} className="text-teal-dark shrink-0" />
                            : <X size={16} className="text-red-700 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={goToPrevQuiz}
                    disabled={stepIndex === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-edge text-muted hover:text-fg hover:bg-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={goToNextQuiz}
                    disabled={!quizAnswers[currentQuiz.id]}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary hover:brightness-95 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {stepIndex < quizQuestions.length - 1 ? 'Próximo' : 'Concluir'}
                  </button>
                </div>
              </div>
            )}

            {phase === 'flashcards' && currentFlashcard && (
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-3 bg-teal/15 text-teal-dark">
                  <Sparkles size={11} /> Flashcard · {currentFlashcard.subject || 'Geral'}
                </span>
                <button
                  onClick={() => setFlashcardFlipped((f) => !f)}
                  className="w-full min-h-[140px] bg-app border border-edge rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-teal/50 transition"
                >
                  <p className="text-fg text-base font-medium">{flashcardFlipped ? currentFlashcard.back : currentFlashcard.front}</p>
                  <span className="flex items-center gap-1 text-faint text-xs mt-2">
                    <RotateCw size={12} /> {flashcardFlipped ? 'Verso' : 'Toque para ver a resposta'}
                  </span>
                </button>
                {flashcardFlipped && (
                  <div className="mt-3">
                    <p className="text-faint text-xs text-center mb-2">Quão fácil foi lembrar?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => reviewFlashcard('dificil')} className="py-2.5 rounded-lg text-sm font-semibold bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition">
                        Difícil
                      </button>
                      <button onClick={() => reviewFlashcard('media')} className="py-2.5 rounded-lg text-sm font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition">
                        Média
                      </button>
                      <button onClick={() => reviewFlashcard('facil')} className="py-2.5 rounded-lg text-sm font-semibold bg-teal/15 border border-teal/40 text-teal-dark hover:bg-teal/25 transition">
                        Fácil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-fg mb-4">Conquistas</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {achievements.map((a) => {
          const Icon = (a.icon && ICONS[a.icon]) || Trophy
          const unlocked = unlockedCodes.has(a.code)
          const progress = !unlocked ? achievementProgress(a.code) : null
          return (
            <div key={a.id} className={`rounded-xl border p-4 flex items-center gap-3 ${unlocked ? 'border-accent/40 bg-accent/5' : 'border-edge'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${unlocked ? 'bg-accent/15 text-accent' : 'bg-surface text-faint'}`}>
                {unlocked ? <Icon size={18} /> : <Lock size={16} />}
              </div>
              <div className={`flex-1 min-w-0 ${unlocked ? '' : 'opacity-60'}`}>
                <p className="text-fg text-sm font-semibold">{a.title}</p>
                <p className="text-faint text-xs">{a.description}</p>
                {progress && (
                  <div className="mt-1.5">
                    <div className="h-1 bg-edge rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${(progress.current / progress.target) * 100}%` }} />
                    </div>
                    <p className="text-faint text-[10px] mt-0.5">{progress.current}/{progress.target}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="text-xl font-bold text-fg mb-4 flex items-center gap-2"><TrendingUp size={19} className="text-primary" /> Desempenho</h2>
      {history.length === 0 ? (
        <p className="text-muted text-sm">Responde o desafio de hoje pra começar a acompanhar seu progresso.</p>
      ) : (
        <>
          {currentStreak() >= 5 && (() => {
            const recent = [...history].slice(0, 14).reverse()
            const max = Math.max(...recent.map((h) => h.correct_count), 1)
            return (
              <div className="bg-surface border border-edge rounded-2xl p-5 mb-4">
                <p className="text-faint text-xs font-semibold uppercase mb-4 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-primary" /> Evolução de acertos por dia — {currentStreak()} dias seguidos!
                </p>
                <div className="flex items-end gap-1.5 h-28">
                  {recent.map((h) => (
                    <div key={h.challenge_date} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="text-[10px] text-faint">{h.correct_count}</span>
                      <div
                        className="w-full bg-teal rounded-t-sm transition-all"
                        style={{ height: `${Math.max((h.correct_count / max) * 100, 6)}%` }}
                      />
                      <span className="text-[9px] text-faint">{format(new Date(h.challenge_date + 'T00:00:00'), 'dd/MM')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        <div className="bg-surface border border-edge rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-faint text-xs uppercase">
                <th className="text-left px-4 py-2 font-medium">Data</th>
                <th className="text-left px-4 py-2 font-medium">Respondidas</th>
                <th className="text-left px-4 py-2 font-medium">Acertos</th>
                <th className="text-left px-4 py-2 font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {history.map((h) => (
                <tr key={h.challenge_date}>
                  <td className="px-4 py-2 text-fg">{format(new Date(h.challenge_date + 'T00:00:00'), 'dd/MM')}</td>
                  <td className="px-4 py-2 text-muted">{h.questions_answered}</td>
                  <td className="px-4 py-2 text-muted">{h.correct_count}</td>
                  <td className="px-4 py-2 text-muted">{h.questions_answered ? Math.round((h.correct_count / h.questions_answered) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <h2 className="text-xl font-bold text-fg mb-4 mt-8 flex items-center gap-2"><Medal size={19} className="text-primary" /> Ranking</h2>

      {myRankIndex > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
          <p className="text-faint text-xs font-semibold uppercase mb-2">Sua posição</p>
          <div className="space-y-1.5">
            {myRankIndex - 1 >= 0 && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <ArrowUp size={12} className="text-teal shrink-0" />
                {leaderboard[myRankIndex - 1].name || 'Aluno(a)'} · {leaderboard[myRankIndex - 1].xp} XP
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-fg font-semibold">
              {myRankIndex + 1}º · Você · {leaderboard[myRankIndex].xp} XP
            </div>
            {myRankIndex + 1 < leaderboard.length && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <ArrowDown size={12} className="text-faint shrink-0" />
                {leaderboard[myRankIndex + 1].name || 'Aluno(a)'} · {leaderboard[myRankIndex + 1].xp} XP
              </div>
            )}
          </div>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <p className="text-muted text-sm">Ninguém no ranking ainda — seja o primeiro a pontuar.</p>
      ) : (
        <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge overflow-hidden">
          {leaderboard.map((row, i) => (
            <div key={row.id} className={`flex items-center gap-3 px-4 py-3 ${row.id === userId ? 'bg-primary/5' : ''}`}>
              <span className={`w-6 text-sm font-bold ${i < 3 ? 'text-accent' : 'text-faint'}`}>{i + 1}º</span>
              <div className="w-8 h-8 rounded-full bg-primary/15 overflow-hidden flex items-center justify-center shrink-0">
                {row.avatar_url ? <img src={row.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-primary text-xs font-bold">{row.name?.[0]?.toUpperCase() || '?'}</span>}
              </div>
              <span className="text-fg text-sm flex-1">{row.name || 'Aluno(a)'}{row.id === userId && <span className="text-faint"> (você)</span>}</span>
              <span className="text-muted text-sm font-medium">{row.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
