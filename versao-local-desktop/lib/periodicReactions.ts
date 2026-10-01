import data from '@/lib/periodicTableData.json'
import { POTENTIALS } from '@/lib/electrochemistry'

export type ReactionResult =
  | {
      kind: 'compound'
      formula: string
      name: string
      molarMass: number
      bond: string
      geometry: string
      clinical: string | null
      tip: string | null
      note: string | null
    }
  | { kind: 'info'; title: string; text: string; href?: string; hrefLabel?: string }

type Curated = {
  elements: Record<string, number>
  formula: string
  name: string
  bond: string
  geometry: string
  clinical: string
  tip: string
}

const IONIC = 'Iônica'
const POLAR = 'Covalente polar'
const APOLAR = 'Covalente apolar'
const LATTICE = 'Retículo cristalino iônico (sem molécula discreta)'

export const CURATED: Curated[] = [
  { elements: { Na: 1, Cl: 1 }, formula: 'NaCl', name: 'Cloreto de sódio', bond: IONIC, geometry: LATTICE + ', cúbico', clinical: 'Soro fisiológico (NaCl 0,9%): repõe volume e sódio, isotônico ao sangue. Principal sal do meio extracelular, controla osmolaridade e pressão arterial.', tip: 'Sólido cristalino de alto ponto de fusão; conduz corrente elétrica fundido ou dissolvido, não no estado sólido.' },
  { elements: { H: 2, O: 1 }, formula: 'H2O', name: 'Água', bond: POLAR, geometry: 'Angular (104,5°)', clinical: 'Cerca de 60% do corpo humano. Solvente das reações do metabolismo; desidratação altera volume e eletrólitos.', tip: 'Molécula polar. Ligações de hidrogênio explicam o ponto de ebulição alto e a tensão superficial.' },
  { elements: { H: 2, O: 2 }, formula: 'H2O2', name: 'Peróxido de hidrogênio', bond: POLAR, geometry: 'Não planar (forma de "livro aberto")', clinical: 'Água oxigenada 3%: antisséptico de feridas. A enzima catalase decompõe o H₂O₂ liberando O₂ (as borbulhas).', tip: 'O oxigênio tem NOX −1 (peróxido), exceção à regra geral de −2.' },
  { elements: { H: 1, Cl: 1 }, formula: 'HCl', name: 'Ácido clorídrico', bond: POLAR, geometry: 'Linear', clinical: 'Compõe o suco gástrico (pH 1–2): ativa a pepsina e mata microrganismos. Excesso relaciona-se a refluxo e gastrite.', tip: 'Ácido forte: em água ioniza-se totalmente, HCl → H⁺ + Cl⁻.' },
  { elements: { C: 1, O: 2 }, formula: 'CO2', name: 'Dióxido de carbono', bond: POLAR, geometry: 'Linear (180°)', clinical: 'Produto da respiração celular, transportado no sangue como bicarbonato. Retenção de CO₂ causa acidose respiratória; hiperventilação causa alcalose.', tip: 'Molécula apolar apesar das ligações polares: os vetores se anulam pela geometria linear.' },
  { elements: { C: 1, O: 1 }, formula: 'CO', name: 'Monóxido de carbono', bond: POLAR, geometry: 'Linear', clinical: 'Intoxicação por CO: liga-se à hemoglobina com afinidade cerca de 200 vezes maior que o O₂ (carboxi-hemoglobina) e impede o transporte de oxigênio.', tip: 'É um óxido neutro (não reage com água, ácidos ou bases).' },
  { elements: { Ca: 1, O: 1 }, formula: 'CaO', name: 'Óxido de cálcio (cal virgem)', bond: IONIC, geometry: LATTICE, clinical: 'Ao reagir com água forma Ca(OH)₂, base usada em materiais odontológicos e no controle de acidez.', tip: 'Óxido básico: CaO + H₂O → Ca(OH)₂. Componente do cimento.' },
  { elements: { Na: 1, F: 1 }, formula: 'NaF', name: 'Fluoreto de sódio', bond: IONIC, geometry: LATTICE, clinical: 'Fonte de flúor em cremes dentais e água fluoretada: fortalece o esmalte e previne cáries. Excesso causa fluorose dentária.', tip: 'Composto iônico formado por metal alcalino e halogênio (Na⁺ e F⁻).' },
  { elements: { K: 1, Cl: 1 }, formula: 'KCl', name: 'Cloreto de potássio', bond: IONIC, geometry: LATTICE, clinical: 'Reposição de potássio na hipocalemia. Aplicação intravenosa rápida é perigosa: pode causar arritmia e parada cardíaca.', tip: 'K⁺ é o principal cátion intracelular; é usado como fertilizante (nutriente NPK).' },
  { elements: { Mg: 1, O: 1 }, formula: 'MgO', name: 'Óxido de magnésio', bond: IONIC, geometry: LATTICE, clinical: 'Suplemento de magnésio, antiácido e laxante leve. O Mg é cofator de mais de 300 enzimas.', tip: 'Ponto de fusão altíssimo porque as cargas (Mg²⁺ e O²⁻) são grandes. Óxido básico.' },
  { elements: { Na: 1, O: 1, H: 1 }, formula: 'NaOH', name: 'Hidróxido de sódio (soda cáustica)', bond: IONIC, geometry: 'Rede iônica com íon OH⁻ (linear O–H)', clinical: 'Corrosivo: causa queimaduras alcalinas graves na pele e nos olhos, que penetram mais fundo que as ácidas.', tip: 'Base forte: dissocia-se totalmente em Na⁺ e OH⁻; usada para neutralizar ácidos.' },
  { elements: { K: 1, O: 1, H: 1 }, formula: 'KOH', name: 'Hidróxido de potássio', bond: IONIC, geometry: 'Rede iônica com íon OH⁻', clinical: 'Base forte, corrosiva; usada em sabões líquidos e no preparo de amostras clínicas para fungos (KOH 10%).', tip: 'Base forte de metal alcalino, totalmente dissociada em água.' },
  { elements: { Ca: 1, Cl: 2 }, formula: 'CaCl2', name: 'Cloreto de cálcio', bond: IONIC, geometry: LATTICE, clinical: 'Injetável na hipocalcemia grave e na hipercalemia (protege o coração). Mostra a proporção Ca²⁺ : 2 Cl⁻.', tip: 'Estequiometria da fórmula: a carga +2 do Ca é balanceada por dois Cl⁻.' },
  { elements: { Mg: 1, Cl: 2 }, formula: 'MgCl2', name: 'Cloreto de magnésio', bond: IONIC, geometry: LATTICE, clinical: 'Reposição de magnésio em deficiências e na pré-eclâmpsia (via MgSO₄, mais usado).', tip: 'Mg²⁺ pede dois ânions Cl⁻: por isso Cl₂ na fórmula.' },
  { elements: { N: 1, H: 3 }, formula: 'NH3', name: 'Amônia', bond: POLAR, geometry: 'Piramidal trigonal (~107°)', clinical: 'Produto do metabolismo de aminoácidos, tóxico para o cérebro (encefalopatia hepática). O fígado o converte em ureia.', tip: 'Molécula polar, faz ligações de hidrogênio; base de Lewis (par de elétrons livre no N).' },
  { elements: { C: 1, H: 4 }, formula: 'CH4', name: 'Metano', bond: POLAR, geometry: 'Tetraédrica (109,5°)', clinical: 'Gás produzido por bactérias intestinais (flatulência). Principal componente do gás natural.', tip: 'Molécula apolar com hibridação sp³. Ligações C–H de baixa polaridade.' },
  { elements: { H: 1, F: 1 }, formula: 'HF', name: 'Ácido fluorídrico', bond: POLAR, geometry: 'Linear', clinical: 'Queimaduras por HF são graves e profundas (sequestra o Ca²⁺ do corpo); tratam-se com gluconato de cálcio.', tip: 'Faz as ligações de hidrogênio mais fortes; é o único hidrácido halogenado que é ácido fraco. Corrói vidro.' },
  { elements: { H: 2, S: 1 }, formula: 'H2S', name: 'Sulfeto de hidrogênio', bond: POLAR, geometry: 'Angular (~92°)', clinical: 'Gás de cheiro de ovo podre, tóxico: inibe a citocromo c oxidase na respiração celular. Produzido por bactérias intestinais.', tip: 'Ponto de ebulição bem menor que o da água: não faz ligações de hidrogênio significativas.' },
  { elements: { Fe: 2, O: 3 }, formula: 'Fe2O3', name: 'Óxido de ferro(III)', bond: IONIC, geometry: LATTICE, clinical: 'É a ferrugem e o minério hematita. Fe³⁺ da dieta precisa ser reduzido a Fe²⁺ para ser absorvido no intestino.', tip: 'O NOX do ferro é +3; a fórmula mostra a proporção 2 Fe³⁺ : 3 O²⁻.' },
  { elements: { Ca: 1, C: 1, O: 3 }, formula: 'CaCO3', name: 'Carbonato de cálcio', bond: IONIC, geometry: 'Rede iônica; o íon CO₃²⁻ é trigonal plano', clinical: 'Antiácido e suplemento de cálcio; compõe conchas, giz e mármore.', tip: 'Reage com ácidos liberando CO₂ e, ao ser aquecido, decompõe-se em CaO + CO₂.' },
  { elements: { Na: 1, H: 1, C: 1, O: 3 }, formula: 'NaHCO3', name: 'Bicarbonato de sódio', bond: IONIC, geometry: 'Rede iônica; o íon HCO₃⁻ é trigonal plano', clinical: 'Antiácido e tratamento de acidose metabólica; o par H₂CO₃/HCO₃⁻ é o principal tampão do sangue.', tip: 'Sal ácido: em água dá meio levemente básico e efervesce ao reagir com ácidos.' },
]

const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'])
const DIATOMIC_INFO: Record<string, { name: string; clinical: string; tip: string }> = {
  H: { name: 'Gás hidrogênio', clinical: 'Combustível limpo; o H⁺ (íon) é o que regula o pH do sangue.', tip: 'Molécula apolar, a mais leve que existe.' },
  N: { name: 'Gás nitrogênio', clinical: 'Compõe 78% do ar; nitrogênio líquido é usado para congelar verrugas (criocirurgia).', tip: 'Ligação tripla muito forte: por isso o N₂ é pouco reativo.' },
  O: { name: 'Gás oxigênio', clinical: 'Aceptor final de elétrons na respiração celular; a oxigenoterapia trata hipóxia.', tip: 'Alótropo do ozônio (O₃). O O₂ é paramagnético.' },
  F: { name: 'Gás flúor', clinical: 'Muito reativo e tóxico; só existe combinado (fluoretos) no corpo.', tip: 'Elemento mais eletronegativo; F₂ é o halogênio mais reativo.' },
  Cl: { name: 'Gás cloro', clinical: 'Usado na desinfecção da água; o gás é tóxico para os pulmões.', tip: 'Gás amarelo-esverdeado; halogênios formam moléculas diatômicas.' },
  Br: { name: 'Bromo (Br₂)', clinical: 'Líquido tóxico; brometos já foram usados como sedativos.', tip: 'Único ametal líquido a 25 °C.' },
  I: { name: 'Iodo (I₂)', clinical: 'Iodo é essencial para os hormônios da tireoide; tintura de iodo é antisséptico.', tip: 'Sublima: passa do sólido direto ao gás.' },
}

type El = (typeof data)[number]
const bySymbol = new Map<string, El>(data.map((e) => [e.symbol, e]))

function counts(symbols: string[]) {
  const c: Record<string, number> = {}
  for (const s of symbols) c[s] = (c[s] || 0) + 1
  return c
}

function keyOf(c: Record<string, number>) {
  return Object.keys(c).sort().map((s) => `${s}${c[s]}`).join('')
}

function molarMass(c: Record<string, number>) {
  // Massas aproximadas como nos livros de vestibular: inteiros, exceto o cloro (35,5).
  return Object.entries(c).reduce((sum, [s, n]) => sum + (s === 'Cl' ? 35.5 : Math.round(bySymbol.get(s)?.atomicMass ?? 0)) * n, 0)
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function firstNox(el: El, sign: '+' | '−') {
  const token = (el.oxidationStates ?? '').split(', ').find((t) => t.startsWith(sign) || (sign === '−' && t.startsWith('-')))
  if (!token) return null
  const n = parseInt(token.slice(1), 10)
  return Number.isNaN(n) ? null : n
}

const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
function sup(n: number) {
  return n === 1 ? '' : String(n).split('').map((d) => SUP[Number(d)]).join('')
}

function subscriptFormula(parts: [string, number][]) {
  return parts.map(([s, n]) => (n === 1 ? s : `${s}${n}`)).join('')
}

export function react(symbols: string[]): ReactionResult | null {
  if (symbols.length === 0) return null
  const c = counts(symbols)
  const distinct = Object.keys(c)
  const els = distinct.map((s) => bySymbol.get(s)!).filter(Boolean)

  // Gases nobres
  const nobles = els.filter((e) => e.category === 'gas-nobre')
  if (nobles.length > 0) {
    if (distinct.length === 1) {
      return { kind: 'info', title: `${nobles[0].name} não forma ligações`, text: `${nobles[0].name} é um gás nobre: já tem a camada de valência completa (${nobles[0].symbol === 'He' ? 'dueto, 2 elétrons' : 'octeto, 8 elétrons'}), por isso existe como átomo isolado (monoatômico), muito estável e quase sem reatividade.` }
    }
    const heavy = nobles.find((e) => e.symbol === 'Xe' || e.symbol === 'Kr')
    if (heavy && distinct.includes('F')) {
      return { kind: 'info', title: `${heavy.symbol} + F: exceção histórica`, text: `Xenônio e criptônio, os gases nobres mais pesados, são os únicos que conseguem reagir, e só com o flúor (o elemento mais eletronegativo): existem XeF₂, XeF₄, XeF₆ e KrF₂. A descoberta (Bartlett, 1962) derrubou a ideia de que gases nobres eram totalmente inertes. O simulador não calcula esses compostos.` }
    }
    return {
      kind: 'info',
      title: `${nobles[0].name} não se combina`,
      text: `Os gases nobres têm a camada de valência completa (octeto; o He tem dueto), o que os torna estáveis. Ganhar, perder ou compartilhar elétrons diminuiria a estabilidade, por isso não formam ligações nessas condições (regra do octeto). Retire o gás nobre do reator para simular uma reação.`,
    }
  }

  // Um único elemento
  if (distinct.length === 1) {
    const el = els[0]
    const n = c[el.symbol]
    if (DIATOMIC.has(el.symbol) && n >= 2) {
      const info = DIATOMIC_INFO[el.symbol]
      return { kind: 'compound', formula: `${el.symbol}2`, name: info.name, molarMass: molarMass({ [el.symbol]: 2 }), bond: APOLAR, geometry: 'Linear', clinical: info.clinical, tip: info.tip, note: n > 2 ? 'Foram usados 2 átomos; a molécula estável é diatômica.' : null }
    }
    if (n === 1) {
      return { kind: 'info', title: `${el.name}: átomo isolado`, text: `Adicione outro elemento para formar uma ligação. Um átomo isolado de ${el.name} tende a completar a camada de valência ganhando, perdendo ou compartilhando elétrons.` }
    }
    return { kind: 'info', title: `${el.name} com ${el.name}`, text: 'Átomos do mesmo elemento metálico se unem por ligação metálica, formando um retículo de cátions imersos num "mar de elétrons" (por isso conduzem eletricidade). Não formam um composto molecular.' }
  }

  // Composto curado (contagem exata, depois só pelos elementos)
  const exact = CURATED.find((x) => keyOf(x.elements) === keyOf(c))
  const loose = exact ?? CURATED.find((x) => Object.keys(x.elements).sort().join() === distinct.slice().sort().join())
  if (loose) {
    return {
      kind: 'compound',
      formula: loose.formula,
      name: loose.name,
      molarMass: molarMass(loose.elements),
      bond: loose.bond,
      geometry: loose.geometry,
      clinical: loose.clinical,
      tip: loose.tip,
      note: exact ? null : 'Proporção ajustada para o composto mais comum entre esses elementos.',
    }
  }

  // Dois elementos: fórmula pelo cruzamento de NOX
  if (distinct.length === 2) {
    const [a, b] = els.slice().sort((x, y) => (x.electronegativity ?? 0) - (y.electronegativity ?? 0))
    const bothMetals = (e: El) => ['alcalino', 'alcalino-terroso', 'transicao', 'pos-transicao', 'lantanideo', 'actinideo'].includes(e.category)
    if (bothMetals(a) && bothMetals(b)) {
      const cellLink = POTENTIALS[a.symbol] && POTENTIALS[b.symbol] && a.symbol !== b.symbol ? { href: `/apps/pilhas?a=${a.symbol}&b=${b.symbol}`, hrefLabel: 'Simular como pilha (Zn/Cu, Fe/Cu...)' } : {}
      return { kind: 'info', ...cellLink, title: 'Metal + metal: liga ou pilha', text: `${a.name} e ${b.name} não formam um composto iônico nem molecular: ambos tendem a perder elétrons. Misturados, formam uma liga metálica (ligação metálica), como o latão (Cu + Zn) e o bronze (Cu + Sn). Já como eletrodos em soluções, metais de potenciais diferentes formam uma pilha (oxirredução).` }
    }
    const cation = firstNox(a, '+')
    const anion = firstNox(b, '−')
    if (cation && anion) {
      const g = gcd(cation, anion)
      const na = anion / g
      const nb = cation / g
      const formulaCounts = { [a.symbol]: na, [b.symbol]: nb }
      const diff = Math.abs((a.electronegativity ?? 0) - (b.electronegativity ?? 0))
      const bond = bothMetals(a) || diff >= 1.7 ? IONIC : diff >= 0.4 ? POLAR : APOLAR
      return {
        kind: 'compound',
        formula: subscriptFormula([[a.symbol, na], [b.symbol, nb]]),
        name: `Composto de ${a.name.toLowerCase()} e ${b.name.toLowerCase()}`,
        molarMass: molarMass(formulaCounts),
        bond,
        geometry: bond === IONIC ? LATTICE : 'Não calculada neste simulador',
        clinical: null,
        tip: `Fórmula obtida pelo cruzamento das cargas: ${a.symbol}${sup(cation)}⁺ e ${b.symbol}${sup(anion)}⁻. Diferença de eletronegatividade = ${diff.toFixed(2).replace('.', ',')}.`,
        note: 'Composto não catalogado: fórmula e tipo de ligação estimados pelo NOX e pela eletronegatividade.',
      }
    }
  }

  return { kind: 'info', title: 'Combinação não reconhecida', text: 'Esta combinação não está catalogada no simulador. Tente compostos como NaCl, H₂O, HCl, CO₂, CaO, NaF, KCl, MgO, NH₃ ou CH₄, ou veja os NOX na ficha do elemento para prever a fórmula.' }
}
