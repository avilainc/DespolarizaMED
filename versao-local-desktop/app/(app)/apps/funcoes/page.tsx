'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { type FnType, evalFn, linearRoot, quadraticInfo, OPTIMIZATION_EXAMPLES } from '@/lib/functions'

const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function Frac({ n, d }: { n: string; d: string }) {
  return (
    <span className="inline-flex flex-col items-center mx-1 align-middle text-[13px] leading-none">
      <span className="px-1 pb-0.5 border-b border-current">{n}</span>
      <span className="px-1 pt-0.5">{d}</span>
    </span>
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

function Graph({ type, a, b, c, xLabel, yLabel }: { type: FnType; a: number; b: number; c: number; xLabel?: string; yLabel?: string }) {
  const W = 480, H = 380
  const info = quadraticInfo(a, b, c)
  const xr = type === 'afim' ? linearRoot(a, b) : null
  const candidates = [0, 10, -10]
  if (type === 'afim' && xr !== null) candidates.push(xr)
  if (type === 'quadratica') {
    candidates.push(info.xv)
    if (info.roots) candidates.push(...info.roots)
  }
  const maxAbsX = Math.max(6, ...candidates.map((v) => Math.abs(v))) * 1.25
  const ys = candidates.map((x) => evalFn(type, a, b, c, x)).concat([c, info.yv])
  const maxAbsY = Math.max(6, ...ys.map((v) => Math.abs(v))) * 1.25
  const sx = (W - 40) / (2 * maxAbsX)
  const sy = (H - 40) / (2 * maxAbsY)
  const X = (x: number) => W / 2 + x * sx
  const Y = (y: number) => H / 2 - y * sy

  const pts: string[] = []
  const n = 60
  for (let i = 0; i <= n; i++) {
    const x = -maxAbsX + (2 * maxAbsX * i) / n
    const y = evalFn(type, a, b, c, x)
    pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`)
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      {Array.from({ length: 11 }, (_, i) => i - 5).map((g) => (
        <g key={g}>
          <line x1={X((g * maxAbsX) / 5)} y1="10" x2={X((g * maxAbsX) / 5)} y2={H - 10} stroke="currentColor" strokeOpacity="0.06" />
          <line x1="10" y1={Y((g * maxAbsY) / 5)} x2={W - 10} y2={Y((g * maxAbsY) / 5)} stroke="currentColor" strokeOpacity="0.06" />
        </g>
      ))}
      <line x1="10" y1={Y(0)} x2={W - 10} y2={Y(0)} stroke="currentColor" strokeOpacity="0.5" />
      <line x1={X(0)} y1="10" x2={X(0)} y2={H - 10} stroke="currentColor" strokeOpacity="0.5" />
      <text x={W - 16} y={Y(0) - 6} fontSize="10" className="fill-current text-fg" fillOpacity="0.6">{xLabel ?? 'x'}</text>
      <text x={X(0) + 6} y="18" fontSize="10" className="fill-current text-fg" fillOpacity="0.6">{yLabel ?? 'y'}</text>

      <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.6" />

      {/* interseção com y */}
      <circle cx={X(0)} cy={Y(c)} r="4" fill="#facc15" />
      {type === 'afim' && xr !== null && <circle cx={X(xr)} cy={Y(0)} r="4" fill="#f87171" />}
      {type === 'quadratica' && info.roots && info.roots.map((r, i) => <circle key={i} cx={X(r)} cy={Y(0)} r="4" fill="#f87171" />)}
      {type === 'quadratica' && (
        <>
          <line x1={X(info.xv)} y1={Y(0)} x2={X(info.xv)} y2={Y(info.yv)} stroke="#4ade80" strokeOpacity="0.5" strokeDasharray="3 3" />
          <line x1={X(0)} y1={Y(info.yv)} x2={X(info.xv)} y2={Y(info.yv)} stroke="#4ade80" strokeOpacity="0.5" strokeDasharray="3 3" />
          <circle cx={X(info.xv)} cy={Y(info.yv)} r="5" fill="#4ade80" />
          <text x={X(info.xv) + 8} y={Y(info.yv) - 8} fontSize="11" fontWeight="700" className="fill-current text-fg">V</text>
        </>
      )}
    </svg>
  )
}

export default function FunctionsPage() {
  const [type, setType] = useState<FnType>('quadratica')
  const [a, setA] = useState(1)
  const [b, setB] = useState(-2)
  const [c, setC] = useState(-3)
  const [example, setExample] = useState<string | null>(null)

  const info = quadraticInfo(a, b, c)
  const xr = linearRoot(a, b)

  const loadExample = (id: string) => {
    const ex = OPTIMIZATION_EXAMPLES.find((e) => e.id === id)!
    setType(ex.type)
    setA(ex.a); setB(ex.b); setC(ex.c)
    setExample(id)
  }
  const activeExample = OPTIMIZATION_EXAMPLES.find((e) => e.id === example)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Funções de 1º e 2º Grau</h1>
      <p className="text-muted text-sm mb-5">Mexa nos coeficientes e veja raízes, vértice e problemas de otimização em tempo real.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Tipo de função</p>
            <div className="flex gap-2">
              <button onClick={() => { setType('afim'); setExample(null) }} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition ${type === 'afim' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Afim (1º grau)</button>
              <button onClick={() => { setType('quadratica'); setExample(null) }} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition ${type === 'quadratica' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Quadrática (2º grau)</button>
            </div>
          </div>
          <SliderNum label="a" value={a} onChange={(v) => { setA(v); setExample(null) }} min={-10} max={10} step={0.5} />
          <SliderNum label="b" value={b} onChange={(v) => { setB(v); setExample(null) }} min={-20} max={20} step={0.5} />
          {type === 'quadratica' && (
            <SliderNum label="c" value={c} onChange={(v) => { setC(v); setExample(null) }} min={-20} max={20} step={0.5} />
          )}
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Problemas de otimização</p>
            <div className="space-y-1.5">
              {OPTIMIZATION_EXAMPLES.map((ex) => (
                <button key={ex.id} onClick={() => loadExample(ex.id)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg border transition ${example === ex.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{ex.label}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          <Graph type={type} a={a} b={b} c={c} xLabel={activeExample?.xLabel} yLabel={activeExample?.yLabel} />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted justify-center mt-1">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> interseção eixo Y</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> raízes</span>
            {type === 'quadratica' && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> vértice</span>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">{type === 'afim' ? `f(x) = ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}` : `f(x) = ${a}x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}`}</h2>
            {type === 'afim' ? (
              <>
                <Row label="Raiz (zero da função)" value={xr !== null ? num(xr) : 'não há (função constante)'} />
                <Row label="Interseção com Y" value={num(b)} />
                <Row label="Crescente/decrescente" value={a > 0 ? 'Crescente (a > 0)' : a < 0 ? 'Decrescente (a < 0)' : 'Constante'} />
              </>
            ) : (
              <>
                <p className="text-muted text-sm font-mono mb-1">Δ = b² − 4ac</p>
                <p className="text-fg text-sm font-mono mb-3">Δ = {b}² − 4×{a}×{c} = {num(info.delta)}</p>
                <Row label="Raízes" value={info.roots ? info.roots.map((r) => num(r)).join(' e ') : 'não existem (Δ < 0)'} />
                <p className="text-muted text-sm font-mono mt-3 mb-1 flex items-center flex-wrap">
                  <span>Xv&nbsp;=</span><Frac n="−b" d="2a" /><span className="mx-1">·</span><span>Yv&nbsp;=</span><Frac n="−Δ" d="4a" />
                </p>
                <Row label="Vértice" value={`(${num(info.xv)}, ${num(info.yv)})`} />
                <Row label="Concavidade" value={a > 0 ? 'Para cima (mínimo em V)' : 'Para baixo (máximo em V)'} />
              </>
            )}
          </div>

          {activeExample && (
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h3 className="text-fg font-bold mb-2">{activeExample.label}</h3>
              <p className="text-fg text-sm leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: activeExample.story }} />
              <p className="text-emerald-400 text-sm font-semibold">Xv = {num(info.xv)} · Yv = {num(info.yv)}</p>
            </div>
          )}

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Como cai no ENEM</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Em problemas de máximo/mínimo, <strong>Xv</strong> responde "quando/quanto" (tempo, quantidade) e <strong>Yv</strong> responde "qual o valor" (lucro, altura, custo).</li>
              <li>Δ &gt; 0: dois zeros distintos (parábola corta o eixo x em 2 pontos). Δ = 0: um zero (tangencia o eixo). Δ &lt; 0: nenhum zero real (não toca o eixo x).</li>
              <li>Sinal da função: se a &gt; 0, a função é negativa entre as raízes e positiva fora delas; se a &lt; 0, o contrário.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
