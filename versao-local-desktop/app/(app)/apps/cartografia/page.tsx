'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe2, Plane, Ruler, Lightbulb, Mountain } from 'lucide-react'
import { CITIES, calcArrival, solveScale, buildGraticule, project, type ProjectionId, type ScaleField, type Graticule } from '@/lib/cartography'

const num = (n: number, d = 2) => (Number.isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—')
const pad2 = (n: number) => n.toString().padStart(2, '0')

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

type Mode = 'fusos' | 'projecoes' | 'escala'
const MODES: { id: Mode; label: string; icon: typeof Globe2 }[] = [
  { id: 'fusos', label: 'Fusos Horários', icon: Plane },
  { id: 'projecoes', label: 'Projeções', icon: Globe2 },
  { id: 'escala', label: 'Escala & Relevo', icon: Ruler },
]

const PROJECTIONS: { id: ProjectionId; label: string }[] = [
  { id: 'mercator', label: 'Mercator' },
  { id: 'peters', label: 'Peters' },
  { id: 'robinson', label: 'Robinson' },
  { id: 'azimutal', label: 'Azimutal (ONU)' },
]

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerpGraticule(a: Graticule, b: Graticule, t: number): Graticule {
  const e = ease(t)
  const lerpLines = (la: Graticule['meridians'], lb: Graticule['meridians']) =>
    la.map((line, i) => ({
      points: line.points.map((p, j) => {
        const q = lb[i].points[j]
        return [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e] as [number, number]
      }),
    }))
  const meridians = lerpLines(a.meridians, b.meridians)
  const parallels = lerpLines(a.parallels, b.parallels)
  const land = lerpLines(a.land, b.land)
  const allPts = [...meridians.flatMap((m) => m.points), ...parallels.flatMap((p) => p.points)]
  const xs = allPts.map((p) => p[0])
  const ys = allPts.map((p) => p[1])
  return { meridians, parallels, land, extent: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) } }
}

function GraticuleMap({ g, extraLines, landColor = '#4ade80' }: { g: Graticule; extraLines?: { points: [number, number][]; color: string }[]; landColor?: string }) {
  const W = 560, H = 380, pad = 28
  const { minX, maxX, minY, maxY } = g.extent
  const scale = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const X = (x: number) => W / 2 + (x - cx) * scale
  const Y = (y: number) => H / 2 - (y - cy) * scale
  const toPts = (points: [number, number][]) => points.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')
  const equatorIdx = Math.floor(g.parallels.length / 2)
  const greenwichIdx = Math.floor(g.meridians.length / 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      {g.land.map((line, i) => (
        <polygon key={`l${i}`} points={toPts(line.points)} fill={landColor} fillOpacity="0.28" stroke={landColor} strokeOpacity="0.6" strokeWidth="0.7" />
      ))}
      {g.parallels.map((line, i) => (
        <polyline key={`p${i}`} points={toPts(line.points)} fill="none" stroke="currentColor" strokeOpacity={i === equatorIdx ? 0.5 : 0.18} strokeWidth={i === equatorIdx ? 1.6 : 1} />
      ))}
      {g.meridians.map((line, i) => (
        <polyline key={`m${i}`} points={toPts(line.points)} fill="none" stroke="currentColor" strokeOpacity={i === greenwichIdx ? 0.5 : 0.18} strokeWidth={i === greenwichIdx ? 1.6 : 1} />
      ))}
      {extraLines?.map((l, i) => (
        <polyline key={`x${i}`} points={toPts(l.points)} fill="none" stroke={l.color} strokeWidth="2.5" />
      ))}
    </svg>
  )
}

export default function CartographyPage() {
  const [mode, setMode] = useState<Mode>('fusos')

  // ---- Modo 1: fusos horários ----
  const [originId, setOriginId] = useState('sp')
  const [destId, setDestId] = useState('londres')
  const [depH, setDepH] = useState(22)
  const [depM, setDepM] = useState(0)
  const [flightHours, setFlightHours] = useState(11)
  const origin = CITIES.find((c) => c.id === originId)!
  const dest = CITIES.find((c) => c.id === destId)!
  const arrival = calcArrival(origin.utc, dest.utc, depH, depM, flightHours)

  // ---- Modo 2: projeções ----
  const [proj, setProj] = useState<ProjectionId>('mercator')
  const [progress, setProgress] = useState(1)
  const fromG = useRef<Graticule>(buildGraticule('mercator'))
  const toG = useRef<Graticule>(buildGraticule('mercator'))
  const settledProj = useRef<ProjectionId>('mercator')

  useEffect(() => {
    if (proj === settledProj.current) return
    fromG.current = toG.current
    toG.current = buildGraticule(proj)
    settledProj.current = proj
    let raf = 0
    const start = performance.now()
    const dur = 700
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [proj])

  const displayGraticule = progress >= 1 ? toG.current : lerpGraticule(fromG.current, toG.current, progress)

  // ---- Modo 3: escala e relevo ----
  const [scaleField, setScaleField] = useState<ScaleField>('D')
  const [denomE, setDenomE] = useState(50000)
  const [dCm, setDCm] = useState(4)
  const [dKm, setDKm] = useState(20)
  const scaleResult = solveScale(scaleField, { denomE, dCm, dKm })
  const [peak, setPeak] = useState(600)
  const [spread, setSpread] = useState(60)

  const [landColor, setLandColor] = useState('#4ade80')
  const fusosGraticule = buildGraticule('robinson')
  const originLon = origin.utc * 15
  const destLon = dest.utc * 15
  const meridianLine = (lon: number): [number, number][] => {
    const pts: [number, number][] = []
    for (let lat = -85; lat <= 85; lat += 5) pts.push(project('robinson', lat, lon))
    return pts
  }

  const modeBtn = (m: Mode) => {
    const M = MODES.find((x) => x.id === m)!
    const Icon = M.icon
    return (
      <button key={m} onClick={() => setMode(m)} className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition inline-flex items-center justify-center gap-1.5 ${mode === m ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>
        <Icon size={13} /> {M.label}
      </button>
    )
  }

  // curvas de nível: altura h(r) = peak * exp(-r²/(2*spread²)); raio pra um dado nível
  const levels = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((frac) => frac * peak).filter((h) => h > 0 && h < peak)
  const radiusFor = (h: number) => (h < peak ? spread * Math.sqrt(-2 * Math.log(h / peak)) : 0)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Cartografia, Fusos Horários & Projeções</h1>
      <p className="text-muted text-sm mb-5">Calcule fusos de voos, compare projeções cartográficas e leia escalas e curvas de nível.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] gap-5 items-start">
        <div className="space-y-5">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Modo</p>
            <div className="flex flex-col gap-1.5">{MODES.map((m) => modeBtn(m.id))}</div>
          </div>
          {mode !== 'escala' && (
            <label className="flex items-center justify-between">
              <span className="text-xs text-faint">Cor do mapa</span>
              <input type="color" value={landColor} onChange={(e) => setLandColor(e.target.value)} className="w-9 h-7 rounded border border-edge bg-transparent cursor-pointer" />
            </label>
          )}

          {mode === 'fusos' && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-faint">Cidade de origem</span>
                <select value={originId} onChange={(e) => setOriginId(e.target.value)} className="w-full mt-1 bg-app border border-edge rounded-lg px-2 py-1.5 text-sm text-fg">
                  {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label} (UTC{c.utc >= 0 ? '+' : ''}{c.utc})</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-faint">Cidade de destino</span>
                <select value={destId} onChange={(e) => setDestId(e.target.value)} className="w-full mt-1 bg-app border border-edge rounded-lg px-2 py-1.5 text-sm text-fg">
                  {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label} (UTC{c.utc >= 0 ? '+' : ''}{c.utc})</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <label className="block flex-1">
                  <span className="text-xs text-faint">Hora de partida</span>
                  <input type="number" min={0} max={23} value={depH} onChange={(e) => setDepH(Math.max(0, Math.min(23, +e.target.value)))} className="w-full mt-1 bg-app border border-edge rounded-lg px-2 py-1.5 text-sm text-fg" />
                </label>
                <label className="block flex-1">
                  <span className="text-xs text-faint">Minuto</span>
                  <input type="number" min={0} max={59} value={depM} onChange={(e) => setDepM(Math.max(0, Math.min(59, +e.target.value)))} className="w-full mt-1 bg-app border border-edge rounded-lg px-2 py-1.5 text-sm text-fg" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-faint">Tempo de voo: {flightHours} h</span>
                <input type="range" min={1} max={20} value={flightHours} onChange={(e) => setFlightHours(+e.target.value)} className="w-full accent-primary" />
              </label>
            </div>
          )}

          {mode === 'projecoes' && (
            <div>
              <p className="text-faint text-xs font-semibold uppercase mb-2">Projeção</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PROJECTIONS.map((p) => (
                  <button key={p.id} onClick={() => setProj(p.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${proj === p.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{p.label}</button>
                ))}
              </div>
              <p className="text-faint text-[11px] mt-2 leading-relaxed">A grade de paralelos e meridianos (a cada 30°) mostra como cada projeção estica ou comprime o globo — sem depender do contorno dos continentes.</p>
            </div>
          )}

          {mode === 'escala' && (
            <div className="space-y-3">
              <p className="text-faint text-xs font-semibold uppercase mb-2">O que você quer calcular?</p>
              <div className="grid grid-cols-3 gap-1.5 mb-1">
                <button onClick={() => setScaleField('E')} className={`text-xs px-2 py-1.5 rounded-lg border transition ${scaleField === 'E' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Escala (E)</button>
                <button onClick={() => setScaleField('d')} className={`text-xs px-2 py-1.5 rounded-lg border transition ${scaleField === 'd' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Dist. mapa (d)</button>
                <button onClick={() => setScaleField('D')} className={`text-xs px-2 py-1.5 rounded-lg border transition ${scaleField === 'D' ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>Dist. real (D)</button>
              </div>
              {scaleField !== 'E' && (
                <label className="block">
                  <span className="text-xs text-faint">Escala 1 : {num(denomE, 0)}</span>
                  <input type="range" min={1000} max={500000} step={1000} value={denomE} onChange={(e) => setDenomE(+e.target.value)} className="w-full accent-primary" />
                </label>
              )}
              {scaleField !== 'd' && (
                <label className="block">
                  <span className="text-xs text-faint">Distância no mapa (d): {num(dCm, 1)} cm</span>
                  <input type="range" min={0.5} max={30} step={0.5} value={dCm} onChange={(e) => setDCm(+e.target.value)} className="w-full accent-primary" />
                </label>
              )}
              {scaleField !== 'D' && (
                <label className="block">
                  <span className="text-xs text-faint">Distância real (D): {num(dKm, 1)} km</span>
                  <input type="range" min={0.5} max={500} step={0.5} value={dKm} onChange={(e) => setDKm(+e.target.value)} className="w-full accent-primary" />
                </label>
              )}
              <hr className="border-edge" />
              <label className="block">
                <span className="text-xs text-faint">Altura do pico: {peak} m</span>
                <input type="range" min={100} max={1500} step={50} value={peak} onChange={(e) => setPeak(+e.target.value)} className="w-full accent-primary" />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Declividade (menor = morro mais íngreme): {spread}</span>
                <input type="range" min={20} max={120} step={5} value={spread} onChange={(e) => setSpread(+e.target.value)} className="w-full accent-primary" />
              </label>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Cálculo</h2>
            {mode === 'fusos' && (
              <>
                <p className="text-muted text-sm font-mono mb-2">Diferença de fuso = UTC destino − UTC origem</p>
                <p className="text-fg text-sm font-mono mb-3">
                  {dest.utc >= 0 ? '+' : ''}{dest.utc} − ({origin.utc >= 0 ? '+' : ''}{origin.utc}) = {arrival.timeDiff >= 0 ? '+' : ''}{arrival.timeDiff}h
                </p>
                <Row label="Partida (local, origem)" value={`${pad2(depH)}:${pad2(depM)}`} />
                <Row label="Chegada (local, destino)" value={`${pad2(arrival.arrH)}:${pad2(arrival.arrM)}`} />
                <Row label="Dia da chegada" value={arrival.dayOffset === 0 ? 'mesmo dia' : arrival.dayOffset > 0 ? `+${arrival.dayOffset} dia(s)` : `${arrival.dayOffset} dia(s)`} />
              </>
            )}
            {mode === 'projecoes' && (
              <>
                <Row label="Preserva" value={proj === 'mercator' ? 'formas (ângulos)' : proj === 'peters' ? 'áreas' : proj === 'robinson' ? 'equilíbrio (nenhuma exata)' : 'distâncias ao centro'} />
                <Row label="Maior distorção" value={proj === 'mercator' ? 'área nos polos' : proj === 'peters' ? 'forma nos polos' : proj === 'robinson' ? 'leve, distribuída' : 'forma nas bordas'} />
              </>
            )}
            {mode === 'escala' && (
              <>
                <p className="text-muted text-sm font-mono mb-2">E = d / D</p>
                <p className="text-fg text-sm font-mono mb-3">
                  1 : {num(scaleResult.denomE, 0)} = {num(scaleResult.dCm, 1)} cm / {num(scaleResult.dKm, 1)} km
                </p>
                <Row label="Escala" value={`1 : ${num(scaleResult.denomE, 0)}`} />
                <Row label="Distância no mapa" value={`${num(scaleResult.dCm, 1)} cm`} />
                <Row label="Distância real" value={`${num(scaleResult.dKm, 1)} km`} />
              </>
            )}
          </div>

          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Como cai na prova</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              {mode === 'fusos' && (
                <>
                  <li>A cada 15° de longitude, 1 hora de diferença. Viajando para Leste (rumo ao nascente), os relógios adiantam; para Oeste, atrasam.</li>
                  <li>A Linha Internacional de Data (~180°) inverte o dia: cruzá-la para Leste "ganha" um dia; para Oeste, "perde" um dia.</li>
                  <li>Cuidado com o horário de verão em provas: alguns países adiantam 1h em parte do ano — leia o enunciado com atenção.</li>
                </>
              )}
              {mode === 'projecoes' && (
                <>
                  <li>Mercator (1569) preserva ângulos — ótima pra navegação, mas infla drasticamente a área de países de alta latitude (Groenlândia parece do tamanho da África, quando é ~14× menor). Associada ao eurocentrismo da Guerra Fria.</li>
                  <li>Peters (1973) preserva áreas reais — valoriza visualmente o Sul Global (África, América Latina), mas distorce bastante as formas. Muito cobrada em FUVEST/UNICAMP como crítica à Mercator.</li>
                  <li>Robinson busca um equilíbrio visual (nem forma nem área exatas) — usada por atlas e pela National Geographic por ser estética e didática.</li>
                  <li>Azimutal equidistante centrada no polo é a base do emblema da ONU: distâncias ao centro (polo) são reais, mas a distorção cresce muito nas bordas.</li>
                </>
              )}
              {mode === 'escala' && (
                <>
                  <li>Escala grande (ex.: 1:5.000) = mapa mais detalhado e área menor representada. Escala pequena (ex.: 1:5.000.000) = menos detalhe, área maior — é o denominador que manda, não o número em si.</li>
                  <li>Sempre converta para a mesma unidade antes de aplicar E = d/D: distância real em km → multiplique por 100.000 para virar cm.</li>
                  <li>Curvas de nível nunca se cruzam; quanto mais próximas entre si, maior a declividade (relevo mais íngreme).</li>
                </>
              )}
            </ul>
          </div>
        </section>
        </div>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          {mode === 'fusos' && (
            <>
              <p className="text-faint text-xs font-semibold uppercase mb-2">Faixa de fusos (UTC-12 a UTC+12)</p>
              <svg viewBox="0 0 480 70" className="w-full text-fg mb-3">
                {Array.from({ length: 25 }, (_, i) => i - 12).map((tz) => {
                  const x = (tz + 12) * 19.2
                  const isOrigin = tz === Math.round(origin.utc)
                  const isDest = tz === Math.round(dest.utc)
                  return (
                    <g key={tz}>
                      <rect x={x} y={10} width={19.2} height={30} fill={isOrigin ? '#38bdf8' : isDest ? '#facc15' : 'currentColor'} fillOpacity={isOrigin || isDest ? 0.5 : 0.06} stroke="currentColor" strokeOpacity="0.15" />
                      {tz % 3 === 0 && <text x={x + 9.6} y={54} fontSize="7" textAnchor="middle" className="fill-current text-faint">{tz}</text>}
                    </g>
                  )
                })}
                <text x={(Math.round(origin.utc) + 12) * 19.2 + 9.6} y={7} fontSize="8" fontWeight="700" textAnchor="middle" fill="#38bdf8">{origin.label}</text>
                <text x={(Math.round(dest.utc) + 12) * 19.2 + 9.6} y={7} fontSize="8" fontWeight="700" textAnchor="middle" fill="#facc15">{dest.label}</text>
              </svg>
              <GraticuleMap
                g={fusosGraticule}
                landColor={landColor}
                extraLines={[{ points: meridianLine(originLon), color: '#38bdf8' }, { points: meridianLine(destLon), color: '#facc15' }]}
              />
              <p className="text-center text-faint text-xs mt-1">Meridianos aproximados de origem (azul) e destino (amarelo)</p>
            </>
          )}

          {mode === 'projecoes' && (
            <>
              <p className="text-faint text-xs font-semibold uppercase mb-2">{PROJECTIONS.find((p) => p.id === proj)?.label}</p>
              <GraticuleMap g={displayGraticule} landColor={landColor} />
              <p className="text-center text-faint text-xs mt-1">Grade de paralelos (horizontais) e meridianos (verticais) a cada 30°</p>
            </>
          )}

          {mode === 'escala' && (
            <>
              <p className="text-faint text-xs font-semibold uppercase mb-2 flex items-center gap-1.5"><Mountain size={13} /> Curvas de nível</p>
              <svg viewBox="0 0 300 220" className="w-full max-w-[300px] mx-auto text-fg">
                {[...levels].reverse().map((h) => {
                  const r = radiusFor(h)
                  return <circle key={h} cx="150" cy="110" r={r} fill="none" stroke="#fb923c" strokeOpacity="0.7" strokeWidth="1.5" />
                })}
                <circle cx="150" cy="110" r="3" fill="#fb923c" />
                <text x="150" y="130" fontSize="9" textAnchor="middle" className="fill-current text-faint">pico: {peak} m</text>
              </svg>
              <p className="text-center text-faint text-xs mt-1">Curvas mais próximas = relevo mais íngreme (maior declividade)</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
