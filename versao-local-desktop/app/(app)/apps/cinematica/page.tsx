'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, RotateCcw, Lightbulb, Gauge } from 'lucide-react'
import { VEHICLES, type VehicleId, type MruvMode, kmhToMs, msToKmh, solveMRUV, mruSolve } from '@/lib/kinematics'

const num = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—')

function VehicleIcon({ id, color, x, y = 0 }: { id: VehicleId; color: string; x: number; y?: number }) {
  const common = { fill: color }
  if (id === 'moto') {
    return (
      <g transform={`translate(${x},${y})`}>
        <circle cx="-8" cy="14" r="6" fill="none" stroke={color} strokeWidth="2.5" />
        <circle cx="10" cy="14" r="6" fill="none" stroke={color} strokeWidth="2.5" />
        <path d="M-8 14 L2 2 L10 14 M2 2 L6 -4 L14 -4" fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    )
  }
  if (id === 'caminhao') {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect x="-34" y="-14" width="46" height="22" rx="2" {...common} opacity="0.9" />
        <rect x="12" y="-6" width="18" height="14" rx="2" {...common} />
        <circle cx="-22" cy="10" r="6" fill="#0f172a" stroke={color} strokeWidth="2.5" />
        <circle cx="20" cy="10" r="6" fill="#0f172a" stroke={color} strokeWidth="2.5" />
      </g>
    )
  }
  if (id === 'aviao') {
    return (
      <g transform={`translate(${x},${y - 10})`}>
        <path d="M-26 0 H22 L34 -6 L22 -2 H8 L-6 -14 L-14 -14 L-8 -2 H-20 L-26 -8 L-30 -8 L-26 0Z" {...common} />
      </g>
    )
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M-22 8 L-18 -4 Q-15 -9 -8 -9 H12 Q18 -9 20 -3 L22 8 Z" {...common} />
      <circle cx="-13" cy="10" r="6" fill="#0f172a" stroke={color} strokeWidth="2.5" />
      <circle cx="14" cy="10" r="6" fill="#0f172a" stroke={color} strokeWidth="2.5" />
    </g>
  )
}

function Graph({ title, unit, points, area, flat }: { title: string; unit: string; points: { t: number; y: number }[]; area?: boolean; flat?: boolean }) {
  const W = 520, H = 130, L = 34, B = 18, TP = 10
  const tMax = Math.max(points[points.length - 1]?.t ?? 1, 0.5)
  const ys = points.map((p) => p.y)
  const yMax = Math.max(...ys, 0.01)
  const yMin = Math.min(...ys, 0)
  const range = yMax - yMin || 1
  const x = (t: number) => L + (t / tMax) * (W - L - 10)
  const y = (v: number) => H - B - ((v - yMin) / range) * (H - B - TP)
  const path = points.map((p) => `${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')
  const zeroY = y(0)
  return (
    <div>
      <p className="text-faint text-[11px] font-semibold uppercase mb-0.5">{title} <span className="text-faint/70">({unit})</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
        <line x1={L} y1={TP} x2={L} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
        <line x1={L} y1={H - B} x2={W - 6} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
        {yMin < 0 && <line x1={L} y1={zeroY} x2={W - 6} y2={zeroY} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />}
        {area && <polygon points={`${x(0)},${zeroY} ${path} ${x(tMax)},${zeroY}`} fill="#38bdf8" fillOpacity="0.18" />}
        <polyline points={path} fill="none" stroke={flat ? '#facc15' : '#38bdf8'} strokeWidth="2.4" />
        <text x={W - 8} y={H - 4} fontSize="9" fill="currentColor" fillOpacity="0.6" textAnchor="end">t (s)</text>
      </svg>
    </div>
  )
}

function StatBox({ label, value, unit, decimals = 1, editable, unknown, onChange }: { label: string; value: number; unit: string; decimals?: number; editable: boolean; unknown: boolean; onChange?: (v: number) => void }) {
  return (
    <div className={`rounded-lg border p-2 ${unknown ? 'bg-amber-500/10 border-amber-500/40' : 'bg-app border-edge'}`}>
      <p className="text-faint">{label}</p>
      {unknown ? (
        <p className="text-amber-300 font-bold">x <span className="text-faint font-normal">({unit})</span></p>
      ) : editable ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="any"
            value={Number.isFinite(value) ? Number(value.toFixed(decimals)) : ''}
            onChange={(e) => { const n = parseFloat(e.target.value); if (!Number.isNaN(n)) onChange?.(n) }}
            className="w-full min-w-0 bg-transparent text-fg font-semibold outline-none border-b border-transparent focus:border-primary"
          />
          <span className="text-faint text-[10px] shrink-0">{unit}</span>
        </div>
      ) : (
        <p className="text-fg font-semibold">{num(value, decimals)} {unit}</p>
      )}
    </div>
  )
}

export default function KinematicsPage() {
  const [vehicle, setVehicle] = useState<VehicleId>('carro')
  const [movement, setMovement] = useState<'mru' | 'mruv'>('mruv')
  const [mode, setMode] = useState<MruvMode>('S')
  const [mruMode, setMruMode] = useState<'S' | 'v' | 't'>('S')
  const [v0Kmh, setV0Kmh] = useState(0)
  const [vKmh, setVKmh] = useState(72)
  const [a, setA] = useState(2)
  const [t, setT] = useState(6)
  const [S, setS] = useState(200)
  const [playing, setPlaying] = useState(false)
  const [simT, setSimT] = useState(0)
  const raf = useRef<number>(0)
  const last = useRef<number>(0)

  const v0 = kmhToMs(v0Kmh)
  const v = kmhToMs(vKmh)

  const mruResult = () => {
    if (mruMode === 'S') {
      const r = mruSolve(v, t)
      return { v0: v, v, a: 0, t, S: r.S, formula: 'Sorvete (equação horária do MRU)', steps: r.steps }
    }
    if (mruMode === 'v') {
      const vv = t !== 0 ? S / t : 0
      return { v0: vv, v: vv, a: 0, t, S, formula: 'Sorvete, isolando v', steps: [`v = ΔS / t`, `v = ${S.toFixed(1)} / ${t.toFixed(1)}`, `v = ${vv.toFixed(1)} m/s`] }
    }
    const tt = v !== 0 ? S / v : 0
    return { v0: v, v, a: 0, t: tt, S, formula: 'Sorvete, isolando t', steps: [`t = ΔS / v`, `t = ${S.toFixed(1)} / ${v.toFixed(1)}`, `t = ${tt.toFixed(1)} s`] }
  }

  const result = movement === 'mru' ? mruResult() : solveMRUV(mode, { v0, v, a, t, S })

  const T = Math.max(Math.abs(result.t) || 0.1, 0.3)
  const totalS = movement === 'mru' ? result.S : result.S

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(raf.current); return }
    last.current = performance.now()
    const loop = (now: number) => {
      const dt = (now - last.current) / 1000
      last.current = now
      setSimT((s) => {
        const next = s + dt
        return next > T ? 0 : next
      })
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, T])

  useEffect(() => { setSimT(0) }, [movement, mode, mruMode, v0Kmh, vKmh, a, t, S])

  const posAt = (tt: number) => (movement === 'mru' ? result.v * tt : result.v0 * tt + (result.a * tt * tt) / 2)
  const velAt = (tt: number) => (movement === 'mru' ? result.v : result.v0 + result.a * tt)

  const N = 40
  const sPoints = Array.from({ length: N + 1 }, (_, i) => ({ t: (T * i) / N, y: posAt((T * i) / N) }))
  const vPoints = Array.from({ length: N + 1 }, (_, i) => ({ t: (T * i) / N, y: velAt((T * i) / N) }))
  const aPoints = [{ t: 0, y: movement === 'mru' ? 0 : result.a }, { t: T, y: movement === 'mru' ? 0 : result.a }]

  const trackW = 560
  const maxS = Math.max(...sPoints.map((p) => p.y), 1)
  const vehX = 30 + Math.max(0, Math.min(1, posAt(simT) / maxS)) * (trackW - 60)
  const veh = VEHICLES.find((x) => x.id === vehicle)!

  const modeBtn = (m: MruvMode, label: string) => (
    <button onClick={() => setMode(m)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${mode === m ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{label}</button>
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Cinemática Interativa</h1>
      <p className="text-muted text-sm mb-5">Escolha o veículo, ajuste as variáveis e veja o movimento e os gráficos S×t, V×t e A×t em tempo real.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Veículo</p>
            <div className="flex flex-wrap gap-1.5">
              {VEHICLES.map((v) => (
                <button key={v.id} onClick={() => setVehicle(v.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${vehicle === v.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`} style={{ color: vehicle === v.id ? v.color : undefined }}>{v.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Tipo de movimento</p>
            <div className="flex gap-2">
              <button onClick={() => setMovement('mru')} className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${movement === 'mru' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>MRU (v constante)</button>
              <button onClick={() => setMovement('mruv')} className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${movement === 'mruv' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>MRUV (aceleração)</button>
            </div>
          </div>

          {movement === 'mruv' && (
            <div>
              <p className="text-faint text-xs font-semibold uppercase mb-2">O que você quer calcular?</p>
              <div className="grid grid-cols-2 gap-1.5">
                {modeBtn('S', 'Distância (ΔS)')}
                {modeBtn('v', 'Velocidade final (v)')}
                {modeBtn('a', 'Aceleração (a)')}
                {modeBtn('t', 'Tempo (t)')}
              </div>
            </div>
          )}

          {movement === 'mru' && (
            <div>
              <p className="text-faint text-xs font-semibold uppercase mb-2">O que você quer calcular?</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => setMruMode('S')} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${mruMode === 'S' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Distância (ΔS)</button>
                <button onClick={() => setMruMode('v')} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${mruMode === 'v' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Velocidade (V)</button>
                <button onClick={() => setMruMode('t')} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${mruMode === 't' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Tempo (t)</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {movement === 'mru' ? (
              <>
                {mruMode !== 'v' && (
                  <label className="block">
                    <span className="text-xs text-faint">Velocidade: {num(vKmh, 0)} km/h ({num(v, 1)} m/s)</span>
                    <input type="range" min={5} max={300} value={vKmh} onChange={(e) => setVKmh(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
                {mruMode !== 't' && (
                  <label className="block">
                    <span className="text-xs text-faint">Tempo: {num(t, 1)} s</span>
                    <input type="range" min={0.5} max={30} step={0.5} value={t} onChange={(e) => setT(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
                {mruMode !== 'S' && (
                  <label className="block">
                    <span className="text-xs text-faint">Distância ΔS: {num(S, 0)} m</span>
                    <input type="range" min={0} max={3000} step={10} value={S} onChange={(e) => setS(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
              </>
            ) : (
              <>
                {mode !== 'S' || true ? (
                  <label className="block">
                    <span className="text-xs text-faint">Velocidade inicial v0: {num(v0Kmh, 0)} km/h ({num(v0, 1)} m/s)</span>
                    <input type="range" min={0} max={250} value={v0Kmh} onChange={(e) => setV0Kmh(+e.target.value)} className="w-full accent-primary" />
                  </label>
                ) : null}
                {(mode === 'v' || mode === 'S') && (
                  <label className="block">
                    <span className="text-xs text-faint">Aceleração a: {num(a, 2)} m/s²</span>
                    <input type="range" min={-8} max={8} step={0.1} value={a} onChange={(e) => setA(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
                {(mode === 'v' || mode === 'S' || mode === 'a') && (
                  <label className="block">
                    <span className="text-xs text-faint">Tempo t: {num(t, 1)} s</span>
                    <input type="range" min={0.5} max={30} step={0.5} value={t} onChange={(e) => setT(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
                {mode === 'a' && (
                  <label className="block">
                    <span className="text-xs text-faint">Velocidade final v: {num(msToKmh(v), 0)} km/h ({num(v, 1)} m/s)</span>
                    <input type="range" min={0} max={250} value={msToKmh(v)} onChange={(e) => setVKmh(+e.target.value)} className="w-full accent-primary" />
                  </label>
                )}
                {mode === 't' && (
                  <>
                    <label className="block">
                      <span className="text-xs text-faint">Velocidade final v: {num(msToKmh(v), 0)} km/h ({num(v, 1)} m/s)</span>
                      <input type="range" min={0} max={250} value={msToKmh(v)} onChange={(e) => setVKmh(+e.target.value)} className="w-full accent-primary" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-faint">Aceleração a: {num(a, 2)} m/s²</span>
                      <input type="range" min={-8} max={8} step={0.1} value={a} onChange={(e) => setA(+e.target.value)} className="w-full accent-primary" />
                    </label>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPlaying((p) => !p)} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-3 py-2 rounded-lg transition">
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pausar' : 'Simular'}
            </button>
            <button onClick={() => { setPlaying(false); setSimT(0) }} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-edge text-muted hover:text-fg transition"><RotateCcw size={14} /></button>
          </div>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2 flex items-center gap-1.5"><Gauge size={13} /> Pista</p>
            <svg viewBox={`0 0 ${trackW} 70`} className="w-full">
              <line x1="20" y1="40" x2={trackW - 20} y2="40" stroke="#475569" strokeWidth="3" strokeDasharray="10 8" />
              <VehicleIcon id={vehicle} color={veh.color} x={vehX} y={26} />
            </svg>
            <p className="text-faint text-xs mt-1">t = {num(simT, 1)} s · ΔS percorrido = {num(posAt(simT), 1)} m</p>
          </div>
          <div className="grid gap-3">
            <Graph title="Posição × Tempo (S×t)" unit="m" points={sPoints} />
            <Graph title="Velocidade × Tempo (V×t) — área = ΔS" unit="m/s" points={vPoints} area />
            <Graph title="Aceleração × Tempo (A×t)" unit="m/s²" points={aPoints} flat />
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Resolução passo a passo</h2>
            <p className="text-primary text-sm font-semibold mb-2">{result.formula}</p>
            <div className="space-y-1 text-sm">
              {result.steps.map((s, i) => <p key={i} className={i === result.steps.length - 1 ? 'text-fg font-semibold' : 'text-muted font-mono'}>{s}</p>)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <StatBox
                label="V0" unit="m/s" value={result.v0}
                editable={movement === 'mru' ? mruMode !== 'v' : true}
                unknown={movement === 'mru' && mruMode === 'v'}
                onChange={(n) => (movement === 'mru' ? setVKmh(msToKmh(n)) : setV0Kmh(msToKmh(n)))}
              />
              <StatBox
                label="V" unit="m/s" value={result.v}
                editable={movement === 'mru' ? mruMode !== 'v' : (mode === 'a' || mode === 't')}
                unknown={movement === 'mru' ? mruMode === 'v' : mode === 'v'}
                onChange={(n) => setVKmh(msToKmh(n))}
              />
              <StatBox
                label="a" unit="m/s²" decimals={2} value={result.a}
                editable={movement === 'mruv' && (mode === 'v' || mode === 'S' || mode === 't')}
                unknown={movement === 'mruv' && mode === 'a'}
                onChange={(n) => setA(n)}
              />
              <StatBox
                label="t" unit="s" value={result.t}
                editable={movement === 'mru' ? mruMode !== 't' : (mode === 'v' || mode === 'S' || mode === 'a')}
                unknown={movement === 'mru' ? mruMode === 't' : mode === 't'}
                onChange={(n) => setT(n)}
              />
              <div className="col-span-2">
                <StatBox
                  label="ΔS" unit="m" value={result.S}
                  editable={movement === 'mru' && mruMode !== 'S'}
                  unknown={movement === 'mru' ? mruMode === 'S' : mode === 'S'}
                  onChange={(n) => setS(n)}
                />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica do vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Em ultrapassagens de caminhão, some o comprimento dos dois veículos (e a distância de segurança) ao ΔS necessário — é um erro clássico esquecer o tamanho do caminhão.</li>
              <li>Distância total de frenagem = distância de reação (tempo de reação × velocidade, MRU) + distância de frenagem propriamente dita (MRUV com a negativo).</li>
              <li>Sempre converta km/h para m/s (÷3,6) antes de aplicar as fórmulas — é a pegadinha mais comum do ENEM.</li>
              <li>No gráfico V×t, a área sob a curva é sempre o deslocamento ΔS, mesmo em MRUV (aí a área é a de um trapézio).</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
