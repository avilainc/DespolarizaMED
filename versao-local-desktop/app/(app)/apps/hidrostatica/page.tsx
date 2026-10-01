'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { LIQUIDS, G, ATM_PA, stevin, pascal, torricelli, archimedes } from '@/lib/hydrostatics'

const num = (n: number, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

type Mode = 'stevin' | 'pascal' | 'torricelli' | 'arquimedes'
const MODES: { id: Mode; label: string }[] = [
  { id: 'stevin', label: 'Teorema de Stevin' },
  { id: 'pascal', label: 'Princípio de Pascal' },
  { id: 'torricelli', label: 'Experimento de Torricelli' },
  { id: 'arquimedes', label: 'Princípio de Arquimedes' },
]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

export default function HydrostaticsPage() {
  const [mode, setMode] = useState<Mode>('stevin')

  // Stevin
  const [liquidId, setLiquidId] = useState('agua')
  const [depth, setDepth] = useState(5)
  const liquid = LIQUIDS.find((l) => l.id === liquidId)!
  const st = stevin(liquid.d, depth)

  // Pascal
  const [F1, setF1] = useState(100)
  const [A1, setA1] = useState(0.02)
  const [A2, setA2] = useState(0.3)
  const pa = pascal(F1, A1, A2)
  const disp1 = 0.1 // deslocamento fixo do pistão 1, em m
  const disp2 = disp1 * (A1 / A2)

  // Torricelli
  const [altitude, setAltitude] = useState(0)
  const tor = torricelli(altitude)
  const torSea = torricelli(0)

  // Arquimedes
  const [dObjId, setDObjId] = useState('gelo')
  const OBJECTS = [
    { id: 'isopor', label: 'Isopor', d: 50 },
    { id: 'gelo', label: 'Gelo', d: 920 },
    { id: 'madeira', label: 'Madeira', d: 700 },
    { id: 'ferro', label: 'Ferro', d: 7870 },
    { id: 'ouro', label: 'Ouro', d: 19300 },
  ]
  const [arqLiquidId, setArqLiquidId] = useState('agua')
  const [volume, setVolume] = useState(2)
  const obj = OBJECTS.find((o) => o.id === dObjId)!
  const arqLiquid = LIQUIDS.find((l) => l.id === arqLiquidId)!
  const arq = archimedes(obj.d, arqLiquid.d, volume / 1000)

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Hidrostática</h1>
      <p className="text-muted text-sm mb-5">Stevin, Pascal, Torricelli e Arquimedes — pressão, prensas hidráulicas, altitude e empuxo.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`px-3 py-2 rounded-xl border text-sm transition ${mode === m.id ? 'border-primary bg-primary/10 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{m.label}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        {mode === 'stevin' && (
          <>
            <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-faint text-xs font-semibold uppercase mb-2">Líquido</p>
                <div className="flex flex-wrap gap-1.5">
                  {LIQUIDS.map((l) => (
                    <button key={l.id} onClick={() => setLiquidId(l.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${liquidId === l.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{l.label}</button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs text-faint">Profundidade h: {depth} m</span>
                <input type="range" min={0} max={50} value={depth} onChange={(e) => setDepth(+e.target.value)} className="w-full accent-primary" />
              </label>
            </section>
            <section className="bg-surface border border-edge rounded-2xl p-4">
              <svg viewBox="0 0 320 260" className="w-full max-w-[280px] mx-auto">
                <rect x="40" y="20" width="220" height="220" fill={liquid.color} fillOpacity="0.25" stroke="currentColor" strokeOpacity="0.5" className="text-fg" />
                <line x1="40" y1={20 + (depth / 50) * 220} x2="260" y2={20 + (depth / 50) * 220} stroke="#facc15" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="150" cy={20 + (depth / 50) * 220} r="7" fill="#f87171" />
                <text x="150" y="14" textAnchor="middle" fontSize="11" className="fill-current text-fg">superfície (P0 = 1 atm)</text>
                <text x="266" y={20 + (depth / 50) * 220 + 4} fontSize="11" className="fill-current text-fg">h = {depth} m</text>
              </svg>
            </section>
            <section className="space-y-4">
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">Cálculo</h2>
                <p className="text-muted text-sm font-mono mb-2">P = P0 + d·g·h</p>
                <p className="text-fg text-sm font-mono mb-3">P = {num(ATM_PA)} + {liquid.d}×{G}×{depth} = {num(st.P)} Pa</p>
                <Row label="Pressão total" value={`${num(st.P)} Pa`} />
                <Row label="Em atm" value={`${st.atm.toFixed(2)} atm`} />
                <Row label="Em mmHg" value={`${num(st.mmHg)} mmHg`} />
              </div>
              <TipBox items={['O empuxo e a pressão hidrostática dependem só da profundidade e da densidade do líquido — não da forma do recipiente (paradoxo hidrostático).', 'Pontos na mesma profundidade, no mesmo líquido, têm a mesma pressão, mesmo em recipientes de formatos diferentes.']} />
            </section>
          </>
        )}

        {mode === 'pascal' && (
          <>
            <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
              <label className="block">
                <span className="text-xs text-faint">Força aplicada F1: {F1} N</span>
                <input type="range" min={10} max={500} value={F1} onChange={(e) => setF1(+e.target.value)} className="w-full accent-primary" />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Área do pistão 1 (A1): {A1.toFixed(2)} m²</span>
                <input type="range" min={0.01} max={0.1} step={0.01} value={A1} onChange={(e) => setA1(+e.target.value)} className="w-full accent-primary" />
              </label>
              <label className="block">
                <span className="text-xs text-faint">Área do pistão 2 (A2): {A2.toFixed(2)} m²</span>
                <input type="range" min={0.1} max={1} step={0.05} value={A2} onChange={(e) => setA2(+e.target.value)} className="w-full accent-primary" />
              </label>
            </section>
            <section className="bg-surface border border-edge rounded-2xl p-4">
              {(() => {
                const tank1W = 50 + Math.sqrt(A1) * 120
                const tank2W = 50 + Math.sqrt(A2) * 120
                const x1 = 25, x2r = 315
                const x2 = x2r - tank2W
                const cx1 = x1 + tank1W / 2, cx2 = x2 + tank2W / 2
                const surfaceY = 130, tankBottomY = 195, pistonTopY = 22
                const pistonW1 = tank1W * 0.55, pistonW2 = tank2W * 0.55
                const piston1BottomY = surfaceY + 25 + disp1 * 150
                const piston2BottomY = surfaceY + 25 - disp2 * 150
                return (
                  <svg viewBox="0 0 340 220" className="w-full max-w-[340px] mx-auto">
                    {/* cano de conexão */}
                    <rect x={x1 + tank1W} y="178" width={x2 - (x1 + tank1W)} height="17" fill="#38bdf8" fillOpacity="0.35" stroke="currentColor" strokeOpacity="0.5" className="text-fg" />
                    {/* tanque 1 */}
                    <rect x={x1} y={40} width={tank1W} height={tankBottomY - 40} fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" className="text-fg" />
                    <rect x={x1 + 2} y={surfaceY} width={tank1W - 4} height={tankBottomY - surfaceY - 2} fill="#38bdf8" fillOpacity="0.35" />
                    {/* tanque 2 */}
                    <rect x={x2} y={40} width={tank2W} height={tankBottomY - 40} fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" className="text-fg" />
                    <rect x={x2 + 2} y={surfaceY} width={tank2W - 4} height={tankBottomY - surfaceY - 2} fill="#38bdf8" fillOpacity="0.35" />
                    {/* pistões */}
                    <rect x={cx1 - pistonW1 / 2} y={pistonTopY} width={pistonW1} height={piston1BottomY - pistonTopY} fill="#94a3b8" />
                    <rect x={cx2 - pistonW2 / 2} y={pistonTopY} width={pistonW2} height={piston2BottomY - pistonTopY} fill="#4ade80" />
                    {/* rótulos de força */}
                    <text x={cx1} y="14" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-current text-fg">F1 = {F1} N</text>
                    <text x={cx2} y="14" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-current text-fg">F2 = {num(pa.F2)} N</text>
                    {/* P dentro do líquido */}
                    <text x={cx1} y={surfaceY + 30} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0c4a6e">P</text>
                    <text x={cx2} y={surfaceY + 30} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0c4a6e">P</text>
                    {/* A1/A2 na base */}
                    <text x={cx1} y="210" textAnchor="middle" fontSize="10" className="fill-current text-faint">A1 = {A1.toFixed(2)} m²</text>
                    <text x={cx2} y="210" textAnchor="middle" fontSize="10" className="fill-current text-faint">A2 = {A2.toFixed(2)} m²</text>
                    {/* caixa da fórmula, como no diagrama de referência */}
                    <rect x="118" y="52" width="104" height="30" rx="5" fill="#fde68a" stroke="#b45309" strokeWidth="1" />
                    <text x="170" y="71" textAnchor="middle" fontSize="11" fontWeight="700" fill="#78350f">F1/A1 = F2/A2</text>
                  </svg>
                )
              })()}
            </section>
            <section className="space-y-4">
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">Cálculo</h2>
                <p className="text-muted text-sm font-mono mb-2">F1/A1 = F2/A2</p>
                <p className="text-fg text-sm font-mono mb-3">F2 = F1×(A2/A1) = {F1}×({A2.toFixed(2)}/{A1.toFixed(2)}) = {num(pa.F2)} N</p>
                <Row label="Pressão no fluido" value={`${num(pa.pressure)} Pa`} />
                <Row label="Ganho de força" value={`×${(A2 / A1).toFixed(1)}`} />
                <Row label="Pistão 1 desce" value={`${(disp1 * 100).toFixed(0)} cm`} />
                <Row label="Pistão 2 sobe" value={`${(disp2 * 100).toFixed(1)} cm`} />
              </div>
              <TipBox items={['A prensa hidráulica multiplica a força, mas o volume desloca­do é igual dos dois lados: o pistão maior sobe proporcionalmente menos (conservação de volume, não "cria" energia).', 'Em elevadores de carro e freios hidráulicos, esse é o princípio por trás.']} />
            </section>
          </>
        )}

        {mode === 'torricelli' && (
          <>
            <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
              <label className="block">
                <span className="text-xs text-faint">Altitude: {altitude} m</span>
                <input type="range" min={0} max={9000} step={100} value={altitude} onChange={(e) => setAltitude(+e.target.value)} className="w-full accent-primary" />
              </label>
              <p className="text-faint text-xs">0 m = nível do mar · ~5000 m ≈ altitude de cruzeiro de avião comercial em pressurização · ~8848 m = topo do Everest</p>
            </section>
            <section className="bg-surface border border-edge rounded-2xl p-4">
              <svg viewBox="0 0 200 260" className="w-full max-w-[180px] mx-auto">
                <rect x="70" y="20" width="20" height="220" fill="none" stroke="currentColor" strokeOpacity="0.6" className="text-fg" />
                <rect x="72" y={240 - (tor.mmHg / 760) * 200} width="16" height={(tor.mmHg / 760) * 200} fill="#94a3b8" />
                <rect x="50" y="240" width="60" height="16" fill="#94a3b8" fillOpacity="0.5" />
                <text x="80" y={235 - (tor.mmHg / 760) * 200} textAnchor="middle" fontSize="11" className="fill-current text-fg">{num(tor.mmHg)} mmHg</text>
              </svg>
            </section>
            <section className="space-y-4">
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">Cálculo</h2>
                <Row label="Pressão ao nível do mar" value={`${num(torSea.mmHg)} mmHg (1 atm)`} />
                <Row label="Pressão nesta altitude" value={`${num(tor.mmHg)} mmHg`} />
                <Row label="Em atm" value={`${tor.atm.toFixed(2)} atm`} />
                <Row label="Em Pa" value={`${num(tor.pa)} Pa`} />
              </div>
              <TipBox items={['A pressão atmosférica cai com a altitude porque há menos coluna de ar acima. É por isso que a água ferve a menos de 100 °C em altitudes elevadas.', 'O barômetro de Torricelli usa mercúrio (não água) porque sua alta densidade permite uma coluna bem menor (~76 cm em vez de ~10,3 m).']} />
            </section>
          </>
        )}

        {mode === 'arquimedes' && (
          <>
            <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-faint text-xs font-semibold uppercase mb-2">Objeto</p>
                <div className="flex flex-wrap gap-1.5">
                  {OBJECTS.map((o) => (
                    <button key={o.id} onClick={() => setDObjId(o.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${dObjId === o.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-faint text-xs font-semibold uppercase mb-2">Líquido</p>
                <div className="flex flex-wrap gap-1.5">
                  {LIQUIDS.map((l) => (
                    <button key={l.id} onClick={() => setArqLiquidId(l.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${arqLiquidId === l.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{l.label}</button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs text-faint">Volume do objeto: {volume.toFixed(1)} L</span>
                <input type="range" min={0.5} max={10} step={0.5} value={volume} onChange={(e) => setVolume(+e.target.value)} className="w-full accent-primary" />
              </label>
            </section>
            <section className="bg-surface border border-edge rounded-2xl p-4">
              <svg viewBox="0 0 220 220" className="w-full max-w-[220px] mx-auto">
                <rect x="20" y="20" width="180" height="180" fill={arqLiquid.color} fillOpacity="0.25" stroke="currentColor" strokeOpacity="0.5" className="text-fg" />
                <line x1="20" y1="70" x2="200" y2="70" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="4 4" />
                {(() => {
                  const size = 20 + Math.sqrt(volume) * 14
                  const submergedFrac = arq.fracSubmerged
                  const topY = arq.floats ? 70 - size * (1 - submergedFrac) : 70
                  return <rect x={110 - size / 2} y={topY} width={size} height={size} fill="#f87171" fillOpacity="0.85" />
                })()}
              </svg>
            </section>
            <section className="space-y-4">
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <h2 className="text-fg font-bold mb-2">{arq.floats ? 'Objeto flutua' : 'Objeto afunda'}</h2>
                <p className="text-muted text-sm font-mono mb-2">E = d<sub>líquido</sub> × V<sub>submerso</sub> × g</p>
                <Row label="Peso do objeto" value={`${num(arq.peso)} N`} />
                <Row label="Empuxo" value={`${num(arq.empuxo)} N`} />
                {arq.floats && <Row label="Fração submersa" value={`${(arq.fracSubmerged * 100).toFixed(0)}% (V submerso/V = d objeto/d líquido)`} />}
                {!arq.floats && <Row label="Peso aparente (na balança)" value={`${num(arq.apparentWeight)} N`} />}
              </div>
              <TipBox items={['Pegadinha clássica: o empuxo depende só do volume de líquido deslocado (V submerso × densidade do líquido) — NÃO da massa total do objeto e NÃO da profundidade em que ele está totalmente submerso.', 'Um objeto totalmente submerso sente o mesmo empuxo a 1 m ou a 100 m de profundidade, desde que o líquido tenha densidade constante.']} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function TipBox({ items }: { items: string[] }) {
  return (
    <div className="bg-surface border border-edge rounded-2xl p-4">
      <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Pegadinha FUVEST/ENEM</h3>
      <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}
