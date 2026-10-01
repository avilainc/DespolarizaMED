export const G = 10 // m/s², simplificação padrão de vestibular
export const ATM_PA = 101300
export const MMHG_PER_PA = 760 / ATM_PA

export const LIQUIDS = [
  { id: 'agua', label: 'Água', d: 1000, color: '#38bdf8' },
  { id: 'oleo', label: 'Óleo', d: 900, color: '#facc15' },
  { id: 'mercurio', label: 'Mercúrio', d: 13600, color: '#94a3b8' },
  { id: 'glicerina', label: 'Glicerina', d: 1260, color: '#a78bfa' },
]

export function stevin(d: number, h: number, p0 = ATM_PA) {
  const P = p0 + d * G * h
  return { P, atm: P / ATM_PA, mmHg: P * MMHG_PER_PA }
}

export function pascal(F1: number, A1: number, A2: number) {
  const F2 = F1 * (A2 / A1)
  const pressure = F1 / A1
  return { F2, pressure }
}

// Fórmula barométrica simplificada (escala de altura ~8000 m), boa o bastante para uso didático
export function torricelli(altitude: number) {
  const mmHg = 760 * Math.exp(-altitude / 8000)
  const pa = mmHg / MMHG_PER_PA
  return { mmHg, pa, atm: pa / ATM_PA }
}

export function archimedes(dObj: number, dLiq: number, volume: number) {
  const floats = dObj < dLiq
  const fracSubmerged = floats ? Math.min(1, dObj / dLiq) : 1
  const volSubmerged = volume * fracSubmerged
  const empuxo = dLiq * volSubmerged * G
  const peso = dObj * volume * G
  const apparentWeight = Math.max(0, peso - (floats ? empuxo : empuxo))
  return { floats, fracSubmerged, volSubmerged, empuxo, peso, apparentWeight: floats ? 0 : peso - empuxo }
}
