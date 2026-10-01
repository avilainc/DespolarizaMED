'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, Coins } from 'lucide-react'
import { simpleInterest, compoundInterest, paTerm, paSum, pgTerm, pgSum, pgInfiniteSum } from '@/lib/finance'

const num = (n: number, d = 2) => (Number.isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—')

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function SliderNum({ label, value, onChange, min, max, step = 1, numWidth = 'w-16' }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; numWidth?: string
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
          className={`${numWidth} shrink-0 bg-app border border-edge rounded-lg px-2 py-1 text-sm text-fg outline-none focus:border-primary`}
        />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-primary" />
      </div>
    </label>
  )
}

function Graph({ pointsA, pointsB, labelA, labelB, colorA, colorB, xLabel, yUnit }: {
  pointsA: { x: number; y: number }[]; pointsB: { x: number; y: number }[]
  labelA: string; labelB: string; colorA: string; colorB: string; xLabel: string; yUnit: string
}) {
  const W = 460, H = 260, L = 46, B = 26, TP = 14
  const xs = [...pointsA, ...pointsB].map((p) => p.x)
  const ys = [...pointsA, ...pointsB].map((p) => p.y)
  const xMax = Math.max(...xs, 1)
  const yMax = Math.max(...ys, 1)
  const x = (v: number) => L + (v / xMax) * (W - L - 12)
  const y = (v: number) => H - B - (v / yMax) * (H - B - TP)
  const path = (pts: { x: number; y: number }[]) => pts.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')
  const gridLines = 4
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const gy = TP + ((H - B - TP) * i) / gridLines
          const val = yMax * (1 - i / gridLines)
          return (
            <g key={i}>
              <line x1={L} y1={gy} x2={W - 6} y2={gy} stroke="currentColor" strokeOpacity="0.08" />
              <text x={L - 5} y={gy + 3} fontSize="8" fill="currentColor" fillOpacity="0.5" textAnchor="end">{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}</text>
            </g>
          )
        })}
        <line x1={L} y1={TP} x2={L} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
        <line x1={L} y1={H - B} x2={W - 6} y2={H - B} stroke="currentColor" strokeOpacity="0.5" />
        <polyline points={path(pointsA)} fill="none" stroke={colorA} strokeWidth="2.6" />
        <polyline points={path(pointsB)} fill="none" stroke={colorB} strokeWidth="2.6" />
        <circle cx={x(pointsA[pointsA.length - 1].x)} cy={y(pointsA[pointsA.length - 1].y)} r="3.5" fill={colorA} />
        <circle cx={x(pointsB[pointsB.length - 1].x)} cy={y(pointsB[pointsB.length - 1].y)} r="3.5" fill={colorB} />
        <text x={W - 8} y={H - 4} fontSize="9" fill="currentColor" fillOpacity="0.6" textAnchor="end">{xLabel}</text>
      </svg>
      <div className="flex items-center gap-4 mt-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ background: colorA }} /> {labelA}</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ background: colorB }} /> {labelB}</span>
        <span className="text-faint ml-auto">{yUnit}</span>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [modo, setModo] = useState<'financeiro' | 'progressoes'>('financeiro')

  // ---- modo financeiro ----
  const [C, setC] = useState(1000)
  const [iPct, setIPct] = useState(5)
  const [tPer, setTPer] = useState(12)
  const i = iPct / 100

  const simples = simpleInterest(C, i, tPer)
  const composto = compoundInterest(C, i, tPer)

  const simplesPts = Array.from({ length: tPer + 1 }, (_, k) => ({ x: k, y: simpleInterest(C, i, k).M }))
  const compostoPts = Array.from({ length: tPer + 1 }, (_, k) => ({ x: k, y: compoundInterest(C, i, k).M }))

  // ---- modo progressões ----
  const [tipo, setTipo] = useState<'pa' | 'pg'>('pa')
  const [a1, setA1] = useState(2)
  const [razaoPA, setRazaoPA] = useState(3)
  const [razaoPG, setRazaoPG] = useState(2)
  const [n, setN] = useState(8)

  const pa = paSum(a1, razaoPA, n)
  const pg = pgSum(a1, razaoPG, n)
  const pgInf = pgInfiniteSum(a1, razaoPG)

  const paPts = Array.from({ length: n }, (_, k) => ({ x: k + 1, y: paTerm(a1, razaoPA, k + 1) }))
  const pgPts = Array.from({ length: n }, (_, k) => ({ x: k + 1, y: pgTerm(a1, razaoPG, k + 1) }))

  const modeBtn = (m: 'financeiro' | 'progressoes', label: string) => (
    <button onClick={() => setModo(m)} className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${modo === m ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{label}</button>
  )
  const tipoBtn = (tp: 'pa' | 'pg', label: string) => (
    <button onClick={() => setTipo(tp)} className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${tipo === tp ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{label}</button>
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Matemática Financeira & Progressões</h1>
      <p className="text-muted text-sm mb-5">Compare juros simples × compostos e progressões aritméticas × geométricas, com termo geral e soma em tempo real.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Modo</p>
            <div className="flex gap-2">
              {modeBtn('financeiro', 'Financeiro')}
              {modeBtn('progressoes', 'Progressões')}
            </div>
          </div>

          {modo === 'financeiro' ? (
            <div className="space-y-3">
              <SliderNum label="Capital inicial C (R$)" value={C} onChange={setC} min={100} max={10000} step={100} numWidth="w-20" />
              <SliderNum label="Taxa i (% ao período)" value={iPct} onChange={setIPct} min={0.5} max={20} step={0.5} />
              <SliderNum label="Tempo t (períodos)" value={tPer} onChange={setTPer} min={1} max={36} step={1} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-faint text-xs font-semibold uppercase mb-2">Tipo</p>
                <div className="flex gap-2">
                  {tipoBtn('pa', 'PA (aritmética)')}
                  {tipoBtn('pg', 'PG (geométrica)')}
                </div>
              </div>
              <SliderNum label="Primeiro termo a1" value={a1} onChange={setA1} min={-10} max={20} step={0.5} />
              {tipo === 'pa' ? (
                <SliderNum label="Razão r" value={razaoPA} onChange={setRazaoPA} min={-10} max={10} step={0.5} />
              ) : (
                <SliderNum label="Razão q" value={razaoPG} onChange={setRazaoPG} min={-2} max={3} step={0.05} />
              )}
              <SliderNum label="Número de termos n" value={n} onChange={(v) => setN(Math.round(v))} min={2} max={20} step={1} />
            </div>
          )}
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2 flex items-center gap-1.5"><Coins size={13} /> {modo === 'financeiro' ? 'Montante × tempo' : `Termo × posição (${tipo === 'pa' ? 'PA' : 'PG'} vs. a outra progressão)`}</p>
            {modo === 'financeiro' ? (
              <Graph
                pointsA={simplesPts} pointsB={compostoPts}
                labelA="Juros simples (linear)" labelB="Juros compostos (exponencial)"
                colorA="#38bdf8" colorB="#facc15"
                xLabel="t (períodos)" yUnit="Montante M (R$)"
              />
            ) : (
              <Graph
                pointsA={paPts} pointsB={pgPts}
                labelA="PA (linear)" labelB="PG (exponencial)"
                colorA="#38bdf8" colorB="#facc15"
                xLabel="n (posição do termo)" yUnit="Valor do termo"
              />
            )}
          </div>
          {modo === 'financeiro' && (
            <p className="text-faint text-xs">No juros simples, o montante cresce em linha reta (mesmo valor de juros a cada período). No composto, os juros incidem também sobre os juros anteriores — por isso a curva se afasta cada vez mais rápido da reta.</p>
          )}
          {modo === 'progressoes' && (
            <p className="text-faint text-xs">Na PA, cada termo soma sempre a mesma razão r (crescimento linear). Na PG, cada termo é multiplicado pela razão q (crescimento — ou decrescimento — exponencial).</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">{modo === 'financeiro' ? 'Juros simples × compostos' : `Progressão ${tipo === 'pa' ? 'Aritmética' : 'Geométrica'}`}</h2>
            {modo === 'financeiro' ? (
              <>
                <p className="text-primary text-sm font-semibold mb-1.5">Juros simples: J = C·i·t</p>
                <Row label="Juros (J)" value={`R$ ${num(simples.J)}`} />
                <Row label="Montante (M)" value={`R$ ${num(simples.M)}`} />
                <p className="text-primary text-sm font-semibold mb-1.5 mt-3">Juros compostos: M = C·(1+i)ᵗ</p>
                <Row label="Juros (J)" value={`R$ ${num(composto.J)}`} />
                <Row label="Montante (M)" value={`R$ ${num(composto.M)}`} />
                <Row label="Diferença (composto − simples)" value={`R$ ${num(composto.M - simples.M)}`} />
              </>
            ) : tipo === 'pa' ? (
              <>
                <p className="text-primary text-sm font-semibold mb-1.5">Termo geral: an = a1 + (n−1)·r</p>
                <Row label={`Termo an (n=${n})`} value={num(pa.an, 1)} />
                <p className="text-primary text-sm font-semibold mb-1.5 mt-3">Soma: Sn = (a1 + an)·n / 2</p>
                <Row label={`Soma dos ${n} termos (Sn)`} value={num(pa.sum, 1)} />
              </>
            ) : (
              <>
                <p className="text-primary text-sm font-semibold mb-1.5">Termo geral: an = a1·qⁿ⁻¹</p>
                <Row label={`Termo an (n=${n})`} value={num(pg.an, 2)} />
                <p className="text-primary text-sm font-semibold mb-1.5 mt-3">Soma: Sn = a1·(qⁿ−1)/(q−1)</p>
                <Row label={`Soma dos ${n} termos (Sn)`} value={num(pg.sum, 2)} />
                <p className="text-primary text-sm font-semibold mb-1.5 mt-3">Soma da PG infinita: S∞ = a1/(1−q)</p>
                <Row label="S∞ (só converge se |q| &lt; 1)" value={pgInf !== null ? num(pgInf, 2) : 'diverge (|q| ≥ 1)'} />
              </>
            )}
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica do vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Regra dos 70/72: dividindo 70 (ou 72) pela taxa de juros composta (em %), você estima em quantos períodos o capital dobra — clássico em provas sem calculadora.</li>
              <li>No desconto simples "por fora" (comercial), o desconto incide sobre o valor nominal; no desconto "por dentro" (racional), incide sobre o valor atual — eles dão resultados diferentes para a mesma taxa.</li>
              <li>Amortização (financiamentos): no sistema Price as parcelas são fixas; no SAC, a amortização é fixa e as parcelas (e os juros) diminuem ao longo do tempo.</li>
              <li>Toda PG com razão |q| &lt; 1 converge: dízimas periódicas (ex.: 0,999...) e problemas de "distância percorrida ricocheteando" são somas de PG infinita.</li>
              <li>Crescimento populacional, juros compostos e meia-vida radioativa são sempre PG — se o enunciado disser "aumenta/diminui a mesma porcentagem a cada período", é progressão geométrica, não aritmética.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
