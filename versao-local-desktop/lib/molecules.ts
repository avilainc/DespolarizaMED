import data from '@/lib/periodicTableData.json'
import { CURATED } from '@/lib/periodicReactions'

export type V3 = [number, number, number]
export type MolAtom = { el: string; pos: V3 }
export type MolBond = [number, number, number] // [átomo A, átomo B, ordem da ligação]

export type Molecule = {
  formula: string
  name: string
  kind: 'covalent'
  atoms: MolAtom[]
  bonds: MolBond[]
  geometry: string
  angle: string
  polarity: 'Polar' | 'Apolar'
  dipoleD: number
  polarityNote: string
  clinical: string | null
  tip: string | null
}

export type IonicCompound = {
  formula: string
  name: string
  kind: 'ionic'
  cation: string
  anion: string
  cationCharge: number
  anionCharge: number
  clinical: string | null
  tip: string | null
}

export type Structure = Molecule | IonicCompound

const deg = Math.PI / 180
const EN: Record<string, number> = Object.fromEntries(data.map((e) => [e.symbol, e.electronegativity ?? 0]))

export const CPK: Record<string, string> = {
  H: '#ffffff', C: '#909090', N: '#3050f8', O: '#ff0d0d', F: '#90e050', Cl: '#1ff01f', S: '#ffff30', B: '#ffb5b5',
  Na: '#ab5cf2', K: '#8f40d4', Ca: '#3dff00', Mg: '#8aff00',
}

function bent(center: string, ligand: string, len: number, angle: number): MolAtom[] {
  const half = (angle / 2) * deg
  return [
    { el: center, pos: [0, 0, 0] },
    { el: ligand, pos: [len * Math.sin(half), len * Math.cos(half), 0] },
    { el: ligand, pos: [-len * Math.sin(half), len * Math.cos(half), 0] },
  ]
}

function pyramid(center: string, ligand: string, len: number, angle: number): MolAtom[] {
  const cosA = Math.cos(angle * deg)
  const sin2 = (1 - cosA) / 1.5
  const s = Math.sqrt(sin2)
  const c = Math.sqrt(1 - sin2)
  const atoms: MolAtom[] = [{ el: center, pos: [0, 0, 0] }]
  for (const phi of [0, 120, 240]) atoms.push({ el: ligand, pos: [len * s * Math.cos(phi * deg), len * s * Math.sin(phi * deg), -len * c] })
  return atoms
}

function diatomic(a: string, b: string, len: number): MolAtom[] {
  return [{ el: a, pos: [-len / 2, 0, 0] }, { el: b, pos: [len / 2, 0, 0] }]
}

function peroxide(): MolAtom[] {
  const alpha = 94.8 * deg
  const oo = 1.475
  const oh = 0.95
  const phi2 = 111.5 * deg
  const d1: V3 = [Math.sin(alpha), -Math.cos(alpha), 0]
  const d2: V3 = [Math.sin(alpha) * Math.cos(phi2), Math.cos(alpha), Math.sin(alpha) * Math.sin(phi2)]
  const o1: V3 = [0, oo / 2, 0]
  const o2: V3 = [0, -oo / 2, 0]
  return [
    { el: 'O', pos: o1 },
    { el: 'O', pos: o2 },
    { el: 'H', pos: [o1[0] + oh * d1[0], o1[1] + oh * d1[1], o1[2] + oh * d1[2]] },
    { el: 'H', pos: [o2[0] + oh * d2[0], o2[1] + oh * d2[1], o2[2] + oh * d2[2]] },
  ]
}

const clinicalOf = (formula: string) => CURATED.find((c) => c.formula === formula)?.clinical ?? null
const tipOf = (formula: string) => CURATED.find((c) => c.formula === formula)?.tip ?? null

const t = 1.087 / Math.sqrt(3)

export const MOLECULES: Molecule[] = [
  {
    formula: 'H2O', name: 'Água', kind: 'covalent', atoms: bent('O', 'H', 0.957, 104.5), bonds: [[0, 1, 1], [0, 2, 1]],
    geometry: 'Angular', angle: '104,5°', polarity: 'Polar', dipoleD: 1.85,
    polarityNote: 'Os dois vetores O→H não se anulam por causa do ângulo: o resultante aponta para o oxigênio (δ−).',
    clinical: clinicalOf('H2O'), tip: tipOf('H2O'),
  },
  {
    formula: 'CO2', name: 'Dióxido de carbono', kind: 'covalent', atoms: [{ el: 'C', pos: [0, 0, 0] }, { el: 'O', pos: [1.16, 0, 0] }, { el: 'O', pos: [-1.16, 0, 0] }], bonds: [[0, 1, 2], [0, 2, 2]],
    geometry: 'Linear', angle: '180°', polarity: 'Apolar', dipoleD: 0,
    polarityNote: 'As ligações C=O são polares, mas os vetores têm mesmo módulo e sentidos opostos: o momento dipolar resultante é zero (μ = 0).',
    clinical: clinicalOf('CO2'), tip: tipOf('CO2'),
  },
  {
    formula: 'NH3', name: 'Amônia', kind: 'covalent', atoms: pyramid('N', 'H', 1.012, 106.7), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
    geometry: 'Piramidal trigonal', angle: '107°', polarity: 'Polar', dipoleD: 1.47,
    polarityNote: 'O par de elétrons livre no nitrogênio deforma a molécula (pirâmide) e o vetor resultante aponta para o N.',
    clinical: clinicalOf('NH3'), tip: tipOf('NH3'),
  },
  {
    formula: 'CH4', name: 'Metano', kind: 'covalent',
    atoms: [{ el: 'C', pos: [0, 0, 0] }, { el: 'H', pos: [t, t, t] }, { el: 'H', pos: [t, -t, -t] }, { el: 'H', pos: [-t, t, -t] }, { el: 'H', pos: [-t, -t, t] }],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    geometry: 'Tetraédrica', angle: '109,5°', polarity: 'Apolar', dipoleD: 0,
    polarityNote: 'A simetria tetraédrica faz os quatro vetores C–H (de baixa polaridade) se anularem: μ = 0.',
    clinical: clinicalOf('CH4'), tip: tipOf('CH4'),
  },
  {
    formula: 'HCl', name: 'Ácido clorídrico', kind: 'covalent', atoms: diatomic('H', 'Cl', 1.274), bonds: [[0, 1, 1]],
    geometry: 'Linear', angle: 'Diatômica (sem ângulo)', polarity: 'Polar', dipoleD: 1.08,
    polarityNote: 'Molécula diatômica com átomos de eletronegatividades diferentes: dipolo aponta para o Cl.',
    clinical: clinicalOf('HCl'), tip: tipOf('HCl'),
  },
  {
    formula: 'HF', name: 'Ácido fluorídrico', kind: 'covalent', atoms: diatomic('H', 'F', 0.917), bonds: [[0, 1, 1]],
    geometry: 'Linear', angle: 'Diatômica (sem ângulo)', polarity: 'Polar', dipoleD: 1.82,
    polarityNote: 'O flúor é o elemento mais eletronegativo: a ligação é muito polar, com o dipolo apontando para o F.',
    clinical: clinicalOf('HF'), tip: tipOf('HF'),
  },
  {
    formula: 'H2S', name: 'Sulfeto de hidrogênio', kind: 'covalent', atoms: bent('S', 'H', 1.336, 92.1), bonds: [[0, 1, 1], [0, 2, 1]],
    geometry: 'Angular', angle: '92,1°', polarity: 'Polar', dipoleD: 0.97,
    polarityNote: 'Geometria angular: os vetores S→H não se anulam. É menos polar que a água porque S e H diferem pouco em eletronegatividade.',
    clinical: clinicalOf('H2S'), tip: tipOf('H2S'),
  },
  {
    formula: 'H2O2', name: 'Peróxido de hidrogênio', kind: 'covalent', atoms: peroxide(), bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]],
    geometry: 'Não planar ("livro aberto")', angle: 'H–O–O ≈ 95° (diedro ≈ 111°)', polarity: 'Polar', dipoleD: 2.2,
    polarityNote: 'Como os dois O–H estão em planos diferentes, os dipolos não se cancelam.',
    clinical: clinicalOf('H2O2'), tip: tipOf('H2O2'),
  },
  {
    formula: 'CO', name: 'Monóxido de carbono', kind: 'covalent', atoms: diatomic('C', 'O', 1.128), bonds: [[0, 1, 3]],
    geometry: 'Linear', angle: 'Diatômica (sem ângulo)', polarity: 'Polar', dipoleD: 0.11,
    polarityNote: 'Levemente polar (μ ≈ 0,11 D): pela diferença de eletronegatividade o dipolo apontaria para o O, mas o par de elétrons do C quase o compensa. Ligação tripla (1 σ + 2 π, uma delas dativa).',
    clinical: clinicalOf('CO'), tip: tipOf('CO'),
  },
  {
    formula: 'BF3', name: 'Trifluoreto de boro', kind: 'covalent',
    atoms: [{ el: 'B', pos: [0, 0, 0] }, { el: 'F', pos: [1.31, 0, 0] }, { el: 'F', pos: [-1.31 / 2, 1.31 * Math.sin(60 * deg), 0] }, { el: 'F', pos: [-1.31 / 2, -1.31 * Math.sin(60 * deg), 0] }],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
    geometry: 'Trigonal plana', angle: '120°', polarity: 'Apolar', dipoleD: 0,
    polarityNote: 'Ligações B–F muito polares, mas a simetria trigonal plana anula os três vetores: μ = 0. O boro tem só 6 elétrons na valência (exceção ao octeto).',
    clinical: null, tip: 'Exemplo clássico de molécula apolar formada por ligações polares e de exceção ao octeto.',
  },
  {
    formula: 'O2', name: 'Gás oxigênio', kind: 'covalent', atoms: diatomic('O', 'O', 1.208), bonds: [[0, 1, 2]],
    geometry: 'Linear', angle: 'Diatômica (sem ângulo)', polarity: 'Apolar', dipoleD: 0,
    polarityNote: 'Átomos iguais têm a mesma eletronegatividade: o compartilhamento é igual, sem dipolo.',
    clinical: 'Transportado pela hemoglobina até os tecidos, onde é o aceptor final de elétrons da respiração celular.', tip: 'Ligação dupla. O O₂ é paramagnético (2 elétrons desemparelhados).',
  },
  {
    formula: 'N2', name: 'Gás nitrogênio', kind: 'covalent', atoms: diatomic('N', 'N', 1.098), bonds: [[0, 1, 3]],
    geometry: 'Linear', angle: 'Diatômica (sem ângulo)', polarity: 'Apolar', dipoleD: 0,
    polarityNote: 'Átomos iguais: sem diferença de eletronegatividade, ligação covalente apolar.',
    clinical: 'Compõe 78% do ar; não é usado pelo corpo, mas pode se dissolver no sangue em mergulhos profundos (doença descompressiva).', tip: 'Ligação tripla muito forte: por isso o N₂ é pouco reativo.',
  },
]

const ionic = (formula: string, name: string, cation: string, anion: string, cc: number, ac: number): IonicCompound => ({
  formula, name, kind: 'ionic', cation, anion, cationCharge: cc, anionCharge: ac, clinical: clinicalOf(formula), tip: tipOf(formula),
})

export const IONICS: IonicCompound[] = [
  ionic('NaCl', 'Cloreto de sódio', 'Na', 'Cl', 1, 1),
  ionic('KCl', 'Cloreto de potássio', 'K', 'Cl', 1, 1),
  ionic('NaF', 'Fluoreto de sódio', 'Na', 'F', 1, 1),
  ionic('MgO', 'Óxido de magnésio', 'Mg', 'O', 2, 2),
  ionic('CaO', 'Óxido de cálcio', 'Ca', 'O', 2, 2),
]

export const ALL_STRUCTURES: Structure[] = [...MOLECULES, ...IONICS]
export const STRUCTURE_FORMULAS = new Set(ALL_STRUCTURES.map((s) => s.formula))


// Vetor resultante = soma dos vetores de ligação (do menos para o mais eletronegativo) ponderados pela diferença de eletronegatividade.
export function dipoleDirection(m: Molecule): V3 | null {
  let v: V3 = [0, 0, 0]
  for (const [a, b] of m.bonds) {
    const A = m.atoms[a]
    const B = m.atoms[b]
    const dEN = EN[B.el] - EN[A.el]
    if (Math.abs(dEN) < 0.01) continue
    const from = dEN > 0 ? A : B
    const to = dEN > 0 ? B : A
    const d: V3 = [to.pos[0] - from.pos[0], to.pos[1] - from.pos[1], to.pos[2] - from.pos[2]]
    const len = Math.hypot(...d) || 1
    v = [v[0] + (d[0] / len) * Math.abs(dEN), v[1] + (d[1] / len) * Math.abs(dEN), v[2] + (d[2] / len) * Math.abs(dEN)]
  }
  const n = Math.hypot(...v)
  return n < 0.05 ? null : [v[0] / n, v[1] / n, v[2] / n]
}

export function partialCharges(m: Molecule): (('+' | '−') | null)[] {
  const out: (('+' | '−') | null)[] = m.atoms.map(() => null)
  for (const [a, b] of m.bonds) {
    const dEN = EN[m.atoms[b].el] - EN[m.atoms[a].el]
    if (Math.abs(dEN) < 0.4) continue
    const pos = dEN > 0 ? a : b
    const neg = dEN > 0 ? b : a
    if (out[pos] !== '−') out[pos] = '+'
    out[neg] = '−'
  }
  return out
}

export function elementEN(symbol: string) {
  return EN[symbol]
}
