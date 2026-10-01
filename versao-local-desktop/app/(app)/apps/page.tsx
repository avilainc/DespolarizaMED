import Link from 'next/link'
import { Atom, PenLine, ArrowRight, Box, BatteryCharging, FlaskConical, Orbit, Thermometer, Scale, TestTube2, Gauge, Droplets, Sun, Eye, Zap, Waves, Wind, TrendingUp, Triangle, Cone, BarChart3, Coins, Globe2, Landmark } from 'lucide-react'

const APPS = [
  {
    href: '/apps/tabela-periodica',
    title: 'Tabela Periódica',
    description: 'Os 118 elementos com ficha química, NOX e aplicações na medicina.',
    icon: Atom,
    color: '#4ade80',
  },
  {
    href: '/apps/geometria-molecular',
    title: 'Geometria Molecular 3D',
    description: 'Veja em 3D o formato, os ângulos e a polaridade de H₂O, CO₂, NH₃ e outras moléculas.',
    icon: Box,
    color: '#38bdf8',
  },
  {
    href: '/apps/pilhas',
    title: 'Pilhas',
    description: 'Escolha dois metais e calcule o ΔE°, com ânodo, cátodo e equação global.',
    icon: BatteryCharging,
    color: '#facc15',
  },
  {
    href: '/apps/separacao-de-misturas',
    title: 'Separação de Misturas',
    description: 'Laboratório virtual: monte misturas e escolha a vidraria certa para separá-las.',
    icon: FlaskConical,
    color: '#fb923c',
  },
  {
    href: '/apps/modelos-atomicos',
    title: 'Modelos Atômicos',
    description: 'De Dalton a Bohr em 3D, com os experimentos históricos e o salto quântico.',
    icon: Orbit,
    color: '#f472b6',
  },
  {
    href: '/apps/termoquimica',
    title: 'Termoquímica',
    description: 'Diagramas de entalpia, energia de ativação, catalisador e Lei de Hess.',
    icon: Thermometer,
    color: '#fb923c',
  },
  {
    href: '/apps/equilibrio-quimico',
    title: 'Equilíbrio Químico',
    description: 'Le Chatelier em tempo real: concentração, temperatura, pressão e catalisador.',
    icon: Scale,
    color: '#34d399',
  },
  {
    href: '/apps/organolab',
    title: 'OrganoLab',
    description: 'Monte moléculas orgânicas e veja fórmula, função e nome IUPAC em tempo real.',
    icon: TestTube2,
    color: '#22d3ee',
  },
  {
    href: '/apps/cinematica',
    title: 'Cinemática',
    description: 'MRU e MRUV com veículos, gráficos S×t/V×t/A×t e resolução passo a passo.',
    icon: Gauge,
    color: '#60a5fa',
  },
  {
    href: '/apps/hidrostatica',
    title: 'Hidrostática',
    description: 'Stevin, Pascal, Torricelli e Arquimedes: pressão, prensas e empuxo.',
    icon: Droplets,
    color: '#38bdf8',
  },
  {
    href: '/apps/refracao',
    title: 'Refração da Luz',
    description: 'Lei de Snell, ângulo limite e reflexão total entre dois meios.',
    icon: Sun,
    color: '#facc15',
  },
  {
    href: '/apps/optica-imagens',
    title: 'Espelhos e Lentes',
    description: 'Formação de imagens, raios notáveis e a equação de Gauss.',
    icon: Eye,
    color: '#a78bfa',
  },
  {
    href: '/apps/circuitos',
    title: 'Circuitos Elétricos',
    description: 'Leis de Ohm, resistência equivalente e calculadora de conta de luz.',
    icon: Zap,
    color: '#facc15',
  },
  {
    href: '/apps/ondulatoria',
    title: 'Ondulatória e Acústica',
    description: 'v = λf, fenômenos ondulatórios, qualidades do som e efeito Doppler.',
    icon: Waves,
    color: '#38bdf8',
  },
  {
    href: '/apps/termodinamica',
    title: 'Termodinâmica',
    description: '1ª Lei, diagrama P×V, transformações gasosas e Ciclo de Carnot.',
    icon: Wind,
    color: '#fb7185',
  },
  {
    href: '/apps/funcoes',
    title: 'Funções 1º e 2º Grau',
    description: 'Coeficientes, raízes, vértice e problemas de otimização em tempo real.',
    icon: TrendingUp,
    color: '#4ade80',
  },
  {
    href: '/apps/geometria-plana',
    title: 'Geometria Plana',
    description: 'Triângulos, quadriláteros, polígonos e círculo/setor: área, perímetro e trigonometria.',
    icon: Triangle,
    color: '#38bdf8',
  },
  {
    href: '/apps/geometria-espacial',
    title: 'Geometria Espacial 3D',
    description: 'Prismas, pirâmides, cilindro, cone e esfera: gire em 3D, área e volume.',
    icon: Cone,
    color: '#38bdf8',
  },
  {
    href: '/apps/estatistica',
    title: 'Estatística e Combinatória',
    description: 'Média/moda/mediana/desvio padrão, permutação/arranjo/combinação e probabilidade.',
    icon: BarChart3,
    color: '#a78bfa',
  },
  {
    href: '/apps/matematica-financeira',
    title: 'Matemática Financeira & Progressões',
    description: 'Juros simples × compostos e PA × PG: termo geral, soma e gráfico comparativo.',
    icon: Coins,
    color: '#4ade80',
  },
  {
    href: '/apps/cartografia',
    title: 'Cartografia & Fusos Horários',
    description: 'Calcule fusos de voos, compare projeções cartográficas (Mercator, Peters, Robinson, Azimutal) e leia escalas e curvas de nível.',
    icon: Globe2,
    color: '#38bdf8',
  },
  {
    href: '/apps/historia-interativa',
    title: 'História Interativa',
    description: 'Mapas georreferenciados e fichas de análise: Brasil (revoltas e períodos), Guerras Mundiais e Antiguidade Clássica.',
    icon: Landmark,
    color: '#f87171',
  },
  {
    href: null,
    title: 'Redação',
    description: 'Ferramenta dinâmica de redação — em construção.',
    icon: PenLine,
    color: '#a78bfa',
  },
]

export default function AppsPage() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-1">Labs</h1>
      <p className="text-muted text-sm mb-6">Simuladores e laboratórios interativos do DespolarizaMed.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPS.map((app) => {
          const Icon = app.icon
          const body = (
            <>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${app.color}26`, color: app.color }}>
                <Icon size={22} />
              </div>
              <p className="text-fg font-semibold mb-1">{app.title}</p>
              <p className="text-muted text-sm mb-3">{app.description}</p>
              {app.href ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: app.color }}>Abrir <ArrowRight size={14} /></span>
              ) : (
                <span className="text-faint text-xs font-semibold uppercase">Em breve</span>
              )}
            </>
          )
          return app.href ? (
            <Link key={app.title} href={app.href} className="bg-surface border border-edge rounded-2xl p-5 hover:border-primary/50 transition block">{body}</Link>
          ) : (
            <div key={app.title} className="bg-surface border border-edge rounded-2xl p-5 opacity-70">{body}</div>
          )
        })}
      </div>
    </div>
  )
}
