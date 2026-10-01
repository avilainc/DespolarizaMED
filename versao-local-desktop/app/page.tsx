import Link from 'next/link'
import type { Metadata } from 'next'
import { Play, CheckCircle2, Check, Mail, Sparkles, Atom, Gauge, Cone, Globe2, ArrowRight, Box, Zap, BarChart3, Landmark } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { InstagramIcon, YoutubeIcon, WhatsappIcon } from '@/components/SocialIcons'
import { LandingFAQ } from '@/components/LandingFAQ'
import { TypewriterRotator } from '@/components/TypewriterRotator'
import { NeuronBackground } from '@/components/NeuronBackground'
import { HeroPatternBackground } from '@/components/HeroPatternBackground'
import { TestimonialAvatar } from '@/components/TestimonialAvatar'
import { subjectColor } from '@/lib/subjectColors'

const DESCRIPTION =
  'Cursos e aulas gravadas para quem mira Medicina no vestibular: videoaulas por matéria, simulados com provas reais, flashcards, apps interativos de Química/Física/Matemática e gamificação para manter o ritmo de estudo.'

export const metadata: Metadata = {
  title: 'DespolarizaMed - Cursos para Medicina',
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DespolarizaMed - Cursos para Medicina',
    description: DESCRIPTION,
    url: '/',
    siteName: 'DespolarizaMed',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'DespolarizaMed - Cursos para Medicina',
    description: DESCRIPTION,
  },
}

// Frases sugeridas pro efeito de digitação (estilo chagas.ai) — Paulo
// escolhe/edita quais ficam. Fica fácil trocar aqui.
const TYPEWRITER_PHRASES = [
  'acelerar sua aprovação em até 10x',
  'organizar sua rotina de estudos de vez',
  'te aproximar da faculdade dos sonhos',
  'te levar de 80% de acertos pra 90%',
  'manter você motivado todos os dias',
]

// Logos reais que Paulo salvou em public/vestibulares/ (todas PNG/JPG/WEBP —
// os SVGs da Wikimedia travavam a página, então evitamos esse formato aqui).
const VESTIBULARES = [
  { name: 'USP', logo: '/vestibulares/usp.png' },
  { name: 'UNESP', logo: '/vestibulares/unesp.png' },
  { name: 'UNICAMP', logo: '/vestibulares/unicamp.png' },
  { name: 'UFMG', logo: '/vestibulares/ufmg.png' },
  { name: 'UNIFESP', logo: '/vestibulares/unifesp.png' },
  { name: 'ITA', logo: '/vestibulares/ita.png' },
  { name: 'Albert Einstein', logo: '/vestibulares/einstein.png' },
  { name: 'Santa Casa', logo: '/vestibulares/santacasa.webp' },
  { name: 'FAMERP', logo: '/vestibulares/famerp.png' },
  { name: 'FMJ', logo: '/vestibulares/fmj.png' },
  { name: 'FAMECA', logo: '/vestibulares/fameca.png' },
  { name: 'UECE', logo: '/vestibulares/uece.png' },
  { name: 'UFSCar', logo: '/vestibulares/ufscar.png' },
]

const PALETTE = ['#4F80AC', '#F4801E', '#4FC7B8']

const LABS_PREVIEW = [
  { href: '/apps/tabela-periodica', title: 'Tabela Periódica', description: 'Os 118 elementos com ficha química, NOX e aplicações na medicina.', icon: Atom, color: '#4ade80' },
  { href: '/apps/cinematica', title: 'Cinemática', description: 'MRU e MRUV com veículos, gráficos S×t/V×t/A×t e resolução passo a passo.', icon: Gauge, color: '#60a5fa' },
  { href: '/apps/geometria-espacial', title: 'Geometria Espacial 3D', description: 'Prismas, pirâmides, cilindro, cone e esfera: gire em 3D, área e volume.', icon: Cone, color: '#38bdf8' },
  { href: '/apps/cartografia', title: 'Cartografia & Fusos Horários', description: 'Calcule fusos de voos, compare projeções cartográficas e leia escalas e curvas de nível.', icon: Globe2, color: '#f4801e' },
  { href: '/apps/geometria-molecular', title: 'Geometria Molecular 3D', description: 'Veja em 3D o formato, os ângulos e a polaridade de H₂O, CO₂, NH₃ e outras moléculas.', icon: Box, color: '#38bdf8' },
  { href: '/apps/circuitos', title: 'Circuitos Elétricos', description: 'Leis de Ohm, resistência equivalente e calculadora de conta de luz.', icon: Zap, color: '#facc15' },
  { href: '/apps/estatistica', title: 'Estatística e Combinatória', description: 'Média/moda/mediana/desvio padrão, permutação/arranjo/combinação e probabilidade.', icon: BarChart3, color: '#a78bfa' },
  { href: '/apps/historia-interativa', title: 'História Interativa', description: 'Mapas georreferenciados e fichas de análise: Brasil, Guerras Mundiais e Antiguidade Clássica.', icon: Landmark, color: '#f87171' },
]

const STUDENT_STAGES = [
  { label: 'VOCÊ ESTÁ NO...', title: 'Ensino médio da escola', body: 'Ajudará a compreender os assuntos de cada matéria, ainda mais com nossa parte de Laboratórios que demonstram, de maneira didática e na prática, como funciona a teoria que a escola não tem tempo para lhe ensinar.' },
  { label: 'VOCÊ ESTÁ ENTRE...', title: '1º e 3º ano de cursinho', body: 'Contribui pra ter um foco de estudos e saber, com uma estratégia EXCLUSIVA e somente sua, como orientar seus estudos com a realidade e rotina do seu dia a dia.' },
  { label: 'VOCÊ ESTÁ...', title: 'Com mais de 5 anos de cursinho', body: 'Vamos colocar essa nota acima dos 90% de acertos com quem ficou dez anos em uma sala de cursinho?' },
  { label: 'VOCÊ ESTÁ...', title: 'Retomando os estudos', body: 'A plataforma ajuda, desde a base, com aulas básicas e introdutórias para você se atualizar do conteúdo cobrado nas principais provas.' },
]

const PLAN_FEATURES = [
  'Todas as matérias liberadas (Biologia, Matemática, Física, Química, Geografia, História e Redação)',
  'Desafio diário, XP e sistema de conquistas',
  'Calendário de estudos e plantões semanais ao vivo',
  'Glossário completo com fotos e esquemas',
  'Acompanhamento de desempenho',
]

const PLANS = [
  {
    id: 'trimestral', name: 'Plano Trimestral', badge: null, off: null,
    price: '34,90', total: '418,80', cadence: 'cobrado a cada 3 meses',
    style: 'plain' as const,
  },
  {
    id: 'semestral', name: 'Plano Semestral', badge: 'O MAIS VENDIDO', off: 'R$ 250 OFF',
    price: '44,90', total: '538,80', cadence: 'cobrado a cada 6 meses',
    style: 'teal' as const,
  },
  {
    id: 'anual', name: 'Plano Anual', badge: 'O RECOMENDADO', off: 'R$ 800 OFF',
    price: '59,90', total: '718,80', cadence: 'cobrado anualmente',
    style: 'accent' as const,
  },
]

const TESTIMONIALS = [
  {
    name: 'Paola Rosa', context: 'Cursinho · 2º ano', color: '#22c55e', photo: '/depoimentos/paola-rosa.jpg',
    text: 'As aulas foram muito enriquecedoras para mim. Além de transmitir o conteúdo de forma muito eficiente, o professor Paulo estimula o aluno a desenvolver o próprio raciocínio e buscar compreender os assuntos de maneira mais profunda.\n\nUm dos grandes diferenciais é justamente o incentivo à autonomia: em vez de simplesmente fornecer respostas prontas, as aulas nos estimulam a pensar, construir argumentos e desenvolver um olhar mais crítico sobre os conteúdos. Muitas vezes estamos tão saturados de conteúdos que achamos que não sabemos a resposta de determinado assunto, mas durante as aulas o professor Paulo me ajudou a desenvolver técnicas para buscar ativamente assuntos que eu já sabia e responder de maneira efetiva as questões dos vestibulares mais concorridos do país.',
  },
  {
    name: 'Marcela Manzano', context: 'Cursinho · 4º ano', color: '#38bdf8', photo: '/depoimentos/marcela-manzano.jpg',
    text: 'Para mim, foi essencial deixar o ego de lado e procurar a ajuda de um profissional. Ter a orientação de alguém que já passou pelo processo, conhece as particularidades das provas, sabe os macetes e consegue filtrar o que realmente merece atenção me fez conquistar mais acertos em poucos meses. Sou muito grata por toda a ajuda!',
  },
  {
    name: 'Beatriz Salles', context: 'Retomando os estudos', color: '#ec4899', photo: null,
    text: 'Fazia tempo que eu tinha parado de estudar. O calendário com os compromissos me ajudou a voltar a ter uma rotina de verdade.',
  },
  {
    name: 'Rafael Teixeira', context: 'Cursinho · 5º ano', color: '#a855f7', photo: null,
    text: 'Os plantões ao vivo salvam quando bate a dúvida de última hora antes da prova. Poder falar direto com o professor faz toda diferença.',
  },
]

// Catálogo provisório — reflete as pastas de aulas já gravadas
// (MÓDULOS/bio despolariza, MÓDULOS/Geo - despolariza). Vira dado
// real (tabela courses) assim que o banco estiver plugado.
const courses = [
  {
    slug: 'biologia',
    title: 'Biologia para Vestibular',
    subject: 'Biologia',
    lessons: 41,
    description: 'Da bioquímica à genética — trilha completa em videoaulas.',
  },
  { slug: 'matematica', title: 'Matemática para Vestibular', subject: 'Matemática', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
  { slug: 'fisica', title: 'Física para Vestibular', subject: 'Física', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
  { slug: 'quimica', title: 'Química para Vestibular', subject: 'Química', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
  { slug: 'geografia', title: 'Geografia para Vestibular', subject: 'Geografia', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
  { slug: 'historia', title: 'História para Vestibular', subject: 'História', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
  { slug: 'redacao', title: 'Redação para Vestibular', subject: 'Redação', lessons: 0, description: 'Módulo em produção — em breve novas aulas.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="DespolarizaMed" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold text-fg">
              Despolariza<span className="text-accent">Med</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/#cursos" className="hover:text-fg transition">Cursos</Link>
            <Link href="/#planos" className="hover:text-fg transition">Assinatura</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="student-area-btn hidden sm:block border text-sm font-semibold px-4 py-2 rounded-lg transition hover:brightness-110"
            >
              Área do Aluno
            </Link>
            <Link
              href="/auth/signup"
              className="bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(79,128,172,0.22),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(244,128,30,0.14),transparent_50%)]" />
        <NeuronBackground opacity={0.16} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-teal/10 text-teal-dark border border-teal/30 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Rumo a aprovação
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-fg leading-tight mb-5">
              Aulas que <span className="text-primary">despolarizam</span> sua rota até a universidade
            </h1>
            <p className="text-muted text-base sm:text-lg mb-8">
              Videoaulas gravadas, material de apoio e acompanhamento exclusivo
              de quem já estudou pra vestibular, passou, e agora leciona por aqui.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/#planos"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                <Play size={18} /> Assinar agora
              </Link>
              <Link
                href="/#cursos"
                className="inline-flex items-center gap-2 border border-edge hover:border-primary/50 text-fg font-medium px-6 py-3 rounded-lg transition"
              >
                Ver cursos
              </Link>
              <Link
                href="/#labs"
                className="inline-flex items-center gap-2 border border-edge hover:border-primary/50 text-fg font-medium px-6 py-3 rounded-lg transition"
              >
                Ver laboratórios
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <a
                href="https://instagram.com/despolarizamed"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full text-white text-sm font-medium transition hover:brightness-110"
                style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <InstagramIcon size={16} />
                </span>
                @despolarizamed
              </a>
              <a
                href="https://www.youtube.com/@despolarizamed"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full bg-red-600 text-white text-sm font-medium transition hover:brightness-110"
              >
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <YoutubeIcon size={16} />
                </span>
                YouTube
              </a>
            </div>
          </div>
          <div className="min-w-0 flex flex-col lg:flex-row items-center justify-center gap-5">
            {/* Prévia real do produto (tela do /simulado) em vez da logo 3D
                estática — ideia validada no mockup que Paulo aprovou. Cores
                via tokens de tema (bg-surface/border-edge/text-fg...) pra
                funcionar igual no claro e no escuro. */}
            <div className="w-full max-w-[340px] rounded-2xl bg-surface border border-edge shadow-2xl overflow-hidden shrink-0">
              <div className="h-9 bg-app flex items-center gap-1.5 px-3.5 border-b border-edge">
                <span className="w-2 h-2 rounded-full bg-faint/60" />
                <span className="w-2 h-2 rounded-full bg-faint/60" />
                <span className="w-2 h-2 rounded-full bg-faint/60" />
                <span className="ml-2.5 text-faint text-[11px]">despolarizamed.com/simulado</span>
              </div>
              <div className="p-5">
                <p className="text-fg text-sm font-bold mb-3">Simulados — questões reais de vestibular</p>
                <div className="flex flex-wrap gap-2">
                  {['Biologia', 'Física', 'Química', 'Matemática', 'Geografia', 'História'].map((s) => (
                    <span
                      key={s}
                      className="text-white text-[11px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: subjectColor(s) }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-muted text-xs leading-relaxed">
                  Escolha o número de questões que desejar, podendo fazer na plataforma ou imprimir o PDF.
                </p>
              </div>
            </div>

            {/* Prova social empilhada, alinhada na extrema direita — pedido
                do Paulo depois de ver o mockup: contagem do banco, alunos
                ativos e o selo de gabarito oficial, um embaixo do outro. */}
            <div className="flex flex-col gap-3 w-full max-w-[340px] lg:max-w-[180px] lg:shrink-0">
              <span className="inline-flex items-center justify-center text-center bg-accent text-white text-xs sm:text-sm font-bold px-3.5 py-3 rounded-xl shadow-lg shadow-accent/20 leading-snug">
                {/* Pedido do Paulo: texto fixo "mais de 5.000" — hoje lib/examBank.ts tem 1.484 questões reais (ver aviso na resposta). */}
                mais de 5.000 questões reais no banco de dados
              </span>
              <span className="inline-flex items-center justify-center text-center bg-primary text-white text-xs sm:text-sm font-bold px-3.5 py-3 rounded-xl shadow-lg shadow-primary/20 leading-snug">
                +120 alunos estudando agora
              </span>
              <span className="inline-flex items-center justify-center text-center bg-teal text-primary-dark text-xs sm:text-sm font-bold px-3.5 py-3 rounded-xl shadow-lg shadow-teal/20 leading-snug">
                Provas com gabarito oficial
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="cursos" className="relative overflow-hidden bg-surface px-4 sm:px-6 py-16">
        <HeroPatternBackground />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg mb-2">Cursos</h2>
          <p className="text-muted mb-8">Escolha uma trilha e comece a estudar hoje.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/cursos/${course.slug}`}
                className="group bg-app border border-edge rounded-2xl overflow-hidden hover:border-primary/50 transition"
              >
                <div className="h-36 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center relative">
                  <span
                    className="absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: subjectColor(course.subject) }}
                  >
                    {course.subject}
                  </span>
                  <Play className="text-white/80 group-hover:scale-110 transition" size={36} />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-fg mb-1">{course.title}</h3>
                  <p className="text-muted text-sm mb-3">{course.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-faint">
                    <CheckCircle2 size={14} />
                    {course.lessons > 0 ? `${course.lessons} aulas disponíveis` : 'Em produção'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Faixa de vestibulares — logos reais em chips coloridos alternando
          nossa paleta (em vez do cinza do site de referência). Estático,
          não animado — o site de referência também usa uma fileira fixa. */}
      <section className="vestibulares-strip border-t border-edge py-10 overflow-hidden">
        <p className="text-center text-xs font-semibold tracking-widest text-faint mb-6 px-4">
          PREPARANDO ALUNOS PROS PRINCIPAIS VESTIBULARES DO PAÍS
        </p>
        <div className="relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-8">
            {[...VESTIBULARES, ...VESTIBULARES].map((v, i) => {
              const color = PALETTE[i % PALETTE.length]
              return (
                <span key={i} className="shrink-0 flex items-center justify-center h-28 px-3">
                  {v.logo ? (
                    <img src={v.logo} alt={v.name} className="h-24 max-w-[240px] object-contain" />
                  ) : (
                    <span className="font-bold text-base tracking-tight" style={{ color }}>{v.name}</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Entenda agora — efeito de digitação estilo chagas.ai */}
      <section className="bg-surface px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-fg max-w-2xl mx-auto leading-snug">
          Entenda agora se o DespolarizaMed pode
          <br />
          <TypewriterRotator phrases={TYPEWRITER_PHRASES} className="text-primary" />
        </h2>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition mt-8"
        >
          Começar agora
        </Link>
      </section>

      {/* Você está no... */}
      <section className="relative overflow-hidden bg-app px-4 sm:px-6 py-20">
        <NeuronBackground opacity={0.08} />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg text-center mb-10">Em que fase você está?</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {STUDENT_STAGES.map((stage) => (
              <div key={stage.title} className="bg-surface border border-edge rounded-2xl p-6">
                <p className="text-teal-dark text-xs font-bold tracking-wide mb-2">{stage.label}</p>
                <h3 className="text-fg font-bold text-lg mb-2">{stage.title}</h3>
                <p className="text-muted text-sm">{stage.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Não é uma plataforma convencional — com fundo sutil de sistema nervoso */}
      <section className="relative overflow-hidden bg-app px-4 sm:px-6 py-20">
        <NeuronBackground opacity={0.07} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg leading-snug mb-4">
            O DespolarizaMed não é uma plataforma de cursinho convencional. Não tem enrolação, não tem brincadeiras e nem é infantilizado.
          </h2>
          <p className="text-muted mb-12">
            Mantemos a seriedade, profissionalismo e foco. Tratamos nosso aluno como uma pessoa, não como um número.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 text-left">
            {[
              { step: 'PASSO 1', title: 'Explore a plataforma e o que ela pode oferecer' },
              { step: 'PASSO 2', title: 'Organize seu material de estudos e peça ajuda na monitoria de estudos' },
              { step: 'PASSO 3', title: 'Respire, agradeça e vamos começar!' },
            ].map((s) => (
              <div key={s.step} className="bg-surface border border-edge rounded-2xl p-5">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <p className="text-faint text-[11px] font-bold tracking-wide mb-1">{s.step}</p>
                <p className="text-fg text-sm font-medium">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos — Paola e Marcela são alunas reais; Beatriz e Rafael
          ainda são ilustrativos até Paulo trocar por mais alunos reais. */}
      <section className="bg-surface px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg text-center mb-2">O que dizem nossos alunos</h2>
          <p className="text-faint text-xs text-center mb-10">* Beatriz e Rafael são depoimentos ilustrativos — em breve substituídos por mais alunos reais.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-app border border-edge rounded-2xl p-5">
                <p className="text-fg text-sm leading-relaxed mb-4 whitespace-pre-wrap text-justify">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <TestimonialAvatar name={t.name} photo={t.photo} color={t.color} />
                  <div>
                    <p className="text-fg text-base font-bold">{t.name}</p>
                    <p className="text-faint text-sm">{t.context}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs — mesma vitrine usada em /apps, com 4 ferramentas de matérias
          diferentes pra mostrar a variedade (tem dezenas de outras). */}
      <section id="labs" className="relative overflow-hidden bg-app px-4 sm:px-6 py-20">
        <NeuronBackground opacity={0.07} />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg text-center mb-2">Labs — laboratórios interativos</h2>
          <p className="text-muted text-center mb-10">Simuladores pra ver a matéria acontecendo, não só ler sobre ela. Estas são só 8 de dezenas de ferramentas disponíveis.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LABS_PREVIEW.map((lab) => {
              const Icon = lab.icon
              return (
                <div key={lab.title} className="bg-surface border border-edge rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${lab.color}26`, color: lab.color }}>
                    <Icon size={22} />
                  </div>
                  <p className="text-fg font-semibold mb-1">{lab.title}</p>
                  <p className="text-muted text-sm">{lab.description}</p>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Explorar todos os Labs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface px-4 sm:px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg text-center mb-10">Perguntas frequentes</h2>
          <LandingFAQ />
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="relative overflow-hidden bg-app px-4 sm:px-6 py-20">
        <HeroPatternBackground />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-fg text-center mb-2">Assine o DespolarizaMed e transforme sua forma de estudar</h2>
          <p className="text-muted text-center mb-12">Preços ilustrativos — ajuste depois de decidir os valores finais.</p>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => {
              const styles = {
                plain: { border: 'border-edge', badgeBg: '', button: 'bg-slate-900 hover:bg-slate-800 text-white', accent: 'text-fg' },
                teal: { border: 'border-teal shadow-lg shadow-teal/10 md:-translate-y-2', badgeBg: 'bg-teal text-white', button: 'bg-teal hover:brightness-95 text-white', accent: 'text-teal-dark' },
                accent: { border: 'border-accent', badgeBg: 'bg-accent text-white', button: 'bg-accent hover:bg-accent-dark text-white', accent: 'text-accent' },
              }[plan.style]

              return (
                <div key={plan.id} className={`rounded-2xl p-6 border-2 bg-surface flex flex-col h-full ${styles.border}`}>
                  {plan.badge && (
                    <span className={`self-start text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${styles.badgeBg}`}>
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="text-fg font-bold text-lg mb-1">{plan.name}</h3>
                  {plan.off && <span className={`inline-block text-xs font-bold mb-3 ${styles.accent}`}>{plan.off}</span>}

                  <p className="text-muted text-xs mb-1">Por apenas 12x de</p>
                  <p className="text-3xl font-extrabold text-fg mb-1">R$ {plan.price}</p>
                  <p className="text-faint text-xs mb-1">R$ {plan.total} no cartão de crédito ou pix</p>
                  <p className="text-faint text-xs mb-5">{plan.cadence}</p>

                  <Link href="/auth/signup" className={`text-center font-semibold px-4 py-2.5 rounded-lg transition mb-5 ${styles.button}`}>
                    Assine Agora
                  </Link>

                  <p className="text-faint text-xs font-semibold uppercase mb-2">O que está incluso:</p>
                  <ul className="space-y-2.5">
                    {PLAN_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-fg">
                        <Check size={16} className="text-teal shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer — estilo Prof. Ferretto: colunas + redes sociais */}
      <footer className="bg-primary-dark px-4 sm:px-6 pt-14 pb-8">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-[1fr_auto_auto_auto] gap-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="DespolarizaMed" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-white">Despolariza<span className="text-accent">Med</span></span>
          </div>

          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">DespolarizaMed</p>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <Link href="/termos" className="hover:text-white transition">Termos de uso</Link>
              <Link href="/privacidade" className="hover:text-white transition">Política de privacidade</Link>
              <a href="#planos" className="hover:text-white transition">Planos</a>
            </div>
          </div>

          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">Escreva pra gente!</p>
            <a href="mailto:despolarizamed@gmail.com" className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition">
              <Mail size={14} /> despolarizamed@gmail.com
            </a>
          </div>

          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">Redes sociais</p>
            <div className="flex gap-2">
              <a
                href="https://instagram.com/despolarizamed"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:brightness-110"
                style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                aria-label="Instagram"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="https://www.youtube.com/@despolarizamed"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white transition hover:brightness-110"
                aria-label="YouTube"
              >
                <YoutubeIcon size={16} />
              </a>
              <a
                href="https://wa.me/5517997481461"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white transition hover:brightness-110"
                aria-label="WhatsApp"
              >
                <WhatsappIcon size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} DespolarizaMed. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Bolha flutuante de WhatsApp */}
      <a
        href="https://wa.me/5517997481461"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white pl-3 pr-4 py-3 rounded-full shadow-lg transition"
        aria-label="Falar no WhatsApp"
      >
        <WhatsappIcon size={20} />
        <span className="text-sm font-semibold hidden sm:inline">Dúvida?</span>
      </a>
    </div>
  )
}
