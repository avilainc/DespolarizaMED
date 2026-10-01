const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export type OfficeHour = {
  id: string
  title: string
  description: string | null
  weekday: number | null
  time: string | null
  specific_date: string | null
  meet_url: string
  active: boolean
}

// Próxima ocorrência de um plantão: data específica (se houver) ou o
// próximo dia da semana configurado, combinado com o horário.
export function nextOccurrence(oh: OfficeHour): Date | null {
  if (oh.specific_date) {
    const [h, m] = (oh.time || '00:00').split(':').map(Number)
    const d = new Date(oh.specific_date + 'T00:00:00')
    d.setHours(h, m, 0, 0)
    return d
  }
  if (oh.weekday === null || oh.weekday === undefined) return null

  const [h, m] = (oh.time || '00:00').split(':').map(Number)
  const now = new Date()
  const result = new Date(now)
  result.setHours(h, m, 0, 0)
  let diff = (oh.weekday - now.getDay() + 7) % 7
  if (diff === 0 && result <= now) diff = 7
  result.setDate(now.getDate() + diff)
  return result
}

export function weekdayLabel(weekday: number | null) {
  if (weekday === null || weekday === undefined) return null
  return WEEKDAYS[weekday]
}

export { WEEKDAYS }
