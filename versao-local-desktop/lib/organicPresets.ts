import type { AtomNode, Bond, Element } from '@/lib/organic'

export type Preset = {
  id: string
  title: string
  commonName: string
  iupacName: string
  category: string
  funFact: string
  atoms: AtomNode[]
  bonds: Bond[]
}

let n = 0
function A(el: Element, x: number, y: number): AtomNode {
  n++
  return { id: `${el}${n}_${Math.random().toString(36).slice(2, 6)}`, el, x, y }
}
function B(a: AtomNode, b: AtomNode, order: 1 | 2 | 3 = 1): Bond {
  return { a: a.id, b: b.id, order }
}

function build(atoms: AtomNode[], bonds: Bond[]) {
  return { atoms, bonds }
}

function ethanol(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c1 = A('C', 0, 0), c2 = A('C', 1, 0), o1 = A('O', 2, 0)
  return build([c1, c2, o1], [B(c1, c2), B(c2, o1)])
}

function aceticAcid(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c1 = A('C', 0, 0), c2 = A('C', 1, 0), o1 = A('O', 2, -0.6), o2 = A('O', 2, 0.6)
  return build([c1, c2, o1, o2], [B(c1, c2), B(c2, o1, 2), B(c2, o2)])
}

function glucose(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c1 = A('C', 0, 0), o1 = A('O', -0.7, -0.8)
  const c2 = A('C', 1, 0.6), o2 = A('O', 1, 1.6)
  const c3 = A('C', 2, 0), o3 = A('O', 2, -1)
  const c4 = A('C', 3, 0.6), o4 = A('O', 3, 1.6)
  const c5 = A('C', 4, 0), o5 = A('O', 4, -1)
  const c6 = A('C', 5, 0.6), o6 = A('O', 5, 1.6)
  return build(
    [c1, o1, c2, o2, c3, o3, c4, o4, c5, o5, c6, o6],
    [B(c1, o1, 2), B(c1, c2), B(c2, o2), B(c2, c3), B(c3, o3), B(c3, c4), B(c4, o4), B(c4, c5), B(c5, o5), B(c5, c6), B(c6, o6)]
  )
}

function aspirin(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c1 = A('C', 0, 0), c2 = A('C', 1, -0.4), c3 = A('C', 2, 0), c4 = A('C', 2, 1), c5 = A('C', 1, 1.4), c6 = A('C', 0, 1)
  const c7 = A('C', -1, -0.4), o1 = A('O', -1.8, -1), o2 = A('O', -1, -1.4)
  const o3 = A('O', 1, -1.4), c8 = A('C', 2, -2), o4 = A('O', 3, -1.6), c9 = A('C', 2, -3)
  return build(
    [c1, c2, c3, c4, c5, c6, c7, o1, o2, o3, c8, o4, c9],
    [
      B(c1, c2, 2), B(c2, c3), B(c3, c4, 2), B(c4, c5), B(c5, c6, 2), B(c6, c1),
      B(c1, c7), B(c7, o1, 2), B(c7, o2),
      B(c2, o3), B(o3, c8), B(c8, o4, 2), B(c8, c9),
    ]
  )
}

function caffeine(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c5 = A('C', 1, 0), c6 = A('C', 2, 0) // fusão
  const c7 = A('C', 2.6, 0.9), n9 = A('N', 2, 1.8), c11 = A('C', 1, 1.8), n13 = A('N', 0.4, 0.9)
  const n4 = A('N', 0.6, -0.9), c3 = A('C', 1.5, -1.5), n2 = A('N', 2.3, -0.9)
  const o8 = A('O', 3.5, 0.9), o12 = A('O', 1, 2.7)
  const c1 = A('C', 2.9, -1.6), c10 = A('C', 2.6, 2.5), c14 = A('C', -0.3, 1.3)
  return build(
    [c5, c6, c7, n9, c11, n13, n4, c3, n2, o8, o12, c1, c10, c14],
    [
      B(c5, c6, 2), B(c6, c7), B(c7, n9), B(n9, c11), B(c11, n13), B(n13, c5),
      B(c5, n4), B(n4, c3, 2), B(c3, n2), B(n2, c6),
      B(c7, o8, 2), B(c11, o12, 2),
      B(n2, c1), B(n9, c10), B(n13, c14),
    ]
  )
}

function adrenaline(): { atoms: AtomNode[]; bonds: Bond[] } {
  const c1 = A('C', 0, 0), c2 = A('C', 1, 0.3), c3 = A('C', 1.8, -0.4), c4 = A('C', 1.5, -1.4), c5 = A('C', 0.5, -1.7), c6 = A('C', -0.3, -1)
  const oh1 = A('O', -0.9, 0.6), oh2 = A('O', 1.7, 1.2)
  const ca = A('C', 2.3, -2.1), oha = A('O', 3.2, -1.8), cb = A('C', 2.1, -3.1), nn = A('N', 2.9, -3.8), cm = A('C', 2.7, -4.8)
  return build(
    [c1, c2, c3, c4, c5, c6, oh1, oh2, ca, oha, cb, nn, cm],
    [
      B(c1, c2), B(c2, c3, 2), B(c3, c4), B(c4, c5, 2), B(c5, c6), B(c6, c1, 2),
      B(c1, oh1), B(c2, oh2),
      B(c4, ca), B(ca, oha), B(ca, cb), B(cb, nn), B(nn, cm),
    ]
  )
}

export const PRESETS: Preset[] = [
  {
    id: 'etanol', title: 'Etanol', commonName: 'Álcool comum / álcool de cereais', iupacName: 'Etanol',
    category: 'Álcool', funFact: 'Presente em bebidas alcoólicas e no combustível dos carros flex. É o álcool mais simples com efeito psicoativo relevante.',
    ...ethanol(),
  },
  {
    id: 'acido-acetico', title: 'Ácido acético', commonName: 'Vinagre (diluído em água)', iupacName: 'Ácido etanoico',
    category: 'Ácido carboxílico', funFact: 'O vinagre é uma solução de ~4-8% de ácido acético em água. É o ácido carboxílico mais simples depois do ácido fórmico.',
    ...aceticAcid(),
  },
  {
    id: 'glicose', title: 'Glicose', commonName: 'Açúcar do sangue', iupacName: '2,3,4,5,6-penta-hidroxi-hexanal (forma aberta)',
    category: 'Aldeído / poliálcool', funFact: 'Principal combustível das células; em solução aquosa fica majoritariamente na forma cíclica (não mostrada aqui), mas a forma aberta explica bem sua reatividade como aldeído.',
    ...glucose(),
  },
  {
    id: 'aspirina', title: 'Ácido acetilsalicílico', commonName: 'Aspirina', iupacName: 'Ácido 2-(acetiloxi)benzoico',
    category: 'Éster + ácido carboxílico (função mista)', funFact: 'Tem uma carboxila (ácido) e um éster no mesmo anel benzênico — é o exemplo clássico de "função mista" cobrado em vestibular.',
    ...aspirin(),
  },
  {
    id: 'cafeina', title: 'Cafeína', commonName: 'Cafeína', iupacName: '1,3,7-trimetil-1H-purina-2,6(3H,7H)-diona',
    category: 'Amida (dupla) — alcaloide', funFact: 'Estrutura de purina (anel de 6 lados fundido com anel de 5 lados) — típica de questões sobre anéis fundidos e heterocíclicos.',
    ...caffeine(),
  },
  {
    id: 'adrenalina', title: 'Adrenalina', commonName: 'Epinefrina', iupacName: '4-[1-hidroxi-2-(metilamino)etil]benzeno-1,2-diol',
    category: 'Função mista: fenol + álcool + amina', funFact: 'O anel com duas hidroxilas adjacentes é chamado de catecol — por isso adrenalina, dopamina e noradrenalina são chamadas de catecolaminas.',
    ...adrenaline(),
  },
]
