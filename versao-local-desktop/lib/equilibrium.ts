export type Species = { id: string; label: string; nu: number; color: string; gas: boolean; step: number }

export type EqReaction = {
  id: string
  name: string
  equation: string
  species: Species[]
  K0: number
  dH: 'exo' | 'endo'
  init: Record<string, number>
  gasDelta: number // Δn de gás (produtos − reagentes)
  pressure: boolean
  tips: string[]
  units: string
}

export const EQ_REACTIONS: EqReaction[] = [
  {
    id: 'haber', name: 'Síntese da amônia (Haber-Bosch)', equation: 'N2(g) + 3 H2(g) ⇌ 2 NH3(g)   ΔH < 0',
    species: [
      { id: 'N2', label: 'N₂', nu: -1, color: '#60a5fa', gas: true, step: 0.5 },
      { id: 'H2', label: 'H₂', nu: -3, color: '#e5e7eb', gas: true, step: 0.5 },
      { id: 'NH3', label: 'NH₃', nu: 2, color: '#4ade80', gas: true, step: 0.3 },
    ],
    K0: 1.2, dH: 'exo', init: { N2: 1, H2: 3, NH3: 0 }, gasDelta: -2, pressure: true, units: 'mol/L',
    tips: [
      'Rendimento máximo: alta pressão (menos mols de gás à direita) e baixa temperatura (reação exotérmica). Na indústria usa-se ~450 °C por causa da velocidade, com catalisador de ferro.',
      'Retirar NH₃ do meio (liquefazendo-a) desloca o equilíbrio para a direita: é o que a indústria faz.',
    ],
  },
  {
    id: 'no2', name: 'NO₂ ⇌ N₂O₄ (efeito da cor)', equation: '2 NO2(g) ⇌ N2O4(g)   ΔH < 0',
    species: [
      { id: 'NO2', label: 'NO₂ (castanho)', nu: -2, color: '#b45309', gas: true, step: 0.2 },
      { id: 'N2O4', label: 'N₂O₄ (incolor)', nu: 1, color: '#e5e7eb', gas: true, step: 0.15 },
    ],
    K0: 1.6, dH: 'exo', init: { NO2: 1, N2O4: 0 }, gasDelta: -1, pressure: true, units: 'mol/L',
    tips: [
      'A cor é o indicador: mais castanho = mais NO₂ (deslocamento para a esquerda); mais claro = mais N₂O₄.',
      'Aquecer escurece o tubo (o equilíbrio se desloca para o NO₂, no sentido endotérmico). Comprimir clareia depois de um escurecimento momentâneo (as concentrações sobem primeiro).',
    ],
  },
  {
    id: 'fescn', name: 'Complexo Fe³⁺ + SCN⁻', equation: 'Fe3+ (amarelo) + SCN- (incolor) ⇌ [Fe(SCN)]2+ (vermelho)',
    species: [
      { id: 'Fe', label: 'Fe³⁺ (amarelo)', nu: -1, color: '#facc15', gas: false, step: 0.15 },
      { id: 'SCN', label: 'SCN⁻ (incolor)', nu: -1, color: '#e5e7eb', gas: false, step: 0.15 },
      { id: 'FeSCN', label: '[Fe(SCN)]²⁺ (vermelho)', nu: 1, color: '#dc2626', gas: false, step: 0.1 },
    ],
    K0: 4, dH: 'exo', init: { Fe: 0.5, SCN: 0.5, FeSCN: 0 }, gasDelta: 0, pressure: false, units: 'mol/L',
    tips: [
      'Adicionar Fe³⁺ ou SCN⁻ deixa a solução mais vermelha (desloca para a direita). Remover Fe³⁺ (com NaOH, por exemplo) descolore.',
      'Pressão não influencia sistemas em solução aquosa: só há efeito de pressão com gases. Aqui o efeito térmico é apresentado de forma qualitativa (formação do complexo exotérmica).',
    ],
  },
  {
    id: 'blood', name: 'Sangue: CO₂ / bicarbonato', equation: 'CO2(aq) + H2O(l) ⇌ H+(aq) + HCO3-(aq)',
    species: [
      { id: 'CO2', label: 'CO₂ dissolvido', nu: -1, color: '#94a3b8', gas: false, step: 0.25 },
      { id: 'H', label: 'H⁺', nu: 1, color: '#f87171', gas: false, step: 0.00002 },
      { id: 'HCO3', label: 'HCO₃⁻', nu: 1, color: '#60a5fa', gas: false, step: 4 },
    ],
    K0: 0.0008, dH: 'exo', init: { CO2: 1.2, H: 0.00004, HCO3: 24 }, gasDelta: 0, pressure: false, units: 'mmol/L',
    tips: [
      'Hipoventilação (retém CO₂): mais CO₂, equilíbrio para a direita, mais H⁺, pH cai: acidose respiratória.',
      'Hiperventilação (elimina CO₂): menos CO₂, equilíbrio para a esquerda, menos H⁺, pH sobe: alcalose respiratória.',
      'pH do sangue = 6,1 + log([HCO₃⁻] / [CO₂]), com CO₂ em mmol/L equivalente a 0,03 × pCO₂ (Henderson-Hasselbalch). O sangue normal tem pH ≈ 7,35 a 7,45.',
    ],
  },
]

export type SimState = Record<string, number>

export function quotient(r: EqReaction, c: SimState) {
  let q = 1
  for (const s of r.species) q *= Math.pow(Math.max(c[s.id], 1e-12), s.nu)
  return q
}

export function kAt(r: EqReaction, level: number) {
  // Modelo qualitativo de van't Hoff: exotérmica perde K ao aquecer.
  const sign = r.dH === 'exo' ? -1 : 1
  return r.K0 * Math.exp(sign * 0.45 * level)
}

export function step(r: EqReaction, c: SimState, K: number, rate: number, dt: number): SimState {
  const next = { ...c }
  let rf = K
  let rr = 1
  for (const s of r.species) {
    if (s.nu < 0) rf *= Math.pow(Math.max(c[s.id], 0), -s.nu)
    else rr *= Math.pow(Math.max(c[s.id], 0), s.nu)
  }
  let dxi = (rf - rr) * dt * rate
  // não deixa nenhuma concentração ficar negativa
  let cap = Infinity
  for (const s of r.species) {
    const move = s.nu * dxi
    if (move < 0) cap = Math.min(cap, (0.4 * c[s.id]) / Math.abs(s.nu))
  }
  if (Math.abs(dxi) > cap) dxi = Math.sign(dxi) * cap
  for (const s of r.species) next[s.id] = Math.max(0, c[s.id] + s.nu * dxi)
  return next
}

export function relax(r: EqReaction, c: SimState, K: number, steps = 20000): SimState {
  let cur = c
  for (let i = 0; i < steps; i++) cur = step(r, cur, K, 1, 0.004)
  return cur
}

export function phFromBlood(c: SimState) {
  return 6.1 + Math.log10(Math.max(c.HCO3, 1e-9) / Math.max(c.CO2, 1e-9))
}
