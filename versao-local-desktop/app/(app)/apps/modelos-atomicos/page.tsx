'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Play, RotateCcw, Lightbulb, Layers } from 'lucide-react'
import type { AtomModel, PhotonEvent } from '@/components/AtomViewer'

const AtomViewer = dynamic(() => import('@/components/AtomViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-faint text-sm">Carregando modelo 3D...</div>,
})

type ModelKey = 'dalton' | 'thomson' | 'rutherford' | 'bohr'

const MODELS: Record<ModelKey, {
  name: string; year: number; nick: string; color: string
  postulates: string[]; experiment: string; fail: string; tip: string; traps: string[]
}> = {
  dalton: {
    name: 'Dalton', year: 1803, nick: 'Bola de bilhar', color: '#94a3b8',
    postulates: [
      'Toda matéria é formada por átomos: esferas maciças, indivisíveis e indestrutíveis.',
      'Átomos de um mesmo elemento são idênticos em massa e propriedades.',
      'Átomos de elementos diferentes têm massas e propriedades diferentes.',
      'Uma reação química é um rearranjo de átomos: eles não são criados nem destruídos.',
      'Compostos se formam pela combinação de átomos em proporções fixas.',
    ],
    experiment: 'Leis ponderais: Lavoisier (conservação da massa) e Proust (proporções constantes).',
    fail: 'Não explica a eletricidade: eletrização e raios catódicos mostraram que o átomo tem partículas carregadas, logo é divisível. Isótopos também desmentem “mesma massa para o mesmo elemento”.',
    tip: 'O modelo de Dalton é a base da estequiometria: as leis de Lavoisier e Proust cabem nele. É o que o ENEM cobra para justificar as proporções em uma reação.',
    traps: [
      'Dalton não falou em cargas elétricas nem em elétrons: “átomo neutro com elétrons” já é Thomson.',
      'Lei de Lavoisier: a massa total não muda em sistema fechado. Lei de Proust: a proporção entre as massas é fixa (H:O = 1:8 na água).',
    ],
  },
  thomson: {
    name: 'Thomson', year: 1898, nick: 'Pudim de passas', color: '#ef4444',
    postulates: [
      'O átomo é uma esfera de carga positiva, não maciça.',
      'Elétrons (carga negativa) ficam incrustados nela, como passas num pudim.',
      'O conjunto é eletricamente neutro: a carga positiva compensa a negativa.',
      'Os raios catódicos são feixes de elétrons, presentes em todos os materiais.',
    ],
    experiment: 'Tubo de raios catódicos (ampola de Crookes): o feixe desvia para a placa positiva, logo tem carga negativa.',
    fail: 'Não explicou os resultados de Rutherford: se a carga positiva fosse espalhada, as partículas α atravessariam com pequenos desvios. O núcleo só foi previsto depois.',
    tip: 'Primeira divisão do átomo: Thomson provou que ele tem partículas menores e calculou a relação carga/massa do elétron.',
    traps: [
      'Raios catódicos independem do gás e do metal do cátodo: por isso são um constituinte universal da matéria.',
      'O desvio é para o polo positivo. Se o exercício trocar as polaridades, o feixe acompanha o polo positivo (não é para a placa negativa).',
    ],
  },
  rutherford: {
    name: 'Rutherford', year: 1911, nick: 'Modelo planetário', color: '#f59e0b',
    postulates: [
      'O átomo tem um núcleo minúsculo, denso e de carga positiva.',
      'Os elétrons giram ao redor do núcleo, na eletrosfera.',
      'O átomo é praticamente espaço vazio: o núcleo é ~10⁴ a 10⁵ vezes menor que o átomo.',
      'Quase toda a massa está no núcleo.',
    ],
    experiment: 'Bombardeamento de uma lâmina de ouro com partículas α (Geiger e Marsden).',
    fail: 'Pela física clássica, um elétron em órbita perderia energia por radiação e cairia no núcleo (átomo instável). Também não explica os espectros de linhas.',
    tip: 'Do experimento: a maioria das partículas α atravessa (átomo é vazio), poucas desviam (repulsão do núcleo positivo) e pouquíssimas voltam (choque frontal com o núcleo).',
    traps: [
      'As partículas α são positivas (núcleos de He²⁺): o desvio é repulsão eletrostática com o núcleo positivo, não choque com elétrons.',
      'O núcleo contém prótons, mas os nêutrons só foram descobertos por Chadwick em 1932.',
    ],
  },
  bohr: {
    name: 'Bohr', year: 1913, nick: 'Órbitas quantizadas', color: '#38bdf8',
    postulates: [
      'Os elétrons giram em órbitas circulares de energia definida (níveis K, L, M, N...), sem irradiar.',
      'Ao absorver energia, o elétron salta para um nível mais externo (estado excitado).',
      'Ao retornar, emite energia na forma de luz: E = h·ν = E₂ − E₁.',
      'Cada elemento tem diferenças de energia próprias: seu espectro de linhas é uma “impressão digital”.',
    ],
    experiment: 'Espectroscopia de emissão e teste de chama: cada elemento emite cores características.',
    fail: 'Funciona bem só para o hidrogênio (e íons de 1 elétron). Não explica átomos com vários elétrons nem o princípio da incerteza: substituído pelo modelo quântico (orbitais).',
    tip: 'Fogos de artifício, teste de chama, lâmpadas de néon e fluorescentes: o elétron é excitado e, ao voltar ao nível de origem, emite luz cuja cor depende da diferença de energia.',
    traps: [
      'A energia é emitida quando o elétron VOLTA a um nível de menor energia; para subir ele precisa ABSORVER energia.',
      'Cor da luz ≠ cor do elemento: depende do salto (ΔE). Quanto maior o ΔE, menor o comprimento de onda (mais próximo do violeta).',
    ],
  },
}

function wavelengthToRGB(nm: number): string {
  let r = 0, g = 0, b = 0
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1 }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1 }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20 }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1 }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65 }
  else if (nm <= 750) { r = 1 }
  else return '#7f1d1d'
  const c = (x: number) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x)), 0.8))
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

const LEVEL_NAMES = ['', 'K', 'L', 'M', 'N']

function photonInfo(ni: number, nf: number) {
  const nm = 91.2 / (1 / (nf * nf) - 1 / (ni * ni))
  const visible = nm >= 380 && nm <= 750
  const color = visible ? wavelengthToRGB(nm) : nm < 380 ? '#8b5cf6' : '#7f1d1d'
  const band = visible ? 'luz visível' : nm < 380 ? 'ultravioleta (invisível)' : 'infravermelho (invisível)'
  return { nm: Math.round(nm), color, band, visible }
}

/* ---------- Laboratórios ---------- */

function DaltonLab() {
  const [h, setH] = useState(2)
  const [o, setO] = useState(20)
  const [ran, setRan] = useState(false)
  const water = 9 * Math.min(h, o / 8)
  const usedH = water / 9
  const usedO = (water * 8) / 9
  const leftH = h - usedH
  const leftO = o - usedO
  return (
    <div>
      <p className="text-muted text-xs mb-3">Reação: 2 H₂ + O₂ → 2 H₂O. Escolha as massas de reagentes e observe as leis de Lavoisier e Proust.</p>
      <label className="block text-xs text-faint mb-1">Hidrogênio: {h} g</label>
      <input type="range" min={1} max={10} value={h} onChange={(e) => { setH(+e.target.value); setRan(false) }} className="w-full accent-sky-400 mb-2" />
      <label className="block text-xs text-faint mb-1">Oxigênio: {o} g</label>
      <input type="range" min={1} max={80} value={o} onChange={(e) => { setO(+e.target.value); setRan(false) }} className="w-full accent-sky-400 mb-3" />
      <button onClick={() => setRan(true)} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition"><Play size={14} /> Rodar experimento</button>
      {ran && (
        <div className="mt-3 text-sm space-y-1.5">
          <p className="text-fg">Massa de água formada: <strong>{water.toFixed(1)} g</strong></p>
          <p className="text-muted">Sobra: {leftH.toFixed(1)} g de H₂ e {leftO.toFixed(1)} g de O₂</p>
          <p className="text-emerald-400">Lavoisier: {(h + o).toFixed(1)} g antes = {(water + leftH + leftO).toFixed(1)} g depois (massa conservada).</p>
          <p className="text-sky-300">Proust: a água sempre usa H : O = 1 : 8 em massa ({usedH.toFixed(1)} g : {usedO.toFixed(1)} g). Excesso de um reagente sobra sem reagir.</p>
        </div>
      )}
    </div>
  )
}

function ThomsonLab() {
  const [on, setOn] = useState(false)
  const [plates, setPlates] = useState(false)
  const [flip, setFlip] = useState(false)
  const s = flip ? -1 : 1
  const endY = plates ? 100 + s * 58 : 100
  const path = plates ? `M60 100 H200 Q262 100 322 ${100 + s * 16} L480 ${endY}` : 'M60 100 H480'
  return (
    <div>
      <p className="text-muted text-xs mb-2">Ampola de Crookes: um feixe sai do cátodo (−), atravessa uma fenda e atinge a tela fluorescente.</p>
      <svg viewBox="0 0 520 200" className="w-full text-fg">
        <rect x="20" y="30" width="480" height="140" rx="40" fill="rgba(148,163,184,0.06)" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
        <rect x="52" y="70" width="10" height="60" fill="#94a3b8" /><text x="57" y="62" textAnchor="middle" fontSize="11" fill="#94a3b8">Cátodo (−)</text>
        <rect x="196" y="40" width="8" height="52" fill="#94a3b8" /><rect x="196" y="108" width="8" height="52" fill="#94a3b8" />
        <text x="200" y="182" textAnchor="middle" fontSize="10" fill="#94a3b8">Ânodo com fenda</text>
        <rect x="200" y="60" width="120" height="6" fill={plates ? (flip ? '#38bdf8' : '#f87171') : '#475569'} />
        <rect x="200" y="134" width="120" height="6" fill={plates ? (flip ? '#f87171' : '#38bdf8') : '#475569'} />
        {plates && <><text x="260" y="55" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{flip ? '+' : '−'}</text><text x="260" y="156" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{flip ? '−' : '+'}</text></>}
        <rect x="478" y="40" width="10" height="120" fill="#14532d" />
        {on && <path d={path} fill="none" stroke="#a3e635" strokeWidth="3" strokeDasharray="8 5" className="pilha-flow" />}
        {on && <circle cx="483" cy={endY} r="7" fill="#bef264"><animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" /></circle>}
        <text x="483" y="30" textAnchor="middle" fontSize="10" fill="#94a3b8">Tela</text>
      </svg>
      <div className="flex flex-wrap gap-2 mt-2">
        <button onClick={() => setOn(!on)} className={`text-xs px-3 py-1.5 rounded-lg border transition ${on ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{on ? 'Desligar feixe' : 'Ligar feixe'}</button>
        <button onClick={() => setPlates(!plates)} className={`text-xs px-3 py-1.5 rounded-lg border transition ${plates ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{plates ? 'Desligar campo elétrico' : 'Ligar campo elétrico'}</button>
        <button onClick={() => setFlip(!flip)} disabled={!plates} className="text-xs px-3 py-1.5 rounded-lg border border-edge text-muted hover:text-fg disabled:opacity-40 transition">Inverter polaridade</button>
      </div>
      <p className="text-sm mt-3 text-fg">
        {!on ? 'Ligue o feixe: em linha reta, ele atinge o centro da tela.' : !plates ? 'Sem campo elétrico, o feixe segue reto.' : `O feixe desvia para a placa positiva (${flip ? 'de cima' : 'de baixo'}): ele é formado por partículas de carga negativa, os elétrons.`}
      </p>
    </div>
  )
}

function RutherfordLab() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const sim = useRef({ parts: [] as any[], spawned: 0, running: false, hits: [] as { x: number; y: number }[] })
  const [tally, setTally] = useState({ pass: 0, dev: 0, back: 0, total: 0 })
  const tallyRef = useRef(tally)

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const W = c.width, H = c.height
    const foilX = W * 0.55
    const nuclei: { x: number; y: number }[] = []
    for (let y = 22; y < H; y += 26) for (let dx of [-6, 0, 6]) nuclei.push({ x: foilX + dx, y: y + (dx === 0 ? 8 : 0) })
    let raf = 0, last = 0
    const loop = (now: number) => {
      const st = sim.current
      if (st.running && st.spawned < 100 && now - last > 60) {
        last = now
        const y = 20 + Math.random() * (H - 40)
        const r = Math.random()
        const kind = r < 0.9 ? 'pass' : r < 0.985 ? 'dev' : 'back'
        st.parts.push({ x: 10, y, vx: 5, vy: 0, kind, done: false, turned: false })
        st.spawned++
      }
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#facc1533'
      ctx.fillRect(foilX - 12, 0, 24, H)
      ctx.fillStyle = '#facc15'
      nuclei.forEach((n) => { ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, 7); ctx.fill() })
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(0, H / 2 - 12, 10, 24)
      ctx.fillStyle = '#14532d'
      ctx.fillRect(W - 8, 0, 8, H)
      ctx.fillStyle = '#bef264'
      st.hits.forEach((h) => { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(h.x, h.y, 2.5, 0, 7); ctx.fill() })
      ctx.globalAlpha = 1
      st.parts.forEach((p) => {
        if (p.done) return
        if (!p.turned && p.x >= foilX - 4) {
          p.turned = true
          if (p.kind === 'dev') p.vy = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 3)
          if (p.kind === 'back') { p.vx = -4; p.vy = (Math.random() - 0.5) * 2 }
          if (p.kind === 'pass') p.vy = (Math.random() - 0.5) * 0.4
        }
        p.x += p.vx
        p.y += p.vy
        ctx.fillStyle = p.kind === 'back' ? '#f87171' : p.kind === 'dev' ? '#fb923c' : '#38bdf8'
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, 7); ctx.fill()
        if (p.x > W - 10 || p.x < 2 || p.y < 0 || p.y > H) {
          p.done = true
          if (p.x > W - 10) st.hits.push({ x: W - 14, y: Math.max(4, Math.min(H - 4, p.y)) })
          const t = tallyRef.current
          const next = { pass: t.pass + (p.kind === 'pass' ? 1 : 0), dev: t.dev + (p.kind === 'dev' ? 1 : 0), back: t.back + (p.kind === 'back' ? 1 : 0), total: t.total + 1 }
          tallyRef.current = next
          setTally(next)
        }
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const fire = () => { sim.current = { parts: [], spawned: 0, running: true, hits: [] }; tallyRef.current = { pass: 0, dev: 0, back: 0, total: 0 }; setTally(tallyRef.current) }
  return (
    <div>
      <p className="text-muted text-xs mb-2">Partículas α (azul) são disparadas contra uma lâmina finíssima de ouro (amarelo).</p>
      <canvas ref={canvas} width={420} height={220} className="w-full rounded-lg bg-[#0f172a] border border-edge" />
      <div className="flex gap-2 mt-2">
        <button onClick={fire} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition"><Play size={14} /> Disparar 100 partículas α</button>
        <button onClick={() => { sim.current = { parts: [], spawned: 0, running: false, hits: [] }; tallyRef.current = { pass: 0, dev: 0, back: 0, total: 0 }; setTally(tallyRef.current) }} className="inline-flex items-center gap-1.5 border border-edge text-muted hover:text-fg text-sm px-3 py-2 rounded-lg transition"><RotateCcw size={14} /> Reiniciar</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="rounded-lg bg-app border border-edge p-2"><p className="text-sky-400 font-bold text-lg">{tally.pass}</p><p className="text-faint text-[10px]">atravessam direto</p></div>
        <div className="rounded-lg bg-app border border-edge p-2"><p className="text-orange-400 font-bold text-lg">{tally.dev}</p><p className="text-faint text-[10px]">sofrem desvio</p></div>
        <div className="rounded-lg bg-app border border-edge p-2"><p className="text-red-400 font-bold text-lg">{tally.back}</p><p className="text-faint text-[10px]">rebatem</p></div>
      </div>
      <p className="text-faint text-[11px] mt-2">Nota: no experimento real, só ~1 em 8000 partículas volta; aqui o número de rebatidas foi exagerado para você ver.</p>
    </div>
  )
}

const FLAMES: { el: string; name: string; color: string; label: string }[] = [
  { el: 'Li', name: 'Lítio', color: '#dc2626', label: 'vermelho carmim' },
  { el: 'Na', name: 'Sódio', color: '#facc15', label: 'amarelo' },
  { el: 'K', name: 'Potássio', color: '#c084fc', label: 'lilás' },
  { el: 'Ca', name: 'Cálcio', color: '#ea580c', label: 'vermelho-alaranjado' },
  { el: 'Sr', name: 'Estrôncio', color: '#ef4444', label: 'vermelho' },
  { el: 'Cu', name: 'Cobre', color: '#22c55e', label: 'verde' },
]

function BohrLab() {
  const [sel, setSel] = useState(FLAMES[1])
  const [lit, setLit] = useState(false)
  return (
    <div>
      <p className="text-muted text-xs mb-2">Teste de chama: um sal do elemento é levado à chama e emite uma cor característica.</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FLAMES.map((f) => (
          <button key={f.el} onClick={() => { setSel(f); setLit(false) }} className={`text-xs px-2.5 py-1 rounded-full border transition ${sel.el === f.el ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{f.el}</button>
        ))}
      </div>
      <svg viewBox="0 0 200 120" className="w-40 mx-auto block">
        <rect x="90" y="88" width="20" height="26" rx="3" fill="#64748b" />
        <path d={lit ? 'M100 88 C78 70 84 44 100 14 C116 44 122 70 100 88Z' : 'M100 88 C92 80 96 74 100 68 C104 74 108 80 100 88Z'} fill={lit ? sel.color : '#60a5fa'} opacity={lit ? 0.9 : 0.5} style={{ transition: 'all .4s' }}>
          {lit && <animate attributeName="opacity" values="0.9;0.65;0.9" dur="0.8s" repeatCount="indefinite" />}
        </path>
      </svg>
      <button onClick={() => setLit(true)} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition"><Play size={14} /> Fornecer energia ({sel.name})</button>
      {lit && (
        <p className="text-sm text-fg mt-3">Chama <strong style={{ color: sel.color }}>{sel.label}</strong>: a energia da chama excita os elétrons do {sel.name.toLowerCase()} para níveis mais altos; ao retornar, eles emitem fótons de comprimentos de onda específicos deste elemento.</p>
      )}
    </div>
  )
}

/* ---------- Página ---------- */

const ORDER: ModelKey[] = ['dalton', 'thomson', 'rutherford', 'bohr']

export default function AtomModelsPage() {
  const [model, setModel] = useState<ModelKey>('dalton')
  const [compare, setCompare] = useState(false)
  const [level, setLevel] = useState(1)
  const [photon, setPhoton] = useState<PhotonEvent>(null)
  const [last, setLast] = useState<{ text: string; color: string } | null>(null)
  const [shake, setShake] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const m = MODELS[model]

  const select = (k: ModelKey) => { setModel(k); setCompare(false); setLevel(1); setPhoton(null); setLast(null); setNote(null) }

  const absorb = (to: number) => {
    const info = photonInfo(to, level)
    setLast({ text: `Fóton absorvido: λ ≈ ${info.nm} nm (${info.band}). O elétron sobe do nível ${LEVEL_NAMES[level]} para ${LEVEL_NAMES[to]} (estado excitado).`, color: info.color })
    setLevel(to)
  }
  const emit = (to: number) => {
    const info = photonInfo(level, to)
    setLast({ text: `Fóton emitido: λ ≈ ${info.nm} nm (${info.band}). O elétron desce do nível ${LEVEL_NAMES[level]} para ${LEVEL_NAMES[to]}.`, color: info.color })
    setPhoton({ key: Date.now(), color: info.color })
    setLevel(to)
  }

  const viewerModel: AtomModel = compare ? 'compare' : model

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Modelos Atômicos</h1>
      <p className="text-muted text-sm mb-5">Viaje de Dalton a Bohr: veja cada modelo em 3D e rode os experimentos históricos que o derrubaram.</p>

      <div className="flex flex-wrap items-stretch gap-2 mb-6">
        {ORDER.map((k, i) => (
          <button key={k} onClick={() => select(k)} className={`flex-1 min-w-[130px] rounded-xl border px-3 py-2.5 text-left transition ${!compare && model === k ? 'border-primary bg-primary/10' : 'border-edge hover:border-primary/40'}`}>
            <span className="block text-faint text-[10px] font-bold">{i + 1}. {MODELS[k].year}</span>
            <span className="block text-fg text-sm font-bold" style={{ color: !compare && model === k ? MODELS[k].color : undefined }}>{MODELS[k].name}</span>
            <span className="block text-muted text-[11px]">{MODELS[k].nick}</span>
          </button>
        ))}
        <button onClick={() => setCompare(!compare)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition ${compare ? 'border-primary bg-primary/10 text-fg' : 'border-edge text-muted hover:text-fg'}`}><Layers size={16} /> Comparar modelos</button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4">
          <h2 className="text-fg font-bold mb-3">Experimento histórico</h2>
          {compare ? (
            <p className="text-muted text-sm">Selecione um modelo na linha do tempo para rodar o experimento correspondente.</p>
          ) : (
            <>
              <p className="text-faint text-xs font-semibold uppercase mb-2">{m.experiment}</p>
              {model === 'dalton' && <DaltonLab />}
              {model === 'thomson' && <ThomsonLab />}
              {model === 'rutherford' && <RutherfordLab />}
              {model === 'bohr' && <BohrLab />}
            </>
          )}
        </section>

        <section>
          <div className="relative w-full h-[440px] rounded-2xl overflow-hidden border border-edge bg-[#0f172a]">
            <AtomViewer model={viewerModel} level={level} photon={photon} shakeKey={shake} />
            <div className="absolute top-3 left-3 text-xs text-slate-300 bg-black/30 rounded-lg px-2 py-1">{compare ? 'Os quatro modelos lado a lado' : `${m.name} (${m.year}), ${m.nick}`}</div>
          </div>
          <p className="text-faint text-xs mt-2">Arraste para girar · roda do mouse ou pinça para zoom</p>

          {!compare && model === 'dalton' && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setShake((s) => s + 1); setNote('Tentativa de quebrar o átomo: no modelo de Dalton ele é maciço e indivisível. Nada acontece.') }} className="text-sm px-3 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition">Tentar quebrar o átomo</button>
                <button onClick={() => { setShake((s) => s + 1); setNote('Tentativa de passar elétrons: Dalton não conhecia elétrons, o átomo é uma esfera sem partículas menores. Não há o que transferir.') }} className="text-sm px-3 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition">Tentar passar elétrons</button>
              </div>
              {note && <p className="text-amber-300 text-sm mt-2">{note}</p>}
            </div>
          )}

          {!compare && model === 'bohr' && (
            <div className="mt-3 rounded-2xl bg-surface border border-edge p-3">
              <p className="text-fg text-sm font-semibold mb-2">Salto quântico · elétron em {LEVEL_NAMES[level]} (n = {level})</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {[2, 3, 4].filter((n) => n > level).map((n) => (
                  <button key={`u${n}`} onClick={() => absorb(n)} className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/50 text-fg hover:bg-primary/25 transition">Adicionar energia (fóton) → {LEVEL_NAMES[n]}</button>
                ))}
                {[1, 2, 3].filter((n) => n < level).map((n) => (
                  <button key={`d${n}`} onClick={() => emit(n)} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/50 text-fg hover:bg-amber-500/25 transition">{n === 1 ? 'Retornar ao estado fundamental' : `Emitir luz → ${LEVEL_NAMES[n]}`}</button>
                ))}
              </div>
              {last ? (
                <p className="text-sm text-fg flex items-start gap-2"><span className="w-4 h-4 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: last.color, boxShadow: `0 0 12px ${last.color}` }} />{last.text}</p>
              ) : (
                <p className="text-faint text-xs">Adicione energia para o elétron saltar para uma camada mais externa; depois deixe-o retornar e veja a cor da luz emitida.</p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {compare ? (
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-3">Comparação</h2>
              <div className="space-y-3">
                {ORDER.map((k) => (
                  <div key={k} className="border-b border-edge last:border-0 pb-2">
                    <p className="text-fg text-sm font-bold" style={{ color: MODELS[k].color }}>{MODELS[k].name} ({MODELS[k].year}) · {MODELS[k].nick}</p>
                    <p className="text-muted text-xs mt-0.5">{MODELS[k].postulates[0]}</p>
                    <p className="text-faint text-xs mt-0.5">Superado porque: {MODELS[k].fail.split('.')[0]}.</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">Postulados-chave</h2>
                <ul className="text-fg text-sm list-disc pl-5 space-y-1">{m.postulates.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">Por que o modelo caiu?</h2>
                <p className="text-muted text-sm leading-relaxed">{m.fail}</p>
              </div>
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Dica ENEM / FUVEST</h2>
                <p className="text-fg text-sm leading-relaxed mb-3">{m.tip}</p>
                <p className="text-faint text-xs font-semibold uppercase mb-1">Como isso cai na prova (pegadinhas)</p>
                <ul className="text-muted text-sm list-disc pl-5 space-y-1">{m.traps.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
