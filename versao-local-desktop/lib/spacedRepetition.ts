export type Difficulty = 'dificil' | 'media' | 'facil'

const MAX_INTERVAL_DAYS = 60

// Repetição espaçada simplificada (estilo Leitner): "Difícil" sempre volta
// pra revisão em 1 dia; "Média"/"Fácil" crescem a partir do intervalo
// anterior enquanto o aluno for acertando, até um teto de 60 dias.
export function nextReviewInterval(difficulty: Difficulty, prevIntervalDays: number | null): number {
  if (difficulty === 'dificil') return 1

  if (difficulty === 'media') {
    const base = prevIntervalDays && prevIntervalDays >= 3 ? prevIntervalDays * 1.5 : 3
    return Math.min(Math.round(base), MAX_INTERVAL_DAYS)
  }

  const base = prevIntervalDays && prevIntervalDays >= 7 ? prevIntervalDays * 2 : 7
  return Math.min(Math.round(base), MAX_INTERVAL_DAYS)
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
