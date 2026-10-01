'use client'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { triangleSAS, rightTriangle, quadrilateral, regularPolygon, circleSector, type QuadType } from '@/lib/geometry'

const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const PRESET_COLORS = ['#38bdf8', '#4ade80', '#f87171', '#a78bfa', '#fb923c', '#0f172a', '#ffffff']

// Alça de vértice: arraste pra fora do centro pra aumentar a figura, pra
// dentro pra diminuir — nunca gira, só redimensiona.
function VertexHandle({ x, y, cx, cy, onDragStart, onScale }: {
  x: number; y: number; cx: number; cy: number; onDragStart?: () => void; onScale: (factor: number) => void
}) {
  const ref = useRef<{ startDist: number } | null>(null)
  const project = (e: ReactPointerEvent) => {
    const svg = (e.currentTarget as SVGCircleElement).ownerSVGElement
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    return { x: ((e.clientX - rect.left) / rect.width) * vb.width, y: ((e.clientY - rect.top) / rect.height) * vb.height }
  }
  const onDown = (e: ReactPointerEvent) => {
    e.stopPropagation()
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}
    ref.current = { startDist: Math.max(Math.hypot(x - cx, y - cy), 1) }
    onDragStart?.()
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!ref.current) return
    const p = project(e)
    const dist = Math.max(Math.hypot(p.x - cx, p.y - cy), 1)
    onScale(dist / ref.current.startDist)
  }
  const onUp = () => { ref.current = null }
  return (
    <circle
      cx={x} cy={y} r="7" fill="#4ade80" stroke="#0f172a" strokeWidth="1.5"
      style={{ cursor: 'nwse-resize', touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    />
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function SliderNum({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <label className="block">
      <span className="text-xs text-faint">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onChange(v) }}
          className="w-16 shrink-0 bg-app border border-edge rounded-lg px-2 py-1 text-sm text-fg outline-none focus:border-primary"
        />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-primary" />
      </div>
    </label>
  )
}

type Shape = 'triangulo-qualquer' | 'triangulo-retangulo' | 'quadrilatero' | 'poligono' | 'circulo'

function TriangleSASView({ a, b, C, showAltura, color, onDragStart, onResize }: {
  a: number; b: number; C: number; showAltura: boolean; color: string
  onDragStart: () => void; onResize: (factor: number) => void
}) {
  const t = triangleSAS(a, b, C)
  const W = 380, H = 320, pad = 40
  const pts = [t.points.A, t.points.B, t.points.C]
  const maxX = Math.max(...pts.map((p) => p.x), 1), minX = Math.min(...pts.map((p) => p.x), 0)
  const maxY = Math.max(...pts.map((p) => p.y), 1), minY = Math.min(...pts.map((p) => p.y), 0)
  const scale = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1))
  const X = (x: number) => pad + (x - minX) * scale
  const Y = (y: number) => H - pad - (y - minY) * scale
  // pé da altura relativa ao lado AB, a partir de C
  const abx = t.points.B.x - t.points.A.x, aby = t.points.B.y - t.points.A.y
  const abLen2 = abx * abx + aby * aby
  const tProj = abLen2 > 0 ? ((t.points.C.x - t.points.A.x) * abx + (t.points.C.y - t.points.A.y) * aby) / abLen2 : 0
  const foot = { x: t.points.A.x + tProj * abx, y: t.points.A.y + tProj * aby }
  const centroid = { x: (X(t.points.A.x) + X(t.points.B.x) + X(t.points.C.x)) / 3, y: (Y(t.points.A.y) + Y(t.points.B.y) + Y(t.points.C.y)) / 3 }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      <polygon points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
      {showAltura && (
        <>
          <line x1={X(t.points.C.x)} y1={Y(t.points.C.y)} x2={X(foot.x)} y2={Y(foot.y)} stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />
          <rect x={X(foot.x) - 4} y={Y(foot.y) - 4} width="8" height="8" fill="none" stroke="#facc15" strokeWidth="1.5" />
        </>
      )}
      <text x={X(t.points.A.x) + 8} y={Y(t.points.A.y) + 4} fontSize="13" fontWeight="700" className="fill-current text-fg">A</text>
      <text x={X(t.points.B.x) + 8} y={Y(t.points.B.y) + 4} fontSize="13" fontWeight="700" className="fill-current text-fg">B</text>
      <text x={X(t.points.C.x) - 16} y={Y(t.points.C.y) + 4} fontSize="13" fontWeight="700" className="fill-current text-fg">C</text>
      <VertexHandle x={X(t.points.A.x)} y={Y(t.points.A.y)} cx={centroid.x} cy={centroid.y} onDragStart={onDragStart} onScale={onResize} />
      <VertexHandle x={X(t.points.B.x)} y={Y(t.points.B.y)} cx={centroid.x} cy={centroid.y} onDragStart={onDragStart} onScale={onResize} />
      <VertexHandle x={X(t.points.C.x)} y={Y(t.points.C.y)} cx={centroid.x} cy={centroid.y} onDragStart={onDragStart} onScale={onResize} />
    </svg>
  )
}

export default function PlaneGeometryPage() {
  const [shape, setShape] = useState<Shape>('triangulo-qualquer')
  const [showAltura, setShowAltura] = useState(false)
  const [color, setColor] = useState('#38bdf8')
  const [piMode, setPiMode] = useState<'3' | '3.14' | 'pi'>('3.14')
  const piValue = piMode === '3' ? 3 : piMode === '3.14' ? 3.14 : Math.PI

  // triângulo qualquer (LAL) — arrastar um vértice redimensiona a e b juntos,
  // mantendo a proporção (não gira mais a figura)
  const [ta, setTa] = useState(6)
  const [tb, setTb] = useState(8)
  const [tC, setTC] = useState(60)
  const tri = triangleSAS(ta, tb, tC)
  const triBaseRef = useRef<[number, number]>([ta, tb])
  const onTriDragStart = () => { triBaseRef.current = [ta, tb] }
  const onTriResize = (factor: number) => {
    setTa(clamp(triBaseRef.current[0] * factor, 2, 15))
    setTb(clamp(triBaseRef.current[1] * factor, 2, 15))
  }

  // triângulo retângulo
  const [c1, setC1] = useState(3)
  const [c2, setC2] = useState(4)
  const rt = rightTriangle(c1, c2)
  const rtBaseRef = useRef<[number, number]>([c1, c2])
  const onRtDragStart = () => { rtBaseRef.current = [c1, c2] }
  const onRtResize = (factor: number) => {
    setC1(clamp(rtBaseRef.current[0] * factor, 1, 15))
    setC2(clamp(rtBaseRef.current[1] * factor, 1, 15))
  }

  // quadrilátero
  const [quadType, setQuadType] = useState<QuadType>('retangulo')
  const [q1, setQ1] = useState(6)
  const [q2, setQ2] = useState(4)
  const [q3, setQ3] = useState(3)
  const quad = quadrilateral(quadType, q1, q2, q3)
  const quadBaseRef = useRef<[number, number, number]>([q1, q2, q3])
  const onQuadDragStart = () => { quadBaseRef.current = [q1, q2, q3] }
  const onQuadResize = (factor: number) => {
    setQ1(clamp(quadBaseRef.current[0] * factor, 1, 15))
    setQ2(clamp(quadBaseRef.current[1] * factor, 1, 15))
    setQ3(clamp(quadBaseRef.current[2] * factor, 1, 15))
  }

  // polígono regular
  const [n, setN] = useState(6)
  const [side, setSide] = useState(5)
  const poly = regularPolygon(n, side)
  const sideBaseRef = useRef(side)
  const onPolyDragStart = () => { sideBaseRef.current = side }
  const onPolyResize = (factor: number) => setSide(clamp(sideBaseRef.current * factor, 1, 10))

  // círculo/setor
  const [r, setR] = useState(5)
  const [theta, setTheta] = useState(90)
  const circ = circleSector(r, theta, piValue)
  const circCoef = circleSector(r, theta, 1)
  const rBaseRef = useRef(r)
  const onCircleDragStart = () => { rBaseRef.current = r }
  const onCircleResize = (factor: number) => setR(clamp(rBaseRef.current * factor, 1, 15))

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Geometria Plana</h1>
      <p className="text-muted text-sm mb-5">Triângulos, quadriláteros, polígonos regulares e círculo/setor circular — área, perímetro e trigonometria.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ['triangulo-qualquer', 'Triângulo qualquer'],
          ['triangulo-retangulo', 'Triângulo retângulo'],
          ['quadrilatero', 'Quadriláteros'],
          ['poligono', 'Polígono regular'],
          ['circulo', 'Círculo / Setor'],
        ] as [Shape, string][]).map(([s, l]) => (
          <button key={s} onClick={() => setShape(s)} className={`px-3 py-2 rounded-xl border text-sm transition ${shape === s ? 'border-primary bg-primary/10 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{l}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          {shape === 'triangulo-qualquer' && (
            <>
              <SliderNum label="Lado a (CB)" value={ta} onChange={setTa} min={2} max={15} step={0.5} />
              <SliderNum label="Lado b (CA)" value={tb} onChange={setTb} min={2} max={15} step={0.5} />
              <SliderNum label="Ângulo C, entre a e b (°)" value={tC} onChange={setTC} min={5} max={175} step={1} />
              <button onClick={() => setShowAltura((s) => !s)} className={`text-xs px-3 py-1.5 rounded-lg border transition ${showAltura ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Traçar altura relativa a AB</button>
            </>
          )}
          {shape === 'triangulo-retangulo' && (
            <>
              <SliderNum label="Cateto 1" value={c1} onChange={setC1} min={1} max={15} step={0.5} />
              <SliderNum label="Cateto 2" value={c2} onChange={setC2} min={1} max={15} step={0.5} />
            </>
          )}
          {shape === 'quadrilatero' && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {(['quadrado', 'retangulo', 'losango', 'trapezio'] as QuadType[]).map((qt) => (
                  <button key={qt} onClick={() => setQuadType(qt)} className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition ${quadType === qt ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{qt}</button>
                ))}
              </div>
              {quadType === 'quadrado' && <SliderNum label="Lado" value={q1} onChange={setQ1} min={1} max={15} step={0.5} />}
              {quadType === 'retangulo' && <>
                <SliderNum label="Base" value={q1} onChange={setQ1} min={1} max={15} step={0.5} />
                <SliderNum label="Altura" value={q2} onChange={setQ2} min={1} max={15} step={0.5} />
              </>}
              {quadType === 'losango' && <>
                <SliderNum label="Diagonal maior" value={q1} onChange={setQ1} min={1} max={15} step={0.5} />
                <SliderNum label="Diagonal menor" value={q2} onChange={setQ2} min={1} max={15} step={0.5} />
              </>}
              {quadType === 'trapezio' && <>
                <SliderNum label="Base maior" value={q1} onChange={setQ1} min={1} max={15} step={0.5} />
                <SliderNum label="Base menor" value={q2} onChange={setQ2} min={1} max={15} step={0.5} />
                <SliderNum label="Altura" value={q3} onChange={setQ3} min={1} max={15} step={0.5} />
              </>}
            </>
          )}
          {shape === 'poligono' && (
            <>
              <SliderNum label="Número de lados n" value={n} onChange={(v) => setN(Math.round(v))} min={3} max={12} step={1} />
              <SliderNum label="Lado" value={side} onChange={setSide} min={1} max={10} step={0.5} />
            </>
          )}
          {shape === 'circulo' && (
            <>
              <SliderNum label="Raio" value={r} onChange={setR} min={1} max={15} step={0.5} />
              <SliderNum label="Ângulo do setor θ (°)" value={theta} onChange={setTheta} min={0} max={360} step={1} />
              <div>
                <span className="text-xs text-faint block mb-1">Adotar π como</span>
                <div className="flex flex-wrap gap-1.5">
                  {([['3', '3'], ['3.14', '3,14'], ['pi', 'π (simbólico)']] as [typeof piMode, string][]).map(([m, l]) => (
                    <button key={m} onClick={() => setPiMode(m)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${piMode === m ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{l}</button>
                  ))}
                </div>
                <p className="text-faint text-[11px] mt-1.5">Escolha como quer aproximar π — ou deixe o resultado em função de π, como pede o enunciado da prova.</p>
              </div>
            </>
          )}
          <div className="pt-2 border-t border-edge">
            <span className="text-xs text-faint block mb-1.5">Cor da figura</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${color.toLowerCase() === c ? 'border-primary scale-110' : 'border-edge'}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded border border-edge bg-transparent cursor-pointer ml-1" title="Outra cor" />
            </div>
          </div>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4 flex items-center justify-center min-h-[340px]">
          {shape === 'triangulo-qualquer' && <TriangleSASView a={ta} b={tb} C={tC} showAltura={showAltura} color={color} onDragStart={onTriDragStart} onResize={onTriResize} />}
          {shape === 'triangulo-retangulo' && (
            <svg viewBox="0 0 320 260" className="w-full max-w-sm text-fg">
              {(() => {
                const scale = Math.min(240 / c1, 200 / c2)
                const x0 = 40, y0 = 220
                const p2 = { x: x0, y: y0 - c1 * scale }
                const p3 = { x: x0 + c2 * scale, y: y0 }
                const cx = (x0 + p2.x + p3.x) / 3, cy = (y0 + p2.y + p3.y) / 3
                return (
                  <>
                    <polygon points={`${x0},${y0} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                    <rect x={x0} y={y0 - 10} width="10" height="10" fill="none" stroke="currentColor" strokeOpacity="0.6" />
                    <text x={x0 - 18} y={(y0 + p2.y) / 2} fontSize="12" className="fill-current text-fg">{c1}</text>
                    <text x={(x0 + p3.x) / 2} y={y0 + 18} fontSize="12" className="fill-current text-fg" textAnchor="middle">{c2}</text>
                    <text x={(p2.x + p3.x) / 2 + 10} y={(p2.y + p3.y) / 2 - 6} fontSize="12" className="fill-current text-fg">{num(rt.hyp)}</text>
                    <VertexHandle x={x0} y={y0} cx={cx} cy={cy} onDragStart={onRtDragStart} onScale={onRtResize} />
                    <VertexHandle x={p2.x} y={p2.y} cx={cx} cy={cy} onDragStart={onRtDragStart} onScale={onRtResize} />
                    <VertexHandle x={p3.x} y={p3.y} cx={cx} cy={cy} onDragStart={onRtDragStart} onScale={onRtResize} />
                  </>
                )
              })()}
            </svg>
          )}
          {shape === 'quadrilatero' && (
            <svg viewBox="0 0 320 220" className="w-full max-w-sm text-fg">
              {quadType === 'quadrado' && (() => { const x = 60, y = 30, s = q1 * 12; const cx = x + s / 2, cy = y + s / 2; return <>
                <rect x={x} y={y} width={s} height={s} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                <VertexHandle x={x} y={y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x + s} y={y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x + s} y={y + s} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x} y={y + s} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
              </> })()}
              {quadType === 'retangulo' && (() => { const x = 40, y = 40, w = q1 * 14, h = q2 * 14; const cx = x + w / 2, cy = y + h / 2; return <>
                <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                <VertexHandle x={x} y={y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x + w} y={y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x + w} y={y + h} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
                <VertexHandle x={x} y={y + h} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />
              </> })()}
              {quadType === 'losango' && (() => { const cx = 160, cy = 110, dx = q1 * 8, dy = q2 * 8; const p = [{ x: cx, y: cy - dy }, { x: cx + dx, y: cy }, { x: cx, y: cy + dy }, { x: cx - dx, y: cy }]; return <>
                <polygon points={p.map((v) => `${v.x},${v.y}`).join(' ')} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                {p.map((v, i) => <VertexHandle key={i} x={v.x} y={v.y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />)}
              </> })()}
              {quadType === 'trapezio' && (() => { const scale = 12, bb = q1 * scale, sb = q2 * scale, h = q3 * scale, offset = (bb - sb) / 2, y0 = 40 + h; const p = [{ x: 40, y: y0 }, { x: 40 + bb, y: y0 }, { x: 40 + offset + sb, y: 40 }, { x: 40 + offset, y: 40 }]; const cx = (40 + 40 + bb) / 2, cy = (y0 + 40) / 2; return <>
                <polygon points={p.map((v) => `${v.x},${v.y}`).join(' ')} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                {p.map((v, i) => <VertexHandle key={i} x={v.x} y={v.y} cx={cx} cy={cy} onDragStart={onQuadDragStart} onScale={onQuadResize} />)}
              </> })()}
            </svg>
          )}
          {shape === 'poligono' && (
            <svg viewBox="0 0 260 260" className="w-full max-w-sm text-fg">
              {(() => {
                const cx = 130, cy = 130, R = Math.min(100, poly.circumradius * 10)
                const pts = Array.from({ length: n }, (_, i) => {
                  const ang = -Math.PI / 2 + (2 * Math.PI * i) / n
                  return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) }
                })
                return (
                  <>
                    <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5" />
                    {pts.map((p, i) => <VertexHandle key={i} x={p.x} y={p.y} cx={cx} cy={cy} onDragStart={onPolyDragStart} onScale={onPolyResize} />)}
                  </>
                )
              })()}
            </svg>
          )}
          {shape === 'circulo' && (
            <svg viewBox="0 0 260 260" className="w-full max-w-sm text-fg">
              {(() => {
                const cx = 130, cy = 130, R = Math.min(115, r * 8)
                const vx = cx + R * Math.cos(-Math.PI / 2), vy = cy + R * Math.sin(-Math.PI / 2)
                return (
                  <>
                    <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path d={`M${cx},${cy} L${vx},${vy} A${R},${R} 0 ${theta > 180 ? 1 : 0} 1 ${cx + R * Math.cos(-Math.PI / 2 + (theta * Math.PI) / 180)},${cy + R * Math.sin(-Math.PI / 2 + (theta * Math.PI) / 180)} Z`} fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
                    <VertexHandle x={vx} y={vy} cx={cx} cy={cy} onDragStart={onCircleDragStart} onScale={onCircleResize} />
                  </>
                )
              })()}
            </svg>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Resultado</h2>
            {shape === 'triangulo-qualquer' && (
              <>
                <Row label="Lado c (AB)" value={num(tri.c)} />
                <Row label="Área (½·a·b·senC)" value={num(tri.area)} />
                <Row label="Perímetro" value={num(tri.perimeter)} />
                <Row label="Ângulo A" value={`${num(tri.angleA, 1)}°`} />
                <Row label="Ângulo B" value={`${num(tri.angleB, 1)}°`} />
                {showAltura && <Row label="Altura relativa a AB" value={num(tri.height)} />}
              </>
            )}
            {shape === 'triangulo-retangulo' && (
              <>
                <Row label="Hipotenusa (Pitágoras)" value={num(rt.hyp)} />
                <Row label="Área" value={num(rt.area)} />
                <Row label="Perímetro" value={num(rt.perimeter)} />
                <Row label="sen(ângulo oposto ao cateto 1)" value={num(rt.sin, 3)} />
                <Row label="cos(ângulo oposto ao cateto 1)" value={num(rt.cos, 3)} />
                <Row label="tan(ângulo oposto ao cateto 1)" value={num(rt.tan, 3)} />
                <Row label="Ângulos" value={`${num(rt.angleOppCat1, 1)}° e ${num(rt.angleOppCat2, 1)}°`} />
              </>
            )}
            {shape === 'quadrilatero' && (
              <>
                <Row label="Área" value={num(quad.area)} />
                {quad.perimeter !== null && <Row label="Perímetro" value={num(quad.perimeter)} />}
              </>
            )}
            {shape === 'poligono' && (
              <>
                <Row label="Área" value={num(poly.area)} />
                <Row label="Perímetro" value={num(poly.perimeter)} />
                <Row label="Apótema" value={num(poly.apothem)} />
                <Row label="Raio da circunferência circunscrita" value={num(poly.circumradius)} />
                <Row label="Ângulo interno" value={`${num(poly.interiorAngle, 1)}°`} />
              </>
            )}
            {shape === 'circulo' && (
              <>
                <Row label="Área do círculo" value={piMode === 'pi' ? `${num(circCoef.area)}π` : num(circ.area)} />
                <Row label="Circunferência" value={piMode === 'pi' ? `${num(circCoef.circumference)}π` : num(circ.circumference)} />
                <Row label="Área do setor" value={piMode === 'pi' ? `${num(circCoef.sectorArea)}π` : num(circ.sectorArea)} />
                <Row label="Comprimento do arco" value={piMode === 'pi' ? `${num(circCoef.arcLength)}π` : num(circ.arcLength)} />
                <Row label="Área do segmento circular" value={piMode === 'pi' ? `${num(circCoef.sectorArea)}π − ${num(circ.triangleArea)}` : num(circ.segmentArea)} />
              </>
            )}
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica do vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Figuras complexas (FUVEST/ENEM) quase sempre se resolvem traçando uma <strong>altura</strong> pra decompor em triângulos retângulos e aplicar Pitágoras ou razões trigonométricas.</li>
              <li>Setor circular: é uma "fatia de pizza" (usa o ângulo direto). Segmento circular é a fatia MENOS o triângulo formado pelo raio — não confunda os dois nas provas.</li>
              <li>Losango: área = (D×d)/2, sempre com as duas diagonais, nunca com o lado direto.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
