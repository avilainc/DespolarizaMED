import brazilOutlineRaw from './brazilOutline.json'
import brazilStatesRaw from './brazilStates.json'
import europeAllRaw from './europeAll.json'
import medOutlinesRaw from './medOutlines.json'

// Contorno real do Brasil (Natural Earth 50m, via world-atlas — mesmo
// processo usado pro mapa-múndi da Cartografia), como lista de anéis
// [lon, lat]. Um único contorno atual é usado em todos os períodos —
// o que muda por período é só o rótulo da divisão territorial e os
// pinos dos eventos (ver `division` em BrazilPeriod e `lat/lon` em
// BrazilEvent), não o litoral em si.
export const BRAZIL_OUTLINE = brazilOutlineRaw as [number, number][][]

export type BrazilState = { name: string; sigla: string; centroid: [number, number]; rings: [number, number][][] }
// Estados/DF atuais (dado real, fonte: click_that_hood/IBGE, simplificado).
// Usado pra desenhar a divisão interna do mapa — quais deles aparecem
// (com fronteira própria e rótulo) depende de `StateSet` por período,
// já que vários só existem como estado separado desde 1977/1988.
export const BRAZIL_STATES = brazilStatesRaw as BrazilState[]

export type StateSet = 'historico' | 'com-acre' | 'atual'
// Siglas que ficam "escondidas" (sem contorno/rótulo próprio) em cada
// conjunto — o território delas continua aparecendo como parte do
// contorno geral do Brasil, só não ganha fronteira/nome anacrônico.
export const HIDDEN_STATES: Record<StateSet, string[]> = {
  historico: ['AC', 'RO', 'AP', 'RR', 'TO', 'MS'], // Colônia até República Velha (pré-1930)
  'com-acre': ['RO', 'AP', 'RR', 'TO'], // Era Vargas até Ditadura (Acre é território federal desde 1903, MS desde 1977)
  atual: [], // Nova República: todos os 26 estados + DF
}

export type BrazilEvent = {
  id: string
  label: string
  years: string
  lat: number
  lon: number
  place: string
  leaders: string
  causes: string
  outcome: string
  examTip: string
}

export type BrazilPeriod = {
  id: string
  label: string
  years: string
  division: string
  stateSet: StateSet
  summary: string
  events: BrazilEvent[]
}

export const BRAZIL_PERIODS: BrazilPeriod[] = [
  {
    id: 'colonia', label: 'Brasil Colônia', years: '1500-1822', division: 'Capitanias Hereditárias / Governo-Geral', stateSet: 'historico',
    summary: 'Economia colonial voltada à metrópole (pacto colonial): cana-de-açúcar, mineração e depois algodão/café, com mão de obra escrava.',
    events: [
      {
        id: 'beckman', label: 'Revolta de Beckman', years: '1684', lat: -2.53, lon: -44.3, place: 'São Luís (MA)',
        leaders: 'Irmãos Manuel e Tomás Beckman, à frente de senhores de engenho maranhenses.',
        causes: 'Monopólio comercial da Companhia de Comércio do Maranhão (que não entregava escravizados nem mercadorias combinadas) e a tentativa de proibir a escravização de indígenas pelos jesuítas.',
        outcome: 'Reprimida pela Coroa; os líderes foram presos e executados, mas a Companhia de Comércio acabou extinta.',
        examTip: 'Cai como exemplo de revolta colonial de caráter nativista/elitista — contra o pacto colonial, não contra a escravidão (os revoltosos queriam mais mão de obra escrava, não menos).',
      },
      {
        id: 'inconfidencia', label: 'Inconfidência Mineira', years: '1789', lat: -20.38, lon: -43.5, place: 'Ouro Preto/Vila Rica (MG)',
        leaders: 'Tiradentes, elite mineira endividada (poetas, magistrados, militares).',
        causes: 'Anúncio da "derrama" (cobrança forçada de impostos atrasados sobre o ouro) em meio à decadência da mineração.',
        outcome: 'Delatada antes de eclodir; Tiradentes foi o único executado (enforcado e esquartejado) para servir de exemplo.',
        examTip: 'Movimento separatista de elite, inspirado no Iluminismo e na independência dos EUA — não teve participação popular nem propunha abolir a escravidão.',
      },
    ],
  },
  {
    id: 'primeiro-reinado', label: 'Primeiro Reinado', years: '1822-1831', division: 'Províncias do Império', stateSet: 'historico',
    summary: 'Governo de D. Pedro I: outorga da Constituição de 1824, centralização política e crise financeira/militar (Guerra da Cisplatina).',
    events: [
      {
        id: 'confederacao-equador', label: 'Confederação do Equador', years: '1824', lat: -8.05, lon: -34.9, place: 'Recife (PE)',
        leaders: 'Frei Caneca e lideranças de Pernambuco, Ceará, Paraíba e Rio Grande do Norte.',
        causes: 'Rejeição à Constituição outorgada de 1824 (autoritária e centralizadora) após D. Pedro I dissolver a Assembleia Constituinte.',
        outcome: 'Duramente reprimida; Frei Caneca foi fuzilado e depois esquartejado.',
        examTip: 'Mostra a insatisfação regional com a centralização do poder no Primeiro Reinado — herdeira, em espírito, da Revolução Pernambucana de 1817.',
      },
    ],
  },
  {
    id: 'regencial', label: 'Período Regencial', years: '1831-1840', division: 'Províncias do Império', stateSet: 'historico',
    summary: 'D. Pedro II ainda criança: regentes governam em meio à maior onda de revoltas regionais da história do Brasil, alimentadas pela fragilidade do poder central.',
    events: [
      {
        id: 'cabanagem', label: 'Cabanagem', years: '1835-1840', lat: -1.46, lon: -48.5, place: 'Belém (PA)',
        leaders: 'Cabanos (população pobre, ribeirinhos, indígenas e escravizados) contra a elite branca local.',
        causes: 'Miséria extrema da população do Grão-Pará, exclusão política e abuso de poder de autoridades locais nomeadas pela Regência.',
        outcome: 'A mais sangrenta das revoltas regenciais: cerca de 30-40% da população da província morreu na repressão.',
        examTip: 'Única revolta regencial com forte participação popular/étnica desde o início (indígenas e escravizados) — cobrada por sua dimensão social, não só política.',
      },
      {
        id: 'sabinada', label: 'Sabinada', years: '1837-1838', lat: -12.97, lon: -38.51, place: 'Salvador (BA)',
        leaders: 'Francisco Sabino (médico e jornalista) e classe média baiana.',
        causes: 'Insatisfação política com o governo regencial e desejo de maior autonomia da Bahia (chegou a proclamar república independente por tempo determinado).',
        outcome: 'Reprimida pelo governo central após sitiar Salvador.',
        examTip: 'Exemplo de revolta de caráter separatista/republicano promovida pela classe média urbana, não pelas camadas populares.',
      },
      {
        id: 'balaiada', label: 'Balaiada', years: '1838-1841', lat: -4.5, lon: -44.3, place: 'interior do Maranhão',
        leaders: '"Balaios" (sertanejos pobres, vaqueiros) e, depois, escravizados liderados por Cosme Bento.',
        causes: 'Miséria da população sertaneja do Maranhão e disputas entre elites locais (Bem-te-vis x Cabanos) pelo controle da província.',
        outcome: 'Reprimida por Luís Alves de Lima e Silva, futuro Duque de Caxias.',
        examTip: 'Revolta que começou como disputa de elites e "escapou do controle", ganhando caráter popular — clássica pegadinha de prova.',
      },
      {
        id: 'farroupilha', label: 'Revolução Farroupilha', years: '1835-1845', lat: -30.03, lon: -51.23, place: 'Porto Alegre (RS)',
        leaders: 'Estancieiros gaúchos (Bento Gonçalves, Giuseppe Garibaldi).',
        causes: 'Insatisfação dos criadores de gado gaúchos com a alta tributação sobre o charque, prejudicados pela concorrência do charque platino mais barato.',
        outcome: 'A mais longa revolta regencial (quase 10 anos); chegou a proclamar a República Rio-Grandense, mas terminou com anistia e conciliação.',
        examTip: 'Motivação essencialmente econômica (tarifas alfandegárias), embora seja lembrada como símbolo de identidade regional gaúcha até hoje.',
      },
    ],
  },
  {
    id: 'segundo-reinado', label: 'Segundo Reinado', years: '1840-1889', division: 'Províncias do Império', stateSet: 'historico',
    summary: 'Maioridade de D. Pedro II, expansão cafeeira, Guerra do Paraguai, crise do trabalho escravo e o movimento abolicionista.',
    events: [
      {
        id: 'guerra-paraguai', label: 'Guerra do Paraguai', years: '1864-1870', lat: -22.5, lon: -55.2, place: 'fronteira Sul (MS/RS)',
        leaders: 'Tríplice Aliança (Brasil, Argentina, Uruguai) x Paraguai (Solano López).',
        causes: 'Disputas de fronteira e navegação na Bacia do Prata, além do interesse britânico em conter o Paraguai autônomo.',
        outcome: 'Vitória da Tríplice Aliança; Paraguai perdeu até 60% da população e território — maior guerra internacional da América do Sul.',
        examTip: 'Fortaleceu o Exército brasileiro (que depois derrubaria a Monarquia em 1889) e agravou as dívidas do Império com a Inglaterra.',
      },
      {
        id: 'quebra-quilos', label: 'Quebra-Quilos', years: '1874-1875', lat: -7.22, lon: -35.88, place: 'Campina Grande (PB)',
        leaders: 'População rural pobre do interior de Pernambuco, Paraíba, Alagoas e Rio Grande do Norte.',
        causes: 'Implantação do sistema métrico decimal (novos pesos e medidas) e cobrança de novos impostos, vistos como prejudiciais aos pequenos comerciantes e feirantes.',
        outcome: 'Reprimida; virou símbolo da resistência popular a reformas impostas de cima para baixo sem diálogo.',
        examTip: 'Diferente das revoltas regenciais: não é separatista, é uma revolta de resistência a uma reforma administrativa/tributária concreta.',
      },
    ],
  },
  {
    id: 'republica-velha', label: 'República Velha (Primeira República)', years: '1889-1930', division: 'Estados (política dos governadores)', stateSet: 'historico',
    summary: 'Política do "café com leite" e voto de cabresto, com forte exclusão política e social — que explica a onda de revoltas messiânicas e urbanas do período.',
    events: [
      {
        id: 'canudos', label: 'Guerra de Canudos', years: '1896-1897', lat: -10.25, lon: -39.05, place: 'Canudos (BA)',
        leaders: 'Antônio Conselheiro e sertanejos pobres do arraial de Canudos (BA).',
        causes: 'Miséria e abandono do sertão pelo Estado; caráter messiânico/monarquista atribuído (e exagerado) pela imprensa e pelo governo.',
        outcome: 'Arraial destruído após 4 expedições militares; cerca de 25 mil pessoas morreram.',
        examTip: 'Imortalizada por "Os Sertões" de Euclides da Cunha — cobrada como exemplo de exclusão social do sertão nordestino na Primeira República.',
      },
      {
        id: 'contestado', label: 'Guerra do Contestado', years: '1912-1916', lat: -26.5, lon: -51.4, place: 'divisa PR/SC',
        leaders: 'Sertanejos do Paraná/Santa Catarina, liderados por monges messiânicos (José Maria).',
        causes: 'Disputa de terras entre PR e SC, expulsão de posseiros pela construção da estrada de ferro (Brazil Railway Company) e miséria da população cabocla.',
        outcome: 'Reprimida pelo Exército; milhares de mortos.',
        examTip: 'Junto com Canudos, exemplo clássico de "messianismo" nas provas — misture religiosidade popular + conflito de terra + exclusão social.',
      },
      {
        id: 'revolta-vacina', label: 'Revolta da Vacina', years: '1904', lat: -22.91, lon: -43.17, place: 'Rio de Janeiro (RJ)',
        leaders: 'População pobre do Rio de Janeiro (capital federal).',
        causes: 'Vacinação obrigatória contra a varíola (campanha de Oswaldo Cruz) imposta à força, somada à reforma urbana higienista de Pereira Passos que expulsava os pobres do centro.',
        outcome: 'Revolta popular reprimida; a obrigatoriedade da vacina acabou suspensa, mas a reforma urbana seguiu.',
        examTip: 'Não foi só "contra a vacina": é sobre autoritarismo sanitário e exclusão urbana dos pobres — tema recorrente em redação sobre saúde pública.',
      },
      {
        id: 'revolta-chibata', label: 'Revolta da Chibata', years: '1910', lat: -22.9, lon: -43.15, place: 'Baía de Guanabara, RJ',
        leaders: 'João Cândido ("Almirante Negro") e marinheiros, em sua maioria negros.',
        causes: 'Castigos físicos (açoite/chibata) e condições degradantes enfrentadas pelos marinheiros, muitos deles ex-escravizados ou seus descendentes.',
        outcome: 'Marinheiros conquistaram anistia prometida, mas foi descumprida meses depois com nova repressão violenta.',
        examTip: 'Cobrada como continuidade do racismo institucional após a abolição (1888) dentro das próprias Forças Armadas.',
      },
    ],
  },
  {
    id: 'era-vargas', label: 'Era Vargas', years: '1930-1945', division: 'Estados (interventorias federais)', stateSet: 'com-acre',
    summary: 'Getúlio Vargas no poder por 15 anos: Governo Provisório, Constitucional, Estado Novo (ditadura) — industrialização e legislação trabalhista.',
    events: [
      {
        id: 'revolucao-1930', label: 'Revolução de 1930', years: '1930', lat: -30.03, lon: -51.23, place: 'Porto Alegre (RS)',
        leaders: 'Aliança Liberal (Getúlio Vargas, gaúcho) apoiada por tenentistas e oligarquias dissidentes de MG e PB.',
        causes: 'Quebra do acordo "café com leite" (Washington Luís indicou outro paulista) e a crise de 1929, que atingiu duramente a economia cafeeira.',
        outcome: 'Golpe vitorioso encerra a República Velha e coloca Vargas no poder.',
        examTip: 'Marco de transição, não uma "revolução social" de fato — mudou quem estava no poder, mas manteve estruturas oligárquicas em vários estados.',
      },
      {
        id: 'intentona-comunista', label: 'Intentona Comunista', years: '1935', lat: -8.05, lon: -34.9, place: 'Recife (PE) e Natal (RN)',
        leaders: 'Aliança Nacional Libertadora (ANL) e Luís Carlos Prestes, com apoio da Internacional Comunista.',
        causes: 'Reação de esquerda ao avanço do integralismo e ao autoritarismo crescente de Vargas.',
        outcome: 'Derrotada rapidamente; usada por Vargas como justificativa (o "Plano Cohen", uma farsa) para decretar o Estado Novo em 1937.',
        examTip: 'Cuidado: o "perigo comunista" foi usado propagandisticamente para legitimar a ditadura do Estado Novo — relação causa/pretexto cai bastante.',
      },
    ],
  },
  {
    id: 'democratico', label: 'Período Democrático', years: '1945-1964', division: 'Estados da Federação', stateSet: 'com-acre',
    summary: 'Redemocratização após a queda do Estado Novo: Constituição de 1946, populismo (JK, Jango) e polarização ideológica crescente da Guerra Fria.',
    events: [
      {
        id: 'crise-legalidade', label: 'Campanha da Legalidade', years: '1961', lat: -30.03, lon: -51.23, place: 'Porto Alegre (RS)',
        leaders: 'Leonel Brizola (governador do RS) e o III Exército, em defesa da posse de João Goulart (Jango).',
        causes: 'Ministros militares tentaram impedir a posse de Jango (vice eleito) após a renúncia de Jânio Quadros, alegando seu suposto alinhamento com a esquerda.',
        outcome: 'Jango tomou posse sob regime parlamentarista (poder reduzido), numa solução de compromisso.',
        examTip: 'Mostra como as Forças Armadas já viam Jango com desconfiança antes mesmo de 1964 — antecedente direto do golpe militar.',
      },
    ],
  },
  {
    id: 'ditadura', label: 'Ditadura Militar', years: '1964-1985', division: 'Estados (governadores biônicos)', stateSet: 'com-acre',
    summary: 'Golpe civil-militar de 1964: repressão política, censura, "milagre econômico", atos institucionais (AI-5, 1968) e abertura "lenta e gradual".',
    events: [
      {
        id: 'guerrilha-araguaia', label: 'Guerrilha do Araguaia', years: '1972-1975', lat: -6.5, lon: -48.5, place: 'rio Araguaia (PA/MA/TO)',
        leaders: 'Militantes do PCdoB, na região do rio Araguaia (divisa PA/MA/TO).',
        causes: 'Tentativa de organizar uma guerrilha rural inspirada na Revolução Cubana e chinesa para combater o regime militar.',
        outcome: 'Duramente reprimida em sigilo pelo Exército; até hoje há corpos de guerrilheiros desaparecidos não localizados.',
        examTip: 'Um dos episódios mais graves de violação de direitos humanos da ditadura — tema central da Comissão Nacional da Verdade.',
      },
    ],
  },
  {
    id: 'nova-republica', label: 'Nova República', years: '1985-Atual', division: 'Estados da Federação (26 + DF)', stateSet: 'atual',
    summary: 'Redemocratização: Constituição Cidadã de 1988, estabilização com o Plano Real (1994) e consolidação (com crises) da democracia.',
    events: [
      {
        id: 'diretas-ja', label: 'Diretas Já', years: '1983-1984', lat: -23.55, lon: -46.63, place: 'São Paulo (SP) e Rio de Janeiro (RJ)',
        leaders: 'Movimento social amplo (sindicatos, estudantes, artistas, oposição partidária).',
        causes: 'Demanda popular pelo fim da eleição indireta de presidente, herdada do regime militar.',
        outcome: 'A emenda das Diretas (Dante de Oliveira) foi rejeitada no Congresso — a transição seguiu indireta, elegendo Tancredo Neves.',
        examTip: 'Maior mobilização popular desde 1964, mas que "fracassou" formalmente no Congresso — mostra o caráter negociado/lento da transição brasileira.',
      },
    ],
  },
]

// ---- Europa e Guerras Mundiais ----
export type EuroCountry = { id: string; label: string; x: number; y: number }
export const EURO_COUNTRIES: EuroCountry[] = [
  { id: 'uk', label: 'Reino Unido', x: 90, y: 70 },
  { id: 'franca', label: 'França', x: 110, y: 140 },
  { id: 'alemanha', label: 'Alemanha', x: 210, y: 100 },
  { id: 'austria', label: 'Áustria-Hungria', x: 260, y: 150 },
  { id: 'italia', label: 'Itália', x: 210, y: 220 },
  { id: 'russia', label: 'Rússia / URSS', x: 380, y: 70 },
  { id: 'otomano', label: 'Império Otomano', x: 340, y: 230 },
]

// Mapa da Europa inteira (contorno atual, ~49 países) — usado como pano de
// fundo geográfico contínuo; os países "envolvidos" em cada conflito são
// pintados por cima com a cor do lado, o resto fica neutro. Mesmo processo
// de extração/simplificação do mapa do Brasil e do mapa-múndi.
export type EuropeCountry = { name: string; centroid: [number, number]; rings: [number, number][][] }
export const EUROPE_ALL = europeAllRaw as EuropeCountry[]

// Liga o id curto usado em `Side.countryIds` (histórico, já usado nos
// dados de CONFLICTS) ao nome real do país no dataset do mapa.
export const COUNTRY_ID_TO_NAME: Record<string, string> = {
  uk: 'United Kingdom',
  franca: 'France',
  alemanha: 'Germany',
  austria: 'Austria',
  italia: 'Italy',
  russia: 'Russia',
  otomano: 'Turkey',
}

// Contorno real (atual) do Mediterrâneo oriental — usado como pano de
// fundo geográfico no mapa da Antiguidade Clássica (Grécia/Roma). As
// formas de extensão territorial continuam esquemáticas (círculos/elipse),
// só o litoral de base agora é real em vez de um círculo pontilhado vazio.
export const MED_OUTLINES = medOutlinesRaw as unknown as Record<string, [number, number][][]>

export type ConflictId = 'ww1' | 'entreguerras' | 'ww2'
export type SideCountry = { id: string; flag: string }
export type Side = { label: string; color: string; countries: SideCountry[] }
export type Conflict = {
  id: ConflictId
  label: string
  years: string
  sides: Side[]
  antecedents: string
  sourcesNote: string
  examTip: string
}

// Bandeiras de época (não as atuais) — fonte: Wikimedia Commons, URL
// resolvida via API pra garantir que existe de verdade.
const FLAG = {
  uk: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg',
  franca: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg',
  alemanhaImperio: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Flag_of_Germany_%281867%E2%80%931918%29.svg',
  alemanhaNazista: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Flag_of_Germany_%281935%E2%80%931945%29.svg',
  austriaHungria: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Flag_of_Austria-Hungary_%281867%E2%80%931918%29.svg',
  otomano: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Flag_of_the_Ottoman_Empire_%281844%E2%80%931922%29.svg',
  russiaImperio: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Russia.svg',
  uniaoSovietica: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Flag_of_the_Soviet_Union.svg',
  italiaReino: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Flag_of_Italy_%281861%E2%80%931946%29.svg',
}

export const CONFLICTS: Conflict[] = [
  {
    id: 'ww1', label: 'Primeira Guerra Mundial', years: '1914-1918',
    sides: [
      { label: 'Tríplice Entente', color: '#38bdf8', countries: [{ id: 'uk', flag: FLAG.uk }, { id: 'franca', flag: FLAG.franca }, { id: 'russia', flag: FLAG.russiaImperio }] },
      { label: 'Tríplice Aliança (Impérios Centrais)', color: '#f87171', countries: [{ id: 'alemanha', flag: FLAG.alemanhaImperio }, { id: 'austria', flag: FLAG.austriaHungria }, { id: 'otomano', flag: FLAG.otomano }] },
    ],
    antecedents: 'Imperialismo e neocolonialismo (disputa por colônias na África e Ásia), corrida armamentista, sistema de alianças rígido e nacionalismos exacerbados (pan-eslavismo x pan-germanismo). Estopim: assassinato do arquiduque Francisco Ferdinando em Sarajevo (1914).',
    sourcesNote: 'Analise charges de época sobre a "Europa como um barril de pólvora" e cartazes de recrutamento/propaganda nacionalista dos dois lados.',
    examTip: 'Foi a primeira guerra "total" e de trincheiras (guerra de desgaste) — cobrada por levar ao fim de 4 impérios (Alemão, Austro-Húngaro, Otomano e Russo) e ao Tratado de Versalhes, que humilhou a Alemanha e semeou o revanchismo nazista.',
  },
  {
    id: 'entreguerras', label: 'Entreguerras e Crise de 1929', years: '1919-1939',
    sides: [],
    antecedents: 'Tratado de Versalhes impôs pesadas indenizações à Alemanha, gerando hiperinflação e ressentimento (usados pela propaganda nazista). A quebra da Bolsa de Nova York em 1929 gerou desemprego em massa e crise mundial, fortalecendo discursos totalitários (fascismo na Itália, nazismo na Alemanha, ambos prometendo "ordem" e recuperação econômica).',
    sourcesNote: 'Bom momento para comparar cartazes de propaganda nazifascista (culto ao líder, exaltação da nação/raça) com fotos de filas de desemprego nos EUA da época.',
    examTip: 'A Crise de 1929 é o elo causal entre a Primeira e a Segunda Guerra: sem ela, o discurso nazista de recuperação econômica teria muito menos apelo popular — relação muito cobrada em ENEM/FUVEST.',
  },
  {
    id: 'ww2', label: 'Segunda Guerra Mundial', years: '1939-1945',
    sides: [
      { label: 'Aliados', color: '#38bdf8', countries: [{ id: 'uk', flag: FLAG.uk }, { id: 'franca', flag: FLAG.franca }, { id: 'russia', flag: FLAG.uniaoSovietica }] },
      { label: 'Eixo', color: '#f87171', countries: [{ id: 'alemanha', flag: FLAG.alemanhaNazista }, { id: 'italia', flag: FLAG.italiaReino }] },
    ],
    antecedents: 'Revanchismo alemão contra o Tratado de Versalhes, expansionismo nazista (anexação da Áustria e dos Sudetos, invasão da Polônia em 1939) e política de apaziguamento das potências ocidentais, que tolerou o avanço de Hitler até ser tarde demais.',
    sourcesNote: 'Analise fotos do Holocausto, cartazes de propaganda do Eixo e dos Aliados, e discursos de Hitler/Churchill como fontes primárias de prova.',
    examTip: 'O Japão (fora do mapa da Europa) integra o Eixo pela Guerra do Pacífico — não esqueça de mencionar Pearl Harbor (1941) como o evento que trouxe os EUA para a guerra.',
  },
]

// ---- Antiguidade Clássica ----
export type Civ = 'grecia' | 'roma'
export type ClassicalEra = {
  id: string
  civ: Civ
  label: string
  years: string
  territoryRadius: number
  split?: boolean
  description: string
  citizenshipNote: string
  examTip: string
}

export const CLASSICAL_ERAS: ClassicalEra[] = [
  {
    id: 'pre-homerico', civ: 'grecia', label: 'Pré-Homérico', years: '2000-1200 a.C.', territoryRadius: 20,
    description: 'Civilizações minoica (Creta) e micênica — palácios-fortaleza, escrita Linear B, base dos mitos narrados depois por Homero.',
    citizenshipNote: 'Sociedade palaciana, sem cidadania no sentido político posterior — poder concentrado em reis-sacerdotes (wanax).',
    examTip: 'A queda dos micênicos por volta de 1200 a.C. (possivelmente por invasões dóricas) abre um "vácuo" documental chamado de Idade das Trevas grega.',
  },
  {
    id: 'homerico', civ: 'grecia', label: 'Homérico', years: '1200-800 a.C.', territoryRadius: 22,
    description: 'Período pouco documentado ("Idade das Trevas"), conhecido principalmente pelos poemas de Homero (Ilíada e Odisseia), escritos depois mas ambientados nessa época. Organização em gens (clãs).',
    citizenshipNote: 'Sociedade gentílica, sem escrita própria contemporânea (a escrita micênica se perdeu) — poder de chefes militares/guerreiros.',
    examTip: 'Não confundir com o período em que os poemas foram escritos (Arcaico) — o Homérico é sobre o que os poemas retratam.',
  },
  {
    id: 'arcaico', civ: 'grecia', label: 'Arcaico', years: '800-500 a.C.', territoryRadius: 26,
    description: 'Formação das pólis (cidades-Estado), a Segunda Diáspora Grega (colonização do Mediterrâneo) e o início da escrita alfabética grega.',
    citizenshipNote: 'Cidadania restrita a proprietários de terra do sexo masculino, nascidos livres — exclui mulheres, estrangeiros e escravizados.',
    examTip: 'A colonização arcaica (diferente da moderna) buscava terras e comércio, não dominação política das metrópoles sobre as colônias.',
  },
  {
    id: 'classico', civ: 'grecia', label: 'Clássico', years: '500-338 a.C.', territoryRadius: 30,
    description: 'Apogeu de Atenas (democracia direta de Péricles) e Esparta (oligarquia militarista), Guerras Médicas contra a Pérsia e depois Guerra do Peloponeso entre as duas potências.',
    citizenshipNote: 'Democracia direta ateniense: cidadãos decidiam diretamente na Eclésia — mas eram só ~10-15% da população total (excluídos: mulheres, metecos, escravizados).',
    examTip: 'Comparar com a democracia moderna (representativa, com sufrágio mais amplo) é clássico de prova — a "democracia" ateniense era, na prática, bem restrita.',
  },
  {
    id: 'helenistico', civ: 'grecia', label: 'Helenístico', years: '338-146 a.C.', territoryRadius: 70,
    description: 'Filipe II da Macedônia submete as pólis gregas; seu filho Alexandre, o Grande, conquista da Grécia até a Índia, fundindo cultura grega com culturas orientais (helenismo).',
    citizenshipNote: 'Fim da cidadania de pólis autônoma — súditos de um império multiétnico, com fusão cultural greco-oriental (ex.: Alexandria no Egito).',
    examTip: 'O helenismo espalhou a cultura grega pelo Oriente e influenciou diretamente a cultura romana depois — é a "ponte" entre Grécia Clássica e Roma.',
  },
  {
    id: 'monarquia', civ: 'roma', label: 'Monarquia', years: '753-509 a.C.', territoryRadius: 14,
    description: 'Roma governada por reis (inclusive etruscos); sociedade dividida entre patrícios (elite proprietária) e plebeus.',
    citizenshipNote: 'Cidadania embrionária, fortemente hierarquizada entre patrícios e plebeus — sem participação política plebeia relevante.',
    examTip: 'A expulsão do último rei (Tarquínio, o Soberbo) em 509 a.C. é o marco de fundação da República — cobrada como ruptura com o modelo monárquico.',
  },
  {
    id: 'republica', civ: 'roma', label: 'República', years: '509-27 a.C.', territoryRadius: 55,
    description: 'Expansão pelo Mediterrâneo (Guerras Púnicas contra Cartago), conflito entre patrícios e plebeus (Lei das XII Tábuas, tribunos da plebe) e crise final com as guerras civis (César x Senado).',
    citizenshipNote: 'Cidadania ampliada gradualmente aos plebeus (após a Lei das XII Tábuas, 451 a.C.), mas o poder real seguia concentrado no Senado patrício.',
    examTip: 'A "Luta de Classes" entre patrícios e plebeus é o tema mais cobrado da República — não confundir com luta de classes marxista (é sobre status jurídico/político, não relação com os meios de produção).',
  },
  {
    id: 'imperio', civ: 'roma', label: 'Império (Pax Romana)', years: '27 a.C.-284 d.C.', territoryRadius: 95,
    description: 'Otávio Augusto concentra o poder (fim da República); auge territorial romano, Pax Romana (paz e prosperidade sustentadas pela força militar) e obras de infraestrutura (estradas, aquedutos).',
    citizenshipNote: 'Cidadania romana progressivamente estendida a povos conquistados (culmina no Édito de Caracala, 212 d.C., que a dá a quase todos os homens livres do Império).',
    examTip: '"Pax Romana" não significa ausência de conflito — é paz interna sustentada por forte repressão militar nas fronteiras (limes).',
  },
  {
    id: 'declinio', civ: 'roma', label: 'Declínio e Invasões Bárbaras', years: '284-476 d.C.', territoryRadius: 95, split: true,
    description: 'Diocleciano divide o Império em Ocidente e Oriente (284 d.C.) para facilitar a administração; crise econômica (ruralização, "colonato"), fortalecimento do Cristianismo (religião oficial em 380) e pressão crescente de povos germânicos nas fronteiras.',
    citizenshipNote: 'Ruralização enfraquece a vida urbana e o conceito clássico de cidadania cívica — prenuncia as relações de servidão da futura Idade Média.',
    examTip: 'O Império Romano do Ocidente cai em 476 d.C. (deposição de Rômulo Augusto pelo germânico Odoacro); o do Oriente (Bizantino) sobrevive por mais quase mil anos, até 1453.',
  },
]
