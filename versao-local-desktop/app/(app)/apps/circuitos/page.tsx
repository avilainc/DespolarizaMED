'use client'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, Zap, Calculator, RotateCw } from 'lucide-react'
import { type CircuitType, type ResistorGroup, solveCircuit, APPLIANCES, energyCost } from '@/lib/circuits'

const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function Bulb({ P, maxP, x, y, dragging }: { P: number; maxP: number; x: number; y: number; dragging?: boolean }) {
  const bright = Math.min(1, P / (maxP || 1))
  return (
    <g transform={`translate(${x},${y})`} style={{ opacity: dragging ? 0.85 : 1 }}>
      <circle r="14" fill={`rgba(250, 204, 21, ${0.15 + bright * 0.85})`} stroke="#facc15" strokeWidth="2" />
      <circle r="14" fill="none" stroke="#facc15" strokeOpacity={bright} strokeWidth="8" style={{ filter: `blur(6px)`, opacity: bright * 0.6 }} />
    </g>
  )
}

type Res = { id: number; R: number; group: ResistorGroup }

const SPACING = 70
const MAIN_START = 110
const CROSS_TOP = 50
const CROSS_BOT = 170
const CROSS_MID = (CROSS_TOP + CROSS_BOT) / 2
const BATTERY_ALONG = 40

export default function CircuitsPage() {
  const [resistors, setResistors] = useState<Res[]>([
    { id: 1, R: 10, group: 'main' },
    { id: 2, R: 20, group: 'main' },
    { id: 3, R: 30, group: 'main' },
  ])
  const nextId = useRef(4)
  const [U, setU] = useState(12)
  const [orientation, setOrientation] = useState<'h' | 'v'>('h')
  const svgRef = useRef<SVGSVGElement>(null)

  const result = solveCircuit(U, resistors)
  const maxP = Math.max(...resistors.map((r) => result.results.get(r.id)?.P ?? 0), 0.01)

  const setR = (id: number, v: number) => setResistors((arr) => arr.map((r) => (r.id === id ? { ...r, R: v } : r)))
  const addR = () => setResistors((arr) => (arr.length < 5 ? [...arr, { id: nextId.current++, R: 20, group: 'parallel' }] : arr))
  const removeR = () => setResistors((arr) => (arr.length > 1 ? arr.slice(0, -1) : arr))

  const applyPreset = (preset: CircuitType) => {
    setResistors((arr) =>
      arr.map((r, i) => ({
        ...r,
        group: preset === 'serie' ? 'main' : preset === 'paralelo' ? 'parallel' : i < 2 ? 'main' : 'parallel',
      }))
    )
  }

  // ---- layout do diagrama (eixo "along" = ao longo do fio principal, "cross" = série×paralelo) ----
  const mainList = resistors.filter((r) => r.group === 'main')
  const parList = resistors.filter((r) => r.group === 'parallel')
  const mainPos = mainList.map((r, i) => ({ ...r, along: MAIN_START + i * SPACING, cross: CROSS_TOP }))
  const branchAlong = MAIN_START + mainList.length * SPACING
  const parStart = branchAlong + 40
  const parPos = parList.map((r, i) => ({ ...r, along: parStart + i * SPACING, cross: CROSS_MID }))
  const rightmostAlong = parList.length ? parStart + (parList.length - 1) * SPACING : branchAlong

  const alongSize = Math.max(400, rightmostAlong + 60)
  const crossSize = CROSS_BOT + 50
  const viewBox = orientation === 'h' ? `0 0 ${alongSize} ${crossSize}` : `0 0 ${crossSize} ${alongSize}`
  const toXY = (along: number, cross: number) => (orientation === 'h' ? { x: along, y: cross } : { x: cross, y: along })

  // ---- arrastar resistor entre a linha principal (série) e o bloco paralelo ----
  const [drag, setDrag] = useState<{ id: number; startClientX: number; startClientY: number; curAlong: number; curCross: number; moved: boolean } | null>(null)

  const clientToLocal = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { along: 0, cross: 0 }
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const x = ((clientX - rect.left) / rect.width) * vb.width
    const y = ((clientY - rect.top) / rect.height) * vb.height
    return orientation === 'h' ? { along: x, cross: y } : { along: y, cross: x }
  }

  const onDropResistor = (id: number, curAlong: number, curCross: number) => {
    setResistors((arr) => {
      const dragged = arr.find((r) => r.id === id)
      if (!dragged) return arr
      const newGroup: ResistorGroup = curCross < CROSS_MID ? 'main' : 'parallel'
      const curMain = arr.filter((r) => r.group === 'main' && r.id !== id)
      const curPar = arr.filter((r) => r.group === 'parallel' && r.id !== id)
      if (newGroup === 'main') {
        const idx = Math.max(0, Math.min(curMain.length, Math.round((curAlong - MAIN_START) / SPACING)))
        const newMain = curMain.slice()
        newMain.splice(idx, 0, { ...dragged, group: 'main' })
        return [...newMain, ...curPar]
      }
      const parStartNow = MAIN_START + curMain.length * SPACING + 40
      const idx = Math.max(0, Math.min(curPar.length, Math.round((curAlong - parStartNow) / SPACING)))
      const newPar = curPar.slice()
      newPar.splice(idx, 0, { ...dragged, group: 'parallel' })
      return [...curMain, ...newPar]
    })
  }

  const onResPointerDown = (e: ReactPointerEvent, id: number, along: number, cross: number) => {
    e.stopPropagation()
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}
    setDrag({ id, startClientX: e.clientX, startClientY: e.clientY, curAlong: along, curCross: cross, moved: false })
  }
  const onResPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const loc = clientToLocal(e.clientX, e.clientY)
    const movedNow = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY) > 5
    setDrag((d) => (d ? { ...d, curAlong: loc.along, curCross: loc.cross, moved: d.moved || movedNow } : d))
  }
  const onResPointerUp = () => {
    if (!drag) return
    if (drag.moved) onDropResistor(drag.id, drag.curAlong, drag.curCross)
    setDrag(null)
  }

  // kWh
  const [applianceId, setApplianceId] = useState('chuveiro')
  const appliance = APPLIANCES.find((a) => a.id === applianceId)!
  const [hours, setHours] = useState(appliance.hoursPerDay)
  const [tariff, setTariff] = useState(0.95)
  const cost = energyCost(appliance.watts, hours, 30, tariff)

  const batteryP1 = toXY(BATTERY_ALONG, CROSS_TOP)
  const batteryP2 = toXY(BATTERY_ALONG, CROSS_BOT)
  const topRailP1 = toXY(BATTERY_ALONG, CROSS_TOP)
  const topRailP2 = toXY(rightmostAlong, CROSS_TOP)
  const botRailP1 = toXY(BATTERY_ALONG, CROSS_BOT)
  const botRailP2 = toXY(rightmostAlong, CROSS_BOT)
  const closeP1 = toXY(branchAlong, CROSS_TOP)
  const closeP2 = toXY(branchAlong, CROSS_BOT)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Circuitos Elétricos</h1>
      <p className="text-muted text-sm mb-5">Resistência equivalente, Leis de Ohm, potência e consumo de energia em kWh.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Atalhos de configuração</p>
            <div className="flex gap-2">
              {(['serie', 'paralelo', 'misto'] as CircuitType[]).map((t) => (
                <button key={t} onClick={() => applyPreset(t)} className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-edge text-muted hover:text-fg hover:border-primary/50 transition capitalize">{t}</button>
              ))}
            </div>
            <p className="text-faint text-[11px] mt-1.5">Ou arraste cada resistor no diagrama: linha de cima = série, bloco de baixo = paralelo.</p>
          </div>
          <label className="block">
            <span className="text-xs text-faint">Tensão da bateria U: {U} V</span>
            <input type="range" min={1} max={24} value={U} onChange={(e) => setU(+e.target.value)} className="w-full accent-primary" />
          </label>
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Resistores (Ω)</p>
            <div className="space-y-2">
              {resistors.map((r, i) => (
                <label key={r.id} className="block">
                  <span className="text-[11px] text-faint">R{i + 1} ({r.group === 'main' ? 'série' : 'paralelo'}): {r.R} Ω</span>
                  <input type="range" min={5} max={100} value={r.R} onChange={(e) => setR(r.id, +e.target.value)} className="w-full accent-primary" />
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={addR} disabled={resistors.length >= 5} className="text-xs px-2.5 py-1 rounded-lg border border-edge text-muted hover:text-fg transition disabled:opacity-40">+ resistor</button>
              <button onClick={removeR} disabled={resistors.length <= 1} className="text-xs px-2.5 py-1 rounded-lg border border-edge text-muted hover:text-fg transition disabled:opacity-40">− resistor</button>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-faint text-xs font-semibold uppercase">Diagrama</p>
            <button onClick={() => setOrientation((o) => (o === 'h' ? 'v' : 'h'))} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition">
              <RotateCw size={13} /> Girar
            </button>
          </div>
          <svg ref={svgRef} viewBox={viewBox} className="w-full text-fg" style={{ touchAction: 'none' }}>
            {/* fio de retorno (base) */}
            <line x1={botRailP1.x} y1={botRailP1.y} x2={botRailP2.x} y2={botRailP2.y} stroke="currentColor" strokeOpacity="0.6" strokeWidth="2.5" />
            {/* fio principal (série), passando pelos resistores "main" */}
            <line x1={topRailP1.x} y1={topRailP1.y} x2={topRailP2.x} y2={topRailP2.y} stroke="currentColor" strokeOpacity="0.6" strokeWidth="2.5" />
            {/* fecha o laço à direita quando não há bloco paralelo */}
            {parList.length === 0 && <line x1={closeP1.x} y1={closeP1.y} x2={closeP2.x} y2={closeP2.y} stroke="currentColor" strokeOpacity="0.6" strokeWidth="2.5" />}
            {/* ramos em paralelo */}
            {parPos.map((r) => {
              const p1 = toXY(r.along, CROSS_TOP), p2 = toXY(r.along, CROSS_BOT)
              return <line key={r.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" strokeOpacity="0.6" strokeWidth="2.5" />
            })}
            {/* bateria */}
            <line x1={batteryP1.x} y1={batteryP1.y} x2={batteryP2.x} y2={batteryP2.y} stroke="#94a3b8" strokeWidth="8" />
            <text {...toXY(BATTERY_ALONG, CROSS_BOT + 22)} fontSize="10" textAnchor="middle" className="fill-current text-fg">{U} V</text>
            {/* zonas (dica visual) */}
            <text {...toXY(alongSize - 55, CROSS_TOP - 14)} fontSize="9" textAnchor="middle" className="fill-current text-faint">zona série</text>
            <text {...toXY(alongSize - 55, CROSS_BOT + 32)} fontSize="9" textAnchor="middle" className="fill-current text-faint">zona paralelo</text>
            {/* resistores (lâmpadas arrastáveis) */}
            {[...mainPos, ...parPos].map((r) => {
              const isDragging = drag?.id === r.id && drag.moved
              const p = isDragging ? toXY(drag.curAlong, drag.curCross) : toXY(r.along, r.cross)
              const res = result.results.get(r.id)
              return (
                <g
                  key={r.id}
                  onPointerDown={(e) => onResPointerDown(e, r.id, r.along, r.cross)}
                  onPointerMove={onResPointerMove}
                  onPointerUp={onResPointerUp}
                  className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                >
                  <Bulb P={res?.P ?? 0} maxP={maxP} x={p.x} y={p.y} dragging={isDragging} />
                </g>
              )
            })}
          </svg>
          <p className="text-center text-faint text-xs">Brilho da lâmpada ∝ potência dissipada — arraste uma lâmpada entre as duas zonas para reconfigurar o circuito</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead><tr className="text-faint border-b border-edge"><th className="text-left py-1">Resistor</th><th className="text-right">R (Ω)</th><th className="text-right">I (A)</th><th className="text-right">U (V)</th><th className="text-right">P (W)</th></tr></thead>
              <tbody>
                {resistors.map((r, i) => {
                  const res = result.results.get(r.id)
                  return (
                    <tr key={r.id} className="border-b border-edge/50">
                      <td className="py-1 text-fg">R{i + 1}</td>
                      <td className="text-right text-muted">{r.R}</td>
                      <td className="text-right text-fg">{num(res?.I ?? 0, 3)}</td>
                      <td className="text-right text-fg">{num(res?.U ?? 0, 2)}</td>
                      <td className="text-right text-fg">{num(res?.P ?? 0, 2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2 flex items-center gap-1.5"><Calculator size={16} /> Resultado</h2>
            <Row label="Resistência equivalente" value={`${num(result.req)} Ω`} />
            <Row label="Corrente total" value={`${num(result.total.I, 3)} A`} />
            <Row label="Potência total" value={`${num(result.total.P, 2)} W`} />
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2 flex items-center gap-1.5"><Zap size={16} /> Calculadora de conta de luz</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {APPLIANCES.map((a) => (
                <button key={a.id} onClick={() => { setApplianceId(a.id); setHours(a.hoursPerDay) }} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${applianceId === a.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{a.label}</button>
              ))}
            </div>
            <p className="text-faint text-xs mb-2">Potência: {appliance.watts} W</p>
            <label className="block mb-2">
              <span className="text-xs text-faint">Uso por dia: {hours.toFixed(1)} h</span>
              <input type="range" min={0.1} max={24} step={0.1} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full accent-primary" />
            </label>
            <label className="block mb-3">
              <span className="text-xs text-faint">Tarifa: R$ {tariff.toFixed(2)}/kWh</span>
              <input type="range" min={0.5} max={1.5} step={0.05} value={tariff} onChange={(e) => setTariff(+e.target.value)} className="w-full accent-primary" />
            </label>
            <Row label="Consumo por dia" value={`${num(cost.kWhPerDay)} kWh`} />
            <Row label="Consumo em 30 dias" value={`${num(cost.kWhTotal)} kWh`} />
            <Row label="Custo mensal" value={`R$ ${num(cost.cost)}`} />
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica do vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Em um circuito paralelo (como a rede elétrica de casa), desligar um aparelho <strong>não</strong> altera a ddp nos outros — todos recebem a mesma tensão.</li>
              <li>Amperímetro é ligado em <strong>série</strong> (resistência interna ≈ 0); voltímetro é ligado em <strong>paralelo</strong> (resistência interna ≈ ∞).</li>
              <li>E (kWh) = P (kW) × t (h) — sempre converta potência para quilowatts antes de multiplicar pelo tempo.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
