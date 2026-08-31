# Acervo de provas: pipeline de ingestão dos PDFs

Transforma o acervo de PDFs em duas tabelas no Postgres
`source_documents` e `document_pages` - com busca full-text em português.

| Medida | Valor |
| --- | --- |
| Arquivos | 1.923 PDFs → **1.899 únicos** (24 duplicatas exatas por sha256) |
| Páginas | **24.089**, todas com texto |
| Origem do texto | 21.634 da camada nativa · 2.455 por OCR (243 em branco) |
| Caracteres | **50.540.179** |
| Instituições | 71 · anos 2000–2027 |
| Confiança do OCR | média 87,2% · mediana 91,4% |
| Busca full-text | ~2 ms por consulta (GIN sobre tsvector) |
| Questões extraídas | **26.844** com 130.499 alternativas |
| Questões validadas | **13.301** (extração limpa + gabarito confirmado + sem conflito) · 12.994 distintas |
| Fórmulas remontadas | 5.875 páginas · 1.395 questões validadas |
| Figuras recortadas | **17.535** · 8.185 ligadas à questão dona |
| Confirmadas por cópia | 556 · **84 em conflito** (fora das validadas) |
| Disciplina sugerida | 14.250 (75,5% de acerto medido, sugestão, não rótulo) |
| Questões discursivas | 8.192 extraídas de 421 provas sem alternativa |

O princípio do pipeline é **não inventar dado**. Tudo que é inferido carrega a
origem da inferência (`ano_fonte`, `tipo_fonte`, `ordem`, `ocr_conf`), e o que
não pôde ser determinado fica nulo e aparece no relatório de validação.

## Como rodar

```bash
pnpm ingest:inventory   # 01 - varre o acervo, hash, páginas, camada de texto
pnpm ingest:text        # 02 - extrai o texto nativo do PDF
pnpm ingest:ocr         # 03 - OCR das páginas escaneadas (Tesseract pt)
pnpm ingest:ocr -- --retry-rotacao 70   # reprocessa páginas deitadas
pnpm ingest:dataset     # 04 - consolida e reclassifica pelo conteúdo
pnpm db:migrate         # cria/atualiza as tabelas
pnpm ingest:load        # 05 - carrega no Postgres
pnpm ingest:validate    # 06 - métricas + amostra visual para conferência

pnpm ingest:questions      # 07 - quebra as provas em questões
pnpm ingest:gabaritos      # 08 - lê os gabaritos (número -> letra)
pnpm ingest:link           # 09 - liga questão ao gabarito
pnpm ingest:dedup          # 12 - duplicatas + validação cruzada
pnpm ingest:load-questions # 10 - carrega as questões no Postgres

pnpm ingest:figures        # 11 - recorta figuras e liga à questão dona
pnpm ingest:load-figures   # 14 - carrega as figuras
pnpm ingest:gold amostrar  # 13 - folha de conferência manual
pnpm ingest:gold medir     #      acurácia contra os vereditos
```

O OCR usa 4 processos por padrão: nesta máquina (8 GB) rodar com 8 estourou a
memória e derrubou o Postgres no meio da carga. `--workers` ajusta.

`pnpm ingest:all` encadeia 01→05. Todas as etapas são idempotentes e
incrementais: a chave é o `sha256` do arquivo, então rodar de novo só reprocessa
o que mudou (use `--force` para refazer).

## Onde fica o acervo

Os PDFs **não** ficam dentro do repositório: são originais pesados, não
versionáveis e não regeneráveis a partir do código. Hoje estão em
`D:/projetos/conteudo`, que é o padrão dos scripts.

Outra máquina (ou outro local) aponta pela variável de ambiente `ACERVO_DIR`:

```bash
ACERVO_DIR=/caminho/para/o/acervo pnpm ingest:inventory
```

A estrutura esperada é a mesma de sempre: `Privadas/` e `Públicas/` na raiz do
acervo, e a taxonomia (categoria → instituição → ano → subpasta) derivada do
caminho relativo a ela. Mudar o valor de `ACERVO_DIR` sem mudar a árvore por
dentro não invalida nada já processado: a chave é o `sha256` do arquivo, não o
caminho.

Requisitos: Python 3 com `pymupdf` (`pip install pymupdf`) e
[Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) com o idioma
`por` - o script acha o executável sozinho nos caminhos usuais do Windows.

## As etapas

**01 · inventário** (`data/pdf-inventory.jsonl`)
Percorre a árvore e, para cada PDF, registra taxonomia (categoria →
instituição → ano → subpasta), `sha256`, número de páginas e quantos caracteres
existem por página. Página com menos de 120 caracteres é tratada como sem
camada de texto, o suficiente para separar scan de PDF digital sem confundir
com um cabeçalho solto.

**02 · texto nativo** (`data/text/<ab>/<sha256>.json.gz`)

O texto **não** vem de `get_text("text")`, e sim montado span a span a partir de
`get_text("dict")`. A diferença importa: `get_text("text")` achata expoente e
índice, então `R = σT⁴` chegava ao banco como `R = σT4` e `C₅₁H₉₈O₆` como
`C51H98O6` - coisas diferentes numa prova de exatas. Com o tamanho e a linha de
base de cada span dá para saber o que era sobrescrito e o que era subscrito e
remontar em Unicode. O sinal do expoente negativo vem num span de tamanho
normal, fora do sobrescrito, e é reconhecido por adjacência (`10⁻¹`, não `10-1`).

Cada página guarda também suas **linhas com assinatura tipográfica** (fonte,
tamanho, negrito) em `linhas` - é o que a etapa 07 usa para separar número de
questão de número de página.

Aqui mora o problema mais sutil: **ordem de leitura**. Prova de vestibular é
diagramada em duas colunas, e a ordem em que o texto está gravado no arquivo
nem sempre é a ordem em que se lê. O script extrai a página de duas formas
na ordem nativa do arquivo e remontada geometricamente (detecção da calha entre
colunas por perfil de projeção, com faixas de largura total tratadas à parte)
e escolhe a melhor pelo `order_score`: quantos marcadores aparecem em sequência
crescente (`QUESTÃO 32 → 33 → 34`, alternativas `A → B → C → D → E`). A escolha
fica gravada em `ordem` (`nativa` | `geometrica`).

Medir em vez de supor foi o que evitou o erro aqui: a remontagem geométrica
piorava o ENEM, onde a ordem nativa já estava certa. No acervo inteiro, 21.236
páginas ficaram com a ordem nativa e 2.853 com a geométrica.

Um detalhe que custou caro até aparecer: provas diagramadas em InDesign separam
`QUESTÃO` do número com **espaço fino** (U+2009), não com espaço comum, e
trazem caracteres de controle no lugar de marcadores. Antes de normalizar isso,
a conferência acusava "1 questão" em provas de 90, o texto estava perfeito, o
padrão de contagem é que não enxergava. `clean_text` normaliza toda a família
de espaços Unicode, e os padrões usam `[^\S\n]` em vez de `[ \t]`.

**03 · OCR**
Renderiza a 300 dpi em escala de cinza e passa no Tesseract (`-l por`) em modo
TSV, que devolve **confiança por palavra** e a caixa de cada linha. A confiança
vira `ocr_conf` na página; as caixas passam pelo mesmo critério de ordem de
leitura da etapa 02. Páginas em branco ficam como `ocr_vazio` - não somem, ficam
declaradas.

`--retry-rotacao 70` refaz em 90° e 270° as páginas que saíram com confiança
baixa. Provas trazem tabela periódica, mapas e cartões-resposta deitados; o OSD
do Tesseract erra a orientação nesses casos (reportou "script hebraico" com 8%
de confiança numa tabela periódica em português), então a decisão é por força
bruta, reconhece nas três orientações e fica com a melhor, exigindo pelo menos
5 pontos de ganho para trocar. Isso melhorou **348 páginas em +39,6 pontos** de
confiança média: tabelas periódicas passaram de 49% para 92%.

**04 · consolidação** (`data/documents.jsonl`)
Reclassifica o tipo do documento pelo **conteúdo**, não só pelo nome: conta
marcadores de questão, alternativas, pares `número → letra` típicos de gabarito
e blocos completos de alternativas A–E. Esse último é o sinal mais confiável de
"quantas questões objetivas há aqui", porque não depende de como a banca
diagrama o número, há provas em que a palavra "QUESTÃO" e o número saem em
blocos de texto separados.

O conteúdo só sobrepõe o nome quando o sinal é forte, e `tipo_fonte` guarda quem
decidiu (1.250 por conteúdo, 649 pelo nome). O ganho é concreto: arquivos sem
tipo identificável caíram de **465 para 67**, e `prova_objetiva` subiu de 131
para 813. Também deriva `fase`, `curso` e `instituicao_slug`.

**05 · carga**, `on conflict (sha256) do update`, páginas substituídas.

**06 · validação** (`data/validacao.json` + `data/validacao.html`)
Métricas agregadas e uma amostra visual estratificada (página renderizada ao
lado do texto extraído dela) com semente fixa, para a conferência ser
repetível. Inclui o cruzamento prova × gabarito: o gabarito tem tantas
respostas quanto a prova tem questões? **210 de 245 grupos fecham (85,7%)**.

Os 35 restantes são, em quase todos os casos, artefato do agrupamento e não
falha de extração: a PUC-RS guarda a prova fatiada por matéria com um gabarito
único; a FASM e a UNICID têm arquivos chamados "Gabarito I 20xx.pdf" cujo
conteúdo é uma prova (20 questões, zero pares de resposta, a palavra "gabarito"
não aparece no texto), casos em que a classificação por conteúdo está certa e
o nome do arquivo no acervo é que está errado.

**07 · questões** (`data/questions.jsonl`)
A âncora da segmentação é o **bloco de alternativas**, não o número da questão.
Cada banca diagrama o número de um jeito, `QUESTÃO 07`, `07.`, `07` sozinho
numa linha, ou a palavra e o número em blocos de texto separados, mas toda
questão objetiva termina numa sequência A-B-C-D(-E). O número é procurado
depois, para trás, e serve para **validar**, não para segmentar.

Três armadilhas resolvidas aqui, todas descobertas conferindo o resultado
contra o PDF:

- A última alternativa não tem marcador depois dela, então avançava e engolia o
  enunciado da questão seguinte (3.800 enunciados vazios). Ela agora é limitada
  pelo tamanho das alternativas irmãs, pelo próximo marcador e pelo próximo
  bloco.
- Bancas do padrão VUNESP imprimem o número da página sozinho numa linha,
  igualzinho ao número da questão. A questão 05 da Famerp virou "questão 4" e
  herdou a resposta da questão 4 no gabarito. Agora um candidato é descartado
  quando está no topo da página **e** vale exatamente o número daquela página.
- Aceitar qualquer número baixo como "reinício de numeração" deixava rótulo de
  gráfico passar por número de questão. Reinício só vale voltando a 1 ou 2
  depois de a numeração ter avançado.

A **assinatura tipográfica** fecha o caso: número de questão e número de página
são indistinguíveis no texto puro, mas a banca imprime cada um com sua fonte
na Famerp o da questão é `Swiss721BT-BoldCondensed` 9pt negrito e o da página é
`Swiss721BT-RomanCondensed` 9pt sem negrito. O parser agrupa os candidatos por
(fonte, tamanho, negrito) e fica com o grupo cujos valores formam a maior
sequência crescente, que é o que uma numeração de prova faz e um número de
página não faz. Esses números filtram os candidatos fracos.

A tipografia **preenche lacuna, nunca sobrepõe** o texto: a primeira versão
atribuía o número pela posição do bloco e trocava `20.` lido no PDF por `19`
deduzido, a consistência caiu de 100% para 98,6%. Subordinada ao marcador
explícito, voltou a **99,99%** (9.290 de 9.291).

**08 · gabaritos** (`data/answers.jsonl`)
Extrai os pares número → letra. O cuidado é com prova de várias versões de
caderno: a PUC-CAMP imprime o mesmo número sete vezes, com letras diferentes.
Quando as letras de um número divergem, ele vira `conflito` e **não** vira
resposta, 854 números foram descartados por isso.

Gabarito impresso em **mais de uma coluna** é lido pela geometria das linhas, não
pelo texto corrido. A PUC-RS publica num único PDF a chave do 1º dia (questões
1–30: Física, Biologia, Português) ao lado da do 2º dia (1–60: as demais); lido
em sequência vira `1 - E / 1 - E / 2 - C / 2 - A`, e o detector de conflito
descartava as duas. Separadas por `x`, cada coluna vira uma chave própria com o
cabeçalho que a identifica. Colunas com faixas de número **disjuntas** (uma por
matéria) são unidas com segurança; faixas sobrepostas são versões de caderno e
ficam separadas, juntar ali seria escolher resposta no chute.

**09 · ligação** (`data/questions_final.jsonl`)
Só vincula quando dá para provar que o gabarito é daquela prova: mesma
instituição/ano/fase/curso, um único candidato (ou desempate pelo código da
gráfica, depois pela pasta), e pelo menos 80% dos números da prova presentes no
gabarito. Quando a chave inteira não serve mas o gabarito tem colunas, escolhe a
coluna por duas evidências em ordem, a faixa de números precisa conter as
questões daquela prova (`…_2D_ESP.pdf` tem as questões 51 a 60, e só a coluna do
2º dia chega lá), e empatando, a matéria declarada no nome do arquivo (`_BIO`)
tem que aparecer na lista de matérias do cabeçalho da coluna. Por fim, a letra tem que existir entre as alternativas
lidas. Questão sem resposta fica no banco com `gabarito_letra` nulo, o que não
entra é resposta adivinhada.

**11 · figuras** (`data/figures/` + `library_figures`)
Uma questão que diz "de acordo com o gráfico" não se responde só com texto. O
script recorta imagens embutidas e aglomerados de desenho vetorial (a maioria
dos gráficos de prova é vetorial) e descobre a questão dona pela geometria: a
âncora do número de questão logo acima da figura, na mesma coluna. Figura que
está acima da primeira âncora pertence ao texto-base do grupo, não a uma questão
- fica com `questao_numero` nulo em vez de ser atribuída à toa.

**12 · duplicatas e validação cruzada**
A mesma prova aparece em vários cadernos e em cópias em pastas diferentes. Cada
cópia foi extraída de forma independente, o que dá uma segunda opinião de graça.
O detalhe que importa: entre cadernos a banca **embaralha as alternativas**, então
a conferência não pode ser pela letra, é pelo TEXTO da alternativa correta.
Concordância vira `confirmada_por_duplicata`; discordância vira
`conflito_duplicata`, e as duas cópias vão para revisão.

Enunciado curto e genérico ("A sequência correta de preenchimento dos
parênteses, de cima para baixo, é") é idêntico em provas diferentes, então
agrupar só por enunciado criava falsos conflitos. As alternativas desempatam:
cópias da mesma questão compartilham quase todas, questões diferentes quase
nenhuma. Isso desfez 68 grupos falsos e derrubou os conflitos de 179 para 84.

Esta conferência já achou dois defeitos reais:

- Em algumas provas a palavra "QUESTÃO" é impressa como elemento gráfico
  separado do número e chegava colada no fim da última alternativa, duas
  cópias da mesma questão davam "finalidade" e "finalidade questao questao".
- **Um gabarito errado no próprio acervo.** A mesma prova VUNESP foi aplicada
  na ANHEMBI (`ANIM2201`, versão 1) e na Unisul (`ANIM2204`, versão 2), com as
  alternativas embaralhadas entre as versões. As duas extrações apontam
  respostas diferentes para a mesma questão. Conferindo a página renderizada e o
  texto da crônica, a extração está exata nas duas e o gabarito da versão 2 é
  que está deslocado uma letra. Sem duas cópias para comparar, esse erro entraria
  no banco como resposta boa.

Por isso `validada` exige também ausência de conflito: uma questão cujas cópias
discordam **não** é dada por boa. Antes disso, 81 questões que o pipeline já
sabia serem suspeitas continuavam marcadas como validadas.

**13 · conjunto de referência** (`data/gold.jsonl`)
Tudo acima é proxy: "89,7% aprovadas" mede quantas passaram nas minhas próprias
regras, não quantas estão certas, e um proxy não detecta uma regressão que
agrada as regras. `amostrar` monta uma amostra estratificada determinista e gera
uma folha com a página do PDF ao lado do que foi extraído; `medir` compara os
vereditos com a extração atual e reporta acurácia por dimensão.

**15 · disciplina** (`data/subjects.jsonl`)
Classificador por léxico, com detecção de idioma para separar Inglês (questão de
inglês sobre ciência caía em Biologia: o termo técnico é o mesmo nas duas
línguas). Medido contra 974 questões de provas monodisciplinares:
**75,5% de acerto com 42,8% de cobertura**. Isso é bom para pré-preencher a
escolha de um curador e **insuficiente** para mostrar a um aluno: por isso vai
para `disciplina_sugerida` e nunca entra em `validada`.

**16 · discursivas** (`data/questions_discursivas.jsonl`)
Provas sem alternativa: a âncora passa a ser o próprio marcador de número. Sem
alternativa não há letra para conferir, então a validação possível é mais fraca
e isso fica declarado, entram com `tipo = discursiva` e nunca como validadas.

## O modelo de dados

`source_documents` - 1 linha por PDF único. Duplicatas exatas do mesmo arquivo
em pastas diferentes ficam em `all_paths` (24 grupos no acervo atual).

| Coluna | O que é |
| --- | --- |
| `sha256`, `rel_path`, `all_paths` | identidade e proveniência |
| `categoria`, `instituicao`, `instituicao_slug`, `ano`, `fase`, `curso` | taxonomia |
| `ano_fonte` | `pasta` ou `arquivo` - de onde veio o ano |
| `tipo`, `tipo_fonte` | `gabarito`/`prova_objetiva`/… e quem decidiu |
| `sinais` | contagens medidas no texto que embasaram a classificação |
| `pages_nativas`, `pages_ocr`, `pages_sem_texto`, `ocr_conf_media` | qualidade |

`document_pages` - 1 linha por página, com `content` e a coluna gerada
`search` (`to_tsvector('portuguese', content)`, índice GIN).

`library_questions` / `library_question_options` - as questões extraídas, com
proveniência completa (`document_id`, `pagina`, `numero`) e os defeitos
declarados em `problemas`. `validada = true` significa: nenhum problema na
extração **e** letra do gabarito confirmada contra as alternativas lidas.
`motivo_ligacao` registra como o gabarito foi escolhido.

Está separado de `questions`/`question_options` de propósito: aqui é o que foi
extraído do PDF; lá é conteúdo curado da plataforma, que exige disciplina e
tópico. A promoção de um para o outro é um passo humano.

## Consultando

```sql
-- busca full-text com trecho destacado
select d.instituicao, d.ano, d.tipo, p.page_number,
       ts_headline('portuguese', p.content, q, 'MaxFragments=2, MinWords=8') as trecho
from document_pages p
join source_documents d on d.id = p.document_id,
     websearch_to_tsquery('portuguese', 'ciclo de Krebs') q
where p.search @@ q
order by ts_rank(p.search, q) desc
limit 20;

-- provas de uma instituição, com o gabarito ao lado
select ano, fase, tipo, rel_path
from source_documents
where instituicao_slug = 'famema'
order by ano desc, tipo;

-- páginas que merecem revisão humana (OCR de baixa confiança)
select d.rel_path, p.page_number, p.ocr_conf
from document_pages p join source_documents d on d.id = p.document_id
where p.source = 'ocr' and p.ocr_conf < 75
order by p.ocr_conf;
```

```sql
-- questões prontas para uso: extração limpa e gabarito confirmado
select lq.instituicao_slug, lq.ano, lq.numero, lq.gabarito_letra, lq.enunciado,
       o.letra, o.texto, o.correta
from library_questions lq
join library_question_options o on o.question_id = lq.id
where lq.validada
  and lq.search @@ websearch_to_tsquery('portuguese', 'ciclo de Krebs')
order by lq.id, o.ordem;

-- o que precisa de revisão humana, e por quê
select problemas, count(*) from library_questions
where not validada group by 1 order by 2 desc;
```

## Usando no app

`src/features/library/queries.ts` expõe o acervo com uma regra atravessando
tudo: **por padrão só sai questão validada e não duplicada**. Quem quiser o
resto precisa pedir (`apenasValidadas: false`), o que só faz sentido em tela de
revisão.

- `buscarQuestoes(filtro)` - busca full-text + filtros, com alternativas agrupadas
- `obterQuestao(id)` - alternativas, figuras e o texto-base de que ela depende
- `buscarNoAcervo(termo)` - busca nas páginas dos PDFs, com trecho destacado
- `filaDeRevisao()` - o que o pipeline marcou como duvidoso, conflito primeiro
- `resumoDoAcervo()` - números para painel administrativo

## O que ainda não está aqui

**Tópico dentro da disciplina.** A disciplina é sugerida com 75,5% de acerto; o
tópico ("genética", "termoquímica") não existe. É o que falta para montar
simulado por assunto.

**As 13.579 questões não validadas.** Ficam no banco com `validada = false` e o
motivo declarado: a maioria pertence a provas cujo gabarito não está no acervo,
o resto são falhas de segmentação (número não crescente, sem número, enunciado
curto). Não somem, ficam separadas das confiáveis, disponíveis para revisão.

**179 conflitos entre cópias.** Duas extrações da mesma questão discordam da
resposta; uma delas está errada. É a fila de revisão mais valiosa que existe,
porque cada item ali é um erro comprovado, não uma suspeita.

**O conjunto de referência tem 9 vereditos**, todos conferidos contra a página
ou resolvendo a questão. Suficiente para provar que a ferramenta funciona e já
mediu duas falhas reais; insuficiente para ser uma medida com intervalo de
confiança. Com as 40 questões da folha conferidas (`data/gold-review.html` está
pronta) passa a ser um número em que dá para confiar.

Note que dois dos vereditos negativos são **erro do acervo, não da extração**
o gabarito da versão 2 daquela prova está deslocado. O conjunto de referência
mede a qualidade do dado final, que é o que importa para o aluno; separar "culpa
do pipeline" de "culpa da fonte" exige olhar o `nota` de cada veredito.

**Notação matemática desenhada.** Letra com barra (`AB` de um segmento), matriz
e fração aparecem como vetor, não como texto, o enunciado sai sem elas. Foi
justamente o que o primeiro veredito do conjunto de referência pegou.

Artefatos em `data/` são regeneráveis e estão fora do git, assim como o
próprio acervo de PDFs (ver [Onde fica o acervo](#onde-fica-o-acervo)).
