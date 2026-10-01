export type Reaction = {
  id: string
  name: string
  equation: string
  HR: number
  HP: number
  Ea: number
  note?: string
}

// Ea (energia de ativação) é ilustrativa: serve para desenhar o gráfico; os valores reais variam com as condições.
export const REACTIONS: Reaction[] = [
  {
    id: 'metano', name: 'Combustão do metano', equation: 'CH4 + 2 O2 → CO2 + 2 H2O(l)',
    HR: -75, HP: -965, Ea: 150,
    note: 'HR = ΔH°f do CH₄ (−75). HP = ΔH°f do CO₂ + 2 H₂O(l) = −394 + 2(−286) ≈ −965. Assim, ΔH = −890 kJ/mol, o valor da combustão do metano.',
  },
  { id: 'agua', name: 'Formação da água líquida', equation: 'H2 + ½ O2 → H2O(l)', HR: 0, HP: -285.8, Ea: 120, note: 'Substâncias simples no estado padrão têm H = 0.' },
  { id: 'calcario', name: 'Decomposição do calcário', equation: 'CaCO3(s) → CaO(s) + CO2(g)', HR: -1207, HP: -1029, Ea: 240, note: 'Reação endotérmica: precisa de calor (forno de cal, produção de cimento).' },
  { id: 'amonia', name: 'Síntese da amônia (Haber-Bosch)', equation: 'N2 + 3 H2 ⇌ 2 NH3', HR: 0, HP: -92.2, Ea: 230, note: 'Processo com catalisador de ferro; reação exotérmica.' },
  { id: 'fotossintese', name: 'Fotossíntese', equation: '6 CO2 + 6 H2O → C6H12O6 + 6 O2', HR: -2808, HP: 0, Ea: 320, note: 'Escala de referência dos valores dados (H da glicose e do O₂ = 0). ΔH = +2808 kJ por mol de glicose: absorve energia da luz.' },
]

export type HessEq = { id: string; reactants: [number, string][]; products: [number, string][]; dH: number }

export const HESS_EQS: HessEq[] = [
  { id: 'E1', reactants: [[1, 'C(grafite)'], [1, 'O2']], products: [[1, 'CO2']], dH: -393.5 },
  { id: 'E2', reactants: [[1, 'CO'], [0.5, 'O2']], products: [[1, 'CO2']], dH: -283.0 },
  { id: 'E3', reactants: [[1, 'H2'], [0.5, 'O2']], products: [[1, 'H2O(l)']], dH: -285.8 },
  { id: 'E4', reactants: [[1, 'H2O(l)']], products: [[1, 'H2O(g)']], dH: 44.0 },
  { id: 'E5', reactants: [[1, 'CH4'], [2, 'O2']], products: [[1, 'CO2'], [2, 'H2O(l)']], dH: -890 },
  { id: 'E6', reactants: [[1, 'N2'], [3, 'H2']], products: [[2, 'NH3']], dH: -92.2 },
  { id: 'E7', reactants: [[1, 'C(diamante)']], products: [[1, 'C(grafite)']], dH: -1.9 },
  { id: 'E8', reactants: [[1, 'S(rômbico)'], [1, 'O2']], products: [[1, 'SO2']], dH: -296.8 },
  { id: 'E9', reactants: [[1, 'SO2'], [0.5, 'O2']], products: [[1, 'SO3']], dH: -98.9 },
]

export type HessStep = { eq: string; mult: number; inverted: boolean }

export function hessSum(steps: HessStep[]) {
  const net: Record<string, number> = {}
  let dH = 0
  for (const s of steps) {
    const eq = HESS_EQS.find((e) => e.id === s.eq)!
    const sign = s.inverted ? -1 : 1
    dH += sign * s.mult * eq.dH
    for (const [c, sp] of eq.reactants) net[sp] = (net[sp] ?? 0) - sign * s.mult * c
    for (const [c, sp] of eq.products) net[sp] = (net[sp] ?? 0) + sign * s.mult * c
  }
  const reactants: [number, string][] = []
  const products: [number, string][] = []
  for (const [sp, c] of Object.entries(net)) {
    const v = Math.round(c * 1000) / 1000
    if (v < 0) reactants.push([-v, sp])
    else if (v > 0) products.push([v, sp])
  }
  return { dH: Math.round(dH * 10) / 10, reactants, products }
}

export function fmtCoef(n: number) {
  if (n === 1) return ''
  if (n === 0.5) return '½'
  if (Number.isInteger(n)) return String(n)
  const twice = Math.round(n * 2)
  if (Math.abs(n * 2 - twice) < 1e-6) return `${twice}/2`
  return String(Math.round(n * 100) / 100)
}
