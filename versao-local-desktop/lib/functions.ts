export type FnType = 'afim' | 'quadratica'

export function evalFn(type: FnType, a: number, b: number, c: number, x: number) {
  return type === 'afim' ? a * x + b : a * x * x + b * x + c
}

export function linearRoot(a: number, b: number) {
  return a !== 0 ? -b / a : null
}

export function quadraticInfo(a: number, b: number, c: number) {
  const delta = b * b - 4 * a * c
  const xv = a !== 0 ? -b / (2 * a) : 0
  const yv = a !== 0 ? -delta / (4 * a) : c
  let roots: [number, number] | [number] | null = null
  if (a !== 0) {
    if (delta > 0) roots = [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)]
    else if (delta === 0) roots = [-b / (2 * a)]
  }
  return { delta, xv, yv, roots }
}

export type OptimizationExample = {
  id: string
  label: string
  type: FnType
  a: number
  b: number
  c: number
  xLabel: string
  yLabel: string
  story: string
}

export const OPTIMIZATION_EXAMPLES: OptimizationExample[] = [
  {
    id: 'lucro',
    label: 'Lucro máximo',
    type: 'quadratica',
    a: -2, b: 80, c: -200,
    xLabel: 'quantidade vendida (x)',
    yLabel: 'lucro em R$ (Y)',
    story: 'Uma loja estimou o lucro L(x) = −2x² + 80x − 200, em que x é a quantidade de produtos vendidos. Como a &lt; 0, a parábola tem concavidade para baixo: o vértice é o ponto de lucro MÁXIMO. Xv dá a quantidade que deve ser vendida; Yv dá o valor do lucro máximo.',
  },
  {
    id: 'projetil',
    label: 'Altura de projétil',
    type: 'quadratica',
    a: -5, b: 40, c: 2,
    xLabel: 'tempo em segundos (x)',
    yLabel: 'altura em metros (Y)',
    story: 'A altura de um projétil é h(t) = −5t² + 40t + 2. Como a &lt; 0, o vértice é o ponto de altura MÁXIMA. Xv dá o instante (tempo) em que a altura máxima ocorre; Yv dá a altura máxima atingida.',
  },
  {
    id: 'custo',
    label: 'Custo mínimo',
    type: 'quadratica',
    a: 3, b: -60, c: 500,
    xLabel: 'unidades produzidas (x)',
    yLabel: 'custo em R$ (Y)',
    story: 'O custo de produção é C(x) = 3x² − 60x + 500. Como a &gt; 0, a concavidade é para cima: o vértice é o ponto de custo MÍNIMO. Xv dá a quantidade que minimiza o custo; Yv dá esse custo mínimo.',
  },
]
