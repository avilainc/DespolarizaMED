'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, Image as ImageIcon, Landmark } from 'lucide-react'
import {
  BRAZIL_PERIODS, BRAZIL_OUTLINE, BRAZIL_STATES, HIDDEN_STATES, EURO_COUNTRIES, EUROPE_ALL, COUNTRY_ID_TO_NAME, MED_OUTLINES, CONFLICTS, CLASSICAL_ERAS,
  type BrazilEvent, type ConflictId,
} from '@/lib/history'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-edge last:border-0 text-xs gap-3">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-fg font-semibold text-right">{value}</span>
    </div>
  )
}

type Tab = 'brasil' | 'europa' | 'antiguidade'
const TABS: { id: Tab; label: string }[] = [
  { id: 'brasil', label: 'História do Brasil' },
  { id: 'europa', label: 'Europa e Guerras Mundiais' },
  { id: 'antiguidade', label: 'Antiguidade Clássica' },
]

const EVENT_COLORS = ['#f87171', '#38bdf8', '#facc15', '#4ade80', '#a78bfa', '#fb923c']

// projeção equirretangular simples com correção de cosseno na latitude
// média do Brasil — suficiente pra um país desse tamanho, sem precisar
// da maquinaria de projeções cartográficas do app de Cartografia.
const BR_MEAN_LAT_RAD = (-14 * Math.PI) / 180
function projBR(lat: number, lon: number): [number, number] {
  return [lon * Math.cos(BR_MEAN_LAT_RAD), lat]
}

function BrazilMap({ events, stateSet, landColor }: { events: (BrazilEvent & { color: string })[]; stateSet: 'historico' | 'com-acre' | 'atual'; landColor: string }) {
  const W = 460, H = 480, pad = 22
  const allPts = BRAZIL_OUTLINE.flatMap((ring) => ring.map(([lon, lat]) => projBR(lat, lon)))
  const xs = allPts.map((p) => p[0])
  const ys = allPts.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const X = (x: number) => W / 2 + (x - cx) * scale
  const Y = (y: number) => H / 2 - (y - cy) * scale
  const hidden = new Set(HIDDEN_STATES[stateSet])
  const visibleStates = BRAZIL_STATES.filter((s) => !hidden.has(s.sigla))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] mx-auto text-fg">
      {BRAZIL_OUTLINE.map((ring, i) => (
        <polygon
          key={i}
          points={ring.map(([lon, lat]) => { const [x, y] = projBR(lat, lon); return `${X(x).toFixed(1)},${Y(y).toFixed(1)}` }).join(' ')}
          fill={landColor} fillOpacity="0.28" stroke={landColor} strokeOpacity="0.75" strokeWidth="1"
        />
      ))}
      {visibleStates.map((s) => (
        <g key={s.sigla}>
          {s.rings.map((ring, i) => (
            <polygon key={i} points={ring.map(([lon, lat]) => { const [x, y] = projBR(lat, lon); return `${X(x).toFixed(1)},${Y(y).toFixed(1)}` }).join(' ')} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6" />
          ))}
          {(() => { const [x, y] = projBR(s.centroid[1], s.centroid[0]); return <text x={X(x)} y={Y(y)} fontSize="6.5" textAnchor="middle" className="fill-current text-fg" fontWeight="600" opacity="0.75">{s.sigla}</text> })()}
        </g>
      ))}
      {events.map((ev) => {
        const [x, y] = projBR(ev.lat, ev.lon)
        return <circle key={ev.id} cx={X(x)} cy={Y(y)} r={7} fill={ev.color} stroke="#0f172a" strokeWidth="1.5" />
      })}
    </svg>
  )
}

// projeção equirretangular com correção de cosseno na latitude média da
// Europa (~50°N) — mesma técnica do mapa do Brasil.
const EU_MEAN_LAT_RAD = (50 * Math.PI) / 180
function projEU(lat: number, lon: number): [number, number] {
  return [lon * Math.cos(EU_MEAN_LAT_RAD), lat]
}
const NAME_TO_ID = Object.fromEntries(Object.entries(COUNTRY_ID_TO_NAME).map(([id, name]) => [name, id]))

function EuropeMap({ colorOf, flagOf, labelOf, landColor }: { colorOf: (id: string) => string | undefined; flagOf: (id: string) => string | undefined; labelOf: (id: string) => string; landColor: string }) {
  const W = 520, H = 460, pad = 20
  // zoom calculado sem a Rússia (senão ela sozinha dominaria a escala e
  // amassaria o resto da Europa) — ela ainda é desenhada por inteiro, só
  // que a parte que não cabe no enquadramento sai da viewBox.
  const allPts = EUROPE_ALL.filter((c) => c.name !== 'Russia').flatMap((c) => c.rings.flatMap((ring) => ring.map(([lon, lat]) => projEU(lat, lon))))
  const xs = allPts.map((p) => p[0])
  const ys = allPts.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const X = (x: number) => W / 2 + (x - cx) * scale
  const Y = (y: number) => H / 2 - (y - cy) * scale
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[480px] mx-auto text-fg overflow-hidden">
      {EUROPE_ALL.map((c) => {
        const id = NAME_TO_ID[c.name]
        const color = id ? colorOf(id) : undefined
        return (
          <g key={c.name}>
            {c.rings.map((ring, i) => (
              <polygon
                key={i}
                points={ring.map(([lon, lat]) => { const [x, y] = projEU(lat, lon); return `${X(x).toFixed(1)},${Y(y).toFixed(1)}` }).join(' ')}
                fill={color ?? landColor} fillOpacity={color ? 0.5 : 0.18} stroke={color ?? landColor} strokeOpacity={color ? 0.9 : 0.45} strokeWidth={color ? 1.3 : 0.5}
              />
            ))}
          </g>
        )
      })}
      {EUROPE_ALL.map((c) => {
        const id = NAME_TO_ID[c.name]
        const flag = id ? flagOf(id) : undefined
        if (!id || !flag) return null
        const [x, y] = projEU(c.centroid[1], c.centroid[0])
        const fx = X(x), fy = Y(y)
        const label = labelOf(id)
        const pillW = Math.max(52, label.length * 5.6 + 10)
        return (
          <g key={`lbl-${c.name}`}>
            <rect x={fx - 12} y={fy - 21} width="24" height="16" fill="#fff" stroke="#0f172a" strokeWidth="0.8" />
            <image href={flag} x={fx - 11} y={fy - 20} width="22" height="14" preserveAspectRatio="xMidYMid slice" />
            <rect x={fx - pillW / 2} y={fy - 3} width={pillW} height="12" rx="3" fill="#0f172a" fillOpacity="0.88" />
            <text x={fx} y={fy + 6} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff">{label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// projeção equirretangular com correção de cosseno na latitude média do
// Mediterrâneo oriental (~38°N) — mesma técnica dos outros 2 mapas.
const MED_MEAN_LAT_RAD = (38 * Math.PI) / 180
function projMED(lat: number, lon: number): [number, number] {
  return [lon * Math.cos(MED_MEAN_LAT_RAD), lat]
}
const MED_KEYS = ['grecia', 'italia', 'turquia', 'egito']
// coordenadas reais aproximadas dos pontos de referência
const ROME: [number, number] = [41.9, 12.5]
const ATHENS: [number, number] = [37.98, 23.73]
const SPARTA: [number, number] = [37.08, 22.43]
const CONSTANTINOPLE: [number, number] = [41.0, 28.98]
const LEVANT: [number, number] = [33, 38]

export default function InteractiveHistoryPage() {
  const [tab, setTab] = useState<Tab>('brasil')
  const [brLandColor, setBrLandColor] = useState('#4ade80')
  const [euLandColor, setEuLandColor] = useState('#94a3b8')
  const [antLandColor, setAntLandColor] = useState('#94a3b8')

  // ---- Brasil ----
  const [periodId, setPeriodId] = useState(BRAZIL_PERIODS[2].id)
  const period = BRAZIL_PERIODS.find((p) => p.id === periodId)!
  const eventsWithColor = period.events.map((ev, i) => ({ ...ev, color: EVENT_COLORS[i % EVENT_COLORS.length] }))

  // ---- Europa ----
  const [conflictId, setConflictId] = useState<ConflictId>('ww1')
  const conflict = CONFLICTS.find((c) => c.id === conflictId)!
  const sideOf = (countryId: string) => conflict.sides.find((s) => s.countries.some((c) => c.id === countryId))
  const colorOf = (countryId: string) => sideOf(countryId)?.color
  const flagOf = (countryId: string) => sideOf(countryId)?.countries.find((c) => c.id === countryId)?.flag
  const labelOf = (countryId: string) => EURO_COUNTRIES.find((c) => c.id === countryId)?.label ?? countryId

  // ---- Antiguidade ----
  const [eraId, setEraId] = useState(CLASSICAL_ERAS[6].id)
  const era = CLASSICAL_ERAS.find((e) => e.id === eraId)!
  const grecia = CLASSICAL_ERAS.filter((e) => e.civ === 'grecia')
  const roma = CLASSICAL_ERAS.filter((e) => e.civ === 'roma')

  const pillBtn = (active: boolean) => `text-xs px-2.5 py-1.5 rounded-lg border transition ${active ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">História Interativa e Georreferenciada</h1>
      <p className="text-muted text-sm mb-4">Mapas, linhas do tempo e fichas de análise histórica para o vestibular.</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`text-sm px-3.5 py-2 rounded-xl border font-semibold transition ${tab === t.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'brasil' && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {BRAZIL_PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriodId(p.id)} className={pillBtn(periodId === p.id)}>{p.label} <span className="opacity-60">({p.years})</span></button>
          ))}
        </div>
      )}
      {tab === 'europa' && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CONFLICTS.map((c) => (
            <button key={c.id} onClick={() => setConflictId(c.id)} className={pillBtn(conflictId === c.id)}>{c.label} <span className="opacity-60">({c.years})</span></button>
          ))}
        </div>
      )}
      {tab === 'antiguidade' && (
        <div className="mb-5 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-faint text-[11px] font-semibold uppercase mr-1">Grécia:</span>
            {grecia.map((e) => <button key={e.id} onClick={() => setEraId(e.id)} className={pillBtn(eraId === e.id)}>{e.label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-faint text-[11px] font-semibold uppercase mr-1">Roma:</span>
            {roma.map((e) => <button key={e.id} onClick={() => setEraId(e.id)} className={pillBtn(eraId === e.id)}>{e.label}</button>)}
          </div>
        </div>
      )}

      {tab === 'brasil' && (
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] gap-5 items-start">
          <div className="space-y-3">
            <div className="bg-surface border border-edge rounded-2xl p-3">
              <p className="text-fg font-semibold text-xs mb-1">{period.label} <span className="text-faint font-normal">({period.years})</span></p>
              <p className="text-faint text-[11px] mb-1.5">Divisão territorial: {period.division}</p>
              <p className="text-muted text-[11px]">{period.summary}</p>
            </div>
            {eventsWithColor.length === 0 && (
              <div className="bg-surface border border-edge rounded-2xl p-3">
                <p className="text-muted text-xs">Esse período não tem eventos cadastrados.</p>
              </div>
            )}
            {eventsWithColor.map((ev) => (
              <div key={ev.id} className="bg-surface border border-edge rounded-2xl p-3" style={{ borderLeftColor: ev.color, borderLeftWidth: 3 }}>
                <h2 className="font-bold text-sm mb-0.5" style={{ color: ev.color }}>{ev.label}</h2>
                <p className="text-faint text-[10px] mb-1.5">{ev.years} · {ev.place}</p>
                <Row label="Liderança / classes" value={ev.leaders} />
                <p className="text-faint text-[10px] font-semibold uppercase mt-1.5 mb-0.5">Causas</p>
                <p className="text-fg text-xs mb-1.5">{ev.causes}</p>
                <p className="text-faint text-[10px] font-semibold uppercase mb-0.5">Desfecho</p>
                <p className="text-fg text-xs mb-1.5">{ev.outcome}</p>
                <p className="text-muted text-xs italic">{ev.examTip}</p>
              </div>
            ))}
          </div>

          <section className="bg-surface border border-edge rounded-2xl p-4">
            <label className="flex items-center justify-between mb-2">
              <span className="text-xs text-faint">Cor do mapa</span>
              <input type="color" value={brLandColor} onChange={(e) => setBrLandColor(e.target.value)} className="w-9 h-7 rounded border border-edge bg-transparent cursor-pointer" />
            </label>
            <BrazilMap events={eventsWithColor} stateSet={period.stateSet} landColor={brLandColor} />
            <p className="text-center text-faint text-[11px] mt-1">Divisão territorial da época (contorno atual do Brasil) — cada bolinha colorida é um evento listado ao lado</p>
          </section>
        </div>
      )}

      {tab === 'europa' && (
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] gap-5 items-start">
          <div className="space-y-4">
            {conflict.sides.length > 0 && (
              <div className="bg-surface border border-edge rounded-2xl p-4 flex flex-wrap gap-3">
                {conflict.sides.map((s) => (
                  <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="w-3 h-3 rounded-full" style={{ background: s.color }} /> {s.label}</span>
                ))}
              </div>
            )}
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-2">Antecedentes e estopim</h2>
              <p className="text-fg text-sm mb-3">{conflict.antecedents}</p>
              <h3 className="text-fg font-bold mb-1.5 flex items-center gap-1.5 text-sm"><ImageIcon size={14} /> Análise de fontes históricas</h3>
              <p className="text-muted text-sm">{conflict.sourcesNote}</p>
            </div>
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Como cai na prova</h3>
              <p className="text-fg text-sm">{conflict.examTip}</p>
            </div>
          </div>

          <section className="bg-surface border border-edge rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-fg font-semibold text-sm">{conflict.label} <span className="text-faint font-normal">({conflict.years})</span></p>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-faint">Cor do mapa</span>
                <input type="color" value={euLandColor} onChange={(e) => setEuLandColor(e.target.value)} className="w-8 h-6 rounded border border-edge bg-transparent cursor-pointer" />
              </label>
            </div>
            <EuropeMap colorOf={colorOf} flagOf={flagOf} labelOf={labelOf} landColor={euLandColor} />
            <p className="text-center text-faint text-[11px] mt-1">Mapa atual da Europa — países envolvidos aparecem coloridos, com bandeira e nome</p>
          </section>
        </div>
      )}

      {tab === 'antiguidade' && (
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] gap-5 items-start">
          <div className="space-y-4">
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h2 className="text-fg font-bold mb-2">Contexto</h2>
              <p className="text-fg text-sm mb-3">{era.description}</p>
              <h3 className="text-fg font-bold mb-1.5 text-sm">Cidadania e política</h3>
              <p className="text-muted text-sm">{era.citizenshipNote}</p>
            </div>
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Caiu no ENEM</h3>
              <p className="text-fg text-sm">{era.examTip}</p>
            </div>
          </div>

          <section className="bg-surface border border-edge rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-fg font-semibold text-sm flex items-center gap-1.5"><Landmark size={15} /> {era.label} <span className="text-faint font-normal">({era.years})</span></p>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-faint">Cor do mapa</span>
                <input type="color" value={antLandColor} onChange={(e) => setAntLandColor(e.target.value)} className="w-8 h-6 rounded border border-edge bg-transparent cursor-pointer" />
              </label>
            </div>
            {(() => {
              const W = 460, H = 420, pad = 20
              const allPts = MED_KEYS.flatMap((k) => MED_OUTLINES[k].flatMap((ring) => ring.map(([lon, lat]) => projMED(lat, lon))))
              const xs = allPts.map((p) => p[0]), ys = allPts.map((p) => p[1])
              const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
              const scale = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY))
              const cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2
              const X = (x: number) => W / 2 + (x - cx0) * scale
              const Y = (y: number) => H / 2 - (y - cy0) * scale
              const pt = ([lat, lon]: [number, number]) => { const [x, y] = projMED(lat, lon); return [X(x), Y(y)] as [number, number] }
              const r = (era.territoryRadius / 10) * scale
              const [romeX, romeY] = pt(ROME)
              const [athX, athY] = pt(ATHENS)
              const [spaX, spaY] = pt(SPARTA)
              const [conX, conY] = pt(CONSTANTINOPLE)
              const [levX, levY] = pt(LEVANT)
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] mx-auto text-fg overflow-hidden">
                  {MED_KEYS.map((k) => (
                    <g key={k}>
                      {MED_OUTLINES[k].map((ring, i) => (
                        <polygon key={i} points={ring.map(([lon, lat]) => { const [x, y] = projMED(lat, lon); return `${X(x).toFixed(1)},${Y(y).toFixed(1)}` }).join(' ')} fill={antLandColor} fillOpacity="0.28" stroke={antLandColor} strokeOpacity="0.7" strokeWidth="1" />
                      ))}
                    </g>
                  ))}
                  <text x={W / 2} y="16" fontSize="9" textAnchor="middle" className="fill-current text-faint">extensão territorial (esquemática, sobre o litoral atual)</text>
                  {era.civ === 'roma' && !era.split && (
                    <circle cx={romeX} cy={romeY} r={r} fill="#f87171" fillOpacity="0.25" stroke="#f87171" strokeWidth="2" />
                  )}
                  {era.civ === 'roma' && era.split && (
                    <>
                      <circle cx={romeX} cy={romeY} r={r * 0.7} fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx={conX} cy={conY} r={r * 0.7} fill="#facc15" fillOpacity="0.25" stroke="#facc15" strokeWidth="2" />
                      <text x={romeX} y={romeY} fontSize="8" textAnchor="middle" className="fill-current text-fg">Ocidente</text>
                      <text x={conX} y={conY} fontSize="8" textAnchor="middle" className="fill-current text-fg">Oriente</text>
                    </>
                  )}
                  {era.civ === 'roma' && <><circle cx={romeX} cy={romeY} r="3" fill="#f87171" /><text x={romeX + 6} y={romeY - 6} fontSize="8" className="fill-current text-fg">Roma</text></>}
                  {era.civ === 'grecia' && (
                    <>
                      <circle cx={athX} cy={athY} r={4} fill="#f87171" />
                      <text x={athX} y={athY - 8} fontSize="8" textAnchor="middle" className="fill-current text-fg">Atenas</text>
                      <circle cx={spaX} cy={spaY} r={4} fill="#facc15" />
                      <text x={spaX} y={spaY + 14} fontSize="8" textAnchor="middle" className="fill-current text-fg">Esparta</text>
                      {era.id === 'helenistico' && (
                        <ellipse cx={levX} cy={levY} rx={r} ry={r * 0.5} fill="#a78bfa" fillOpacity="0.25" stroke="#a78bfa" strokeWidth="2" />
                      )}
                      {era.id === 'helenistico' && <text x={levX} y={levY} fontSize="8" textAnchor="middle" className="fill-current text-fg">Império de Alexandre</text>}
                    </>
                  )}
                </svg>
              )
            })()}
          </section>
        </div>
      )}
    </div>
  )
}
