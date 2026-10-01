import { BookOpen, PlayCircle } from 'lucide-react'
import { subjectColor } from '@/lib/subjectColors'

// Nomes das aulas tirados direto dos arquivos que Paulo tem no Drive
// (pasta "Biologia" — 40 vídeos, 8 módulos). Vira dado real (tabela
// modules/lessons) quando o banco estiver plugado; os vídeos em si sobem
// pro provedor de streaming escolhido, não pro Supabase.
const BIOLOGIA_MODULES = [
  { n: 1, title: 'Bioquímica', lessons: ['Bioquímica', 'Carboidratos', 'Lipídios', 'Proteínas', 'Vitaminas'] },
  { n: 2, title: 'Biologia celular', lessons: ['Ácido nucleico', 'Síntese proteica', 'Célula e organelas', 'Membrana plasmática e transportes', 'Respiração celular', 'Fotossíntese'] },
  { n: 3, title: 'Biologia molecular', lessons: ['Núcleo e cromossomos', 'Mutações', 'Ciclo celular', 'Mitose', 'Meiose'] },
  { n: 4, title: 'Embriologia', lessons: ['Gametogênese', 'Sistema reprodutor', 'Desenvolvimento embrionário', 'Anexos embrionários'] },
  { n: 5, title: 'Histologia', lessons: ['Tecido epitelial', 'TCPD e adiposo', 'Sangue', 'Sistema imune', 'Tecido cartilaginoso e ósseo', 'Tecido muscular', 'Tecido nervoso'] },
  { n: 6, title: 'Sistemas', lessons: ['Sistema nervoso', 'Sistema endócrino', 'Sistema respiratório', 'Sistema circulatório', 'Sistema digestório', 'Sistema excretor', 'Sistema reprodutor (aula extra)'] },
  { n: 7, title: 'Genética', lessons: ['Leis de Mendel', 'Sistema ABO', 'Evolução (parte 1)', 'Evolução (parte 2)', 'Taxonomia'] },
  { n: 8, title: 'Seres Vivos', lessons: ['Vírus', 'Bactéria'] },
]

const COURSE_DATA: Record<string, { title: string; modules: typeof BIOLOGIA_MODULES } | undefined> = {
  biologia: { title: 'Biologia para Vestibular', modules: BIOLOGIA_MODULES },
}

export default function CoursePage({ params }: { params: { slug: string } }) {
  const data = COURSE_DATA[params.slug]

  if (!data) {
    return (
      <div className="min-h-screen bg-app px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-teal-dark text-xs font-semibold uppercase tracking-wide mb-2">{params.slug}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-2">Módulo em produção</h1>
          <p className="text-muted">Essa trilha ainda não tem aulas publicadas — volte em breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <p className="text-teal-dark text-xs font-semibold uppercase tracking-wide mb-2">Biologia</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-2">{data.title}</h1>
        <p className="text-muted mb-8">Curso: {params.slug} — trilha completa em videoaulas.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.modules.map((mod) => (
            <div key={mod.n} className="bg-surface border border-edge rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-edge flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${subjectColor('Biologia')}26` }}>
                  <BookOpen size={14} style={{ color: subjectColor('Biologia') }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-fg text-sm truncate">Módulo {mod.n} — {mod.title}</h2>
                  <p className="text-faint text-[11px]">{mod.lessons.length} aula{mod.lessons.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <ul className="divide-y divide-edge">
                {mod.lessons.map((l, i) => (
                  <li key={l} className="px-5 py-2.5 flex items-center gap-2.5 text-sm text-muted">
                    <PlayCircle size={14} className="text-faint shrink-0" />
                    <span className="truncate">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
