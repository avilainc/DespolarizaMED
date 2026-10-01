'use client'
import { useMemo, useState } from 'react'
import { Download, FileText, KeyRound, PenLine } from 'lucide-react'
import { PROVAS_PDF, PROVAS_BUCKET_URL, type ProvaPdf, type ProvaTipo } from '@/lib/provasCatalog'

const TIPO_INFO: Record<ProvaTipo, { label: string; color: string; Icon: typeof FileText }> = {
  prova: { label: 'Prova', color: '#3b82f6', Icon: FileText },
  gabarito: { label: 'Gabarito / correção', color: '#22c55e', Icon: KeyRound },
  redacao: { label: 'Redação', color: '#f59e0b', Icon: PenLine },
}

const formatSize = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

const downloadUrl = (p: ProvaPdf) =>
  `${PROVAS_BUCKET_URL}${p.key.split('/').map(encodeURIComponent).join('/')}?download=${encodeURIComponent(`${p.inst} ${p.ano} - ${p.nome}.pdf`)}`

export default function ProvasPdf() {
  const institutions = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of PROVAS_PDF) m.set(p.inst, (m.get(p.inst) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [])
  const [inst, setInst] = useState(institutions.find(([i]) => i === 'ENEM')?.[0] ?? institutions[0]?.[0] ?? '')
  const [year, setYear] = useState<number | 'todos'>('todos')

  const ofInst = useMemo(() => PROVAS_PDF.filter((p) => p.inst === inst), [inst])
  const years = useMemo(() => Array.from(new Set(ofInst.map((p) => p.ano))).sort((a, b) => b - a), [ofInst])
  const shown = useMemo(() => ofInst.filter((p) => year === 'todos' || p.ano === year), [ofInst, year])

  // ano → grupo (fase/dia/caderno) → arquivos
  const grouped = useMemo(() => {
    const byYear = new Map<number, Map<string, ProvaPdf[]>>()
    for (const p of shown) {
      if (!byYear.has(p.ano)) byYear.set(p.ano, new Map())
      const g = byYear.get(p.ano)!
      const k = p.grupo || 'Geral'
      if (!g.has(k)) g.set(k, [])
      g.get(k)!.push(p)
    }
    return Array.from(byYear.entries()).sort((a, b) => b[0] - a[0])
  }, [shown])

  const chip = (active: boolean) =>
    active
      ? { backgroundColor: '#4F80AC26', borderColor: '#4F80AC', color: '#4F80AC' }
      : { backgroundColor: 'transparent', borderColor: 'rgb(var(--color-edge))', color: 'rgb(var(--color-muted))' }

  return (
    <div className="bg-surface border border-edge rounded-2xl p-6">
      <p className="text-fg font-semibold mb-1">Provas oficiais em PDF</p>
      <p className="text-muted text-xs mb-4">Baixe a prova e o gabarito originais para resolver no papel. Total: {PROVAS_PDF.length} arquivos.</p>

      <p className="text-faint text-xs font-semibold uppercase tracking-wide mb-2">Vestibular</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {institutions.map(([i, n]) => (
          <button
            key={i}
            onClick={() => {
              setInst(i)
              setYear('todos')
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
            style={chip(inst === i)}
          >
            {i} <span className="opacity-70">({n})</span>
          </button>
        ))}
      </div>

      <p className="text-faint text-xs font-semibold uppercase tracking-wide mb-2">Ano</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {(['todos', ...years] as const).map((y) => (
          <button key={y} onClick={() => setYear(y)} className="px-3 py-1.5 rounded-full text-xs font-semibold border transition" style={chip(year === y)}>
            {y === 'todos' ? 'Todos' : y}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {grouped.map(([ano, groups]) => (
          <div key={ano}>
            <h3 className="text-fg font-bold text-lg mb-2">
              {inst} {ano}
            </h3>
            <div className="space-y-4">
              {Array.from(groups.entries()).map(([grupo, files]) => (
                <div key={grupo}>
                  {(groups.size > 1 || grupo !== 'Geral') && <p className="text-muted text-xs font-semibold mb-1.5">{grupo}</p>}
                  <ul className="space-y-1.5">
                    {files.map((p) => {
                      const t = TIPO_INFO[p.tipo]
                      return (
                        <li key={p.key} className="flex items-center gap-3 bg-app border border-edge rounded-xl px-3 py-2">
                          <t.Icon size={16} style={{ color: t.color }} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-fg text-sm truncate" title={p.nome}>
                              {p.nome}
                            </p>
                            <p className="text-faint text-[11px]">
                              <span style={{ color: t.color }}>{t.label}</span> · {formatSize(p.size)}
                            </p>
                          </div>
                          <a
                            href={downloadUrl(p)}
                            download
                            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:opacity-90 transition"
                          >
                            <Download size={13} /> Baixar
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && <p className="text-muted text-sm">Nenhum arquivo para esta seleção.</p>}
      </div>
    </div>
  )
}
