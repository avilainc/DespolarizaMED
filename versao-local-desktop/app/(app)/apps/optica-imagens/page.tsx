'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { SYSTEMS, gauss, type SystemType } from '@/lib/opticsImaging'

const num = (n: number, d = 1) => n.toFixed(d).replace('.', ',')

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge last:border-0 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-fg font-semibold">{value}</span>
    </div>
  )
}

function Diagram({ system, fAbs, p, res }: { system: SystemType; fAbs: number; p: number; res: ReturnType<typeof gauss> }) {
  const isMirror = system === 'concavo' || system === 'convexo'
  const scale = 6
  const W = 560, H = 260, CX = W / 2, CY = H / 2
  const x = (v: number) => CX + v * scale
  const H_OBJ = 40
  const objX = -p
  const objTip = { x: x(objX), y: CY - H_OBJ }
  const pLinha = res.impropria ? (fAbs * 1000) : res.pLinha!
  const imgX = res.impropria ? (isMirror ? -pLinha : pLinha) : (isMirror ? -pLinha : pLinha)
  const imgH = res.impropria ? 0 : res.A! * H_OBJ
  const imgTip = { x: x(imgX), y: CY - imgH }
  const focusForRay2 = isMirror ? -res.fSigned : res.fSigned
  const virtual = !res.impropria && !res.real

  // linha que passa pelo vértice/centro (0,0) — sempre correta pela semelhança de triângulos
  const dir1 = { x: imgTip.x - x(0), y: imgTip.y - CY }
  const len1 = Math.hypot(dir1.x, dir1.y) || 1
  const ext1 = 260
  const ray1Far = { x: imgTip.x + (dir1.x / len1) * ext1, y: imgTip.y + (dir1.y / len1) * ext1 }

  // raio paralelo ao eixo, depois passando pelo foco de referência
  const p2Start = { x: x(0), y: objTip.y }
  const dir2 = { x: x(focusForRay2) - p2Start.x, y: 0 - p2Start.y }
  const len2 = Math.hypot(dir2.x, dir2.y) || 1
  const ray2Far = { x: p2Start.x + (dir2.x / len2) * (isMirror ? -ext1 : ext1) * (dir2.x < 0 ? -1 : 1), y: p2Start.y + (dir2.y / len2) * ext1 }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-fg">
      <line x1="10" y1={CY} x2={W - 10} y2={CY} stroke="currentColor" strokeOpacity="0.35" />
      {/* pontos notáveis */}
      <circle cx={x(res.fSigned)} cy={CY} r="2.5" fill="#facc15" />
      <text x={x(res.fSigned)} y={CY - 8} fontSize="10" textAnchor="middle" className="fill-current text-fg">F</text>
      {isMirror && (
        <>
          <circle cx={x(res.fSigned * 2)} cy={CY} r="2.5" fill="#a78bfa" />
          <text x={x(res.fSigned * 2)} y={CY - 8} fontSize="10" textAnchor="middle" className="fill-current text-fg">C</text>
        </>
      )}
      <circle cx={x(-res.fSigned)} cy={CY} r="2.5" fill="#facc15" opacity="0.5" />

      {/* sistema óptico no centro */}
      {isMirror ? (
        <path d={system === 'concavo' ? `M${x(0)},${CY - 90} Q${x(0) + 22},${CY} ${x(0)},${CY + 90}` : `M${x(0)},${CY - 90} Q${x(0) - 22},${CY} ${x(0)},${CY + 90}`} fill="none" stroke="#cbd5e1" strokeWidth="3" />
      ) : (
        <g stroke="#38bdf8" strokeWidth="3">
          <line x1={x(0)} y1={CY - 90} x2={x(0)} y2={CY + 90} />
          {system === 'convergente' ? (
            <>
              <path d={`M${x(0) - 10},${CY - 90} L${x(0)},${CY - 78} L${x(0) + 10},${CY - 90} Z`} fill="#38bdf8" />
              <path d={`M${x(0) - 10},${CY + 90} L${x(0)},${CY + 78} L${x(0) + 10},${CY + 90} Z`} fill="#38bdf8" />
            </>
          ) : (
            <>
              <path d={`M${x(0) - 10},${CY - 78} L${x(0)},${CY - 90} L${x(0) + 10},${CY - 78}`} fill="none" />
              <path d={`M${x(0) - 10},${CY + 78} L${x(0)},${CY + 90} L${x(0) + 10},${CY + 78}`} fill="none" />
            </>
          )}
        </g>
      )}

      {/* objeto */}
      <line x1={x(objX)} y1={CY} x2={objTip.x} y2={objTip.y} stroke="#4ade80" strokeWidth="3" markerEnd="url(#arrowG)" />
      {/* imagem */}
      {!res.impropria && (
        <line x1={imgTip.x} y1={CY} x2={imgTip.x} y2={imgTip.y} stroke="#f87171" strokeWidth="3" strokeDasharray={virtual ? '5 4' : undefined} markerEnd="url(#arrowR)" />
      )}

      {/* raios notáveis — sempre tracejados (linha seccionada), pra distinguir
          claramente dos traços sólidos do objeto/imagem */}
      <line x1={objTip.x} y1={objTip.y} x2={x(0)} y2={objTip.y} stroke="#facc15" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1={x(0)} y1={objTip.y} x2={ray2Far.x} y2={ray2Far.y} stroke="#facc15" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1={objTip.x} y1={objTip.y} x2={ray1Far.x} y2={ray1Far.y} stroke="#a78bfa" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 3" />

      <defs>
        <marker id="arrowG" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#4ade80" /></marker>
        <marker id="arrowR" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#f87171" /></marker>
      </defs>
    </svg>
  )
}

export default function OpticalImagingPage() {
  const [system, setSystem] = useState<SystemType>('convergente')
  const [fAbs, setFAbs] = useState(10)
  const [p, setP] = useState(25)
  const res = gauss(system, fAbs, p)
  const isMirror = system === 'concavo' || system === 'convexo'

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition"><ArrowLeft size={15} /> Labs</Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Espelhos e Lentes</h1>
      <p className="text-muted text-sm mb-5">Formação de imagens, raios notáveis e a equação de Gauss.</p>

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,1.1fr)] gap-5 items-start">
        <section className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-faint text-xs font-semibold uppercase mb-2">Sistema óptico</p>
            <div className="flex flex-wrap gap-1.5">
              {SYSTEMS.map((s) => (
                <button key={s.id} onClick={() => setSystem(s.id)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${system === s.id ? 'border-primary bg-primary/15 text-fg' : 'border-edge text-muted hover:text-fg'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-faint">Distância focal |f|: {fAbs} cm</span>
            <input type="range" min={5} max={30} value={fAbs} onChange={(e) => setFAbs(+e.target.value)} className="w-full accent-primary" />
          </label>
          <label className="block">
            <span className="text-xs text-faint">Posição do objeto p: {p} cm</span>
            <input type="range" min={2} max={60} value={p} onChange={(e) => setP(+e.target.value)} className="w-full accent-primary" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setP(fAbs)} className="text-[11px] px-2 py-1 rounded-full border border-edge text-muted hover:text-fg transition">p = f (imagem imprópria)</button>
            <button onClick={() => setP(fAbs * 2)} className="text-[11px] px-2 py-1 rounded-full border border-edge text-muted hover:text-fg transition">p = 2f</button>
            <button onClick={() => setP(Math.max(2, fAbs / 2))} className="text-[11px] px-2 py-1 rounded-full border border-edge text-muted hover:text-fg transition">p &lt; f</button>
          </div>
        </section>

        <section className="bg-surface border border-edge rounded-2xl p-4">
          <Diagram system={system} fAbs={fAbs} p={p} res={res} />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted justify-center">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> objeto</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block" /> imagem</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-yellow-400 inline-block" /> raio paralelo→foco</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> raio pelo {isMirror ? 'vértice' : 'centro'}</span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h2 className="text-fg font-bold mb-2">Classificação da imagem</h2>
            {res.impropria ? (
              <p className="text-amber-300 text-sm mb-2">Objeto no foco: imagem imprópria (forma-se no infinito, raios saem paralelos).</p>
            ) : (
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${res.real ? 'bg-emerald-500/15 text-emerald-400' : 'bg-sky-500/15 text-sky-400'}`}>
                {res.real ? 'Real' : 'Virtual'} · {res.invertida ? 'Invertida' : 'Direita'} · {res.tamanho === 'igual' ? 'Do mesmo tamanho' : res.tamanho === 'maior' ? 'Maior' : 'Menor'}
              </span>
            )}
            <p className="text-muted text-sm font-mono mt-2 mb-1">1/f = 1/p + 1/p'</p>
            {!res.impropria && (
              <>
                <p className="text-fg text-sm font-mono mb-3">1/{res.fSigned} = 1/{p} + 1/p' → p' = {num(res.pLinha!)} cm</p>
                <Row label="f (com sinal)" value={`${res.fSigned} cm`} />
                <Row label="p'" value={`${num(res.pLinha!)} cm`} />
                <Row label="Ampliação A = −p'/p" value={num(res.A!, 2)} />
              </>
            )}
          </div>
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> Foco no vestibular</h3>
            <ul className="text-fg text-sm list-disc pl-5 space-y-1.5">
              <li>Objeto exatamente no foco (p = f): imagem imprópria, no infinito — usado em faróis e lanternas (o inverso: fonte no foco produz feixe paralelo).</li>
              <li><strong>Espelho convexo</strong> e <strong>lente divergente</strong> SEMPRE formam imagem virtual, direita e menor, não importa onde o objeto esteja.</li>
              <li>Convenção de sinais: p' positivo = imagem real; f negativo = sistema divergente (lente divergente ou espelho convexo).</li>
              <li>Espelho côncavo com objeto entre o vértice e o foco (p &lt; f) forma imagem virtual, direita e maior — o efeito do espelho de maquiagem/barbear.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
