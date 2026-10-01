// Cor por matéria — mesma paleta usada nos cards do dashboard, reaproveitada
// aqui pra dar identidade visual ao desafio diário (cada questão/flashcard
// mostra a cor da sua matéria).
export const SUBJECT_COLORS: Record<string, string> = {
  Biologia: '#22c55e',
  Matemática: '#ef4444',
  Física: '#38bdf8',
  Química: '#ec4899',
  Geografia: '#c17f3e',
  História: '#f97316',
  Redação: '#a855f7',
  Português: '#6366f1',
  Inglês: '#9ca3af',
}

export const ALL_SUBJECTS = Object.keys(SUBJECT_COLORS)

export function subjectColor(subject: string | null) {
  return (subject && SUBJECT_COLORS[subject]) || '#4F80AC'
}
