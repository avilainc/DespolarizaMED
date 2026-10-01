export type SubstanceId = 'agua' | 'areia' | 'sal' | 'oleo' | 'etanol' | 'serragem' | 'limalha' | 'petroleo'
export type TechniqueId = 'filtracao' | 'funil' | 'sedimentacao' | 'simples' | 'fracionada' | 'centrifuga' | 'ima' | 'flotacao'

export const SUBSTANCES: { id: SubstanceId; name: string; formula: string; color: string; note: string }[] = [
  { id: 'agua', name: 'Água', formula: 'H₂O', color: '#38bdf8', note: 'Líquido polar, ρ = 1,0 g/mL' },
  { id: 'areia', name: 'Areia', formula: 'SiO₂', color: '#d4b483', note: 'Sólido insolúvel, denso' },
  { id: 'sal', name: 'Sal de cozinha', formula: 'NaCl', color: '#e5e7eb', note: 'Solúvel em água (CS ≈ 36 g/100 g a 20 °C)' },
  { id: 'oleo', name: 'Óleo vegetal', formula: '', color: '#facc15', note: 'Apolar, imiscível na água, menos denso' },
  { id: 'etanol', name: 'Etanol (álcool)', formula: 'C₂H₆O', color: '#a5b4fc', note: 'Miscível em água, PE = 78 °C' },
  { id: 'serragem', name: 'Serragem', formula: '', color: '#a16207', note: 'Sólido menos denso que a água (flutua)' },
  { id: 'limalha', name: 'Limalha de ferro', formula: 'Fe', color: '#6b7280', note: 'Sólido denso e magnético' },
  { id: 'petroleo', name: 'Petróleo cru', formula: '', color: '#292524', note: 'Mistura de hidrocarbonetos, imiscível na água' },
]

export const TECHNIQUES: { id: TechniqueId; name: string; hint: string }[] = [
  { id: 'filtracao', name: 'Funil de filtração', hint: 'com papel de filtro' },
  { id: 'funil', name: 'Funil de decantação', hint: 'funil de bromo' },
  { id: 'sedimentacao', name: 'Béquer de sedimentação', hint: 'decantação sólido-líquido' },
  { id: 'simples', name: 'Destilação simples', hint: 'balão, condensador' },
  { id: 'fracionada', name: 'Destilação fracionada', hint: 'com coluna' },
  { id: 'centrifuga', name: 'Centrífuga', hint: 'sedimentação acelerada' },
  { id: 'ima', name: 'Ímã', hint: 'separação magnética' },
  { id: 'flotacao', name: 'Tanque de flotação', hint: 'diferença de densidade' },
]

export const SOLUBILITY = 36 // g de NaCl por 100 g de água a 20 °C

export type MixState = { items: SubstanceId[]; saltG: number }

const LIQ_POLAR: SubstanceId[] = ['agua', 'etanol']
const LIQ_APOLAR: SubstanceId[] = ['oleo', 'petroleo']
const nameOf = (id: SubstanceId) => SUBSTANCES.find((s) => s.id === id)!.name

export type Analysis = {
  empty: boolean
  phases: string[]
  components: string
  homogeneous: boolean
  saturation: string | null
  kind: string
  // camadas para desenhar
  polar: SubstanceId[]
  apolar: SubstanceId[]
  sinking: SubstanceId[]
  floating: SubstanceId[]
  saltDissolved: boolean
  saltExcess: boolean
  saltSolid: boolean
  hasLiquid: boolean
}

export function analyze(s: MixState): Analysis {
  const has = (id: SubstanceId) => s.items.includes(id)
  const polar = LIQ_POLAR.filter(has)
  const apolar = LIQ_APOLAR.filter(has)
  const hasWater = has('agua')
  const hasSalt = has('sal')
  const saltDissolved = hasSalt && hasWater && s.saltG > 0
  const saltExcess = hasSalt && hasWater && s.saltG > SOLUBILITY
  const saltSolid = hasSalt && !hasWater
  const sinking: SubstanceId[] = (['areia', 'limalha'] as SubstanceId[]).filter(has)
  const floating: SubstanceId[] = (['serragem'] as SubstanceId[]).filter(has)
  const hasLiquid = polar.length + apolar.length > 0

  const phases: string[] = []
  if (polar.length) phases.push(`Fase líquida polar: ${polar.map(nameOf).join(' + ')}${saltDissolved ? ' + NaCl dissolvido' : ''}`)
  if (apolar.length) phases.push(`Fase líquida apolar: ${apolar.map(nameOf).join(' + ')}`)
  sinking.forEach((x) => phases.push(`Fase sólida: ${nameOf(x)}`))
  floating.forEach((x) => phases.push(`Fase sólida: ${nameOf(x)} (flutua)`))
  if (saltExcess) phases.push('Fase sólida: NaCl em excesso (corpo de chão)')
  if (saltSolid) phases.push('Fase sólida: NaCl')

  const count = s.items.length
  const components = count === 0 ? '—' : `${count} (${s.items.map(nameOf).join(', ')})${has('petroleo') ? ', e o petróleo já é uma mistura de centenas de hidrocarbonetos' : ''}`
  const homogeneous = phases.length === 1 && count > 0
  let kind = 'Sem mistura'
  if (count === 1 && !has('petroleo')) kind = 'Substância pura (1 componente, 1 fase)'
  else if (count > 0) kind = homogeneous ? `Mistura homogênea (1 fase, ${has('petroleo') && count === 1 ? 'muitos' : count} componentes)` : `Mistura heterogênea (${phases.length} fases, ${phases.length === 2 ? 'bifásica' : phases.length === 3 ? 'trifásica' : 'polifásica'})`

  let saturation: string | null = null
  if (saltDissolved || (hasSalt && hasWater)) {
    if (s.saltG < SOLUBILITY) saturation = 'Solução insaturada (cabe mais sal): mistura homogênea, 1 fase, 2 componentes.'
    else if (s.saltG === SOLUBILITY) saturation = 'Solução saturada sem corpo de chão: mistura homogênea, 1 fase, 2 componentes.'
    else saturation = `Solução saturada com corpo de chão: ${(s.saltG - SOLUBILITY).toFixed(0)} g de NaCl não dissolvem e ficam no fundo. Mistura heterogênea, 2 fases.`
  }

  return { empty: count === 0, phases, components, homogeneous, saturation, kind, polar, apolar, sinking, floating, saltDissolved, saltExcess, saltSolid, hasLiquid }
}

export type SeparationResult = {
  ok: boolean
  title: string
  text: string
  property?: string
  tip?: string
  next?: MixState
  collected?: { label: string; items: SubstanceId[] }
  stage: string
}

const without = (items: SubstanceId[], remove: SubstanceId[]) => items.filter((i) => !remove.includes(i))

export function separate(s: MixState, tech: TechniqueId): SeparationResult {
  const a = analyze(s)
  const has = (id: SubstanceId) => s.items.includes(id)
  const stageOf: Record<TechniqueId, string> = {
    filtracao: 'Filtrando pelo papel de filtro...',
    funil: 'Deixando as fases se organizarem no funil...',
    sedimentacao: 'Aguardando o sólido sedimentar...',
    simples: 'Aquecendo e condensando o vapor...',
    fracionada: 'Aquecendo a coluna de fracionamento...',
    centrifuga: 'Girando a centrífuga...',
    ima: 'Aproximando o ímã...',
    flotacao: 'Adicionando água ao tanque...',
  }
  const fail = (title: string, text: string): SeparationResult => ({ ok: false, title, text, stage: stageOf[tech] })

  if (a.empty) return fail('Bancada vazia', 'Monte uma mistura escolhendo as substâncias na bancada antes de usar a vidraria.')

  switch (tech) {
    case 'filtracao': {
      const retain: SubstanceId[] = [...a.sinking, ...a.floating]
      const excess = a.saltExcess
      if (retain.length === 0 && !excess) {
        if (a.saltDissolved) return fail('Cuidado com o sal dissolvido!', 'A filtração não retém sal totalmente dissolvido na água: os íons Na⁺ e Cl⁻ são muito menores que os poros do papel e passam junto com o líquido. Para recuperar a água líquida de uma solução homogênea salina, você precisa usar a Destilação Simples.')
        if (a.polar.length && a.apolar.length) return fail('Filtração não separa líquidos', 'O papel de filtro não separa líquidos imiscíveis: ambos atravessam. Para duas fases líquidas, use o funil de decantação (funil de bromo).')
        if (a.polar.length > 1 || has('petroleo')) return fail('Mistura homogênea não se filtra', 'Líquidos miscíveis formam 1 fase (mistura homogênea) e passam juntos pelo filtro. Para separá-los explore a diferença de pontos de ebulição: destilação fracionada.')
        return fail('Nada para filtrar', 'A filtração separa um sólido insolúvel de um líquido. Esta mistura não tem sólido disperso em líquido.')
      }
      if (!a.hasLiquid) return fail('Falta o líquido', 'A filtração precisa de um líquido para atravessar o papel e arrastar o filtrado. Para mistura de sólidos, procure propriedades como magnetismo (ímã) ou densidade (flotação).')
      const removed = [...retain]
      let items = without(s.items, removed)
      let saltG = s.saltG
      if (excess) saltG = SOLUBILITY
      return {
        ok: true,
        stage: stageOf[tech],
        title: 'Filtração correta!',
        text: `O papel de filtro retém as partículas sólidas insolúveis${excess ? ' (inclusive o NaCl em excesso do corpo de chão)' : ''} e o líquido passa (filtrado).${a.saltDissolved ? ' Atenção: o sal dissolvido continua no filtrado.' : ''}`,
        property: 'Tamanho das partículas: os poros do papel retêm sólidos maiores e deixam passar o líquido e o que está dissolvido.',
        tip: 'O ENEM adora o tratamento de água (ETA): coagulação/floculação, decantação, filtração, cloração e fluoretação. A filtração retém as partículas finas que a decantação deixou passar.',
        next: { items, saltG },
        collected: { label: 'Retido no filtro', items: excess ? [...removed, 'sal'] : removed },
      }
    }

    case 'funil': {
      if (a.polar.length && a.apolar.length) {
        return {
          ok: true,
          stage: stageOf[tech],
          title: 'Decantação líquido-líquido correta!',
          text: 'As duas fases líquidas são imiscíveis: a menos densa (apolar) fica por cima e a mais densa (aquosa) por baixo. Abrindo a torneira, escoa-se a fase inferior e separam-se os líquidos.',
          property: 'Imiscibilidade e diferença de densidade (a fase oleosa, ρ ≈ 0,9 g/mL, flutua sobre a água, ρ = 1,0 g/mL).',
          tip: 'Vazamentos de óleo no mar: o petróleo flutua por ser menos denso e imiscível na água, por isso barreiras de contenção e sucção funcionam na superfície. É tema clássico de FUVEST e UNESP.',
          next: { items: without(s.items, a.apolar), saltG: s.saltG },
          collected: { label: 'Fase apolar escoada', items: a.apolar },
        }
      }
      if (a.polar.length > 1) return fail('Só 1 fase: use outra técnica', 'Água e etanol são miscíveis: formam uma única fase (mistura homogênea). O funil de decantação só separa líquidos imiscíveis (2 fases). Aqui, use destilação fracionada.')
      if (a.hasLiquid && (a.sinking.length || a.floating.length || a.saltExcess)) return fail('Sólido + líquido', 'O funil de decantação é para líquidos imiscíveis. Para separar um sólido de um líquido use filtração, sedimentação ou centrífuga.')
      return fail('Sem fases líquidas imiscíveis', 'O funil de bromo precisa de dois líquidos que não se misturam, como água + óleo ou água + petróleo.')
    }

    case 'sedimentacao': {
      const settle: SubstanceId[] = [...a.sinking]
      if (settle.length === 0 && !a.saltExcess) {
        if (a.floating.length) return fail('A serragem não sedimenta', 'A serragem é menos densa que a água: ela flutua em vez de sedimentar. Nesse caso use flotação (ou catação).')
        if (a.saltDissolved) return fail('Sal dissolvido não sedimenta', 'O sal totalmente dissolvido faz parte da mesma fase do líquido (mistura homogênea) e nunca sedimenta sozinho. Use destilação simples.')
        return fail('Nada para sedimentar', 'A sedimentação separa um sólido mais denso que o líquido. Não há sólido denso disperso nesta mistura.')
      }
      if (!a.hasLiquid) return fail('Falta o líquido', 'A sedimentação (decantação sólido-líquido) precisa de um líquido no qual o sólido possa depositar.')
      const removed = [...settle]
      return {
        ok: true,
        stage: stageOf[tech],
        title: 'Sedimentação correta!',
        text: `O sólido mais denso${a.saltExcess ? ' (inclusive o corpo de chão de NaCl)' : ''} deposita no fundo pela gravidade e o líquido sobrenadante é transferido com cuidado (decantação).`,
        property: 'Densidade: o sólido mais denso que o líquido se deposita no fundo.',
        tip: 'Na estação de tratamento de água, a decantação vem depois da floculação: os flocos de sujeira, mais densos, sedimentam. É o passo lento; a centrífuga faz o mesmo em minutos.',
        next: { items: without(s.items, removed), saltG: a.saltExcess ? SOLUBILITY : s.saltG },
        collected: { label: 'Sedimento', items: a.saltExcess ? [...removed, 'sal'] : removed },
      }
    }

    case 'centrifuga': {
      const settle: SubstanceId[] = [...a.sinking]
      const liquids = a.polar.length && a.apolar.length
      if (settle.length === 0 && !a.saltExcess && !liquids) {
        return fail('A centrífuga não resolve aqui', a.saltDissolved ? 'Sal dissolvido não é retirado pela centrifugação: ele faz parte da fase líquida. Use destilação simples.' : 'A centrífuga acelera a sedimentação de sólidos densos ou de fases imiscíveis. Nesta mistura não há nada com essa característica.')
      }
      const removed = [...settle]
      const toCollect: SubstanceId[] = liquids ? [...removed, ...a.apolar] : removed
      return {
        ok: true,
        stage: stageOf[tech],
        title: 'Centrifugação correta!',
        text: `A rotação cria uma força centrífuga que faz a fase mais densa ir para o fundo do tubo muito mais rápido que na sedimentação comum.${liquids ? ' As fases líquidas também se organizam por densidade.' : ''}`,
        property: 'Densidade, acelerada pela força centrífuga.',
        tip: 'Em exames de sangue, a centrifugação separa as células (mais densas, fundo do tubo) do plasma/soro (sobrenadante). É a mesma ideia da decantação, só que acelerada.',
        next: { items: without(s.items, toCollect), saltG: a.saltExcess ? SOLUBILITY : s.saltG },
        collected: { label: 'Fase densa recolhida', items: a.saltExcess ? [...toCollect, 'sal'] : toCollect },
      }
    }

    case 'ima': {
      if (!has('limalha')) return fail('Nada é atraído pelo ímã', 'Só materiais ferromagnéticos (ferro, cobalto, níquel) são atraídos. Água, areia, sal, óleo, etanol, serragem e petróleo não têm essa propriedade.')
      return {
        ok: true,
        stage: stageOf[tech],
        title: 'Separação magnética correta!',
        text: 'A limalha de ferro é atraída pelo ímã e sai da mistura, sem alterar os outros componentes. A mistura restante segue sem o ferro.',
        property: 'Propriedade magnética: o ferro é ferromagnético.',
        tip: 'Usada na reciclagem: eletroímãs separam sucata de ferro do lixo em usinas. Só Fe, Co e Ni são fortemente atraídos, e alumínio de latas não é.',
        next: { items: without(s.items, ['limalha']), saltG: s.saltG },
        collected: { label: 'Limalha de ferro', items: ['limalha'] },
      }
    }

    case 'flotacao': {
      if (!has('serragem')) return fail('Nada flutua aqui', 'O tanque de flotação separa sólidos de densidades diferentes usando um líquido de densidade intermediária. Nesta mistura não há um sólido menos denso que a água, como a serragem.')
      const warn = a.saltSolid ? ' Atenção: o NaCl que estiver sólido acabaria se dissolvendo na água do tanque.' : ''
      return {
        ok: true,
        stage: stageOf[tech],
        title: 'Flotação correta!',
        text: `A serragem (menos densa que a água) flutua e é recolhida da superfície, enquanto os sólidos mais densos afundam.${warn}`,
        property: 'Densidade: madeira (ρ < 1 g/mL) flutua; areia e ferro (ρ > 1 g/mL) afundam.',
        tip: 'Flotação é usada em mineração para separar minérios e em tratamento de efluentes. Nas provas, cai como “escolha o método pela propriedade física explorada”: aqui, densidade.',
        next: { items: without(s.items, ['serragem']), saltG: s.saltG },
        collected: { label: 'Serragem (sobrenadante)', items: ['serragem'] },
      }
    }

    case 'simples': {
      const onlyWaterLiquid = a.polar.length === 1 && a.polar[0] === 'agua' && a.apolar.length === 0
      if (onlyWaterLiquid && a.saltDissolved) {
        const items = without(s.items, ['agua'])
        return {
          ok: true,
          stage: stageOf[tech],
          title: 'Destilação simples correta!',
          text: 'A água ferve (100 °C), o vapor condensa e é recolhido como destilado. O NaCl, não volátil (PF ≈ 801 °C), fica no balão como resíduo sólido.',
          property: 'Ponto de ebulição: o líquido volátil evapora e o sólido dissolvido permanece.',
          tip: 'Dessalinização da água do mar é destilação: o vapor de água é puro e o sal fica. Regra de prova: sólido dissolvido + líquido → destilação simples; líquidos miscíveis → destilação fracionada.',
          next: { items, saltG: s.saltG },
          collected: { label: 'Água destilada', items: ['agua'] },
        }
      }
      if (a.polar.length > 1) return fail('Miscíveis pedem a coluna', 'Água (PE 100 °C) e etanol (PE 78 °C) formam uma única fase e têm pontos de ebulição próximos. A destilação simples não separa bem: use a destilação fracionada, cuja coluna promove várias condensações e evaporações.')
      if (has('petroleo')) return fail('Petróleo pede fracionada', 'O petróleo tem centenas de hidrocarbonetos com pontos de ebulição próximos e escalonados. Para separar as frações (gasolina, querosene, diesel...) é preciso a destilação fracionada.')
      if (a.polar.length && a.apolar.length) return fail('Antes, separe as fases', 'A mistura é heterogênea (2 fases líquidas). Primeiro separe as fases no funil de decantação; a destilação vem depois, se ainda houver mistura homogênea.')
      if (onlyWaterLiquid) return fail('Sem sólido dissolvido', 'A destilação simples serve para separar um sólido dissolvido de um líquido. Aqui a água está com sólido insolúvel ou pura; use filtração/sedimentação para sólido insolúvel.')
      return fail('Destilação simples: aplicação incorreta', 'A destilação simples é indicada para solução de um sólido dissolvido em líquido (ex.: água + sal), aproveitando a diferença de ponto de ebulição entre o líquido volátil e o soluto.')
    }

    case 'fracionada': {
      if (has('petroleo') && !a.polar.length && !a.apolar.filter((x) => x !== 'petroleo').length) {
        return {
          ok: true,
          stage: stageOf[tech],
          title: 'Destilação fracionada correta!',
          text: 'O petróleo aquecido sobe na torre e as frações condensam em alturas diferentes: gases (GLP) no topo, depois gasolina, querosene, diesel, óleos lubrificantes e, no fundo, o resíduo (asfalto).',
          property: 'Diferença de ponto de ebulição: fração mais leve = menor PE = sai mais acima na coluna.',
          tip: 'O ENEM adora o refino do petróleo: a destilação fracionada separa as frações pela diferença no ponto de ebulição, um processo físico (não é reação química). O craqueamento, sim, é reação.',
          next: { items: without(s.items, ['petroleo']), saltG: s.saltG },
          collected: { label: 'Frações do petróleo', items: ['petroleo'] },
        }
      }
      if (a.polar.includes('agua') && a.polar.includes('etanol') && !a.apolar.length) {
        return {
          ok: true,
          stage: stageOf[tech],
          title: 'Destilação fracionada correta!',
          text: 'O etanol, mais volátil (PE 78 °C), evapora primeiro e condensa no topo da coluna; a água (PE 100 °C) fica no balão.',
          property: 'Diferença de ponto de ebulição entre líquidos miscíveis.',
          tip: 'O álcool etílico comercial não passa de ~96% de pureza porque forma mistura azeotrópica com a água. A destilação fracionada também aparece na fabricação de destilados como a cachaça.',
          next: { items: without(s.items, ['etanol']), saltG: s.saltG },
          collected: { label: 'Etanol (destilado)', items: ['etanol'] },
        }
      }
      if (has('petroleo') && a.polar.length) return fail('Separe as fases antes', 'Petróleo e água formam duas fases (mistura heterogênea). Primeiro use o funil de decantação para retirar o petróleo; só então faz sentido fracionar o petróleo.')
      if (a.saltDissolved && a.polar.length === 1) return fail('Basta a destilação simples', 'Água + sal é uma solução de sólido dissolvido em líquido: a destilação simples resolve (a coluna de fracionamento é para líquidos miscíveis com PEs diferentes).')
      return fail('Destilação fracionada: aplicação incorreta', 'A destilação fracionada separa líquidos miscíveis (mistura homogênea) com pontos de ebulição diferentes, como água + etanol ou as frações do petróleo.')
    }
  }
}
