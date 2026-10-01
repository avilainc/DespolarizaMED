'use client'
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MousePointer2, Link2, Eraser, Trash2, Lightbulb, Info,
} from 'lucide-react'
import {
  type Mol, type AtomNode, type Element, type Bond,
  hCount, usedValence, neighborsOf, molecularFormula, molarMass,
  classifyCarbon, detectGroups, principalGroup, chainInfo, nameMolecule,
} from '@/lib/organic'
import { PRESETS } from '@/lib/organicPresets'

const CELL = 46
const COLS = 15
const ROWS = 8

const CLASS_COLOR: Record<string, string> = {
  isolado: '#94a3b8',
  primario: '#38bdf8',
  secundario: '#4ade80',
  terciario: '#facc15',
  quaternario: '#f87171',
}
const CLASS_LABEL: Record<string, string> = {
  isolado: 'Isolado',
  primario: 'Primário',
  secundario: 'Secundário',
  terciario: 'Terciário',
  quaternario: 'Quaternário',
}
const EL_COLOR: Record<Element, string> = { C: '#e2e8f0', O: '#f87171', N: '#60a5fa', Cl: '#4ade80', Br: '#c2410c', F: '#a78bfa', I: '#c026d3' }

let uid = 0
function newId(el: string) {
  uid++
  return `${el}_${uid}_${Date.now().toString(36)}`
}

function dist(a: AtomNode, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function nearestAtom(atoms: AtomNode[], pos: { x: number; y: number }, exceptId?: string) {
  let best: AtomNode | null = null
  let bestD = Infinity
  for (const a of atoms) {
    if (a.id === exceptId) continue
    const d = dist(a, pos)
    if (d < bestD) { bestD = d; best = a }
  }
  return best ? { atom: best, dist: bestD } : null
}

function freeSpot(atoms: AtomNode[], near: { x: number; y: number }, tried: Set<string> = new Set()): { x: number; y: number } {
  const dirs = [[1, 0], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [-1, -1], [-1, 1]]
  for (let r = 1; r <= 4; r++) {
    for (const [dx, dy] of dirs) {
      const x = near.x + dx * r
      const y = near.y + dy * r
      const key = `${x},${y}`
      if (tried.has(key)) continue
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue
      if (!atoms.some((a) => dist(a, { x, y }) < 0.6)) return { x, y }
    }
  }
  return { x: near.x + 1, y: near.y }
}

function hexAround(center: { x: number; y: number }): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 3) * i - Math.PI / 2
    pts.push({ x: center.x + Math.cos(ang) * 1.05, y: center.y + Math.sin(ang) * 1.05 })
  }
  return pts
}

export default function OrganoLabPage() {
  const [atoms, setAtoms] = useState<AtomNode[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [tool, setTool] = useState<'atom' | 'bond' | 'erase'>('atom')
  const [activeEl, setActiveEl] = useState<Element>('C')
  const [selected, setSelected] = useState<string | null>(null)
  const [showH, setShowH] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [presetInfo, setPresetInfo] = useState<(typeof PRESETS)[number] | null>(null)

  const mol: Mol = useMemo(() => ({ atoms, bonds }), [atoms, bonds])
  const byId = useMemo(() => new Map(atoms.map((a) => [a.id, a])), [atoms])

  const flash = (msg: string) => {
    setError(msg)
    setTimeout(() => setError((e) => (e === msg ? null : e)), 2800)
  }

  // Coloca um átomo novo e, se houver outro perto o bastante (célula adjacente,
  // inclusive diagonal), já liga os dois automaticamente — sem precisar trocar
  // pra ferramenta "Ligação" pra montar uma cadeia simples.
  const addAtom = (el: Element, x: number, y: number) => {
    const a: AtomNode = { id: newId(el), el, x, y }
    const near = nearestAtom(atoms, { x, y })
    setAtoms((s) => [...s, a])
    if (near && near.dist <= 1.6) {
      const capNew = fromEl(el)
      const capNear = fromEl(near.atom.el)
      if (1 <= capNew && usedValence(near.atom.id, bonds) + 1 <= capNear) {
        setBonds((s) => [...s, { a: a.id, b: near.atom.id, order: 1 }])
      }
    }
    setSelected(a.id)
    setPresetInfo(null)
    return a
  }

  const addBonded = (fromId: string, el: Element, opts?: { order?: 1 | 2 | 3; at?: { x: number; y: number } }) => {
    const from = byId.get(fromId)
    if (!from) return null
    const order = opts?.order ?? 1
    const cap = order === 2 ? 4 : order === 3 ? 4 : 4
    if (usedValence(fromId, bonds) + order > (el === 'C' ? 4 : 4) || usedValence(fromId, bonds) + order > 999) { /* checked below properly */ }
    const fromValMax = fromEl(from.el)
    if (usedValence(fromId, bonds) + order > fromValMax) {
      flash('Esse átomo já não tem valência livre suficiente.')
      return null
    }
    const spot = opts?.at ?? freeSpot(atoms, from)
    const a: AtomNode = { id: newId(el), el, x: spot.x, y: spot.y }
    setAtoms((s) => [...s, a])
    setBonds((s) => [...s, { a: fromId, b: a.id, order }])
    setPresetInfo(null)
    setSelected(a.id)
    return a
  }

  function fromEl(el: Element) {
    return { C: 4, O: 2, N: 3, Cl: 1, Br: 1, F: 1, I: 1 }[el]
  }

  const clickCell = (x: number, y: number) => {
    if (tool !== 'atom') return
    const hit = atoms.find((a) => dist(a, { x, y }) < 0.55)
    if (hit) { setSelected(hit.id); return }
    addAtom(activeEl, x, y)
  }

  const clickAtom = (id: string) => {
    if (tool === 'atom') { setSelected(id); return }
    if (tool === 'erase') {
      setAtoms((s) => s.filter((a) => a.id !== id))
      setBonds((s) => s.filter((b) => b.a !== id && b.b !== id))
      if (selected === id) setSelected(null)
      setPresetInfo(null)
      return
    }
    // tool === 'bond'
    if (!selected) { setSelected(id); return }
    if (selected === id) { setSelected(null); return }
    const existing = bonds.find((b) => (b.a === selected && b.b === id) || (b.a === id && b.b === selected))
    const a1 = byId.get(selected)!, a2 = byId.get(id)!
    if (!existing) {
      if (usedValence(selected, bonds) + 1 > fromEl(a1.el) || usedValence(id, bonds) + 1 > fromEl(a2.el)) {
        flash('Ligação inválida: um dos átomos já não tem valência livre.')
        setSelected(id)
        return
      }
      setBonds((s) => [...s, { a: selected, b: id, order: 1 }])
    } else if (existing.order < 3) {
      const usedA = usedValence(selected, bonds) - existing.order
      const usedB = usedValence(id, bonds) - existing.order
      if (usedA + existing.order + 1 > fromEl(a1.el) || usedB + existing.order + 1 > fromEl(a2.el)) {
        flash('Não dá pra aumentar a ordem dessa ligação: valência insuficiente.')
      } else {
        setBonds((s) => s.map((b) => (b === existing ? { ...b, order: (b.order + 1) as 1 | 2 | 3 } : b)))
      }
    } else {
      setBonds((s) => s.filter((b) => b !== existing))
    }
    setPresetInfo(null)
    setSelected(id)
  }

  const addRadical = (kind: 'metil' | 'etil' | 'propil' | 'isopropil' | 'fenil' | 'benzil') => {
    if (!selected) return flash('Selecione um átomo (o ponto de fixação) primeiro.')
    const from = byId.get(selected)
    if (!from) return
    if (kind === 'metil') addBonded(selected, 'C')
    else if (kind === 'etil') {
      const c1 = addBonded(selected, 'C')
      if (c1) addBonded(c1.id, 'C')
    } else if (kind === 'propil') {
      const c1 = addBonded(selected, 'C')
      const c2 = c1 && addBonded(c1.id, 'C')
      if (c2) addBonded(c2.id, 'C')
    } else if (kind === 'isopropil') {
      const c1 = addBonded(selected, 'C')
      if (c1) {
        addBonded(c1.id, 'C', { at: freeSpot(atoms, c1) })
        addBonded(c1.id, 'C', { at: freeSpot(atoms, c1, new Set()) })
      }
    } else if (kind === 'fenil') {
      if (usedValence(selected, bonds) + 1 > fromEl(from.el)) return flash('Esse átomo já não tem valência livre.')
      const center = { x: from.x + 1.8, y: from.y }
      const pts = hexAround(center)
      const ring = pts.map((p, i) => ({ id: newId('C'), el: 'C' as Element, x: p.x, y: p.y }))
      const ringBonds: Bond[] = []
      for (let i = 0; i < 6; i++) ringBonds.push({ a: ring[i].id, b: ring[(i + 1) % 6].id, order: (i % 2 === 0 ? 2 : 1) as 1 | 2 })
      ringBonds.push({ a: selected, b: ring[0].id, order: 1 })
      setAtoms((s) => [...s, ...ring])
      setBonds((s) => [...s, ...ringBonds])
      setSelected(ring[0].id)
      setPresetInfo(null)
    } else if (kind === 'benzil') {
      const ch2 = addBonded(selected, 'C')
      if (ch2) {
        const center = { x: ch2.x + 1.8, y: ch2.y }
        const pts = hexAround(center)
        const ring = pts.map((p) => ({ id: newId('C'), el: 'C' as Element, x: p.x, y: p.y }))
        const ringBonds: Bond[] = []
        for (let i = 0; i < 6; i++) ringBonds.push({ a: ring[i].id, b: ring[(i + 1) % 6].id, order: (i % 2 === 0 ? 2 : 1) as 1 | 2 })
        ringBonds.push({ a: ch2.id, b: ring[0].id, order: 1 })
        setAtoms((s) => [...s, ...ring])
        setBonds((s) => [...s, ...ringBonds])
      }
    }
  }

  const addGroup = (kind: 'oh' | 'carbonila' | 'carboxila' | 'eter' | 'amina' | 'amida' | 'Cl' | 'Br' | 'F' | 'I') => {
    if (!selected) return flash('Selecione o átomo onde o grupo vai entrar.')
    if (kind === 'oh') addBonded(selected, 'O')
    else if (kind === 'carbonila') addBonded(selected, 'O', { order: 2 })
    else if (kind === 'carboxila') {
      const from = byId.get(selected)!
      if (usedValence(selected, bonds) + 3 > fromEl(from.el)) return flash('Esse carbono não tem 3 valências livres para formar a carboxila.')
      addBonded(selected, 'O', { order: 2, at: freeSpot(atoms, from) })
      addBonded(selected, 'O', { order: 1, at: freeSpot(atoms, from, new Set()) })
    } else if (kind === 'eter') addBonded(selected, 'O')
    else if (kind === 'amina' || kind === 'amida') addBonded(selected, 'N')
    else addBonded(selected, kind)
  }

  const loadPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    const xs = p.atoms.map((a) => a.x), ys = p.atoms.map((a) => a.y)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const dx = COLS / 2 - cx
    const dy = ROWS / 2 - cy
    setAtoms(p.atoms.map((a) => ({ ...a, x: a.x + dx, y: a.y + dy })))
    setBonds(p.bonds)
    setSelected(null)
    setPresetInfo(p)
  }

  const clearAll = () => { setAtoms([]); setBonds([]); setSelected(null); setPresetInfo(null) }

  // ---- arrastar átomo já existente pra reposicionar (não mexe nas ligações) ----
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<{ id: string; startClientX: number; startClientY: number; curX: number; curY: number; moved: boolean } | null>(null)

  const clientToGrid = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    return { x: ((clientX - rect.left) / rect.width) * vb.width / CELL - 0.5, y: ((clientY - rect.top) / rect.height) * vb.height / CELL - 0.5 }
  }

  const onAtomPointerDown = (e: ReactPointerEvent, id: string) => {
    if (tool === 'erase') { clickAtom(id); return }
    e.stopPropagation()
    try { (e.currentTarget as unknown as Element & { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId) } catch {}
    const atom = byId.get(id)
    if (!atom) return
    setDrag({ id, startClientX: e.clientX, startClientY: e.clientY, curX: atom.x, curY: atom.y, moved: false })
  }
  const onAtomPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const g = clientToGrid(e.clientX, e.clientY)
    const movedNow = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY) > 5
    setDrag((d) => (d ? { ...d, curX: g.x, curY: g.y, moved: d.moved || movedNow } : d))
  }
  const onAtomPointerUp = (e: ReactPointerEvent, id: string) => {
    if (!drag) return
    if (tool !== 'atom' || !drag.moved) {
      setDrag(null)
      clickAtom(id)
      return
    }
    const gx = Math.max(0, Math.min(COLS - 1, Math.round(drag.curX)))
    const gy = Math.max(0, Math.min(ROWS - 1, Math.round(drag.curY)))
    const occupied = atoms.some((a) => a.id !== id && dist(a, { x: gx, y: gy }) < 0.4)
    if (!occupied) setAtoms((s) => s.map((a) => (a.id === id ? { ...a, x: gx, y: gy } : a)))
    setDrag(null)
  }

  // ---- arrastar um elemento da paleta direto pro quadro (sem precisar
  // clicar no botão e depois clicar na célula em dois passos) ----
  const [paletteDrag, setPaletteDrag] = useState<{ el: Element; startClientX: number; startClientY: number; curX: number; curY: number; moved: boolean } | null>(null)

  const onPalettePointerDown = (e: ReactPointerEvent<HTMLButtonElement>, el: Element) => {
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    setPaletteDrag({ el, startClientX: e.clientX, startClientY: e.clientY, curX: e.clientX, curY: e.clientY, moved: false })
  }
  const onPalettePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!paletteDrag) return
    const movedNow = Math.hypot(e.clientX - paletteDrag.startClientX, e.clientY - paletteDrag.startClientY) > 5
    setPaletteDrag((d) => (d ? { ...d, curX: e.clientX, curY: e.clientY, moved: d.moved || movedNow } : d))
  }
  const onPalettePointerUp = (e: ReactPointerEvent<HTMLButtonElement>, el: Element) => {
    if (!paletteDrag) return
    if (!paletteDrag.moved) {
      setActiveEl(el)
      setTool('atom')
      setPaletteDrag(null)
      return
    }
    const g = clientToGrid(e.clientX, e.clientY)
    const gx = Math.round(g.x), gy = Math.round(g.y)
    if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && !atoms.some((a) => dist(a, { x: gx, y: gy }) < 0.55)) {
      setTool('atom')
      addAtom(el, gx, gy)
    }
    setPaletteDrag(null)
  }

  const groups = detectGroups(mol)
  const principal = principalGroup(groups)
  const info = atoms.length ? chainInfo(mol) : null
  const { formula } = molecularFormula(mol)
  const mass = molarMass(mol)
  const nameResult = atoms.length ? nameMolecule(mol) : null
  const distinctGroupTypes = new Set(groups.map((g) => g.type))
  const isMixed = distinctGroupTypes.size > 1

  const btn = (active: boolean) => `text-xs px-2.5 py-1.5 rounded-lg border transition ${active ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1600px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">OrganoLab</h1>
      <p className="text-muted text-sm mb-5">Monte moléculas orgânicas e veja fórmula, massa, função e nome IUPAC em tempo real.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.9fr)_minmax(0,0.75fr)] gap-5 items-start">
        {/* Paleta */}
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Ferramenta</p>
            <div className="flex gap-2">
              <button onClick={() => setTool('atom')} className={btn(tool === 'atom')}><MousePointer2 size={13} className="inline mr-1" />Átomo</button>
              <button onClick={() => setTool('bond')} className={btn(tool === 'bond')}><Link2 size={13} className="inline mr-1" />Ligação</button>
              <button onClick={() => setTool('erase')} className={btn(tool === 'erase')}><Eraser size={13} className="inline mr-1" />Apagar</button>
            </div>
            {tool === 'atom' && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(['C', 'O', 'N', 'Cl', 'Br', 'F', 'I'] as Element[]).map((el) => (
                  <button
                    key={el}
                    onPointerDown={(e) => onPalettePointerDown(e, el)}
                    onPointerMove={onPalettePointerMove}
                    onPointerUp={(e) => onPalettePointerUp(e, el)}
                    className={`w-9 h-9 rounded-lg border text-sm font-bold transition cursor-grab active:cursor-grabbing ${activeEl === el ? 'border-primary bg-primary/15' : 'border-edge hover:border-primary/40'}`}
                    style={{ color: el === 'C' ? 'rgb(var(--color-fg))' : EL_COLOR[el], touchAction: 'none' }}
                  >
                    {el}
                  </button>
                ))}
              </div>
            )}
            <p className="text-faint text-[11px] mt-2 leading-relaxed">
              {tool === 'atom' && 'Arraste um elemento da paleta direto pro quadro para colocá-lo (liga automaticamente no átomo mais próximo), ou clique nele e depois numa célula vazia. Clique num átomo para selecioná-lo, ou arraste para reposicioná-lo na grade.'}
              {tool === 'bond' && 'Clique em dois átomos para ligá-los. Clique de novo no mesmo par para alternar simples → dupla → tripla → remover.'}
              {tool === 'erase' && 'Clique num átomo para apagá-lo (remove as ligações dele também).'}
            </p>
          </div>

          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Radicais (arraste a ideia: selecione um átomo e clique)</p>
            <div className="flex flex-wrap gap-1.5">
              {[['metil', 'Metil'], ['etil', 'Etil'], ['propil', 'Propil'], ['isopropil', 'Isopropil'], ['fenil', 'Fenil'], ['benzil', 'Benzil']].map(([k, l]) => (
                <button key={k} onClick={() => addRadical(k as any)} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">{l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Grupos funcionais (no átomo selecionado)</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => addGroup('oh')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−OH hidroxila</button>
              <button onClick={() => addGroup('carbonila')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">=O carbonila</button>
              <button onClick={() => addGroup('carboxila')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−COOH carboxila</button>
              <button onClick={() => addGroup('eter')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−O− éter/éster</button>
              <button onClick={() => addGroup('amina')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−NH₂ amina</button>
              <button onClick={() => addGroup('amida')} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−N amida</button>
              {(['Cl', 'Br', 'F', 'I'] as const).map((h) => (
                <button key={h} onClick={() => addGroup(h)} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition">−{h} haleto</button>
              ))}
            </div>
            <p className="text-faint text-[11px] mt-1.5">Dica: para éster, adicione a carbonila (=O) no carbono, depois o éter/éster (−O−) no mesmo carbono, e por fim um radical (ex. Metil) selecionando esse novo oxigênio.</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer select-none">
              <input type="checkbox" checked={showH} onChange={(e) => setShowH(e.target.checked)} className="accent-primary" />
              Auto-completar hidrogênios (mostrar H)
            </label>
            <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition"><Trash2 size={13} /> Limpar</button>
          </div>

          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Moléculas famosas de prova</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => loadPreset(p.id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg hover:border-primary/50 transition text-left">{p.title}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">{error}</p>}
        </section>

        {/* Canvas */}
        <section className="bg-surface border border-edge rounded-2xl p-3">
          <svg ref={svgRef} viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`} className="w-full select-none" style={{ touchAction: 'none' }}>
            <rect width={COLS * CELL} height={ROWS * CELL} fill="rgba(148,163,184,0.03)" rx="12" />
            {Array.from({ length: COLS }).map((_, x) =>
              Array.from({ length: ROWS }).map((_, y) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x * CELL + CELL / 2}
                  cy={y * CELL + CELL / 2}
                  r="2"
                  fill="currentColor"
                  className="text-edge cursor-pointer"
                  onClick={() => clickCell(x, y)}
                />
              ))
            )}
            {bonds.map((b, i) => {
              const A = byId.get(b.a), B = byId.get(b.b)
              if (!A || !B) return null
              const pa = drag && drag.id === A.id ? { x: drag.curX, y: drag.curY } : A
              const pb = drag && drag.id === B.id ? { x: drag.curX, y: drag.curY } : B
              const ax = pa.x * CELL + CELL / 2, ay = pa.y * CELL + CELL / 2
              const bx = pb.x * CELL + CELL / 2, by = pb.y * CELL + CELL / 2
              const dx = bx - ax, dy = by - ay
              const len = Math.hypot(dx, dy) || 1
              const px = -dy / len, py = dx / len
              const gap = 5
              return (
                <g key={i}>
                  {Array.from({ length: b.order }).map((_, k) => {
                    const off = (k - (b.order - 1) / 2) * gap
                    return <line key={k} x1={ax + px * off} y1={ay + py * off} x2={bx + px * off} y2={by + py * off} stroke="#cbd5e1" strokeWidth="2.2" />
                  })}
                </g>
              )
            })}
            {atoms.map((a) => {
              const p = drag && drag.id === a.id ? { x: drag.curX, y: drag.curY } : a
              const cx = p.x * CELL + CELL / 2, cy = p.y * CELL + CELL / 2
              const isSel = selected === a.id
              const isDragging = drag?.id === a.id && drag.moved
              const h = hCount(a.id, atoms, bonds)
              const cls = a.el === 'C' ? classifyCarbon(a.id, mol) : null
              const fill = cls ? CLASS_COLOR[cls] : EL_COLOR[a.el]
              let label: string = a.el
              if (showH && h > 0) label = `${a.el}H${h > 1 ? h : ''}`
              return (
                <g
                  key={a.id}
                  onPointerDown={(e) => onAtomPointerDown(e, a.id)}
                  onPointerMove={onAtomPointerMove}
                  onPointerUp={(e) => onAtomPointerUp(e, a.id)}
                  className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                  style={{ opacity: isDragging ? 0.85 : 1 }}
                >
                  {isSel && <circle cx={cx} cy={cy} r="16" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeDasharray="3 3" />}
                  <circle cx={cx} cy={cy} r="12" fill="#0f172a" stroke={fill} strokeWidth="2.5" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={label.length > 2 ? 9 : 11} fontWeight="700" fill={fill}>{label}</text>
                </g>
              )
            })}
          </svg>
          {atoms.length === 0 && <p className="text-center text-faint text-sm mt-2">Escolha o elemento na paleta e clique na grade para começar, ou carregue uma molécula famosa.</p>}
        </section>

        {/* Análise */}
        <section className="space-y-4">
          {presetInfo && (
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <p className="text-faint text-xs font-semibold uppercase mb-1">Molécula carregada</p>
              <p className="text-fg font-bold">{presetInfo.title} <span className="text-muted font-normal">({presetInfo.commonName})</span></p>
              <p className="text-muted text-xs mt-1">IUPAC (curado): <span className="text-fg">{presetInfo.iupacName}</span></p>
              <p className="text-faint text-xs mt-2">{presetInfo.funFact}</p>
              <p className="text-faint text-[10px] mt-2 italic">Moléculas complexas como esta usam o nome IUPAC oficial (curado), não o algoritmo genérico abaixo.</p>
            </div>
          )}

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Nome IUPAC</h2>
            {atoms.length === 0 ? (
              <p className="text-muted text-sm">Monte uma estrutura para ver o nome.</p>
            ) : presetInfo ? (
              <p className="text-fg text-lg font-semibold">{presetInfo.iupacName}</p>
            ) : nameResult?.ok ? (
              <p className="text-fg text-lg font-semibold">{nameResult.name}</p>
            ) : (
              <p className="text-amber-300 text-sm">{nameResult?.note ?? 'Nome não calculado.'}</p>
            )}
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Fórmula e massa</h2>
            <p className="text-fg text-xl font-mono">{formula || '—'}</p>
            <p className="text-muted text-sm mt-1">{atoms.length ? `${mass.toFixed(2).replace('.', ',')} g/mol` : '—'}</p>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Função orgânica</h2>
            {groups.length === 0 ? (
              <p className="text-muted text-sm">{atoms.some((a) => a.el === 'C') ? 'Hidrocarboneto (sem grupo funcional).' : '—'}</p>
            ) : (
              <>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary mb-2">
                  {isMixed ? `Função mista (principal: ${principal?.label ?? '—'})` : principal?.label ?? [...distinctGroupTypes][0]}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[...distinctGroupTypes].map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-app border border-edge text-muted">{groups.find((g) => g.type === t)?.label}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {info && (
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-2">Classificação da cadeia</h2>
              <ul className="text-fg text-sm space-y-1">
                <li>{info.cyclic ? (info.aromatic ? 'Fechada / aromática' : 'Fechada / cíclica') : 'Aberta / acíclica'}</li>
                <li>{info.normal ? 'Normal (sem ramificações)' : 'Ramificada'}</li>
                <li>{info.saturated ? 'Saturada (só ligações simples entre carbonos)' : 'Insaturada (tem dupla ou tripla ligação)'}</li>
                <li>{info.homogeneous ? 'Homogênea (só carbono na cadeia)' : `Heterogênea (${info.heteroatomNote})`}</li>
              </ul>
            </div>
          )}

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Classificação dos carbonos</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(CLASS_LABEL).map(([k, l]) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-muted"><span className="w-3 h-3 rounded-full border" style={{ borderColor: CLASS_COLOR[k], backgroundColor: `${CLASS_COLOR[k]}33` }} />{l}</span>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Foco no vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li><strong>Regra de ouro da numeração:</strong> a menor numeração possível prioriza o grupo funcional, depois as insaturações e por fim as ramificações.</li>
              <li><strong>Atenção no ENEM:</strong> um heteroátomo (O, N, S) só torna a cadeia heterogênea se estiver estritamente <em>entre</em> dois átomos de carbono.</li>
              <li>Carbono primário, secundário, terciário ou quaternário é definido pelo número de <em>outros carbonos</em> ligados a ele — não pelo número de hidrogênios.</li>
            </ul>
          </div>

          <p className="text-faint text-[11px] flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-0.5" /> O nome IUPAC genérico cobre cadeias abertas com até 10 carbonos e um grupo funcional principal (álcool, ácido, aldeído, cetona, amina, amida, éster) mais substituintes simples. Anéis (exceto o benzeno mono-substituído), cadeias muito ramificadas ou com mais de uma família de grupos podem não ter o nome calculado — nesses casos, confira com seu professor.</p>
        </section>
      </div>

      {/* "Fantasma" do átomo seguindo o cursor enquanto arrasta da paleta pro quadro */}
      {paletteDrag && paletteDrag.moved && (
        <div
          className="fixed z-50 pointer-events-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            left: paletteDrag.curX - 16,
            top: paletteDrag.curY - 16,
            backgroundColor: '#0f172a',
            border: `2px solid ${EL_COLOR[paletteDrag.el]}`,
            color: EL_COLOR[paletteDrag.el],
          }}
        >
          {paletteDrag.el}
        </div>
      )}
    </div>
  )
}
