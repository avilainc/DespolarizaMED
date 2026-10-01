export type Element = 'C' | 'O' | 'N' | 'Cl' | 'Br' | 'F' | 'I'
export type AtomNode = { id: string; el: Element; x: number; y: number }
export type Bond = { a: string; b: string; order: 1 | 2 | 3 }
export type Mol = { atoms: AtomNode[]; bonds: Bond[] }

export const VALENCE: Record<Element, number> = { C: 4, O: 2, N: 3, Cl: 1, Br: 1, F: 1, I: 1 }
export const MASS: Record<Element | 'H', number> = { C: 12.011, H: 1.008, O: 15.999, N: 14.007, Cl: 35.45, Br: 79.904, F: 18.998, I: 126.904 }
const NUM_NAME = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec']
const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa']

function byId(atoms: AtomNode[]) {
  return new Map(atoms.map((a) => [a.id, a]))
}

export function bondsOf(id: string, bonds: Bond[]) {
  return bonds.filter((b) => b.a === id || b.b === id)
}

export function neighborsOf(id: string, atoms: AtomNode[], bonds: Bond[]) {
  const map = byId(atoms)
  return bondsOf(id, bonds).map((b) => {
    const otherId = b.a === id ? b.b : b.a
    return { atom: map.get(otherId)!, order: b.order }
  })
}

export function usedValence(id: string, bonds: Bond[]) {
  return bondsOf(id, bonds).reduce((s, b) => s + b.order, 0)
}

export function hCount(id: string, atoms: AtomNode[], bonds: Bond[]) {
  const a = byId(atoms).get(id)
  if (!a) return 0
  return Math.max(0, VALENCE[a.el] - usedValence(id, bonds))
}

export function molecularFormula(mol: Mol): { formula: string; counts: Record<string, number> } {
  const counts: Record<string, number> = {}
  let hTotal = 0
  for (const a of mol.atoms) {
    counts[a.el] = (counts[a.el] || 0) + 1
    hTotal += hCount(a.id, mol.atoms, mol.bonds)
  }
  if (hTotal > 0) counts.H = hTotal
  const order: string[] = []
  if (counts.C) order.push('C')
  if (counts.H) order.push('H')
  for (const el of Object.keys(counts).sort()) if (el !== 'C' && el !== 'H') order.push(el)
  const sub = (n: number) => (n === 1 ? '' : String(n))
  return { formula: order.map((el) => `${el}${sub(counts[el])}`).join(''), counts }
}

export function molarMass(mol: Mol): number {
  const { counts } = molecularFormula(mol)
  let m = 0
  for (const [el, n] of Object.entries(counts)) m += (MASS as any)[el] * n
  return Math.round(m * 100) / 100
}

// ---------- anéis ----------
export function findRings(mol: Mol): string[][] {
  const adj = new Map<string, { id: string; order: number }[]>()
  for (const a of mol.atoms) adj.set(a.id, [])
  for (const b of mol.bonds) {
    adj.get(b.a)?.push({ id: b.b, order: b.order })
    adj.get(b.b)?.push({ id: b.a, order: b.order })
  }
  const rings: string[][] = []
  const visited = new Set<string>()
  const stack: string[] = []
  const onStack = new Set<string>()

  function dfs(u: string, parent: string | null) {
    visited.add(u)
    stack.push(u)
    onStack.add(u)
    for (const { id: v } of adj.get(u) || []) {
      if (v === parent) continue
      if (onStack.has(v)) {
        const idx = stack.indexOf(v)
        if (idx !== -1) rings.push(stack.slice(idx))
      } else if (!visited.has(v)) {
        dfs(v, u)
      }
    }
    stack.pop()
    onStack.delete(u)
  }
  for (const a of mol.atoms) if (!visited.has(a.id)) dfs(a.id, null)
  // remove anéis duplicados/subconjuntos, mantém só combinações únicas de tamanho mínimo
  const uniq: string[][] = []
  const seen = new Set<string>()
  for (const r of rings) {
    const key = [...r].sort().join(',')
    if (!seen.has(key)) {
      seen.add(key)
      uniq.push(r)
    }
  }
  return uniq
}

export function isAromaticRing(ring: string[], mol: Mol): boolean {
  if (ring.length !== 6) return false
  const map = byId(mol.atoms)
  if (!ring.every((id) => map.get(id)?.el === 'C')) return false
  let doubles = 0
  for (let i = 0; i < 6; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % 6]
    const bond = mol.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
    if (bond?.order === 2) doubles++
  }
  return doubles === 3
}

// ---------- classificação dos carbonos ----------
export type CarbonClass = 'isolado' | 'primario' | 'secundario' | 'terciario' | 'quaternario'
export function classifyCarbon(id: string, mol: Mol): CarbonClass {
  const cNeighbors = neighborsOf(id, mol.atoms, mol.bonds).filter((n) => n.atom.el === 'C').length
  return (['isolado', 'primario', 'secundario', 'terciario', 'quaternario'] as CarbonClass[])[Math.min(cNeighbors, 4)]
}

// ---------- funções orgânicas ----------
export type FuncGroup = {
  type: 'acido' | 'ester' | 'amida' | 'aldeido' | 'cetona' | 'alcool' | 'fenol' | 'amina' | 'eter' | 'haleto'
  atomId: string // carbono (ou halogênio) principal do grupo
  label: string
}

export function detectGroups(mol: Mol): FuncGroup[] {
  const groups: FuncGroup[] = []
  const usedO = new Set<string>()
  const usedCarbonyl = new Set<string>()
  const map = byId(mol.atoms)

  for (const a of mol.atoms) {
    if (a.el !== 'C') continue
    const nb = neighborsOf(a.id, mol.atoms, mol.bonds)
    const dblO = nb.find((n) => n.atom.el === 'O' && n.order === 2)
    if (!dblO) continue
    usedCarbonyl.add(a.id)
    const singleO = nb.find((n) => n.atom.el === 'O' && n.order === 1)
    const singleN = nb.find((n) => n.atom.el === 'N' && n.order === 1)
    if (singleO) {
      const oNeighbors = neighborsOf(singleO.atom.id, mol.atoms, mol.bonds)
      const hasCarbonOther = oNeighbors.some((n) => n.atom.el === 'C' && n.atom.id !== a.id)
      usedO.add(singleO.atom.id)
      if (hasCarbonOther) groups.push({ type: 'ester', atomId: a.id, label: 'Éster' })
      else groups.push({ type: 'acido', atomId: a.id, label: 'Ácido carboxílico' })
    } else if (singleN) {
      groups.push({ type: 'amida', atomId: a.id, label: 'Amida' })
    } else {
      const h = hCount(a.id, mol.atoms, mol.bonds)
      const carbonNeighbors = nb.filter((n) => n.atom.el === 'C').length
      if (carbonNeighbors >= 2) groups.push({ type: 'cetona', atomId: a.id, label: 'Cetona' })
      else groups.push({ type: 'aldeido', atomId: a.id, label: 'Aldeído' })
    }
  }

  for (const a of mol.atoms) {
    if (a.el !== 'O' || usedO.has(a.id)) continue
    const nb = neighborsOf(a.id, mol.atoms, mol.bonds)
    if (nb.length === 1 && nb[0].atom.el === 'C' && hCount(a.id, mol.atoms, mol.bonds) === 1) {
      const ring = findRings(mol).find((r) => isAromaticRing(r, mol) && r.includes(nb[0].atom.id))
      groups.push({ type: ring ? 'fenol' : 'alcool', atomId: nb[0].atom.id, label: ring ? 'Fenol' : 'Álcool' })
    } else if (nb.length === 2 && nb.every((n) => n.atom.el === 'C')) {
      groups.push({ type: 'eter', atomId: a.id, label: 'Éter' })
    }
  }

  for (const a of mol.atoms) {
    if (a.el !== 'N') continue
    const nb = neighborsOf(a.id, mol.atoms, mol.bonds)
    const bondedToCarbonyl = nb.some((n) => usedCarbonyl.has(n.atom.id))
    if (!bondedToCarbonyl) groups.push({ type: 'amina', atomId: a.id, label: 'Amina' })
  }

  for (const a of mol.atoms) {
    if (a.el === 'Cl' || a.el === 'Br' || a.el === 'F' || a.el === 'I') {
      groups.push({ type: 'haleto', atomId: a.id, label: `Haleto (${a.el})` })
    }
  }
  return groups
}

const PRIORITY: FuncGroup['type'][] = ['acido', 'ester', 'amida', 'aldeido', 'cetona', 'alcool', 'fenol', 'amina']

export function principalGroup(groups: FuncGroup[]): FuncGroup | null {
  for (const t of PRIORITY) {
    const g = groups.find((x) => x.type === t)
    if (g) return g
  }
  return null
}

// ---------- classificação da cadeia ----------
export type ChainInfo = {
  cyclic: boolean
  aromatic: boolean
  normal: boolean
  saturated: boolean
  homogeneous: boolean
  heteroatomNote: string | null
}

export function chainInfo(mol: Mol): ChainInfo {
  const carbons = mol.atoms.filter((a) => a.el === 'C')
  const rings = findRings(mol)
  const cyclic = rings.length > 0
  const aromatic = rings.some((r) => isAromaticRing(r, mol))
  const saturated = !mol.bonds.some((b) => b.order > 1 && byId(mol.atoms).get(b.a)?.el === 'C' && byId(mol.atoms).get(b.b)?.el === 'C')
  const normal = carbons.every((c) => neighborsOf(c.id, mol.atoms, mol.bonds).filter((n) => n.atom.el === 'C').length <= 2)
  // heteroátomo ENTRE dois carbonos da cadeia (heterogênea)
  let heteroatomNote: string | null = null
  for (const a of mol.atoms) {
    if (a.el === 'O' || a.el === 'N') {
      const nb = neighborsOf(a.id, mol.atoms, mol.bonds)
      if (nb.length === 2 && nb.every((n) => n.atom.el === 'C')) {
        heteroatomNote = `${a.el === 'O' ? 'oxigênio' : 'nitrogênio'} entre dois carbonos da cadeia`
        break
      }
    }
  }
  return { cyclic, aromatic, normal, saturated, homogeneous: !heteroatomNote, heteroatomNote }
}

// ---------- cadeia principal (grafo acíclico de carbonos) ----------
function carbonGraph(mol: Mol) {
  const carbonIds = new Set(mol.atoms.filter((a) => a.el === 'C').map((a) => a.id))
  const adj = new Map<string, { id: string; order: number }[]>()
  for (const id of carbonIds) adj.set(id, [])
  for (const b of mol.bonds) {
    if (carbonIds.has(b.a) && carbonIds.has(b.b)) {
      adj.get(b.a)!.push({ id: b.b, order: b.order })
      adj.get(b.b)!.push({ id: b.a, order: b.order })
    }
  }
  return adj
}

function bfsFarthest(start: string, adj: Map<string, { id: string; order: number }[]>): { end: string; path: string[] } {
  const prev = new Map<string, string | null>()
  const dist = new Map<string, number>([[start, 0]])
  const queue = [start]
  let far = start
  while (queue.length) {
    const u = queue.shift()!
    for (const { id: v } of adj.get(u) || []) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u)! + 1)
        prev.set(v, u)
        queue.push(v)
        if (dist.get(v)! > dist.get(far)!) far = v
      }
    }
  }
  const path: string[] = []
  let cur: string | null = far
  while (cur) {
    path.unshift(cur)
    cur = prev.get(cur) ?? null
  }
  return { end: far, path }
}

export function mainChain(mol: Mol, throughId: string | null): string[] | null {
  const adj = carbonGraph(mol)
  const carbons = [...adj.keys()]
  if (carbons.length === 0) return null
  if (findRings(mol).some((r) => r.some((id) => byId(mol.atoms).get(id)?.el === 'C'))) return null // cadeia cíclica: fora do algoritmo genérico

  if (throughId && adj.has(throughId)) {
    const left = bfsFarthest(throughId, adj)
    // maior ramo a partir do carbono principal, na direção oposta ao primeiro braço encontrado
    const right = bfsFarthest(left.end, adj)
    if (right.path.includes(throughId)) return right.path
    // garante que o carbono principal fica no caminho: junta os dois braços mais longos a partir dele
    const branches: string[][] = []
    for (const { id } of adj.get(throughId) || []) {
      const sub = bfsFarthestExcluding(id, adj, throughId)
      branches.push(sub)
    }
    branches.sort((a, b) => b.length - a.length)
    const b1 = branches[0] ?? []
    const b2 = branches[1] ?? []
    return [...b1].reverse().concat([throughId], b2)
  }
  const a = bfsFarthest(carbons[0], adj)
  const b = bfsFarthest(a.end, adj)
  return b.path
}

function bfsFarthestExcluding(start: string, adj: Map<string, { id: string; order: number }[]>, exclude: string): string[] {
  const prev = new Map<string, string | null>([[start, null]])
  const dist = new Map<string, number>([[start, 0]])
  const queue = [start]
  let far = start
  while (queue.length) {
    const u = queue.shift()!
    for (const { id: v } of adj.get(u) || []) {
      if (v === exclude || dist.has(v)) continue
      dist.set(v, dist.get(u)! + 1)
      prev.set(v, u)
      queue.push(v)
      if (dist.get(v)! > dist.get(far)!) far = v
    }
  }
  const path: string[] = []
  let cur: string | null = far
  while (cur) {
    path.unshift(cur)
    cur = prev.get(cur) ?? null
  }
  return path
}

// ---------- nomenclatura ----------
export type NameResult = { name: string; ok: boolean; note: string | null }

const HALO_PREFIX: Record<string, string> = { Cl: 'cloro', Br: 'bromo', F: 'flúor', I: 'iodo' }

function bondOrder(mol: Mol, a: string, b: string) {
  return mol.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))?.order ?? 0
}

function branchName(startId: string, cameFrom: string, mol: Mol): string {
  const adj = carbonGraph(mol)
  let path = [startId]
  let cur = startId
  let prev = cameFrom
  // caso isopropil: carbono central com dois braços de 1 carbono
  const firstNeighbors = (adj.get(startId) || []).filter((n) => n.id !== cameFrom)
  if (firstNeighbors.length === 2 && firstNeighbors.every((n) => (adj.get(n.id) || []).filter((x) => x.id !== startId).length === 0)) {
    return 'isopropil'
  }
  while (true) {
    const next = (adj.get(cur) || []).filter((n) => n.id !== prev)
    if (next.length !== 1) break
    prev = cur
    cur = next[0].id
    path.push(cur)
  }
  const n = path.length
  if (n >= 1 && n <= 10) return `${NUM_NAME[n]}il`
  return 'ramificação complexa'
}

export function nameMolecule(mol: Mol): NameResult {
  if (mol.atoms.length === 0) return { name: '', ok: false, note: null }
  const rings = findRings(mol)
  if (rings.length > 0) {
    const info = chainInfo(mol)
    if (rings.length === 1 && info.aromatic) {
      const ring = rings[0]
      const attach = mol.atoms.filter((a) => !ring.includes(a.id) && neighborsOf(a.id, mol.atoms, mol.bonds).some((n) => ring.includes(n.atom.id)))
      const substituentAtoms = ring.filter((id) => neighborsOf(id, mol.atoms, mol.bonds).some((n) => !ring.includes(n.atom.id)))
      if (substituentAtoms.length === 0) return { name: 'Benzeno', ok: true, note: null }
      if (substituentAtoms.length === 1) {
        const subC = substituentAtoms[0]
        const groups = detectGroups(mol)
        const g = groups.find((x) => x.atomId === subC || neighborsOf(subC, mol.atoms, mol.bonds).some((n) => n.atom.id === x.atomId))
        if (g?.type === 'alcool' || g?.type === 'fenol') return { name: 'Fenol', ok: true, note: null }
        if (g?.type === 'acido') return { name: 'Ácido benzoico', ok: true, note: null }
        if (g?.type === 'amina') return { name: 'Anilina', ok: true, note: null }
        const outside = neighborsOf(subC, mol.atoms, mol.bonds).find((n) => !ring.includes(n.atom.id))
        if (outside?.atom.el === 'C' && (neighborsOf(outside.atom.id, mol.atoms, mol.bonds) || []).length === 1) return { name: 'Metilbenzeno (tolueno)', ok: true, note: null }
        if (outside && HALO_PREFIX[outside.atom.el]) return { name: `${HALO_PREFIX[outside.atom.el].replace('flúor', 'fluor')}benzeno`, ok: true, note: null }
      }
      return { name: 'Derivado do benzeno', ok: false, note: 'Anel com mais de um substituinte: nomenclatura de aromáticos substituídos não é calculada automaticamente aqui — consulte seu professor ou livro-texto.' }
    }
    return { name: 'Estrutura cíclica', ok: false, note: 'Anéis não-aromáticos ou fundidos não têm o nome calculado automaticamente neste simulador — consulte seu professor ou livro-texto.' }
  }

  const groups = detectGroups(mol)
  const principal = principalGroup(groups)
  const chain = mainChain(mol, principal?.atomId ?? null)
  if (!chain || chain.length === 0) return { name: '—', ok: false, note: 'Monte uma cadeia de carbono para gerar o nome.' }
  if (chain.length > 10) return { name: 'Cadeia muito longa', ok: false, note: 'Este simulador nomeia cadeias de até 10 carbonos.' }

  // ramificações e insaturações candidatas, calculadas nas duas direções
  function evaluate(order: string[]) {
    const idx = new Map(order.map((id, i) => [id, i + 1]))
    const unsat: number[] = []
    for (let i = 0; i < order.length - 1; i++) {
      const o = bondOrder(mol, order[i], order[i + 1])
      if (o > 1) unsat.push(i + 1)
    }
    const subs: { locant: number; name: string }[] = []
    for (let i = 0; i < order.length; i++) {
      const id = order[i]
      for (const nb of neighborsOf(id, mol.atoms, mol.bonds)) {
        if (order.includes(nb.atom.id)) continue
        if (nb.atom.el === 'C') subs.push({ locant: i + 1, name: branchName(nb.atom.id, id, mol) })
        else if (HALO_PREFIX[nb.atom.el]) subs.push({ locant: i + 1, name: HALO_PREFIX[nb.atom.el] })
      }
    }
    const principalLocant = principal ? idx.get(principal.atomId) ?? 999 : 999
    return { unsat, subs, principalLocant }
  }
  const fwd = evaluate(chain)
  const rev = evaluate([...chain].reverse())
  const key = (e: ReturnType<typeof evaluate>) => [e.principalLocant, ...e.unsat, ...e.subs.map((s) => s.locant).sort((a, b) => a - b)]
  const kf = key(fwd), kr = key(rev)
  let chosen = fwd
  let orderIds = chain
  for (let i = 0; i < Math.max(kf.length, kr.length); i++) {
    const a = kf[i] ?? 999, b = kr[i] ?? 999
    if (a !== b) { chosen = a < b ? fwd : rev; orderIds = a < b ? chain : [...chain].reverse(); break }
  }

  const n = orderIds.length
  const base = NUM_NAME[n] || `C${n}`

  // infixo de insaturação (an/en/in), com o(s) locante(s) ANTES dele: "but-2-en..."
  let infixEnding = 'an'
  let unsatPrefix = ''
  if (chosen.unsat.length === 1) {
    const isTriple = bondOrder(mol, orderIds[chosen.unsat[0] - 1], orderIds[chosen.unsat[0]]) === 3
    infixEnding = isTriple ? 'in' : 'en'
    unsatPrefix = n > 3 ? `-${chosen.unsat[0]}-` : '-'
  } else if (chosen.unsat.length > 1) {
    infixEnding = (MULT[chosen.unsat.length] || '') + 'en'
    unsatPrefix = `-${chosen.unsat.join(',')}-`
  }
  const stem = `${base}${unsatPrefix}${infixEnding}` // ex.: "propan", "but-2-en"

  // agrupa substituintes repetidos
  const bySub = new Map<string, number[]>()
  for (const s of chosen.subs) bySub.set(s.name, [...(bySub.get(s.name) || []), s.locant])
  const subParts = [...bySub.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(([name, locs]) => {
    const sorted = locs.sort((a, b) => a - b)
    const mult = sorted.length > 1 ? MULT[sorted.length] || '' : ''
    return `${sorted.join(',')}-${mult}${name}`
  })
  const subPrefix = subParts.join('-')

  // locante do grupo principal (quando faz sentido mostrar), depois do infixo: "propan-2-ol"
  const groupLoc = (minN: number) => (n > minN ? `-${chosen.principalLocant}-` : '')

  let name = ''
  const g = principal?.type
  if (!g) {
    name = `${subPrefix}${stem}o`
  } else if (g === 'acido') {
    name = `ácido ${subPrefix}${stem}oico`
  } else if (g === 'amida') {
    name = `${subPrefix}${stem}amida`
  } else if (g === 'aldeido') {
    name = `${subPrefix}${stem}al`
  } else if (g === 'cetona') {
    name = `${subPrefix}${stem}${groupLoc(3)}ona`
  } else if (g === 'alcool' || g === 'fenol') {
    name = `${subPrefix}${stem}${groupLoc(2)}ol`
  } else if (g === 'amina') {
    name = `${subPrefix}${stem}${groupLoc(2)}amina`
  } else if (g === 'ester') {
    // parte ácido: cadeia até o carbonílico (já é orderIds/n); parte álcool: radical do outro lado do O
    const carbonylId = principal!.atomId
    const oId = neighborsOf(carbonylId, mol.atoms, mol.bonds).find((x) => x.atom.el === 'O' && x.order === 1)?.atom.id
    const otherC = oId ? neighborsOf(oId, mol.atoms, mol.bonds).find((x) => x.atom.el === 'C' && x.atom.id !== carbonylId)?.atom.id : null
    const alkylName = otherC ? branchName(otherC, oId!, mol).replace(/il$/, 'ila') : 'ila'
    name = `${subPrefix}${stem}oato de ${alkylName}`
  }
  name = name.replace(/-{2,}/g, '-').replace(/^-/, '')
  return { name: name.charAt(0).toUpperCase() + name.slice(1), ok: true, note: null }
}
