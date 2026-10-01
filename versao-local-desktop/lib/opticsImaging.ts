export type SystemType = 'concavo' | 'convexo' | 'convergente' | 'divergente'

export const SYSTEMS: { id: SystemType; label: string; isMirror: boolean }[] = [
  { id: 'concavo', label: 'Espelho côncavo', isMirror: true },
  { id: 'convexo', label: 'Espelho convexo', isMirror: true },
  { id: 'convergente', label: 'Lente convergente', isMirror: false },
  { id: 'divergente', label: 'Lente divergente', isMirror: false },
]

export type GaussResult = {
  pLinha: number | null // p', null = imagem imprópria (no infinito)
  A: number | null // ampliação linear
  real: boolean
  invertida: boolean
  tamanho: 'maior' | 'menor' | 'igual'
  impropria: boolean
  fSigned: number
}

// Convenção: f>0 convergente/côncavo, f<0 divergente/convexo. p sempre > 0 (objeto real, à esquerda).
export function gauss(system: SystemType, fAbs: number, p: number): GaussResult {
  const fSigned = system === 'concavo' || system === 'convergente' ? fAbs : -fAbs

  if (Math.abs(p - fSigned) < 1e-6) {
    return { pLinha: null, A: null, real: false, invertida: false, tamanho: 'igual', impropria: true, fSigned }
  }

  const pLinha = (fSigned * p) / (p - fSigned)
  const A = -pLinha / p
  const real = pLinha > 0
  const invertida = A < 0
  const tamanho = Math.abs(A) > 1.001 ? 'maior' : Math.abs(A) < 0.999 ? 'menor' : 'igual'
  return { pLinha, A, real, invertida, tamanho, impropria: false, fSigned }
}
