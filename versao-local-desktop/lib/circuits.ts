export type CircuitType = 'serie' | 'paralelo' | 'misto'
export type ResistorGroup = 'main' | 'parallel'
export type CircuitResistor = { id: number; R: number; group: ResistorGroup }

export function reqSerie(rs: number[]) {
  return rs.reduce((a, b) => a + b, 0)
}
export function reqParalelo(rs: number[]) {
  const inv = rs.reduce((a, b) => a + 1 / b, 0)
  return inv > 0 ? 1 / inv : 0
}

export type ResistorResult = { R: number; I: number; U: number; P: number }

// Topologia livre: resistores no grupo "main" ficam em série entre si; os do
// grupo "parallel" ficam em paralelo entre si, e esse bloco fica em série com
// a cadeia "main" — arrastando um resistor entre os dois grupos, dá pra
// reproduzir série pura (tudo em "main"), paralelo puro (tudo em "parallel")
// ou qualquer combinação mista entre os dois.
export function solveCircuit(U: number, resistors: CircuitResistor[]): { req: number; total: I_and_U; results: Map<number, ResistorResult> } {
  const mainRs = resistors.filter((r) => r.group === 'main')
  const parRs = resistors.filter((r) => r.group === 'parallel')
  const parEq = parRs.length ? reqParalelo(parRs.map((r) => r.R)) : 0
  const req = reqSerie(mainRs.map((r) => r.R)) + parEq
  const Itotal = req > 0 ? U / req : 0
  const Upar = Itotal * parEq
  const results = new Map<number, ResistorResult>()
  for (const r of mainRs) results.set(r.id, { R: r.R, I: Itotal, U: Itotal * r.R, P: Itotal * Itotal * r.R })
  for (const r of parRs) {
    const Ii = r.R > 0 ? Upar / r.R : 0
    results.set(r.id, { R: r.R, I: Ii, U: Upar, P: Upar * Ii })
  }
  return { req, total: { I: Itotal, U, P: U * Itotal }, results }
}

type I_and_U = { I: number; U: number; P: number }

export const APPLIANCES = [
  { id: 'chuveiro', label: 'Chuveiro elétrico', watts: 5500, hoursPerDay: 0.33 },
  { id: 'ar', label: 'Ar-condicionado', watts: 1200, hoursPerDay: 8 },
  { id: 'geladeira', label: 'Geladeira', watts: 150, hoursPerDay: 24 },
  { id: 'tv', label: 'TV', watts: 120, hoursPerDay: 4 },
  { id: 'lampada', label: 'Lâmpada LED', watts: 10, hoursPerDay: 5 },
  { id: 'maquina', label: 'Máquina de lavar', watts: 800, hoursPerDay: 1 },
]

export function energyCost(watts: number, hoursPerDay: number, days: number, tariff: number) {
  const kWhPerDay = (watts * hoursPerDay) / 1000
  const kWhTotal = kWhPerDay * days
  return { kWhPerDay, kWhTotal, cost: kWhTotal * tariff }
}
