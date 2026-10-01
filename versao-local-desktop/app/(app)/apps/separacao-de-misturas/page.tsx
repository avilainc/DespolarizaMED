'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter, Funnel, Beaker, Flame, Columns3, RotateCw, Magnet, Waves, CheckCircle2, XCircle, Lightbulb, Trash2, Package } from 'lucide-react'
import { SUBSTANCES, TECHNIQUES, SOLUBILITY, analyze, separate, type MixState, type SubstanceId, type TechniqueId, type SeparationResult } from '@/lib/mixtures'

const ICONS: Record<TechniqueId, typeof Filter> = {
  filtracao: Filter,
  funil: Funnel,
  sedimentacao: Beaker,
  simples: Flame,
  fracionada: Columns3,
  centrifuga: RotateCw,
  ima: Magnet,
  flotacao: Waves,
}

const PRESETS: { label: string; items: SubstanceId[]; saltG: number }[] = [
  { label: 'Água + sal (20 g)', items: ['agua', 'sal'], saltG: 20 },
  { label: 'Água + sal (50 g)', items: ['agua', 'sal'], saltG: 50 },
  { label: 'Água + óleo', items: ['agua', 'oleo'], saltG: 20 },
  { label: 'Água + etanol', items: ['agua', 'etanol'], saltG: 20 },
  { label: 'Água + areia + limalha', items: ['agua', 'areia', 'limalha'], saltG: 20 },
  { label: 'Petróleo + água', items: ['petroleo', 'agua'], saltG: 20 },
  { label: 'Areia + serragem + limalha', items: ['areia', 'serragem', 'limalha'], saltG: 20 },
]

const color = (id: SubstanceId) => SUBSTANCES.find((s) => s.id === id)!.color

function Beaker3({ state }: { state: MixState }) {
  const a = analyze(state)
  const BOTTOM = 216
  const solids: { id: string; fill: string }[] = [
    ...a.sinking.map((id) => ({ id, fill: color(id) })),
    ...(a.saltExcess || a.saltSolid ? [{ id: 'sal', fill: '#f8fafc' }] : []),
  ]
  const SOLID_H = 13
  const solidsTop = BOTTOM - solids.length * SOLID_H
  const both = a.polar.length && a.apolar.length
  const liquidH = a.hasLiquid ? (both ? 105 : 130) : 0
  const polarH = a.polar.length ? (both ? 70 : liquidH) : 0
  const apolarH = a.apolar.length ? (both ? 35 : liquidH) : 0
  const polarFill = a.polar.includes('etanol') && !a.polar.includes('agua') ? '#a5b4fc' : a.polar.includes('etanol') ? '#93c5fd' : '#38bdf8'
  const apolarFill = a.apolar.includes('petroleo') ? '#44403c' : '#facc15'
  const polarY = solidsTop - polarH
  const apolarY = polarY - apolarH
  const surfaceY = a.hasLiquid ? apolarY : solidsTop
  const tr = { transition: 'all 0.8s ease' }
  return (
    <svg viewBox="0 0 200 240" className="w-full max-w-[220px] mx-auto text-fg">
      <defs>
        <clipPath id="beakerClip">
          <path d="M36 22 V210 Q36 218 44 218 H156 Q164 218 164 210 V22 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#beakerClip)">
        {solids.map((s, i) => (
          <rect key={s.id} x="34" y={BOTTOM - (i + 1) * SOLID_H} width="132" height={SOLID_H} fill={s.fill} style={tr} />
        ))}
        {a.polar.length > 0 && <rect x="34" y={polarY} width="132" height={polarH} fill={polarFill} opacity={a.saltDissolved ? 0.75 : 0.55} style={tr} />}
        {a.apolar.length > 0 && <rect x="34" y={apolarY} width="132" height={apolarH} fill={apolarFill} opacity={0.75} style={tr} />}
        {a.floating.length > 0 &&
          [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={44 + i * 15} y={surfaceY - 2 - (i % 2) * 3} width="9" height="5" rx="1.5" fill="#a16207" style={tr} />
          ))}
      </g>
      <path d="M36 22 V210 Q36 218 44 218 H156 Q164 218 164 210 V22" fill="none" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3" />
      <line x1="28" y1="22" x2="172" y2="22" stroke="currentColor" strokeOpacity="0.7" strokeWidth="3" />
    </svg>
  )
}

export default function MixturesPage() {
  const [state, setState] = useState<MixState>({ items: [], saltG: 20 })
  const [feedback, setFeedback] = useState<SeparationResult | null>(null)
  const [running, setRunning] = useState<TechniqueId | null>(null)
  const [collected, setCollected] = useState<{ label: string; items: SubstanceId[] }[]>([])
  const [dragging, setDragging] = useState(false)
  const [over, setOver] = useState<TechniqueId | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const a = analyze(state)
  const hasSaltWater = state.items.includes('sal') && state.items.includes('agua')

  const toggle = (id: SubstanceId) => {
    if (running) return
    setFeedback(null)
    setState((s) => ({ ...s, items: s.items.includes(id) ? s.items.filter((x) => x !== id) : [...s.items, id] }))
  }

  const reset = () => {
    if (timer.current) clearTimeout(timer.current)
    setRunning(null)
    setState({ items: [], saltG: 20 })
    setFeedback(null)
    setCollected([])
  }

  const apply = (tech: TechniqueId) => {
    if (running) return
    const r = separate(state, tech)
    if (!r.ok) {
      setFeedback(r)
      return
    }
    setFeedback(null)
    setRunning(tech)
    timer.current = setTimeout(() => {
      setRunning(null)
      if (r.next) setState(r.next)
      if (r.collected) setCollected((c) => [...c, r.collected!])
      setFeedback(r)
    }, 1500)
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition">
        <ArrowLeft size={15} /> Apps
      </Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Separação de Misturas</h1>
      <p className="text-muted text-sm mb-6">Monte uma mistura, confira fases e componentes e arraste o béquer até a vidraria certa. Algumas misturas pedem mais de uma etapa!</p>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.1fr)] gap-5 items-start">
        {/* Bancada */}
        <section className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-3">Bancada de misturas</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { if (!running) { setState({ items: p.items, saltG: p.saltG }); setFeedback(null); setCollected([]) } }}
                className="text-[11px] px-2 py-1 rounded-full border border-edge text-muted hover:text-fg hover:border-primary/40 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {SUBSTANCES.map((s) => {
              const on = state.items.includes(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg border transition ${on ? 'border-primary bg-primary/10' : 'border-edge hover:border-primary/40'}`}
                >
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-fg text-sm font-medium">{s.name} {s.formula && <span className="text-muted font-normal">({s.formula})</span>}</span>
                    <span className="block text-faint text-[11px]">{s.note}</span>
                  </span>
                  <span className={`text-xs font-bold ${on ? 'text-primary' : 'text-faint'}`}>{on ? '✓' : '+'}</span>
                </button>
              )
            })}
          </div>

          {hasSaltWater && (
            <div className="mt-4 p-3 rounded-xl bg-app border border-edge">
              <p className="text-fg text-sm font-semibold mb-1">Medidor de saturação</p>
              <p className="text-faint text-[11px] mb-2">Sal em 100 g de água a 20 °C (CS ≈ {SOLUBILITY} g/100 g)</p>
              <input
                type="range" min={0} max={60} step={1} value={state.saltG}
                onChange={(e) => { if (!running) { setFeedback(null); setState((s) => ({ ...s, saltG: Number(e.target.value) })) } }}
                className="w-full accent-sky-400"
              />
              <div className="relative h-2 rounded-full bg-edge mt-1">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (state.saltG / 60) * 100)}%`, backgroundColor: state.saltG > SOLUBILITY ? '#f87171' : '#38bdf8' }} />
                <div className="absolute -top-1 h-4 w-0.5 bg-white/70" style={{ left: `${(SOLUBILITY / 60) * 100}%` }} title="36 g" />
              </div>
              <p className="text-fg text-sm font-bold mt-2">{state.saltG} g de NaCl</p>
            </div>
          )}

          <button onClick={reset} className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg border border-edge rounded-lg px-3 py-1.5 transition">
            <Trash2 size={14} /> Limpar tudo
          </button>
        </section>

        {/* Laboratório */}
        <section className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-3">Laboratório de vidrarias</h2>
          <div
            draggable={!a.empty && !running}
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'mixture'); setDragging(true) }}
            onDragEnd={() => { setDragging(false); setOver(null) }}
            className={`rounded-2xl border border-edge bg-app p-3 mb-4 ${!a.empty && !running ? 'cursor-grab' : ''} ${dragging ? 'opacity-60' : ''} ${running ? 'animate-pulse' : ''}`}
          >
            <Beaker3 state={state} />
            <p className="text-center text-muted text-xs mt-1">
              {a.empty ? 'Béquer vazio: escolha substâncias na bancada' : running ? (feedback?.stage ?? TECHNIQUES.find((t) => t.id === running)?.name) : 'Arraste o béquer até a vidraria (ou clique nela)'}
            </p>
            {running && (
              <div className="h-1.5 rounded-full bg-edge mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ animation: 'mix-progress 1.5s linear forwards' }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TECHNIQUES.map((t) => {
              const Icon = ICONS[t.id]
              return (
                <button
                  key={t.id}
                  onClick={() => apply(t.id)}
                  onDragOver={(e) => { e.preventDefault(); setOver(t.id) }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => { e.preventDefault(); setOver(null); setDragging(false); apply(t.id) }}
                  className={`rounded-xl border p-3 text-center transition ${over === t.id ? 'border-primary bg-primary/15 scale-105' : running === t.id ? 'border-primary bg-primary/10 animate-pulse' : 'border-edge hover:border-primary/50'}`}
                >
                  <Icon size={22} className="mx-auto text-primary mb-1.5" />
                  <span className="block text-fg text-xs font-semibold leading-tight">{t.name}</span>
                  <span className="block text-faint text-[10px] mt-0.5">{t.hint}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <p className="text-faint text-xs font-semibold uppercase mb-2 flex items-center gap-1.5"><Package size={13} /> Frascos coletados</p>
            {collected.length === 0 ? (
              <p className="text-faint text-xs">O que você separar aparece aqui. Clique num frasco para usá-lo como nova mistura.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {collected.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { if (!running) { setState({ items: c.items.filter((x) => x !== 'sal' || c.items.length === 1), saltG: 20 }); setFeedback(null) } }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-edge text-muted hover:text-fg hover:border-primary/40 transition"
                    title="Usar como nova mistura"
                  >
                    {c.label}: {c.items.map((id) => SUBSTANCES.find((s) => s.id === id)!.name).join(', ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Painel teórico */}
        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Classificação da mistura</h2>
            {a.empty ? (
              <p className="text-muted text-sm">Escolha substâncias para ver fases, componentes e o tipo de mistura.</p>
            ) : (
              <>
                <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${a.homogeneous ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{a.kind}</span>
                <p className="text-faint text-xs font-semibold uppercase mt-2 mb-1">Fases ({a.phases.length})</p>
                <ul className="text-fg text-sm list-disc pl-5 space-y-0.5">{a.phases.map((p) => <li key={p}>{p}</li>)}</ul>
                <p className="text-faint text-xs font-semibold uppercase mt-3 mb-1">Componentes</p>
                <p className="text-fg text-sm">{a.components}</p>
                {a.saturation && <p className="text-sky-300 text-sm mt-3">{a.saturation}</p>}
              </>
            )}
          </div>

          {feedback && (
            <div className={`rounded-2xl border p-4 ${feedback.ok ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
              <div className="flex items-start gap-2 mb-2">
                {feedback.ok ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
                <h3 className="text-fg font-bold">{feedback.title}</h3>
              </div>
              <p className="text-fg text-sm leading-relaxed">{feedback.text}</p>
              {feedback.property && (
                <>
                  <p className="text-faint text-xs font-semibold uppercase mt-3 mb-1">Propriedade física explorada</p>
                  <p className="text-fg text-sm leading-relaxed">{feedback.property}</p>
                </>
              )}
              {feedback.tip && (
                <div className="mt-3 rounded-xl bg-app border border-edge p-3">
                  <p className="text-amber-300 text-xs font-bold uppercase mb-1 flex items-center gap-1.5"><Lightbulb size={13} /> Como isso cai na sua prova</p>
                  <p className="text-fg text-sm leading-relaxed">{feedback.tip}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-fg font-bold text-sm mb-1">Lembrete de prova</h3>
            <p className="text-muted text-sm leading-relaxed">
              Separar mistura é <strong className="text-fg">processo físico</strong>: os componentes não mudam. Antes de escolher o método, responda: a mistura é homogênea ou heterogênea? Qual propriedade física difere entre os componentes (densidade, ponto de ebulição, tamanho de partícula, magnetismo, solubilidade)?
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
