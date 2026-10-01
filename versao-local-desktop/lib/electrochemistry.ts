import data from '@/lib/periodicTableData.json'

// Potenciais padrão de redução (V, 25 °C, 1 mol/L): M^(n+) + n e⁻ → M
export const POTENTIALS: Record<string, { E: number; n: number }> = {
  Li: { E: -3.04, n: 1 },
  K: { E: -2.93, n: 1 },
  Ba: { E: -2.9, n: 2 },
  Ca: { E: -2.87, n: 2 },
  Na: { E: -2.71, n: 1 },
  Mg: { E: -2.37, n: 2 },
  Al: { E: -1.66, n: 3 },
  Mn: { E: -1.18, n: 2 },
  Zn: { E: -0.76, n: 2 },
  Cr: { E: -0.74, n: 3 },
  Fe: { E: -0.44, n: 2 },
  Cd: { E: -0.4, n: 2 },
  Co: { E: -0.28, n: 2 },
  Ni: { E: -0.25, n: 2 },
  Sn: { E: -0.14, n: 2 },
  Pb: { E: -0.13, n: 2 },
  Cu: { E: 0.34, n: 2 },
  Ag: { E: 0.8, n: 1 },
  Hg: { E: 0.85, n: 2 },
  Pt: { E: 1.2, n: 2 },
  Au: { E: 1.5, n: 3 },
}

export const POTENTIAL_SYMBOLS = Object.keys(POTENTIALS).sort((a, b) => POTENTIALS[a].E - POTENTIALS[b].E)

export const NONMETAL_SAMPLES = ['C', 'N', 'O', 'S', 'Cl']

export function elementName(symbol: string) {
  return data.find((e) => e.symbol === symbol)?.name ?? symbol
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export type CellResult =
  | { kind: 'invalid'; title: string; text: string }
  | {
      kind: 'cell'
      anode: string
      cathode: string
      nA: number
      nC: number
      eAnode: number
      eCathode: number
      deltaE: number
      electrons: number
      coefA: number
      coefC: number
    }

export function buildCell(a: string, b: string): CellResult {
  if (!a || !b) return { kind: 'invalid', title: 'Escolha dois metais', text: 'Selecione um metal para cada eletrodo para simular a pilha.' }
  if (a === b) {
    return { kind: 'invalid', title: 'Metais idênticos: ΔE° = 0', text: `Com dois eletrodos de ${elementName(a)}, os dois semi-elementos têm o mesmo potencial padrão. Sem diferença de potencial não há fluxo de elétrons: a pilha não funciona (ΔE° = 0 V).` }
  }
  const nonmetal = [a, b].find((s) => !POTENTIALS[s])
  if (nonmetal) {
    const both = !POTENTIALS[a] && !POTENTIALS[b]
    return {
      kind: 'invalid',
      title: both ? 'Dois ametais: pilha inviável' : 'Pilha inviável com ametal',
      text: both
        ? 'Ametais não formam eletrodos metálicos: em geral não conduzem eletricidade (o grafite é a exceção) e não liberam elétrons para o circuito. Uma pilha galvânica precisa de dois eletrodos metálicos de potenciais diferentes.'
        : `${elementName(nonmetal)} é um ametal e não serve como eletrodo metálico da pilha. Escolha dois metais diferentes.`,
    }
  }
  const [anode, cathode] = POTENTIALS[a].E <= POTENTIALS[b].E ? [a, b] : [b, a]
  const nA = POTENTIALS[anode].n
  const nC = POTENTIALS[cathode].n
  const g = gcd(nA, nC)
  const electrons = (nA * nC) / g
  const eAnode = POTENTIALS[anode].E
  const eCathode = POTENTIALS[cathode].E
  return {
    kind: 'cell',
    anode,
    cathode,
    nA,
    nC,
    eAnode,
    eCathode,
    deltaE: Math.round((eCathode - eAnode) * 100) / 100,
    electrons,
    coefA: electrons / nA,
    coefC: electrons / nC,
  }
}
