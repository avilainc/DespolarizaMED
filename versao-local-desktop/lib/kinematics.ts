export type VehicleId = 'carro' | 'caminhao' | 'moto' | 'aviao'
export const VEHICLES: { id: VehicleId; label: string; color: string; length: number }[] = [
  { id: 'carro', label: 'Carro', color: '#38bdf8', length: 4.5 },
  { id: 'caminhao', label: 'Caminhão', color: '#fb923c', length: 18 },
  { id: 'moto', label: 'Moto', color: '#4ade80', length: 2 },
  { id: 'aviao', label: 'Avião', color: '#c084fc', length: 40 },
]

export const kmhToMs = (v: number) => v / 3.6
export const msToKmh = (v: number) => v * 3.6

export type MruvMode = 'S' | 'v' | 'a' | 't'

export type Solved = { v0: number; v: number; a: number; t: number; S: number; formula: string; steps: string[] }

// Sorvete: S = S0 + v.t (MRU) | Sorvetão: S = S0 + v0.t + a.t²/2
// Vovô Ateu: v = v0 + a.t | Torricelli: v² = v0² + 2.a.ΔS
export function solveMRUV(mode: MruvMode, known: { v0: number; v: number; a: number; t: number; S: number }): Solved {
  const { v0 } = known
  if (mode === 'S') {
    const { a, t } = known
    const S = v0 * t + (a * t * t) / 2
    const v = v0 + a * t
    return {
      v0, v, a, t, S,
      formula: 'Sorvetão (equação horária do MRUV)',
      steps: [`ΔS = v0·t + a·t²/2`, `ΔS = ${v0.toFixed(1)}×${t.toFixed(1)} + ${a.toFixed(1)}×${t.toFixed(1)}²/2`, `ΔS = ${S.toFixed(1)} m`],
    }
  }
  if (mode === 'v') {
    const { a, t } = known
    const v = v0 + a * t
    const S = v0 * t + (a * t * t) / 2
    return {
      v0, v, a, t, S,
      formula: 'Vovô Ateu (função horária da velocidade)',
      steps: [`v = v0 + a·t`, `v = ${v0.toFixed(1)} + ${a.toFixed(1)}×${t.toFixed(1)}`, `v = ${v.toFixed(1)} m/s`],
    }
  }
  if (mode === 'a') {
    const { v, t } = known
    const a = t !== 0 ? (v - v0) / t : 0
    const S = v0 * t + (a * t * t) / 2
    return {
      v0, v, a, t, S,
      formula: 'Vovô Ateu, isolando a',
      steps: [`a = (v − v0) / t`, `a = (${v.toFixed(1)} − ${v0.toFixed(1)}) / ${t.toFixed(1)}`, `a = ${a.toFixed(2)} m/s²`],
    }
  }
  // mode === 't'
  const { v, a } = known
  const t = a !== 0 ? (v - v0) / a : 0
  const S = v0 * t + (a * t * t) / 2
  return {
    v0, v, a, t, S,
    formula: 'Vovô Ateu, isolando t',
    steps: [`t = (v − v0) / a`, `t = (${v.toFixed(1)} − ${v0.toFixed(1)}) / ${a.toFixed(1)}`, `t = ${t.toFixed(1)} s`],
  }
}

export function torricelli(v0: number, a: number, S: number) {
  const v2 = v0 * v0 + 2 * a * S
  const v = Math.sqrt(Math.max(0, v2))
  return { v, steps: [`v² = v0² + 2·a·ΔS`, `v² = ${v0.toFixed(1)}² + 2×${a.toFixed(1)}×${S.toFixed(1)}`, `v = ${v.toFixed(1)} m/s`] }
}

export function mruSolve(v: number, t: number) {
  const S = v * t
  return { S, steps: [`ΔS = v·t`, `ΔS = ${v.toFixed(1)}×${t.toFixed(1)}`, `ΔS = ${S.toFixed(1)} m`] }
}
