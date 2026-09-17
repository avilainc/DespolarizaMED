import { sql, type SQL } from "drizzle-orm";
import { users } from "./auth";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Acervo de provas de vestibular (PDFs fora do repositório, ver ACERVO_DIR
 * em docs/acervo-provas.md).
 *
 * Populado pelo pipeline em scripts/pdf-ingest:
 *   01_inventory.py -> 02_extract_text.py -> 03_ocr.py -> 04_load_postgres.py
 *
 * `sourceDocuments` = 1 linha por PDF único (sha256). Duplicatas exatas do
 * mesmo arquivo em pastas diferentes ficam em `allPaths`.
 * `documentPages`   = 1 linha por página, com o texto e a proveniência da
 * extração (camada nativa do PDF ou OCR, com a confiança medida).
 */

const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

export const sourceDocuments = pgTable(
  "source_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sha256: text("sha256").notNull(),
    relPath: text("rel_path").notNull(),
    allPaths: jsonb("all_paths").$type<string[]>().notNull().default([]),
    filename: text("filename").notNull(),

    // taxonomia derivada da árvore de pastas
    categoria: text("categoria"), // Privadas | Públicas
    instituicao: text("instituicao"),
    instituicaoSlug: text("instituicao_slug"),
    ano: integer("ano"),
    anoFonte: text("ano_fonte"), // pasta | arquivo | null
    subpasta: jsonb("subpasta").$type<string[]>().notNull().default([]),
    /**
     * Banca examinadora (VUNESP, INEP, FUVEST…), detectada uma única vez no
     * pipeline pelas marcas que cada uma imprime. Antes disso, cada consulta
     * redescobria a banca de um jeito diferente — busca por "vunesp" no texto
     * aqui, presença do código da gráfica ali — e os números não batiam.
     */
    banca: text("banca"),
    /** o padrão que decidiu a banca, para auditar a detecção */
    bancaEvidencia: text("banca_evidencia"),
    fase: text("fase"), // PROVA I / 1ª FASE / Verão ... quando identificável
    curso: text("curso"), // MEDICINA / ENFERMAGEM ... quando a pasta separa
    tipo: text("tipo").notNull(), // gabarito | prova_objetiva | prova_discursiva | ...
    /** nome = inferido do arquivo/pasta; conteudo = confirmado pelo texto. */
    tipoFonte: text("tipo_fonte").notNull().default("nome"),
    /** Sinais medidos no texto: nº de questões, alternativas, respostas etc. */
    sinais: jsonb("sinais").$type<Record<string, number | boolean>>(),

    // fatos do arquivo
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    pages: integer("pages").notNull(),
    chars: integer("chars").notNull().default(0),
    pagesNativas: integer("pages_nativas").notNull().default(0),
    pagesOcr: integer("pages_ocr").notNull().default(0),
    pagesSemTexto: integer("pages_sem_texto").notNull().default(0),
    ocrConfMedia: real("ocr_conf_media"),
    pdfMetadata: jsonb("pdf_metadata").$type<Record<string, string>>(),

    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("source_documents_sha256_uq").on(t.sha256),
    index("source_documents_inst_ano_idx").on(t.instituicaoSlug, t.ano),
    index("source_documents_tipo_idx").on(t.tipo),
  ],
);

export const documentPages = pgTable(
  "document_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),

    /** pdf = camada de texto do arquivo; ocr = reconhecido por OCR. */
    source: text("source").notNull(),
    /** coluna-unica | duas-colunas | vazio */
    layout: text("layout"),
    /** nativa = ordem do arquivo; geometrica = remontada por posição. */
    ordem: text("ordem"),
    chars: integer("chars").notNull().default(0),
    ocrConf: real("ocr_conf"),

    content: text("content").notNull().default(""),
    search: tsvector("search").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('portuguese', coalesce(content, ''))`,
    ),
  },
  (t) => [
    uniqueIndex("document_pages_doc_page_uq").on(t.documentId, t.pageNumber),
    index("document_pages_search_idx").using("gin", t.search),
  ],
);

/**
 * Questões extraídas das provas objetivas (etapas 07-09 do pipeline).
 *
 * Separado de `questions` de propósito: aqui está o que foi EXTRAÍDO do PDF,
 * com toda a proveniência e os defeitos declarados em `problemas`. A promoção
 * para `questions` (que exige disciplina e tópico curados) é um passo humano —
 * questão errada na plataforma é pior que questão ausente.
 *
 * `validada = true` significa três coisas ao mesmo tempo: nenhum problema na
 * extração, letra do gabarito confirmada contra as alternativas lidas, e
 * nenhuma cópia da mesma questão apontando resposta diferente.
 */
export const libraryQuestions = pgTable(
  "library_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    numero: integer("numero"),
    /** forte = "QUESTÃO 07"/"07."; fraco = número sozinho numa linha. */
    numeroForca: text("numero_forca"),
    pagina: integer("pagina"),

    /**
     * `objetiva` (múltipla escolha, sempre com 4 ou 5 alternativas) ou
     * `discursiva`. Hoje a tabela só tem objetivas — o parser ancora no bloco
     * de alternativas A-E, então questão sem alternativa nunca chega a ser
     * produzida. A coluna existe para que essa separação seja declarada e não
     * um efeito colateral do parser, já que as discursivas (etapa 16) estão
     * extraídas e podem ser carregadas aqui depois.
     */
    tipo: text("tipo").notNull().default("objetiva"),
    enunciado: text("enunciado").notNull(),

    // desnormalizado para filtrar sem join
    instituicaoSlug: text("instituicao_slug"),
    ano: integer("ano"),
    fase: text("fase"),
    curso: text("curso"),

    gabaritoLetra: text("gabarito_letra"),
    gabaritoDocumentId: uuid("gabarito_document_id").references(
      () => sourceDocuments.id,
      { onDelete: "set null" },
    ),
    /** fração dos números da prova cobertos pelo gabarito escolhido. */
    coberturaGabarito: real("cobertura_gabarito"),
    /** como o gabarito foi escolhido: ok_unico, ok_mesma_pasta, … */
    motivoLigacao: text("motivo_ligacao"),
    anulada: boolean("anulada").notNull().default(false),

    /**
     * A questão referencia algo que não está no próprio enunciado ("de acordo
     * com o texto", "no segundo parágrafo"). O texto de apoio vive no enunciado
     * de outra questão da mesma prova — `contextoNumero` aponta qual.
     */
    dependeDeContexto: boolean("depende_de_contexto").notNull().default(false),
    contextoNumero: integer("contexto_numero"),
    /** faixa_declarada = a prova diz "questões 7 a 9"; proximidade = inferido. */
    contextoFonte: text("contexto_fonte"),

    /** Cópia canônica quando a mesma questão aparece em vários cadernos. */
    duplicataDe: text("duplicata_de"),
    copias: integer("copias").notNull().default(1),
    /** Outra extração independente da mesma questão chegou na mesma resposta. */
    confirmadaPorDuplicata: boolean("confirmada_por_duplicata").notNull().default(false),
    /** Cópias da mesma questão discordam da resposta — uma delas está errada. */
    conflitoDuplicata: boolean("conflito_duplicata").notNull().default(false),

    /**
     * SUGESTÃO de disciplina, não rótulo. Medida contra 974 questões de provas
     * monodisciplinares: 75,5% de acerto com 42,8% de cobertura. Boa o
     * suficiente para pré-preencher a escolha de um curador, insuficiente para
     * ir a um aluno sem revisão — por isso não entra em `validada`.
     */
    disciplinaSugerida: text("disciplina_sugerida"),
    /** lexico | nome_do_arquivo | vizinhanca */
    disciplinaFonte: text("disciplina_fonte"),
    disciplinaPontos: real("disciplina_pontos"),

    /**
     * Tema dentro da disciplina (Genética, Óptica, Estequiometria…). Mais fraco
     * que a disciplina: numa amostra de 10 conferida à mão acertou 6. Está aqui
     * para ser filtrado e corrigido, não para ser exibido como verdade.
     */
    temaSugerido: text("tema_sugerido"),
    temaPontos: real("tema_pontos"),

    /** Denormalizado do documento, para filtrar caderno sem join. */
    banca: text("banca"),

    problemas: jsonb("problemas").$type<string[]>().notNull().default([]),
    validada: boolean("validada").notNull().default(false),

    /**
     * Curadoria humana (/gestao/acervo). `rejeitada` tira a questão da fila e
     * do aluno em definitivo; `revisadaPor`/`revisadaEm` são o último toque —
     * o histórico completo fica em `library_reviews`.
     */
    rejeitada: boolean("rejeitada").notNull().default(false),
    revisadaPor: text("revisada_por").references(() => users.id, { onDelete: "set null" }),
    revisadaEm: timestamp("revisada_em", { withTimezone: true }),

    search: tsvector("search").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('portuguese', coalesce(enunciado, ''))`,
    ),
  },
  (t) => [
    index("library_questions_doc_idx").on(t.documentId, t.numero),
    index("library_questions_inst_ano_idx").on(t.instituicaoSlug, t.ano),
    index("library_questions_validada_idx").on(t.validada),
    // o índice que serve a "monte um caderno de X, da banca Y, de Z em diante"
    index("library_questions_tags_idx").on(
      t.validada,
      t.banca,
      t.disciplinaSugerida,
      t.ano,
    ),
    index("library_questions_tema_idx").on(t.disciplinaSugerida, t.temaSugerido),
    index("library_questions_search_idx").using("gin", t.search),
  ],
);

/**
 * Figuras recortadas das páginas (gráfico, mapa, esquema, fórmula estrutural).
 *
 * `questaoNumero` sai da geometria: a âncora do número de questão logo acima da
 * figura, na mesma coluna. Fica nulo quando a figura pertence a um texto-base
 * que serve a um grupo de questões, e não a uma questão específica.
 */
export const libraryFigures = pgTable(
  "library_figures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    pagina: integer("pagina").notNull(),
    indice: integer("indice").notNull(),
    questaoNumero: integer("questao_numero"),
    /** caminho relativo a data/ — o PNG fica fora do banco */
    arquivo: text("arquivo").notNull(),
    bbox: jsonb("bbox").$type<number[]>().notNull(),
    larguraPx: integer("largura_px"),
    alturaPx: integer("altura_px"),
  },
  (t) => [
    uniqueIndex("library_figures_uq").on(t.documentId, t.pagina, t.indice),
    index("library_figures_questao_idx").on(t.documentId, t.questaoNumero),
  ],
);

export const libraryQuestionOptions = pgTable(
  "library_question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => libraryQuestions.id, { onDelete: "cascade" }),
    letra: text("letra").notNull(),
    texto: text("texto").notNull(),
    /** null quando a questão não tem gabarito confirmado. */
    correta: boolean("correta"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("library_question_options_uq").on(t.questionId, t.letra)],
);

/**
 * Trilha de auditoria da curadoria: quem fez o quê, quando, em qual questão.
 * `antes`/`depois` guardam só os campos que mudaram.
 */
export const libraryReviews = pgTable(
  "library_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => libraryQuestions.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** APROVOU | REJEITOU | CORRIGIU_GABARITO | REABRIU */
    acao: text("acao").notNull(),
    antes: jsonb("antes").$type<Record<string, unknown>>(),
    depois: jsonb("depois").$type<Record<string, unknown>>(),
    nota: text("nota"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("library_reviews_question_idx").on(t.questionId, t.createdAt),
    index("library_reviews_reviewer_idx").on(t.reviewerId, t.createdAt),
  ],
);
