'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, Play, Pause } from 'lucide-react'
import { SOUND_SPEED, wavelength, period, doppler } from '@/lib/waves'

const num = (n: number, d = 2) => n.toFixed(d).replace('.', ',')

type Mode = 'fundamental' | 'fenomenos' | 'qualidades' | 'doppler'
const MODES: { id: Mode; label: string }[] = [
  { id: 'fundamental', label: 'Equação fundamental' },
  { id: 'fenomenos', label: 'Fenômenos ondulatórios' },
  { id: 'qualidades', label: 'Qualidades do som' },
  { id: 'doppler', label: 'Efeito Doppler' },
]

function WaveSVG({ amp, lambdaPx, phase = 0, shape = 'seno' }: { amp: number; lambdaPx: number; phase?: number; shape?: 'seno' | 'quadrada' | 'serra' }) {
  const W = 480, H = 160, CY = H / 2
  const pts: string[] = []
  for (let x = 0; x <= W; x += 2) {
    const t = (x / lambdaPx) * Math.PI * 2 + phase
    let y = 0
    if (shape === 'seno') y = Math.sin(t)
    else if (shape === 'quadrada') y = Math.sign(Math.sin(t))
    else y = (((t / (2 * Math.PI)) % 1) * 2 - 1)
    pts.push(`${x},${(CY - y * amp).toFixed(1)}`)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      <line x1="0" y1={CY} x2={W} y2={CY} stroke="currentColor" strokeOpacity="0.25" />
      <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
      {shape === 'seno' && (
        <>
          <circle cx={lambdaPx * 0.25} cy={CY - amp} r="3" fill="#facc15" />
          <text x={lambdaPx * 0.25} y={CY - amp - 8} fontSize="10" textAnchor="middle" className="fill-current text-fg">crista</text>
          <circle cx={lambdaPx * 0.75} cy={CY + amp} r="3" fill="#f87171" />
          <text x={lambdaPx * 0.75} y={CY + amp + 16} fontSize="10" textAnchor="middle" className="fill-current text-fg">vale</text>
          <line x1={lambdaPx * 0.25} y1={CY} x2={lambdaPx * 0.25} y2={CY - amp} stroke="#facc15" strokeOpacity="0.5" strokeDasharray="2 2" />
          <text x={lambdaPx * 0.25 + 6} y={CY - amp / 2} fontSize="9" className="fill-current text-fg" fillOpacity="0.7">A</text>
          <line x1="0" y1={CY - amp - 20} x2={lambdaPx} y2={CY - amp - 20} stroke="#a78bfa" strokeWidth="1.5" />
          <text x={lambdaPx / 2} y={CY - amp - 24} fontSize="10" textAnchor="middle" className="fill-current text-fg">λ</text>
        </>
      )}
    </svg>
  )
}

function FundamentalMode() {
  const [f, setF] = useState(2)
  const [v, setV] = useState(SOUND_SPEED)
  const lambda = wavelength(v, f)
  const T = period(f)
  const lambdaPx = Math.max(40, Math.min(460, lambda * 3))
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-start">
      <div className="bg-surface border border-edge rounded-2xl p-4">
        <WaveSVG amp={40} lambdaPx={lambdaPx} />
      </div>
      <div className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-faint">Frequência f: {f} Hz</span>
            <input type="range" min={0.5} max={20} step={0.5} value={f} onChange={(e) => setF(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">Velocidade do meio v: {v} m/s</span>
            <input type="range" min={100} max={1500} step={10} value={v} onChange={(e) => setV(+e.target.value)} className="w-full accent-primary" />
          </label>
        </div>
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <p className="text-muted text-sm font-mono mb-2">v = λ·f</p>
          <p className="text-fg text-sm font-mono mb-3">λ = v/f = {v}/{f} = {num(lambda)} m</p>
          <p className="text-fg text-sm">Período T = 1/f = {num(T, 3)} s</p>
        </div>
        <TipBox items={['Quando uma onda muda de meio (refração), a frequência permanece inalterada — só a velocidade e o comprimento de onda mudam.']} />
      </div>
    </div>
  )
}

const PHENOMENA = [
  { id: 'reflexao', label: 'Reflexão', text: 'A onda muda de direção ao encontrar um obstáculo, voltando para o meio de origem. Ângulo de incidência = ângulo de reflexão. Exemplo: eco.' },
  { id: 'refracao', label: 'Refração', text: 'A onda muda de meio e, com isso, muda de velocidade e comprimento de onda — mas a frequência permanece a mesma. Exemplo: luz entrando na água.' },
  { id: 'difracao', label: 'Difração', text: 'A onda contorna obstáculos ou passa por fendas, espalhando-se. É mais perceptível quando o obstáculo/fenda tem tamanho comparável ao comprimento de onda. Exemplo: ouvir som atrás de uma parede.' },
  { id: 'interferencia', label: 'Interferência', text: 'Duas ondas se sobrepõem: construtiva (cristas coincidem, amplitude soma) ou destrutiva (crista com vale, amplitude cancela). Exemplo: fones com cancelamento de ruído.' },
]

function ReflectionDiagram() {
  const W = 300, H = 200, wallY = 150, cx = W / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto text-fg">
      <rect x="0" y={wallY} width={W} height={H - wallY} fill="currentColor" fillOpacity="0.15" />
      <line x1="0" y1={wallY} x2={W} y2={wallY} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      <line x1={cx} y1={wallY - 80} x2={cx} y2={wallY + 15} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
      <text x={cx + 5} y={wallY - 68} fontSize="9" className="fill-current text-faint">normal</text>
      <line x1={cx - 75} y1={wallY - 65} x2={cx} y2={wallY} stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowRefBlue)" />
      <text x={cx - 95} y={wallY - 60} fontSize="10" fill="#38bdf8">incidente</text>
      <line x1={cx} y1={wallY} x2={cx + 75} y2={wallY - 65} stroke="#f87171" strokeWidth="2.5" markerEnd="url(#arrowRefRed)" />
      <text x={cx + 20} y={wallY - 60} fontSize="10" fill="#f87171">refletida</text>
      <text x={cx - 32} y={wallY - 16} fontSize="9" className="fill-current text-faint">θᵢ</text>
      <text x={cx + 18} y={wallY - 16} fontSize="9" className="fill-current text-faint">θᵣ</text>
      <defs>
        <marker id="arrowRefBlue" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#38bdf8" /></marker>
        <marker id="arrowRefRed" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#f87171" /></marker>
      </defs>
    </svg>
  )
}

function RefractionDiagram() {
  const W = 300, H = 200, ifY = 100, cx = W / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto text-fg">
      <rect x="0" y="0" width={W} height={ifY} fill="#38bdf8" fillOpacity="0.06" />
      <rect x="0" y={ifY} width={W} height={H - ifY} fill="#38bdf8" fillOpacity="0.22" />
      <line x1="0" y1={ifY} x2={W} y2={ifY} stroke="currentColor" strokeOpacity="0.4" />
      <line x1={cx} y1={ifY - 55} x2={cx} y2={ifY + 55} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
      <text x="8" y="16" fontSize="10" className="fill-current text-faint">meio 1 (ar) — mais rápido</text>
      <text x="8" y={H - 8} fontSize="10" className="fill-current text-faint">meio 2 (água) — mais lento</text>
      <line x1={cx - 55} y1={ifY - 55} x2={cx} y2={ifY} stroke="#facc15" strokeWidth="2.5" markerEnd="url(#arrowRefr)" />
      <line x1={cx} y1={ifY} x2={cx + 32} y2={ifY + 55} stroke="#facc15" strokeWidth="2.5" markerEnd="url(#arrowRefr)" />
      <defs><marker id="arrowRefr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#facc15" /></marker></defs>
    </svg>
  )
}

function DiffractionDiagram() {
  const W = 300, H = 200, wallX = 150, gapY1 = 85, gapY2 = 115, gapMid = (gapY1 + gapY2) / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto text-fg">
      {[0, 1, 2, 3].map((i) => <line key={i} x1={16 + i * 22} y1="8" x2={16 + i * 22} y2="192" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="2" />)}
      <rect x={wallX} y="0" width="10" height={gapY1} fill="currentColor" fillOpacity="0.5" />
      <rect x={wallX} y={gapY2} width="10" height={H - gapY2} fill="currentColor" fillOpacity="0.5" />
      {[18, 38, 58, 78].map((r) => (
        <path key={r} d={`M${wallX + 10},${gapMid - r} A${r},${r} 0 0,1 ${wallX + 10},${gapMid + r}`} fill="none" stroke="#4ade80" strokeOpacity="0.65" strokeWidth="1.5" />
      ))}
      <text x={wallX - 40} y="20" fontSize="10" className="fill-current text-faint">ondas planas</text>
      <text x={wallX + 40} y="20" fontSize="10" className="fill-current text-faint">se espalham</text>
    </svg>
  )
}

function PhenomenaMode() {
  const [sel, setSel] = useState(PHENOMENA[0].id)
  const p = PHENOMENA.find((x) => x.id === sel)!
  return (
    <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] gap-5 items-start">
      <div className="bg-surface border border-edge rounded-2xl p-4 space-y-1.5">
        {PHENOMENA.map((ph) => (
          <button key={ph.id} onClick={() => setSel(ph.id)} className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition ${sel === ph.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{ph.label}</button>
        ))}
      </div>
      <div className="bg-surface border border-edge rounded-2xl p-6">
        <h2 className="text-fg font-bold text-lg mb-3">{p.label}</h2>
        <p className="text-fg text-sm leading-relaxed mb-4">{p.text}</p>
        {sel === 'reflexao' && <ReflectionDiagram />}
        {sel === 'refracao' && <RefractionDiagram />}
        {sel === 'difracao' && <DiffractionDiagram />}
        {sel === 'interferencia' && (
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-faint text-xs mb-1 text-center">Construtiva</p><WaveSVG amp={40} lambdaPx={200} /></div>
            <div><p className="text-faint text-xs mb-1 text-center">Destrutiva</p><WaveSVG amp={2} lambdaPx={200} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

function QualitiesMode() {
  const [f, setF] = useState(5)
  const [amp, setAmp] = useState(40)
  const [shape, setShape] = useState<'seno' | 'quadrada' | 'serra'>('seno')
  const lambdaPx = Math.max(30, 480 / f)
  return (
    <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-start">
      <div className="bg-surface border border-edge rounded-2xl p-4">
        <WaveSVG amp={amp} lambdaPx={lambdaPx} shape={shape} />
      </div>
      <div className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-faint">Altura (frequência): {f} — {f < 4 ? 'grave' : f > 12 ? 'agudo' : 'médio'}</span>
            <input type="range" min={1} max={20} value={f} onChange={(e) => setF(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">Intensidade (amplitude): {amp} — {amp < 20 ? 'fraco' : amp > 60 ? 'forte' : 'médio'}</span>
            <input type="range" min={5} max={75} value={amp} onChange={(e) => setAmp(+e.target.value)} className="w-full accent-primary" />
          </label>
          <div>
            <span className="text-xs text-faint block mb-1">Timbre (forma da onda)</span>
            <div className="flex gap-2">
              {(['seno', 'quadrada', 'serra'] as const).map((s) => (
                <button key={s} onClick={() => setShape(s)} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border capitalize transition ${shape === s ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-edge"><td className="py-1.5 text-muted">Altura</td><td className="text-right text-fg">Grave ↔ Agudo = Frequência</td></tr>
              <tr className="border-b border-edge"><td className="py-1.5 text-muted">Intensidade</td><td className="text-right text-fg">Fraco ↔ Forte = Amplitude</td></tr>
              <tr><td className="py-1.5 text-muted">Timbre</td><td className="text-right text-fg">Formato da onda</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DOPPLER_CY = 80
const DOPPLER_OBSERVER_X = 250
const DOPPLER_MIN_X = 40
const DOPPLER_MAX_X = 460
const DOPPLER_WAVE_SPEED = 120 // px/s
const DOPPLER_EMIT_INTERVAL = 0.22 // s
const DOPPLER_MAX_AGE = 4.2 // s

function DopplerMode() {
  const [f, setF] = useState(500)
  const [vs, setVs] = useState(30)
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const xRef = useRef(DOPPLER_MIN_X)
  const dirRef = useRef<1 | -1>(1)
  const timeRef = useRef(0)
  const lastEmitRef = useRef(0)
  const pulsesRef = useRef<{ x: number; t: number; dir: 1 | -1 }[]>([])
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(raf.current); return }
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      timeRef.current += dt
      const speedPx = 1.5 * vs
      xRef.current += dirRef.current * speedPx * dt
      if (xRef.current > DOPPLER_MAX_X) { xRef.current = DOPPLER_MAX_X; dirRef.current = -1 }
      if (xRef.current < DOPPLER_MIN_X) { xRef.current = DOPPLER_MIN_X; dirRef.current = 1 }
      if (timeRef.current - lastEmitRef.current > DOPPLER_EMIT_INTERVAL) {
        lastEmitRef.current = timeRef.current
        pulsesRef.current = [
          ...pulsesRef.current.filter((p) => timeRef.current - p.t < DOPPLER_MAX_AGE),
          { x: xRef.current, t: timeRef.current, dir: dirRef.current },
        ]
      }
      forceTick((n) => n + 1)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, vs])

  const srcX = xRef.current
  const dir = dirRef.current
  const approaching = (srcX < DOPPLER_OBSERVER_X && dir === 1) || (srcX > DOPPLER_OBSERVER_X && dir === -1)
  const fFront = doppler(f, SOUND_SPEED, vs, true)
  const fBack = doppler(f, SOUND_SPEED, vs, false)

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-start">
      <div className="bg-surface border border-edge rounded-2xl p-4">
        <svg viewBox="0 0 500 160" className="w-full text-fg">
          <line x1="10" y1={DOPPLER_CY} x2="490" y2={DOPPLER_CY} stroke="currentColor" strokeOpacity="0.2" />
          {pulsesRef.current.map((p, i) => {
            const age = timeRef.current - p.t
            const radius = age * DOPPLER_WAVE_SPEED
            if (radius < 2) return null
            const opacity = Math.max(0, 0.75 - age / DOPPLER_MAX_AGE)
            const sweepFront = p.dir === 1 ? 1 : 0
            const sweepBack = p.dir === 1 ? 0 : 1
            const cx = p.x
            return (
              <g key={i}>
                <path d={`M ${cx},${DOPPLER_CY - radius} A ${radius},${radius} 0 0,${sweepFront} ${cx},${DOPPLER_CY + radius}`} fill="none" stroke="#f87171" strokeOpacity={opacity} strokeWidth="1.5" />
                <path d={`M ${cx},${DOPPLER_CY - radius} A ${radius},${radius} 0 0,${sweepBack} ${cx},${DOPPLER_CY + radius}`} fill="none" stroke="#38bdf8" strokeOpacity={opacity} strokeWidth="1.5" />
              </g>
            )
          })}
          <g transform={`translate(${DOPPLER_OBSERVER_X},${DOPPLER_CY})`}>
            <circle r="9" fill="#4ade80" />
            <text x="0" y="-16" fontSize="10" textAnchor="middle" className="fill-current text-fg">observador</text>
          </g>
          <g transform={`translate(${srcX},${DOPPLER_CY}) scale(${dir === 1 ? -1 : 1},1)`}>
            <text x="0" y="7" fontSize="22" textAnchor="middle">🚑</text>
          </g>
          <text x={srcX} y={DOPPLER_CY - 22} fontSize="10" textAnchor="middle" className="fill-current text-fg">ambulância</text>
        </svg>
        <div className="flex items-center justify-center gap-4 mt-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-faint"><span className="w-3 h-0.5 rounded-full bg-red-400" /> ondas da frente (comprimidas)</span>
          <span className="inline-flex items-center gap-1.5 text-faint"><span className="w-3 h-0.5 rounded-full bg-sky-400" /> ondas de trás (espaçadas)</span>
        </div>
        <div className="flex gap-2 justify-center mt-2">
          <button onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition">
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pausar' : 'Simular'}
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4 space-y-3">
          <label className="block">
            <span className="text-xs text-faint">Frequência emitida f: {f} Hz</span>
            <input type="range" min={100} max={2000} step={10} value={f} onChange={(e) => setF(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">Velocidade da fonte vs: {vs} m/s</span>
            <input type="range" min={5} max={100} value={vs} onChange={(e) => setVs(+e.target.value)} className="w-full accent-primary" />
          </label>
        </div>
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <p className="text-muted text-sm font-mono mb-2">f' = f · v / (v ∓ vs)</p>
          <p className={`text-sm mb-1 ${approaching ? 'text-fg font-semibold' : 'text-muted'}`}>Aproximando: f' = {num(fFront, 1)} Hz (mais agudo)</p>
          <p className={`text-sm ${!approaching ? 'text-fg font-semibold' : 'text-muted'}`}>Afastando: f' = {num(fBack, 1)} Hz (mais grave)</p>
        </div>
        <TipBox items={['A ambulância parece mais aguda quando se aproxima (comprimento de onda encurtado à frente) e mais grave quando se afasta (comprimento de onda alongado atrás).']} />
      </div>
    </div>
  )
}

function TipBox({ items }: { items: string[] }) {
  return (
    <div className="bg-surface border border-edge rounded-2xl p-4">
      <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Caiu no ENEM</h3>
      <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}

export default function WavesPage() {
  const [mode, setMode] = useState<Mode>('fundamental')
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Ondulatória e Acústica</h1>
      <p className="text-muted text-sm mb-5">Equação fundamental, fenômenos ondulatórios, qualidades do som e efeito Doppler.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-2 rounded-xl border text-sm transition ${mode === m.id ? 'border-primary bg-primary/10 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{m.label}</button>
        ))}
      </div>

      {mode === 'fundamental' && <FundamentalMode />}
      {mode === 'fenomenos' && <PhenomenaMode />}
      {mode === 'qualidades' && <QualitiesMode />}
      {mode === 'doppler' && <DopplerMode />}
    </div>
  )
}
