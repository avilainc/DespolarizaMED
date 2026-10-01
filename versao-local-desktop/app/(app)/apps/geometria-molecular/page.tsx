'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, RotateCw, Move3d } from 'lucide-react'
import { MOLECULES, IONICS, ALL_STRUCTURES, type Structure } from '@/lib/molecules'

const MoleculeViewer = dynamic(() => import('@/components/MoleculeViewer'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-faint text-sm">Carregando modelo 3D...</div>,
})

function Formula({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>))}
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-edge last:border-0">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-fg text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export default function MolecularGeometryPage() {
  const [selected, setSelected] = useState<Structure>(MOLECULES[0])
  const [showDipole, setShowDipole] = useState(true)
  const [spin, setSpin] = useState(false)

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('m')
    const found = ALL_STRUCTURES.find((s) => s.formula === m)
    if (found) setSelected(found)
  }, [])

  const chip = (s: Structure) => (
    <button
      key={s.formula}
      onClick={() => setSelected(s)}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${selected.formula === s.formula ? 'bg-primary/15 border-primary text-fg' : 'border-edge text-muted hover:text-fg hover:border-primary/40'}`}
    >
      <Formula text={s.formula} />
    </button>
  )

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition">
        <ArrowLeft size={15} /> Apps
      </Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Geometria Molecular 3D</h1>
      <p className="text-muted text-sm mb-5">Gire, aproxime e explore a estrutura, os ângulos e a polaridade de moléculas de importância biológica.</p>

      <div className="mb-5 space-y-3">
        <div>
          <p className="text-faint text-xs font-semibold uppercase mb-2">Moléculas (ligação covalente)</p>
          <div className="flex flex-wrap gap-2">{MOLECULES.map(chip)}</div>
        </div>
        <div>
          <p className="text-faint text-xs font-semibold uppercase mb-2">Compostos iônicos (retículo cristalino)</p>
          <div className="flex flex-wrap gap-2">{IONICS.map(chip)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 items-start">
        <div>
          <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-edge bg-[#0f172a]">
            <MoleculeViewer structure={selected} showDipole={showDipole} spin={spin} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {selected.kind === 'covalent' && (
              <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
                <input type="checkbox" checked={showDipole} onChange={(e) => setShowDipole(e.target.checked)} className="accent-yellow-400" />
                Mostrar vetor momento dipolar (μ)
              </label>
            )}
            <button
              onClick={() => setSpin((s) => !s)}
              className={`ml-auto inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${spin ? 'border-primary text-fg bg-primary/15' : 'border-edge text-muted hover:text-fg'}`}
            >
              <RotateCw size={14} /> {spin ? 'Parar rotação' : 'Girar automaticamente'}
            </button>
          </div>
          <p className="text-faint text-xs mt-2 flex items-center gap-1.5"><Move3d size={13} /> Arraste para girar · roda do mouse ou pinça para zoom · botão direito ou dois dedos para mover</p>
        </div>

        <div className="bg-surface border border-edge rounded-2xl p-5">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h2 className="text-4xl font-extrabold text-fg"><Formula text={selected.formula} /></h2>
            <span className="text-muted text-sm text-right">{selected.name}</span>
          </div>

          {selected.kind === 'covalent' ? (
            <>
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-3 ${selected.polarity === 'Polar' ? 'bg-sky-500/15 text-sky-400' : 'bg-emerald-500/15 text-emerald-400'}`}
              >
                Molécula {selected.polarity.toLowerCase()}
              </span>
              <Row label="Geometria molecular" value={selected.geometry} />
              <Row label="Ângulo de ligação" value={selected.angle} />
              <Row label="Polaridade" value={selected.polarity} />
              <Row
                label="Momento dipolar (μ)"
                value={selected.dipoleD > 0 ? `${String(selected.dipoleD).replace('.', ',')} D` : 'μ = 0'}
              />
              <p className="text-muted text-sm leading-relaxed mt-3">{selected.polarityNote}</p>
              <p className="text-faint text-xs mt-2">
                Na cena: <span className="text-sky-400">δ+</span> e <span className="text-red-400">δ−</span> mostram as cargas parciais; a seta amarela é o vetor μ resultante, apontando para o lado mais negativo.
              </p>
            </>
          ) : (
            <>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-3 bg-violet-500/15 text-violet-400">Composto iônico</span>
              <Row label="Íons" value={<>{selected.cation}<sup>{selected.cationCharge > 1 ? selected.cationCharge : ''}+</sup> e {selected.anion}<sup>{selected.anionCharge > 1 ? selected.anionCharge : ''}−</sup></>} />
              <Row label="Estrutura" value="Retículo cristalino (cúbico)" />
              <Row label="Coordenação" value="Cada íon é cercado por 6 de carga oposta" />
              <p className="text-fg text-sm font-semibold mt-4 mb-1">Por que não há uma &ldquo;molécula&rdquo; de <Formula text={selected.formula} />?</p>
              <p className="text-muted text-sm leading-relaxed">
                Na ligação iônica há transferência de elétrons e os íons se atraem em todas as direções. Eles se organizam num retículo cristalino gigante, em que cada cátion é rodeado por ânions e vice-versa. A fórmula <Formula text={selected.formula} /> indica apenas a <strong className="text-fg">proporção</strong> entre os íons, e não uma unidade isolada como a da água.
              </p>
              <p className="text-muted text-sm leading-relaxed mt-2">
                Consequências: sólidos duros e quebradiços, pontos de fusão e ebulição altos, e conduzem corrente elétrica apenas fundidos ou dissolvidos (íons livres).
              </p>
              <p className="text-faint text-xs mt-2">
                Na cena: os íons maiores são os ânions, os menores são os cátions, em escala aproximada dos raios iônicos.
              </p>
            </>
          )}

          {selected.clinical && (
            <>
              <p className="text-faint text-xs font-semibold uppercase mt-4 mb-1">Contexto clínico</p>
              <p className="text-fg text-sm leading-relaxed">{selected.clinical}</p>
            </>
          )}
          {selected.tip && (
            <>
              <p className="text-faint text-xs font-semibold uppercase mt-4 mb-1">Dica de vestibular</p>
              <p className="text-fg text-sm leading-relaxed">{selected.tip}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
