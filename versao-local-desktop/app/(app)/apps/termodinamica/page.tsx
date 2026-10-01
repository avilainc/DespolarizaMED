'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { type Transform, R, transform, carnotEfficiency } from '@/lib/thermodynamics'

const num = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

const TRANSFORMS: { id: Transform; label: string }[] = [
  { id: 'isotermica', label: 'Isotérmica' },
  { id: 'isobarica', label: 'Isobárica' },
  { id: 'isocorica', label: 'Isocórica' },
  { id: 'adiabatica', label: 'Adiabática' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function Piston({ V, Vmax, T }: { V: number; Vmax: number; T: number }) {
  const dots = useRef(Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 })))
  const [, force] = useState(0)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const speed = 0.006 * Math.sqrt(T / 300)
      for (const d of dots.current) {
        d.x += d.vx * speed
        d.y += d.vy * speed
        if (d.x < 0.02 || d.x > 0.98) d.vx *= -1
        if (d.y < 0.05 || d.y > 0.95) d.vy *= -1
        d.x = Math.min(0.98, Math.max(0.02, d.x))
        d.y = Math.min(0.95, Math.max(0.05, d.y))
      }
      force((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [T])

  const W = 260, H = 220
  const heightFrac = Math.min(1, Math.max(0.15, V / Vmax))
  const boxH = H * heightFrac
  const boxY = H - boxH
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full max-w-[220px] mx-auto">
      <rect x="30" y="10" width={W - 60} height={H + 10} fill="none" stroke="currentColor" strokeOpacity="0.4" className="text-fg" strokeWidth="2" />
      <rect x="32" y={boxY + 10} width={W - 64} height={boxH} fill="#38bdf8" fillOpacity="0.12" />
      {dots.current.map((d, i) => (
        <circle key={i} cx={32 + d.x * (W - 64)} cy={boxY + 10 + d.y * boxH} r="3" fill="#facc15" />
      ))}
      <rect x="26" y={boxY} width={W - 52} height="12" fill="#94a3b8" />
      <text x={W / 2} y={H + 26} fontSize="11" textAnchor="middle" className="fill-current text-fg">T = {num(T, 0)} K</text>
    </svg>
  )
}

function PVDiagram({ type, Pi, Vi, Pf, Vf }: { type: Transform; Pi: number; Vi: number; Pf: number; Vf: number }) {
  const Wd = 300, H = 200, L = 40, B = 20
  const allV = [Vi, Vf], allP = [Pi, Pf]
  const n = 40
  const curve: { V: number; P: number }[] = []
  for (let i = 0; i <= n; i++) {
    const Vv = Vi + ((Vf - Vi) * i) / n
    let Pv: number
    if (type === 'isotermica') Pv = (Pi * Vi) / Vv
    else if (type === 'isobarica') Pv = Pi
    else if (type === 'isocorica') Pv = Pi + ((Pf - Pi) * i) / n
    else Pv = Pi * Math.pow(Vi / Vv, 5 / 3)
    curve.push({ V: Vv, P: Pv })
    allV.push(Vv)
    allP.push(Pv)
  }
  const Vmax = Math.max(...allV) * 1.15, Vmin = 0
  const Pmax = Math.max(...allP) * 1.15, Pmin = 0
  const x = (v: number) => L + ((v - Vmin) / (Vmax - Vmin || 1)) * (Wd - L - 10)
  const y = (p: number) => H - B - ((p - Pmin) / (Pmax - Pmin || 1)) * (H - B - 10)
  const path = curve.map((p) => `${x(p.V).toFixed(1)},${y(p.P).toFixed(1)}`).join(' ')
  const areaPts = `${x(Vi)},${y(0)} ${path} ${x(Vf)},${y(0)}`
  return (
    <svg viewBox={`0 0 ${Wd} ${H}`} className="w-full text-fg">
      <line x1={L} y1="8" x2={L} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
      <line x1={L} y1={H - B} x2={Wd - 6} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
      <text x="6" y="14" fontSize="10" className="fill-current text-fg" fillOpacity="0.7">P</text>
      <text x={Wd - 12} y={H - 6} fontSize="10" className="fill-current text-fg" fillOpacity="0.7">V</text>
      <polygon points={areaPts} fill="#4ade80" fillOpacity="0.18" />
      <polyline points={path} fill="none" stroke="#4ade80" strokeWidth="2.4" />
      <circle cx={x(Vi)} cy={y(Pi)} r="3.5" fill="#38bdf8" />
      <circle cx={x(Vf)} cy={y(Pf)} r="3.5" fill="#f87171" />
    </svg>
  )
}

export default function ThermodynamicsPage() {
  const [type, setType] = useState<Transform>('isotermica')
  const [n, setN] = useState(1)
  const [Pi, setPi] = useState(200000)
  const [Vi, setVi] = useState(0.01)
  const [Ti, setTi] = useState((Pi * Vi) / (n * R))
  const [ratio, setRatio] = useState(2) // Vf/Vi (isotérmica/adiabática) ou Tf/Ti (isobárica) ou Pf/Pi (isocórica)

  useEffect(() => { setTi((Pi * Vi) / (n * R)) }, [Pi, Vi, n])

  // Isocórica: V constante, então P ∝ T — a razão Pf/Pi escolhida pelo aluno
  // equivale à mesma razão Tf/Ti, que é o que o motor espera para essa transformação.
  const target = type === 'isobarica' ? { T: Ti * ratio } : type === 'isocorica' ? { T: Ti * ratio } : { V: Vi * ratio }
  const res = transform(type, { P: Pi, V: Vi, T: Ti }, n, target as any)

  const [Tq, setTq] = useState(600)
  const [Tf, setTf] = useState(300)
  const eff = carnotEfficiency(Tq, Tf)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Termodinâmica</h1>
      <p className="text-muted text-sm mb-5">Transformações gasosas, 1ª Lei da Termodinâmica e Ciclo de Carnot (gás ideal monoatômico, n mol).</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Transformação</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TRANSFORMS.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)} className={`text-xs px-2 py-1.5 rounded-lg border transition ${type === t.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-faint">Pressão inicial P: {num(Pi / 1000, 0)} kPa</span>
            <input type="range" min={50000} max={500000} step={5000} value={Pi} onChange={(e) => setPi(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">Volume inicial V: {(Vi * 1000).toFixed(1)} L</span>
            <input type="range" min={0.002} max={0.03} step={0.001} value={Vi} onChange={(e) => setVi(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">mol de gás n: {n}</span>
            <input type="range" min={0.2} max={3} step={0.1} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">
              {type === 'isobarica' ? `Razão Tf/Ti: ×${ratio.toFixed(2)}` : type === 'isocorica' ? `Razão Pf/Pi: ×${ratio.toFixed(2)}` : `Razão Vf/Vi: ×${ratio.toFixed(2)}`}
            </span>
            <input type="range" min={0.3} max={3} step={0.05} value={ratio} onChange={(e) => setRatio(+e.target.value)} className="w-full accent-primary" />
          </label>
          <p className="text-faint text-xs">Ti calculada: {num(Ti, 0)} K ({num(Ti - 273, 0)} °C)</p>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <Piston V={res.final.V} Vmax={0.03 * 1.2} T={res.final.T} />
            <PVDiagram type={type} Pi={Pi} Vi={Vi} Pf={res.final.P} Vf={res.final.V} />
          </div>
          <p className="text-center text-faint text-xs mt-1">Área verde sob a curva = trabalho realizado pelo gás (W)</p>
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">1ª Lei da Termodinâmica</h2>
            <p className="text-muted text-sm font-mono mb-2">ΔU = Q − W</p>
            <Row label="Trabalho (W)" value={`${num(res.W)} J`} />
            <Row label="Calor trocado (Q)" value={`${num(res.Q)} J`} />
            <Row label="Variação de energia interna (ΔU)" value={`${num(res.dU)} J`} />
            <Row label="Temperatura final" value={`${num(res.final.T, 0)} K`} />
            <Row label="Pressão final" value={`${num(res.final.P / 1000, 1)} kPa`} />
            <Row label="Volume final" value={`${(res.final.V * 1000).toFixed(1)} L`} />
            <p className="text-faint text-xs mt-2">Convenção: W &gt; 0 = gás se expande e realiza trabalho sobre o meio; Q &gt; 0 = gás recebe calor.</p>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Ciclo de Carnot</h2>
            <label className="block mb-2">
              <span className="text-xs text-faint">T quente: {Tq} K</span>
              <input type="range" min={310} max={1000} value={Tq} onChange={(e) => setTq(+e.target.value)} className="w-full accent-primary" />
            </label>
            <label className="block mb-2">
              <span className="text-xs text-faint">T fria: {Tf} K</span>
              <input type="range" min={100} max={300} value={Tf} onChange={(e) => setTf(+e.target.value)} className="w-full accent-primary" />
            </label>
            <p className="text-muted text-sm font-mono">η = 1 − Tfria/Tquente</p>
            <p className="text-fg text-lg font-bold">η = {(eff * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica do vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Numa transformação <strong>adiabática</strong> não há troca de calor (Q = 0): a expansão rápida do gás faz ele se resfriar (ex.: desodorante aerossol fica gelado ao usar).</li>
              <li>Isocórica (volume constante): o gás não realiza trabalho (W = 0), todo o calor vira variação de energia interna.</li>
              <li>Nenhuma máquina térmica real atinge o rendimento de Carnot — ele é o limite teórico máximo entre duas temperaturas.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
