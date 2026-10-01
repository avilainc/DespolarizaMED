// Curva de níveis inspirada no Duolingo/Khan Academy: XP acumulado nunca
// zera (só o streak quebra), então o nível é sempre progresso visível de
// longo prazo, mesmo em dias ruins.
export const LEVELS = [
  { min: 0, name: 'Calouro(a)' },
  { min: 50, name: 'Aplicado(a)' },
  { min: 150, name: 'Focado(a)' },
  { min: 300, name: 'Estrategista' },
  { min: 600, name: 'Fera' },
  { min: 1000, name: 'Referência da Turma' },
  { min: 2000, name: 'Lenda do Vestibular' },
] as const

export function getLevel(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0]
  let next: (typeof LEVELS)[number] | null = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
    }
  }
  const progress = next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100
  return { ...current, next, progress }
}

// +10 XP por acerto no desafio diário, +15 de bônus se gabaritar —
// recompensa esforço (respondeu) mais do que só o resultado, como no
// modelo de "pontos de energia" do Khan Academy.
export function xpForChallenge(correct: number, total: number) {
  const base = correct * 10
  const bonus = total > 0 && correct === total ? 15 : 0
  return base + bonus
}
