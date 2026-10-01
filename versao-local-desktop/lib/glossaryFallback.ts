// Mesmo conteúdo seedado em create-tables.sql — usado como fallback
// enquanto o SQL não roda no Supabase, pra já mostrar o glossário
// funcionando. Some sozinho assim que a tabela real tiver dados (ver
// GlossaryPage: só usa isso se a query no Supabase voltar vazia).
export type FallbackTerm = {
  id: string
  term: string
  definition: string
  subject: string | null
  category: 'definicao' | 'pessoa' | 'visual'
  examples: string | null
  image_url: string | null
  extra_info: string | null
}

export const GLOSSARY_FALLBACK: FallbackTerm[] = [
  {
    id: 'fb-celula', term: 'Célula', subject: 'Biologia', category: 'visual',
    definition: 'Unidade estrutural e funcional básica de todos os seres vivos, delimitada por uma membrana plasmática que controla a entrada e saída de substâncias. Pode ser procariótica (sem núcleo individualizado, como as bactérias) ou eucariótica (com núcleo delimitado por carioteca, como nas células animais e vegetais).',
    examples: 'Hemácias, neurônios e células musculares são exemplos de células eucarióticas animais altamente especializadas.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Animal_cell_structure_en.svg',
    extra_info: 'Entender a estrutura celular é a base pra estudar genética, fisiologia e a maioria dos processos metabólicos cobrados no vestibular.',
  },
  {
    id: 'fb-mitocondria', term: 'Mitocôndria', subject: 'Biologia', category: 'visual',
    definition: 'Organela citoplasmática responsável pela respiração celular aeróbica, processo que converte a energia dos nutrientes em ATP. Possui dupla membrana — a interna forma dobras chamadas cristas mitocondriais — e DNA próprio.',
    examples: 'Células com alta demanda energética, como as musculares e os neurônios, têm grande quantidade de mitocôndrias.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Mitochondrion_mini.svg',
    extra_info: 'É na mitocôndria que a maior parte do ATP do corpo é gerada — ligue esse conceito direto com a aula de respiração celular.',
  },
  {
    id: 'fb-mitose', term: 'Mitose', subject: 'Biologia', category: 'definicao',
    definition: 'Divisão celular que origina duas células-filhas geneticamente idênticas à célula-mãe, cada uma com o mesmo número de cromossomos (2n). Ocorre em quatro fases — prófase, metáfase, anáfase e telófase.',
    examples: 'A cicatrização de um corte na pele depende de sucessivas mitoses das células epiteliais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-meiose', term: 'Meiose', subject: 'Biologia', category: 'definicao',
    definition: 'Divisão celular que reduz o número de cromossomos à metade (de 2n para n), originando quatro células geneticamente diferentes entre si. Ocorre na formação dos gametas e é a base da variabilidade genética.',
    examples: 'A produção de espermatozoides e óvulos (gametogênese) depende da meiose.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-fotossintese', term: 'Fotossíntese', subject: 'Biologia', category: 'definicao',
    definition: 'Processo pelo qual organismos clorofilados convertem energia luminosa em energia química, produzindo glicose e oxigênio a partir de gás carbônico e água. Ocorre nos cloroplastos, em fase clara e fase escura (ciclo de Calvin).',
    examples: 'Equação geral: 6CO2 + 6H2O + luz → C6H12O6 + 6O2.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-respiracao', term: 'Respiração celular', subject: 'Biologia', category: 'definicao',
    definition: 'Processo pelo qual as células quebram moléculas orgânicas na presença de oxigênio pra liberar energia em forma de ATP. Ocorre em três etapas: glicólise, ciclo de Krebs e cadeia respiratória.',
    examples: 'Ao contrário da fermentação, a respiração aeróbica libera muito mais energia por molécula de glicose.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-dna', term: 'DNA (Ácido desoxirribonucleico)', subject: 'Biologia', category: 'definicao',
    definition: 'Molécula que armazena a informação genética dos seres vivos, formada por duas fitas antiparalelas em dupla-hélice, unidas por bases nitrogenadas complementares (adenina-timina e citosina-guanina).',
    examples: 'A sequência de bases do DNA determina, via síntese proteica, quais proteínas cada célula produz.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-rna', term: 'RNA (Ácido ribonucleico)', subject: 'Biologia', category: 'definicao',
    definition: 'Molécula derivada do DNA, geralmente em fita simples, que participa da síntese proteica: RNAm (mensageiro), RNAt (transportador) e RNAr (ribossômico).',
    examples: 'Diferente do DNA, o RNA usa uracila no lugar de timina.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-osmose', term: 'Osmose', subject: 'Biologia', category: 'definicao',
    definition: 'Movimento passivo de água através de membrana semipermeável, de um meio hipotônico pra um hipertônico, até equilíbrio. Não gasta energia da célula.',
    examples: 'Uma célula vegetal em água pura incha por osmose; hemácias em soro concentrado murcham pelo mesmo processo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-difusao', term: 'Difusão facilitada', subject: 'Biologia', category: 'definicao',
    definition: 'Transporte passivo de substâncias com auxílio de proteínas carreadoras ou canais proteicos, a favor do gradiente de concentração e sem gasto de energia.',
    examples: 'A entrada de glicose em muitas células depende de transportadores específicos (GLUT).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ribossomo', term: 'Ribossomo', subject: 'Biologia', category: 'definicao',
    definition: 'Organela não membranosa formada por RNA ribossômico e proteínas, responsável pela síntese de proteínas. Pode estar livre no citoplasma ou aderido ao retículo endoplasmático rugoso.',
    examples: 'Células com alta produção de proteínas, como as do pâncreas, têm grande quantidade de ribossomos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-hemacia', term: 'Hemácia (Eritrócito)', subject: 'Biologia', category: 'definicao',
    definition: 'Célula sanguínea anucleada (em mamíferos) responsável pelo transporte de oxigênio, graças à hemoglobina. Produzida na medula óssea vermelha.',
    examples: 'A anemia é caracterizada pela redução do número de hemácias ou de hemoglobina no sangue.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-leucocito', term: 'Leucócito', subject: 'Biologia', category: 'definicao',
    definition: 'Célula sanguínea (glóbulo branco) responsável pela defesa do organismo. Inclui linfócitos, neutrófilos e macrófagos, cada um com função específica na resposta imune.',
    examples: 'Um exame com leucócitos elevados costuma indicar uma infecção em curso.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-abo', term: 'Sistema ABO', subject: 'Biologia', category: 'definicao',
    definition: 'Sistema de tipagem sanguínea determinado pelos antígenos A e B nas hemácias, controlado por três alelos (IA, IB e i). Define os tipos A, B, AB e O.',
    examples: 'O tipo O é "doador universal" porque suas hemácias não têm antígenos A nem B.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-mendel', term: 'Gregor Mendel', subject: 'Biologia', category: 'pessoa',
    definition: 'Monge agostiniano e naturalista austríaco considerado o "pai da Genética". Entre 1856 e 1863, cruzou ervilhas (Pisum sativum) e formulou as Leis de Mendel — base da genética clássica. Seu trabalho só foi reconhecido décadas após sua morte.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Gregor_Mendel_2.jpg/250px-Gregor_Mendel_2.jpg', extra_info: '1822 – 1884',
  },
  {
    id: 'fb-darwin', term: 'Charles Darwin', subject: 'Biologia', category: 'pessoa',
    definition: 'Naturalista britânico que, após viagem no HMS Beagle (com destaque às ilhas Galápagos), desenvolveu a teoria da evolução por seleção natural, publicada em 1859 em "A Origem das Espécies" — base da biologia evolutiva moderna.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Charles_Darwin_seated_crop.jpg', extra_info: '1809 – 1882',
  },
  {
    id: 'fb-homeostase', term: 'Homeostase', subject: 'Biologia', category: 'definicao',
    definition: 'Capacidade dos organismos de manter o equilíbrio do meio interno relativamente constante, mesmo com variações externas, via mecanismos de feedback regulados pelos sistemas nervoso e endócrino.',
    examples: 'A regulação da temperatura corporal em torno de 36,5°C, mesmo em dias muito quentes ou frios.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cariotipo', term: 'Cariótipo', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de cromossomos de uma célula, organizado e fotografado na metáfase, ordenado por tamanho e forma. Usado pra identificar alterações no número ou estrutura dos cromossomos.',
    examples: 'O cariótipo na síndrome de Down mostra 47 cromossomos (trissomia do 21).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-gameta', term: 'Gameta', subject: 'Biologia', category: 'definicao',
    definition: 'Célula reprodutiva haploide (n), produzida por meiose. Nos animais: espermatozoide e óvulo; a união (fecundação) restaura o número diploide (2n).',
    examples: 'Um ser humano tem 46 cromossomos (2n), mas seus gametas têm apenas 23 (n).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-zigoto', term: 'Zigoto', subject: 'Biologia', category: 'definicao',
    definition: 'Célula diploide (2n) resultante da fecundação, união do gameta masculino com o feminino. Primeira célula de um novo indivíduo, que se divide (clivagem) pra formar o embrião.',
    examples: 'Em humanos, o zigoto se forma na trompa uterina e leva de 5 a 7 dias pra se implantar no útero.', image_url: null, extra_info: null,
  },

  // ---- Biologia (bloco 2: genética, ecologia, fisiologia, microbiologia) ----
  {
    id: 'fb-alelo', term: 'Alelo', subject: 'Biologia', category: 'definicao',
    definition: 'Cada uma das formas alternativas de um mesmo gene, localizadas na mesma posição (lócus) em cromossomos homólogos, responsáveis pela variação de características hereditárias.',
    examples: 'O gene da cor da semente de ervilha tem o alelo "amarelo" (dominante) e o alelo "verde" (recessivo).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-genotipo-fenotipo', term: 'Genótipo e Fenótipo', subject: 'Biologia', category: 'definicao',
    definition: 'Genótipo é a constituição genética de um indivíduo (os alelos que ele possui); fenótipo é a característica observável resultante da expressão desse genótipo, somada à influência do ambiente.',
    examples: 'Genótipo "Aa" pode gerar o fenótipo "flor roxa" se A (roxo) for dominante sobre a (branco).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cromossomo', term: 'Cromossomo', subject: 'Biologia', category: 'visual',
    definition: 'Estrutura formada por DNA condensado e proteínas (histonas), visível durante a divisão celular, que carrega a informação genética organizada em genes.',
    examples: 'O ser humano tem 46 cromossomos (23 pares) em suas células somáticas.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Chromosome_structure.png',
    extra_info: 'Diagrama com termos em inglês (telomere, centromere, chromatid), mas a estrutura é a mesma cobrada em genética: telômero, centrômero e cromátide.',
  },
  {
    id: 'fb-1lei-mendel', term: '1ª Lei de Mendel', subject: 'Biologia', category: 'definicao',
    definition: 'Lei da segregação dos fatores: cada característica é determinada por um par de fatores (alelos) que se separam na formação dos gametas, cada gameta recebendo apenas um deles.',
    examples: 'Cruzamento de ervilhas Aa x Aa gera proporção 3:1 (dominante:recessivo) na geração seguinte.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-2lei-mendel', term: '2ª Lei de Mendel', subject: 'Biologia', category: 'definicao',
    definition: 'Lei da segregação independente: características diferentes (em cromossomos distintos) são herdadas de forma independente umas das outras.',
    examples: 'A cor da semente e a textura da semente da ervilha são herdadas independentemente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-heranca-sexo', term: 'Herança ligada ao sexo', subject: 'Biologia', category: 'definicao',
    definition: 'Padrão de herança de genes localizados nos cromossomos sexuais (X ou Y), fazendo a característica se manifestar com frequências diferentes entre homens e mulheres.',
    examples: 'Daltonismo e hemofilia são exemplos clássicos de herança ligada ao cromossomo X, mais comuns em homens.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cadeia-alimentar', term: 'Cadeia Alimentar', subject: 'Biologia', category: 'definicao',
    definition: 'Sequência linear de transferência de energia e matéria entre organismos, começando por produtores, passando por consumidores até os decompositores.',
    examples: 'Capim → gafanhoto → sapo → cobra → gavião.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-nicho-ecologico', term: 'Nicho Ecológico', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de funções, recursos utilizados e relações que uma espécie desempenha dentro de um ecossistema — "a profissão" da espécie, diferente do habitat (o "endereço").',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sucessao-ecologica', term: 'Sucessão Ecológica', subject: 'Biologia', category: 'definicao',
    definition: 'Processo gradual de mudança na composição de espécies de uma comunidade ao longo do tempo, até atingir um estado de equilíbrio relativo (clímax).',
    examples: 'Após um incêndio florestal, gramíneas colonizam primeiro, depois arbustos, até a floresta se reestabelecer.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-carbono', term: 'Ciclo do Carbono', subject: 'Biologia', category: 'definicao',
    definition: 'Circulação do carbono entre atmosfera, seres vivos, solo e oceanos, através de processos como fotossíntese, respiração, decomposição e queima de combustíveis fósseis.',
    examples: 'A fotossíntese remove CO2 da atmosfera; a respiração e a queima de combustíveis o devolvem.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-nitrogenio', term: 'Ciclo do Nitrogênio', subject: 'Biologia', category: 'definicao',
    definition: 'Circulação do nitrogênio entre atmosfera, solo e seres vivos, dependente de bactérias fixadoras (transformam N2 em compostos utilizáveis) e decompositoras.',
    examples: 'Bactérias do gênero Rhizobium fixam nitrogênio nas raízes de leguminosas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-circulatorio', term: 'Sistema Circulatório', subject: 'Biologia', category: 'visual',
    definition: 'Conjunto de coração, vasos sanguíneos e sangue responsável por transportar oxigênio, nutrientes, hormônios e resíduos pelo corpo. No ser humano, é fechado e duplo (circulação pulmonar e sistêmica).',
    examples: 'O coração humano tem 4 câmaras: 2 átrios e 2 ventrículos.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Diagram_of_the_human_heart_%28cropped%29_pt.svg', extra_info: null,
  },
  {
    id: 'fb-sistema-digestorio', term: 'Sistema Digestório', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de órgãos responsáveis por processar o alimento, quebrando-o em nutrientes absorvíveis: boca, esôfago, estômago, intestino delgado, intestino grosso, além de glândulas anexas (fígado, pâncreas).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-nervoso', term: 'Sistema Nervoso', subject: 'Biologia', category: 'definicao',
    definition: 'Sistema formado por encéfalo, medula espinhal e nervos, responsável por captar estímulos, processar informações e comandar respostas do corpo, através de células especializadas: os neurônios.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-endocrino', term: 'Sistema Endócrino (Hormônios)', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de glândulas que produzem hormônios, substâncias químicas liberadas na corrente sanguínea que regulam funções do corpo como crescimento, metabolismo e reprodução.',
    examples: 'A insulina, produzida pelo pâncreas, regula os níveis de glicose no sangue.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-imunologico', term: 'Sistema Imunológico', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de células, tecidos e órgãos que defendem o corpo contra agentes invasores (vírus, bactérias, fungos), incluindo imunidade inata (resposta geral e rápida) e adaptativa (específica, com memória).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-vacina', term: 'Vacina', subject: 'Biologia', category: 'definicao',
    definition: 'Preparado biológico que estimula o sistema imunológico a produzir defesa (anticorpos e memória imunológica) contra um agente infeccioso, sem causar a doença em si.',
    examples: 'Vacinas podem usar o agente enfraquecido/inativado, apenas partes dele, ou instruções genéticas (como as vacinas de mRNA).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-virus', term: 'Vírus', subject: 'Biologia', category: 'visual',
    definition: 'Agente infeccioso microscópico, formado basicamente por material genético (DNA ou RNA) envolto por uma cápsula proteica (capsídeo). Não tem metabolismo próprio — depende de uma célula hospedeira pra se replicar, o que gera debate se são ou não considerados seres vivos.',
    examples: 'HIV, influenza e os coronavírus são exemplos de vírus com envelope (camada lipídica extra ao redor do capsídeo).',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Simple_diagram_of_virus_%28blank%29.svg', extra_info: null,
  },
  {
    id: 'fb-bacteria', term: 'Bactéria', subject: 'Biologia', category: 'definicao',
    definition: 'Organismo unicelular procarioto (sem núcleo individualizado), um dos primeiros tipos de vida a surgir na Terra, podendo ser benéfico (decompositores, flora intestinal) ou causar doenças (patogênico).',
    examples: 'Escherichia coli, presente no intestino humano, e Mycobacterium tuberculosis, causadora da tuberculose.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-biotecnologia', term: 'Biotecnologia', subject: 'Biologia', category: 'definicao',
    definition: 'Uso de organismos vivos ou seus componentes pra desenvolver produtos e tecnologias, incluindo técnicas modernas como CRISPR (edição genética), clonagem e produção de transgênicos.',
    examples: 'Insulina humana produzida por bactérias geneticamente modificadas é um exemplo clássico de biotecnologia aplicada à saúde.', image_url: null, extra_info: null,
  },

  // ---- Química ----
  {
    id: 'fb-atomo', term: 'Átomo', subject: 'Química', category: 'visual',
    definition: 'Menor unidade que constitui a matéria, mantendo as propriedades químicas de um elemento. Formado por um núcleo (prótons e nêutrons) rodeado por elétrons em camadas, segundo o modelo de Bohr.',
    examples: 'O átomo de hidrogênio tem 1 próton e 1 elétron; o de hélio tem 2 prótons, 2 nêutrons e 2 elétrons.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Bohr_atom_model_%28mul%29.svg',
    extra_info: 'O modelo de Bohr, mesmo simplificado, ainda é o mais usado no Ensino Médio pra explicar as ligações químicas.',
  },
  {
    id: 'fb-tabela-periodica', term: 'Tabela Periódica', subject: 'Química', category: 'visual',
    definition: 'Organização de todos os elementos químicos, ordenados por número atômico crescente e agrupados por propriedades semelhantes em períodos (linhas) e famílias (colunas).',
    examples: 'Os gases nobres (última coluna) são os elementos mais estáveis, com pouca tendência a formar ligações.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Periodic_table_simple_en.svg',
    extra_info: 'Elementos da mesma família tendem a ter propriedades parecidas — os metais alcalinos reagem de forma semelhante entre si.',
  },
  {
    id: 'fb-lavoisier', term: 'Antoine Lavoisier', subject: 'Química', category: 'pessoa',
    definition: 'Químico francês considerado o "pai da Química moderna". Formulou a Lei da Conservação das Massas e ajudou a estabelecer o método científico experimental, encerrando a era da alquimia.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Antoine_Lavoisier_by_Jacques-Louis_David_%28cropped%29.jpg', extra_info: '1743 – 1794',
  },
  {
    id: 'fb-mendeleev', term: 'Dmitri Mendeleev', subject: 'Química', category: 'pessoa',
    definition: 'Químico russo que, em 1869, organizou os elementos conhecidos em ordem crescente de massa atômica, criando a base da Tabela Periódica moderna — e previu elementos ainda não descobertos.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Dmitri_Mendeleev.jpg', extra_info: '1834 – 1907',
  },
  {
    id: 'fb-ligacao-ionica', term: 'Ligação iônica', subject: 'Química', category: 'definicao',
    definition: 'Ligação formada pela transferência definitiva de elétrons de um átomo (geralmente metal) para outro (geralmente ametal), gerando íons de cargas opostas que se atraem.',
    examples: 'O cloreto de sódio (NaCl) se forma quando o sódio doa um elétron para o cloro.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ligacao-covalente', term: 'Ligação covalente', subject: 'Química', category: 'definicao',
    definition: 'Ligação em que dois átomos (geralmente ametais) compartilham um ou mais pares de elétrons, em vez de transferi-los completamente.',
    examples: 'A água (H2O) e o gás oxigênio (O2) são formados por ligações covalentes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ligacao-metalica', term: 'Ligação metálica', subject: 'Química', category: 'definicao',
    definition: 'Ligação dos metais, em que os elétrons da última camada ficam livres entre os átomos ("mar de elétrons"), explicando a condutividade elétrica e o brilho metálico.',
    examples: 'O cobre dos fios elétricos conduz corrente graças à liberdade dos elétrons na ligação metálica.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ph', term: 'pH', subject: 'Química', category: 'definicao',
    definition: 'Escala que mede o grau de acidez ou basicidade de uma solução, de 0 a 14. Menor que 7 é ácido, igual a 7 é neutro, maior que 7 é básico.',
    examples: 'O limão tem pH ~2 (ácido); água pura tem pH 7; soda cáustica tem pH ~14.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-acidos', term: 'Ácidos', subject: 'Química', category: 'definicao',
    definition: 'Substâncias que, em solução aquosa, liberam íons H+ como único tipo de cátion. Sabor azedo, conduzem eletricidade em solução.',
    examples: 'Ácido clorídrico (suco gástrico) e ácido acético (vinagre).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-bases', term: 'Bases (Hidróxidos)', subject: 'Química', category: 'definicao',
    definition: 'Substâncias que, em solução aquosa, liberam íons OH- como único tipo de ânion. Sabor amargo, sensação escorregadia ao toque.',
    examples: 'Hidróxido de sódio (soda cáustica) e hidróxido de magnésio (leite de magnésia).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sais', term: 'Sais', subject: 'Química', category: 'definicao',
    definition: 'Compostos formados pela reação entre um ácido e uma base (neutralização), liberando também água.',
    examples: 'O cloreto de sódio (NaCl) é o sal de cozinha.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-oxidos', term: 'Óxidos', subject: 'Química', category: 'definicao',
    definition: 'Compostos binários em que o oxigênio é o elemento mais eletronegativo, ligado a outro elemento.',
    examples: 'Gás carbônico (CO2) e ferrugem (óxido de ferro).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-mol', term: 'Mol', subject: 'Química', category: 'definicao',
    definition: 'Unidade usada pra contar uma quantidade muito grande de partículas. 1 mol equivale a 6,02 × 10²³ partículas — o Número de Avogadro.',
    examples: 'Um mol de átomos de carbono pesa exatamente 12 gramas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-avogadro', term: 'Número de Avogadro', subject: 'Química', category: 'definicao',
    definition: 'Constante que representa a quantidade de partículas em 1 mol de qualquer substância: 6,02 × 10²³.',
    examples: 'Usado pra converter entre mols e número de partículas em cálculos estequiométricos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-isotopos', term: 'Isótopos', subject: 'Química', category: 'definicao',
    definition: 'Átomos do mesmo elemento (mesmo número de prótons) com números diferentes de nêutrons, e portanto massas atômicas diferentes.',
    examples: 'Carbono-12 e carbono-14 são isótopos do carbono; o carbono-14 é usado em datação de fósseis.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-estequiometria', term: 'Estequiometria', subject: 'Química', category: 'definicao',
    definition: 'Estudo das proporções entre reagentes e produtos numa reação química, permitindo calcular quanto de cada substância é consumido ou formado.',
    examples: 'Calcular quantos gramas de água se formam a partir de certa quantidade de hidrogênio e oxigênio.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-solucao', term: 'Solução (Soluto e Solvente)', subject: 'Química', category: 'definicao',
    definition: 'Mistura homogênea entre duas ou mais substâncias: o soluto (dissolvido) e o solvente (que dissolve).',
    examples: 'No soro fisiológico, o sal (soluto) está dissolvido em água (solvente).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-densidade', term: 'Densidade', subject: 'Química', category: 'definicao',
    definition: 'Relação entre a massa de uma substância e o volume que ela ocupa: d = m/V.',
    examples: 'O óleo boia na água porque sua densidade é menor que a da água.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-entalpia', term: 'Entalpia (reação exo/endotérmica)', subject: 'Química', category: 'definicao',
    definition: 'Energia associada a uma substância ou sistema. Reação exotérmica libera calor; endotérmica absorve calor do ambiente.',
    examples: 'A combustão é sempre exotérmica; o derretimento do gelo é endotérmico.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-eletroquimica', term: 'Eletroquímica (Pilha)', subject: 'Química', category: 'definicao',
    definition: 'Estuda a relação entre reações químicas e corrente elétrica. Uma pilha transforma energia de uma reação de oxirredução espontânea em energia elétrica.',
    examples: 'As pilhas de controle remoto funcionam com base em princípios de eletroquímica.', image_url: null, extra_info: null,
  },

  // ---- Química (bloco 2: orgânica, radioatividade, cinética, redox) ----
  {
    id: 'fb-hidrocarbonetos', term: 'Hidrocarbonetos', subject: 'Química', category: 'definicao',
    definition: 'Compostos orgânicos formados exclusivamente por carbono e hidrogênio, a base da química orgânica e dos combustíveis fósseis.',
    examples: 'Metano (CH4), o mais simples dos hidrocarbonetos, e a gasolina (mistura de hidrocarbonetos).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-alcool', term: 'Álcool (Função Orgânica)', subject: 'Química', category: 'definicao',
    definition: 'Função orgânica caracterizada pela presença do grupo hidroxila (-OH) ligado a um carbono saturado.',
    examples: 'Etanol (CH3-CH2-OH), usado como combustível e em bebidas alcoólicas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-acido-carboxilico', term: 'Ácido Carboxílico', subject: 'Química', category: 'definicao',
    definition: 'Função orgânica caracterizada pelo grupo carboxila (-COOH), responsável pelo caráter ácido de muitos compostos orgânicos.',
    examples: 'Ácido acético (vinagre) e ácido cítrico (frutas cítricas) são ácidos carboxílicos comuns.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-isomeria', term: 'Isomeria', subject: 'Química', category: 'definicao',
    definition: 'Fenômeno em que dois ou mais compostos têm a mesma fórmula molecular, mas estruturas (e propriedades) diferentes.',
    examples: 'Álcool etílico e éter dimetílico têm a mesma fórmula (C2H6O) mas estruturas completamente diferentes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cadeia-carbonica', term: 'Cadeia Carbônica', subject: 'Química', category: 'definicao',
    definition: 'Sequência de átomos de carbono ligados entre si numa molécula orgânica, podendo ser classificada como aberta ou fechada, normal ou ramificada, saturada ou insaturada.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-polimeros', term: 'Polímeros', subject: 'Química', category: 'definicao',
    definition: 'Macromoléculas formadas pela repetição de unidades menores (monômeros) ligadas quimicamente, presentes em plásticos e também em moléculas biológicas.',
    examples: 'O polietileno (usado em sacolas plásticas) e o DNA (um polímero de nucleotídeos) são exemplos de polímeros.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-radioatividade', term: 'Radioatividade', subject: 'Química', category: 'definicao',
    definition: 'Fenômeno em que núcleos atômicos instáveis emitem radiação (partículas alfa, beta ou raios gama) espontaneamente, transformando-se em outros elementos.',
    examples: 'O urânio-235, usado em usinas nucleares, é um elemento radioativo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-marie-curie', term: 'Marie Curie', subject: 'Química', category: 'pessoa',
    definition: 'Física e química polonesa-francesa, pioneira no estudo da radioatividade (termo que ela cunhou). Única pessoa a ganhar Prêmio Nobel em duas ciências diferentes: Física (1903) e Química (1911).',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Marie_Curie_c1920.jpg', extra_info: '1867 – 1934',
  },
  {
    id: 'fb-eletronegatividade', term: 'Eletronegatividade', subject: 'Química', category: 'definicao',
    definition: 'Capacidade que um átomo tem de atrair elétrons pra si numa ligação química. Aumenta da esquerda pra direita e de baixo pra cima na tabela periódica.',
    examples: 'O flúor é o elemento mais eletronegativo da tabela periódica.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-energia-ionizacao', term: 'Energia de Ionização', subject: 'Química', category: 'definicao',
    definition: 'Energia mínima necessária pra remover um elétron de um átomo neutro no estado gasoso, transformando-o num íon positivo.',
    examples: 'Gases nobres têm alta energia de ionização, por já terem a camada de valência completa.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-raio-atomico', term: 'Raio Atômico', subject: 'Química', category: 'definicao',
    definition: 'Medida aproximada do tamanho de um átomo, geralmente a distância do núcleo até a camada eletrônica mais externa. Aumenta de cima pra baixo e da direita pra esquerda na tabela periódica.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pontes-hidrogenio', term: 'Pontes de Hidrogênio', subject: 'Química', category: 'definicao',
    definition: 'Tipo de força intermolecular forte que ocorre quando o hidrogênio está ligado a átomos muito eletronegativos (flúor, oxigênio ou nitrogênio).',
    examples: 'As pontes de hidrogênio entre moléculas de água explicam seu alto ponto de ebulição.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-van-der-waals', term: 'Forças de Van der Waals', subject: 'Química', category: 'definicao',
    definition: 'Forças intermoleculares fracas, presentes em todas as substâncias, resultantes de atrações elétricas temporárias entre moléculas.',
    examples: 'É por causa dessas forças que gases nobres conseguem se liquefazer em temperaturas muito baixas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-catalisador', term: 'Catalisador', subject: 'Química', category: 'definicao',
    definition: 'Substância que aumenta a velocidade de uma reação química sem ser consumida no processo, diminuindo a energia de ativação necessária.',
    examples: 'Catalisadores automotivos reduzem a emissão de gases poluentes dos escapamentos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cinetica-quimica', term: 'Velocidade de Reação (Cinética Química)', subject: 'Química', category: 'definicao',
    definition: 'Ramo da química que estuda a rapidez com que uma reação ocorre e os fatores que a influenciam: concentração, temperatura, superfície de contato e catalisadores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-equilibrio-quimico', term: 'Equilíbrio Químico', subject: 'Química', category: 'definicao',
    definition: 'Estado de uma reação reversível em que as velocidades das reações direta e inversa se igualam, fazendo as concentrações dos reagentes e produtos permanecerem constantes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-redox', term: 'Reações de Oxirredução (Redox)', subject: 'Química', category: 'definicao',
    definition: 'Reações em que há transferência de elétrons entre espécies químicas: uma sofre oxidação (perde elétrons) e outra sofre redução (ganha elétrons).',
    examples: 'A ferrugem é resultado da oxidação do ferro em contato com oxigênio e umidade.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-nox', term: 'Nox (Número de Oxidação)', subject: 'Química', category: 'definicao',
    definition: 'Carga elétrica que um átomo assumiria se todas as ligações da molécula fossem consideradas iônicas — usado pra identificar oxidação e redução numa reação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-conservacao-massas', term: 'Lei da Conservação das Massas', subject: 'Química', category: 'definicao',
    definition: 'Lei de Lavoisier: "Na natureza nada se cria, nada se perde, tudo se transforma" — a massa total dos reagentes é igual à massa total dos produtos numa reação química em sistema fechado.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-alotropia', term: 'Alotropia', subject: 'Química', category: 'definicao',
    definition: 'Fenômeno em que um mesmo elemento químico forma substâncias simples diferentes, com propriedades distintas, devido à organização diferente dos átomos.',
    examples: 'O carbono forma grafite (macio, condutor) e diamante (duríssimo, isolante) — dois alótropos do mesmo elemento.', image_url: null, extra_info: null,
  },

  // ---- Física ----
  {
    id: 'fb-newton', term: 'Isaac Newton', subject: 'Física', category: 'pessoa',
    definition: 'Físico e matemático inglês considerado um dos maiores cientistas da história. Formulou as três leis do movimento e a Lei da Gravitação Universal, base da mecânica clássica.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Sir_Isaac_Newton_by_Sir_Godfrey_Kneller%2C_Bt_%28cropped%29.jpg', extra_info: '1643 – 1727',
  },
  {
    id: 'fb-einstein', term: 'Albert Einstein', subject: 'Física', category: 'pessoa',
    definition: 'Físico alemão que revolucionou a física no século 20 com a Teoria da Relatividade, mudando a forma como entendemos espaço, tempo e gravidade. Nobel de Física em 1921.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg', extra_info: '1879 – 1955',
  },
  {
    id: 'fb-circuito', term: 'Circuito elétrico', subject: 'Física', category: 'visual',
    definition: 'Caminho fechado por onde a corrente elétrica circula: fonte de energia (pilha), condutores (fios) e receptores (lâmpada), podendo ter um interruptor.',
    examples: 'Uma lanterna simples é um circuito: pilha + fio + lâmpada + interruptor.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Simple-electric-circuit.svg',
    extra_info: 'Entender circuitos simples é a base pra estudar associação de resistores em série e em paralelo.',
  },
  {
    id: 'fb-mu', term: 'Movimento Uniforme (MU)', subject: 'Física', category: 'definicao',
    definition: 'Movimento com velocidade constante (aceleração zero). Posição varia linearmente com o tempo: S = S0 + v.t.',
    examples: 'Um carro a 80 km/h constantes numa estrada reta.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-muv', term: 'Movimento Uniformemente Variado (MUV)', subject: 'Física', category: 'definicao',
    definition: 'Movimento com aceleração constante e diferente de zero: S = S0 + v0.t + (a.t²)/2.',
    examples: 'Um objeto em queda livre tem MUV, com aceleração ~10 m/s².', image_url: null, extra_info: null,
  },
  {
    id: 'fb-1lei', term: '1ª Lei de Newton (Inércia)', subject: 'Física', category: 'definicao',
    definition: 'Todo corpo tende a permanecer em repouso ou em movimento retilíneo uniforme, a menos que uma força externa atue sobre ele.',
    examples: 'Ao frear bruscamente, os passageiros são jogados pra frente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-2lei', term: '2ª Lei de Newton', subject: 'Física', category: 'definicao',
    definition: 'A força resultante sobre um corpo é igual ao produto de sua massa pela aceleração: F = m . a.',
    examples: 'Quanto maior a massa, maior a força pra gerar a mesma aceleração.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-3lei', term: '3ª Lei de Newton (Ação e Reação)', subject: 'Física', category: 'definicao',
    definition: 'Para toda força de ação, existe uma força de reação de mesma intensidade e direção, mas sentido oposto.',
    examples: 'Ao nadar, você empurra a água pra trás e ela te empurra pra frente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ecinetica', term: 'Energia cinética', subject: 'Física', category: 'definicao',
    definition: 'Energia associada ao movimento de um corpo: Ec = (m . v²) / 2.',
    examples: 'Um carro em alta velocidade tem mais energia cinética que parado.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-epotencial', term: 'Energia potencial gravitacional', subject: 'Física', category: 'definicao',
    definition: 'Energia armazenada por um corpo devido à sua altura em relação a um referencial: Ep = m . g . h.',
    examples: 'Uma pedra no topo de um penhasco tem energia potencial, que vira cinética ao cair.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-conservacao-energia', term: 'Conservação da Energia Mecânica', subject: 'Física', category: 'definicao',
    definition: 'Sem forças dissipativas (como atrito), a soma de energia cinética e potencial permanece constante — a energia se transforma, não se perde.',
    examples: 'Num pêndulo ideal, a energia alterna entre cinética e potencial.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-trabalho', term: 'Trabalho (Física)', subject: 'Física', category: 'definicao',
    definition: 'Energia transferida por uma força ao deslocar um corpo: W = F . d . cos(θ).',
    examples: 'Empurrar uma caixa e movê-la realiza trabalho; só segurá-la parada, não.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-potencia', term: 'Potência', subject: 'Física', category: 'definicao',
    definition: 'Mede a rapidez de realizar um trabalho ou transferir energia: P = W / t. Medida em watts.',
    examples: 'Uma lâmpada de maior potência realiza o mesmo trabalho mais rápido (ou gasta mais energia por segundo).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-calor-temp', term: 'Calor e Temperatura', subject: 'Física', category: 'definicao',
    definition: 'Temperatura mede a agitação das partículas; calor é a energia térmica transferida entre corpos de temperaturas diferentes, do mais quente pro mais frio.',
    examples: 'O café quente perde calor para o ambiente até o equilíbrio térmico.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-dilatacao', term: 'Dilatação térmica', subject: 'Física', category: 'definicao',
    definition: 'Aumento das dimensões de um material quando sua temperatura sobe, pela maior agitação das partículas.',
    examples: 'Trilhos de trem têm espaços pra permitir a dilatação em dias quentes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ohm', term: 'Lei de Ohm', subject: 'Física', category: 'definicao',
    definition: 'Relaciona tensão (U), corrente (i) e resistência (R): U = R . i.',
    examples: 'Mais resistência no chuveiro elétrico aquece mais a água, mas reduz a corrente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ondas', term: 'Ondas', subject: 'Física', category: 'definicao',
    definition: 'Perturbações que propagam energia sem transportar matéria. Mecânicas precisam de meio (som); eletromagnéticas não (luz).',
    examples: 'O som não se propaga no vácuo; a luz do Sol sim.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-doppler', term: 'Efeito Doppler', subject: 'Física', category: 'definicao',
    definition: 'Mudança aparente na frequência de uma onda percebida por causa do movimento relativo entre fonte e observador.',
    examples: 'A sirene de uma ambulância parece mais aguda se aproximando e mais grave se afastando.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-reflexao-refracao', term: 'Reflexão e Refração da luz', subject: 'Física', category: 'definicao',
    definition: 'Reflexão é o retorno da luz numa superfície; refração é a mudança de direção da luz ao mudar de meio (ar pra água, por exemplo).',
    examples: 'Um lápis parece "quebrado" dentro de um copo de água por refração.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-empuxo', term: 'Empuxo (Princípio de Arquimedes)', subject: 'Física', category: 'definicao',
    definition: 'Força de baixo para cima que um fluido exerce sobre um corpo imerso, igual ao peso do volume de fluido deslocado.',
    examples: 'Um navio de aço flutua porque o empuxo da água iguala seu peso.', image_url: null, extra_info: null,
  },

  // ---- Física (bloco 2: gravitação, eletromagnetismo, termodinâmica, quântica) ----
  {
    id: 'fb-gravitacao-universal', term: 'Lei da Gravitação Universal', subject: 'Física', category: 'definicao',
    definition: 'Lei formulada por Newton segundo a qual todo corpo com massa atrai qualquer outro corpo com massa, com força proporcional ao produto das massas e inversamente proporcional ao quadrado da distância entre eles.',
    examples: 'É essa lei que explica tanto a queda de uma maçã quanto a órbita dos planetas ao redor do Sol.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-impulso-momentum', term: 'Impulso e Quantidade de Movimento', subject: 'Física', category: 'definicao',
    definition: 'Quantidade de movimento (momentum) é o produto da massa pela velocidade de um corpo; impulso é a variação dessa quantidade, causada por uma força atuando durante um intervalo de tempo.',
    examples: 'Um airbag aumenta o tempo de colisão, reduzindo a força do impacto sobre o corpo pra um mesmo impulso.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-colisoes', term: 'Colisões Mecânicas', subject: 'Física', category: 'definicao',
    definition: 'Choques entre corpos, classificados em elásticos (conservam energia cinética total), inelásticos (parte da energia se transforma em calor/deformação) e perfeitamente inelásticos (corpos ficam grudados após o choque).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pressao-hidrostatica', term: 'Pressão Hidrostática (Princípio de Pascal)', subject: 'Física', category: 'definicao',
    definition: 'Pressão exercida por um fluido em repouso, que aumenta com a profundidade. O Princípio de Pascal diz que uma pressão aplicada a um fluido em um recipiente fechado se transmite integralmente a todos os pontos do fluido.',
    examples: 'É o princípio usado em elevadores e freios hidráulicos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-lentes', term: 'Lentes (Convergentes e Divergentes)', subject: 'Física', category: 'definicao',
    definition: 'Objetos transparentes que desviam raios de luz por refração. Lentes convergentes concentram os raios num ponto (usadas pra corrigir hipermetropia); divergentes espalham os raios (usadas pra corrigir miopia).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-espelhos-esfericos', term: 'Espelhos Esféricos', subject: 'Física', category: 'definicao',
    definition: 'Superfícies refletoras curvas, classificadas em côncavos (refletem pro lado interno da curva, usados em faróis e telescópios) e convexos (refletem pro lado externo, usados em espelhos retrovisores por ampliarem o campo de visão).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-galileu', term: 'Galileu Galilei', subject: 'Física', category: 'pessoa',
    definition: 'Físico, matemático e astrônomo italiano, considerado o "pai da ciência moderna" por defender o método experimental. Aperfeiçoou o telescópio e defendeu o heliocentrismo, o que o colocou em conflito com a Igreja Católica.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg', extra_info: '1564 – 1642',
  },
  {
    id: 'fb-faraday', term: 'Michael Faraday', subject: 'Física', category: 'pessoa',
    definition: 'Físico e químico inglês, um dos maiores cientistas experimentais da história, responsável por descobertas fundamentais em eletromagnetismo, incluindo a indução eletromagnética — base dos geradores elétricos modernos.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Michael_Faraday.jpg', extra_info: '1791 – 1867',
  },
  {
    id: 'fb-campo-eletrico', term: 'Campo Elétrico', subject: 'Física', category: 'definicao',
    definition: 'Região do espaço ao redor de uma carga elétrica onde outra carga sofre uma força elétrica. Representado por linhas de campo que saem de cargas positivas e entram em cargas negativas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-campo-magnetico', term: 'Campo Magnético', subject: 'Física', category: 'definicao',
    definition: 'Região do espaço ao redor de um ímã ou corrente elétrica onde outras cargas ou ímãs sofrem força magnética. Representado por linhas de campo que saem do polo norte e entram no polo sul.',
    examples: 'A bússola funciona porque sua agulha se alinha ao campo magnético terrestre.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-inducao-eletromagnetica', term: 'Indução Eletromagnética', subject: 'Física', category: 'definicao',
    definition: 'Fenômeno descoberto por Faraday em que a variação de um campo magnético através de um circuito gera uma corrente elétrica induzida — princípio por trás de geradores e transformadores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-corrente-ac-dc', term: 'Corrente Alternada e Contínua', subject: 'Física', category: 'definicao',
    definition: 'Corrente contínua (CC) flui sempre no mesmo sentido (como em pilhas); corrente alternada (CA) inverte o sentido periodicamente (como a energia da rede elétrica residencial).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-resistores', term: 'Resistores em Série e Paralelo', subject: 'Física', category: 'definicao',
    definition: 'Em série, os resistores formam um único caminho pra corrente e suas resistências se somam; em paralelo, formam caminhos alternativos e a resistência equivalente diminui.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-leis-termodinamica', term: 'Leis da Termodinâmica', subject: 'Física', category: 'definicao',
    definition: 'Conjunto de leis que regem a energia térmica: a 1ª Lei trata da conservação de energia (a energia não se perde, se transforma); a 2ª Lei estabelece que a entropia (desordem) do universo tende sempre a aumentar.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-maquinas-termicas', term: 'Máquinas Térmicas', subject: 'Física', category: 'definicao',
    definition: 'Dispositivos que convertem energia térmica em trabalho mecânico, através de ciclos de expansão e compressão de um fluido, nunca com 100% de eficiência (parte da energia sempre se perde como calor).',
    examples: 'O motor a combustão de um carro é um exemplo de máquina térmica.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-efeito-fotoeletrico', term: 'Efeito Fotoelétrico', subject: 'Física', category: 'definicao',
    definition: 'Fenômeno em que elétrons são ejetados de um material quando exposto à luz, explicado por Einstein ao propor que a luz se comporta como pacotes de energia (fótons) — descoberta que lhe rendeu o Prêmio Nobel de Física.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fisica-quantica', term: 'Física Quântica', subject: 'Física', category: 'definicao',
    definition: 'Ramo da física que estuda o comportamento da matéria e energia em escala atômica e subatômica, onde partículas podem se comportar como onda e partícula ao mesmo tempo (dualidade onda-partícula).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-relatividade', term: 'Teoria da Relatividade', subject: 'Física', category: 'definicao',
    definition: 'Teoria de Einstein dividida em restrita (relaciona espaço, tempo e velocidade da luz, com a famosa equação E=mc²) e geral (descreve a gravidade como uma curvatura do espaço-tempo causada pela massa).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mcu', term: 'Movimento Circular Uniforme (MCU)', subject: 'Física', category: 'definicao',
    definition: 'Movimento em trajetória circular com velocidade escalar constante, mas direção sempre mudando — por isso existe aceleração centrípeta, direcionada pro centro da trajetória.',
    examples: 'As pás de um ventilador em velocidade constante descrevem um MCU.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-pressao-atmosferica', term: 'Pressão Atmosférica', subject: 'Física', category: 'definicao',
    definition: 'Peso da coluna de ar da atmosfera exercido sobre a superfície terrestre, que diminui com o aumento da altitude.',
    examples: 'É por isso que a água ferve numa temperatura mais baixa em altitudes elevadas, como em Machu Picchu.', image_url: null, extra_info: null,
  },

  // ---- Matemática ----
  {
    id: 'fb-pitagoras', term: 'Pitágoras', subject: 'Matemática', category: 'pessoa',
    definition: 'Filósofo e matemático grego (século 6 a.C.), fundador de uma escola filosófica-matemática. Mais conhecido pelo Teorema de Pitágoras, formalizado e demonstrado por sua escola.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/3_Pythagoras.jpg', extra_info: 'Cerca de 570 a.C. – 495 a.C.',
  },
  {
    id: 'fb-teorema-pitagoras', term: 'Teorema de Pitágoras', subject: 'Matemática', category: 'definicao',
    definition: 'Em todo triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos: a² = b² + c².',
    examples: 'Catetos 3 e 4 → hipotenusa 5, pois 9 + 16 = 25 = 5².', image_url: null, extra_info: null,
  },
  {
    id: 'fb-circulo-trig', term: 'Círculo Trigonométrico', subject: 'Matemática', category: 'visual',
    definition: 'Circunferência de raio 1 centrada na origem, usada pra representar seno, cosseno e tangente de qualquer ângulo, de 0° a 360°.',
    examples: 'No primeiro quadrante (0° a 90°), seno e cosseno são positivos.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/C%C3%ADrculo_trigonom%C3%A9trico.svg',
    extra_info: 'Ferramenta pra visualizar em qual quadrante um ângulo está e o sinal do seno/cosseno.',
  },
  {
    id: 'fb-funcao-1grau', term: 'Função do 1º grau', subject: 'Matemática', category: 'definicao',
    definition: 'Função no formato f(x) = ax + b, com a≠0, cujo gráfico é sempre uma reta.',
    examples: 'f(x) = 2x + 3: quando x=0, f(x)=3.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcao-2grau', term: 'Função do 2º grau', subject: 'Matemática', category: 'definicao',
    definition: 'Função no formato f(x) = ax² + bx + c, com a≠0, cujo gráfico é uma parábola.',
    examples: 'f(x) = x² - 4 tem raízes em x=2 e x=-2.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-bhaskara', term: 'Fórmula de Bhaskara', subject: 'Matemática', category: 'definicao',
    definition: 'Fórmula pra achar as raízes de uma equação do 2º grau: x = (-b ± √(b²-4ac)) / 2a.',
    examples: 'Se o discriminante (Δ) é negativo, a equação não tem raízes reais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-pa', term: 'Progressão Aritmética (PA)', subject: 'Matemática', category: 'definicao',
    definition: 'Sequência em que cada termo é obtido somando um valor constante (razão) ao anterior.',
    examples: '2, 5, 8, 11... é uma PA de razão 3.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-pg', term: 'Progressão Geométrica (PG)', subject: 'Matemática', category: 'definicao',
    definition: 'Sequência em que cada termo é obtido multiplicando o anterior por um valor constante (razão).',
    examples: '2, 6, 18, 54... é uma PG de razão 3.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-seno-cosseno', term: 'Seno, Cosseno e Tangente', subject: 'Matemática', category: 'definicao',
    definition: 'Razões trigonométricas num triângulo retângulo: seno = oposto/hipotenusa; cosseno = adjacente/hipotenusa; tangente = oposto/adjacente.',
    examples: 'Num ângulo de 30°, o seno vale 0,5.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-logaritmo', term: 'Logaritmo', subject: 'Matemática', category: 'definicao',
    definition: 'Operação inversa da potenciação: log_a b é o expoente ao qual se eleva a pra obter b.',
    examples: 'log₂ 8 = 3, porque 2³ = 8.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-porcentagem', term: 'Porcentagem', subject: 'Matemática', category: 'definicao',
    definition: 'Forma de expressar uma razão tendo 100 como denominador ("por cento").',
    examples: '50% de 200 = 50/100 × 200 = 100.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-regra-tres', term: 'Regra de três', subject: 'Matemática', category: 'definicao',
    definition: 'Método pra resolver problemas com grandezas proporcionais, relacionando duas razões numa proporção.',
    examples: '3 operários fazem em 12 dias; 6 operários fazem em 6 dias (inversa).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-juros-simples', term: 'Juros simples', subject: 'Matemática', category: 'definicao',
    definition: 'Juros calculados sempre sobre o capital inicial: J = C . i . t.',
    examples: 'R$1000 a 2% ao mês por 3 meses: J = 1000 × 0,02 × 3 = R$60.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-juros-compostos', term: 'Juros compostos', subject: 'Matemática', category: 'definicao',
    definition: 'Juros calculados sobre o capital acumulado (crescimento exponencial): M = C . (1+i)^t.',
    examples: 'Investimentos e financiamentos geralmente usam juros compostos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-probabilidade', term: 'Probabilidade', subject: 'Matemática', category: 'definicao',
    definition: 'Medida da chance de um evento ocorrer: P = casos favoráveis / casos possíveis.',
    examples: 'Chance de tirar par num dado de 6 faces: 3/6 = 50%.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-combinatoria', term: 'Análise Combinatória (Fatorial)', subject: 'Matemática', category: 'definicao',
    definition: 'Estuda formas de contar agrupamentos sem listar todos os casos. Fatorial de n (n!) = produto de 1 até n.',
    examples: '5! = 120 — formas de 5 pessoas se sentarem em 5 cadeiras.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-matriz', term: 'Matriz', subject: 'Matemática', category: 'definicao',
    definition: 'Tabela retangular de números em linhas e colunas, usada pra representar sistemas de equações.',
    examples: 'Uma matriz 2x3 tem 2 linhas, 3 colunas, 6 elementos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-determinante', term: 'Determinante', subject: 'Matemática', category: 'definicao',
    definition: 'Número associado a uma matriz quadrada, usado pra saber se um sistema tem solução única.',
    examples: 'Determinante zero → sistema sem solução única.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-mdc-mmc', term: 'MDC e MMC', subject: 'Matemática', category: 'definicao',
    definition: 'MDC é o maior divisor comum entre números; MMC é o menor múltiplo comum entre eles.',
    examples: 'MDC(12,18) = 6; MMC(4,6) = 12.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-primos', term: 'Números primos', subject: 'Matemática', category: 'definicao',
    definition: 'Números naturais maiores que 1 com exatamente 2 divisores: 1 e ele mesmo.',
    examples: '2, 3, 5, 7, 11, 13 — o 2 é o único primo par.', image_url: null, extra_info: null,
  },

  // ---- Matemática (bloco 2: funções, geometria, estatística) ----
  {
    id: 'fb-funcao-exponencial', term: 'Função Exponencial', subject: 'Matemática', category: 'definicao',
    definition: 'Função no formato f(x) = a^x (a > 0 e a ≠ 1), em que a variável aparece no expoente, usada pra modelar crescimento ou decaimento acelerado.',
    examples: 'Juros compostos e crescimento populacional são modelados por funções exponenciais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcao-modular', term: 'Função Modular', subject: 'Matemática', category: 'definicao',
    definition: 'Função que envolve o módulo (valor absoluto) de uma expressão, representado por |x|, sempre resultando em valores não negativos.',
    examples: '|−5| = 5 e |5| = 5.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-dominio-imagem', term: 'Domínio e Imagem de uma Função', subject: 'Matemática', category: 'definicao',
    definition: 'Domínio é o conjunto de todos os valores possíveis de entrada (x) de uma função; imagem é o conjunto de todos os valores de saída (f(x)) que ela realmente produz.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-area-perimetro', term: 'Área e Perímetro', subject: 'Matemática', category: 'definicao',
    definition: 'Perímetro é a soma das medidas dos lados de uma figura plana (o "contorno"); área é a medida da superfície interna dessa figura.',
    examples: 'Um quadrado de lado 4 tem perímetro 16 e área 16 — coincidência só nesse caso específico.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-circulo-area', term: 'Círculo (Área e Circunferência)', subject: 'Matemática', category: 'definicao',
    definition: 'Circunferência é o contorno do círculo, calculada por 2πr; área do círculo é calculada por πr², onde r é o raio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-teorema-tales', term: 'Teorema de Tales', subject: 'Matemática', category: 'definicao',
    definition: 'Quando um feixe de retas paralelas é cortado por duas retas transversais, os segmentos correspondentes formados são proporcionais.',
    examples: 'Muito usado pra calcular medidas indiretas, como a altura de um prédio a partir de sua sombra.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-semelhanca-triangulos', term: 'Semelhança de Triângulos', subject: 'Matemática', category: 'definicao',
    definition: 'Dois triângulos são semelhantes quando têm os ângulos correspondentes iguais e os lados correspondentes proporcionais, mantendo o mesmo "formato" em tamanhos diferentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-geometria-espacial', term: 'Geometria Espacial (Volume de Sólidos)', subject: 'Matemática', category: 'definicao',
    definition: 'Ramo da geometria que estuda figuras tridimensionais (prismas, pirâmides, cilindros, cones, esferas) e o cálculo de seus volumes e áreas de superfície.',
    examples: 'O volume de um cilindro é calculado por πr²h.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-relacao-euler', term: 'Relação de Euler (Poliedros)', subject: 'Matemática', category: 'definicao',
    definition: 'Em poliedros convexos, o número de vértices (V) menos o número de arestas (A) mais o número de faces (F) é sempre igual a 2: V − A + F = 2.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-numeros-complexos', term: 'Números Complexos', subject: 'Matemática', category: 'definicao',
    definition: 'Números no formato a + bi, em que "i" é a unidade imaginária (i² = −1), usados pra resolver equações sem solução no conjunto dos números reais.',
    examples: 'A equação x² + 1 = 0 não tem solução real, mas tem solução complexa: x = ±i.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-polinomios', term: 'Polinômios', subject: 'Matemática', category: 'definicao',
    definition: 'Expressões algébricas formadas pela soma de vários termos, cada um com uma variável elevada a um expoente inteiro não negativo, multiplicada por um coeficiente.',
    examples: '3x² + 2x − 5 é um polinômio do 2º grau.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-inequacoes', term: 'Inequações', subject: 'Matemática', category: 'definicao',
    definition: 'Expressões matemáticas que relacionam duas quantidades usando desigualdades (>, <, ≥, ≤) em vez de igualdade, resultando num conjunto-solução ao invés de um valor único.',
    examples: '2x − 4 > 0 tem como solução todo x > 2.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-equacoes', term: 'Sistema de Equações Lineares', subject: 'Matemática', category: 'definicao',
    definition: 'Conjunto de duas ou mais equações do 1º grau com as mesmas variáveis, resolvido encontrando valores que satisfaçam todas as equações simultaneamente.',
    examples: 'Pode ser resolvido por substituição, adição ou usando matrizes/determinantes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-media-moda-mediana', term: 'Estatística (Média, Moda e Mediana)', subject: 'Matemática', category: 'definicao',
    definition: 'Média é a soma dos valores dividida pela quantidade deles; moda é o valor que mais se repete; mediana é o valor central quando os dados são ordenados.',
    examples: 'Nos dados 2, 3, 3, 5, 7: média = 4, moda = 3, mediana = 3.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-desvio-padrao', term: 'Desvio Padrão', subject: 'Matemática', category: 'definicao',
    definition: 'Medida estatística que indica o quanto os valores de um conjunto de dados se afastam, em média, da média desse conjunto — quanto maior, mais dispersos os dados.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-radiciacao', term: 'Radiciação', subject: 'Matemática', category: 'definicao',
    definition: 'Operação inversa da potenciação, usada pra encontrar a raiz de um número: √a = b significa que b² = a.',
    examples: '√16 = 4, porque 4² = 16.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-notacao-cientifica', term: 'Notação Científica', subject: 'Matemática', category: 'definicao',
    definition: 'Forma de representar números muito grandes ou muito pequenos como um número entre 1 e 10 multiplicado por uma potência de 10.',
    examples: 'A velocidade da luz é aproximadamente 3 × 10⁸ m/s.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-descartes', term: 'René Descartes', subject: 'Matemática', category: 'pessoa',
    definition: 'Filósofo e matemático francês, criador do sistema de coordenadas cartesianas (plano cartesiano), que uniu a álgebra e a geometria e deu origem à geometria analítica.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Frans_Hals%2C_Portrait_of_Ren%C3%A9_Descartes.jpg', extra_info: '1596 – 1650',
  },
  {
    id: 'fb-euler', term: 'Leonhard Euler', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático suíço, um dos mais prolíficos da história, com contribuições em praticamente todas as áreas da matemática — cálculo, teoria dos grafos, geometria — e responsável por popularizar boa parte da notação matemática usada até hoje (como o número "e").',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Leonhard_Euler.jpg', extra_info: '1707 – 1783',
  },
  {
    id: 'fb-plano-cartesiano', term: 'Plano Cartesiano', subject: 'Matemática', category: 'definicao',
    definition: 'Sistema de coordenadas formado por dois eixos perpendiculares (x horizontal e y vertical) que se cruzam na origem, usado pra localizar pontos e representar funções e figuras geometricamente.',
    examples: 'O ponto (3, 2) está 3 unidades à direita e 2 unidades acima da origem.', image_url: null, extra_info: null,
  },

  // ---- História ----
  {
    id: 'fb-tiradentes', term: 'Tiradentes', subject: 'História', category: 'pessoa',
    definition: 'Joaquim José da Silva Xavier, alferes e dentista, principal líder da Inconfidência Mineira (1789). Foi enforcado e esquartejado pela Coroa Portuguesa, virando símbolo da luta pela independência do Brasil.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Pedro_Am%C3%A9rico_-_Tiradentes_Esquartejado.jpg', extra_info: '1746 – 1792',
  },
  {
    id: 'fb-dpedro1', term: 'Dom Pedro I', subject: 'História', category: 'pessoa',
    definition: 'Primeiro imperador do Brasil, proclamou a Independência em 7 de setembro de 1822 ("Grito do Ipiranga") e governou até 1831, quando abdicou em favor do filho, Dom Pedro II.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Manuel_de_Ara%C3%BAjo_Porto_Alegre_-_Retrato_de_D._Pedro_I.jpg', extra_info: '1798 – 1834',
  },
  {
    id: 'fb-vargas', term: 'Getúlio Vargas', subject: 'História', category: 'pessoa',
    definition: 'Político gaúcho que governou o Brasil por 18 anos em dois períodos (1930-1945 e 1951-1954), marcados pela Era Vargas, o Estado Novo e a criação da CLT. Suicidou-se em 1954.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Getulio_Vargas_%281930%29_%28cropped_2%29.jpg', extra_info: '1882 – 1954',
  },
  {
    id: 'fb-napoleao', term: 'Napoleão Bonaparte', subject: 'História', category: 'pessoa',
    definition: 'General e imperador francês que dominou boa parte da Europa no início do século 19. Suas conquistas espalharam ideais da Revolução Francesa, mas provocaram guerras que redesenharam o mapa europeu.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Jacques-Louis_David_-_The_Coronation_of_Napoleon_%281805-1807%29_Cropped.jpg', extra_info: '1769 – 1821',
  },
  {
    id: 'fb-rev-francesa', term: 'Revolução Francesa', subject: 'História', category: 'definicao',
    definition: 'Movimento revolucionário (1789-1799) que derrubou a monarquia absolutista na França, sob o lema "Liberdade, Igualdade, Fraternidade", influenciando ideais liberais em todo o mundo.',
    examples: 'A queda da Bastilha, em 14/07/1789, é o marco inicial da revolução.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-independencia-br', term: 'Independência do Brasil', subject: 'História', category: 'definicao',
    definition: 'Processo político que rompeu os laços coloniais entre Brasil e Portugal, proclamado por Dom Pedro I em 7 de setembro de 1822, às margens do rio Ipiranga.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-inconfidencia', term: 'Inconfidência Mineira', subject: 'História', category: 'definicao',
    definition: 'Movimento separatista em Minas Gerais em 1789, articulado por elites locais (incluindo Tiradentes) insatisfeitas com impostos da Coroa Portuguesa, especialmente a "derrama".',
    examples: 'Inspirada pelo Iluminismo e pela independência dos EUA.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-era-vargas', term: 'Era Vargas', subject: 'História', category: 'definicao',
    definition: 'Período de 1930 a 1945 em que Getúlio Vargas governou o Brasil, incluindo o Governo Provisório, o Constitucional e o Estado Novo (ditadura), com industrialização e leis trabalhistas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ditadura-militar', term: 'Ditadura Militar Brasileira', subject: 'História', category: 'definicao',
    definition: 'Regime autoritário que governou o Brasil de 1964 a 1985, instaurado por golpe militar, marcado por censura, perseguição política e o AI-5.',
    examples: 'O AI-5 (1968) suspendeu garantias constitucionais e ampliou a repressão.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-rev-industrial', term: 'Revolução Industrial', subject: 'História', category: 'definicao',
    definition: 'Transformação econômica iniciada na Inglaterra no século 18, que substituiu a produção manual por máquinas, dando origem à sociedade industrial e urbana moderna.',
    examples: 'A máquina a vapor de James Watt foi uma tecnologia-chave.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-1guerra', term: 'Primeira Guerra Mundial', subject: 'História', category: 'definicao',
    definition: 'Conflito global (1914-1918) entre a Tríplice Aliança e a Tríplice Entente, desencadeado pelo assassinato do arquiduque Francisco Ferdinando.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-2guerra', term: 'Segunda Guerra Mundial', subject: 'História', category: 'definicao',
    definition: 'Maior conflito armado da história (1939-1945), envolvendo os Aliados e o Eixo, marcado pelo Holocausto e pelo uso de bombas atômicas no Japão.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-fria', term: 'Guerra Fria', subject: 'História', category: 'definicao',
    definition: 'Tensão política, ideológica e militar (1947-1991) entre EUA (capitalismo) e URSS (socialismo), sem confronto direto, mas com vários conflitos indiretos.',
    examples: 'Guerra da Coreia e Guerra do Vietnã foram conflitos indiretos da Guerra Fria.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-feudalismo', term: 'Feudalismo', subject: 'História', category: 'definicao',
    definition: 'Sistema socioeconômico predominante na Europa medieval, baseado em relações de servidão entre servos e senhores feudais em troca de proteção e uso da terra.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-renascimento', term: 'Renascimento', subject: 'História', category: 'definicao',
    definition: 'Movimento cultural e artístico que floresceu na Europa entre os séculos 14 e 16, retomando valores da Antiguidade Clássica e valorizando humanismo, razão e ciência.',
    examples: 'Leonardo da Vinci e Michelangelo são dois grandes nomes do Renascimento italiano.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-escravidao-br', term: 'Escravidão no Brasil', subject: 'História', category: 'definicao',
    definition: 'Sistema de trabalho forçado que explorou milhões de africanos escravizados no Brasil por mais de 300 anos, até a Lei Áurea em 1888.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-aurea', term: 'Lei Áurea', subject: 'História', category: 'definicao',
    definition: 'Lei assinada pela Princesa Isabel em 13 de maio de 1888, que aboliu formalmente a escravidão no Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-proclamacao-rep', term: 'Proclamação da República', subject: 'História', category: 'definicao',
    definition: 'Evento de 15 de novembro de 1889, liderado pelo Marechal Deodoro da Fonseca, que pôs fim ao Império e instaurou a República no Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-colonizacao-br', term: 'Colonização do Brasil', subject: 'História', category: 'definicao',
    definition: 'Ocupação e exploração do território brasileiro por Portugal a partir de 1500, baseada na extração de pau-brasil e depois na economia açucareira e mineradora com trabalho escravo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-iluminismo', term: 'Iluminismo', subject: 'História', category: 'definicao',
    definition: 'Movimento filosófico do século 18 que defendia razão, ciência e direitos individuais contra o absolutismo, influenciando a Revolução Francesa e a Independência dos EUA.',
    examples: 'Voltaire, Rousseau e Montesquieu são pensadores iluministas centrais.', image_url: null, extra_info: null,
  },

  // ---- História (bloco 2: mundial, Brasil Império/República, século 20) ----
  {
    id: 'fb-zumbi', term: 'Zumbi dos Palmares', subject: 'História', category: 'pessoa',
    definition: 'Último líder do Quilombo dos Palmares, o maior e mais duradouro quilombo do Brasil colonial, símbolo histórico da resistência negra à escravidão. Morto em 1695, sua data de morte (20 de novembro) é o Dia da Consciência Negra.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Est%C3%A1tua_de_Zumbi_dos_Palmares.jpg', extra_info: 'Cerca de 1655 – 1695',
  },
  {
    id: 'fb-dpedro2', term: 'Dom Pedro II', subject: 'História', category: 'pessoa',
    definition: 'Segundo e último imperador do Brasil, governou por quase 50 anos (1840-1889), período marcado por estabilidade política, abolição da escravidão (1888) e expansão cultural — foi deposto pela Proclamação da República.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Pedro_II_of_Brazil_-_Brady-Handy.jpg', extra_info: '1825 – 1891',
  },
  {
    id: 'fb-revolucao-russa', term: 'Revolução Russa', subject: 'História', category: 'definicao',
    definition: 'Movimento revolucionário de 1917 que derrubou o czarismo na Rússia e instaurou o primeiro governo socialista do mundo, liderado por Vladimir Lênin e o Partido Bolchevique.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-crise-1929', term: 'Crise de 1929', subject: 'História', category: 'definicao',
    definition: 'Grande depressão econômica mundial iniciada com a quebra da bolsa de Nova York, causando falências, desemprego em massa e impactando economias ao redor do mundo, incluindo o Brasil (queda no preço do café).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-holocausto', term: 'Holocausto', subject: 'História', category: 'definicao',
    definition: 'Genocídio sistemático de cerca de 6 milhões de judeus, além de outras minorias, promovido pela Alemanha nazista de Hitler durante a Segunda Guerra Mundial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-apartheid', term: 'Apartheid', subject: 'História', category: 'definicao',
    definition: 'Sistema de segregação racial institucionalizado na África do Sul entre 1948 e 1994, que separava e discriminava legalmente a população negra em relação à branca.',
    examples: 'Nelson Mandela foi um dos principais líderes na luta contra o apartheid, preso por 27 anos antes de se tornar presidente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-vietna', term: 'Guerra do Vietnã', subject: 'História', category: 'definicao',
    definition: 'Conflito (1955-1975) entre o Vietnã do Norte (comunista, apoiado pela URSS e China) e o Vietnã do Sul (apoiado pelos EUA), um dos principais confrontos indiretos da Guerra Fria, terminando com a vitória norte-vietnamita.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-descolonizacao', term: 'Descolonização da África e Ásia', subject: 'História', category: 'definicao',
    definition: 'Processo, intensificado após a Segunda Guerra Mundial, de independência de colônias europeias na África e Ásia, gerando novas nações mas também conflitos internos e fronteiras artificiais herdadas do colonialismo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-plano-real', term: 'Plano Real', subject: 'História', category: 'definicao',
    definition: 'Plano econômico brasileiro de 1994 que criou a moeda Real e conseguiu controlar a hiperinflação que assolava o país havia décadas, um dos planos econômicos mais bem-sucedidos da história do Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-diretas-ja', term: 'Diretas Já', subject: 'História', category: 'definicao',
    definition: 'Movimento popular de 1983-1984 que exigia eleições diretas para presidente no fim da ditadura militar. A emenda não foi aprovada no Congresso, mas o movimento marcou a redemocratização brasileira.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-paraguai', term: 'Guerra do Paraguai', subject: 'História', category: 'definicao',
    definition: 'Maior conflito armado da história da América do Sul (1864-1870), envolvendo o Paraguai contra a Tríplice Aliança (Brasil, Argentina e Uruguai), com devastadoras perdas humanas e territoriais pro lado paraguaio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mercantilismo', term: 'Mercantilismo', subject: 'História', category: 'definicao',
    definition: 'Conjunto de práticas econômicas adotadas pelas monarquias europeias entre os séculos 15 e 18, baseado no acúmulo de metais preciosos, balança comercial favorável e monopólio colonial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-absolutismo', term: 'Absolutismo', subject: 'História', category: 'definicao',
    definition: 'Sistema político em que o poder do rei é considerado absoluto e de origem divina, sem limitações por outras instituições, predominante na Europa entre os séculos 16 e 18.',
    examples: 'Luís XIV da França, o "Rei Sol", é o exemplo clássico de monarca absolutista ("O Estado sou eu").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-grandes-navegacoes', term: 'Grandes Navegações', subject: 'História', category: 'definicao',
    definition: 'Expansão marítima europeia dos séculos 15 e 16, liderada inicialmente por Portugal e Espanha, que resultou na chegada dos europeus à América, África e Ásia por rotas marítimas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-crise-petroleo', term: 'Crise do Petróleo (1973)', subject: 'História', category: 'definicao',
    definition: 'Choque econômico mundial causado pelo embargo de exportação de petróleo dos países árabes da OPEP, que quadruplicou o preço do barril e afetou economias dependentes de combustíveis fósseis, incluindo o Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-onu', term: 'ONU (Organização das Nações Unidas)', subject: 'História', category: 'definicao',
    definition: 'Organização internacional criada em 1945, após a Segunda Guerra Mundial, com o objetivo de manter a paz mundial, promover direitos humanos e cooperação entre nações.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-unificacao-alemanha', term: 'Unificação da Alemanha', subject: 'História', category: 'definicao',
    definition: 'Processo liderado por Otto von Bismarck que uniu os diversos estados germânicos num único país em 1871, transformando a Prússia na potência central da nova Alemanha.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolucao-1930', term: 'Revolução de 1930', subject: 'História', category: 'definicao',
    definition: 'Movimento armado que levou Getúlio Vargas ao poder no Brasil, encerrando a Primeira República (República Velha) e o domínio político das oligarquias cafeeiras de São Paulo e Minas Gerais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-populismo-brasil', term: 'Populismo no Brasil', subject: 'História', category: 'definicao',
    definition: 'Estilo político do século 20 marcado por líderes carismáticos que buscavam apoio direto das massas populares (especialmente urbanas e trabalhadoras), muitas vezes por meio de políticas sociais e discurso nacionalista.',
    examples: 'Getúlio Vargas e Juscelino Kubitschek são frequentemente associados ao populismo brasileiro.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-malvinas', term: 'Guerra das Malvinas', subject: 'História', category: 'definicao',
    definition: 'Conflito de 1982 entre Argentina e Reino Unido pelo controle das Ilhas Malvinas (Falklands), vencido pelos britânicos, que acelerou o fim da ditadura militar argentina.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Geografia ----
  {
    id: 'fb-placas-tectonicas', term: 'Placas Tectônicas', subject: 'Geografia', category: 'definicao',
    definition: 'Grandes blocos rígidos que formam a litosfera terrestre e se movem lentamente sobre o manto, causando terremotos, vulcões e a formação de cadeias montanhosas nas bordas onde colidem ou se afastam.',
    examples: 'O Círculo de Fogo do Pacífico concentra boa parte da atividade sísmica e vulcânica do planeta.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-relevo', term: 'Relevo', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto das formas da superfície terrestre (planícies, planaltos, montanhas, depressões), moldado por processos internos (tectônica, vulcanismo) e externos (erosão, intemperismo).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-clima', term: 'Clima', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de condições atmosféricas (temperatura, umidade, pressão, ventos) que se repetem numa região ao longo de um período longo, diferente do tempo (condição momentânea).',
    examples: 'O Brasil tem predomínio de clima tropical, mas também apresenta equatorial, semiárido e subtropical.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-bioma', term: 'Bioma', subject: 'Geografia', category: 'definicao',
    definition: 'Grande conjunto de ecossistemas com vegetação, fauna e clima característicos numa região. O Brasil tem 6 biomas: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa e Pantanal.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-amazonia', term: 'Amazônia', subject: 'Geografia', category: 'definicao',
    definition: 'Maior floresta tropical do mundo, cobrindo parte de 9 países da América do Sul (60% em território brasileiro), com altíssima biodiversidade e papel fundamental no equilíbrio climático global.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cerrado', term: 'Cerrado', subject: 'Geografia', category: 'definicao',
    definition: 'Segundo maior bioma brasileiro, savana tropical com vegetação de árvores baixas e tortuosas, considerado o "berço das águas" do Brasil por abrigar nascentes de grandes bacias hidrográficas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mata-atlantica', term: 'Mata Atlântica', subject: 'Geografia', category: 'definicao',
    definition: 'Bioma que originalmente cobria boa parte do litoral brasileiro, hoje reduzido a menos de 15% de sua área original devido à urbanização e ao desmatamento histórico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-efeito-estufa', term: 'Efeito Estufa', subject: 'Geografia', category: 'definicao',
    definition: "Fenômeno natural em que gases da atmosfera (CO2, metano, vapor d'água) retêm parte do calor irradiado pela Terra, mantendo a temperatura do planeta habitável. O problema é sua intensificação pela ação humana.",
    examples: 'A queima de combustíveis fósseis aumenta a concentração de CO2, intensificando o efeito estufa.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-aquecimento-global', term: 'Aquecimento Global', subject: 'Geografia', category: 'definicao',
    definition: 'Aumento da temperatura média do planeta ao longo do tempo, associado à intensificação do efeito estufa por ação humana, causando degelo, elevação do nível do mar e eventos climáticos extremos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-camadas-atmosfera', term: 'Camadas da Atmosfera', subject: 'Geografia', category: 'visual',
    definition: 'A atmosfera terrestre é dividida em camadas: troposfera (onde ocorrem os fenômenos climáticos), estratosfera (com a camada de ozônio), mesosfera, termosfera e exosfera.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Camadas_da_atmosfera.png',
    extra_info: "A troposfera concentra quase todo o vapor d'água e é onde vivemos e onde se formam as nuvens.",
  },
  {
    id: 'fb-ciclo-agua', term: 'Ciclo da Água', subject: 'Geografia', category: 'visual',
    definition: 'Circulação contínua da água entre a atmosfera, a superfície terrestre e os oceanos, através de evaporação, condensação, precipitação e infiltração.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Ciclo_da_%C3%A1gua.jpg',
    extra_info: 'Fundamental pra entender disponibilidade de água doce, chuvas e o próprio clima regional.',
  },
  {
    id: 'fb-erosao', term: 'Erosão', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de desgaste e transporte de rochas e solo pela ação da água, vento, gelo ou seres vivos, podendo ser intensificado por desmatamento e uso inadequado do solo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-desertificacao', term: 'Desertificação', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de degradação de terras em áreas secas, causado por fatores climáticos e por atividades humanas como desmatamento e uso excessivo do solo.',
    examples: 'No Brasil, parte do Nordeste semiárido está em processo de desertificação.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-fuso-horario', term: 'Fuso Horário', subject: 'Geografia', category: 'definicao',
    definition: 'Cada uma das 24 faixas em que a Terra é dividida (a cada 15° de longitude), usadas pra padronizar a hora local em diferentes regiões do planeta.',
    examples: 'O Brasil chegou a ter 4 fusos horários; hoje usa oficialmente 3.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-coordenadas-geograficas', term: 'Coordenadas Geográficas', subject: 'Geografia', category: 'definicao',
    definition: 'Sistema de latitude (distância angular ao norte ou sul da Linha do Equador) e longitude (distância angular a leste ou oeste do Meridiano de Greenwich) usado pra localizar qualquer ponto na Terra.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-escala-cartografica', term: 'Escala Cartográfica', subject: 'Geografia', category: 'definicao',
    definition: 'Relação matemática entre uma medida no mapa e a medida real correspondente no terreno, indicando o quanto a realidade foi reduzida na representação.',
    examples: 'Numa escala 1:100.000, 1 cm no mapa equivale a 1 km na realidade.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-urbanizacao', term: 'Urbanização', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de crescimento das cidades e da população urbana em relação à população rural, frequentemente acelerado e desigual nos países em desenvolvimento.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-globalizacao', term: 'Globalização', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de integração econômica, cultural e tecnológica entre países, intensificado a partir do final do século 20, que aumenta a interdependência entre nações mas também aprofunda desigualdades.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-milton-santos', term: 'Milton Santos', subject: 'Geografia', category: 'pessoa',
    definition: 'Geógrafo brasileiro, considerado um dos maiores pensadores da geografia mundial, conhecido por seus estudos sobre urbanização, globalização e o espaço geográfico nos países em desenvolvimento. Primeiro latino-americano a receber o "Nobel da Geografia".',
    examples: null, image_url: null, extra_info: '1926 – 2001',
  },
  {
    id: 'fb-idh', term: 'IDH (Índice de Desenvolvimento Humano)', subject: 'Geografia', category: 'definicao',
    definition: 'Indicador que mede o desenvolvimento de um país combinando renda, educação e expectativa de vida, variando de 0 (menor desenvolvimento) a 1 (maior desenvolvimento).',
    examples: 'O Brasil tem IDH considerado alto, mas com grandes desigualdades regionais.', image_url: null, extra_info: null,
  },

  // ---- Geografia (bloco 2: biomas, população, economia, geopolítica) ----
  {
    id: 'fb-caatinga', term: 'Caatinga', subject: 'Geografia', category: 'definicao',
    definition: 'Bioma exclusivamente brasileiro, predominante no Nordeste semiárido, com vegetação adaptada à seca (plantas de raízes profundas, caules que armazenam água, folhas pequenas ou ausentes).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pantanal', term: 'Pantanal', subject: 'Geografia', category: 'definicao',
    definition: 'Maior planície alagável do mundo, localizada principalmente em Mato Grosso e Mato Grosso do Sul, com altíssima biodiversidade e ciclos sazonais de cheia e seca.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pampa', term: 'Pampa', subject: 'Geografia', category: 'definicao',
    definition: 'Bioma de planícies campestres presente no Rio Grande do Sul (e em partes da Argentina e Uruguai), com clima subtropical e vocação histórica pra pecuária.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regioes-brasil', term: 'Regiões do Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'Divisão oficial do território brasileiro (IBGE) em 5 regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul, cada uma com características físicas, econômicas e culturais próprias.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-exodo-rural', term: 'Êxodo Rural', subject: 'Geografia', category: 'definicao',
    definition: 'Movimento migratório da população do campo pra as cidades, um dos principais motores da rápida urbanização brasileira a partir da segunda metade do século 20.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-favela', term: 'Favela (Segregação Urbana)', subject: 'Geografia', category: 'definicao',
    definition: 'Áreas urbanas caracterizadas por moradias precárias e infraestrutura deficiente, geralmente resultado de urbanização acelerada e desigual, refletindo a segregação socioespacial nas cidades.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-agronegocio', term: 'Agronegócio', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de atividades econômicas ligadas à produção agropecuária em larga escala, desde insumos e produção até processamento e distribuição — um dos pilares da economia brasileira.',
    examples: 'Soja, milho e carne bovina estão entre os principais produtos do agronegócio brasileiro de exportação.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-matriz-energetica', term: 'Matriz Energética', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto das diferentes fontes de energia utilizadas por um país ou região (hidrelétrica, termelétrica, eólica, solar, nuclear, etc.) e sua participação relativa no total consumido.',
    examples: 'A matriz energética brasileira é uma das mais limpas do mundo, com forte presença de hidrelétricas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-energias-renovaveis', term: 'Energias Renováveis', subject: 'Geografia', category: 'definicao',
    definition: 'Fontes de energia que se regeneram naturalmente e não se esgotam com o uso, como energia solar, eólica, hidrelétrica e biomassa, em contraste com combustíveis fósseis.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-blocos-economicos', term: 'Blocos Econômicos', subject: 'Geografia', category: 'definicao',
    definition: 'Agrupamentos de países que buscam integração econômica através da redução de barreiras comerciais e cooperação entre seus membros.',
    examples: 'Mercosul (Brasil, Argentina, Paraguai, Uruguai) e União Europeia são exemplos de blocos econômicos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-geopolitica', term: 'Geopolítica', subject: 'Geografia', category: 'definicao',
    definition: 'Estudo da relação entre geografia, poder e política internacional, analisando como fatores territoriais influenciam decisões estratégicas e conflitos entre países.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-divisao-trabalho', term: 'Divisão Internacional do Trabalho', subject: 'Geografia', category: 'definicao',
    definition: 'Distribuição das atividades produtivas entre os países conforme sua posição na economia global, historicamente concentrando indústria de maior valor agregado nos países desenvolvidos e matérias-primas nos em desenvolvimento.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bacias-hidrograficas', term: 'Bacias Hidrográficas', subject: 'Geografia', category: 'definicao',
    definition: 'Área de terreno drenada por um rio principal e seus afluentes, delimitada por divisores de água (geralmente elevações do relevo).',
    examples: 'A Bacia Amazônica é a maior bacia hidrográfica do mundo em volume de água.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-vulcanismo', term: 'Vulcanismo', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de fenômenos relacionados à liberação de magma, gases e material rochoso do interior da Terra através de vulcões, geralmente concentrado nas bordas das placas tectônicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-tipos-solo', term: 'Tipos de Solo', subject: 'Geografia', category: 'definicao',
    definition: 'Classificação dos solos conforme sua composição e fertilidade, como o solo massapê (fértil, litoral nordestino) e a terra roxa (fértil, ideal pro café, interior de SP/PR).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-correntes-maritimas', term: 'Correntes Marítimas', subject: 'Geografia', category: 'definicao',
    definition: 'Movimentos contínuos e direcionados de água nos oceanos, causados por ventos, diferenças de temperatura e densidade, influenciando fortemente o clima costeiro.',
    examples: 'A Corrente do Golfo aquece o clima da Europa Ocidental, tornando-o mais ameno do que seria pela latitude.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-el-nino-la-nina', term: 'El Niño e La Niña', subject: 'Geografia', category: 'definicao',
    definition: 'Fenômenos climáticos cíclicos relacionados ao aquecimento (El Niño) ou resfriamento (La Niña) anormal das águas do Oceano Pacífico, que alteram padrões de chuva e temperatura em escala global.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-densidade-demografica', term: 'Densidade Demográfica', subject: 'Geografia', category: 'definicao',
    definition: 'Relação entre o número de habitantes e a área de um território, geralmente expressa em habitantes por quilômetro quadrado.',
    examples: 'O Brasil tem densidade demográfica relativamente baixa, mas com distribuição populacional muito desigual entre litoral e interior.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-camada-ozonio', term: 'Camada de Ozônio', subject: 'Geografia', category: 'definicao',
    definition: 'Camada da estratosfera que filtra boa parte da radiação ultravioleta do Sol, protegendo a vida na Terra. Foi afetada por gases como os CFCs, causando o chamado "buraco na camada de ozônio".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-movimentos-migratorios', term: 'Movimentos Migratórios', subject: 'Geografia', category: 'definicao',
    definition: 'Deslocamentos de pessoas entre regiões ou países, motivados por fatores econômicos, políticos, ambientais ou sociais, classificados em emigração (saída) e imigração (entrada).',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Inglês ----
  {
    id: 'fb-false-cognates', term: 'False Cognates (Falsos Cognatos)', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras em inglês parecidas com palavras em português, mas com significado diferente — um dos temas mais cobrados em provas de vestibular.',
    examples: '"Pretend" não significa "pretender" e sim "fingir"; "actually" não significa "atualmente" e sim "na verdade".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cognates', term: 'Cognates (Cognatos)', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras em inglês parecidas com o português e que têm o mesmo significado, facilitando a compreensão de textos mesmo sem dominar o idioma.',
    examples: '"Important" (importante), "hospital" (hospital), "information" (informação).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-simple-present', term: 'Simple Present', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal usado pra hábitos, rotinas, fatos gerais e verdades permanentes.',
    examples: '"She studies every day." (Ela estuda todos os dias.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-present-continuous', term: 'Present Continuous', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (to be + verbo com -ing) usado pra ações acontecendo no momento da fala ou planos futuros já combinados.',
    examples: '"I am studying for the exam right now." (Estou estudando pra prova agora.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-simple-past', term: 'Simple Past', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal usado pra ações completamente terminadas no passado, geralmente com uma referência de tempo específica.',
    examples: '"She studied English last year." (Ela estudou inglês no ano passado.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-present-perfect', term: 'Present Perfect', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (have/has + particípio) usado pra ações passadas que têm relação com o presente, sem tempo específico definido.',
    examples: '"I have already read this book." (Eu já li esse livro.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-modal-verbs', term: 'Modal Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Verbos auxiliares (can, could, must, should, may, might, will, would) que expressam capacidade, possibilidade, permissão, obrigação ou conselho.',
    examples: '"You should study more." (Você deveria estudar mais.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-passive-voice', term: 'Passive Voice (Voz Passiva)', subject: 'Inglês', category: 'definicao',
    definition: 'Construção em que o sujeito da frase recebe a ação, em vez de praticá-la, formada com to be + particípio passado.',
    examples: '"The book was written by a famous author." (O livro foi escrito por um autor famoso.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-conditional', term: 'Conditional Sentences (If Clauses)', subject: 'Inglês', category: 'definicao',
    definition: 'Estruturas condicionais com "if", divididas em tipos: zero (fatos gerais), primeiro (futuro provável), segundo (hipotético presente) e terceiro (hipotético passado).',
    examples: '"If I study hard, I will pass the exam." (Se eu estudar bastante, vou passar na prova.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-phrasal-verbs', term: 'Phrasal Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Combinação de verbo + partícula (preposição ou advérbio) que forma um significado geralmente diferente do verbo isolado.',
    examples: '"Give up" (desistir), "look for" (procurar), "find out" (descobrir).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-reported-speech', term: 'Reported Speech (Discurso Indireto)', subject: 'Inglês', category: 'definicao',
    definition: 'Estrutura usada pra relatar o que alguém disse sem citar as palavras exatas, geralmente exigindo mudança de tempo verbal.',
    examples: '"I am tired" → "She said she was tired." (Ela disse que estava cansada.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-comparative-superlative', term: 'Comparative and Superlative', subject: 'Inglês', category: 'definicao',
    definition: 'Formas usadas pra comparar (comparativo) ou destacar o maior/menor grau (superlativo) entre elementos.',
    examples: '"Bigger" (maior), "the biggest" (o maior); "more important", "the most important".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-gerund-infinitive', term: 'Gerund and Infinitive', subject: 'Inglês', category: 'definicao',
    definition: 'Formas verbais usadas após certos verbos: gerúndio (verbo + -ing) ou infinitivo (to + verbo), cada uma seguindo verbos específicos.',
    examples: '"I enjoy reading" (gerúndio) vs. "I want to read" (infinitivo).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-question-tags', term: 'Question Tags', subject: 'Inglês', category: 'definicao',
    definition: 'Pequenas perguntas adicionadas ao final de uma afirmação pra confirmar informação, formadas com o auxiliar oposto ao da frase principal.',
    examples: '"You like English, don\'t you?" (Você gosta de inglês, não gosta?)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-prefixes-suffixes', term: 'Prefixes and Suffixes', subject: 'Inglês', category: 'definicao',
    definition: 'Afixos adicionados antes (prefixo) ou depois (sufixo) de uma palavra pra formar novas palavras ou mudar seu sentido/classe gramatical.',
    examples: '"Un-" + "happy" = "unhappy"; "teach" + "-er" = "teacher".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-skimming-scanning', term: 'Skimming and Scanning', subject: 'Inglês', category: 'definicao',
    definition: 'Técnicas de leitura: skimming é ler rapidamente pra captar a ideia geral do texto; scanning é procurar uma informação específica sem ler tudo.',
    examples: 'Muito úteis pra economizar tempo em provas de compreensão de texto, como no Enem.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-connectors-contrast', term: 'Connectors of Contrast (Contraste)', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados pra opor duas ideias, mostrando contraste entre elas — um dos grupos mais cobrados em interpretação de texto.',
    examples: 'But, however, although, though, nevertheless, yet, on the other hand, even though, despite, in spite of.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-connectors-addition', term: 'Connectors of Addition (Adição)', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados pra somar informações ou ideias semelhantes dentro de um texto.',
    examples: 'And, also, moreover, furthermore, in addition, besides, as well as, not only... but also.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-connectors-cause', term: 'Connectors of Cause (Causa)', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados pra indicar o motivo ou a razão de algo acontecer.',
    examples: 'Because, since, as, due to, owing to, because of.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-connectors-result', term: 'Connectors of Result (Consequência)', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados pra indicar o efeito ou resultado de algo mencionado antes na frase.',
    examples: 'So, therefore, thus, as a result, consequently, hence.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-connectors-conclusion', term: 'Connectors of Conclusion/Sequence (Conclusão)', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados pra concluir uma ideia ou organizar uma sequência de eventos/argumentos num texto.',
    examples: 'Finally, in conclusion, to sum up, in short, first, then, next, after that.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-possessive-case', term: 'Possessive Case', subject: 'Inglês', category: 'definicao',
    definition: "Forma usada pra indicar posse, geralmente com apóstrofo + s ('s) pra pessoas/seres vivos, ou \"of\" pra objetos/coisas.",
    examples: '"Maria\'s book" (o livro da Maria); "the color of the car" (a cor do carro).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-articles', term: 'Articles (a / an / the)', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras usadas antes de substantivos: "a"/"an" (artigo indefinido, algo não específico) e "the" (artigo definido, algo específico ou já mencionado).',
    examples: '"I saw a dog." vs. "The dog was barking." (o cachorro específico mencionado antes)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-idioms', term: 'Idioms (Expressões Idiomáticas)', subject: 'Inglês', category: 'definicao',
    definition: 'Expressões cujo sentido não pode ser entendido pela tradução literal de cada palavra, exigindo conhecimento do significado como um todo.',
    examples: '"It\'s raining cats and dogs" (está chovendo muito, não literalmente gatos e cachorros).', image_url: null, extra_info: null,
  },

  // ---- Inglês (bloco 2: gramática avançada + leitura/interpretação) ----
  {
    id: 'fb-past-continuous', term: 'Past Continuous', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (was/were + verbo com -ing) usado pra ações em progresso num momento específico do passado, muitas vezes interrompidas por outra ação.',
    examples: '"I was studying when she called." (Eu estava estudando quando ela ligou.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-past-perfect', term: 'Past Perfect', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (had + particípio) usado pra indicar que uma ação aconteceu antes de outra ação passada.',
    examples: '"She had already left when I arrived." (Ela já tinha saído quando eu cheguei.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-future', term: 'Future (Will / Going to)', subject: 'Inglês', category: 'definicao',
    definition: '"Will" expressa decisões espontâneas ou previsões; "going to" expressa planos já decididos ou previsões baseadas em evidências presentes.',
    examples: '"I will help you." (decisão no momento) vs. "I am going to travel next year." (plano já decidido)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-relative-pronouns', term: 'Relative Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Pronomes usados pra conectar uma oração a um substantivo mencionado antes, dando mais informação sobre ele: who (pessoas), which (coisas), that (pessoas ou coisas), whose (posse).',
    examples: '"The book that I read was great." (O livro que eu li foi ótimo.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-indefinite-pronouns', term: 'Indefinite Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Pronomes que se referem a pessoas, lugares ou coisas não especificadas: some/any/no combinados com -thing, -body, -one, -where.',
    examples: '"Someone is at the door." / "There isn\'t anything here."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-countable-uncountable', term: 'Countable and Uncountable Nouns', subject: 'Inglês', category: 'definicao',
    definition: 'Substantivos contáveis podem ser contados e têm plural (book/books); substantivos incontáveis não têm plural e são medidos por quantidade (water, information, money).',
    examples: '"Some water" (não "some waters"); "many books" (não "much books").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-quantifiers', term: 'Quantifiers (much, many, few, little)', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras que indicam quantidade: "much" e "little" com substantivos incontáveis; "many" e "few" com substantivos contáveis.',
    examples: '"How much money?" / "How many books?"', image_url: null, extra_info: null,
  },
  {
    id: 'fb-adjective-order', term: 'Adjective Order', subject: 'Inglês', category: 'definicao',
    definition: 'Ordem convencional dos adjetivos em inglês quando há mais de um antes de um substantivo: opinião, tamanho, idade, forma, cor, origem, material.',
    examples: '"A beautiful small old round red Italian wooden table."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-wh-questions', term: 'Wh- Questions', subject: 'Inglês', category: 'definicao',
    definition: 'Perguntas formadas com palavras interrogativas (what, where, when, why, who, how) usadas pra pedir informações específicas, diferente das perguntas de sim/não.',
    examples: '"Where do you live?" (Onde você mora?)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-auxiliary-verbs', term: 'Auxiliary Verbs (Do/Does/Did)', subject: 'Inglês', category: 'definicao',
    definition: 'Verbos auxiliares usados pra formar perguntas e negativas no presente (do/does) e passado (did) com verbos principais no infinitivo sem "to".',
    examples: '"Does she like coffee?" / "I did not go to the party."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-adverbs-frequency', term: 'Adverbs of Frequency', subject: 'Inglês', category: 'definicao',
    definition: 'Advérbios que indicam a frequência com que algo acontece (always, usually, often, sometimes, rarely, never), geralmente posicionados antes do verbo principal.',
    examples: '"She always studies before dinner."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-adjectives-adverbs', term: 'Adjectives vs Adverbs', subject: 'Inglês', category: 'definicao',
    definition: 'Adjetivos descrevem substantivos (a slow car); advérbios descrevem verbos, adjetivos ou outros advérbios, geralmente terminando em -ly (he drives slowly).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-text-genres', term: 'Text Genres (Gêneros Textuais)', subject: 'Inglês', category: 'definicao',
    definition: 'Diferentes formatos de texto cobrados em provas de inglês (charges, tirinhas, anúncios, artigos de opinião, notícias), cada um com estrutura e objetivo comunicativo próprios.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-denotation-connotation', term: 'Denotation and Connotation', subject: 'Inglês', category: 'definicao',
    definition: 'Denotação é o sentido literal/dicionário de uma palavra; conotação é o sentido figurado ou emocional que ela pode assumir dependendo do contexto.',
    examples: '"Snake" pode denotar o animal, mas conotar "pessoa traiçoeira" em certos contextos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-main-idea', term: 'Main Idea vs Supporting Details', subject: 'Inglês', category: 'definicao',
    definition: 'Main idea é a ideia central de um texto ou parágrafo; supporting details são as informações que explicam, exemplificam ou comprovam essa ideia central.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-making-inferences', term: 'Making Inferences', subject: 'Inglês', category: 'definicao',
    definition: 'Habilidade de concluir informações que não estão explícitas no texto, combinando pistas textuais com conhecimento prévio do leitor — muito cobrada em interpretação de texto.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-contextual-clues', term: 'Contextual Clues', subject: 'Inglês', category: 'definicao',
    definition: 'Pistas dentro do próprio texto (sinônimos, exemplos, explicações, contraste) que ajudam a deduzir o significado de uma palavra desconhecida sem precisar de dicionário.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-compound-words', term: 'Compound Words', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras formadas pela junção de duas ou mais palavras, criando um novo significado.',
    examples: '"Breakfast" (break + fast), "notebook" (note + book).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-subject-object-pronouns', term: 'Subject and Object Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Pronomes de sujeito (I, you, he, she, it, we, they) praticam a ação; pronomes de objeto (me, you, him, her, it, us, them) recebem a ação.',
    examples: '"She (sujeito) called him (objeto)."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-possessive-adj-pronouns', term: 'Possessive Adjectives and Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Adjetivos possessivos (my, your, his, her, its, our, their) vêm antes de um substantivo; pronomes possessivos (mine, yours, his, hers, ours, theirs) substituem o substantivo por completo.',
    examples: '"This is my book." (adjetivo) vs. "This book is mine." (pronome)', image_url: null, extra_info: null,
  },

  // ---- Biologia (bloco 3) ----
  {
    id: 'fb-tecidos-animais', term: 'Tecidos Animais', subject: 'Biologia', category: 'definicao',
    definition: 'Conjuntos de células com mesma origem e função. Os 4 tecidos básicos animais são: epitelial (revestimento), conjuntivo (sustentação e preenchimento), muscular (contração) e nervoso (condução de impulsos).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reino-fungi', term: 'Reino Fungi', subject: 'Biologia', category: 'definicao',
    definition: 'Grupo de seres eucariontes, em geral multicelulares, heterótrofos por absorção (decompõem matéria orgânica externamente e depois absorvem os nutrientes). Inclui fungos, leveduras e bolores.',
    examples: 'Penicillium, usado na produção da penicilina, e o Saccharomyces (levedura de padaria/cerveja) são fungos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-reino-protista', term: 'Reino Protista', subject: 'Biologia', category: 'definicao',
    definition: 'Grupo de seres eucariontes unicelulares (ou coloniais), que inclui protozoários (heterótrofos, como a ameba) e algas unicelulares (autótrofas, como as diatomáceas).',
    examples: 'O Plasmodium, protozoário causador da malária, e a Euglena, alga flagelada.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-reprodutor', term: 'Sistema Reprodutor Humano', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de órgãos responsáveis pela produção de gametas e pela reprodução: no homem, testículos produzem espermatozoides; na mulher, ovários produzem óvulos e o útero abriga a gestação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-especiacao', term: 'Especiação', subject: 'Biologia', category: 'definicao',
    definition: 'Processo evolutivo pelo qual novas espécies surgem a partir de populações de uma mesma espécie ancestral, geralmente por isolamento geográfico seguido de acúmulo de diferenças genéticas.',
    examples: 'Os tentilhões de Darwin, nas Ilhas Galápagos, são um exemplo clássico de especiação.', image_url: null, extra_info: null,
  },

  // ---- Química (bloco 3) ----
  {
    id: 'fb-ester', term: 'Éster (Função Orgânica)', subject: 'Química', category: 'definicao',
    definition: 'Função orgânica formada pela reação entre um ácido carboxílico e um álcool (esterificação), responsável por muitos aromas e sabores artificiais e naturais.',
    examples: 'Ésteres são responsáveis pelo aroma de frutas como banana e maçã em essências artificiais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-amina-amida', term: 'Amina e Amida', subject: 'Química', category: 'definicao',
    definition: 'Amina é uma função orgânica derivada da amônia (NH3), com caráter básico; amida tem o grupo carbonila ligado a um nitrogênio, com caráter neutro.',
    examples: 'Aminas estão presentes em neurotransmissores como a adrenalina.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-molaridade', term: 'Concentração Molar (Molaridade)', subject: 'Química', category: 'definicao',
    definition: 'Medida de concentração de uma solução, dada pela razão entre o número de mols do soluto e o volume da solução em litros (mol/L).',
    examples: 'Uma solução 1 mol/L tem 1 mol de soluto dissolvido em cada litro de solução.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-geral-gases', term: 'Lei Geral dos Gases', subject: 'Química', category: 'definicao',
    definition: 'Relaciona pressão, volume e temperatura de um gás: PV/T é constante para uma quantidade fixa de gás, permitindo prever o comportamento do gás quando uma dessas variáveis muda.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-formulas-quimicas', term: 'Fórmula Molecular, Estrutural e Mínima', subject: 'Química', category: 'definicao',
    definition: 'Fórmula molecular mostra a quantidade exata de átomos de cada elemento; fórmula estrutural mostra como esses átomos estão conectados; fórmula mínima mostra a menor proporção entre os átomos.',
    examples: 'Glicose: fórmula molecular C6H12O6, fórmula mínima CH2O.', image_url: null, extra_info: null,
  },

  // ---- Física (bloco 3) ----
  {
    id: 'fb-lancamento-obliquo', term: 'Lançamento Oblíquo', subject: 'Física', category: 'definicao',
    definition: 'Movimento de um corpo lançado com velocidade inicial inclinada em relação à horizontal, combinando um movimento horizontal uniforme com um movimento vertical uniformemente variado (queda livre).',
    examples: 'A trajetória de uma bola de futebol chutada em direção ao gol é um exemplo de lançamento oblíquo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-torque', term: 'Torque (Momento de uma Força)', subject: 'Física', category: 'definicao',
    definition: 'Grandeza que mede a capacidade de uma força de girar um corpo em torno de um eixo, calculada pelo produto da força pela distância perpendicular ao eixo de rotação.',
    examples: 'Quanto mais longe do eixo você aplica a força numa porta, mais fácil é abri-la — por isso a maçaneta fica longe das dobradiças.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-estatica', term: 'Equilíbrio de Corpos (Estática)', subject: 'Física', category: 'definicao',
    definition: 'Ramo da mecânica que estuda as condições pras quais um corpo permanece em repouso: a soma de todas as forças e a soma de todos os torques atuando sobre ele devem ser iguais a zero.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-efeito-joule', term: 'Efeito Joule', subject: 'Física', category: 'definicao',
    definition: 'Transformação de energia elétrica em energia térmica (calor) quando uma corrente elétrica atravessa um condutor com resistência.',
    examples: 'É o princípio usado em chuveiros elétricos, ferros de passar e lâmpadas incandescentes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-espectro-eletromagnetico', term: 'Espectro Eletromagnético', subject: 'Física', category: 'definicao',
    definition: 'Conjunto de todas as ondas eletromagnéticas organizadas por frequência/comprimento de onda: ondas de rádio, micro-ondas, infravermelho, luz visível, ultravioleta, raios X e raios gama.',
    examples: 'A luz visível é apenas uma pequena faixa do espectro eletromagnético.', image_url: null, extra_info: null,
  },

  // ---- Matemática (bloco 3) ----
  {
    id: 'fb-binomio-newton', term: 'Binômio de Newton', subject: 'Matemática', category: 'definicao',
    definition: 'Fórmula que permite expandir potências de um binômio (a + b)^n sem multiplicar termo a termo, usando os coeficientes binomiais (números do Triângulo de Pascal).',
    examples: '(a + b)² = a² + 2ab + b².', image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcao-composta-inversa', term: 'Função Composta e Função Inversa', subject: 'Matemática', category: 'definicao',
    definition: 'Função composta aplica uma função sobre o resultado de outra: (f∘g)(x) = f(g(x)). Função inversa "desfaz" o que a função original fez, revertendo entrada e saída.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-geometria-analitica', term: 'Geometria Analítica', subject: 'Matemática', category: 'definicao',
    definition: 'Ramo da matemática que usa coordenadas e álgebra pra estudar figuras geométricas, permitindo calcular distância entre pontos, equação da reta e outras propriedades geometricamente.',
    examples: 'A distância entre dois pontos (x1,y1) e (x2,y2) é dada por √[(x2−x1)² + (y2−y1)²].', image_url: null, extra_info: null,
  },
  {
    id: 'fb-racionais-irracionais', term: 'Números Racionais e Irracionais', subject: 'Matemática', category: 'definicao',
    definition: 'Números racionais podem ser escritos como fração de dois inteiros (incluindo decimais exatos ou periódicos); irracionais têm representação decimal infinita e não periódica, não podendo ser escritos como fração.',
    examples: 'π (pi) e √2 são números irracionais; 0,5 e 1/3 são racionais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-razao-proporcao', term: 'Razão e Proporção', subject: 'Matemática', category: 'definicao',
    definition: 'Razão é a comparação entre duas grandezas por meio de uma divisão; proporção é a igualdade entre duas razões.',
    examples: 'A razão entre 10 e 5 é 2; "10 está para 5 assim como 20 está para 10" é uma proporção.', image_url: null, extra_info: null,
  },

  // ---- História (bloco 3) ----
  {
    id: 'fb-revolucao-cubana', term: 'Revolução Cubana', subject: 'História', category: 'definicao',
    definition: 'Movimento revolucionário (1953-1959) liderado por Fidel Castro e Che Guevara que derrubou o ditador Fulgencio Batista e instaurou um regime socialista em Cuba, alinhado à União Soviética durante a Guerra Fria.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-semana-arte-moderna', term: 'Semana de Arte Moderna de 1922', subject: 'História', category: 'definicao',
    definition: 'Evento cultural realizado em São Paulo que lançou o modernismo no Brasil, rompendo com padrões artísticos tradicionais e valorizando temas e uma estética nacionais.',
    examples: 'Oswald de Andrade, Mário de Andrade e Tarsila do Amaral participaram do movimento.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-direitos-civis-eua', term: 'Movimento dos Direitos Civis (EUA)', subject: 'História', category: 'definicao',
    definition: 'Movimento social nos Estados Unidos, com auge nas décadas de 1950-60, que lutou pelo fim da segregação racial e por direitos iguais pra população negra, liderado por figuras como Martin Luther King Jr.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-civil-espanhola', term: 'Guerra Civil Espanhola', subject: 'História', category: 'definicao',
    definition: 'Conflito (1936-1939) entre republicanos (apoiados por parte da esquerda internacional) e nacionalistas liderados pelo general Francisco Franco, que venceu e instaurou uma ditadura na Espanha até 1975.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-queda-muro-berlim', term: 'Queda do Muro de Berlim', subject: 'História', category: 'definicao',
    definition: 'Evento de 1989 que simbolizou o fim da divisão entre Alemanha Ocidental (capitalista) e Oriental (socialista), marcando o começo do fim da Guerra Fria e da União Soviética.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Geografia (bloco 3) ----
  {
    id: 'fb-zona-franca-manaus', term: 'Zona Franca de Manaus', subject: 'Geografia', category: 'definicao',
    definition: 'Área de livre comércio criada em 1967 na capital do Amazonas, com incentivos fiscais pra atrair indústrias, importante polo industrial e econômico da região Norte.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-questao-agraria', term: 'Questão Agrária (Reforma Agrária)', subject: 'Geografia', category: 'definicao',
    definition: 'Debate sobre a distribuição de terras no Brasil, marcado por forte concentração fundiária histórica; reforma agrária propõe redistribuir terras improdutivas pra fins de produção familiar e justiça social.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-desmatamento', term: 'Desmatamento', subject: 'Geografia', category: 'definicao',
    definition: 'Remoção da cobertura vegetal original de uma área, geralmente pra dar lugar à agropecuária, mineração ou expansão urbana, com graves impactos ambientais como perda de biodiversidade e emissão de carbono.',
    examples: 'A Amazônia é o bioma brasileiro mais monitorado em relação ao desmatamento.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ilha-calor-urbana', term: 'Ilha de Calor Urbana', subject: 'Geografia', category: 'definicao',
    definition: 'Fenômeno em que áreas urbanas apresentam temperaturas mais altas que áreas rurais vizinhas, causado pela concentração de asfalto, concreto e pela redução de áreas verdes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-transicao-demografica', term: 'Transição Demográfica', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de mudança nas taxas de natalidade e mortalidade de uma população ao longo do desenvolvimento econômico, geralmente resultando em envelhecimento populacional nas fases mais avançadas.',
    examples: 'Países desenvolvidos, como o Japão, já enfrentam forte envelhecimento populacional.', image_url: null, extra_info: null,
  },

  // ---- Inglês (bloco 3) ----
  {
    id: 'fb-prepositions-time-place', term: 'Prepositions of Time and Place (in/on/at)', subject: 'Inglês', category: 'definicao',
    definition: 'Preposições usadas pra indicar tempo e lugar: "in" (meses, anos, cidades grandes), "on" (dias, datas, ruas), "at" (horários específicos, endereços exatos).',
    examples: '"In 2024", "on Monday", "at 5 pm".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-used-to', term: 'Used to (Past Habits)', subject: 'Inglês', category: 'definicao',
    definition: 'Estrutura usada pra falar de hábitos ou estados que existiam no passado mas não existem mais no presente.',
    examples: '"I used to play soccer every weekend." (Eu costumava jogar futebol todo fim de semana.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-causative-verbs', term: 'Causative Verbs (Make/Let/Have/Get)', subject: 'Inglês', category: 'definicao',
    definition: 'Verbos usados pra indicar que alguém causa ou permite que outra pessoa faça algo: "make" (obrigar), "let" (permitir), "have"/"get" (mandar fazer).',
    examples: '"She made him apologize." / "I had my car washed."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-punctuation-comma', term: 'Punctuation Rules (Comma Usage)', subject: 'Inglês', category: 'definicao',
    definition: 'Regras de uso da vírgula em inglês, incluindo separação de itens numa lista, antes de conjunções coordenativas em orações compostas, e após expressões introdutórias.',
    examples: '"I bought apples, bananas, and oranges." / "However, she decided to stay."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-register', term: 'Formal vs Informal Language (Register)', subject: 'Inglês', category: 'definicao',
    definition: 'Registro formal usa vocabulário mais elaborado e evita contrações e gírias (usado em textos acadêmicos e profissionais); registro informal é mais próximo da fala cotidiana, com contrações e expressões coloquiais.',
    examples: '"I would like to inform you" (formal) vs. "Just wanted to let you know" (informal).', image_url: null, extra_info: null,
  },

  // ---- Biologia (bloco 4) ----
  {
    id: 'fb-enzimas', term: 'Enzimas', subject: 'Biologia', category: 'definicao',
    definition: 'Proteínas que aceleram reações químicas do metabolismo sem serem consumidas no processo, atuando como catalisadores biológicos específicos pra cada tipo de reação.',
    examples: 'A amilase salivar começa a digestão do amido ainda na boca.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-vitaminas', term: 'Vitaminas', subject: 'Biologia', category: 'definicao',
    definition: 'Substâncias orgânicas essenciais em pequenas quantidades pro funcionamento do organismo, obtidas principalmente pela alimentação, classificadas em hidrossolúveis (complexo B, C) e lipossolúveis (A, D, E, K).',
    examples: 'A falta de vitamina C causa escorbuto; a falta de vitamina D afeta a absorção de cálcio.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-respiratorio', term: 'Sistema Respiratório', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de órgãos responsáveis pelas trocas gasosas entre o corpo e o ambiente: vias aéreas (nariz, faringe, laringe, traqueia, brônquios) e pulmões, onde ocorre a hematose (troca de O2 por CO2).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-excretor', term: 'Sistema Excretor (Urinário)', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de órgãos responsáveis por filtrar o sangue e eliminar substâncias tóxicas e excesso de água na forma de urina, tendo os rins (com os néfrons) como principal órgão.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-osseo', term: 'Sistema Ósseo (Esqueleto)', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de ossos que sustenta o corpo, protege órgãos internos, permite o movimento junto com os músculos e produz células sanguíneas na medula óssea.',
    examples: 'O corpo humano adulto tem 206 ossos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-contracao-muscular', term: 'Contração Muscular', subject: 'Biologia', category: 'definicao',
    definition: 'Processo pelo qual as fibras musculares se encurtam usando energia (ATP), gerado pelo deslizamento das proteínas actina e miosina entre si, permitindo o movimento do corpo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fator-rh', term: 'Fator Rh', subject: 'Biologia', category: 'definicao',
    definition: 'Proteína presente (Rh+) ou ausente (Rh-) na superfície das hemácias, independente do sistema ABO, relevante principalmente em transfusões de sangue e na gestação (incompatibilidade Rh entre mãe e feto).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-anticorpos-antigenos', term: 'Anticorpos e Antígenos', subject: 'Biologia', category: 'definicao',
    definition: 'Antígeno é qualquer substância capaz de desencadear uma resposta imune; anticorpo é a proteína produzida pelo sistema imunológico pra reconhecer e neutralizar um antígeno específico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mutacao-genetica', term: 'Mutação Genética', subject: 'Biologia', category: 'definicao',
    definition: 'Alteração na sequência do DNA de um organismo, podendo ser espontânea ou causada por agentes mutagênicos (radiação, certos produtos químicos), fonte primária de variabilidade genética pra evolução.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-dna-recombinante', term: 'DNA Recombinante (Engenharia Genética)', subject: 'Biologia', category: 'definicao',
    definition: 'Técnica que combina DNA de diferentes organismos, permitindo inserir genes específicos em outro organismo — base da produção de insulina humana por bactérias e de plantas transgênicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reino-animalia', term: 'Reino Animalia', subject: 'Biologia', category: 'definicao',
    definition: 'Reino que reúne os animais, organismos eucariontes, multicelulares e heterótrofos, classificados por características como presença de coluna vertebral (vertebrados) ou não (invertebrados).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reino-plantae', term: 'Reino Plantae', subject: 'Biologia', category: 'definicao',
    definition: 'Reino que reúne as plantas, organismos eucariontes, multicelulares, autótrofos por fotossíntese, divididos em briófitas, pteridófitas, gimnospermas e angiospermas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-hormonios-vegetais', term: 'Hormônios Vegetais', subject: 'Biologia', category: 'definicao',
    definition: 'Substâncias que regulam o crescimento e desenvolvimento das plantas, como a auxina (responsável pelo fototropismo, o crescimento em direção à luz).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-menstrual', term: 'Ciclo Menstrual', subject: 'Biologia', category: 'definicao',
    definition: 'Ciclo hormonal mensal do sistema reprodutor feminino, regulado por estrógeno e progesterona, que prepara o corpo pra uma possível gravidez, incluindo a ovulação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-desenvolvimento-embrionario', term: 'Desenvolvimento Embrionário', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de etapas pelas quais o zigoto se transforma num organismo completo: clivagem, gastrulação (formação das camadas germinativas) e organogênese (formação dos órgãos).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-teia-alimentar', term: 'Teia Alimentar', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de várias cadeias alimentares interligadas num ecossistema, representando de forma mais realista as relações alimentares entre organismos do que uma única cadeia linear.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-piramides-ecologicas', term: 'Pirâmides Ecológicas', subject: 'Biologia', category: 'definicao',
    definition: 'Representações gráficas que mostram a quantidade de energia, biomassa ou número de indivíduos em cada nível trófico de um ecossistema, geralmente diminuindo dos produtores até os últimos consumidores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-fosforo', term: 'Ciclo do Fósforo', subject: 'Biologia', category: 'definicao',
    definition: 'Circulação do fósforo entre rochas, solo, água e seres vivos, elemento essencial pra moléculas como DNA e ATP, sem passar por uma fase gasosa significativa (diferente dos ciclos do carbono e nitrogênio).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pasteur', term: 'Louis Pasteur', subject: 'Biologia', category: 'pessoa',
    definition: 'Químico e microbiologista francês, criador da pasteurização e um dos pais da microbiologia moderna, derrubou a teoria da geração espontânea e desenvolveu vacinas, incluindo a da raiva.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Louis_Pasteur.jpg', extra_info: '1822 – 1895',
  },
  {
    id: 'fb-hooke', term: 'Robert Hooke', subject: 'Biologia', category: 'pessoa',
    definition: 'Cientista inglês que, ao observar uma fatia de cortiça num microscópio rudimentar, foi o primeiro a descrever e nomear as "células" (1665), termo usado até hoje na biologia.',
    examples: null, image_url: null, extra_info: '1635 – 1703',
  },

  // ---- Química (bloco 4) ----
  {
    id: 'fb-diluicao', term: 'Diluição de Soluções', subject: 'Química', category: 'definicao',
    definition: 'Processo de reduzir a concentração de uma solução adicionando mais solvente, mantendo a quantidade de soluto constante (M1.V1 = M2.V2).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-titulacao', term: 'Titulação', subject: 'Química', category: 'definicao',
    definition: 'Técnica de laboratório usada pra determinar a concentração desconhecida de uma solução, adicionando gradualmente uma solução de concentração conhecida até a reação se completar (ponto de equivalência).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-constante-equilibrio', term: 'Constante de Equilíbrio (Kc)', subject: 'Química', category: 'definicao',
    definition: 'Valor numérico que expressa a relação entre as concentrações de produtos e reagentes num equilíbrio químico, indicando se o equilíbrio favorece produtos (Kc alto) ou reagentes (Kc baixo).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-le-chatelier', term: 'Princípio de Le Chatelier', subject: 'Química', category: 'definicao',
    definition: 'Quando um sistema em equilíbrio sofre uma perturbação (mudança de concentração, temperatura ou pressão), ele se desloca no sentido de minimizar essa perturbação e restabelecer um novo equilíbrio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-poh', term: 'pOH', subject: 'Química', category: 'definicao',
    definition: 'Medida da concentração de íons hidroxila (OH-) numa solução, complementar ao pH: pH + pOH = 14 (a 25°C).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-solucao-tampao', term: 'Solução Tampão', subject: 'Química', category: 'definicao',
    definition: 'Solução que resiste a variações bruscas de pH quando pequenas quantidades de ácido ou base são adicionadas, essencial pra manter o pH estável em sistemas biológicos, como o sangue.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ligas-metalicas', term: 'Ligas Metálicas', subject: 'Química', category: 'definicao',
    definition: 'Misturas de dois ou mais metais (ou metal com não-metal) que resultam num material com propriedades melhoradas em relação aos metais puros.',
    examples: 'Aço (ferro + carbono) e bronze (cobre + estanho) são ligas metálicas comuns.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-corrosao', term: 'Corrosão', subject: 'Química', category: 'definicao',
    definition: 'Processo de deterioração de um metal por reação química (geralmente oxidação) com o ambiente, como a formação de ferrugem no ferro exposto a oxigênio e umidade.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-eletrolise', term: 'Eletrólise', subject: 'Química', category: 'definicao',
    definition: 'Processo que usa corrente elétrica pra forçar uma reação química não espontânea, decompondo uma substância — o inverso do que acontece numa pilha.',
    examples: 'A eletrólise da água a decompõe em gás hidrogênio e gás oxigênio.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-nomenclatura-organica', term: 'Nomenclatura de Compostos Orgânicos (IUPAC)', subject: 'Química', category: 'definicao',
    definition: 'Sistema padronizado de regras pra nomear compostos orgânicos de forma única e universal, baseado no tamanho da cadeia carbônica e nos grupos funcionais presentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cetonas-aldeidos', term: 'Cetonas e Aldeídos', subject: 'Química', category: 'definicao',
    definition: 'Funções orgânicas que contêm o grupo carbonila (C=O): em cetonas, esse grupo está entre dois carbonos; em aldeídos, está numa extremidade da cadeia, ligado a um hidrogênio.',
    examples: 'Acetona (removedor de esmalte) é uma cetona; formaldeído é um aldeído.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-eteres', term: 'Éteres', subject: 'Química', category: 'definicao',
    definition: 'Função orgânica em que um átomo de oxigênio está ligado a duas cadeias carbônicas (R-O-R), geralmente com baixo ponto de ebulição e usados como solventes e anestésicos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-haletos-organicos', term: 'Haletos Orgânicos', subject: 'Química', category: 'definicao',
    definition: 'Compostos orgânicos em que um ou mais átomos de halogênio (flúor, cloro, bromo, iodo) substituem hidrogênios na cadeia carbônica.',
    examples: 'O clorofórmio e o CFC (usado em antigos aerossóis, hoje proibido por afetar a camada de ozônio) são haletos orgânicos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-petroleo', term: 'Petróleo e Derivados', subject: 'Química', category: 'definicao',
    definition: 'Mistura natural de hidrocarbonetos, refinada por destilação fracionada pra gerar produtos como gasolina, diesel, querosene, GLP e matéria-prima pra plásticos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-elemento-substancia', term: 'Elemento Químico, Substância Simples e Composta', subject: 'Química', category: 'definicao',
    definition: 'Elemento químico é um tipo de átomo (definido pelo número atômico); substância simples é formada por um único elemento (O2); substância composta é formada por dois ou mais elementos diferentes (H2O).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-numero-atomico-massa', term: 'Número Atômico e Número de Massa', subject: 'Química', category: 'definicao',
    definition: 'Número atômico (Z) é a quantidade de prótons no núcleo, define o elemento químico; número de massa (A) é a soma de prótons e nêutrons.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-configuracao-eletronica', term: 'Configuração Eletrônica', subject: 'Química', category: 'definicao',
    definition: 'Distribuição dos elétrons de um átomo em camadas e subníveis de energia, seguindo o diagrama de Linus Pauling, determinando as propriedades químicas do elemento.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-dalton', term: 'John Dalton', subject: 'Química', category: 'pessoa',
    definition: 'Químico e físico inglês que propôs o primeiro modelo atômico moderno (1803), descrevendo o átomo como uma esfera maciça e indivisível — o modelo da "bola de bilhar".',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/John_Dalton_by_Charles_Turner.jpg', extra_info: '1766 – 1844',
  },
  {
    id: 'fb-rutherford', term: 'Ernest Rutherford', subject: 'Química', category: 'pessoa',
    definition: 'Físico e químico neozelandês, propôs o modelo atômico nuclear (1911) a partir de seu experimento com folha de ouro, mostrando que o átomo tem um núcleo pequeno, denso e positivo, cercado por elétrons.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Ernest_Rutherford_1908.jpg', extra_info: '1871 – 1937',
  },
  {
    id: 'fb-bohr', term: 'Niels Bohr', subject: 'Química', category: 'pessoa',
    definition: 'Físico dinamarquês que aperfeiçoou o modelo atômico de Rutherford, propondo que os elétrons ocupam órbitas (camadas) com níveis de energia definidos ao redor do núcleo.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Niels_Bohr.jpg', extra_info: '1885 – 1962',
  },

  // ---- Física (bloco 4) ----
  {
    id: 'fb-energia-potencial-elastica', term: 'Energia Potencial Elástica', subject: 'Física', category: 'definicao',
    definition: 'Energia armazenada num corpo elástico (mola, elástico) quando é comprimido ou esticado, calculada por Ep = kx²/2, onde k é a constante elástica e x a deformação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-si', term: 'Sistema Internacional de Unidades (SI)', subject: 'Física', category: 'definicao',
    definition: 'Sistema padronizado internacionalmente de unidades de medida (metro, quilograma, segundo, ampère, kelvin, mol, candela), usado pra garantir uniformidade em medições científicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-grandezas-escalares-vetoriais', term: 'Grandezas Escalares e Vetoriais', subject: 'Física', category: 'definicao',
    definition: 'Grandezas escalares são definidas apenas por um número e uma unidade (massa, temperatura); grandezas vetoriais precisam também de direção e sentido (velocidade, força).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-resultante-forcas', term: 'Resultante de Forças', subject: 'Física', category: 'definicao',
    definition: 'Força única equivalente ao efeito combinado de todas as forças atuando sobre um corpo, obtida pela soma vetorial dessas forças.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-plano-inclinado', term: 'Plano Inclinado', subject: 'Física', category: 'definicao',
    definition: 'Superfície inclinada em relação à horizontal, usada pra decompor o peso de um corpo em componentes paralela e perpendicular ao plano, facilitando o estudo de forças em rampas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-forca-atrito', term: 'Força de Atrito', subject: 'Física', category: 'definicao',
    definition: 'Força que se opõe ao movimento relativo entre duas superfícies em contato, podendo ser estática (impede o início do movimento) ou cinética (atua durante o movimento).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-olho-humano', term: 'Olho Humano e Defeitos de Visão', subject: 'Física', category: 'definicao',
    definition: 'O olho funciona como um sistema óptico com uma lente (cristalino) que foca a luz na retina. Miopia (dificuldade de ver de longe) e hipermetropia (dificuldade de ver de perto) são corrigidas com lentes divergentes e convergentes, respectivamente.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-acustica', term: 'Acústica (Som)', subject: 'Física', category: 'definicao',
    definition: 'Ramo da física que estuda o som, uma onda mecânica que se propaga por um meio material, caracterizada por frequência (altura do som), amplitude (intensidade/volume) e timbre.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-escalas-termometricas', term: 'Escalas Termométricas', subject: 'Física', category: 'definicao',
    definition: 'Sistemas usados pra medir temperatura: Celsius (°C, água congela a 0° e ferve a 100°), Fahrenheit (°F, usada nos EUA) e Kelvin (K, escala absoluta usada na ciência, 0K é o zero absoluto).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-calorimetria', term: 'Calorimetria', subject: 'Física', category: 'definicao',
    definition: 'Ramo da física que estuda a troca de calor entre corpos, calculada por Q = m.c.ΔT, onde c é o calor específico do material.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mudancas-estado-fisico', term: 'Mudanças de Estado Físico', subject: 'Física', category: 'definicao',
    definition: 'Transformações entre os estados sólido, líquido e gasoso da matéria: fusão, solidificação, vaporização, condensação, sublimação e ressublimação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-radiacao-termica', term: 'Radiação Térmica', subject: 'Física', category: 'definicao',
    definition: 'Forma de transferência de calor através de ondas eletromagnéticas, sem necessidade de um meio material — é assim que o calor do Sol chega até a Terra através do vácuo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-potencia-eletrica', term: 'Potência Elétrica', subject: 'Física', category: 'definicao',
    definition: 'Taxa de conversão ou transferência de energia elétrica por unidade de tempo, medida em watts (W), calculada por P = V.i (tensão vezes corrente).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-transformadores', term: 'Transformadores Elétricos', subject: 'Física', category: 'definicao',
    definition: 'Dispositivos que usam indução eletromagnética pra aumentar (elevador) ou diminuir (abaixador) a tensão de uma corrente alternada, essenciais na transmissão de energia elétrica a longas distâncias.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-semicondutores', term: 'Semicondutores', subject: 'Física', category: 'definicao',
    definition: 'Materiais com condutividade elétrica intermediária entre condutores e isolantes, cuja condutividade pode ser controlada — base de transistores, diodos e de toda a eletrônica moderna.',
    examples: 'O silício é o semicondutor mais usado na fabricação de chips.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-fissao-nuclear', term: 'Fissão Nuclear', subject: 'Física', category: 'definicao',
    definition: 'Processo em que o núcleo de um átomo pesado (como urânio-235) se divide em núcleos menores, liberando grande quantidade de energia — usado em usinas nucleares e bombas atômicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fusao-nuclear', term: 'Fusão Nuclear', subject: 'Física', category: 'definicao',
    definition: 'Processo em que dois núcleos leves se unem pra formar um núcleo mais pesado, liberando ainda mais energia que a fissão — é o processo que ocorre no núcleo das estrelas, incluindo o Sol.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-buracos-negros', term: 'Buracos Negros', subject: 'Física', category: 'definicao',
    definition: 'Regiões do espaço com campo gravitacional tão intenso que nada, nem mesmo a luz, consegue escapar, formadas geralmente pelo colapso gravitacional de estrelas muito massivas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-planck', term: 'Max Planck', subject: 'Física', category: 'pessoa',
    definition: 'Físico alemão considerado o pai da física quântica, propôs em 1900 que a energia é emitida em pacotes discretos (quanta), ideia que revolucionou a física do século 20.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Max_Planck_%281858-1947%29.jpg', extra_info: '1858 – 1947',
  },
  {
    id: 'fb-maxwell', term: 'James Clerk Maxwell', subject: 'Física', category: 'pessoa',
    definition: 'Físico e matemático escocês que unificou eletricidade, magnetismo e luz numa única teoria (equações de Maxwell), mostrando que a luz é uma onda eletromagnética.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/James_Clerk_Maxwell.jpg', extra_info: '1831 – 1879',
  },

  // ---- Matemática (bloco 4) ----
  {
    id: 'fb-equacao-circunferencia', term: 'Equação da Circunferência', subject: 'Matemática', category: 'definicao',
    definition: 'Equação (x-a)² + (y-b)² = r², que representa todos os pontos a uma distância r (raio) de um centro (a,b) no plano cartesiano.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-coeficiente-angular', term: 'Coeficiente Angular de uma Reta', subject: 'Matemática', category: 'definicao',
    definition: 'Número que indica a inclinação de uma reta em relação ao eixo x, calculado pela razão entre a variação de y e a variação de x entre dois pontos da reta.',
    examples: 'Coeficiente angular positivo indica reta crescente; negativo, reta decrescente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-soma-pa-pg', term: 'Soma dos Termos de uma PA e PG', subject: 'Matemática', category: 'definicao',
    definition: 'Fórmulas pra somar os termos de uma progressão: numa PA, Sn = (a1+an).n/2; numa PG finita, Sn = a1.(qⁿ-1)/(q-1).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-taxa-variacao', term: 'Taxa de Variação', subject: 'Matemática', category: 'definicao',
    definition: 'Medida de quanto uma grandeza muda em relação à outra, calculada pela razão entre a variação da saída e a variação da entrada de uma função.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-maximos-minimos', term: 'Máximos e Mínimos de uma Função', subject: 'Matemática', category: 'definicao',
    definition: 'Pontos onde uma função atinge seu maior (máximo) ou menor (mínimo) valor, num intervalo ou em todo o domínio — no gráfico de uma parábola, é o vértice.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-conjuntos', term: 'Conjuntos (União e Interseção)', subject: 'Matemática', category: 'definicao',
    definition: 'União de dois conjuntos reúne todos os elementos de ambos; interseção reúne apenas os elementos que estão presentes nos dois conjuntos ao mesmo tempo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-logica-matematica', term: 'Lógica Matemática (Proposições)', subject: 'Matemática', category: 'definicao',
    definition: 'Estudo de sentenças que podem ser classificadas como verdadeiras ou falsas (proposições), e de como combiná-las usando conectivos lógicos (e, ou, não, se-então).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcoes-pares-impares', term: 'Funções Pares e Ímpares', subject: 'Matemática', category: 'definicao',
    definition: 'Função par tem simetria em relação ao eixo y (f(-x) = f(x)); função ímpar tem simetria em relação à origem (f(-x) = -f(x)).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-nocao-limite', term: 'Noção Intuitiva de Limite', subject: 'Matemática', category: 'definicao',
    definition: 'Valor que uma função se aproxima conforme a variável independente se aproxima de um determinado ponto, conceito base do cálculo diferencial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-nocao-derivada', term: 'Noção Intuitiva de Derivada', subject: 'Matemática', category: 'definicao',
    definition: 'Taxa de variação instantânea de uma função num ponto, representando a inclinação da reta tangente ao gráfico naquele ponto.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-matematica-financeira', term: 'Matemática Financeira (Montante e Desconto)', subject: 'Matemática', category: 'definicao',
    definition: 'Montante é o valor total acumulado após aplicação de juros sobre um capital; desconto é a redução aplicada ao valor de um título pago antes do vencimento.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-binario', term: 'Sistema de Numeração Binário', subject: 'Matemática', category: 'definicao',
    definition: 'Sistema de numeração que usa apenas dois dígitos (0 e 1), base de funcionamento de todos os computadores e dispositivos digitais.',
    examples: 'O número decimal 5 é representado como 101 em binário.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-congruencia-triangulos', term: 'Congruência de Triângulos', subject: 'Matemática', category: 'definicao',
    definition: 'Dois triângulos são congruentes quando têm exatamente o mesmo tamanho e formato, com lados e ângulos correspondentes iguais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-angulos-comp-supl', term: 'Ângulos Complementares e Suplementares', subject: 'Matemática', category: 'definicao',
    definition: 'Ângulos complementares somam 90°; ângulos suplementares somam 180°.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-poligonos-regulares', term: 'Polígonos Regulares', subject: 'Matemática', category: 'definicao',
    definition: 'Polígonos com todos os lados e todos os ângulos internos iguais, como o triângulo equilátero, o quadrado e o hexágono regular.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fermat', term: 'Pierre de Fermat', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático francês, um dos fundadores do cálculo moderno e da teoria dos números, famoso pelo "Último Teorema de Fermat", enunciado por ele mas só demonstrado 358 anos depois.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Pierre_de_Fermat.jpg', extra_info: '1601 – 1665',
  },
  {
    id: 'fb-gauss', term: 'Carl Friedrich Gauss', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático alemão considerado um dos maiores de todos os tempos, com contribuições fundamentais em álgebra, geometria, estatística (curva normal, ou "curva de Gauss") e teoria dos números.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Carl_Friedrich_Gauss_1840_by_Jensen.jpg', extra_info: '1777 – 1855',
  },
  {
    id: 'fb-amplitude-periodo', term: 'Amplitude e Período de Funções Trigonométricas', subject: 'Matemática', category: 'definicao',
    definition: 'Amplitude é a distância entre o valor máximo e o valor médio de uma função trigonométrica; período é o intervalo necessário pra a função completar um ciclo completo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-naturais-inteiros', term: 'Números Naturais e Inteiros', subject: 'Matemática', category: 'definicao',
    definition: 'Números naturais são os usados pra contar (0, 1, 2, 3...); números inteiros incluem também os negativos (..., -2, -1, 0, 1, 2...).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regra-sinais', term: 'Regra de Sinais', subject: 'Matemática', category: 'definicao',
    definition: 'Regras pra operações com números positivos e negativos: na multiplicação e divisão, sinais iguais dão resultado positivo, sinais diferentes dão resultado negativo.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- História (bloco 4) ----
  {
    id: 'fb-revolucao-gloriosa', term: 'Revolução Gloriosa', subject: 'História', category: 'definicao',
    definition: 'Revolução inglesa de 1688 que depôs o rei Jaime II sem derramamento de sangue significativo, estabelecendo uma monarquia parlamentar e limitando os poderes do rei na Inglaterra.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reforma-protestante', term: 'Reforma Protestante', subject: 'História', category: 'definicao',
    definition: 'Movimento religioso do século 16, iniciado por Martinho Lutero, que rompeu com a Igreja Católica e deu origem às igrejas protestantes, questionando práticas como a venda de indulgências.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cruzadas', term: 'Cruzadas', subject: 'História', category: 'definicao',
    definition: 'Série de expedições militares religiosas organizadas pela Igreja Católica entre os séculos 11 e 13, com o objetivo declarado de retomar Jerusalém e a Terra Santa do domínio muçulmano.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-peste-negra', term: 'Peste Negra', subject: 'História', category: 'definicao',
    definition: 'Pandemia de peste bubônica que assolou a Europa no século 14, matando entre um terço e metade da população do continente, com profundos impactos sociais e econômicos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-imperio-romano', term: 'Império Romano', subject: 'História', category: 'definicao',
    definition: 'Uma das maiores civilizações da Antiguidade, que dominou grande parte da Europa, norte da África e Oriente Médio, deixando heranças duradouras em direito, arquitetura, língua e organização política.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-grecia-antiga', term: 'Grécia Antiga (Democracia Ateniense)', subject: 'História', category: 'definicao',
    definition: 'Civilização berço da filosofia ocidental e da democracia, especialmente na cidade-estado de Atenas, onde cidadãos (uma parcela restrita da população) participavam diretamente das decisões políticas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolucao-cravos', term: 'Revolução dos Cravos', subject: 'História', category: 'definicao',
    definition: 'Golpe militar de 1974 em Portugal que derrubou pacificamente a ditadura do Estado Novo português, marcando o início da democratização do país.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-anistia', term: 'Lei de Anistia (1979)', subject: 'História', category: 'definicao',
    definition: 'Lei brasileira que perdoou crimes políticos cometidos durante a ditadura militar, tanto por opositores quanto por agentes do Estado, permitindo o retorno de exilados políticos ao país.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolta-vacina', term: 'Revolta da Vacina', subject: 'História', category: 'definicao',
    definition: 'Levante popular no Rio de Janeiro em 1904 contra a vacinação obrigatória contra a varíola, imposta de forma autoritária pelo governo, refletindo também insatisfações sociais mais amplas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolucao-constitucionalista', term: 'Revolução Constitucionalista de 1932', subject: 'História', category: 'definicao',
    definition: 'Movimento armado liderado por São Paulo contra o governo de Getúlio Vargas, exigindo uma nova Constituição para o Brasil — o estado paulista foi derrotado militarmente, mas a Constituição foi promulgada em 1934.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-cem-anos', term: 'Guerra dos Cem Anos', subject: 'História', category: 'definicao',
    definition: 'Série de conflitos entre Inglaterra e França (1337-1453) pela sucessão do trono francês, marcada pela atuação de Joana d\'Arc na fase final, vencida pelos franceses.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-primavera-povos', term: 'Primavera dos Povos (1848)', subject: 'História', category: 'definicao',
    definition: 'Onda de revoluções liberais e nacionalistas que varreu diversos países europeus em 1848, exigindo constituições, direitos civis e, em alguns casos, unificação nacional.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-partilha-africa', term: 'Partilha da África (Conferência de Berlim)', subject: 'História', category: 'definicao',
    definition: 'Reunião de potências europeias em 1884-1885 que estabeleceu regras pra divisão colonial do continente africano, ignorando fronteiras étnicas e culturais locais — origem de muitos conflitos africanos posteriores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-golfo', term: 'Guerra do Golfo', subject: 'História', category: 'definicao',
    definition: 'Conflito de 1990-1991 em que uma coalizão liderada pelos Estados Unidos expulsou as tropas iraquianas que haviam invadido o Kuwait, sob o comando de Saddam Hussein.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-onze-setembro', term: 'Atentados de 11 de Setembro', subject: 'História', category: 'definicao',
    definition: 'Ataques terroristas de 2001 contra as Torres Gêmeas em Nova York e o Pentágono, promovidos pela Al-Qaeda, que mudaram profundamente a política externa e de segurança dos Estados Unidos e do mundo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mandela', term: 'Nelson Mandela', subject: 'História', category: 'pessoa',
    definition: 'Líder político sul-africano, preso por 27 anos por lutar contra o apartheid, tornou-se o primeiro presidente negro da África do Sul (1994), símbolo mundial de reconciliação e luta por direitos civis.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Nelson_Mandela_1994.jpg', extra_info: '1918 – 2013',
  },
  {
    id: 'fb-mlk', term: 'Martin Luther King Jr.', subject: 'História', category: 'pessoa',
    definition: 'Pastor e ativista norte-americano, principal liderança do Movimento dos Direitos Civis nos EUA, defensor da resistência não-violenta, ganhador do Prêmio Nobel da Paz em 1964, assassinado em 1968.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Martin_Luther_King%2C_Jr..jpg', extra_info: '1929 – 1968',
  },
  {
    id: 'fb-che-guevara', term: 'Che Guevara', subject: 'História', category: 'pessoa',
    definition: 'Revolucionário argentino, uma das principais lideranças da Revolução Cubana ao lado de Fidel Castro, tornou-se um ícone global da luta revolucionária de esquerda.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Che_Guevara%2C_Guerrillero_Heroico.jpg', extra_info: '1928 – 1967',
  },
  {
    id: 'fb-joana-darc', term: 'Joana d\'Arc', subject: 'História', category: 'pessoa',
    definition: 'Camponesa francesa que, dizendo-se guiada por visões divinas, liderou tropas francesas em vitórias importantes durante a Guerra dos Cem Anos. Capturada e julgada por heresia, foi queimada na fogueira aos 19 anos.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/John_Everett_Millais_-_Joan_of_Arc.jpg', extra_info: '1412 – 1431',
  },
  {
    id: 'fb-revolucao-1817', term: 'Revolução de 1817 (Pernambuco)', subject: 'História', category: 'definicao',
    definition: 'Movimento separatista e republicano em Pernambuco, motivado por insatisfações econômicas e políticas com a Coroa Portuguesa, duramente reprimido após cerca de 75 dias.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Geografia (bloco 4) ----
  {
    id: 'fb-relevo-brasileiro', term: 'Relevo Brasileiro', subject: 'Geografia', category: 'definicao',
    definition: 'O relevo do Brasil é predominantemente formado por planaltos (cerca de 60% do território) e planícies, sem grandes cadeias montanhosas, já que o país fica numa região tectonicamente estável.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-climas-brasil', term: 'Climas do Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'O Brasil apresenta principalmente clima tropical, mas também equatorial (Amazônia), semiárido (sertão nordestino), tropical de altitude e subtropical (Sul do país).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-aquifero-guarani', term: 'Aquífero Guarani', subject: 'Geografia', category: 'definicao',
    definition: 'Um dos maiores reservatórios de água doce subterrânea do mundo, localizado sob território de Brasil, Argentina, Paraguai e Uruguai, importante fonte estratégica de água.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-setores-economia', term: 'Setores da Economia', subject: 'Geografia', category: 'definicao',
    definition: 'Setor primário (extração de recursos naturais, agropecuária), setor secundário (indústria, transformação) e setor terciário (serviços, comércio) — divisão clássica das atividades econômicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pib', term: 'PIB (Produto Interno Bruto)', subject: 'Geografia', category: 'definicao',
    definition: 'Soma de todos os bens e serviços produzidos num país durante um período, um dos principais indicadores usados pra medir o tamanho de uma economia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-balanca-comercial', term: 'Balança Comercial', subject: 'Geografia', category: 'definicao',
    definition: 'Diferença entre o valor das exportações e importações de um país num determinado período — superávit quando exporta mais do que importa, déficit no caso contrário.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-gentrificacao', term: 'Gentrificação', subject: 'Geografia', category: 'definicao',
    definition: 'Processo de valorização de uma área urbana antes popular ou degradada, que acaba expulsando os moradores originais de baixa renda pra dar lugar a uma população de maior poder aquisitivo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-conurbacao', term: 'Conurbação e Metropolização', subject: 'Geografia', category: 'definicao',
    definition: 'Conurbação é a fusão física de duas ou mais cidades vizinhas que crescem até se tocarem; metropolização é o processo de formação de uma grande região metropolitana ao redor de uma cidade polo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-rede-urbana', term: 'Rede Urbana e Hierarquia Urbana', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de cidades de uma região e as relações econômicas e de influência entre elas, organizadas hierarquicamente conforme o porte e a importância de cada centro urbano.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-latifundio-minifundio', term: 'Latifúndio e Minifúndio', subject: 'Geografia', category: 'definicao',
    definition: 'Latifúndio é uma propriedade rural de grande extensão, muitas vezes subutilizada; minifúndio é uma propriedade pequena, geralmente insuficiente pra sustentar uma família com produção comercial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-extrativismo', term: 'Extrativismo', subject: 'Geografia', category: 'definicao',
    definition: 'Atividade econômica baseada na coleta ou extração direta de recursos naturais, sem cultivo ou criação — pode ser vegetal (látex, castanha), animal (pesca) ou mineral (minério, petróleo).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mineracao-brasil', term: 'Mineração no Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'Atividade econômica de extração de minerais, historicamente concentrada em Minas Gerais (ouro, minério de ferro) e hoje também forte no Norte do país (Carajás, no Pará).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-combustiveis-fosseis', term: 'Combustíveis Fósseis', subject: 'Geografia', category: 'definicao',
    definition: 'Fontes de energia não-renováveis formadas ao longo de milhões de anos a partir de matéria orgânica em decomposição, como petróleo, carvão mineral e gás natural — principais responsáveis pelo aumento do efeito estufa.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-desenvolvimento-sustentavel', term: 'Desenvolvimento Sustentável', subject: 'Geografia', category: 'definicao',
    definition: 'Modelo de desenvolvimento que busca atender as necessidades do presente sem comprometer a capacidade das futuras gerações de atender suas próprias necessidades, equilibrando economia, sociedade e meio ambiente.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-acordo-paris', term: 'Acordo de Paris', subject: 'Geografia', category: 'definicao',
    definition: 'Tratado internacional de 2015 no qual países se comprometeram a limitar o aquecimento global a bem abaixo de 2°C em relação aos níveis pré-industriais, reduzindo emissões de gases de efeito estufa.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fronteiras-politicas', term: 'Fronteiras Políticas', subject: 'Geografia', category: 'definicao',
    definition: 'Limites que delimitam o território de um Estado, podendo ser naturais (rios, montanhas) ou artificiais (linhas retas definidas por tratados), muitas vezes fonte de conflitos internacionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-estado-nacao-territorio', term: 'Estado, Nação e Território', subject: 'Geografia', category: 'definicao',
    definition: 'Estado é a organização político-jurídica com governo e soberania; nação é um grupo unido por identidade cultural, histórica ou linguística; território é o espaço geográfico delimitado sobre o qual um Estado exerce soberania.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-inflacao', term: 'Inflação', subject: 'Geografia', category: 'definicao',
    definition: 'Aumento generalizado e contínuo dos preços de bens e serviços numa economia, reduzindo o poder de compra da moeda ao longo do tempo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cartografia', term: 'Cartografia (Projeções Cartográficas)', subject: 'Geografia', category: 'definicao',
    definition: 'Ciência de representar a superfície curva da Terra num mapa plano, processo que sempre gera alguma distorção — diferentes projeções (Mercator, Peters) priorizam preservar diferentes aspectos (forma, área, distância).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-litoral-erosao', term: 'Litoral e Erosão Costeira', subject: 'Geografia', category: 'definicao',
    definition: 'O litoral é a faixa de transição entre o continente e o oceano; a erosão costeira é o desgaste progressivo dessa faixa pela ação das ondas, correntes e, cada vez mais, pela elevação do nível do mar.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Inglês (bloco 4) ----
  {
    id: 'fb-too-enough', term: 'Too / Enough', subject: 'Inglês', category: 'definicao',
    definition: '"Too" indica excesso (antes do adjetivo); "enough" indica suficiência (depois do adjetivo, antes do substantivo).',
    examples: '"This coffee is too hot." / "I don\'t have enough time."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-so-such', term: 'So / Such', subject: 'Inglês', category: 'definicao',
    definition: '"So" é usado antes de adjetivo ou advérbio sozinho; "such" é usado antes de um substantivo (com ou sem adjetivo).',
    examples: '"It was so difficult." / "It was such a difficult test."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-either-neither-both', term: 'Either / Neither / Both', subject: 'Inglês', category: 'definicao',
    definition: '"Either" (um ou outro, afirmativo), "neither" (nenhum dos dois, negativo) e "both" (os dois) são usados pra falar de duas opções ou pessoas.',
    examples: '"You can take either option." / "Neither of them came." / "Both are correct."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-stative-verbs', term: 'Stative Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Verbos que descrevem estados, não ações (like, know, believe, want, own), geralmente não usados na forma contínua (-ing).',
    examples: '"I know the answer" (não "I am knowing the answer").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ellipsis', term: 'Ellipsis (Omission in English)', subject: 'Inglês', category: 'definicao',
    definition: 'Omissão de palavras numa frase quando o sentido pode ser entendido pelo contexto, comum em respostas curtas e conversas informais.',
    examples: '"Are you coming?" "Yes, I am [coming]."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-cohesion-coherence', term: 'Cohesion and Coherence', subject: 'Inglês', category: 'definicao',
    definition: 'Coesão é a conexão gramatical entre frases (usando conectores, pronomes); coerência é a lógica e o sentido geral do texto como um todo — os dois juntos fazem um texto fluir bem.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-topic-sentence', term: 'Topic Sentence', subject: 'Inglês', category: 'definicao',
    definition: 'Frase que resume a ideia principal de um parágrafo, geralmente localizada no início dele, orientando o leitor sobre o que virá a seguir.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-modals-deduction', term: 'Modals of Deduction and Probability', subject: 'Inglês', category: 'definicao',
    definition: 'Uso de modal verbs pra expressar graus de certeza sobre uma situação: "must" (quase certeza), "might/may/could" (possibilidade), "can\'t" (quase impossível).',
    examples: '"She must be tired." (deve estar) / "It might rain." (pode ser que chova)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-reflexive-pronouns', term: 'Reflexive Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Pronomes que indicam que o sujeito pratica e recebe a ação ao mesmo tempo: myself, yourself, himself, herself, itself, ourselves, yourselves, themselves.',
    examples: '"I hurt myself." (Eu me machuquei.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-demonstrative-pronouns', term: 'Demonstrative Pronouns', subject: 'Inglês', category: 'definicao',
    definition: 'Pronomes usados pra indicar proximidade ou distância de algo: "this/these" (perto), "that/those" (longe).',
    examples: '"This is my book." / "Those are her shoes."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-verb-prep-collocations', term: 'Verb + Preposition Collocations', subject: 'Inglês', category: 'definicao',
    definition: 'Combinações fixas entre verbos e preposições específicas, que não seguem uma regra lógica e precisam ser memorizadas.',
    examples: '"Depend on", "listen to", "look for", "wait for".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-collocations', term: 'Collocations', subject: 'Inglês', category: 'definicao',
    definition: 'Combinações de palavras que costumam aparecer juntas naturalmente na língua, mesmo sem uma regra gramatical explícita.',
    examples: '"Make a decision" (não "do a decision"); "heavy rain" (não "strong rain").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-synonyms-antonyms', term: 'Synonyms and Antonyms', subject: 'Inglês', category: 'definicao',
    definition: 'Sinônimos são palavras com significado semelhante; antônimos são palavras com significado oposto — ambos muito cobrados em questões de vocabulário e interpretação de texto.',
    examples: '"Happy" (sinônimo: glad; antônimo: sad).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-british-american', term: 'British vs American English', subject: 'Inglês', category: 'definicao',
    definition: 'Diferenças de vocabulário, ortografia e, às vezes, gramática entre o inglês britânico e o americano.',
    examples: '"Colour" (BrE) vs "color" (AmE); "flat" (BrE) vs "apartment" (AmE).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-zero-conditional', term: 'Zero Conditional', subject: 'Inglês', category: 'definicao',
    definition: 'Usado pra fatos gerais e verdades sempre válidas: If + Simple Present, Simple Present.',
    examples: '"If you heat water to 100°C, it boils."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-first-conditional', term: 'First Conditional', subject: 'Inglês', category: 'definicao',
    definition: 'Usado pra situações futuras reais e prováveis: If + Simple Present, will + verbo.',
    examples: '"If it rains, I will stay home."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-second-conditional', term: 'Second Conditional', subject: 'Inglês', category: 'definicao',
    definition: 'Usado pra situações hipotéticas ou improváveis no presente/futuro: If + Simple Past, would + verbo.',
    examples: '"If I had more money, I would travel the world."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-third-conditional', term: 'Third Conditional', subject: 'Inglês', category: 'definicao',
    definition: 'Usado pra situações hipotéticas no passado que não aconteceram (arrependimento/especulação): If + Past Perfect, would have + particípio.',
    examples: '"If I had studied more, I would have passed the exam."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-time-clauses', term: 'Time Clauses', subject: 'Inglês', category: 'definicao',
    definition: 'Orações que indicam quando uma ação acontece, introduzidas por conectores como "when", "while", "as soon as", "before", "after".',
    examples: '"I will call you as soon as I arrive."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-purpose-clauses', term: 'Purpose Clauses', subject: 'Inglês', category: 'definicao',
    definition: 'Orações que indicam a finalidade de uma ação, introduzidas por expressões como "so that" e "in order to".',
    examples: '"She studies hard in order to pass the exam."', image_url: null, extra_info: null,
  },

  // ---- Redação (pensadores/filósofos/sociólogos — frase + explicação pra repertório) ----
  {
    id: 'fb-sartre', term: 'Jean-Paul Sartre', subject: 'Redação', category: 'pessoa',
    definition: '1. "O homem está condenado a ser livre."\nPra Sartre, existimos antes de termos uma essência definida — por isso somos totalmente responsáveis pelas escolhas que fazemos, sem poder recorrer a destino, natureza ou Deus pra justificar nossos atos. Essa frase é ótima em redações sobre autonomia, responsabilidade individual e liberdade de escolha.\n\n2. "A existência precede a essência."\nFrase-chave do existencialismo: pra Sartre, o ser humano primeiro existe, e só depois, através de suas escolhas e ações, define quem é — não nascemos com um propósito ou natureza fixa. Complementa bem repertórios sobre identidade, autoconstrução e liberdade de escolha.',
    examples: null,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Jean_Paul_Sartre_1967.jpg', extra_info: '1905 – 1980',
  },
  {
    id: 'fb-bauman', term: 'Zygmunt Bauman', subject: 'Redação', category: 'pessoa',
    definition: '1. "Numa sociedade de consumidores, ninguém pode se tornar sujeito sem antes se tornar mercadoria."\nBauman, criador do conceito de "modernidade líquida", argumenta que na sociedade de consumo até as pessoas passam a se relacionar e se valorizar como produtos — moldando-se pra serem "consumidas" (curtidas, aceitas, desejadas). Excelente repertório pra redações sobre consumismo, redes sociais e relações humanas líquidas.\n\n2. "A identidade só nos é revelada como algo a ser inventado, não descoberto."\nBauman argumenta que, na modernidade líquida, a identidade deixou de ser algo fixo e dado (como classe social ou profissão herdada) e passou a ser um projeto constante que cada pessoa precisa construir e reconstruir ao longo da vida. Repertório rico pra redações sobre identidade, redes sociais e pressão por reinvenção constante.',
    examples: null,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Zygmunt_Bauman.jpg', extra_info: '1925 – 2017',
  },
  {
    id: 'fb-freire', term: 'Paulo Freire', subject: 'Redação', category: 'pessoa',
    definition: '1. "Ninguém educa ninguém, ninguém se educa a si mesmo, os homens se educam entre si, mediatizados pelo mundo."\nFreire critica a educação tradicional (em que o professor apenas "deposita" conhecimento no aluno) e defende uma educação dialógica, em que professor e aluno aprendem juntos a partir da realidade que os cerca. Repertório certeiro pra redações sobre educação, ensino público e o papel da escola na sociedade.\n\n2. "A leitura do mundo precede a leitura da palavra."\nFreire defende que a alfabetização de verdade vai além de decodificar letras — passa por entender criticamente o mundo ao redor antes mesmo de aprender a ler formalmente. Repertório muito citado em redações sobre educação, letramento e leitura crítica da realidade.',
    examples: null,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Paulo_Freire_1977.jpg', extra_info: '1921 – 1997',
  },
  {
    id: 'fb-beauvoir', term: 'Simone de Beauvoir', subject: 'Redação', category: 'pessoa',
    definition: '1. "Ninguém nasce mulher: torna-se mulher."\nEm "O Segundo Sexo", Beauvoir argumenta que ser mulher não é um destino biológico, mas uma construção social — os papéis, comportamentos e expectativas atribuídos às mulheres são criados pela cultura, não pela natureza. Repertório essencial pra redações sobre igualdade de gênero e papéis sociais.\n\n2. "A humanidade é masculina, e o homem define a mulher não em si mesma, mas relativamente a ele."\nEm "O Segundo Sexo", Beauvoir descreve como a sociedade historicamente trata o homem como o "padrão" universal e a mulher como o "Outro", definida sempre em relação a ele — nunca como sujeito independente. Complementa bem repertórios sobre desigualdade de gênero e representatividade.',
    examples: null,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Simone_de_Beauvoir_1955.jpg', extra_info: '1908 – 1986',
  },
  {
    id: 'fb-marx', term: 'Karl Marx', subject: 'Redação', category: 'pessoa',
    definition: '1. "A história de todas as sociedades até hoje existentes é a história da luta de classes."\nNo "Manifesto Comunista" (escrito com Friedrich Engels), Marx argumenta que todo conflito social ao longo da história tem raiz na disputa entre grupos com interesses econômicos opostos — quem detém os meios de produção e quem vende sua força de trabalho. Repertório clássico pra redações sobre desigualdade social e distribuição de renda.\n\n2. "Os filósofos apenas interpretaram o mundo de diferentes maneiras; a questão, porém, é transformá-lo."\nNa 11ª Tese sobre Feuerbach, Marx defende que não basta entender ou explicar os problemas do mundo — o papel da filosofia (e da ação política) é efetivamente transformar a realidade social. Repertório poderoso pra redações que pedem propostas de intervenção, não só diagnóstico do problema.',
    examples: null,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Karl_Marx.jpg', extra_info: '1818 – 1883',
  },

  // ---- Biologia (bloco 5) ----
  {
    id: 'fb-selecao-natural', term: 'Seleção Natural', subject: 'Biologia', category: 'definicao',
    definition: 'Mecanismo evolutivo proposto por Darwin em que indivíduos com características mais vantajosas pro ambiente têm maior chance de sobreviver e se reproduzir, passando essas características adiante.',
    examples: 'Mariposas de cor escura se tornaram mais comuns em áreas poluídas da Inglaterra, por serem mais bem camufladas contra predadores.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-relacoes-ecologicas', term: 'Relações Ecológicas', subject: 'Biologia', category: 'definicao',
    definition: 'Interações entre organismos de um ecossistema: predatismo (uma espécie caça outra), mutualismo (ambas se beneficiam), comensalismo (uma se beneficia sem prejudicar a outra) e competição (disputa por recursos).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sindrome-down', term: 'Síndrome de Down', subject: 'Biologia', category: 'definicao',
    definition: 'Condição genética causada pela presença de uma cópia extra do cromossomo 21 (trissomia do 21), resultando em características físicas específicas e algum grau de deficiência intelectual.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-linfatico', term: 'Sistema Linfático', subject: 'Biologia', category: 'definicao',
    definition: 'Rede de vasos, gânglios e órgãos (como o baço) que coleta o excesso de líquido dos tecidos, produz células de defesa e ajuda no combate a infecções, trabalhando junto com o sistema imunológico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-tegumentar', term: 'Sistema Tegumentar (Pele)', subject: 'Biologia', category: 'definicao',
    definition: 'Maior órgão do corpo humano, formado pela pele e seus anexos (pelos, unhas, glândulas), responsável por proteção, regulação da temperatura corporal e percepção sensorial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-vetores-doencas', term: 'Vetores de Doenças', subject: 'Biologia', category: 'definicao',
    definition: 'Organismos (geralmente insetos) que transmitem agentes causadores de doenças de um hospedeiro pra outro.',
    examples: 'O mosquito Aedes aegypti é vetor de dengue, zika e chikungunya.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-clonagem', term: 'Clonagem', subject: 'Biologia', category: 'definicao',
    definition: 'Técnica de reprodução assexuada artificial que gera um organismo geneticamente idêntico a outro já existente, a partir de uma célula do organismo original.',
    examples: 'A ovelha Dolly, em 1996, foi o primeiro mamífero clonado a partir de uma célula adulta.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-crispr', term: 'CRISPR (Edição Genética)', subject: 'Biologia', category: 'definicao',
    definition: 'Tecnologia de edição genética que permite cortar e modificar sequências específicas de DNA com alta precisão, com potencial pra tratar doenças genéticas e revolucionar a biotecnologia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-polinizacao', term: 'Polinização', subject: 'Biologia', category: 'definicao',
    definition: 'Transferência de grãos de pólen da parte masculina pra a parte feminina de uma flor, etapa essencial da reprodução das angiospermas, frequentemente feita por animais polinizadores.',
    examples: 'Abelhas são os principais agentes polinizadores, essenciais também pra agricultura.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-transpiracao-vegetal', term: 'Transpiração Vegetal', subject: 'Biologia', category: 'definicao',
    definition: 'Perda de água na forma de vapor pelas plantas, principalmente através dos estômatos nas folhas, processo que ajuda a puxar água e nutrientes das raízes até o topo da planta.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-origem-vida', term: 'Origem da Vida (Abiogênese)', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de hipóteses sobre como a vida surgiu na Terra a partir de matéria não viva, incluindo a teoria da evolução química proposta por Oparin e Haldane.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-taxonomia', term: 'Taxonomia', subject: 'Biologia', category: 'definicao',
    definition: 'Ciência de classificar os seres vivos em categorias hierárquicas (reino, filo, classe, ordem, família, gênero, espécie) com base em suas características e parentesco evolutivo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-biodiversidade', term: 'Biodiversidade', subject: 'Biologia', category: 'definicao',
    definition: 'Variedade de formas de vida existentes num ecossistema ou no planeta, incluindo diversidade genética, de espécies e de ecossistemas — essencial pro equilíbrio ambiental.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-extincao-especies', term: 'Extinção de Espécies', subject: 'Biologia', category: 'definicao',
    definition: 'Desaparecimento completo de uma espécie, seja por causas naturais (mudanças climáticas antigas) ou por ação humana (destruição de habitat, caça, poluição).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-simbiose', term: 'Simbiose', subject: 'Biologia', category: 'definicao',
    definition: 'Relação ecológica íntima e duradoura entre organismos de espécies diferentes, podendo ser mutualística (ambos se beneficiam), comensalista ou parasitária.',
    examples: 'Líquens são resultado de simbiose entre fungos e algas ou cianobactérias.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-placenta-gestacao', term: 'Placenta e Gestação', subject: 'Biologia', category: 'definicao',
    definition: 'A placenta é o órgão que conecta o embrião/feto à mãe durante a gestação, permitindo trocas de nutrientes, gases e resíduos entre os dois organismos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-albinismo', term: 'Albinismo', subject: 'Biologia', category: 'definicao',
    definition: 'Condição genética recessiva que causa a ausência ou redução da produção de melanina, resultando em pele, cabelo e olhos muito claros e maior sensibilidade à luz solar.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-biorremediacao', term: 'Biorremediação', subject: 'Biologia', category: 'definicao',
    definition: 'Uso de organismos vivos (geralmente microrganismos) pra degradar ou remover poluentes do ambiente, como derramamentos de petróleo ou metais pesados no solo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regeneracao-cicatrizacao', term: 'Regeneração e Cicatrização', subject: 'Biologia', category: 'definicao',
    definition: 'Processos biológicos de reparo de tecidos lesionados: cicatrização forma um novo tecido (às vezes com cicatriz); regeneração recompõe o tecido original, capacidade mais limitada em humanos do que em outros animais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-watson-crick', term: 'James Watson e Francis Crick', subject: 'Biologia', category: 'pessoa',
    definition: 'Cientistas que, em 1953, descreveram a estrutura em dupla-hélice do DNA, usando dados de difração de raios-X obtidos por Rosalind Franklin — uma das descobertas mais importantes da biologia moderna.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/James_D_Watson_and_Francis_Crick.jpg', extra_info: 'Prêmio Nobel de Medicina em 1962',
  },

  // ---- Química (bloco 5) ----
  {
    id: 'fb-lei-hess', term: 'Lei de Hess', subject: 'Química', category: 'definicao',
    definition: 'A variação de entalpia de uma reação química depende apenas dos estados inicial e final, não do caminho percorrido — permite calcular a entalpia de reações somando etapas intermediárias conhecidas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-indicadores-acido-base', term: 'Indicadores Ácido-Base', subject: 'Química', category: 'definicao',
    definition: 'Substâncias que mudam de cor conforme o pH do meio, usadas pra identificar se uma solução é ácida, neutra ou básica.',
    examples: 'A fenolftaleína fica rosa em meio básico e incolor em meio ácido/neutro.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-chuva-acida', term: 'Chuva Ácida', subject: 'Química', category: 'definicao',
    definition: 'Precipitação com pH anormalmente baixo, causada pela reação de gases poluentes (como óxidos de enxofre e nitrogênio, emitidos por indústrias e veículos) com a água da atmosfera.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-volumetria', term: 'Volumetria', subject: 'Química', category: 'definicao',
    definition: 'Técnica analítica que determina a concentração de uma solução medindo o volume de outra solução (de concentração conhecida) necessário pra reagir completamente com ela.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-solucoes-saturacao', term: 'Soluções Saturadas, Insaturadas e Supersaturadas', subject: 'Química', category: 'definicao',
    definition: 'Insaturada tem menos soluto do que o solvente consegue dissolver; saturada está no limite máximo de dissolução; supersaturada tem mais soluto dissolvido do que o normalmente possível, em estado instável.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-coloides', term: 'Coloides', subject: 'Química', category: 'definicao',
    definition: 'Misturas heterogêneas em que partículas pequenas (maiores que numa solução, menores que numa suspensão) ficam dispersas num meio, sem se depositar facilmente.',
    examples: 'Leite, maionese e neblina são exemplos de coloides.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-substancias-misturas', term: 'Substâncias Puras e Misturas', subject: 'Química', category: 'definicao',
    definition: 'Substância pura tem composição química fixa e definida (água, ouro); mistura é a combinação de duas ou mais substâncias puras, podendo ser homogênea ou heterogênea.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-metodos-separacao', term: 'Métodos de Separação de Misturas', subject: 'Química', category: 'definicao',
    definition: 'Técnicas usadas pra separar os componentes de uma mistura, como filtração, decantação, destilação e centrifugação, escolhidas conforme as propriedades físicas dos componentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-polaridade-moleculas', term: 'Polaridade das Moléculas', subject: 'Química', category: 'definicao',
    definition: 'Moléculas polares têm distribuição desigual de cargas elétricas (como a água); moléculas apolares têm distribuição uniforme — essa propriedade determina solubilidade e outras interações.',
    examples: 'Substâncias polares se dissolvem bem em solventes polares ("semelhante dissolve semelhante").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-geometria-molecular', term: 'Geometria Molecular', subject: 'Química', category: 'definicao',
    definition: 'Forma tridimensional que uma molécula assume no espaço, determinada pela repulsão entre os pares de elétrons ao redor do átomo central, influenciando propriedades físicas e químicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-hibridizacao-carbono', term: 'Hibridização do Carbono', subject: 'Química', category: 'definicao',
    definition: 'Fenômeno em que os orbitais do átomo de carbono se combinam de formas diferentes (sp3, sp2, sp), determinando o tipo de ligação (simples, dupla, tripla) e a geometria da molécula orgânica.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reacoes-sintese-analise', term: 'Reações de Síntese, Análise e Troca', subject: 'Química', category: 'definicao',
    definition: 'Síntese: dois ou mais reagentes formam um único produto. Análise: um reagente se decompõe em dois ou mais produtos. Troca (simples ou dupla): elementos ou grupos trocam de posição entre os reagentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-balanceamento', term: 'Balanceamento de Equações Químicas', subject: 'Química', category: 'definicao',
    definition: 'Ajuste dos coeficientes numa equação química pra garantir que o número de átomos de cada elemento seja igual nos reagentes e nos produtos, respeitando a Lei da Conservação das Massas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-rendimento-pureza', term: 'Rendimento e Pureza de Reação', subject: 'Química', category: 'definicao',
    definition: 'Rendimento é a proporção entre a quantidade de produto realmente obtida e a quantidade teoricamente esperada numa reação; pureza indica o quanto de uma amostra é composta pela substância desejada, sem impurezas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-quimica-verde', term: 'Química Verde', subject: 'Química', category: 'definicao',
    definition: 'Conjunto de princípios que buscam desenvolver processos químicos mais sustentáveis, reduzindo o uso de substâncias tóxicas, resíduos e consumo de energia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-saboes-detergentes', term: 'Sabões e Detergentes', subject: 'Química', category: 'definicao',
    definition: 'Substâncias com uma parte polar (afinidade com água) e uma parte apolar (afinidade com gordura), que permitem remover sujeira ao formar micelas ao redor das partículas de gordura.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-amido-celulose', term: 'Amido e Celulose', subject: 'Química', category: 'definicao',
    definition: 'Carboidratos complexos (polissacarídeos) formados por unidades de glicose: amido é reserva energética em plantas (e alimento pra humanos); celulose forma a parede celular vegetal e não é digerível por humanos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-proteinas', term: 'Proteínas (Aminoácidos)', subject: 'Química', category: 'definicao',
    definition: 'Macromoléculas formadas por sequências de aminoácidos unidos por ligações peptídicas, essenciais pra estrutura celular, enzimas, hormônios e defesa do organismo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-amedeo-avogadro', term: 'Amedeo Avogadro', subject: 'Química', category: 'pessoa',
    definition: 'Físico e químico italiano que propôs a hipótese de que volumes iguais de gases diferentes, nas mesmas condições de temperatura e pressão, contêm o mesmo número de moléculas — base do conceito de mol e do Número de Avogadro.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Avogadro_Amedeo.jpg', extra_info: '1776 – 1856',
  },
  {
    id: 'fb-pauling', term: 'Linus Pauling', subject: 'Química', category: 'pessoa',
    definition: 'Químico americano que desenvolveu a escala de eletronegatividade dos elementos e o diagrama de distribuição eletrônica usado até hoje. Único a ganhar dois Prêmios Nobel individuais (Química, 1954, e Paz, 1962).',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Linus_Pauling_1962.jpg', extra_info: '1901 – 1994',
  },

  // ---- Física (bloco 5) ----
  {
    id: 'fb-queda-livre', term: 'Queda Livre', subject: 'Física', category: 'definicao',
    definition: 'Movimento de um corpo sujeito apenas à ação da gravidade, sem resistência do ar, com aceleração constante (aproximadamente 9,8 m/s² na Terra).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lancamento-vertical', term: 'Lançamento Vertical', subject: 'Física', category: 'definicao',
    definition: 'Movimento de um corpo lançado pra cima (ou pra baixo) verticalmente, sujeito apenas à aceleração da gravidade, desacelerando na subida e acelerando na descida.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-intensidade-corrente', term: 'Intensidade de Corrente Elétrica', subject: 'Física', category: 'definicao',
    definition: 'Quantidade de carga elétrica que atravessa um condutor por unidade de tempo, medida em ampères (A).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-capacitores', term: 'Capacitores', subject: 'Física', category: 'definicao',
    definition: 'Componentes elétricos capazes de armazenar energia na forma de campo elétrico, formados por duas placas condutoras separadas por um material isolante.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-maquinas-simples', term: 'Máquinas Simples', subject: 'Física', category: 'definicao',
    definition: 'Dispositivos mecânicos básicos (alavancas, polias, planos inclinados, roldanas) que multiplicam ou redirecionam uma força, facilitando a realização de trabalho mecânico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-centro-massa', term: 'Centro de Massa', subject: 'Física', category: 'definicao',
    definition: 'Ponto onde se considera concentrada toda a massa de um corpo ou sistema pra fins de análise do seu movimento, podendo estar fora do corpo em objetos de formato irregular.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-momento-angular', term: 'Momento Angular', subject: 'Física', category: 'definicao',
    definition: 'Grandeza que mede a quantidade de rotação de um corpo, dependente de sua massa, velocidade e distância ao eixo de rotação — se conserva na ausência de forças externas (torques).',
    examples: 'Uma patinadora gira mais rápido quando encolhe os braços, conservando o momento angular.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-difracao-interferencia', term: 'Difração e Interferência', subject: 'Física', category: 'definicao',
    definition: 'Difração é o desvio de ondas ao passar por uma fenda ou obstáculo; interferência é a sobreposição de duas ou mais ondas, que pode ser construtiva (se reforçam) ou destrutiva (se cancelam).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-polarizacao-luz', term: 'Polarização da Luz', subject: 'Física', category: 'definicao',
    definition: 'Fenômeno em que as ondas de luz, que normalmente vibram em várias direções, passam a vibrar numa única direção, usado em óculos de sol polarizados e telas de LCD.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-decibeis', term: 'Decibéis (Intensidade Sonora)', subject: 'Física', category: 'definicao',
    definition: 'Unidade logarítmica usada pra medir a intensidade (volume) do som, já que o ouvido humano percebe variações de intensidade sonora numa escala não linear.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-meia-vida', term: 'Meia-Vida Radioativa', subject: 'Física', category: 'definicao',
    definition: 'Tempo necessário pra que metade dos átomos de uma amostra radioativa se desintegre, uma constante característica de cada elemento radioativo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-datacao-carbono14', term: 'Datação por Carbono-14', subject: 'Física', category: 'definicao',
    definition: 'Método que usa a meia-vida do carbono-14 (cerca de 5.730 anos) pra estimar a idade de materiais orgânicos, muito usado em arqueologia e paleontologia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ultrassom', term: 'Ultrassom e Aplicações', subject: 'Física', category: 'definicao',
    definition: 'Ondas sonoras com frequência acima da audível pelo ser humano (acima de 20.000 Hz), usadas em exames médicos (ultrassonografia), sonares e limpeza de precisão.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-energia-solar-fotovoltaica', term: 'Energia Solar Fotovoltaica', subject: 'Física', category: 'definicao',
    definition: 'Tecnologia que converte luz solar diretamente em energia elétrica através do efeito fotoelétrico em células semicondutoras (painéis solares).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-motor-eletrico', term: 'Motor Elétrico', subject: 'Física', category: 'definicao',
    definition: 'Dispositivo que converte energia elétrica em energia mecânica (movimento rotativo), usando a interação entre campos magnéticos e correntes elétricas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-gerador-eletrico', term: 'Gerador Elétrico', subject: 'Física', category: 'definicao',
    definition: 'Dispositivo que converte energia mecânica em energia elétrica através da indução eletromagnética — o processo inverso do motor elétrico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-coulomb', term: 'Lei de Coulomb', subject: 'Física', category: 'definicao',
    definition: 'Lei que descreve a força elétrica entre duas cargas pontuais: proporcional ao produto das cargas e inversamente proporcional ao quadrado da distância entre elas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-amperimetro-voltimetro', term: 'Amperímetro e Voltímetro', subject: 'Física', category: 'definicao',
    definition: 'Amperímetro mede a intensidade de corrente elétrica (ligado em série no circuito); voltímetro mede a diferença de potencial/tensão (ligado em paralelo).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-heisenberg', term: 'Werner Heisenberg', subject: 'Física', category: 'pessoa',
    definition: 'Físico alemão, um dos fundadores da mecânica quântica, formulou o Princípio da Incerteza: é impossível conhecer simultaneamente, com precisão absoluta, a posição e a velocidade de uma partícula subatômica.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Bundesarchiv_Bild183-R57262%2C_Werner_Heisenberg_crop.jpg', extra_info: '1901 – 1976',
  },
  {
    id: 'fb-fermi', term: 'Enrico Fermi', subject: 'Física', category: 'pessoa',
    definition: 'Físico ítalo-americano que construiu o primeiro reator nuclear do mundo e contribuiu decisivamente pra física nuclear e de partículas, sendo uma figura central no Projeto Manhattan.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Enrico_Fermi_1943-49.jpg', extra_info: '1901 – 1954',
  },

  // ---- Matemática (bloco 5) ----
  {
    id: 'fb-lei-senos', term: 'Lei dos Senos', subject: 'Matemática', category: 'definicao',
    definition: 'Em qualquer triângulo, a razão entre um lado e o seno do ângulo oposto a ele é constante — usada pra resolver triângulos que não são retângulos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-cossenos', term: 'Lei dos Cossenos', subject: 'Matemática', category: 'definicao',
    definition: 'Generalização do Teorema de Pitágoras pra qualquer triângulo: o quadrado de um lado é igual à soma dos quadrados dos outros dois, menos duas vezes o produto deles pelo cosseno do ângulo entre eles.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-produtos-notaveis', term: 'Produtos Notáveis', subject: 'Matemática', category: 'definicao',
    definition: 'Multiplicações algébricas que seguem padrões fixos, como o quadrado da soma (a+b)² = a² + 2ab + b² e a diferença de quadrados (a+b)(a-b) = a² - b².',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fatoracao', term: 'Fatoração de Expressões Algébricas', subject: 'Matemática', category: 'definicao',
    definition: 'Processo de reescrever uma expressão algébrica como um produto de fatores mais simples, útil pra simplificar expressões e resolver equações.',
    examples: 'x² - 9 pode ser fatorado como (x+3)(x-3).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-equacoes-biquadradas', term: 'Equações Biquadradas', subject: 'Matemática', category: 'definicao',
    definition: 'Equações do tipo ax⁴ + bx² + c = 0, resolvidas fazendo uma substituição (y = x²) pra transformá-las numa equação do 2º grau comum.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcoes-definidas-partes', term: 'Funções Definidas por Partes', subject: 'Matemática', category: 'definicao',
    definition: 'Funções que têm regras diferentes de cálculo dependendo do intervalo em que a variável de entrada se encontra.',
    examples: 'A tabela de imposto de renda progressivo é um exemplo de função definida por partes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-interpolacao', term: 'Interpolação Aritmética e Geométrica', subject: 'Matemática', category: 'definicao',
    definition: 'Técnica de inserir termos entre dois números dados, formando uma PA ou PG completa entre eles.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-probabilidade-condicional', term: 'Probabilidade Condicional', subject: 'Matemática', category: 'definicao',
    definition: 'Probabilidade de um evento ocorrer, dado que outro evento já ocorreu, alterando o espaço de possibilidades considerado.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regra-sarrus', term: 'Regra de Sarrus', subject: 'Matemática', category: 'definicao',
    definition: 'Método prático pra calcular o determinante de uma matriz 3x3, repetindo as duas primeiras colunas ao lado da matriz e somando/subtraindo os produtos das diagonais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sistema-sexagesimal', term: 'Sistema Sexagesimal', subject: 'Matemática', category: 'definicao',
    definition: 'Sistema de medida de ângulos e tempo baseado no número 60: cada grau tem 60 minutos, e cada minuto tem 60 segundos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-poliedros-platao', term: 'Poliedros de Platão', subject: 'Matemática', category: 'definicao',
    definition: 'Os 5 poliedros regulares convexos (tetraedro, cubo, octaedro, dodecaedro, icosaedro), em que todas as faces são polígonos regulares idênticos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-tronco-piramide-cone', term: 'Tronco de Pirâmide e Cone', subject: 'Matemática', category: 'definicao',
    definition: 'Sólidos obtidos ao cortar uma pirâmide ou cone por um plano paralelo à base, removendo a parte superior (o "vértice").',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-inscricao-circunscricao', term: 'Inscrição e Circunscrição de Polígonos', subject: 'Matemática', category: 'definicao',
    definition: 'Um polígono está inscrito numa circunferência quando todos os seus vértices tocam a circunferência; está circunscrito quando todos os seus lados tangenciam a circunferência.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-modulo-numero', term: 'Módulo de um Número', subject: 'Matemática', category: 'definicao',
    definition: 'Valor absoluto de um número, ou seja, sua distância até o zero na reta numérica, sempre um valor não negativo. Representado por |x|.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-expressoes-numericas', term: 'Expressões Numéricas', subject: 'Matemática', category: 'definicao',
    definition: 'Sequências de operações matemáticas que devem seguir uma ordem específica pra serem resolvidas: primeiro parênteses/colchetes, depois potenciação/radiciação, depois multiplicação/divisão, por fim adição/subtração.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-unidades-conversoes', term: 'Unidades de Medida e Conversões', subject: 'Matemática', category: 'definicao',
    definition: 'Sistema de transformar uma grandeza de uma unidade pra outra (metros pra centímetros, litros pra mililitros), usando fatores de conversão fixos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-escala-mapas', term: 'Escala (Mapas e Maquetes)', subject: 'Matemática', category: 'definicao',
    definition: 'Relação matemática entre uma medida representada (num mapa, planta ou maquete) e a medida real correspondente.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sequencias-padroes', term: 'Sequências e Padrões Numéricos', subject: 'Matemática', category: 'definicao',
    definition: 'Listas ordenadas de números que seguem uma regra ou padrão lógico, base pra identificar PAs, PGs e outras sequências matemáticas mais complexas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-tales-mileto', term: 'Tales de Mileto', subject: 'Matemática', category: 'pessoa',
    definition: 'Filósofo e matemático grego considerado um dos primeiros cientistas da história, criador do teorema que leva seu nome, sobre proporcionalidade entre segmentos formados por retas paralelas.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Thales.jpg', extra_info: 'Cerca de 624 a.C. – 546 a.C.',
  },
  {
    id: 'fb-al-khwarizmi', term: 'Al-Khwarizmi', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático persa considerado o "pai da álgebra" — a própria palavra "álgebra" vem do título de sua obra. A palavra "algoritmo" deriva de seu nome.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Al-Khwarizmi_portrait.jpg', extra_info: 'Cerca de 780 – 850',
  },

  // ---- História (bloco 5) ----
  {
    id: 'fb-independencia-eua', term: 'Independência dos Estados Unidos', subject: 'História', category: 'definicao',
    definition: 'Processo que culminou na Declaração de Independência de 1776, libertando as 13 colônias britânicas na América do Norte e criando os Estados Unidos, fortemente influenciado pelos ideais iluministas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolucao-chinesa', term: 'Revolução Chinesa (1949)', subject: 'História', category: 'definicao',
    definition: 'Movimento liderado por Mao Tsé-Tung e o Partido Comunista Chinês que derrotou os nacionalistas na guerra civil chinesa e instaurou a República Popular da China, regime socialista até hoje.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-era-meiji', term: 'Era Meiji (Japão)', subject: 'História', category: 'definicao',
    definition: 'Período (1868-1912) de rápida modernização e industrialização do Japão, que abandonou o isolamento feudal e se tornou uma potência mundial em poucas décadas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-neocolonialismo', term: 'Neocolonialismo', subject: 'História', category: 'definicao',
    definition: 'Forma de dominação econômica e política exercida por potências sobre países pobres sem controle territorial direto, através de dívidas, dependência comercial e influência política.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-coreia', term: 'Guerra da Coreia', subject: 'História', category: 'definicao',
    definition: 'Conflito (1950-1953) entre a Coreia do Norte (comunista, apoiada por China e URSS) e a Coreia do Sul (apoiada pelos EUA e ONU), que terminou num armistício e na divisão da península que persiste até hoje.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ditadura-argentina', term: 'Ditadura Militar Argentina', subject: 'História', category: 'definicao',
    definition: 'Regime autoritário na Argentina (1976-1983), conhecido como "Guerra Suja", marcado por perseguição, tortura e desaparecimento de milhares de opositores políticos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-congresso-viena', term: 'Congresso de Viena', subject: 'História', category: 'definicao',
    definition: 'Reunião das potências europeias (1814-1815) após a derrota de Napoleão, que redesenhou o mapa da Europa buscando restaurar o equilíbrio de poder e as monarquias tradicionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-transicao-feudalismo-capitalismo', term: 'Transição do Feudalismo pro Capitalismo', subject: 'História', category: 'definicao',
    definition: 'Processo histórico de longa duração em que a economia agrária e local da Idade Média foi gradualmente substituída pelo comércio, manufatura e acumulação de capital que caracterizam o capitalismo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-escravidao-antiguidade', term: 'Escravidão na Antiguidade', subject: 'História', category: 'definicao',
    definition: 'Sistema de trabalho forçado presente em civilizações antigas como Grécia e Roma, geralmente envolvendo prisioneiros de guerra e povos conquistados, base de boa parte da economia dessas sociedades.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-inquisicao', term: 'Inquisição', subject: 'História', category: 'definicao',
    definition: 'Instituição da Igreja Católica que perseguia e julgava pessoas acusadas de heresia, bruxaria ou desvio da fé oficial, especialmente entre os séculos 13 e 19, usando métodos como tortura e execução.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-independencia-hispanoamericana', term: 'Independência Hispano-Americana', subject: 'História', category: 'definicao',
    definition: 'Conjunto de movimentos que libertaram as colônias espanholas na América no início do século 19, liderados por figuras como Simón Bolívar e José de San Martín.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-tratado-tordesilhas', term: 'Tratado de Tordesilhas', subject: 'História', category: 'definicao',
    definition: 'Acordo de 1494 entre Portugal e Espanha que dividiu as terras "descobertas e por descobrir" fora da Europa através de uma linha imaginária, base da colonização portuguesa do Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-otan-varsovia', term: 'OTAN e Pacto de Varsóvia', subject: 'História', category: 'definicao',
    definition: 'Alianças militares rivais da Guerra Fria: a OTAN reunia os países capitalistas ocidentais liderados pelos EUA; o Pacto de Varsóvia reunia os países socialistas do Leste Europeu liderados pela URSS.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-corrida-espacial', term: 'Corrida Espacial', subject: 'História', category: 'definicao',
    definition: 'Disputa tecnológica e ideológica entre EUA e URSS durante a Guerra Fria pela supremacia na exploração espacial, culminando no envio soviético do primeiro satélite (Sputnik) e na chegada americana à Lua.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-construcao-muro-berlim', term: 'Construção do Muro de Berlim', subject: 'História', category: 'definicao',
    definition: 'Erguido em 1961 pela Alemanha Oriental, o muro dividiu fisicamente Berlim por quase 30 anos, símbolo maior da divisão do mundo durante a Guerra Fria, até sua queda em 1989.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-perestroika-glasnost', term: 'Perestroika e Glasnost', subject: 'História', category: 'definicao',
    definition: 'Reformas promovidas por Mikhail Gorbachev na URSS nos anos 1980: perestroika (reestruturação econômica) e glasnost (abertura política/transparência), que aceleraram o fim da União Soviética.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fascismo-italiano', term: 'Fascismo Italiano', subject: 'História', category: 'definicao',
    definition: 'Regime autoritário e nacionalista liderado por Benito Mussolini na Itália (1922-1943), caracterizado por culto ao líder, militarismo e supressão de liberdades individuais — inspirou outros regimes fascistas na Europa.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bolivar', term: 'Simón Bolívar', subject: 'História', category: 'pessoa',
    definition: 'Militar e político venezuelano, principal líder da independência de vários países sul-americanos do domínio espanhol (Venezuela, Colômbia, Equador, Peru, Bolívia), conhecido como "O Libertador".',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Sim%C3%B3n_Bol%C3%ADvar_by_Jos%C3%A9_Gil_de_Castro.jpg', extra_info: '1783 – 1830',
  },
  {
    id: 'fb-gandhi', term: 'Mahatma Gandhi', subject: 'História', category: 'pessoa',
    definition: 'Líder indiano do movimento de independência contra o domínio britânico, defensor da resistência não-violenta (satyagraha) como forma de luta política — inspirou movimentos de direitos civis ao redor do mundo.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg', extra_info: '1869 – 1948',
  },
  {
    id: 'fb-mao', term: 'Mao Tsé-Tung', subject: 'História', category: 'pessoa',
    definition: 'Líder comunista chinês, fundador da República Popular da China (1949) e figura central da Revolução Chinesa, governou o país até sua morte, com políticas que causaram profundas transformações e também grande sofrimento humano.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Mao_Zedong_1950_Portrait_%283x4_cropped%29.jpg', extra_info: '1893 – 1976',
  },

  // ---- Geografia (bloco 5) ----
  {
    id: 'fb-brics', term: 'BRICS', subject: 'Geografia', category: 'definicao',
    definition: 'Grupo de cooperação entre economias emergentes: Brasil, Rússia, Índia, China e África do Sul (com novos membros aderindo recentemente), que busca maior influência geopolítica frente aos países desenvolvidos tradicionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fmi-banco-mundial', term: 'FMI e Banco Mundial', subject: 'Geografia', category: 'definicao',
    definition: 'Organizações financeiras internacionais criadas após a Segunda Guerra Mundial: o FMI (Fundo Monetário Internacional) monitora a estabilidade financeira global; o Banco Mundial financia projetos de desenvolvimento em países pobres.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-omc', term: 'OMC (Organização Mundial do Comércio)', subject: 'Geografia', category: 'definicao',
    definition: 'Organização internacional que estabelece regras pro comércio entre países, buscando reduzir barreiras comerciais e resolver disputas comerciais entre nações membros.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-crise-refugiados', term: 'Crise de Refugiados', subject: 'Geografia', category: 'definicao',
    definition: 'Situação em que grandes populações são forçadas a deixar seus países devido a guerras, perseguições ou desastres, buscando refúgio em outras nações — gera desafios humanitários e políticos globais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-commodities', term: 'Commodities', subject: 'Geografia', category: 'definicao',
    definition: 'Produtos primários (agrícolas, minerais ou energéticos) padronizados e comercializados globalmente, como soja, minério de ferro e petróleo, cujos preços costumam ser definidos no mercado internacional.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-divida-externa', term: 'Dívida Externa', subject: 'Geografia', category: 'definicao',
    definition: 'Total de recursos que um país deve a credores estrangeiros (outros governos, bancos, organismos internacionais), cujo pagamento pode limitar investimentos internos em áreas como saúde e educação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-paises-emergentes', term: 'Países Emergentes', subject: 'Geografia', category: 'definicao',
    definition: 'Países com economias em rápido crescimento e industrialização, em transição entre o status de subdesenvolvido e desenvolvido, como Brasil, Índia e China.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-paises-desenvolvidos-sub', term: 'Países Desenvolvidos e Subdesenvolvidos', subject: 'Geografia', category: 'definicao',
    definition: 'Classificação baseada em indicadores como renda, industrialização, IDH e distribuição de riqueza — desenvolvidos concentram tecnologia e capital, subdesenvolvidos costumam depender de exportação de matérias-primas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cidades-globais', term: 'Cidades Globais', subject: 'Geografia', category: 'definicao',
    definition: 'Centros urbanos com forte influência econômica, política e cultural em escala mundial, concentrando sedes de empresas multinacionais e centros de decisão financeira.',
    examples: 'Nova York, Londres e Tóquio são exemplos clássicos de cidades globais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-saneamento-basico', term: 'Saneamento Básico', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de serviços essenciais como abastecimento de água tratada, coleta de esgoto e de lixo — sua ausência está diretamente ligada a doenças e desigualdade social, especialmente em áreas urbanas precárias.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-escassez-agua', term: 'Escassez de Água', subject: 'Geografia', category: 'definicao',
    definition: 'Situação em que a demanda por água doce numa região supera a oferta disponível, agravada por crescimento populacional, poluição, desperdício e mudanças climáticas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-matriz-transporte', term: 'Matriz de Transporte no Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'O Brasil depende fortemente do transporte rodoviário (mais caro e poluente) em detrimento do ferroviário e hidroviário, o que encarece a logística e o chamado "Custo Brasil".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-biopirataria', term: 'Biopirataria', subject: 'Geografia', category: 'definicao',
    definition: 'Apropriação ilegal de recursos genéticos e conhecimentos tradicionais (geralmente de países megadiversos como o Brasil) por empresas ou países estrangeiros, sem autorização ou compensação justa.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-soberania-nacional', term: 'Soberania Nacional', subject: 'Geografia', category: 'definicao',
    definition: 'Poder supremo de um Estado de governar seu próprio território e população sem interferência externa, princípio fundamental das relações internacionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-china-potencia', term: 'China como Potência Econômica', subject: 'Geografia', category: 'definicao',
    definition: 'Ascensão da China nas últimas décadas como uma das maiores economias do mundo, combinando abertura comercial controlada com forte planejamento estatal, hoje disputando protagonismo global com os EUA.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-nova-ordem-mundial', term: 'Nova Ordem Mundial Multipolar', subject: 'Geografia', category: 'definicao',
    definition: 'Configuração geopolítica atual em que o poder mundial deixa de estar concentrado só nos EUA (unipolaridade pós-Guerra Fria) e passa a ser disputado por vários polos de poder, como China, Rússia, União Europeia e Índia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-zonas-economicas-especiais', term: 'Zonas Econômicas Especiais', subject: 'Geografia', category: 'definicao',
    definition: 'Áreas delimitadas dentro de um país com regras econômicas diferenciadas (menos impostos, menos burocracia) pra atrair investimento estrangeiro e impulsionar a indústria local.',
    examples: 'A China usou zonas econômicas especiais, como Shenzhen, pra impulsionar sua industrialização.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-xenofobia-migracao', term: 'Xenofobia e Migração', subject: 'Geografia', category: 'definicao',
    definition: 'Rejeição ou discriminação contra pessoas de outros países, frequentemente intensificada em contextos de grandes fluxos migratórios e crises econômicas nos países receptores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-centro-periferia', term: 'Centro e Periferia', subject: 'Geografia', category: 'definicao',
    definition: 'Modelo que divide o mundo entre países "centrais" (industrializados, com mais poder econômico e tecnológico) e países "periféricos" (fornecedores de matéria-prima e mão de obra barata), usado pra explicar desigualdades globais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-josue-castro', term: 'Josué de Castro', subject: 'Geografia', category: 'pessoa',
    definition: 'Médico, geógrafo e sociólogo brasileiro, autor de "Geografia da Fome" (1946), obra pioneira que mostrou a fome como um problema social e político, não natural. Foi presidente do Conselho da FAO (órgão da ONU pra agricultura e alimentação).',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Josu%C3%A9_de_Castro_doc_1967.jpg', extra_info: '1908 – 1973',
  },

  // ---- Inglês (bloco 5) ----
  {
    id: 'fb-future-continuous', term: 'Future Continuous', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (will be + verbo com -ing) usado pra ações que estarão em progresso num momento específico do futuro.',
    examples: '"At 8 pm, I will be studying." (Às 8 da noite, eu estarei estudando.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-future-perfect', term: 'Future Perfect', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (will have + particípio) usado pra ações que estarão concluídas antes de um momento específico no futuro.',
    examples: '"By next year, I will have graduated." (Até o ano que vem, eu terei me formado.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-mixed-conditionals', term: 'Mixed Conditionals', subject: 'Inglês', category: 'definicao',
    definition: 'Combinações entre o segundo e o terceiro condicional, usadas quando a condição e o resultado estão em tempos diferentes (passado e presente, por exemplo).',
    examples: '"If I had studied medicine, I would be a doctor now." (condição no passado, resultado no presente)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-wish-if-only', term: 'Wish and If Only', subject: 'Inglês', category: 'definicao',
    definition: 'Estruturas usadas pra expressar desejos ou arrependimentos sobre o presente (+ Simple Past) ou o passado (+ Past Perfect).',
    examples: '"I wish I had more time." / "If only I had studied harder."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-zero-article', term: 'Zero Article', subject: 'Inglês', category: 'definicao',
    definition: 'Ausência do artigo "a/an/the" antes de substantivos incontáveis, plurais gerais, ou nomes próprios, quando a referência é geral e não específica.',
    examples: '"I like music." (não "the music", referência geral).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-gerunds-subjects', term: 'Gerunds as Subjects', subject: 'Inglês', category: 'definicao',
    definition: 'Uso do gerúndio (verbo + -ing) como sujeito de uma frase, funcionando como um substantivo.',
    examples: '"Swimming is good for your health." (Nadar é bom pra saúde.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-infinitive-purpose', term: 'Infinitive of Purpose', subject: 'Inglês', category: 'definicao',
    definition: 'Uso do infinitivo (to + verbo) pra explicar a finalidade ou o objetivo de uma ação.',
    examples: '"She went to the store to buy milk." (Ela foi à loja pra comprar leite.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-as-as', term: 'As...As (Comparações de Igualdade)', subject: 'Inglês', category: 'definicao',
    definition: 'Estrutura usada pra comparar duas coisas que são iguais em algum aspecto.',
    examples: '"She is as tall as her brother." (Ela é tão alta quanto o irmão.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-linking-verbs', term: 'Linking Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Verbos que conectam o sujeito a um complemento (adjetivo ou substantivo) sem expressar uma ação, como "be", "seem", "become", "look".',
    examples: '"She looks tired." (Ela parece cansada.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-direct-indirect-objects', term: 'Direct and Indirect Objects', subject: 'Inglês', category: 'definicao',
    definition: 'Objeto direto recebe diretamente a ação do verbo; objeto indireto indica pra quem ou pra quê a ação é direcionada.',
    examples: '"She gave him (indireto) a book (direto)."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-irregular-plurals', term: 'Irregular Plurals', subject: 'Inglês', category: 'definicao',
    definition: 'Substantivos que não seguem a regra comum de plural (+s/es), mudando de forma própria.',
    examples: '"Child" → "children"; "mouse" → "mice"; "foot" → "feet".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-homophones', term: 'Homophones', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras que têm a mesma pronúncia mas significados e/ou grafias diferentes, fonte comum de confusão e pegadinhas em provas.',
    examples: '"There", "their" e "they\'re" são homófonos comuns em inglês.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-word-formation-professions', term: 'Word Formation (Sufixos de Profissão)', subject: 'Inglês', category: 'definicao',
    definition: 'Sufixos usados pra formar palavras que indicam profissões ou ocupações, como -er, -or, -ist, -ian.',
    examples: '"Teach" → "teacher"; "art" → "artist"; "music" → "musician".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-expressing-opinion', term: 'Expressing Opinion', subject: 'Inglês', category: 'definicao',
    definition: 'Expressões usadas pra introduzir uma opinião pessoal em textos e redações em inglês, como "In my opinion", "I believe that", "From my point of view".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-sequencing-words', term: 'Sequencing Words', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras que organizam ideias numa ordem lógica ou cronológica num texto, como "firstly", "secondly", "then", "finally".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-hedging-language', term: 'Hedging Language', subject: 'Inglês', category: 'definicao',
    definition: 'Uso de expressões que suavizam uma afirmação, evitando soar muito categórico — comum em textos acadêmicos, como "seems to", "appears to", "might", "could suggest".',
    examples: '"This data appears to suggest a correlation." (mais cauteloso do que "this data proves").', image_url: null, extra_info: null,
  },
  {
    id: 'fb-reported-questions', term: 'Reported Questions', subject: 'Inglês', category: 'definicao',
    definition: 'Forma de relatar uma pergunta feita por outra pessoa, sem usar a estrutura interrogativa direta e geralmente mudando o tempo verbal.',
    examples: '"Where do you live?" → She asked where I lived.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-passive-modals', term: 'Passive Voice with Modals', subject: 'Inglês', category: 'definicao',
    definition: 'Combinação da voz passiva com verbos modais (can, should, must), formada por modal + be + particípio.',
    examples: '"The homework must be finished by Friday."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-emphatic-structures', term: 'Emphatic Structures', subject: 'Inglês', category: 'definicao',
    definition: 'Estruturas usadas pra dar ênfase a uma parte específica de uma frase, como "It is... that" (cleft sentences) e "What... is".',
    examples: '"It was Maria who solved the problem." (foi a Maria, especificamente, quem resolveu)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-inversion', term: 'Inversion', subject: 'Inglês', category: 'definicao',
    definition: 'Inversão da ordem normal sujeito-verbo, usada pra dar ênfase, geralmente após advérbios negativos no início da frase.',
    examples: '"Never have I seen such a beautiful place." (em vez de "I have never seen...")', image_url: null, extra_info: null,
  },

  // ---- Redação (2ª leva: 5 novos pensadores + 2ª frase pros 5 já existentes) ----
  {
    id: 'fb-foucault', term: 'Michel Foucault', subject: 'Redação', category: 'pessoa',
    definition: '"Onde há poder, há resistência."',
    examples: 'Foucault mostra que o poder não é algo que só oprime de cima pra baixo — ele está espalhado em todas as relações sociais, e sempre gera formas de resistência. Repertório útil pra redações sobre movimentos sociais, controle social e relações de poder nas instituições.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Michel_Foucault_1974_Brasil.jpg', extra_info: '1926 – 1984',
  },
  {
    id: 'fb-arendt', term: 'Hannah Arendt', subject: 'Redação', category: 'pessoa',
    definition: '"Ninguém tem o direito de obedecer."',
    examples: 'Ao cunhar o conceito de "banalidade do mal" (ao observar o julgamento de um oficial nazista), Arendt argumenta que atrocidades em massa muitas vezes não são cometidas por monstros, mas por pessoas comuns que simplesmente obedecem a ordens sem pensar. Ótimo repertório pra redações sobre ética, responsabilidade individual e obediência cega.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Hannah_Arendt_1955.jpg', extra_info: '1906 – 1975',
  },
  {
    id: 'fb-durkheim', term: 'Émile Durkheim', subject: 'Redação', category: 'pessoa',
    definition: '"A educação é a ação exercida pelas gerações adultas sobre as gerações que não se encontram ainda maduras para a vida social."',
    examples: 'Durkheim, um dos fundadores da sociologia, entende a educação como um processo social que integra o indivíduo à sociedade, transmitindo valores e normas coletivas. Repertório certeiro pra redações sobre o papel da escola e da família na formação do cidadão.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/%C3%89mile_Durkheim.jpg', extra_info: '1858 – 1917',
  },
  {
    id: 'fb-nietzsche', term: 'Friedrich Nietzsche', subject: 'Redação', category: 'pessoa',
    definition: '"Aquele que luta com monstros deve acautelar-se para não se tornar também um monstro."',
    examples: 'Nietzsche alerta que combater um mal (violência, injustiça, opressão) usando os mesmos métodos do que se combate pode corromper quem luta contra ele. Repertório forte pra redações sobre violência, justiça e os limites éticos do combate ao crime.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nietzsche1882.jpg', extra_info: '1844 – 1900',
  },
  {
    id: 'fb-mlk-frase', term: 'Martin Luther King Jr.', subject: 'Redação', category: 'pessoa',
    definition: '"Injustiça em qualquer lugar é uma ameaça à justiça em todo lugar."',
    examples: 'Escrita na "Carta da Prisão de Birmingham", essa frase defende que a luta contra a injustiça não pode ser local ou isolada — ela diz respeito a todos, em qualquer lugar. Repertório essencial pra redações sobre direitos humanos, racismo e justiça social.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Martin_Luther_King%2C_Jr..jpg', extra_info: '1929 – 1968',
  },

  // ---- Biologia (bloco 6) ----
  {
    id: 'fb-sinapse', term: 'Sinapse Nervosa', subject: 'Biologia', category: 'definicao',
    definition: 'Ponto de comunicação entre dois neurônios (ou entre neurônio e outra célula), onde o impulso nervoso é transmitido geralmente por substâncias químicas chamadas neurotransmissores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-potencial-acao', term: 'Potencial de Ação (Impulso Nervoso)', subject: 'Biologia', category: 'definicao',
    definition: 'Rápida alteração elétrica que percorre a membrana do neurônio, causada pela movimentação de íons (sódio e potássio), responsável por transmitir informação ao longo do axônio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reflexo-nervoso', term: 'Reflexo Nervoso', subject: 'Biologia', category: 'definicao',
    definition: 'Resposta rápida e automática a um estímulo, que não passa pela consciência — o impulso vai do receptor direto à medula espinhal e ao músculo, sem precisar "esperar" o cérebro processar.',
    examples: 'Puxar a mão rapidamente ao tocar algo quente é um reflexo nervoso.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-snc-snp', term: 'Sistema Nervoso Central e Periférico', subject: 'Biologia', category: 'definicao',
    definition: 'O Sistema Nervoso Central (encéfalo e medula espinhal) processa e integra informações; o Sistema Nervoso Periférico (nervos que saem do SNC) conecta o SNC ao resto do corpo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-adrenalina', term: 'Adrenalina', subject: 'Biologia', category: 'definicao',
    definition: 'Hormônio produzido pelas glândulas suprarrenais em situações de estresse ou perigo, que prepara o corpo pra reação de "luta ou fuga": aumenta batimentos cardíacos, dilata pupilas e libera energia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-insulina-glucagon', term: 'Insulina e Glucagon', subject: 'Biologia', category: 'definicao',
    definition: 'Hormônios produzidos pelo pâncreas que regulam a glicose no sangue de forma oposta: insulina reduz a glicemia (armazenando glicose); glucagon aumenta a glicemia (liberando glicose armazenada).',
    examples: 'No diabetes tipo 1, o corpo não produz insulina suficiente.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-fecundacao', term: 'Fecundação', subject: 'Biologia', category: 'definicao',
    definition: 'União do gameta masculino (espermatozoide) com o gameta feminino (óvulo), formando o zigoto — primeira célula de um novo organismo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-partenogenese', term: 'Partenogênese', subject: 'Biologia', category: 'definicao',
    definition: 'Tipo de reprodução em que o óvulo se desenvolve num novo indivíduo sem ser fecundado por um espermatozoide.',
    examples: 'Algumas espécies de abelhas, formigas e répteis podem se reproduzir por partenogênese.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-hermafroditismo', term: 'Hermafroditismo', subject: 'Biologia', category: 'definicao',
    definition: 'Condição em que um organismo possui órgãos reprodutores masculinos e femininos, comum em algumas espécies de invertebrados como minhocas e caracóis.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-metamorfose', term: 'Metamorfose', subject: 'Biologia', category: 'definicao',
    definition: 'Processo de transformação drástica na forma do corpo de um animal ao longo do seu desenvolvimento, comum em anfíbios e insetos.',
    examples: 'A transformação de larva em borboleta é um exemplo clássico de metamorfose completa.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-migracao-animal', term: 'Migração Animal', subject: 'Biologia', category: 'definicao',
    definition: 'Deslocamento sazonal e periódico de animais entre regiões diferentes, geralmente em busca de alimento, clima favorável ou locais de reprodução.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-hibernacao', term: 'Hibernação', subject: 'Biologia', category: 'definicao',
    definition: 'Estado de inatividade e redução do metabolismo que alguns animais adotam durante períodos de frio extremo ou escassez de alimento, pra economizar energia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-camuflagem-mimetismo', term: 'Camuflagem e Mimetismo', subject: 'Biologia', category: 'definicao',
    definition: 'Camuflagem é quando um organismo se confunde com o ambiente pra não ser notado; mimetismo é quando uma espécie imita a aparência de outra (geralmente perigosa) pra afastar predadores.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bioindicadores', term: 'Bioindicadores', subject: 'Biologia', category: 'definicao',
    definition: 'Organismos cuja presença, ausência ou comportamento indica a qualidade ambiental de um ecossistema, usados pra monitorar poluição e saúde ambiental.',
    examples: 'Líquens são bons bioindicadores de poluição do ar.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-doencas-autoimunes', term: 'Doenças Autoimunes', subject: 'Biologia', category: 'definicao',
    definition: 'Condições em que o sistema imunológico ataca por engano células e tecidos saudáveis do próprio corpo, reconhecendo-os erroneamente como ameaças.',
    examples: 'Lúpus e diabetes tipo 1 são exemplos de doenças autoimunes.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-alergias', term: 'Alergias', subject: 'Biologia', category: 'definicao',
    definition: 'Reação exagerada do sistema imunológico a substâncias geralmente inofensivas (pólen, alimentos, poeira), causando sintomas como coceira, inchaço ou dificuldade respiratória.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-biologia-cancer', term: 'Biologia do Câncer', subject: 'Biologia', category: 'definicao',
    definition: 'O câncer surge quando células sofrem mutações que fazem com que se dividam de forma descontrolada, formando tumores que podem invadir tecidos vizinhos e se espalhar (metástase).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-apoptose', term: 'Apoptose (Morte Celular Programada)', subject: 'Biologia', category: 'definicao',
    definition: 'Processo natural e controlado de autodestruição de células, essencial pro desenvolvimento normal e pra eliminar células danificadas ou infectadas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-microbiota', term: 'Microbiota Intestinal', subject: 'Biologia', category: 'definicao',
    definition: 'Conjunto de bilhões de microrganismos (principalmente bactérias) que vivem no intestino humano, auxiliando na digestão, produção de vitaminas e no funcionamento do sistema imunológico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-rosalind-franklin', term: 'Rosalind Franklin', subject: 'Biologia', category: 'pessoa',
    definition: 'Química e cristalógrafa inglesa cujas imagens de difração de raios-X (incluindo a famosa "Foto 51") foram fundamentais pra descoberta da estrutura do DNA por Watson e Crick — reconhecimento que ela só recebeu de forma mais ampla após sua morte.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Rosalind_Franklin.jpg', extra_info: '1920 – 1958',
  },

  // ---- Química (bloco 6) ----
  {
    id: 'fb-arrhenius-teoria', term: 'Ácidos e Bases de Arrhenius', subject: 'Química', category: 'definicao',
    definition: 'Teoria clássica que define ácido como substância que libera íons H+ em água, e base como substância que libera íons OH- em água.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bronsted-lowry', term: 'Ácidos e Bases de Bronsted-Lowry', subject: 'Química', category: 'definicao',
    definition: 'Teoria mais ampla que a de Arrhenius: ácido é qualquer espécie capaz de doar um próton (H+); base é qualquer espécie capaz de receber um próton, mesmo sem estar em água.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-oxidos-classificacao', term: 'Óxidos Ácidos, Básicos, Anfóteros e Neutros', subject: 'Química', category: 'definicao',
    definition: 'Classificação dos óxidos conforme seu comportamento: ácidos reagem com água formando ácido; básicos reagem formando base; anfóteros se comportam como ácido ou base; neutros não reagem com água.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-classificacao-sais', term: 'Classificação dos Sais', subject: 'Química', category: 'definicao',
    definition: 'Sais podem ser classificados como normais, ácidos, básicos ou duplos, dependendo se ainda possuem hidrogênios ou hidroxilas ionizáveis em sua estrutura.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-neutralizacao', term: 'Reações de Neutralização', subject: 'Química', category: 'definicao',
    definition: 'Reações entre um ácido e uma base que produzem sal e água, neutralizando as propriedades ácidas e básicas dos reagentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reagente-limitante', term: 'Reagente Limitante e Reagente em Excesso', subject: 'Química', category: 'definicao',
    definition: 'Reagente limitante é consumido completamente numa reação, determinando a quantidade máxima de produto formado; reagente em excesso é o que sobra ao final da reação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pressao-vapor', term: 'Pressão de Vapor', subject: 'Química', category: 'definicao',
    definition: 'Pressão exercida pelo vapor de um líquido quando está em equilíbrio com sua fase líquida, num sistema fechado — quanto mais volátil o líquido, maior sua pressão de vapor.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ponto-fusao-ebulicao', term: 'Ponto de Fusão e Ebulição', subject: 'Química', category: 'definicao',
    definition: 'Ponto de fusão é a temperatura em que uma substância passa do estado sólido pro líquido; ponto de ebulição é a temperatura em que passa do líquido pro gasoso, ambos característicos de cada substância.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-pressao-osmotica', term: 'Pressão Osmótica', subject: 'Química', category: 'definicao',
    definition: 'Pressão necessária pra impedir o fluxo de água através de uma membrana semipermeável entre soluções de concentrações diferentes — quanto maior a concentração de soluto, maior a pressão osmótica.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-afinidade-eletronica', term: 'Afinidade Eletrônica', subject: 'Química', category: 'definicao',
    definition: 'Energia liberada quando um átomo neutro no estado gasoso recebe um elétron, formando um íon negativo — geralmente aumenta da esquerda pra direita na tabela periódica.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-halogenios', term: 'Família dos Halogênios', subject: 'Química', category: 'definicao',
    definition: 'Grupo 17 da tabela periódica (flúor, cloro, bromo, iodo), elementos muito reativos e eletronegativos, que tendem a formar sais ao reagir com metais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-gases-nobres', term: 'Gases Nobres', subject: 'Química', category: 'definicao',
    definition: 'Grupo 18 da tabela periódica (hélio, neônio, argônio, entre outros), elementos com a camada de valência completa, o que os torna extremamente estáveis e pouco reativos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-metais-alcalinos', term: 'Metais Alcalinos', subject: 'Química', category: 'definicao',
    definition: 'Grupo 1 da tabela periódica (lítio, sódio, potássio, entre outros), metais muito reativos, macios, com apenas 1 elétron na camada de valência.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-estrutura-lewis', term: 'Estrutura de Lewis', subject: 'Química', category: 'definicao',
    definition: 'Representação gráfica de uma molécula que mostra os elétrons de valência de cada átomo e como eles estão distribuídos nas ligações químicas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regra-octeto', term: 'Regra do Octeto', subject: 'Química', category: 'definicao',
    definition: 'Tendência dos átomos de ganhar, perder ou compartilhar elétrons pra ficarem com 8 elétrons na camada de valência, alcançando estabilidade eletrônica semelhante à dos gases nobres.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ligacao-dativa', term: 'Ligação Dativa (Coordenada)', subject: 'Química', category: 'definicao',
    definition: 'Tipo de ligação covalente em que apenas um dos átomos fornece o par de elétrons compartilhado, enquanto o outro já tem o octeto completo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-nomenclatura-acidos', term: 'Nomenclatura de Ácidos', subject: 'Química', category: 'definicao',
    definition: 'Sistema de regras pra nomear ácidos conforme sua composição: ácidos sem oxigênio recebem sufixo "-ídrico"; ácidos com oxigênio recebem sufixo "-ico" ou "-oso".',
    examples: 'Ácido clorídrico (HCl) e ácido sulfúrico (H2SO4).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-pilha-daniell', term: 'Pilha de Daniell', subject: 'Química', category: 'definicao',
    definition: 'Uma das primeiras pilhas eletroquímicas desenvolvidas, formada por eletrodos de zinco e cobre em soluções de seus próprios sulfatos, gerando corrente elétrica a partir de uma reação de oxirredução espontânea.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-arrhenius-pessoa', term: 'Svante Arrhenius', subject: 'Química', category: 'pessoa',
    definition: 'Químico sueco que propôs a teoria da dissociação iônica e a definição clássica de ácidos e bases que leva seu nome, ganhador do Prêmio Nobel de Química em 1903.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Svante_Arrhenius_01.jpg', extra_info: '1859 – 1927',
  },
  {
    id: 'fb-robert-boyle', term: 'Robert Boyle', subject: 'Química', category: 'pessoa',
    definition: 'Cientista irlandês considerado um dos fundadores da química moderna, formulou a Lei de Boyle (relação entre pressão e volume de um gás) e defendeu o método experimental na ciência.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Robert_Boyle_0001.jpg', extra_info: '1627 – 1691',
  },

  // ---- Física (bloco 6) ----
  {
    id: 'fb-teorema-trabalho-energia', term: 'Teorema Trabalho-Energia', subject: 'Física', category: 'definicao',
    definition: 'O trabalho realizado pela força resultante sobre um corpo é igual à variação de sua energia cinética — conecta os conceitos de força, deslocamento e energia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-carnot', term: 'Ciclo de Carnot', subject: 'Física', category: 'definicao',
    definition: 'Ciclo termodinâmico teórico ideal, usado como referência pra medir a eficiência máxima possível de uma máquina térmica operando entre duas temperaturas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-entropia', term: 'Entropia', subject: 'Física', category: 'definicao',
    definition: 'Grandeza que mede o grau de desordem de um sistema. A Segunda Lei da Termodinâmica diz que a entropia do universo tende sempre a aumentar em processos espontâneos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-dilatacao-tipos', term: 'Dilatação Linear, Superficial e Volumétrica', subject: 'Física', category: 'definicao',
    definition: 'Formas de dilatação térmica conforme a dimensão considerada: linear (comprimento), superficial (área) e volumétrica (volume) de um corpo ao ser aquecido.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-snell', term: 'Lei de Snell (Refração da Luz)', subject: 'Física', category: 'definicao',
    definition: 'Lei que relaciona os ângulos de incidência e refração da luz ao passar de um meio pra outro, com os índices de refração de cada meio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-espelhos-planos', term: 'Espelhos Planos', subject: 'Física', category: 'definicao',
    definition: 'Superfícies refletoras lisas e planas que formam imagens virtuais, direitas e do mesmo tamanho do objeto, à mesma distância do espelho que o objeto está na frente dele.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-campo-gravitacional', term: 'Campo Gravitacional', subject: 'Física', category: 'definicao',
    definition: 'Região do espaço ao redor de um corpo com massa onde outro corpo com massa sofre uma força de atração gravitacional, cuja intensidade diminui com a distância.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-velocidade-escape', term: 'Velocidade de Escape', subject: 'Física', category: 'definicao',
    definition: 'Velocidade mínima necessária pra um objeto escapar da atração gravitacional de um corpo celeste, sem precisar de propulsão adicional depois do lançamento.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-satelites-orbitas', term: 'Satélites e Órbitas', subject: 'Física', category: 'definicao',
    definition: 'Um satélite permanece em órbita quando sua velocidade horizontal é suficiente pra "cair" na mesma curvatura da Terra continuamente, sem tocar o solo nem escapar pro espaço.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-leis-kepler', term: 'Leis de Kepler', subject: 'Física', category: 'definicao',
    definition: 'Três leis que descrevem o movimento dos planetas ao redor do Sol: órbitas elípticas, velocidades variáveis (mais rápido perto do Sol) e relação entre período orbital e distância.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-aceleracao-centripeta', term: 'Aceleração Centrípeta', subject: 'Física', category: 'definicao',
    definition: 'Aceleração direcionada pro centro de uma trajetória circular, responsável por mudar a direção (não a velocidade escalar) de um corpo em movimento circular.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-frequencia-periodo', term: 'Frequência e Período', subject: 'Física', category: 'definicao',
    definition: 'Frequência é o número de repetições de um fenômeno por unidade de tempo (medida em Hz); período é o tempo necessário pra completar uma repetição — são grandezas inversamente proporcionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ressonancia', term: 'Ressonância', subject: 'Física', category: 'definicao',
    definition: 'Fenômeno em que um sistema vibra com amplitude muito maior quando é excitado numa frequência próxima à sua frequência natural de vibração.',
    examples: 'Uma taça de cristal pode quebrar por ressonância com uma nota musical na frequência certa.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-tensao-superficial', term: 'Tensão Superficial', subject: 'Física', category: 'definicao',
    definition: 'Força que faz a superfície de um líquido se comportar como uma membrana elástica, permitindo que pequenos objetos (ou insetos) flutuem sobre ela sem afundar.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-viscosidade', term: 'Viscosidade', subject: 'Física', category: 'definicao',
    definition: 'Medida da resistência interna de um fluido ao escoamento — quanto mais viscoso, mais devagar o fluido escoa.',
    examples: 'O mel é mais viscoso que a água.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ondas-eletromag-mecanicas', term: 'Ondas Eletromagnéticas vs Mecânicas', subject: 'Física', category: 'definicao',
    definition: 'Ondas eletromagnéticas (luz, ondas de rádio) se propagam mesmo no vácuo; ondas mecânicas (som, ondas na água) precisam de um meio material pra se propagar.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-timbre-altura', term: 'Timbre e Altura do Som', subject: 'Física', category: 'definicao',
    definition: 'Altura é a característica que diferencia um som grave de um agudo (relacionada à frequência); timbre é o que diferencia dois sons de mesma altura tocados por instrumentos diferentes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fusiveis-disjuntores', term: 'Fusíveis e Disjuntores', subject: 'Física', category: 'definicao',
    definition: 'Dispositivos de segurança elétrica que interrompem um circuito quando a corrente ultrapassa um valor seguro, prevenindo incêndios e danos aos equipamentos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-kepler-pessoa', term: 'Johannes Kepler', subject: 'Física', category: 'pessoa',
    definition: 'Astrônomo e matemático alemão que formulou as três leis do movimento planetário, usando os dados de observação de Tycho Brahe, lançando as bases pra Lei da Gravitação Universal de Newton.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Johannes_Kepler_by_Hans_von_Aachen.jpg', extra_info: '1571 – 1630',
  },
  {
    id: 'fb-huygens', term: 'Christiaan Huygens', subject: 'Física', category: 'pessoa',
    definition: 'Físico e astrônomo holandês que propôs a teoria ondulatória da luz e fez contribuições fundamentais em óptica, mecânica e no desenvolvimento do relógio de pêndulo.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Christiaan_Huygens-painting.jpeg', extra_info: '1629 – 1695',
  },

  // ---- Matemática (bloco 6) ----
  {
    id: 'fb-equacao-exponencial', term: 'Equação Exponencial', subject: 'Matemática', category: 'definicao',
    definition: 'Equação em que a incógnita aparece no expoente, geralmente resolvida igualando as bases ou aplicando logaritmo dos dois lados.',
    examples: '2ˣ = 8 → x = 3, pois 2³ = 8.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-equacao-logaritmica', term: 'Equação Logarítmica', subject: 'Matemática', category: 'definicao',
    definition: 'Equação em que a incógnita aparece dentro de um logaritmo, resolvida usando as propriedades dos logaritmos pra isolar a variável.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-inequacao-exp-log', term: 'Inequação Exponencial e Logarítmica', subject: 'Matemática', category: 'definicao',
    definition: 'Inequações envolvendo expressões exponenciais ou logarítmicas, resolvidas considerando o comportamento crescente ou decrescente da função conforme a base.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-propriedades-logaritmos', term: 'Propriedades dos Logaritmos', subject: 'Matemática', category: 'definicao',
    definition: 'Regras que simplificam operações com logaritmos: log de um produto é a soma dos logs; log de um quociente é a diferença; log de uma potência multiplica o expoente pelo log da base.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-forma-trig-complexos', term: 'Forma Trigonométrica de Números Complexos', subject: 'Matemática', category: 'definicao',
    definition: 'Representação de um número complexo usando módulo e argumento (ângulo), em vez da forma algébrica (a + bi), útil pra multiplicação, divisão e potenciação.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-vetores-matematica', term: 'Vetores (Matemática)', subject: 'Matemática', category: 'definicao',
    definition: 'Entidades matemáticas com módulo, direção e sentido, representadas geometricamente por setas, usadas pra representar grandezas físicas e operações geométricas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-operacoes-matrizes', term: 'Operações com Matrizes', subject: 'Matemática', category: 'definicao',
    definition: 'Matrizes podem ser somadas, subtraídas (elemento por elemento, se tiverem mesma dimensão) e multiplicadas (seguindo regras específicas de linhas por colunas).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-regra-cramer', term: 'Regra de Cramer', subject: 'Matemática', category: 'definicao',
    definition: 'Método que usa determinantes pra resolver sistemas de equações lineares, calculando cada incógnita como uma razão entre determinantes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-area-setor-circular', term: 'Área de Setor Circular', subject: 'Matemática', category: 'definicao',
    definition: 'Área de uma "fatia" de círculo, calculada proporcionalmente ao ângulo central em relação ao círculo completo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-comprimento-arco', term: 'Comprimento de Arco', subject: 'Matemática', category: 'definicao',
    definition: 'Medida do comprimento de uma parte curva da circunferência, correspondente a um ângulo central específico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-arranjo-simples', term: 'Arranjo Simples', subject: 'Matemática', category: 'definicao',
    definition: 'Agrupamento ordenado de elementos de um conjunto, em que a ordem importa e nem todos os elementos precisam ser usados.',
    examples: 'As senhas numéricas de 4 dígitos distintos são um exemplo de arranjo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-combinacao-simples', term: 'Combinação Simples', subject: 'Matemática', category: 'definicao',
    definition: 'Agrupamento de elementos de um conjunto em que a ordem NÃO importa, diferente do arranjo.',
    examples: 'Escolher 3 frutas de uma cesta de 10 é uma combinação — não importa a ordem em que foram escolhidas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-permutacao', term: 'Permutação', subject: 'Matemática', category: 'definicao',
    definition: 'Caso particular do arranjo em que todos os elementos de um conjunto são organizados em sequência, calculado pelo fatorial do número de elementos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-espaco-amostral', term: 'Espaço Amostral', subject: 'Matemática', category: 'definicao',
    definition: 'Conjunto de todos os resultados possíveis de um experimento aleatório, usado como base pro cálculo de probabilidades.',
    examples: 'O espaço amostral do lançamento de um dado é {1, 2, 3, 4, 5, 6}.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-eventos-indep-dep', term: 'Eventos Independentes e Dependentes', subject: 'Matemática', category: 'definicao',
    definition: 'Eventos independentes não influenciam a probabilidade um do outro; eventos dependentes têm a probabilidade de um alterada pela ocorrência do outro.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-assintotas', term: 'Assíntotas de uma Função', subject: 'Matemática', category: 'definicao',
    definition: 'Retas que uma função se aproxima cada vez mais, sem nunca tocar, conforme a variável tende ao infinito ou a um valor específico.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-numero-ouro', term: 'Número de Ouro (Proporção Áurea)', subject: 'Matemática', category: 'definicao',
    definition: 'Constante matemática (aproximadamente 1,618) considerada esteticamente harmoniosa, encontrada em obras de arte, arquitetura e também em padrões da natureza.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fibonacci', term: 'Sequência de Fibonacci', subject: 'Matemática', category: 'definicao',
    definition: 'Sequência numérica em que cada termo é a soma dos dois anteriores (1, 1, 2, 3, 5, 8, 13...), frequentemente encontrada em padrões da natureza, como a disposição de pétalas e conchas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bhaskara-pessoa', term: 'Bhaskara', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático e astrônomo indiano (Bhaskara II), autor de importantes tratados sobre álgebra e aritmética. A "Fórmula de Bhaskara" usada no Brasil pra resolver equações do 2º grau é uma homenagem a ele, embora não tenha sido descrita exatamente dessa forma por ele.',
    examples: null, image_url: null, extra_info: '1114 – 1185 (aprox.)',
  },
  {
    id: 'fb-galois', term: 'Évariste Galois', subject: 'Matemática', category: 'pessoa',
    definition: 'Matemático francês que criou as bases da teoria de grupos ainda na adolescência, morrendo aos 20 anos num duelo — na noite anterior, escreveu freneticamente suas ideias matemáticas, reconhecidas como geniais só depois de sua morte.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Evariste_Galois.jpg', extra_info: '1811 – 1832',
  },

  // ---- História (bloco 6) ----
  {
    id: 'fb-bombas-atomicas', term: 'Bombas Atômicas (Hiroshima e Nagasaki)', subject: 'História', category: 'definicao',
    definition: 'Ataques nucleares dos Estados Unidos contra as cidades japonesas de Hiroshima e Nagasaki em agosto de 1945, que mataram centenas de milhares de pessoas e levaram à rendição do Japão, encerrando a Segunda Guerra Mundial.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-plano-marshall', term: 'Plano Marshall', subject: 'História', category: 'definicao',
    definition: 'Programa dos Estados Unidos de ajuda econômica pra reconstrução da Europa Ocidental após a Segunda Guerra Mundial, também usado como estratégia pra conter a expansão do comunismo durante a Guerra Fria.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-revolucao-iraniana', term: 'Revolução Iraniana (1979)', subject: 'História', category: 'definicao',
    definition: 'Movimento que derrubou o governo do Xá do Irã (apoiado pelo Ocidente) e instaurou uma república islâmica liderada pelo Aiatolá Khomeini, mudando profundamente a geopolítica do Oriente Médio.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-primavera-arabe', term: 'Primavera Árabe', subject: 'História', category: 'definicao',
    definition: 'Onda de protestos e revoltas populares que varreu diversos países árabes a partir de 2010, exigindo o fim de regimes autoritários — com resultados muito diferentes entre os países, de queda de ditadores a guerras civis.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-chegada-familia-real', term: 'Chegada da Família Real Portuguesa ao Brasil', subject: 'História', category: 'definicao',
    definition: 'Em 1808, fugindo da invasão napoleônica, a família real portuguesa e a corte se transferiram pro Brasil, elevando o Rio de Janeiro à condição de sede do império português e mudando profundamente a colônia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-bandeirantes', term: 'Bandeirantes', subject: 'História', category: 'definicao',
    definition: 'Exploradores paulistas dos séculos 16 a 18 que percorreram o interior do Brasil em expedições (bandeiras) em busca de riquezas minerais e indígenas pra escravizar, contribuindo pra expansão territorial da colônia.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-ouro', term: 'Ciclo do Ouro', subject: 'História', category: 'definicao',
    definition: 'Período do século 18 marcado pela intensa exploração de ouro em Minas Gerais, que deslocou o eixo econômico e demográfico da colônia pro interior e gerou forte controle fiscal da Coroa Portuguesa.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-borracha', term: 'Ciclo da Borracha', subject: 'História', category: 'definicao',
    definition: 'Período de exploração econômica da borracha na Amazônia, com dois momentos de auge (fim do século 19 e Segunda Guerra Mundial), que gerou riqueza pontual pra região mas também exploração intensa dos seringueiros.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-golpe-1964', term: 'Golpe de 1964', subject: 'História', category: 'definicao',
    definition: 'Movimento militar que derrubou o presidente João Goulart e deu início à ditadura militar brasileira, que duraria até 1985, justificado pelos golpistas como uma ação contra uma suposta ameaça comunista.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-constituicao-1988', term: 'Constituição de 1988', subject: 'História', category: 'definicao',
    definition: 'Conhecida como "Constituição Cidadã", marcou o fim formal da ditadura militar e o início da Nova República, ampliando direitos sociais, políticos e civis no Brasil.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-plano-collor', term: 'Plano Collor', subject: 'História', category: 'definicao',
    definition: 'Plano econômico de 1990 que, entre outras medidas, confiscou temporariamente a poupança dos brasileiros na tentativa de controlar a hiperinflação — gerou forte impacto social e desconfiança na poupança.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-impeachment-collor', term: 'Impeachment de Collor', subject: 'História', category: 'definicao',
    definition: 'Processo de 1992 que afastou Fernando Collor da presidência por denúncias de corrupção, o primeiro impeachment presidencial da Nova República brasileira.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-redemocratizacao', term: 'Redemocratização Brasileira', subject: 'História', category: 'definicao',
    definition: 'Processo gradual de transição da ditadura militar pra democracia no Brasil, entre meados dos anos 1970 e a Constituição de 1988, incluindo anistia, eleições diretas e nova ordem constitucional.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-voto-feminino', term: 'Voto Feminino no Brasil', subject: 'História', category: 'definicao',
    definition: 'Conquistado em 1932, durante o governo de Getúlio Vargas, permitiu que mulheres brasileiras votassem pela primeira vez, um marco na luta por direitos políticos femininos no país.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-abolicionismo', term: 'Abolicionismo', subject: 'História', category: 'definicao',
    definition: 'Movimento social e político que lutou pelo fim da escravidão no Brasil ao longo do século 19, através de campanhas, imprensa e mobilização popular, culminando na Lei Áurea de 1888.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-guerra-canudos', term: 'Guerra de Canudos', subject: 'História', category: 'definicao',
    definition: 'Conflito (1896-1897) entre o exército brasileiro e a comunidade liderada por Antônio Conselheiro no sertão da Bahia, encerrado com a destruição total do arraial de Canudos.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-coluna-prestes', term: 'Coluna Prestes', subject: 'História', category: 'definicao',
    definition: 'Movimento de militares rebeldes (tenentistas) que percorreu o interior do Brasil entre 1925 e 1927, protestando contra o governo da Primeira República e defendendo reformas políticas e sociais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-terras-1850', term: 'Lei de Terras de 1850', subject: 'História', category: 'definicao',
    definition: 'Lei que estabeleceu a compra como única forma legal de acesso à terra no Brasil, dificultando o acesso de ex-escravizados e imigrantes pobres à propriedade rural, justamente às vésperas do fim da escravidão.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-dom-joao-vi', term: 'Dom João VI', subject: 'História', category: 'pessoa',
    definition: 'Rei de Portugal que, fugindo da invasão napoleônica, transferiu a corte portuguesa pro Brasil em 1808, elevando o Rio de Janeiro à condição de capital do império e abrindo os portos brasileiros ao comércio internacional.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Jean-Baptiste_Debret_-_Retrato_de_Dom_Jo%C3%A3o_VI_%28MNBA%29.jpg', extra_info: '1767 – 1826',
  },
  {
    id: 'fb-princesa-isabel', term: 'Princesa Isabel', subject: 'História', category: 'pessoa',
    definition: 'Princesa Imperial do Brasil que, atuando como regente na ausência do pai (Dom Pedro II), assinou a Lei Áurea em 13 de maio de 1888, abolindo formalmente a escravidão no país.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Isabel%2C_Princess_Imperial_of_Brazil_c.1887.jpg', extra_info: '1846 – 1921',
  },

  // ---- Geografia (bloco 6) ----
  {
    id: 'fb-hidreletricas', term: 'Hidrelétricas no Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'Usinas que geram energia elétrica a partir da força da água represada, principal fonte de energia elétrica do Brasil — Itaipu e Belo Monte estão entre as maiores do país.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-nordeste-semiarido', term: 'Nordeste Brasileiro (Semiárido)', subject: 'Geografia', category: 'definicao',
    definition: 'Região caracterizada por clima semiárido, chuvas irregulares e vegetação de caatinga, historicamente marcada por secas periódicas e desafios de convivência com a escassez de água.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-internacionalizacao-amazonia', term: 'Internacionalização da Amazônia', subject: 'Geografia', category: 'definicao',
    definition: 'Tema geopolítico controverso sobre supostas propostas (geralmente infundadas ou exageradas) de outros países administrarem ou controlarem a Amazônia, frequentemente usado em discursos sobre soberania nacional.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-fronteiras-brasil', term: 'Fronteiras do Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'O Brasil faz fronteira com 10 países da América do Sul (todos exceto Chile e Equador), possuindo uma das maiores extensões de fronteiras terrestres do mundo.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-metropoles-brasileiras', term: 'Metrópoles Brasileiras', subject: 'Geografia', category: 'definicao',
    definition: 'Grandes centros urbanos que exercem forte influência regional ou nacional, concentrando população, serviços e atividades econômicas — São Paulo, Rio de Janeiro e Brasília são exemplos de metrópoles nacionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-territorios-indigenas', term: 'Territórios Indígenas no Brasil', subject: 'Geografia', category: 'definicao',
    definition: 'Áreas legalmente demarcadas pra proteger a posse e o modo de vida tradicional dos povos indígenas, garantidas pela Constituição de 1988, mas frequentemente alvo de conflitos com interesses agrícolas e de mineração.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-quilombolas', term: 'Quilombolas', subject: 'Geografia', category: 'definicao',
    definition: 'Comunidades descendentes de escravizados que resistiram à escravidão formando quilombos, hoje reconhecidas legalmente com direito à titulação de suas terras tradicionais.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-reforma-urbana', term: 'Reforma Urbana', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de políticas que buscam tornar as cidades mais justas e organizadas, incluindo regularização fundiária, moradia popular e melhor distribuição de infraestrutura urbana.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-plano-diretor', term: 'Plano Diretor Municipal', subject: 'Geografia', category: 'definicao',
    definition: 'Instrumento de planejamento urbano obrigatório pra cidades com mais de 20 mil habitantes, que define regras de uso e ocupação do solo, buscando organizar o crescimento urbano.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-mobilidade-urbana', term: 'Mobilidade Urbana', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de deslocamentos das pessoas dentro das cidades, cuja qualidade depende de transporte público eficiente, infraestrutura viária e planejamento urbano integrado.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-poluicao-atmosferica', term: 'Poluição Atmosférica', subject: 'Geografia', category: 'definicao',
    definition: 'Presença de substâncias nocivas no ar, geralmente causadas por veículos, indústrias e queimadas, prejudicando a saúde humana e contribuindo pro aquecimento global.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-poluicao-oceanos', term: 'Poluição dos Oceanos', subject: 'Geografia', category: 'definicao',
    definition: 'Contaminação dos mares por resíduos (especialmente plástico), esgoto e produtos químicos, formando inclusive grandes acúmulos de lixo flutuante, como a "Ilha de Lixo do Pacífico".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-geopolitica-petroleo', term: 'Geopolítica do Petróleo', subject: 'Geografia', category: 'definicao',
    definition: 'Influência estratégica que o controle de reservas de petróleo exerce nas relações internacionais, especialmente no Oriente Médio, região com as maiores reservas mundiais e histórico de conflitos ligados ao recurso.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-uniao-europeia', term: 'União Europeia', subject: 'Geografia', category: 'definicao',
    definition: 'Bloco econômico e político que integra a maioria dos países europeus, com moeda comum (o euro, adotada por parte dos membros) e livre circulação de pessoas e mercadorias entre os países participantes.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-periferia-urbana', term: 'Periferia Urbana', subject: 'Geografia', category: 'definicao',
    definition: 'Áreas afastadas do centro das cidades, geralmente com menor infraestrutura e mais carentes de serviços públicos, onde vive grande parte da população de baixa renda nas metrópoles brasileiras.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-exodo-urbano', term: 'Êxodo Urbano', subject: 'Geografia', category: 'definicao',
    definition: 'Movimento inverso ao êxodo rural: saída de moradores de grandes cidades em direção a cidades menores ou áreas rurais, geralmente buscando melhor qualidade de vida ou custo de vida menor.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-renda-per-capita', term: 'Renda Per Capita', subject: 'Geografia', category: 'definicao',
    definition: 'Indicador que divide a renda total de um país pelo número de habitantes, dando uma média da riqueza por pessoa — mas que pode esconder grandes desigualdades internas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-linha-equador-tropicos', term: 'Linha do Equador e Trópicos', subject: 'Geografia', category: 'definicao',
    definition: 'A Linha do Equador divide a Terra em hemisférios Norte e Sul; os Trópicos de Câncer e Capricórnio marcam os limites da zona tropical, onde o sol incide mais diretamente ao longo do ano.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-aziz-absaber', term: 'Aziz Ab\'Saber', subject: 'Geografia', category: 'pessoa',
    definition: 'Geógrafo brasileiro considerado um dos maiores cientistas do país, criador do conceito de "domínios morfoclimáticos" pra explicar a diversidade de paisagens naturais brasileiras, e grande defensor da preservação ambiental.',
    examples: null, image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Aziz_Ab%27Saber_3.jpg', extra_info: '1924 – 2012',
  },
  {
    id: 'fb-bacia-sedimentar', term: 'Bacia Sedimentar', subject: 'Geografia', category: 'definicao',
    definition: 'Grande depressão na crosta terrestre preenchida por camadas de sedimentos ao longo de milhões de anos, frequentemente associada à formação de petróleo e gás natural.',
    examples: null, image_url: null, extra_info: null,
  },

  // ---- Inglês (bloco 6) ----
  {
    id: 'fb-present-perfect-continuous', term: 'Present Perfect Continuous', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (have/has been + verbo com -ing) usado pra ações que começaram no passado e continuam até o presente, enfatizando a duração.',
    examples: '"I have been studying for three hours." (Estou estudando há três horas.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-past-perfect-continuous', term: 'Past Perfect Continuous', subject: 'Inglês', category: 'definicao',
    definition: 'Tempo verbal (had been + verbo com -ing) usado pra ações que estavam em progresso antes de outro momento no passado.',
    examples: '"She had been working there for years before she quit." (Ela estava trabalhando lá havia anos antes de pedir demissão.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-would-past-habits', term: 'Would (Past Habits)', subject: 'Inglês', category: 'definicao',
    definition: 'Usado (junto com "used to") pra descrever hábitos repetidos no passado, mas não pra estados — só ações.',
    examples: '"When I was a kid, I would play outside every day." (Quando eu era criança, eu brincava lá fora todo dia.)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-must-have-to', term: 'Must vs Have To', subject: 'Inglês', category: 'definicao',
    definition: '"Must" expressa obrigação que vem de quem fala (opinião pessoal); "have to" expressa obrigação que vem de uma regra ou autoridade externa.',
    examples: '"I must study more." (decisão própria) vs. "I have to wear a uniform at school." (regra externa)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-defining-nondefining', term: 'Defining and Non-Defining Relative Clauses', subject: 'Inglês', category: 'definicao',
    definition: 'Orações definidoras (sem vírgula) são essenciais pra identificar o substantivo; orações não-definidoras (entre vírgulas) só acrescentam informação extra, que pode ser removida sem mudar o sentido principal.',
    examples: '"The book that I bought is great." (definidora) vs. "This book, which I bought yesterday, is great." (não-definidora)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-noun-clauses', term: 'Noun Clauses', subject: 'Inglês', category: 'definicao',
    definition: 'Orações que funcionam como um substantivo dentro de uma frase maior, podendo ser sujeito, objeto ou complemento.',
    examples: '"What she said surprised everyone." (a oração inteira funciona como sujeito)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-subjunctive', term: 'Subjunctive Mood', subject: 'Inglês', category: 'definicao',
    definition: 'Modo verbal usado pra expressar desejos, sugestões ou situações hipotéticas, em estruturas formais como "It is important that..." ou "I suggest that...".',
    examples: '"It is essential that she be informed." (uso formal do subjuntivo)', image_url: null, extra_info: null,
  },
  {
    id: 'fb-separable-inseparable', term: 'Separable and Inseparable Phrasal Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Phrasal verbs separáveis permitem que o objeto fique entre o verbo e a partícula; inseparáveis exigem que o objeto venha sempre depois da partícula.',
    examples: '"Turn the light off" ou "turn off the light" (separável) vs. "Look after the kids" (inseparável, nunca "look the kids after")', image_url: null, extra_info: null,
  },
  {
    id: 'fb-idioms-colors', term: 'Idiomatic Expressions with Colors', subject: 'Inglês', category: 'definicao',
    definition: 'Expressões idiomáticas em inglês que usam cores com sentido figurado, diferente do significado literal.',
    examples: '"Feeling blue" (estar triste), "green with envy" (com muita inveja), "once in a blue moon" (raramente).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-confusing-words', term: "Confusing Words (Its/It's, Your/You're)", subject: 'Inglês', category: 'definicao',
    definition: "Pares de palavras que se confundem na escrita por terem pronúncia igual ou parecida, mas função gramatical diferente: \"its\" (posse) vs \"it's\" (\"it is\"); \"your\" (posse) vs \"you're\" (\"you are\").",
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-silent-letters', term: 'Silent Letters', subject: 'Inglês', category: 'definicao',
    definition: 'Letras que aparecem na escrita de uma palavra em inglês mas não são pronunciadas, um desafio comum pra quem está aprendendo o idioma.',
    examples: '"Knife" (o "k" é mudo), "island" (o "s" é mudo), "hour" (o "h" é mudo).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-negative-prefixes', term: 'Negative Prefixes', subject: 'Inglês', category: 'definicao',
    definition: 'Prefixos que invertem o sentido de uma palavra pro seu oposto: un-, in-, dis-, im-, entre outros.',
    examples: '"Happy" → "unhappy"; "possible" → "impossible"; "agree" → "disagree".', image_url: null, extra_info: null,
  },
  {
    id: 'fb-adjective-suffixes', term: 'Adjective-Forming Suffixes', subject: 'Inglês', category: 'definicao',
    definition: 'Sufixos que transformam substantivos ou verbos em adjetivos, como -ful (cheio de) e -less (sem).',
    examples: '"Care" → "careful" (cuidadoso); "care" → "careless" (descuidado).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-argumentative-essay', term: 'Argumentative Essay Structure', subject: 'Inglês', category: 'definicao',
    definition: 'Estrutura típica de uma redação argumentativa em inglês: introdução com tese, parágrafos de desenvolvimento com argumentos e evidências, e conclusão que retoma a tese.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-cause-effect-connectors', term: 'Cause and Effect Connectors', subject: 'Inglês', category: 'definicao',
    definition: 'Conectores usados especificamente pra ligar uma causa ao seu efeito num texto, como "as a result of", "due to", "consequently".',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-comparing-contrasting', term: 'Comparing and Contrasting Structures', subject: 'Inglês', category: 'definicao',
    definition: 'Estruturas e conectores usados pra comparar semelhanças ("similarly", "likewise") ou destacar diferenças ("on the other hand", "whereas") entre duas ideias.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-listening-strategies', term: 'Listening Strategies', subject: 'Inglês', category: 'definicao',
    definition: 'Técnicas pra melhorar a compreensão auditiva em inglês, como prever o conteúdo antes de ouvir, focar em palavras-chave e não travar em palavras desconhecidas.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-yesno-wh-questions', term: 'Yes/No and Wh- Questions', subject: 'Inglês', category: 'definicao',
    definition: 'Perguntas de sim/não esperam uma resposta afirmativa ou negativa; perguntas com Wh- (what, where, when, why, who, how) pedem uma informação específica.',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-determiners', term: 'Determiners', subject: 'Inglês', category: 'definicao',
    definition: 'Palavras que vêm antes de um substantivo pra especificar sua referência, incluindo artigos (a, the), possessivos (my, your) e demonstrativos (this, that).',
    examples: null, image_url: null, extra_info: null,
  },
  {
    id: 'fb-collective-nouns', term: 'Collective Nouns', subject: 'Inglês', category: 'definicao',
    definition: 'Substantivos que se referem a um grupo de pessoas, animais ou coisas como uma unidade única.',
    examples: '"Team", "family", "audience" e "herd" são substantivos coletivos.', image_url: null, extra_info: null,
  },

  // ---- Redação (3ª leva: 5 novos pensadores) ----
  {
    id: 'fb-rousseau', term: 'Jean-Jacques Rousseau', subject: 'Redação', category: 'pessoa',
    definition: '"O homem nasce livre, e por toda parte encontra-se a ferros."',
    examples: 'Frase de abertura de "Do Contrato Social": Rousseau argumenta que, embora nasçamos livres, as instituições sociais e políticas acabam nos aprisionando e corrompendo. Repertório clássico pra redações sobre liberdade individual, organização social e o papel do Estado.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Maurice_Quentin_de_La_Tour_-_Portrait_of_Jean-Jacques_Rousseau_-_WGA12360.jpg', extra_info: '1712 – 1778',
  },
  {
    id: 'fb-malala', term: 'Malala Yousafzai', subject: 'Redação', category: 'pessoa',
    definition: '"Um livro, uma caneta, uma criança e um professor podem mudar o mundo."',
    examples: 'Dita em seu discurso na ONU em 2013, após sobreviver a um atentado do Talibã por defender o direito de meninas à educação, essa frase resume sua luta: a educação como ferramenta de transformação social. Repertório forte pra redações sobre acesso à educação e direitos das mulheres.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Malala_Yousafzai_2015.jpg', extra_info: '1997 – presente',
  },
  {
    id: 'fb-debord', term: 'Guy Debord', subject: 'Redação', category: 'pessoa',
    definition: '"Tudo o que era vivido diretamente tornou-se mera representação."',
    examples: 'Primeira tese de "A Sociedade do Espetáculo": Debord argumenta que, na sociedade moderna, a experiência autêntica é substituída por imagens e representações — vivemos cada vez mais através de telas, em vez de vivermos diretamente. Repertório muito atual pra redações sobre redes sociais, mídia e superficialidade das relações.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Guy_Debord%2C_painted_portrait.jpg', extra_info: '1931 – 1994',
  },
  {
    id: 'fb-kant', term: 'Immanuel Kant', subject: 'Redação', category: 'pessoa',
    definition: '"Aja apenas segundo uma máxima tal que possas ao mesmo tempo querer que ela se torne lei universal."',
    examples: 'O "imperativo categórico" de Kant propõe um teste ético simples: antes de agir, pergunte-se se seria aceitável que todo mundo agisse da mesma forma. Repertório denso, mas poderoso, pra redações sobre ética, cidadania e responsabilidade coletiva.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Immanuel_Kant_%28painted_portrait%29.jpg', extra_info: '1724 – 1804',
  },
  {
    id: 'fb-hobbes', term: 'Thomas Hobbes', subject: 'Redação', category: 'pessoa',
    definition: '"No estado de natureza, o homem é o lobo do homem."',
    examples: 'Em "Leviatã", Hobbes descreve o estado de natureza (sem governo ou leis) como uma "guerra de todos contra todos", justificando a necessidade de um Estado forte pra garantir a ordem e a segurança social. Repertório útil pra redações sobre violência, papel do Estado e segurança pública.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Thomas_Hobbes_%28portrait%29.jpg', extra_info: '1588 – 1679',
  },

  // ---------- Rodada 2026-09-23 (mais entradas por matéria) ----------
  {
    id: 'fb-renina-angiotensina', term: 'Sistema Renina-Angiotensina-Aldosterona', subject: 'Biologia', category: 'definicao',
    definition: 'Mecanismo hormonal que regula a pressão arterial e o volume sanguíneo. Quando a pressão nos rins cai, eles liberam renina, que converte angiotensinogênio (do fígado) em angiotensina I; esta é convertida em angiotensina II (potente vasoconstritora) nos pulmões, que também estimula a liberação de aldosterona pelas suprarrenais, aumentando a reabsorção de sódio e água.',
    examples: 'Muitos remédios pra hipertensão (os "IECA", como captopril) agem bloqueando a enzima que converte angiotensina I em II.', image_url: null,
    extra_info: 'Conecta fisiologia renal com o sistema cardiovascular — tema recorrente em questões sobre pressão arterial.',
  },
  {
    id: 'fb-hemostasia', term: 'Plaquetas e Hemostasia', subject: 'Biologia', category: 'definicao',
    definition: 'Hemostasia é o conjunto de mecanismos que interrompe hemorragias. As plaquetas (fragmentos celulares sem núcleo) se aderem ao local da lesão do vaso, se agregam formando um tampão plaquetário e liberam substâncias que ativam a coagulação (cascata que transforma fibrinogênio em fibrina, formando o coágulo).',
    examples: 'A hemofilia é uma doença genética em que falta um fator de coagulação, prejudicando a formação do coágulo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-epistasia', term: 'Epistasia', subject: 'Biologia', category: 'definicao',
    definition: 'Interação gênica em que um gene (epistático) inibe ou mascara a expressão fenotípica de outro gene (hipostático), localizado em um lócus diferente. Pode ser dominante ou recessiva, dependendo de como o alelo inibidor se manifesta.',
    examples: 'A cor da pelagem de alguns cães depende de epistasia: um gene pode impedir a expressão da cor determinada por outro gene, resultando sempre em pelagem branca.', image_url: null,
    extra_info: 'Não confundir com pleiotropia (um gene afeta várias características) nem com herança quantitativa (vários genes afetam uma característica).',
  },
  {
    id: 'fb-krebs', term: 'Ciclo de Krebs', subject: 'Biologia', category: 'definicao',
    definition: 'Segunda etapa da respiração celular aeróbica, que ocorre na matriz mitocondrial. O acetil-CoA (vindo da glicólise) é oxidado em uma série de reações cíclicas, liberando CO2 e gerando elétrons transportados por NADH e FADH2 até a cadeia respiratória, além de um pouco de ATP direto.',
    examples: 'Também chamado de ciclo do ácido cítrico, por causa do citrato formado na primeira reação do ciclo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-adh', term: 'ADH (Hormônio Antidiurético)', subject: 'Biologia', category: 'definicao',
    definition: 'Hormônio produzido no hipotálamo e liberado pela hipófise posterior, que aumenta a reabsorção de água nos túbulos renais (principalmente nos ductos coletores), concentrando a urina e reduzindo sua perda de água pelo corpo. É liberado em situações de desidratação ou aumento da osmolaridade do sangue.',
    examples: 'O consumo de álcool inibe a liberação de ADH, por isso causa aumento da produção de urina (efeito diurético).', image_url: null,
    extra_info: 'Também chamado de vasopressina — associe com o controle hídrico do corpo ao estudar o sistema urinário.',
  },
  {
    id: 'fb-barreira-hematoencefalica', term: 'Barreira Hematoencefálica', subject: 'Biologia', category: 'definicao',
    definition: 'Estrutura formada por células endoteliais fortemente unidas (junções oclusivas) nos capilares do encéfalo, que controla seletivamente a passagem de substâncias do sangue para o tecido nervoso, protegendo o cérebro de toxinas e patógenos.',
    examples: 'Muitos medicamentos precisam ser desenvolvidos especificamente pra conseguir atravessar essa barreira e agir no sistema nervoso central.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ligacao-hidrogenio', term: 'Ligação de Hidrogênio', subject: 'Química', category: 'definicao',
    definition: 'Tipo de força intermolecular mais forte entre as dipolo-dipolo, que ocorre quando um átomo de hidrogênio ligado a um elemento muito eletronegativo (F, O ou N) interage com o par de elétrons não ligante de um átomo eletronegativo de outra molécula.',
    examples: 'É a ligação de hidrogênio entre moléculas de água que explica seu alto ponto de ebulição comparado a outros hidretos, como o H2S.', image_url: null,
    extra_info: 'Também é a força responsável por manter as duas fitas da dupla-hélice do DNA unidas entre si.',
  },
  {
    id: 'fb-raoult', term: 'Lei de Raoult', subject: 'Química', category: 'definicao',
    definition: 'Lei que descreve o efeito coligativo da tonoscopia (redução da pressão de vapor de um solvente causada pela adição de um soluto não volátil). A pressão de vapor da solução é proporcional à fração molar do solvente.',
    examples: 'Explica por que a água do mar evapora mais lentamente do que a água doce, na mesma temperatura.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ka-kb', term: 'Constante de Ionização (Ka e Kb)', subject: 'Química', category: 'definicao',
    definition: 'Medida da força de um ácido (Ka) ou de uma base (Kb) fraca em solução aquosa — quanto maior o valor, mais o ácido/base se ioniza e mais forte ele é. É a constante de equilíbrio específica da reação de ionização daquela substância na água.',
    examples: 'O ácido acético (vinagre) tem Ka pequeno (~1,8 x 10⁻⁵), por isso é considerado um ácido fraco.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-kps', term: 'Produto de Solubilidade (Kps)', subject: 'Química', category: 'definicao',
    definition: 'Constante de equilíbrio que indica o quanto um sal pouco solúvel se dissocia em solução aquosa saturada. Quanto menor o Kps, menos solúvel é o composto — usado pra prever se ocorrerá precipitação ao misturar soluções com íons em comum.',
    examples: 'O Kps do AgCl é bem baixo, por isso ele forma precipitado branco quase instantaneamente ao misturar soluções de Ag+ e Cl-.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-lei-lenz', term: 'Lei de Lenz', subject: 'Física', category: 'definicao',
    definition: 'Estabelece que a corrente elétrica induzida em um circuito, por variação de fluxo magnético, tem sentido tal que o campo magnético que ela gera se opõe à variação do fluxo que a originou. É uma consequência da conservação de energia.',
    examples: 'É a Lei de Lenz que explica por que um ímã caindo dentro de um tubo de cobre desce mais devagar do que em queda livre no ar.', image_url: null,
    extra_info: 'Costuma aparecer junto com a Lei de Faraday nas questões de indução eletromagnética — Faraday dá o módulo da fem induzida, Lenz dá o sentido da corrente.',
  },
  {
    id: 'fb-ondas-estacionarias', term: 'Ondas Estacionárias', subject: 'Física', category: 'definicao',
    definition: 'Padrão de vibração formado pela superposição de duas ondas de mesma frequência e amplitude, propagando-se em sentidos opostos (ex.: onda incidente + onda refletida). Formam pontos fixos de amplitude nula (nós) e pontos de amplitude máxima (ventres/antinós), que não se deslocam ao longo do meio.',
    examples: 'As cordas de um violão vibram formando ondas estacionárias — o comprimento da corda determina quais frequências (notas) podem ser produzidas.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-interferencia-ondas', term: 'Interferência de Ondas', subject: 'Física', category: 'definicao',
    definition: 'Fenômeno em que duas ou mais ondas se encontram no mesmo ponto do espaço e se sobrepõem, resultando em uma onda cuja amplitude é a soma (com sinal) das amplitudes individuais. Pode ser construtiva (ondas em fase, amplitude aumenta) ou destrutiva (ondas em oposição de fase, amplitude diminui ou anula).',
    examples: 'Fones de ouvido com cancelamento de ruído usam interferência destrutiva: emitem uma onda sonora oposta ao ruído externo pra anulá-lo.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-equacao-reta', term: 'Equação da Reta', subject: 'Matemática', category: 'definicao',
    definition: 'Representação algébrica de uma reta no plano cartesiano. As formas mais usadas são a geral (ax + by + c = 0) e a reduzida (y = mx + n, em que m é o coeficiente angular/inclinação da reta e n é o coeficiente linear, onde ela cruza o eixo y).',
    examples: 'Dados dois pontos A(x1,y1) e B(x2,y2), o coeficiente angular da reta que passa por eles é m = (y2-y1)/(x2-x1).', image_url: null, extra_info: null,
  },
  {
    id: 'fb-funcao-afim', term: 'Função Afim (Função do 1º Grau)', subject: 'Matemática', category: 'definicao',
    definition: 'Função do tipo f(x) = ax + b, com a ≠ 0, cujo gráfico é sempre uma reta. O coeficiente "a" indica a inclinação (taxa de variação) e o "b" indica o valor de f(0), onde a reta cruza o eixo y.',
    examples: 'O custo total de uma corrida de táxi (bandeirada fixa + valor por km rodado) é um exemplo clássico de função afim.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-area-figuras-planas', term: 'Área de Figuras Planas', subject: 'Matemática', category: 'definicao',
    definition: 'Conjunto de fórmulas pra calcular a superfície ocupada por figuras geométricas: triângulo (base x altura / 2), quadrado (lado²), retângulo (base x altura), círculo (π x raio²), trapézio ((base maior + base menor) x altura / 2), entre outras.',
    examples: 'Muitas questões de vestibular combinam várias figuras (ex.: um círculo inscrito em um quadrado) e pedem a área da região sombreada, que costuma ser a diferença entre as áreas das figuras.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-imperialismo', term: 'Imperialismo', subject: 'História', category: 'definicao',
    definition: 'Processo de expansão e dominação política, econômica e territorial de potências industrializadas (sobretudo europeias) sobre regiões da África e da Ásia, entre o final do século XIX e início do XX, justificado por ideologias como o darwinismo social e a "missão civilizadora".',
    examples: 'A Conferência de Berlim (1884-85) formalizou a partilha do continente africano entre as potências europeias.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-abolicao-escravatura', term: 'Abolição da Escravatura', subject: 'História', category: 'definicao',
    definition: 'Processo de extinção legal da escravidão no Brasil, concluído com a Lei Áurea (13 de maio de 1888), assinada pela Princesa Isabel. Foi precedido por leis graduais (Lei Eusébio de Queirós, Lei do Ventre Livre, Lei dos Sexagenários) e pela pressão do movimento abolicionista.',
    examples: 'O Brasil foi o último país das Américas a abolir oficialmente a escravidão.', image_url: null,
    extra_info: 'Questões costumam cobrar a ausência de políticas de reparação/integração social aos libertos após 1888 — tema recorrente também em Redação.',
  },
  {
    id: 'fb-descolonizacao-africa', term: 'Descolonização da África', subject: 'História', category: 'definicao',
    definition: 'Processo de independência das colônias africanas em relação às potências europeias, concentrado principalmente entre as décadas de 1950 e 1970, impulsionado por movimentos nacionalistas e pelo enfraquecimento das metrópoles após a Segunda Guerra Mundial.',
    examples: 'Muitas fronteiras africanas atuais seguem os limites artificiais traçados pelos colonizadores, sem respeitar a diversidade étnica local — causa de vários conflitos posteriores.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-tratado-versalhes', term: 'Tratado de Versalhes', subject: 'História', category: 'definicao',
    definition: 'Acordo assinado em 1919, que oficializou o fim da Primeira Guerra Mundial e impôs duras sanções à Alemanha (perda de territórios, redução das forças armadas e pesadas indenizações de guerra). O ressentimento gerado é apontado como um dos fatores que favoreceram a ascensão do nazismo.',
    examples: 'A "cláusula da culpa de guerra" (artigo 231) responsabilizava a Alemanha sozinha pelo conflito.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-ciclo-hidrologico', term: 'Ciclo Hidrológico', subject: 'Geografia', category: 'definicao',
    definition: 'Movimento contínuo da água entre a atmosfera, a superfície terrestre e os oceanos, por meio de processos como evaporação, transpiração, condensação, precipitação, infiltração e escoamento superficial. É movido pela energia solar e pela gravidade.',
    examples: 'O desmatamento de grandes áreas florestadas, como a Amazônia, reduz a evapotranspiração e pode alterar o regime de chuvas regionais.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-intemperismo', term: 'Intemperismo', subject: 'Geografia', category: 'definicao',
    definition: 'Conjunto de processos físicos, químicos e biológicos que desgastam e decompõem as rochas na superfície terrestre, formando os solos. Pode ser físico (variação de temperatura, congelamento), químico (dissolução, oxidação) ou biológico (raízes, organismos).',
    examples: 'Em climas tropicais úmidos, como o do Brasil, o intemperismo químico é predominante, favorecendo a formação de solos profundos como o laterítico.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-hidrografia-brasileira', term: 'Hidrografia Brasileira', subject: 'Geografia', category: 'definicao',
    definition: 'Estudo da distribuição dos rios, bacias hidrográficas e demais corpos d\'água do território brasileiro. O Brasil possui uma das maiores redes hidrográficas do mundo, com destaque para as bacias Amazônica, do Paraná, do São Francisco e do Tocantins-Araguaia.',
    examples: 'A bacia Amazônica é a maior do mundo em volume de água e extensão territorial.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-litoral-brasileiro', term: 'Litoral Brasileiro', subject: 'Geografia', category: 'definicao',
    definition: 'Faixa costeira do Brasil, com mais de 7.000 km de extensão, que concentra grande parte da população e das principais cidades do país. Apresenta grande diversidade de paisagens, como falésias, dunas, manguezais, restingas e recifes de coral.',
    examples: 'A "Amazônia Azul" é o nome dado à extensa área marítima sob soberania econômica do Brasil, rica em recursos pesqueiros e petrolíferos.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-bioma-amazonia', term: 'Bioma Amazônia', subject: 'Geografia', category: 'definicao',
    definition: 'Maior bioma brasileiro, floresta tropical úmida com altíssima biodiversidade, clima quente e chuvoso o ano todo. Desempenha papel fundamental no equilíbrio climático global, por sua capacidade de absorver carbono e influenciar o regime de chuvas do continente.',
    examples: 'O fenômeno dos "rios voadores" descreve as massas de vapor d\'água que a floresta libera e que são transportadas pelos ventos até outras regiões do Brasil.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-mercosul', term: 'Mercosul', subject: 'Geografia', category: 'definicao',
    definition: 'Mercado Comum do Sul, bloco econômico criado em 1991 (Tratado de Assunção) para promover a integração econômica entre seus membros por meio da livre circulação de bens, serviços e fatores produtivos, além de uma tarifa externa comum. Membros fundadores: Brasil, Argentina, Paraguai e Uruguai.',
    examples: 'A Venezuela foi suspensa do bloco em 2017 por descumprir cláusulas democráticas do tratado.', image_url: null, extra_info: null,
  },
  {
    id: 'fb-linking-words-essay', term: 'Linking Words for Essays', subject: 'Inglês', category: 'definicao',
    definition: 'Conectivos usados pra dar coesão a um texto em inglês, ligando ideias de contraste (however, although), adição (moreover, furthermore), causa (because, since) e conclusão (therefore, thus, in conclusion).',
    examples: '"The study was small; however, its results were significant." / "Moreover, the data suggests a clear trend."', image_url: null, extra_info: null,
  },
  {
    id: 'fb-question-auxiliary', term: 'Question Formation with Auxiliary Verbs', subject: 'Inglês', category: 'definicao',
    definition: 'Em inglês, perguntas em geral se formam invertendo a ordem entre o verbo auxiliar (do, does, did, is, are, have, etc.) e o sujeito da frase — diferente do português, que costuma só mudar a entonação.',
    examples: '"Do you like coffee?" (não "*Like you coffee?") / "Did she call you yesterday?"', image_url: null, extra_info: null,
  },
]
