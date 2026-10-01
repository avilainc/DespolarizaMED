'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb, ArrowLeftRight } from 'lucide-react'
import { MEDIA, C, snell } from '@/lib/optics'

const num = (n: number, d = 2) => n.toFixed(d).replace('.', ',')

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

export default function RefractionPage() {
  const [m1, setM1] = useState('ar')
  const [m2, setM2] = useState('agua')
  const [theta1, setTheta1] = useState(40)
  const n1 = MEDIA.find((m) => m.id === m1)!
  const n2 = MEDIA.find((m) => m.id === m2)!
  const res = snell(n1.n, n2.n, theta1)

  const W = 400, H = 360, CX = W / 2, CY = H / 2
  const len = 140
  const rad1 = (theta1 * Math.PI) / 180
  const incidentStart = { x: CX - Math.sin(rad1) * len, y: CY - Math.cos(rad1) * len }
  const rad2 = res.theta2 !== null ? (res.theta2 * Math.PI) / 180 : 0
  const refractedEnd = { x: CX + Math.sin(rad2) * len, y: CY + Math.cos(rad2) * len }
  const reflectedEnd = { x: CX + Math.sin(rad1) * len, y: CY - Math.cos(rad1) * len }

  const swap = () => { const a = m1; setM1(m2); setM2(a) }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Refração da Luz e Ângulo Limite</h1>
      <p className="text-muted text-sm mb-5">Lei de Snell-Descartes, reflexão total e o ângulo limite entre dois meios.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Meio 1 (de onde vem a luz)</p>
            <div className="flex flex-wrap gap-1.5">
              {MEDIA.map((m) => (
                <button key={m.id} onClick={() => setM1(m.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${m1 === m.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{m.label} (n={m.n})</button>
              ))}
            </div>
          </div>
          <button onClick={swap} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-edge text-muted hover:text-fg transition"><ArrowLeftRight size={13} /> Inverter sentido da luz</button>
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Meio 2</p>
            <div className="flex flex-wrap gap-1.5">
              {MEDIA.map((m) => (
                <button key={m.id} onClick={() => setM2(m.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${m2 === m.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{m.label} (n={m.n})</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-faint">Ângulo de incidência θ1: {theta1}°</span>
            <input type="range" min={0} max={89} value={theta1} onChange={(e) => setTheta1(+e.target.value)} className="w-full accent-primary" />
          </label>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] mx-auto">
            <rect x="0" y="0" width={W} height={CY} fill="#1e293b" />
            <rect x="0" y={CY} width={W} height={CY} fill="#0c4a6e" fillOpacity="0.5" />
            <line x1="0" y1={CY} x2={W} y2={CY} stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1={CX} y1="10" x2={CX} y2={H - 10} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="4 4" className="text-fg" />
            <text x={CX + 6} y="20" fontSize="10" fill="#e2e8f0" fillOpacity="0.75">normal</text>
            <text x="8" y="16" fontSize="11" fill="#e2e8f0">{n1.label} (n={n1.n})</text>
            <text x="8" y={H - 8} fontSize="11" className="fill-current text-fg">{n2.label} (n={n2.n})</text>

            <line x1={incidentStart.x} y1={incidentStart.y} x2={CX} y2={CY} stroke="#facc15" strokeWidth="2.5" />
            {res.totalInternal ? (
              <line x1={CX} y1={CY} x2={reflectedEnd.x} y2={reflectedEnd.y} stroke="#f87171" strokeWidth="2.5" />
            ) : (
              <>
                <line x1={CX} y1={CY} x2={refractedEnd.x} y2={refractedEnd.y} stroke="#4ade80" strokeWidth="2.5" />
                <line x1={CX} y1={CY} x2={reflectedEnd.x} y2={reflectedEnd.y} stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
              </>
            )}
            <circle cx={CX} cy={CY} r="3" fill="#fff" />
          </svg>
          {res.totalInternal && <p className="text-center text-red-400 text-sm font-semibold mt-1">Reflexão total interna — não há raio refratado!</p>}
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Cálculo</h2>
            <p className="text-muted text-sm font-mono mb-2">n1·sen θ1 = n2·sen θ2</p>
            {res.totalInternal ? (
              <p className="text-red-400 text-sm mb-3">sen θ2 = {num((n1.n / n2.n) * Math.sin((theta1 * Math.PI) / 180), 2)} &gt; 1 → impossível, ocorre reflexão total.</p>
            ) : (
              <p className="text-fg text-sm font-mono mb-3">sen θ2 = ({n1.n}/{n2.n})×sen({theta1}°) → θ2 = {num(res.theta2!, 1)}°</p>
            )}
            <Row label="v no meio 1" value={`${num(res.v1 / 1e8, 2)}×10⁸ m/s`} />
            <Row label="v no meio 2" value={`${num(res.v2 / 1e8, 2)}×10⁸ m/s`} />
            <Row label="Ângulo limite (L)" value={res.criticalAngle !== null ? `${num(res.criticalAngle, 1)}°` : '— (só existe de meio mais para menos refringente)'} />
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Como cai na prova</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Reflexão total só ocorre quando a luz vai do meio <strong>mais</strong> refringente para o <strong>menos</strong> refringente (n1 &gt; n2) e o ângulo de incidência é <strong>maior</strong> que o ângulo limite.</li>
              <li>É o princípio das fibras ópticas: a luz fica presa dentro do núcleo (mais refringente) por reflexões totais sucessivas.</li>
              <li>Miragens no deserto/asfalto quente: camadas de ar com índices de refração diferentes (por causa da temperatura) desviam a luz gradualmente.</li>
              <li>Quanto maior o índice de refração, menor a velocidade da luz naquele meio (v = c/n) e menor o ângulo limite.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
