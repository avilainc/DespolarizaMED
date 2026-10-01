'use client'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, RotateCw } from 'lucide-react'
import { type SolidType, type SolidParams, solveSolid, buildMesh, project } from '@/lib/solids'

const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

const SOLIDS: { id: SolidType; label: string }[] = [
  { id: 'cubo', label: 'Cubo' },
  { id: 'paralelepipedo', label: 'Paralelepípedo' },
  { id: 'cilindro', label: 'Cilindro' },
  { id: 'cone', label: 'Cone' },
  { id: 'piramide', label: 'Pirâmide' },
  { id: 'esfera', label: 'Esfera' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function shadeColor(base: string, shade: number) {
  return base + Math.round(shade * 255).toString(16).padStart(2, '0')
}

function darken(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt))
  const b = Math.max(0, Math.min(255, (n & 255) + amt))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function HeightMark({ topY, botY, x, label }: { topY: number; botY: number; x: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={topY} x2={x} y2={botY} stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1={x - 5} y1={topY} x2={x + 5} y2={topY} stroke="#facc15" strokeWidth="1.5" />
      <line x1={x - 5} y1={botY} x2={x + 5} y2={botY} stroke="#facc15" strokeWidth="1.5" />
      <text x={x + 9} y={(topY + botY) / 2 + 4} fontSize="13" fontWeight="700" fill="#facc15">{label}</text>
    </g>
  )
}

function Solid3D({ type, params, rot, tiltX, color }: { type: SolidType; params: SolidParams; rot: number; tiltX: number; color: string }) {
  const W = 320, H = 300
  if (type === 'esfera') {
    const R = Math.min(110, params.r * 12)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <radialGradient id="sphereGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={darken(color, 90)} />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor={darken(color, -70)} />
          </radialGradient>
        </defs>
        <circle cx={W / 2} cy={H / 2} r={R} fill="url(#sphereGrad)" />
        <ellipse cx={W / 2} cy={H / 2} rx={R} ry={R * 0.28} fill="none" stroke="#0c4a6e" strokeOpacity="0.4" transform={`rotate(${(rot * 180) / Math.PI * 0.3} ${W / 2} ${H / 2})`} />
      </svg>
    )
  }

  const mesh = buildMesh(type, params)
  const projected = mesh.vertices.map((v) => project(v, rot, tiltX))
  const maxExt = Math.max(...projected.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1]))), 1)
  const scale = 100 / maxExt
  const sx = (x: number) => W / 2 + x * scale
  const sy = (y: number) => H / 2 - y * scale

  const facesWithDepth = mesh.faces.map((f) => {
    const zs = f.idx.map((i) => projected[i][2])
    return { ...f, z: zs.reduce((a, b) => a + b, 0) / zs.length }
  })
  facesWithDepth.sort((a, b) => a.z - b.z)

  // altura (h): reta tracejada à direita do sólido, do topo à base
  const allX = projected.map((p) => sx(p[0]))
  const allY = projected.map((p) => sy(p[1]))
  const hLineX = Math.max(...allX) + 20
  const hTopY = Math.min(...allY)
  const hBotY = Math.max(...allY)

  // cilindro: 2 arestas de silhueta (topo↔base) nos pontos mais à esquerda/direita, sem as costuras internas
  let cylEdges: { x1: number; y1: number; x2: number; y2: number }[] = []
  if (type === 'cilindro') {
    const n = projected.length / 2
    const topPts = projected.slice(0, n)
    let li = 0, ri = 0
    topPts.forEach((p, i) => { if (sx(p[0]) < sx(topPts[li][0])) li = i; if (sx(p[0]) > sx(topPts[ri][0])) ri = i })
    cylEdges = [li, ri].map((i) => ({ x1: sx(projected[i][0]), y1: sy(projected[i][1]), x2: sx(projected[n + i][0]), y2: sy(projected[n + i][1]) }))
  }

  // cone: geratriz (ápice até o ponto mais à direita da base)
  let coneG: { x1: number; y1: number; x2: number; y2: number; mx: number; my: number } | null = null
  if (type === 'cone') {
    const apexIdx = projected.length - 1
    let ri = 0
    for (let i = 1; i < apexIdx; i++) if (sx(projected[i][0]) > sx(projected[ri][0])) ri = i
    const x1 = sx(projected[apexIdx][0]), y1 = sy(projected[apexIdx][1])
    const x2 = sx(projected[ri][0]), y2 = sy(projected[ri][1])
    coneG = { x1, y1, x2, y2, mx: (x1 + x2) / 2 + 10, my: (y1 + y2) / 2 }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
      {facesWithDepth.map((f, i) => (
        <polygon
          key={i}
          points={f.idx.map((vi) => `${sx(projected[vi][0]).toFixed(1)},${sy(projected[vi][1]).toFixed(1)}`).join(' ')}
          fill={shadeColor(color, Math.min(1, f.shade))}
          stroke={type === 'cilindro' && f.kind === 'side' ? 'none' : '#0c4a6e'}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}
      {cylEdges.map((e, i) => <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#0c4a6e" strokeOpacity="0.8" strokeWidth="1" />)}
      {coneG && (
        <g>
          <line x1={coneG.x1} y1={coneG.y1} x2={coneG.x2} y2={coneG.y2} stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x={coneG.mx} y={coneG.my} fontSize="13" fontWeight="700" fill="#facc15">g</text>
        </g>
      )}
      {(type === 'cilindro' || type === 'cone' || type === 'piramide' || type === 'paralelepipedo') && (
        <HeightMark topY={hTopY} botY={hBotY} x={hLineX} label="h" />
      )}
    </svg>
  )
}

function Net({ type, params }: { type: SolidType; params: SolidParams }) {
  const s = 14 // px por unidade
  if (type === 'cubo' || type === 'paralelepipedo') {
    const w = (type === 'cubo' ? params.edge : params.baseEdge) * s
    const h = (type === 'cubo' ? params.edge : params.h) * s
    const d = (type === 'cubo' ? params.edge : params.edge) * s
    const ox = 60, oy = 30
    return (
      <svg viewBox="0 0 320 300" className="w-full">
        {/* cruz clássica: base central com 4 laterais ao redor + topo/fundo */}
        <rect x={ox} y={oy} width={w} height={d} fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x={ox} y={oy + d} width={w} height={h} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x={ox} y={oy + d + h} width={w} height={d} fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x={ox} y={oy + d + h + d} width={w} height={h} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x={ox - h} y={oy + d} width={h} height={h} fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x={ox + w} y={oy + d} width={h} height={h} fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'cilindro') {
    const circumf = 2 * Math.PI * params.r * s
    const h = params.h * s
    const r = params.r * s
    return (
      <svg viewBox="0 0 320 260" className="w-full">
        <rect x="20" y="20" width={Math.min(260, circumf)} height={h} fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx={20 + Math.min(260, circumf) + 26 + r} cy={20 + h / 2} r={Math.min(30, r)} fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'cone') {
    const g = Math.sqrt(params.r * params.r + params.h * params.h) * s
    const gClamped = Math.min(120, g)
    const arcFrac = params.r / (params.r + params.h * 0.001 + params.r) // só pra evitar div0, não usado
    const sweep = Math.min(340, (params.r / Math.sqrt(params.r * params.r + params.h * params.h)) * 360)
    const large = sweep > 180 ? 1 : 0
    const cx = 130, cy = 130
    const a2 = (sweep * Math.PI) / 180
    return (
      <svg viewBox="0 0 320 300" className="w-full">
        <path d={`M${cx},${cy} L${cx + gClamped},${cy} A${gClamped},${gClamped} 0 ${large} 1 ${cx + gClamped * Math.cos(a2)},${cy - gClamped * Math.sin(a2)} Z`} fill="#38bdf8" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx={cx + gClamped + 20 + Math.min(30, params.r * s)} cy={cy} r={Math.min(30, params.r * s)} fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
      </svg>
    )
  }
  // pirâmide
  const b = params.baseEdge * s
  const apotemaBase = params.baseEdge / 2
  const g = Math.sqrt(params.h * params.h + apotemaBase * apotemaBase) * s
  const ox = 160, oy = 150
  const triH = Math.sqrt(Math.max(0, g * g - (b / 2) ** 2))
  return (
    <svg viewBox="0 0 320 300" className="w-full">
      <rect x={ox - b / 2} y={oy} width={b} height={b} fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points={`${ox - b / 2},${oy} ${ox + b / 2},${oy} ${ox},${oy - triH}`} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points={`${ox + b / 2},${oy} ${ox + b / 2},${oy + b} ${ox + b / 2 + triH},${oy + b / 2}`} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points={`${ox - b / 2},${oy + b} ${ox + b / 2},${oy + b} ${ox},${oy + b + triH}`} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points={`${ox - b / 2},${oy} ${ox - b / 2},${oy + b} ${ox - b / 2 - triH},${oy + b / 2}`} fill="#38bdf8" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
    </svg>
  )
}

const PI_OPTIONS: { id: 'exact' | '3.14' | '3'; label: string; value: number }[] = [
  { id: '3', label: 'π ≈ 3', value: 3 },
  { id: '3.14', label: 'π ≈ 3,14', value: 3.14 },
  { id: 'exact', label: 'π (simbólico)', value: Math.PI },
]

export default function SolidGeometryPage() {
  const [type, setType] = useState<SolidType>('cilindro')
  const [mode, setMode] = useState<'3d' | 'net'>('3d')
  const [r, setR] = useState(4)
  const [h, setH] = useState(8)
  const [edge, setEdge] = useState(5)
  const [baseEdge, setBaseEdge] = useState(6)
  const [rot, setRot] = useState(0.6)
  const [tiltX, setTiltX] = useState(0.5)
  const [color, setColor] = useState('#38bdf8')
  const [piMode, setPiMode] = useState<'exact' | '3.14' | '3'>('3')
  const [spinning, setSpinning] = useState(false)
  const raf = useRef(0)
  const dragRef = useRef<{ startX: number; startY: number; startRot: number; startTilt: number } | null>(null)

  useEffect(() => {
    if (!spinning) { cancelAnimationFrame(raf.current); return }
    const loop = () => {
      setRot((r) => r + 0.015)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [spinning])

  const usesPi = type === 'cilindro' || type === 'cone' || type === 'esfera'
  const piValue = PI_OPTIONS.find((p) => p.id === piMode)!.value
  const params: SolidParams = { r, h, edge, baseEdge }
  const res = solveSolid(type, params, piValue)
  const resCoef = solveSolid(type, params, 1)
  const symbolic = usesPi && piMode === 'exact'
  const fmtPi = (decimalVal: number, coefVal: number) => (symbolic ? `${num(coefVal)}π` : num(decimalVal))

  const canOrbit = mode === '3d' && type !== 'esfera'
  const onPointerDown = (e: ReactPointerEvent) => {
    if (!canOrbit) return
    setSpinning(false)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startRot: rot, startTilt: tiltX }
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setRot(dragRef.current.startRot + dx * 0.01)
    setTiltX(Math.max(-1.3, Math.min(1.3, dragRef.current.startTilt - dy * 0.01)))
  }
  const onPointerUp = () => { dragRef.current = null }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Geometria Espacial 3D</h1>
      <p className="text-muted text-sm mb-5">Prismas, pirâmides, cilindro, cone e esfera: gire em 3D, veja a planificação, área e volume.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-faint text-xs font-semibold uppercase">Sólido</p>
              {usesPi && (
                <div className="flex gap-1">
                  {PI_OPTIONS.map((p) => (
                    <button key={p.id} onClick={() => setPiMode(p.id)} title="Valor de π usado nos cálculos" className={`text-[10px] px-1.5 py-0.5 rounded border transition ${piMode === p.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-faint hover:text-fg'}`}>{p.label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SOLIDS.map((s) => (
                <button key={s.id} onClick={() => setType(s.id)} className={`text-xs px-2 py-1.5 rounded-lg border transition ${type === s.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{s.label}</button>
              ))}
            </div>
            {usesPi && (
              <p className="text-faint text-[11px] mt-2 leading-relaxed">
                Escolha como quer aproximar π (3, 3,14 ou deixar o resultado em função de π, como pede o enunciado da prova) — a área e o volume mudam de acordo.
              </p>
            )}
          </div>
          <label className="flex items-center justify-between">
            <span className="text-xs text-faint">Cor do sólido</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-7 rounded border border-edge bg-transparent cursor-pointer" />
          </label>
          <div className="flex gap-2">
            <button onClick={() => setMode('3d')} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition ${mode === '3d' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Modo Sólido 3D</button>
            <button onClick={() => setMode('net')} disabled={type === 'esfera'} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition disabled:opacity-40 ${mode === 'net' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Modo Planificação</button>
          </div>
          {(type === 'cilindro' || type === 'cone' || type === 'esfera') && (
            <label className="block"><span className="text-xs text-faint">Raio r: {r}</span><input type="range" min={1} max={10} step={0.5} value={r} onChange={(e) => setR(+e.target.value)} className="w-full accent-primary" /></label>
          )}
          {(type === 'cilindro' || type === 'cone' || type === 'piramide' || type === 'paralelepipedo') && (
            <label className="block"><span className="text-xs text-faint">Altura h: {h}</span><input type="range" min={1} max={12} step={0.5} value={h} onChange={(e) => setH(+e.target.value)} className="w-full accent-primary" /></label>
          )}
          {type === 'cubo' && (
            <label className="block"><span className="text-xs text-faint">Aresta: {edge}</span><input type="range" min={1} max={10} step={0.5} value={edge} onChange={(e) => setEdge(+e.target.value)} className="w-full accent-primary" /></label>
          )}
          {type === 'paralelepipedo' && (
            <>
              <label className="block"><span className="text-xs text-faint">Comprimento: {baseEdge}</span><input type="range" min={1} max={10} step={0.5} value={baseEdge} onChange={(e) => setBaseEdge(+e.target.value)} className="w-full accent-primary" /></label>
              <label className="block"><span className="text-xs text-faint">Profundidade: {edge}</span><input type="range" min={1} max={10} step={0.5} value={edge} onChange={(e) => setEdge(+e.target.value)} className="w-full accent-primary" /></label>
            </>
          )}
          {type === 'piramide' && (
            <label className="block"><span className="text-xs text-faint">Aresta da base: {baseEdge}</span><input type="range" min={1} max={10} step={0.5} value={baseEdge} onChange={(e) => setBaseEdge(+e.target.value)} className="w-full accent-primary" /></label>
          )}
          {mode === '3d' && type !== 'esfera' && (
            <div>
              <label className="block"><span className="text-xs text-faint">Girar</span><input type="range" min={0} max={6.28} step={0.02} value={rot} onChange={(e) => { setRot(+e.target.value); setSpinning(false) }} className="w-full accent-primary" /></label>
              <p className="text-faint text-[11px] mt-1">Ou arraste a figura ao lado com o mouse pra girar livremente.</p>
              <button onClick={() => setSpinning((s) => !s)} className="mt-1 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition"><RotateCw size={13} /> {spinning ? 'Parar' : 'Girar automaticamente'}</button>
            </div>
          )}
        </section>

        <section
          className="bg-surface border border-edge rounded-2xl p-4 flex items-center justify-center min-h-[340px]"
          style={{ cursor: canOrbit ? 'grab' : 'default', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {mode === '3d' ? <Solid3D type={type} params={params} rot={rot} tiltX={tiltX} color={color} /> : <Net type={type} params={params} />}
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Cálculo</h2>
            {type !== 'esfera' && <Row label="Área da base (Ab)" value={fmtPi(res.areaBase, resCoef.areaBase)} />}
            <Row label="Área lateral (Al)" value={fmtPi(res.areaLateral, resCoef.areaLateral)} />
            <Row label="Área total (At)" value={fmtPi(res.areaTotal, resCoef.areaTotal)} />
            <Row label="Volume (V)" value={fmtPi(res.volume, resCoef.volume)} />
            {res.geratriz && <Row label="Geratriz (g)" value={num(res.geratriz)} />}
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Caiu no ENEM</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Projeção ortogonal: a "vista de cima/frente/lado" de um sólido esconde a profundidade — cuidado com sólidos que parecem iguais de um ângulo mas não são (ex.: cubo vs cilindro vistos de cima).</li>
              <li>Escolha de embalagens: a forma com <strong>menor área total</strong> pra um mesmo volume gasta menos material — é por isso que latas são cilíndricas (boa relação área/volume) e não caixas quadradas.</li>
              <li>Um cone e um cilindro de mesma base e altura: o volume do cone é sempre exatamente ⅓ do volume do cilindro.</li>
              {type === 'esfera' && <li>A esfera não tem planificação exata (não dá pra "abrir" numa superfície plana sem distorcer) — por isso mapas-múndi sempre distorcem o tamanho dos continentes.</li>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
