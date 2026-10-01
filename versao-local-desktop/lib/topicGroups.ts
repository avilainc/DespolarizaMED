// Agrupa os `topic` (muito granulares — um por questão, geralmente citando
// a obra/gráfico/fonte específica) em ~15-20 "assuntos" por matéria, pra o
// filtro do /simulado não virar uma lista de dezenas de chips. O `topic`
// original de cada questão continua intacto em lib/examBank.ts e aparece
// normalmente durante a resolução da prova — só o filtro inicial usa o
// grupo compactado.
//
// Cada matéria tem um fallback temático (não um "Outros" genérico) pra
// que todo tópico caia em algum assunto com nome real — Paulo pediu
// explicitamente pra não ter uma categoria "Outros" vaga.

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

type Rule = [RegExp, string]

function classify(rules: Rule[], fallback: string) {
  return (topic: string): string => {
    const t = norm(topic)
    for (const [re, label] of rules) {
      if (re.test(t)) return label
    }
    return fallback
  }
}

const CLASSIFIERS: Record<string, (topic: string) => string> = {
  Português: classify(
    [
      [/cronica/, 'Crônica'],
      [/\bconto\b|fabula/, 'Conto e fábula'],
      [/soneto|poema|poesia|cantiga|versos?\b|estrofe|eu lirico|\brima\b/, 'Poesia e soneto'],
      [/romance|folhetim|machado de assis|graciliano|jose de alencar|sao bernardo|memorias postumas|os sertoes|o cortico|capitu|caio fernando abreu|alice no pais|literatura brasileira|literatura \(|literatura comparada/, 'Romance e ficção brasileira'],
      [/literatura africana|afro-brasileira|mocambicana|pretugues/, 'Literatura africana e afro-brasileira'],
      [/escolas literarias|modernismo|romantismo|arcadismo|parnasianismo|naturalismo|barroco|neoclassicismo|surrealismo|semana de arte moderna|pre-modernismo|tarsila|estetica arcade|movimentos artisticos|contexto historico-literario/, 'Escolas e movimentos literários'],
      [/tirinha|cartum|charge|quadrinhos|novela grafica/, 'Tirinha, cartum e charge'],
      [/\bmeme\b/, 'Meme'],
      [/cancao|musica|letra de musica/, 'Letra de música'],
      [/figura(s)? de linguagem|metafora|metonimia|\bironia\b|paradoxo|antitese|hiperbole|eufemismo|pleonasmo|zeugma|paronomasia/, 'Figuras de linguagem'],
      [/sintaxe|regencia|sujeito|oracao(?:es)?|concordancia|funcao sintatica|objeto direto|pronome relativo|colocacao pronominal|pronome oblique|pronome apassivador|pronomes atonos|\bvoz (ativa|passiva)\b|narrador/, 'Sintaxe e morfossintaxe'],
      [/morfologia|prefixo|derivacao|classe gramatical|formacao de palavras|verbo \(presente/, 'Morfologia'],
      [/coesao|discurso indireto|discurso direto|conectivo|referencia pronominal|deix|catafora|elipse|retomada de termo/, 'Coesão e discurso'],
      [/vocabulario|sinonim|ambiguidade|polissemia|sentido (literal|figurado|conotativo)|campo semantico|antonimia|incompatibilidade semantica|valor semantico|funcoes da linguagem|expressoes idiomaticas|fenomenos linguisticos/, 'Semântica e vocabulário'],
      [/sociolinguistica|variacao|registro linguistico|preconceito linguistico|fonetica|historicidade da lingua/, 'Sociolinguística'],
      [/pontuacao|virgula|aspas/, 'Pontuação'],
      [/ensaio|filosofia|interpretacao filosofica|hannah arendt|argumentacao|sofisma/, 'Ensaio e interpretação filosófica'],
      [/interpretacao|intertextualidade|arte\b|parafrase/, 'Interpretação de texto'],
    ],
    'Interpretação de texto'
  ),

  Inglês: classify(
    [
      [/gramatica|modal|preposicao|tempos verbais|conectivo/, 'Gramática'],
      [/tirinha|comic strip/, 'Tirinha e HQ'],
      [/reading comprehension|leitura e interpretacao/, 'Reading comprehension'],
      [/vocabulario|sinonim|expressao idiomatica|referencia pronominal|substituicao/, 'Vocabulário e referência'],
      [/grafico|infografico|mapa/, 'Leitura de gráfico e mapa'],
      [/letra de musica|musica/, 'Letra de música'],
      [/main (purpose|topic)|proposito|funcao textual|funcao de/, 'Propósito e ideia central do texto'],
    ],
    'Texto e interpretação'
  ),

  História: classify(
    [
      [/brasil colonial|colonizacao|colonial|escravidao|trafico de escraviz|corte portuguesa|fuga da familia real|engenho|brasil holandes/, 'Brasil Colônia e escravidão'],
      [/imperio|abolicao|inconfidencia|confederacao do equador|monarquico|independencia e unidade|lei de terras|expansao cafeeira|historia economica do brasil|formacao da nacao brasileira/, 'Brasil Império'],
      [/republica|era vargas|estado novo|golpe.*1964|ditadura|ai-5|ato institucional|anistia|movimento estudantil|zuzu angel|getulio vargas|eugenia|censura pos-1964|imigracao italiana|historia do trabalho no brasil/, 'República e ditadura militar'],
      [/constituicao|democracia|desigualdade social no brasil|marco temporal|direitos humanos|movimentos sociais em rede|racismo algoritmico|reincidencia carceraria|identidade nacional|comunidade politica e nacionalidade/, 'República e democracia contemporânea'],
      [/grecia|polis|ateni|esparta|peloponeso|socrat|antiguidade classica/, 'Grécia Antiga'],
      [/roma antiga|romana|cicero|lucrecia/, 'Roma Antiga'],
      [/idade media|medieval|feudo|bastilha|cavaleiro|adalberon/, 'Idade Média'],
      [/renascimento|humanismo|iluminismo|revolucao francesa|revolucao americana|absolutismo|bossuet|montesquieu|1492|convergencia do mundo|paz de westfalia|soberania dos estados/, 'Renascimento e Iluminismo'],
      [/guerra fria|guerra ao terror|nuclear|otan|urss|muro de berlim|rearmamento alemao/, 'Guerra Fria e geopolítica militar'],
      [/primeira guerra|segunda guerra|nazis|fascismo|holocaust/, 'Guerras mundiais e totalitarismo'],
      [/africa|colonizacao britanica|imperialismo|descolonizacao|benim|nigeria/, 'África e descolonização'],
      [/america latina|argentina|peronismo|independencias latino|revolucao dos cravos|pan-american/, 'América Latina'],
      [/estados unidos|eua\b|destino manifesto|mccarthy|festa confederada/, 'Estados Unidos'],
      [/genero|feminismo|mulheres|direitos das mulheres/, 'Gênero e movimentos sociais'],
      [/filosofia|etica|sociologia|metodo cientifico|logica|ceticismo|frankfurt|foucault|kuhn|biopolitica|marilena chaui|krenak|memoria historica e silenciamentos/, 'Filosofia e sociologia'],
      [/arte\b|pintura|charge|cartaz|fotografia|exposicao|danca tapuia|samba|sincretismo cultural|historia do circo|poema.*ancestralidade/, 'Arte e cultura visual'],
      [/geopolitica|conflito|fronteira|guerra(?! fria| mundial)|catalunha|separatismo|libano|israel/, 'Geopolítica contemporânea'],
      [/globalizacao|mercosul|omc|comercio|adam smith|dumping|ordem economica mundial|socialismo de mercado|rosa luxemburgo|neoliberal|renacionalizacao/, 'Globalização e economia'],
    ],
    'Filosofia e sociologia'
  ),

  Geografia: classify(
    [
      [/cartografia|escala|mapa|fuso|projecao|sensoriamento remoto/, 'Cartografia e escalas'],
      [/clima|climograma|massas de ar|friagem|evento(s)? climatic|dengue e aquecimento/, 'Climatologia'],
      [/bioma|amazonia|mata atlantica|cerrado|pampa|caatinga|manguezal|desmatamento|sahel|deserto de gobi/, 'Biomas e vegetação'],
      [/tectonica|placas|relevo|geomorfologia|geologia|solo|pedologia|vulcani|sismic|terremoto|deriva continental|escudos cristalinos|camadas sedimentares/, 'Geologia e relevo'],
      [/urbaniza|cidade|metropol|gentrifica|favela|ilha de calor|arquitetura hostil|rede urbana|planejamento territorial|regionalizacao/, 'Urbanização'],
      [/industria|matriz energetica|energia|petroleo|hidrogenio|termeletric|terras raras/, 'Indústria e energia'],
      [/agropecuaria|agronegocio|agraria|pecuaria|cacau|commodities|sistema alimentar global|transgenicos/, 'Geografia agrária'],
      [/populaca|demografia|migra|fecundidade|transicao demografica|idade mediana mundial|refugiados/, 'População e migrações'],
      [/geopolitica|conflito|fronteira|guerra|caucaso|oriente medio|caxemira/, 'Geopolítica'],
      [/globalizacao|bloco economico|mercosul|comercio internacional|opep|uniao europeia|tarifa externa comum|comercio china-africa|lei europeia de cadeias/, 'Globalização e blocos econômicos'],
      [/trabalho|uberiza|mercado de trabalho|desigualdade|renda e analfabetismo|economia solidaria/, 'Trabalho e desigualdade'],
      [/meio ambiente|sustentabilidade|carbono|poluicao|racismo ambiental|conservacao|ia e impacto ambiental|construcao sustentavel|corredor ecologico/, 'Meio ambiente e sustentabilidade'],
      [/hidrografia|rio\b|agua|oceano|mar\b|navega|ventos litoraneos/, 'Hidrografia e oceanos'],
      [/territorio|quilombola|indigena|grilagem/, 'Território e povos tradicionais'],
      [/tragedia de sao sebastiao|incendios no pantanal|movimentos de massa/, 'Desastres e riscos ambientais'],
    ],
    'Meio ambiente e sustentabilidade'
  ),

  Biologia: classify(
    [
      [/genetic|heredograma|cromossom|heranca|dna\b/, 'Genética'],
      [/evolu|darwin|lamarck|especiacao|selecao|convergencia adaptativa|homologia ossea/, 'Evolução'],
      [/ecolog|bioma|manguezal|biodiversidade|cadeia|nicho|populacao|fragmentacao|bioacumulacao|densidade populacional|corais|eutrofizacao/, 'Ecologia'],
      [/fisiologia|hormon|cortisol|circulaca|respirat|digest|nervoso|sensorial|audicao|acomodacao visual|creatina|coagula|anatomia|coracao de vertebrado|fentanil|fibras alimentares/, 'Fisiologia humana'],
      [/vegetal|botanica|fotoperiodismo|fototropismo|geotropismo|reproducao vegetal|comunicacao entre plantas/, 'Botânica e fisiologia vegetal'],
      [/virus|bacteria|parasitolog|amebiase|taenia|schistosoma|trichuris|imunolog|vacina|resistencia|repelentes|virologia/, 'Microbiologia e parasitologia'],
      [/citologia|celula|membrana|transporte ativo|organela|endossimbiose/, 'Citologia'],
      [/taxonomia|classificacao|cladograma|cladistica|marsupiais/, 'Taxonomia e classificação'],
      [/embriolog|meiose|mitose|ciclo celular|ovogenese|metamorfose/, 'Divisão celular e embriologia'],
      [/bioquimica|enzima|fermentaca|vias metabolicas|biotecnologia/, 'Bioquímica'],
      [/ciclo da agua|poluicao atmosferica|anfibios e sensibilidade/, 'Biologia e meio ambiente'],
    ],
    'Biologia e meio ambiente'
  ),

  Química: classify(
    [
      [/estequiometria|mol\b|massa molar|densidade|calculo e proporcao/, 'Estequiometria'],
      [/equilibrio quimico|kps|produto de solubilidade|equilibrio acido-base/, 'Equilíbrio químico'],
      [/cinetica/, 'Cinética química'],
      [/eletroquimica|eletrolise|pilha|oxirred|corrosao|nox|celula a combustivel|bateria/, 'Eletroquímica'],
      [/organica|isomeria|quiralidade|funcoes organicas|acido carboxilico|penicilina|paroxetina|estrutura molecular/, 'Química orgânica'],
      [/termoquimica|calorimetria|entalpia|curva de aquecimento|erupcoes vulcanicas|piroli/, 'Termoquímica'],
      [/gas(es)?|gases ideais|sublimacao/, 'Gases'],
      [/solucoes?|concentracao|solubilidade|diluicao|ringer|separacao de misturas/, 'Soluções'],
      [/atomic|periodica|massa atomica|classificacao periodica|radioativ|decaimento|elementos artificiais|espectrometria/, 'Estrutura atômica e tabela periódica'],
      [/ligacao(?:oes)? quimica|geometria molecular|interacao intermolecular|propriedades coligativas/, 'Ligações químicas'],
      [/fertilizantes|macronutrientes|processo solvay|petroquimica|matriz energetica|combustiveis|mumificacao|formulas quimicas|propriedades da materia|reacao reversivel|reacoes quimicas/, 'Química aplicada e do cotidiano'],
    ],
    'Química aplicada e do cotidiano'
  ),

  Física: classify(
    [
      [/cinematica|velocidade|movimento (circular|uniforme)|queda livre|lancamento|formula 1|grandezas fisicas/, 'Cinemática'],
      [/dinamica|forca|atrito|newton|impulso|quantidade de movimento|centro de massa|equilibrio mecanico/, 'Dinâmica'],
      [/gravitaca|satelite|orbita|rotacao da terra/, 'Gravitação'],
      [/hidrostatica|empuxo|densidade|hidrodinamica/, 'Hidrostática'],
      [/termic|calorimetria|dilatac|termometria|termologia|temperatura|transferencia de calor|ciclo termodinamico/, 'Termologia e calorimetria'],
      [/eletric|eletrodinamica|circuito|corrente|resistor|reostato|potencia eletrica|van de graaff/, 'Eletrodinâmica'],
      [/eletrostatica|campo eletrico|magnetismo|magnetica|bussola|freio magnetico|motor de passo/, 'Eletromagnetismo'],
      [/ondulatoria|onda|som|acustica|efeito doppler|frequencia sonora|pendulo|estroboscopio/, 'Ondulatória e acústica'],
      [/optica|espelho|lente|reflexao|refracao|polarizada/, 'Óptica'],
      [/radioativ|nuclear|fotoeletrico|compton|particulas|fisica moderna|raios x|relatividade|astrofisica/, 'Física moderna e nuclear'],
      [/energia|trabalho|potencia|engrenagens|movimento circular|eficiencia energetica/, 'Energia e trabalho'],
    ],
    'Energia e trabalho'
  ),

  Matemática: classify(
    [
      [/geometria analitica/, 'Geometria analítica'],
      [/geometria espacial|solido|cilindro|piramide|paralelepipedo|cone|volume/, 'Geometria espacial'],
      [/geometria (plana)?|triangulo|hexagono|poligono|quadrilatero|trapezio|angulo/, 'Geometria plana'],
      [/trigonometria/, 'Trigonometria'],
      [/probabilidade/, 'Probabilidade'],
      [/combinatoria|arranjo|principio da casa/, 'Análise combinatória'],
      [/estatistica|media|mediana|grafico/, 'Estatística'],
      [/porcentagem|juros|rentabilidade/, 'Porcentagem e juros'],
      [/funcao (quadratica|afim|do 1|do 2)|parabola/, 'Funções polinomiais'],
      [/funcao (exponencial|logaritmic)|logaritmo|funcoes exponenciais/, 'Funções exponencial e logarítmica'],
      [/progress(a|õ)o|pa e pg/, 'Progressões (PA e PG)'],
      [/sistema linear|sistemas de equacoes|equacao|sistemas lineares/, 'Sistemas e equações'],
      [/razao|proporcao|escala/, 'Razão e proporção'],
      [/conjunto/, 'Conjuntos'],
      [/inequacao/, 'Inequações'],
      [/\bfuncao\b|funcoes\b|polinomio|transformacao de funcoes|otimizacao|taxa de variacao/, 'Funções (geral)'],
      [/fuso(s)? horario|dizima|numeros perfeitos|algoritmo|unidades de armazenamento|cartum matematico|fluxo de carros/, 'Matemática aplicada'],
    ],
    'Matemática aplicada'
  ),
}

export function groupTopic(subject: string, topic: string): string {
  const classifier = CLASSIFIERS[subject]
  return classifier ? classifier(topic) : 'Interpretação de texto'
}
