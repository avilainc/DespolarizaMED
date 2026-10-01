'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Zap } from 'lucide-react'
import { POTENTIALS, POTENTIAL_SYMBOLS, NONMETAL_SAMPLES, buildCell, elementName } from '@/lib/electrochemistry'

const EXAMPLES: [string, string, string][] = [
  ['Zn', 'Cu', 'Pilha de Daniell'],
  ['Fe', 'Cu', 'Ferro e cobre'],
  ['Mg', 'Ag', 'Magnésio e prata'],
  ['Al', 'Cu', 'Alumínio e cobre'],
  ['Zn', 'Ag', 'Zinco e prata'],
]

const fmt = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(2).replace('.', ',')

function Ion({ s, n }: { s: string; n: number }) {
  return (
    <>
      {s}
      <sup>{n > 1 ? n : ''}+</sup>
    </>
  )
}

function Coef({ n }: { n: number }) {
  return n === 1 ? null : <>{n} </>
}

// Ânodo "sendo consumido": barra normal em cima da água, afunilando em duas
// pontas finas e tortas que quase se encontram perto do fundo (desenho do Paulo).
function corrodedTaperPath(cx: number, halfW: number, yTop: number, taperStart: number, yBot: number) {
  const steps = 16
  const right: string[] = [], left: string[] = []
  const wobble = [0, 1, -1, 2, -1, 1, -2, 1, -1] // leve serrilhado, não perfeitamente reto
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = yTop + (yBot - yTop) * t
    const w = y <= taperStart ? halfW : Math.max(1, halfW * (1 - ((y - taperStart) / (yBot - taperStart)) ** 0.7))
    const jag = wobble[i % wobble.length] * (w > 4 ? 1 : 0.3)
    right.push(`${(cx + w + jag).toFixed(1)},${y.toFixed(1)}`)
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const y = yTop + (yBot - yTop) * t
    const w = y <= taperStart ? halfW : Math.max(1, halfW * (1 - ((y - taperStart) / (yBot - taperStart)) ** 0.7))
    const jag = wobble[(i + 4) % wobble.length] * (w > 4 ? 1 : 0.3)
    left.push(`${(cx - w - jag).toFixed(1)},${y.toFixed(1)}`)
  }
  return `M${[...right, ...left].join(' L')} Z`
}

// Cátodo "engordando": barra normal em cima da água, virando um bojo bem
// redondo (depósito de metal) perto do fundo (desenho do Paulo).
function swollenBlobPath(cx: number, halfW: number, yTop: number, bulgeStart: number, yBot: number, blobHalfW: number) {
  return `M${cx - halfW},${yTop} L${cx - halfW},${bulgeStart}
    C${cx - blobHalfW},${bulgeStart + 18} ${cx - blobHalfW},${yBot - 30} ${cx - blobHalfW * 0.55},${yBot - 4}
    Q${cx},${yBot + 12} ${cx + blobHalfW * 0.55},${yBot - 4}
    C${cx + blobHalfW},${yBot - 30} ${cx + blobHalfW},${bulgeStart + 18} ${cx + halfW},${bulgeStart}
    L${cx + halfW},${yTop} Z`
}

function Diagram({ anode, cathode, nA, nC, deltaE }: { anode: string; cathode: string; nA: number; nC: number; deltaE: number }) {
  return (
    <svg viewBox="0 0 640 320" className="w-full h-auto" role="img" aria-label="Diagrama da pilha">
      <defs>
        <marker id="arrowE" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#facc15" />
        </marker>
        <marker id="arrowI" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#38bdf8" />
        </marker>
      </defs>

      {/* béqueres */}
      <rect x="50" y="140" width="200" height="150" rx="10" fill="rgba(56,189,248,0.10)" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="390" y="140" width="200" height="150" rx="10" fill="rgba(56,189,248,0.10)" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />

      {/* eletrodos — ânodo afunila até quase um ponto (sendo consumido), cátodo vira um bojo redondo (depósito de metal) */}
      <path d={corrodedTaperPath(150, 10, 70, 150, 250)} fill="#94a3b8" />
      <path d={swollenBlobPath(490, 10, 70, 150, 250, 48)} fill="#f59e0b" />
      <text x="150" y="278" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">{anode}</text>
      <text x="490" y="278" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">{cathode}</text>

      {/* fio e voltímetro */}
      <path d="M150 70 V30 H286" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 6" className="pilha-flow" markerEnd="url(#arrowE)" />
      <path d="M354 30 H490 V70" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 6" className="pilha-flow" markerEnd="url(#arrowE)" />
      <circle cx="320" cy="30" r="34" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
      <text x="320" y="26" textAnchor="middle" fontSize="11" fill="#94a3b8">ΔE°</text>
      <text x="320" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill="#facc15">{deltaE.toFixed(2).replace('.', ',')} V</text>
      <text x="215" y="16" textAnchor="middle" fontSize="12" fill="#facc15">e⁻ →</text>

      {/* ponte salina */}
      <path d="M215 140 V104 H425 V140" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinejoin="round" />
      <text x="320" y="99" textAnchor="middle" fontSize="12" fill="#94a3b8">Ponte salina</text>
      <path d="M300 118 H250" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowI)" />
      <path d="M340 118 H390" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowI)" />
      <text x="272" y="134" textAnchor="middle" fontSize="10" fill="#38bdf8">ânions</text>
      <text x="368" y="134" textAnchor="middle" fontSize="10" fill="#38bdf8">cátions</text>

      {/* rótulos */}
      <text x="150" y="312" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">ÂNODO (−)</text>
      <text x="150" y="103" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" fillOpacity="0.8">oxidação</text>
      <text x="490" y="312" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">CÁTODO (+)</text>
      <text x="490" y="103" textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" fillOpacity="0.8">redução</text>
      <text x="90" y="220" fontSize="13" fill="currentColor">{anode}<tspan dy="-5" fontSize="9">{nA > 1 ? nA : ''}+</tspan></text>
      <text x="420" y="220" fontSize="13" fill="currentColor">{cathode}<tspan dy="-5" fontSize="9">{nC > 1 ? nC : ''}+</tspan></text>
    </svg>
  )
}

export default function PilhasPage() {
  const [a, setA] = useState('Zn')
  const [b, setB] = useState('Cu')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const qa = p.get('a')
    const qb = p.get('b')
    if (qa) setA(qa)
    if (qb) setB(qb)
  }, [])

  const cell = buildCell(a, b)

  const options = (
    <>
      <optgroup label="Metais (ordem crescente de E°)">
        {POTENTIAL_SYMBOLS.map((s) => (
          <option key={s} value={s}>{s} · {elementName(s)} ({fmt(POTENTIALS[s].E)} V)</option>
        ))}
      </optgroup>
      <optgroup label="Ametais (para testar o aviso)">
        {NONMETAL_SAMPLES.map((s) => (
          <option key={s} value={s}>{s} · {elementName(s)}</option>
        ))}
      </optgroup>
    </>
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1200px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition">
        <ArrowLeft size={15} /> Apps
      </Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Pilhas e Oxirredução</h1>
      <p className="text-muted text-sm mb-5">Escolha dois metais, veja quem oxida e quem reduz, o caminho dos elétrons e a diferença de potencial (ΔE°).</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-3 max-w-2xl">
        <label className="block">
          <span className="text-faint text-xs font-semibold uppercase">Eletrodo 1</span>
          <select value={a} onChange={(e) => setA(e.target.value)} className="mt-1 w-full px-3 py-2 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary">{options}</select>
        </label>
        <label className="block">
          <span className="text-faint text-xs font-semibold uppercase">Eletrodo 2</span>
          <select value={b} onChange={(e) => setB(e.target.value)} className="mt-1 w-full px-3 py-2 bg-surface border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary">{options}</select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {EXAMPLES.map(([x, y, label]) => (
          <button key={label} onClick={() => { setA(x); setB(y) }} className="text-xs px-3 py-1.5 rounded-full border border-edge text-muted hover:text-fg hover:border-primary/40 transition">
            {label} ({x}/{y})
          </button>
        ))}
      </div>

      {cell.kind === 'invalid' ? (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-6 flex gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="text-fg font-bold mb-1">{cell.title}</h2>
            <p className="text-muted text-sm leading-relaxed">{cell.text}</p>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-start">
          <div className="bg-surface border border-edge rounded-2xl p-4 text-fg">
            <Diagram anode={cell.anode} cathode={cell.cathode} nA={cell.nA} nC={cell.nC} deltaE={cell.deltaE} />
            <p className="text-faint text-xs mt-2">Os elétrons saem do ânodo (oxidação), percorrem o fio e chegam ao cátodo (redução). Na ponte salina, ânions migram para o ânodo e cátions para o cátodo, mantendo as soluções neutras.</p>
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-2xl font-extrabold text-fg">ΔE° = {cell.deltaE.toFixed(2).replace('.', ',')} V</span>
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Espontânea</span>
            </div>

            <p className="text-faint text-xs font-semibold uppercase mb-1">Ânodo (−): {elementName(cell.anode)}, menor E°, sofre oxidação</p>
            <p className="text-fg text-base mb-3">
              {cell.anode} → <Ion s={cell.anode} n={cell.nA} /> + {cell.nA} e<sup>−</sup>
              <span className="text-muted text-xs ml-2">(E°ox = {fmt(-cell.eAnode)} V)</span>
            </p>

            <p className="text-faint text-xs font-semibold uppercase mb-1">Cátodo (+): {elementName(cell.cathode)}, maior E°, sofre redução</p>
            <p className="text-fg text-base mb-3">
              <Ion s={cell.cathode} n={cell.nC} /> + {cell.nC} e<sup>−</sup> → {cell.cathode}
              <span className="text-muted text-xs ml-2">(E°red = {fmt(cell.eCathode)} V)</span>
            </p>

            <p className="text-faint text-xs font-semibold uppercase mb-1">Equação global balanceada ({cell.electrons} e⁻ trocados)</p>
            <p className="text-fg text-lg font-semibold mb-3">
              <Coef n={cell.coefA} />{cell.anode} + <Coef n={cell.coefC} /><Ion s={cell.cathode} n={cell.nC} /> → <Coef n={cell.coefA} /><Ion s={cell.anode} n={cell.nA} /> + <Coef n={cell.coefC} />{cell.cathode}
            </p>

            <p className="text-faint text-xs font-semibold uppercase mb-1">Cálculo da ddp</p>
            <p className="text-fg text-sm mb-3">
              ΔE° = E°<sub>cátodo</sub> − E°<sub>ânodo</sub> = {fmt(cell.eCathode)} − ({fmt(cell.eAnode)}) = <strong>{cell.deltaE.toFixed(2).replace('.', ',')} V</strong>
            </p>

            <p className="text-faint text-xs font-semibold uppercase mb-1">Notação da pilha</p>
            <p className="text-fg text-sm mb-3">
              {cell.anode}(s) | <Ion s={cell.anode} n={cell.nA} />(aq) || <Ion s={cell.cathode} n={cell.nC} />(aq) | {cell.cathode}(s)
            </p>

            <ul className="text-muted text-sm space-y-1 list-disc pl-5">
              <li>A placa de {cell.anode} é corroída (perde massa).</li>
              <li>Sobre a placa de {cell.cathode} deposita-se metal (ganha massa).</li>
              <li>A concentração de <Ion s={cell.anode} n={cell.nA} /> aumenta e a de <Ion s={cell.cathode} n={cell.nC} /> diminui.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="bg-surface border border-edge rounded-2xl p-5">
          <h3 className="text-fg font-bold mb-2">Dica de vestibular</h3>
          <p className="text-muted text-sm leading-relaxed">
            Lembre: quem tem <strong className="text-fg">menor E° de redução</strong> é o que oxida (ânodo, polo negativo); quem tem o maior reduz (cátodo, polo positivo). O sinal do ΔE° indica espontaneidade: só pilhas com ΔE° &gt; 0 funcionam sozinhas. Dois metais iguais dão ΔE° = 0. Mnemônico: <em>ânodo = oxidação; cátodo = redução</em> (vogal com vogal, consoante com consoante).
          </p>
        </div>
        <div className="bg-surface border border-edge rounded-2xl p-5">
          <h3 className="text-fg font-bold mb-2">Elo com a medicina</h3>
          <p className="text-muted text-sm leading-relaxed">
            O corpo também é bioeletroquímico: o potencial de repouso de um neurônio (≈ −70 mV) nasce do gradiente de Na⁺ e K⁺ pela membrana (equação de Nernst), e o potencial de ação é uma sequência de trocas iônicas. Marca-passos usam pilhas de lítio; eletrodos de ECG usam o par Ag/AgCl para converter corrente iônica do corpo em sinal elétrico.
          </p>
        </div>
      </div>
    </div>
  )
}
