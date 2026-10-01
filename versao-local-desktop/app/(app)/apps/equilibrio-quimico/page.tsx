'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Snowflake, Minus, Plus, RotateCcw, Zap, Lightbulb, ArrowRight, ArrowLeft as ArrowL } from 'lucide-react'
import { EQ_REACTIONS, quotient, kAt, step, relax, type EqReaction, type SimState } from '@/lib/equilibrium'

type Sample = { t: number; c: SimState }
type Effect = { title: string; shift: 'right' | 'left' | 'none'; rule: string; Q: number; K: number }

const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 1 ? n.toFixed(2) : Math.abs(n) >= 0.01 ? n.toFixed(3) : n.toExponential(1)).replace('.', ',')

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function bloodPh(c: SimState) {
  return 3 - Math.log10(Math.max(c.H, 1e-12))
}

function tubeTint(r: EqReaction, c: SimState, c0: SimState): string {
  if (r.id === 'no2') return `rgba(180,83,9,${Math.min(0.9, (c.NO2 / (c0.NO2 * 1.6 || 1)) * 0.75)})`
  if (r.id === 'fescn') {
    const tot = c.Fe + c.FeSCN || 1
    const f = c.FeSCN / tot
    const yellow = [250, 204, 21], red = [185, 28, 28]
    const mix = yellow.map((v, i) => Math.round(v + (red[i] - v) * f))
    const alpha = Math.min(0.92, 0.25 + ((c.Fe + c.FeSCN) / 0.55) * 0.5 + f * 0.25)
    return `rgba(${mix[0]},${mix[1]},${mix[2]},${alpha})`
  }
  if (r.id === 'blood') {
    const ph = bloodPh(c)
    const col = ph < 7.0 ? '#f97316' : ph < 7.35 ? '#eab308' : ph <= 7.45 ? '#22c55e' : ph <= 7.8 ? '#06b6d4' : '#3b82f6'
    return col + 'cc'
  }
  return 'rgba(148,163,184,0.10)'
}

function Tube({ r, c, c0, level, volume }: { r: EqReaction; c: SimState; c0: SimState; level: number; volume: number }) {
  const gas = r.pressure
  const top = gas ? Math.max(70, 262 - 100 * volume) : 96
  const maxC = Math.max(...r.species.map((s) => c0[s.id] || 0), 1e-9)
  const dots: { x: number; y: number; col: string }[] = []
  if (r.id !== 'blood') {
    r.species.forEach((s, si) => {
      const n = Math.min(45, Math.round((c[s.id] / maxC) * 22))
      for (let k = 0; k < n; k++) {
        dots.push({ x: 68 + hash(si * 97 + k * 3.1) * 84, y: top + 8 + hash(si * 53 + k * 7.7) * (250 - top), col: s.color })
      }
    })
  }
  return (
    <svg viewBox="0 0 260 300" className="w-full max-w-[260px] mx-auto text-fg">
      <defs>
        <clipPath id="tubeClip"><path d="M60 24 V222 Q60 262 110 262 Q160 262 160 222 V24 Z" /></clipPath>
      </defs>
      <g clipPath="url(#tubeClip)">
        <rect x="58" y={top} width="104" height={270 - top} fill={tubeTint(r, c, c0)} style={{ transition: 'all .5s' }} />
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3.2" fill={d.col} stroke="rgba(0,0,0,.35)" strokeWidth="0.5" />)}
      </g>
      <path d="M60 24 V222 Q60 262 110 262 Q160 262 160 222 V24" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3" />
      {gas && (
        <>
          <rect x="66" y={top - 8} width="88" height="8" rx="2" fill="#94a3b8" style={{ transition: 'all .5s' }} />
          <rect x="106" y={20} width="8" height={top - 26} fill="#64748b" style={{ transition: 'all .5s' }} />
          <rect x="90" y="14" width="40" height="8" rx="3" fill="#94a3b8" />
          <text x="180" y={top + 4} fontSize="11" fill="currentColor" fillOpacity="0.7">V = {volume === 1 ? '1×' : volume < 1 ? '½×' : '2×'}</text>
        </>
      )}
      {level > 0 && [0, 1].slice(0, level).map((i) => <path key={i} d={`M${90 + i * 40} 296 C${80 + i * 40} 282 ${86 + i * 40} 274 ${90 + i * 40} 266 C${94 + i * 40} 274 ${100 + i * 40} 282 ${90 + i * 40} 296Z`} fill="#fb923c" />)}
      {level < 0 && [0, 1].slice(0, -level).map((i) => <rect key={i} x={78 + i * 40} y="274" width="26" height="22" rx="4" fill="#bae6fd" fillOpacity="0.85" />)}
    </svg>
  )
}

// Seta dupla de equilíbrio (⇌): o lado do deslocamento atual acende forte, o outro fica apagado.
function EquilibriumArrow({ shift }: { shift: 'left' | 'right' | 'none' | undefined }) {
  const activeColor = '#facc15'
  const dimColor = '#475569'
  const topActive = shift === 'right'
  const botActive = shift === 'left'
  return (
    <svg viewBox="0 0 90 34" className="shrink-0" style={{ width: 64, height: 24 }}>
      <defs>
        <marker id="eqArrowTop" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={topActive ? activeColor : dimColor} />
        </marker>
        <marker id="eqArrowBot" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={botActive ? activeColor : dimColor} />
        </marker>
      </defs>
      <line x1="6" y1="11" x2="78" y2="11" stroke={topActive ? activeColor : dimColor} strokeWidth={topActive ? 3.5 : 2} markerEnd="url(#eqArrowTop)" style={{ filter: topActive ? `drop-shadow(0 0 3px ${activeColor})` : undefined, transition: 'all .3s' }} />
      <line x1="84" y1="23" x2="12" y2="23" stroke={botActive ? activeColor : dimColor} strokeWidth={botActive ? 3.5 : 2} markerEnd="url(#eqArrowBot)" style={{ filter: botActive ? `drop-shadow(0 0 3px ${activeColor})` : undefined, transition: 'all .3s' }} />
    </svg>
  )
}

function Chart({ r, samples, marks, c0 }: { r: EqReaction; samples: Sample[]; marks: { t: number; label: string }[]; c0: SimState }) {
  const W = 620, H = 200, L = 36, B = 22
  const tMax = samples.length ? samples[samples.length - 1].t : 1
  const tMin = Math.max(0, tMax - 45)
  const win = samples.filter((s) => s.t >= tMin)
  const rel = (s: Sample, id: string) => (c0[id] > 1e-12 ? s.c[id] / c0[id] : s.c[id] / Math.max(...r.species.map((sp) => c0[sp.id] || 0), 1e-9))
  const yMax = Math.max(1.5, ...win.flatMap((s) => r.species.map((sp) => rel(s, sp.id)))) * 1.08
  const x = (t: number) => L + ((t - tMin) / Math.max(tMax - tMin, 8)) * (W - L - 8)
  const y = (v: number) => H - B - (v / yMax) * (H - B - 10)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      <line x1={L} y1="8" x2={L} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
      <line x1={L} y1={H - B} x2={W - 6} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
      <line x1={L} y1={y(1)} x2={W - 6} y2={y(1)} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" />
      <text x="4" y={y(1) + 4} fontSize="10" fill="currentColor" fillOpacity="0.6">1,0</text>
      <text x={W / 2} y={H - 5} fontSize="10" fill="currentColor" fillOpacity="0.6" textAnchor="middle">tempo</text>
      <text x="4" y="14" fontSize="10" fill="currentColor" fillOpacity="0.6">[ ] rel.</text>
      {marks.filter((m) => m.t >= tMin).map((m, i) => (
        <g key={i}>
          <line x1={x(m.t)} y1="8" x2={x(m.t)} y2={H - B} stroke="#facc15" strokeOpacity="0.6" strokeDasharray="3 3" />
          <text x={x(m.t) + 3} y={14 + (i % 3) * 11} fontSize="9" fill="#facc15">{m.label}</text>
        </g>
      ))}
      {r.species.map((s) => (
        <polyline key={s.id} fill="none" stroke={s.color === '#e5e7eb' ? '#cbd5e1' : s.color} strokeWidth="2.2" points={win.map((p) => `${x(p.t).toFixed(1)},${y(rel(p, s.id)).toFixed(1)}`).join(' ')} />
      ))}
    </svg>
  )
}

export default function EquilibriumPage() {
  const [rid, setRid] = useState(EQ_REACTIONS[1].id)
  const r = EQ_REACTIONS.find((x) => x.id === rid)!
  const [, setTick] = useState(0)
  const sim = useRef<{ c: SimState; t: number; samples: Sample[]; marks: { t: number; label: string }[]; level: number; volume: number; catalyst: boolean; c0: SimState; stableTicks: number }>(null as any)
  const [paused, setPaused] = useState(false)
  const [effect, setEffect] = useState<Effect | null>(null)
  const [catalyst, setCatalyst] = useState(false)
  const [level, setLevel] = useState(0)
  const [volume, setVolume] = useState(1)

  const init = (rx: EqReaction) => {
    const c0 = relax(rx, rx.init, rx.K0)
    sim.current = { c: c0, t: 0, samples: [{ t: 0, c: c0 }], marks: [], level: 0, volume: 1, catalyst: false, c0, stableTicks: 0 }
    setEffect(null); setCatalyst(false); setLevel(0); setVolume(1); setPaused(false)
    setTick((n) => n + 1)
  }

  useEffect(() => { init(r) }, [rid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quando as concentrações param de mudar (equilíbrio atingido), a simulação
  // se pausa sozinha depois de ~2s parado — evita rodar a animação à toa
  // consumindo processamento. Qualquer perturbação (mark()) acorda ela de novo.
  const STABLE_LIMIT = 20
  useEffect(() => {
    const id = setInterval(() => {
      const s = sim.current && r.species.every((sp) => sp.id in sim.current.c) ? sim.current : null
      if (!s) return
      if (s.stableTicks >= STABLE_LIMIT) {
        setPaused(true)
        return
      }
      const rx = EQ_REACTIONS.find((x) => x.id === rid)!
      const K = kAt(rx, s.level)
      const before = s.c
      let c = s.c
      const rate = s.catalyst ? 6 : 1
      for (let i = 0; i < 25; i++) c = step(rx, c, K, rate, 0.004)
      let maxRel = 0
      for (const sp of rx.species) {
        const ref = Math.max(Math.abs(before[sp.id]), 1e-9)
        maxRel = Math.max(maxRel, Math.abs(c[sp.id] - before[sp.id]) / ref)
      }
      s.stableTicks = maxRel < 0.0006 ? s.stableTicks + 1 : 0
      s.c = c
      s.t += 0.1
      s.samples.push({ t: s.t, c })
      if (s.samples.length > 900) s.samples.shift()
      setTick((n) => n + 1)
    }, 100)
    return () => clearInterval(id)
  }, [rid])

  const s = sim.current && r.species.every((sp) => sp.id in sim.current.c) ? sim.current : null
  const K = s ? kAt(r, s.level) : r.K0
  const Q = s ? quotient(r, s.c) : 0

  const decide = (Qn: number, Kn: number) => (Qn < Kn * 0.97 ? 'right' : Qn > Kn * 1.03 ? 'left' : 'none') as Effect['shift']

  const mark = (label: string) => { s.marks.push({ t: s.t, label }); s.stableTicks = 0; setPaused(false) }

  const changeConc = (id: string, dir: 1 | -1) => {
    const sp = r.species.find((x) => x.id === id)!
    const before = s.c[id]
    const after = Math.max(0, before + dir * sp.step)
    s.c = { ...s.c, [id]: after }
    const Qn = quotient(r, s.c)
    const Kn = kAt(r, s.level)
    const isReactant = sp.nu < 0
    const verb = dir > 0 ? 'Adicionar' : 'Remover'
    const shift = decide(Qn, Kn)
    let rule = ''
    if (dir > 0) rule = `Aumentar a concentração de ${sp.label} faz o sistema tentar consumi-lo: o equilíbrio se desloca para o lado oposto ao dele (${isReactant ? 'direita, produtos' : 'esquerda, reagentes'}).`
    else rule = `Diminuir a concentração de ${sp.label} faz o sistema tentar repô-lo: o equilíbrio se desloca para o lado dele (${isReactant ? 'esquerda, reagentes' : 'direita, produtos'}).`
    mark(`${dir > 0 ? '+' : '−'}${sp.label.split(' ')[0]}`)
    setEffect({ title: `${verb} ${sp.label}`, shift, rule, Q: Qn, K: Kn })
  }

  const changeTemp = (delta: number) => {
    const newLevel = Math.max(-2, Math.min(2, s.level + delta))
    if (newLevel === s.level) return
    s.level = newLevel
    setLevel(newLevel)
    const Kn = kAt(r, newLevel)
    const Qn = quotient(r, s.c)
    const heating = delta > 0
    const towardRight = (heating && r.dH === 'endo') || (!heating && r.dH === 'exo')
    mark(heating ? 'aquecer' : 'resfriar')
    setEffect({
      title: heating ? 'Aquecer (bico de Bunsen)' : 'Resfriar (banho de gelo)',
      shift: decide(Qn, Kn),
      rule: `${heating ? 'Aumentar' : 'Diminuir'} a temperatura favorece o sentido ${heating ? 'endotérmico' : 'exotérmico'}. Como a reação direta é ${r.dH === 'exo' ? 'exotérmica' : 'endotérmica'}, o equilíbrio se desloca para a ${towardRight ? 'direita (produtos)' : 'esquerda (reagentes)'}. A temperatura é a única perturbação que muda o valor de K.`,
      Q: Qn, K: Kn,
    })
  }

  const changeVolume = (factor: number) => {
    const newV = factor
    if (newV === s.volume) return
    const scale = s.volume / newV
    const c = { ...s.c }
    for (const sp of r.species) if (sp.gas) c[sp.id] = c[sp.id] * scale
    s.c = c
    const compress = newV < s.volume
    s.volume = newV
    setVolume(newV)
    const Qn = quotient(r, c)
    const Kn = kAt(r, s.level)
    let rule: string
    if (r.gasDelta === 0) rule = 'Há o mesmo número de mols de gás nos dois lados: a pressão não desloca o equilíbrio.'
    else {
      const fewerRight = r.gasDelta < 0
      const towardRight = compress ? fewerRight : !fewerRight
      rule = `${compress ? 'Aumentar' : 'Diminuir'} a pressão (${compress ? 'menor' : 'maior'} volume) favorece o lado com ${compress ? 'menos' : 'mais'} mols de gás: ${towardRight ? 'direita (produtos)' : 'esquerda (reagentes)'}. K não muda.`
    }
    mark(compress ? 'comprimir' : 'expandir')
    setEffect({ title: compress ? 'Comprimir (↑ pressão)' : 'Expandir (↓ pressão)', shift: r.gasDelta === 0 ? 'none' : decide(Qn, Kn), rule, Q: Qn, K: Kn })
  }

  const toggleCatalyst = () => {
    const on = !catalyst
    setCatalyst(on)
    s.catalyst = on
    if (on) {
      mark('catalisador')
      setEffect({ title: 'Adicionar catalisador', shift: 'none', rule: 'O catalisador acelera igualmente a reação direta e a inversa: o equilíbrio é atingido mais rápido, mas as concentrações no equilíbrio e o valor de K não mudam.', Q, K })
    }
  }

  const ph = s && r.id === 'blood' ? bloodPh(s.c) : null
  const legend = useMemo(() => r.species, [r])

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Equilíbrio Químico e Le Chatelier</h1>
      <p className="text-muted text-sm mb-4">Perturbe o equilíbrio e veja concentrações, cor e deslocamento em tempo real.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {EQ_REACTIONS.map((x) => (
          <button key={x.id} onClick={() => setRid(x.id)} className={`px-3 py-2 rounded-xl border text-sm text-left transition ${rid === x.id ? 'border-primary bg-primary/10 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{x.name}</button>
        ))}
      </div>
      <p className="text-fg text-sm font-mono mb-4">{r.equation}</p>

      {s && (
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,1.1fr)] gap-5 items-start">
          <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
            <div>
              <h2 className="text-fg font-bold mb-2">Concentração</h2>
              <div className="space-y-1.5">
                {r.species.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0 border border-white/20" style={{ background: sp.color }} />
                    <span className="flex-1 text-fg text-sm">{sp.label}</span>
                    <button onClick={() => changeConc(sp.id, -1)} className="w-7 h-7 rounded-md border border-edge text-muted hover:text-fg flex items-center justify-center" aria-label={`Remover ${sp.label}`}><Minus size={13} /></button>
                    <button onClick={() => changeConc(sp.id, 1)} className="w-7 h-7 rounded-md border border-edge text-muted hover:text-fg flex items-center justify-center" aria-label={`Adicionar ${sp.label}`}><Plus size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-fg font-bold mb-2">Temperatura</h2>
              <div className="flex gap-2">
                <button onClick={() => changeTemp(1)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-2 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-fg hover:bg-orange-500/20 transition"><Flame size={14} className="text-orange-400" /> Aquecer</button>
                <button onClick={() => changeTemp(-1)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-2 py-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-fg hover:bg-sky-500/20 transition"><Snowflake size={14} className="text-sky-300" /> Resfriar</button>
              </div>
              <p className="text-faint text-xs mt-1">Nível: {level > 0 ? `+${level} (aquecido)` : level < 0 ? `${level} (gelo)` : 'ambiente'}</p>
            </div>
            {r.pressure && (
              <div>
                <h2 className="text-fg font-bold mb-2">Seringa (pressão / volume)</h2>
                <div className="flex gap-2">
                  <button onClick={() => changeVolume(volume === 2 ? 1 : 0.5)} className="flex-1 text-xs px-2 py-2 rounded-lg border border-edge text-fg hover:border-primary/50 transition">Comprimir (↑ P)</button>
                  <button onClick={() => changeVolume(volume === 0.5 ? 1 : 2)} className="flex-1 text-xs px-2 py-2 rounded-lg border border-edge text-fg hover:border-primary/50 transition">Expandir (↓ P)</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={toggleCatalyst} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-2 py-2 rounded-lg border transition ${catalyst ? 'border-violet-400 bg-violet-500/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}><Zap size={14} /> {catalyst ? 'Catalisador ligado' : 'Adicionar catalisador'}</button>
              <button onClick={() => init(r)} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-edge text-muted hover:text-fg transition"><RotateCcw size={13} /> Reiniciar</button>
            </div>
          </section>

          <section className="bg-surface border border-edge rounded-2xl p-4">
            <div className="grid sm:grid-cols-[minmax(0,260px)_1fr] gap-3 items-center">
              <div>
                <Tube r={r} c={s.c} c0={s.c0} level={level} volume={volume} />
                {ph !== null && (
                  <p className="text-center text-fg text-sm mt-1">pH ≈ <strong>{ph.toFixed(2).replace('.', ',')}</strong> · {ph < 7.35 ? 'acidose' : ph > 7.45 ? 'alcalose' : 'normal'}</p>
                )}
              </div>
              <div className="text-sm space-y-1.5">
                {r.species.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: sp.color }} />
                    <span className="text-muted flex-1">[{sp.label}]</span>
                    <span className="text-fg font-semibold tabular-nums">{fmt(s.c[sp.id])} {r.units}</span>
                  </div>
                ))}
                <div className="border-t border-edge pt-1.5 mt-1.5 text-muted">
                  <p>Q = <strong className="text-fg">{fmt(Q)}</strong></p>
                  <p>K = <strong className="text-fg">{fmt(K)}</strong> {Math.abs(Q / K - 1) < 0.03 ? <span className="text-emerald-400">· Q ≈ K: equilíbrio</span> : Q < K ? <span className="text-sky-300">· Q &lt; K: favorece produtos</span> : <span className="text-amber-300">· Q &gt; K: favorece reagentes</span>}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-edge pt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-faint text-xs font-semibold uppercase">Concentração × tempo (relativa ao equilíbrio inicial)</p>
                {paused && <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Estável — simulação pausada</span>}
              </div>
              <Chart r={r} samples={s.samples} marks={s.marks} c0={s.c0} />
              <div className="flex flex-wrap gap-3 mt-1">{legend.map((sp) => <span key={sp.id} className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="w-4 h-0.5" style={{ background: sp.color === '#e5e7eb' ? '#cbd5e1' : sp.color }} />{sp.label}</span>)}</div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-surface border border-edge rounded-2xl p-3">
              <p className="text-faint text-[10px] font-semibold uppercase mb-1.5">Equação e deslocamento</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-fg text-xs font-mono">{r.equation}</span>
                <EquilibriumArrow shift={effect?.shift} />
              </div>
            </div>
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-2">Análise de Le Chatelier</h2>
              {!effect ? (
                <p className="text-muted text-sm">Aplique uma perturbação (concentração, temperatura, pressão ou catalisador) para ver o deslocamento.</p>
              ) : (
                <>
                  <p className="text-fg text-sm font-semibold mb-2">{effect.title}</p>
                  <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg mb-2 ${effect.shift === 'right' ? 'bg-emerald-500/15 text-emerald-400' : effect.shift === 'left' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-500/15 text-slate-300'}`}>
                    {effect.shift === 'right' ? <>Direita / Produtos <ArrowRight size={16} /></> : effect.shift === 'left' ? <><ArrowL size={16} /> Esquerda / Reagentes</> : 'Sem deslocamento'}
                  </div>
                  <p className="text-muted text-sm leading-relaxed"><strong className="text-fg">Regra de ouro:</strong> {effect.rule}</p>
                  <p className="text-faint text-xs mt-2">Logo após a perturbação: Q = {fmt(effect.Q)} e K = {fmt(effect.K)}.</p>
                </>
              )}
            </div>
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica ENEM / FUVEST</h3>
              <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
                {r.tips.map((t) => <li key={t}>{t}</li>)}
                <li>Só a temperatura altera o valor de K. Concentração, pressão e catalisador não mudam K.</li>
                <li>Catalisador não desloca o equilíbrio: só reduz o tempo para atingi-lo.</li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
