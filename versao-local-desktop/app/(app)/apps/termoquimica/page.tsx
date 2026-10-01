'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, Plus, Trash2, Repeat } from 'lucide-react'
import { REACTIONS, HESS_EQS, hessSum, fmtCoef, type HessStep } from '@/lib/thermo'

const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n))

function Chem({ text }: { text: string }) {
  const parts = text.split(/(\([^)]*\)|\d+)/g)
  return (
    <>
      {parts.map((p, i) => {
        const prev = parts[i - 1] ?? ''
        const isSub = /^\d+$/.test(p) && /[A-Za-zÀ-ÿ)]$/.test(prev)
        return isSub ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>
      })}
    </>
  )
}

function Diagram({ HR, HP, Ea, catalyst }: { HR: number; HP: number; Ea: number; catalyst: boolean }) {
  const dH = HP - HR
  const eaCat = Ea * 0.5
  const peak = HR + Ea
  const peakCat = HR + eaCat
  const lo = Math.min(HR, HP) - (Math.abs(peak - Math.min(HR, HP)) || 10) * 0.18
  const hi = Math.max(peak, HR, HP) + Math.abs(peak - Math.min(HR, HP)) * 0.18
  const y = (v: number) => 300 - ((v - lo) / (hi - lo || 1)) * 260
  const yR = y(HR), yP = y(HP), yPk = y(peak), yPc = y(peakCat)
  const exo = dH < 0
  const col = exo ? '#f97316' : '#38bdf8'
  const curve = (yp: number) => `M70 ${yR} H180 C250 ${yR}, 250 ${yp}, 320 ${yp} C390 ${yp}, 390 ${yP}, 460 ${yP} H560`
  return (
    <svg viewBox="0 0 640 340" className="w-full text-fg">
      <defs>
        <marker id="hArrow" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto-start-reverse">
          <path d="M0,0 L9,4.5 L0,9 z" fill="context-stroke" />
        </marker>
      </defs>
      {/* eixos */}
      <line x1="60" y1="20" x2="60" y2="310" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
      <line x1="60" y1="310" x2="620" y2="310" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
      <text x="14" y="170" fontSize="13" fill="currentColor" transform="rotate(-90 14 170)" textAnchor="middle">H (kJ/mol)</text>
      <text x="340" y="332" fontSize="12" fill="currentColor" fillOpacity="0.7" textAnchor="middle">Caminho da reação</text>

      {/* níveis de referência */}
      <line x1="60" y1={yR} x2="620" y2={yR} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
      <line x1="60" y1={yP} x2="620" y2={yP} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
      <text x="72" y={yR - 6} fontSize="12" fill="currentColor">HR = {num(HR)}</text>
      <text x="470" y={yP - 6} fontSize="12" fill="currentColor">HP = {num(HP)}</text>

      {/* curva sem catalisador */}
      <path d={curve(yPk)} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      {catalyst && <path d={curve(yPc)} fill="none" stroke="#a78bfa" strokeWidth="3" strokeDasharray="7 6" />}

      {/* pico e Ea */}
      <circle cx="320" cy={yPk} r="4" fill="#e2e8f0" />
      <text x="320" y={yPk - 10} fontSize="11" textAnchor="middle" fill="currentColor">Complexo ativado</text>
      <line x1="320" y1={yR} x2="320" y2={yPk + 6} stroke="#facc15" strokeWidth="2" markerEnd="url(#hArrow)" />
      <text x="330" y={(yR + yPk) / 2 + 4} fontSize="13" fontWeight="700" fill="#facc15">Ea = {num(Ea)}</text>
      {catalyst && (
        <>
          <line x1="285" y1={yR} x2="285" y2={yPc + 6} stroke="#a78bfa" strokeWidth="2" markerEnd="url(#hArrow)" />
          <text x="278" y={(yR + yPc) / 2 + 4} fontSize="12" fontWeight="700" fill="#a78bfa" textAnchor="end">Ea cat. = {num(eaCat)}</text>
        </>
      )}

      {/* ΔH */}
      <line x1="590" y1={yR} x2="590" y2={yP + (exo ? 6 : -6)} stroke={col} strokeWidth="3" markerEnd="url(#hArrow)" />
      <line x1="560" y1={yR} x2="600" y2={yR} stroke={col} strokeOpacity="0.5" />
      <text x="580" y={(yR + yP) / 2 + 4} fontSize="14" fontWeight="800" fill={col} textAnchor="end">ΔH = {signed(dH)}</text>
    </svg>
  )
}

export default function ThermoPage() {
  const [tab, setTab] = useState<'diagrama' | 'hess'>('diagrama')
  const [sel, setSel] = useState<string>('metano')
  const [catalyst, setCatalyst] = useState(false)
  const [custom, setCustom] = useState({ HR: -100, HP: -300, Ea: 120 })
  const [steps, setSteps] = useState<HessStep[]>([{ eq: 'E1', mult: 1, inverted: false }, { eq: 'E2', mult: 1, inverted: true }])

  const preset = REACTIONS.find((r) => r.id === sel)
  const isCustom = sel === 'custom'
  const HR = isCustom ? custom.HR : preset!.HR
  const HP = isCustom ? custom.HP : preset!.HP
  const EaRaw = isCustom ? custom.Ea : preset!.Ea
  const dH = Math.round((HP - HR) * 10) / 10
  const Ea = Math.max(EaRaw, dH > 0 ? dH + 5 : 5)
  const exo = dH < 0
  const eaCat = Ea * 0.5
  const hs = hessSum(steps)

  const numInput = (label: string, key: 'HR' | 'HP' | 'Ea') => (
    <label className="block">
      <span className="text-faint text-xs">{label}</span>
      <input type="number" value={custom[key]} onChange={(e) => setCustom({ ...custom, [key]: Number(e.target.value) })} className="mt-1 w-full px-3 py-1.5 bg-app border border-edge rounded-lg text-fg text-sm focus:outline-none focus:border-primary" />
    </label>
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Termoquímica</h1>
      <p className="text-muted text-sm mb-4">Diagramas de entalpia, energia de ativação, catalisador e Lei de Hess.</p>

      <div className="flex gap-2 mb-6 border-b border-edge">
        {([['diagrama', 'Diagrama de entalpia'], ['hess', 'Lei de Hess']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === k ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'}`}>{l}</button>
        ))}
      </div>

      {tab === 'diagrama' ? (
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,1.1fr)] gap-5 items-start">
          <section className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-3">Reação</h2>
            <div className="space-y-1.5 mb-3">
              {REACTIONS.map((r) => (
                <button key={r.id} onClick={() => setSel(r.id)} className={`w-full text-left px-3 py-2 rounded-lg border transition ${sel === r.id ? 'border-primary bg-primary/10' : 'border-edge hover:border-primary/40'}`}>
                  <span className="block text-fg text-sm font-medium">{r.name}</span>
                  <span className="block text-faint text-[11px]"><Chem text={r.equation} /></span>
                </button>
              ))}
              <button onClick={() => setSel('custom')} className={`w-full text-left px-3 py-2 rounded-lg border transition ${isCustom ? 'border-primary bg-primary/10' : 'border-edge hover:border-primary/40'}`}>
                <span className="block text-fg text-sm font-medium">Personalizada</span>
                <span className="block text-faint text-[11px]">Digite HR, HP e Ea da sua questão</span>
              </button>
            </div>
            {isCustom && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {numInput('HR (kJ)', 'HR')}
                {numInput('HP (kJ)', 'HP')}
                {numInput('Ea (kJ)', 'Ea')}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-fg cursor-pointer select-none">
              <input type="checkbox" checked={catalyst} onChange={(e) => setCatalyst(e.target.checked)} className="accent-violet-400" />
              Adicionar catalisador
            </label>
            {isCustom && EaRaw < Ea && <p className="text-amber-400 text-xs mt-2">A Ea precisa ser maior que o ΔH positivo e que zero; usamos {num(Ea)} kJ.</p>}
          </section>

          <section className="bg-surface border border-edge rounded-2xl p-3">
            <Diagram HR={HR} HP={HP} Ea={Ea} catalyst={catalyst} />
            {!isCustom && preset?.note && <p className="text-faint text-xs px-2 pb-1">{preset.note} <span className="opacity-70">(Ea ilustrativa para o gráfico.)</span></p>}
          </section>

          <section className="space-y-4">
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${exo ? 'bg-orange-500/15 text-orange-400' : 'bg-sky-500/15 text-sky-400'}`}>
                {exo ? 'Exotérmica · calor liberado · ΔH negativo' : dH === 0 ? 'ΔH = 0' : 'Endotérmica · calor absorvido · ΔH positivo'}
              </span>
              <p className="text-fg text-sm mb-1">ΔH = H<sub>produtos</sub> − H<sub>reagentes</sub></p>
              <p className="text-fg text-base font-semibold mb-3">ΔH = {num(HP)} − ({num(HR)}) = <span style={{ color: exo ? '#fb923c' : '#38bdf8' }}>{signed(dH)} kJ/mol</span></p>
              <p className="text-muted text-sm leading-relaxed">
                {exo ? 'Os produtos têm menos entalpia que os reagentes: o excesso de energia é liberado para o ambiente (o sistema esquenta o entorno).' : 'Os produtos têm mais entalpia que os reagentes: a reação precisa absorver energia do ambiente (o entorno esfria).'}
              </p>
              <div className="mt-3 text-sm space-y-1">
                <p className="text-fg">Energia de ativação (direta): <strong>{num(Ea)} kJ</strong></p>
                <p className="text-muted">Ea da reação inversa: {num(Ea - dH)} kJ (Ea direta − ΔH)</p>
                {catalyst && <p className="text-violet-300">Com catalisador: Ea cai para {num(eaCat)} kJ e o ΔH continua {signed(dH)} kJ.</p>}
              </div>
            </div>

            <div className="bg-surface border border-edge rounded-2xl p-4 space-y-3">
              <h3 className="text-amber-300 font-bold flex items-center gap-1.5"><Lightbulb size={16} /> Pegadinhas de prova</h3>
              <p className="text-fg text-sm leading-relaxed">Toda substância simples no estado padrão e na forma alotrópica mais estável tem H°<sub>f</sub> = 0 (ex.: O₂(g), C grafite, H₂(g)).</p>
              <p className="text-fg text-sm leading-relaxed">Cuidado com o estado físico: H₂O(g) tem mais energia que H₂O(l), que tem mais que H₂O(s).</p>
              <p className="text-fg text-sm leading-relaxed">Catalisador acelera a reação, mas <strong>nunca</strong> altera o ΔH: só diminui a energia de ativação.</p>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 items-start">
          <section className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-1">Monte a soma de equações</h2>
            <p className="text-muted text-xs mb-3">Escolha as equações, multiplique os coeficientes (e o ΔH) e inverta quando precisar. Os ΔH se somam.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setSteps([{ eq: 'E1', mult: 1, inverted: false }, { eq: 'E2', mult: 1, inverted: true }])} className="text-[11px] px-2.5 py-1 rounded-full border border-edge text-muted hover:text-fg transition">Exemplo: formação do CO</button>
              <button onClick={() => setSteps([{ eq: 'E1', mult: 1, inverted: false }, { eq: 'E3', mult: 2, inverted: false }, { eq: 'E5', mult: 1, inverted: true }])} className="text-[11px] px-2.5 py-1 rounded-full border border-edge text-muted hover:text-fg transition">Exemplo: formação do metano</button>
              <button onClick={() => setSteps([{ eq: 'E8', mult: 1, inverted: false }, { eq: 'E9', mult: 1, inverted: false }])} className="text-[11px] px-2.5 py-1 rounded-full border border-edge text-muted hover:text-fg transition">Exemplo: formação do SO₃</button>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => {
                const eq = HESS_EQS.find((e) => e.id === s.eq)!
                return (
                  <div key={i} className="rounded-xl border border-edge bg-app p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <select value={s.eq} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, eq: e.target.value } : x)))} className="px-2 py-1 bg-surface border border-edge rounded-lg text-fg text-xs">
                        {HESS_EQS.map((e) => <option key={e.id} value={e.id}>{e.id}</option>)}
                      </select>
                      <select value={s.mult} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, mult: Number(e.target.value) } : x)))} className="px-2 py-1 bg-surface border border-edge rounded-lg text-fg text-xs">
                        {[0.5, 1, 2, 3, 4].map((m) => <option key={m} value={m}>× {m === 0.5 ? '½' : m}</option>)}
                      </select>
                      <button onClick={() => setSteps(steps.map((x, j) => (j === i ? { ...x, inverted: !x.inverted } : x)))} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition ${s.inverted ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}><Repeat size={12} /> Inverter</button>
                      <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="ml-auto text-faint hover:text-red-500" aria-label="Remover"><Trash2 size={14} /></button>
                    </div>
                    <p className="text-fg text-sm">
                      {(s.inverted ? eq.products : eq.reactants).map(([c, sp], k) => (<span key={k}>{k > 0 && ' + '}{fmtCoef(c * s.mult)}<Chem text={` ${sp}`.trim()} /></span>))}
                      {' → '}
                      {(s.inverted ? eq.reactants : eq.products).map(([c, sp], k) => (<span key={k}>{k > 0 && ' + '}{fmtCoef(c * s.mult)}<Chem text={` ${sp}`.trim()} /></span>))}
                    </p>
                    <p className="text-muted text-xs mt-1">ΔH = {s.inverted ? '−' : ''}{s.mult !== 1 ? `${s.mult === 0.5 ? '½' : s.mult} × ` : ''}({signed(eq.dH)}) = <strong className="text-fg">{signed((s.inverted ? -1 : 1) * s.mult * eq.dH)} kJ</strong></p>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setSteps([...steps, { eq: 'E1', mult: 1, inverted: false }])} className="mt-3 inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition"><Plus size={14} /> Adicionar equação</button>
          </section>

          <section className="space-y-4">
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-2">Equação global (após cancelar o que se repete)</h2>
              {hs.reactants.length + hs.products.length === 0 ? (
                <p className="text-muted text-sm">Tudo se cancelou: ΔH total = 0.</p>
              ) : (
                <p className="text-fg text-lg font-semibold">
                  {hs.reactants.map(([c, sp], k) => (<span key={k}>{k > 0 && ' + '}{fmtCoef(c)}<Chem text={` ${sp}`.trim()} /></span>))}
                  {' → '}
                  {hs.products.map(([c, sp], k) => (<span key={k}>{k > 0 && ' + '}{fmtCoef(c)}<Chem text={` ${sp}`.trim()} /></span>))}
                </p>
              )}
              <p className="text-fg mt-3">ΔH total = {steps.map((s) => signed((s.inverted ? -1 : 1) * s.mult * HESS_EQS.find((e) => e.id === s.eq)!.dH)).join(' ')} = <strong style={{ color: hs.dH < 0 ? '#fb923c' : '#38bdf8' }}>{signed(hs.dH)} kJ</strong> ({hs.dH < 0 ? 'exotérmica' : hs.dH > 0 ? 'endotérmica' : 'ΔH nulo'})</p>
              <div className="mt-3 space-y-1">
                {steps.map((s, i) => {
                  const v = (s.inverted ? -1 : 1) * s.mult * HESS_EQS.find((e) => e.id === s.eq)!.dH
                  return <div key={i} className="flex items-center gap-2 text-xs text-muted"><span className="w-8">{s.eq}</span><div className="flex-1 h-2 rounded bg-edge relative"><div className="absolute top-0 h-full rounded" style={{ background: v < 0 ? '#fb923c' : '#38bdf8', width: `${Math.min(50, Math.abs(v) / 8)}%`, left: v < 0 ? `${50 - Math.min(50, Math.abs(v) / 8)}%` : '50%' }} /><div className="absolute left-1/2 top-[-2px] w-px h-3 bg-white/60" /></div><span className="w-16 text-right">{signed(v)}</span></div>
                })}
              </div>
            </div>
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Regras da Lei de Hess</h3>
              <ul className="text-fg text-sm list-disc pl-5 space-y-1">
                <li>O ΔH depende só do estado inicial e final, não do caminho.</li>
                <li>Inverter a equação troca o sinal do ΔH.</li>
                <li>Multiplicar a equação por n multiplica o ΔH por n.</li>
                <li>Substâncias que aparecem dos dois lados se cancelam.</li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
