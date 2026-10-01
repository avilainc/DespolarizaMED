'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { parseNumbers, computeStats, factorial, permutation, arrangement, combination, unionProb, conditionalProb } from '@/lib/statsCombinatorics'

const num = (n: number, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
const int = (n: number) => n.toLocaleString('pt-BR')

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

type Tab = 'estatistica' | 'combinatoria' | 'probabilidade'

function StatsTab() {
  const [text, setText] = useState('5, 7, 7, 8, 9, 10, 12, 15')
  const data = parseNumbers(text)
  const s = computeStats(data)
  const maxVal = s ? Math.max(...data, 1) : 1

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
      <section className="bg-surface border border-edge rounded-2xl p-4 space-y-3">
        <p className="text-faint text-xs font-semibold uppercase">Dados (separados por vírgula)</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="w-full px-3 py-2 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary resize-none" />
        <div className="flex flex-wrap gap-1.5">
          {[
            ['5, 7, 7, 8, 9, 10, 12, 15', 'Exemplo simples'],
            ['4, 4, 4, 6, 8, 10, 10', 'Duas modas'],
            ['70, 72, 68, 75, 71, 69, 74, 73', 'Notas da turma'],
          ].map(([t, l]) => (
            <button key={l} onClick={() => setText(t)} className="text-[11px] px-2 py-1 rounded-full border border-edge text-muted hover:text-fg transition">{l}</button>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-edge rounded-2xl p-4">
        {!s ? (
          <p className="text-muted text-sm text-center py-10">Digite alguns números pra ver o histograma.</p>
        ) : (
          <svg viewBox={`0 0 ${Math.max(300, data.length * 40)} 220`} className="w-full">
            <line x1="20" y1="190" x2={Math.max(300, data.length * 40) - 10} y2="190" stroke="currentColor" strokeOpacity="0.3" className="text-fg" />
            {data.map((v, i) => (
              <g key={i}>
                <rect x={30 + i * 36} y={190 - (v / maxVal) * 160} width="24" height={(v / maxVal) * 160} fill="#38bdf8" fillOpacity="0.7" />
                <text x={30 + i * 36 + 12} y="205" fontSize="10" textAnchor="middle" className="fill-current text-fg" fillOpacity="0.7">{v}</text>
              </g>
            ))}
            <line x1="20" y1={190 - (s.mean / maxVal) * 160} x2={Math.max(300, data.length * 40) - 10} y2={190 - (s.mean / maxVal) * 160} stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="24" y={190 - (s.mean / maxVal) * 160 - 4} fontSize="10" fill="#facc15">média</text>
          </svg>
        )}
      </section>

      <section className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-2">Resultado</h2>
          {!s ? <p className="text-muted text-sm">Sem dados válidos.</p> : (
            <>
              <Row label="n (quantidade)" value={int(s.n)} />
              <Row label="Média" value={num(s.mean)} />
              <Row label="Mediana" value={num(s.median)} />
              <Row label="Moda" value={s.mode.length ? s.mode.map((m) => num(m, 0)).join(', ') : 'amodal (sem repetição)'} />
              <Row label="Amplitude (max − min)" value={num(s.range)} />
              <Row label="Variância" value={num(s.variance)} />
              <Row label="Desvio padrão" value={num(s.stdDev)} />
            </>
          )}
        </div>
        <TipBox items={[
          'Desvio padrão baixo = dados concentrados perto da média (pouca variação). Alto = dados espalhados.',
          'Se houver um valor muito fora da curva (outlier), prefira a mediana à média — ela é mais resistente a valores extremos.',
        ]} />
      </section>
    </div>
  )
}

function CombinatoricsTab() {
  const [n, setN] = useState(6)
  const [p, setP] = useState(3)
  const [kind, setKind] = useState<'permutacao' | 'arranjo' | 'combinacao'>('combinacao')
  const result = kind === 'permutacao' ? permutation(n) : kind === 'arranjo' ? arrangement(n, p) : combination(n, p)

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
      <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
        <div className="flex flex-col gap-1.5">
          {(['permutacao', 'arranjo', 'combinacao'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition ${kind === k ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{k}</button>
          ))}
        </div>
        <label className="block"><span className="text-xs text-faint">n (total de elementos): {n}</span><input type="range" min={1} max={12} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-primary" /></label>
        {kind !== 'permutacao' && (
          <label className="block"><span className="text-xs text-faint">p (escolhidos): {p}</span><input type="range" min={1} max={n} value={Math.min(p, n)} onChange={(e) => setP(+e.target.value)} className="w-full accent-primary" /></label>
        )}
      </section>

      <section className="bg-surface border border-edge rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-faint text-sm mb-2">{kind === 'permutacao' ? `P${n} = ${n}!` : kind === 'arranjo' ? `A${n},${p} = ${n}!/(${n}−${p})!` : `C${n},${p} = ${n}!/(${p}!×(${n}−${p})!)`}</p>
        <p className="text-6xl font-extrabold text-fg">{int(result)}</p>
        <p className="text-muted text-sm mt-2">{kind === 'permutacao' ? 'formas de organizar todos os elementos' : kind === 'arranjo' ? 'formas de escolher e ORDENAR' : 'formas de escolher, sem se importar com a ordem'}</p>
      </section>

      <section className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-2">Passo a passo</h2>
          <Row label={`${n}!`} value={int(factorial(n))} />
          {kind !== 'permutacao' && <Row label={`(${n}−${p})!`} value={int(factorial(n - p))} />}
          {kind === 'combinacao' && <Row label={`${p}!`} value={int(factorial(p))} />}
          <Row label="Resultado" value={int(result)} />
        </div>
        <TipBox items={[
          <><strong>Combinação</strong> = a ordem NÃO importa (ex.: escolher uma comissão de 3 pessoas — {'{A,B,C}'} é igual a {'{C,B,A}'}).</>,
          <><strong>Arranjo</strong> = a ordem IMPORTA (ex.: pódio 1º/2º/3º lugar, senha numérica).</>,
          'Princípio Fundamental da Contagem (PFC): multiplique o número de opções de cada etapa independente — é a base de tudo isso.',
        ]} />
      </section>
    </div>
  )
}

function ProbabilityTab() {
  const [fav, setFav] = useState(5)
  const [tot, setTot] = useState(12)
  const [pa, setPa] = useState(0.4)
  const [pb, setPb] = useState(0.3)
  const [pab, setPab] = useState(0.1)
  const simple = tot > 0 ? fav / tot : 0
  const union = unionProb(pa, pb, pab)
  const cond = conditionalProb(pab, pb)

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
      <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
        <p className="text-faint text-xs font-semibold uppercase">Evento simples</p>
        <label className="block"><span className="text-xs text-faint">Casos favoráveis: {fav}</span><input type="range" min={0} max={tot} value={Math.min(fav, tot)} onChange={(e) => setFav(+e.target.value)} className="w-full accent-primary" /></label>
        <label className="block"><span className="text-xs text-faint">Casos totais: {tot}</span><input type="range" min={1} max={30} value={tot} onChange={(e) => setTot(+e.target.value)} className="w-full accent-primary" /></label>

        <p className="text-faint text-xs font-semibold uppercase pt-2">União e condicional</p>
        <label className="block"><span className="text-xs text-faint">P(A): {(pa * 100).toFixed(0)}%</span><input type="range" min={0} max={1} step={0.05} value={pa} onChange={(e) => setPa(+e.target.value)} className="w-full accent-primary" /></label>
        <label className="block"><span className="text-xs text-faint">P(B): {(pb * 100).toFixed(0)}%</span><input type="range" min={0} max={1} step={0.05} value={pb} onChange={(e) => setPb(+e.target.value)} className="w-full accent-primary" /></label>
        <label className="block"><span className="text-xs text-faint">P(A∩B): {(pab * 100).toFixed(0)}%</span><input type="range" min={0} max={Math.min(pa, pb)} step={0.05} value={Math.min(pab, pa, pb)} onChange={(e) => setPab(+e.target.value)} className="w-full accent-primary" /></label>
      </section>

      <section className="bg-surface border border-edge rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
        <svg viewBox="0 0 320 220" className="w-full max-w-sm">
          <circle cx="130" cy="110" r={40 + pa * 50} fill="#38bdf8" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="190" cy="110" r={40 + pb * 50} fill="#4ade80" fillOpacity="0.35" stroke="#4ade80" strokeWidth="2" />
          <text x="95" y="60" fontSize="12" className="fill-current text-fg">A: {(pa * 100).toFixed(0)}%</text>
          <text x="215" y="60" fontSize="12" className="fill-current text-fg">B: {(pb * 100).toFixed(0)}%</text>
          <text x="160" y="115" fontSize="11" textAnchor="middle" className="fill-current text-fg">∩ {(pab * 100).toFixed(0)}%</text>
        </svg>
      </section>

      <section className="space-y-4">
        <div className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-2">Resultado</h2>
          <Row label="P(evento) = favoráveis/totais" value={`${num(simple * 100, 1)}%`} />
          <Row label="P(A∪B) = P(A)+P(B)−P(A∩B)" value={`${num(union * 100, 1)}%`} />
          <Row label="P(A|B) = P(A∩B)/P(B)" value={`${num(cond * 100, 1)}%`} />
        </div>
        <TipBox items={[
          'Cuidado com a contagem dupla: ao somar P(A) + P(B), o que está em A∩B foi contado duas vezes — por isso se subtrai P(A∩B).',
          'Probabilidade condicional P(A|B) só olha pro "mundo" onde B já aconteceu — o espaço amostral encolhe pra apenas os casos de B.',
        ]} />
      </section>
    </div>
  )
}

function TipBox({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="bg-surface border border-edge rounded-2xl p-4">
      <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Campeão do ENEM</h3>
      <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  )
}

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>('estatistica')
  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Estatística, Combinatória e Probabilidade</h1>
      <p className="text-muted text-sm mb-5">O assunto com mais questões na prova de Matemática do ENEM.</p>

      <div className="flex gap-2 mb-6 border-b border-edge">
        {([['estatistica', 'Estatística'], ['combinatoria', 'Combinatória'], ['probabilidade', 'Probabilidade']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === t ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}>{l}</button>
        ))}
      </div>

      {tab === 'estatistica' && <StatsTab />}
      {tab === 'combinatoria' && <CombinatoricsTab />}
      {tab === 'probabilidade' && <ProbabilityTab />}
    </div>
  )
}
