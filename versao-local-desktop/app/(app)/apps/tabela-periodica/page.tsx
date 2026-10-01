'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Atom, Plus, Minus, FlaskConical, Info, Trash2, Zap } from 'lucide-react'
import data from '@/lib/periodicTableData.json'
import { PERIODIC_CATEGORIES } from '@/lib/periodicCategories'
import { react, type ReactionResult } from '@/lib/periodicReactions'
import { STRUCTURE_FORMULAS } from '@/lib/molecules'

type El = (typeof data)[number]

function tint(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

function ElementImage({ el, color }: { el: El; color: string }) {
  const [failed, setFailed] = useState(false)
  if (el.imageUrl && !failed) {
    return <img src={el.imageUrl} alt={el.name} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: tint(color, '22') }}>
      <span className="text-9xl font-extrabold leading-none" style={{ color }}>{el.symbol}</span>
    </div>
  )
}

// Ordena os subníveis por camada (1s 2s 2p 3s 3p 3d 4s ...), como nos livros.
function sortByShell(text: string) {
  const order = 'spdf'
  return text
    .split(' ')
    .sort((a, b) => Number(a[0]) - Number(b[0]) || order.indexOf(a[1]) - order.indexOf(b[1]))
    .join(' ')
}

function ElectronConfig({ text }: { text: string }) {
  const parts = text.split(' ')
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^(\d[spdf])(\d+)$/)
        const isLast = i === parts.length - 1
        const sep = isLast ? '' : p.startsWith('[') ? ' ' : ', '
        return (
          <span key={i}>
            {m ? <>{m[1]}<sup>{m[2]}</sup></> : p.startsWith('[') ? '(...)' : p}
            {sep}
          </span>
        )
      })}
    </>
  )
}

function Nox({ symbol, value }: { symbol: string; value: string | null }) {
  if (!value) return <>Não determinado</>
  const items = value.split(', ')
  return (
    <>
      {items.map((v, i) => (
        <span key={v}>
          {symbol}<sup>{v}</sup>
          {i < items.length - 1 ? ', ' : ''}
        </span>
      ))}
    </>
  )
}

function Formula({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <span key={i}>{p}</span>))}
    </>
  )
}

function Row({ label, value, stacked = false }: { label: string; value: React.ReactNode; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="py-2 border-b border-edge last:border-0">
        <span className="text-muted text-xs block mb-1">{label}</span>
        <span className="text-fg text-sm font-medium block">{value}</span>
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-edge last:border-0">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-fg text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export default function PeriodicTablePage() {
  const [selected, setSelected] = useState<El | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const [reactor, setReactor] = useState<string[]>([])
  const [result, setResult] = useState<ReactionResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const MAX_ATOMS = 8
  const addToReactor = (symbol: string) => {
    setResult(null)
    setReactor((r) => (r.length >= MAX_ATOMS ? r : [...r, symbol]))
  }
  const removeOne = (symbol: string) => {
    setResult(null)
    setReactor((r) => {
      const i = r.lastIndexOf(symbol)
      return i === -1 ? r : r.filter((_, idx) => idx !== i)
    })
  }
  const clearReactor = () => {
    setReactor([])
    setResult(null)
  }
  const reactorGroups = Array.from(new Set(reactor)).map((s) => ({ symbol: s, count: reactor.filter((x) => x === s).length, el: data.find((e) => e.symbol === s)! }))

  const cat = selected ? PERIODIC_CATEGORIES[selected.category] : null
  const phase = selected
    ? selected.number >= 104 && selected.phase
      ? `${selected.phase} (previsto)`
      : selected.phase ?? 'Desconhecido'
    : ''

  return (
    <div className="px-4 sm:px-6 py-8 max-w-[1500px] mx-auto">
      <Link href="/apps" className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm mb-4 transition">
        <ArrowLeft size={15} /> Apps
      </Link>
      <h1 className="text-2xl font-bold text-fg mb-1">Tabela Periódica</h1>
      <p className="text-muted text-sm mb-6">Clique em um elemento para ver sua ficha química e aplicações.</p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[72%] min-w-0">
          <div className="overflow-x-auto pb-2">
            <div
              className="grid gap-1 min-w-[820px]"
              style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, auto) 12px repeat(2, auto)' }}
            >
              {(
                [
                  { col: 3, row: 6, text: '57–71' },
                  { col: 3, row: 7, text: '89–103' },
                ] as const
              ).map((p) => (
                <div
                  key={p.text}
                  className="rounded-md border border-dashed border-edge text-faint text-[10px] flex items-center justify-center aspect-square"
                  style={{ gridColumn: p.col, gridRow: p.row }}
                >
                  {p.text}
                </div>
              ))}

              {data.map((el) => {
                const c = PERIODIC_CATEGORIES[el.category]
                const isSel = selected?.number === el.number
                const dim = focus !== null && focus !== el.category
                return (
                  <button
                    key={el.number}
                    onClick={() => setSelected(el)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', el.symbol)}
                    title={el.name}
                    className={`rounded-md border p-1 text-left flex flex-col justify-between aspect-square transition hover:scale-110 hover:z-10 ${dim ? 'opacity-25' : ''} ${isSel ? 'ring-2 ring-fg z-10 scale-110' : ''}`}
                    style={{
                      gridColumn: el.xpos,
                      gridRow: el.ypos,
                      backgroundColor: tint(c.color, '2b'),
                      borderColor: tint(c.color, '99'),
                    }}
                  >
                    <span className="text-[9px] leading-none text-muted">{el.number}</span>
                    <span className="text-sm sm:text-base font-bold leading-none text-fg text-center">{el.symbol}</span>
                    <span className="text-[8px] leading-none text-muted truncate text-center">{el.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(PERIODIC_CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                onClick={() => setFocus(focus === key ? null : key)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition ${focus === key ? 'text-fg' : 'text-muted'}`}
                style={{ borderColor: tint(c.color, focus === key ? 'ff' : '66'), backgroundColor: focus === key ? tint(c.color, '33') : 'transparent' }}
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-[28%] lg:sticky lg:top-20 bg-surface border border-edge rounded-2xl overflow-hidden">
          {!selected || !cat ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Atom size={24} className="text-primary" />
              </div>
              <p className="text-muted text-sm">Selecione um elemento para ver seus detalhes químicos e aplicações.</p>
            </div>
          ) : (
            <div>
              <div className="h-44">
                <ElementImage el={selected} color={cat.color} />
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-fg">{selected.name}</h2>
                  <span className="text-xl font-extrabold" style={{ color: cat.color }}>{selected.symbol}</span>
                </div>
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-3"
                  style={{ backgroundColor: tint(cat.color, '26'), color: cat.color }}
                >
                  {cat.label}
                </span>
                <p className="text-muted text-sm mb-3">{selected.summary}</p>
                <button
                  onClick={() => addToReactor(selected.symbol)}
                  className="w-full mb-4 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  <Plus size={15} /> Adicionar {selected.symbol} ao reator
                </button>

                <p className="text-faint text-xs font-semibold uppercase mb-1">Ficha química</p>
                <div className="mb-4">
                  <Row label="Número atômico" value={String(selected.number)} />
                  <Row label="Massa atômica" value={`${selected.symbol === 'Cl' ? '35,5' : Math.round(Number(selected.atomicMass))} u`} />
                  <Row label="Família / Grupo" value={`${selected.family} / ${selected.group ?? '—'}`} />
                  <Row label="Período" value={String(selected.period)} />
                  <Row label="Distribuição eletrônica" value={<ElectronConfig text={selected.number <= 36 ? sortByShell(selected.electronConfiguration) : selected.electronConfigurationSemantic || selected.electronConfiguration} />} />
                  <Row label="NOX comuns" value={<Nox symbol={selected.symbol} value={selected.oxidationStates} />} />
                  <Row label="Estado físico (CNTP)" value={phase} />
                </div>

                <p className="text-faint text-xs font-semibold uppercase mb-1">Aplicações e medicina</p>
                <p className="text-fg text-sm leading-relaxed mb-4">{selected.applications}</p>

                <p className="text-faint text-xs font-semibold uppercase mb-1">Curiosidade e vestibular</p>
                <p className="text-fg text-sm leading-relaxed">{selected.curiosity}</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-fg mb-1 flex items-center gap-2"><FlaskConical size={18} className="text-primary" /> Reator simulado</h2>
        <p className="text-muted text-sm mb-3">Arraste elementos da tabela até aqui, ou use o botão &ldquo;Adicionar ao reator&rdquo; na ficha do elemento (ideal no celular e tablet).</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const s = e.dataTransfer.getData('text/plain')
            if (data.some((el) => el.symbol === s)) addToReactor(s)
          }}
          className={`rounded-2xl border-2 border-dashed p-5 min-h-[130px] transition ${dragOver ? 'border-primary bg-primary/10' : 'border-edge bg-surface'}`}
        >
          {reactorGroups.length === 0 ? (
            <p className="text-faint text-sm text-center py-6">Reator vazio. Solte aqui os elementos que quer combinar.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {reactorGroups.map(({ symbol, count, el }) => {
                const col = PERIODIC_CATEGORIES[el.category].color
                return (
                  <div key={symbol} className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: tint(col, '99'), backgroundColor: tint(col, '22') }}>
                    <span className="text-2xl font-extrabold text-fg leading-none">{symbol}</span>
                    <span className="text-xs text-muted">{el.name}</span>
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => removeOne(symbol)} aria-label={`Remover um ${symbol}`} className="w-6 h-6 rounded-md bg-app border border-edge flex items-center justify-center text-muted hover:text-fg"><Minus size={12} /></button>
                      <span className="w-5 text-center text-sm font-bold text-fg">{count}</span>
                      <button onClick={() => addToReactor(symbol)} aria-label={`Adicionar um ${symbol}`} className="w-6 h-6 rounded-md bg-app border border-edge flex items-center justify-center text-muted hover:text-fg"><Plus size={12} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setResult(react(reactor))}
            disabled={reactor.length === 0}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-40"
          >
            <Zap size={15} /> Reagir
          </button>
          <button onClick={clearReactor} disabled={reactor.length === 0} className="inline-flex items-center gap-1.5 border border-edge text-muted hover:text-fg text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-40">
            <Trash2 size={14} /> Limpar
          </button>
        </div>
      </section>

      <section className="mt-6 bg-surface border border-edge rounded-2xl">
        <div className="px-5 py-3 border-b border-edge flex items-center gap-2">
          <Info size={15} className="text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Painel analítico</h2>
        </div>
        {!result ? (
          <div className="p-10 text-center">
            <Atom size={40} className="text-faint mx-auto mb-3" />
            <p className="text-fg font-semibold mb-1">Nenhuma reação realizada</p>
            <p className="text-muted text-sm max-w-xl mx-auto">Clique em um elemento da tabela para ver os detalhes na lateral, ou arraste elementos para o reator acima e clique em &ldquo;Reagir&rdquo; para criar compostos.</p>
          </div>
        ) : result.kind === 'info' ? (
          <div className="p-6">
            <p className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 bg-amber-500/15 text-amber-400">Não ocorre reação</p>
            <h3 className="text-fg text-lg font-bold mb-2">{result.title}</h3>
            <p className="text-muted text-sm leading-relaxed max-w-3xl">{result.text}</p>
            {result.href && <Link href={result.href} className="inline-block mt-3 text-sm font-semibold text-primary hover:underline">{result.hrefLabel} →</Link>}
          </div>
        ) : (
          <div className="p-6 grid md:grid-cols-[minmax(0,240px)_1fr] gap-6">
            <div>
              <p className="text-faint text-xs font-semibold uppercase mb-1">Fórmula</p>
              <p className="text-5xl font-extrabold text-fg mb-1"><Formula text={result.formula} /></p>
              <p className="text-muted text-sm mb-3">{result.name}</p>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">{result.bond}</span>
              {STRUCTURE_FORMULAS.has(result.formula) && (
                <Link href={`/apps/geometria-molecular?m=${result.formula}`} className="block mt-3 text-sm font-semibold text-primary hover:underline">Ver em 3D →</Link>
              )}
            </div>
            <div>
              <Row label="Massa molar" value={`${String(result.molarMass).replace('.', ',')} g/mol`} />
              <Row label="Tipo de ligação" value={result.bond} />
              <Row label="Geometria molecular" value={result.geometry} />
              {result.note && <p className="text-amber-400 text-xs mt-3">{result.note}</p>}
              {result.clinical && (
                <>
                  <p className="text-faint text-xs font-semibold uppercase mt-4 mb-1">Contexto clínico e hospitalar</p>
                  <p className="text-fg text-sm leading-relaxed">{result.clinical}</p>
                </>
              )}
              {result.tip && (
                <>
                  <p className="text-faint text-xs font-semibold uppercase mt-4 mb-1">Dica de vestibular</p>
                  <p className="text-fg text-sm leading-relaxed">{result.tip}</p>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
