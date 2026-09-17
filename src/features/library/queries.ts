import "server-only";

import { and, asc, desc, eq, inArray, isNull, notInArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { agruparPorRaiz, raizDoGrupo, type MembroDoGrupo } from "./duplicatas";
import {
  documentPages,
  libraryFigures,
  libraryQuestionOptions,
  libraryQuestions,
  libraryReviews,
  sourceDocuments,
  users,
} from "@/lib/db/schema";

/**
 * Acesso ao acervo de provas (tabelas `source_documents`, `document_pages`,
 * `library_questions`, `library_question_options`, `library_figures`).
 *
 * Uma regra atravessa este arquivo: **por padrão só sai questão validada e não
 * duplicada**. Validada = extração sem defeito declarado E gabarito confirmado
 * contra as alternativas lidas. Quem quiser o resto (para revisar) precisa
 * pedir explicitamente com `apenasValidadas: false`.
 */

export type FiltroQuestoes = {
  busca?: string;
  instituicaoSlug?: string;
  ano?: number;
  disciplina?: string;
  tema?: string;
  /** Restringe a estes ids (ex.: favoritas do aluno). Lista vazia = nada. */
  idsIn?: string[];
  /** Exclui estes ids (ex.: já respondidas). */
  idsNotIn?: string[];
  /** Padrão: "objetiva" (múltipla escolha). Passe null para não filtrar. */
  tipo?: "objetiva" | "discursiva" | null;
  /** Padrão: true. Passe false só em telas de revisão. */
  apenasValidadas?: boolean;
  /** Padrão: true. Esconde cópias da mesma questão em cadernos diferentes. */
  esconderDuplicatas?: boolean;
  limite?: number;
  offset?: number;
};

function condicoes(f: FiltroQuestoes): SQL[] {
  const cond: SQL[] = [];
  if (f.tipo !== null) cond.push(eq(libraryQuestions.tipo, f.tipo ?? "objetiva"));
  if (f.apenasValidadas !== false) cond.push(eq(libraryQuestions.validada, true));
  if (f.esconderDuplicatas !== false) cond.push(isNull(libraryQuestions.duplicataDe));
  if (f.instituicaoSlug) cond.push(eq(libraryQuestions.instituicaoSlug, f.instituicaoSlug));
  if (f.ano) cond.push(eq(libraryQuestions.ano, f.ano));
  if (f.disciplina) cond.push(eq(libraryQuestions.disciplinaSugerida, f.disciplina));
  if (f.tema) cond.push(eq(libraryQuestions.temaSugerido, f.tema));
  if (f.idsIn) {
    // inArray com lista vazia gera SQL inválido; "nenhum id" tem que devolver nada.
    cond.push(f.idsIn.length ? inArray(libraryQuestions.id, f.idsIn) : sql`false`);
  }
  if (f.idsNotIn?.length) cond.push(notInArray(libraryQuestions.id, f.idsNotIn));
  if (f.busca?.trim()) {
    cond.push(
      sql`${libraryQuestions.search} @@ websearch_to_tsquery('portuguese', ${f.busca})`,
    );
  }
  return cond;
}

/** Lista questões com as alternativas já agrupadas. */
export async function buscarQuestoes(filtro: FiltroQuestoes = {}) {
  const limite = Math.min(filtro.limite ?? 20, 100);
  const cond = condicoes(filtro);
  const ordem = filtro.busca?.trim()
    ? desc(sql`ts_rank(${libraryQuestions.search}, websearch_to_tsquery('portuguese', ${filtro.busca}))`)
    : desc(libraryQuestions.ano);

  const linhas = await db
    .select({
      id: libraryQuestions.id,
      tipo: libraryQuestions.tipo,
      numero: libraryQuestions.numero,
      enunciado: libraryQuestions.enunciado,
      gabaritoLetra: libraryQuestions.gabaritoLetra,
      instituicao: sourceDocuments.instituicao,
      instituicaoSlug: libraryQuestions.instituicaoSlug,
      ano: libraryQuestions.ano,
      fase: libraryQuestions.fase,
      pagina: libraryQuestions.pagina,
      disciplinaSugerida: libraryQuestions.disciplinaSugerida,
      dependeDeContexto: libraryQuestions.dependeDeContexto,
      contextoNumero: libraryQuestions.contextoNumero,
      confirmadaPorDuplicata: libraryQuestions.confirmadaPorDuplicata,
      relPath: sourceDocuments.relPath,
      documentId: libraryQuestions.documentId,
    })
    .from(libraryQuestions)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, libraryQuestions.documentId))
    .where(cond.length ? and(...cond) : undefined)
    .orderBy(ordem)
    .limit(limite)
    .offset(filtro.offset ?? 0);

  if (!linhas.length) return [];

  const ids = linhas.map((l) => l.id);
  const opcoes = await db
    .select()
    .from(libraryQuestionOptions)
    // inArray, e não `= any(${ids})`: o Drizzle expande um array dentro de
    // sql`` como lista de placeholders, gerando `any(($1,$2,…))`, que o
    // Postgres recusa porque any() espera um array e não uma lista.
    .where(inArray(libraryQuestionOptions.questionId, ids))
    .orderBy(asc(libraryQuestionOptions.ordem));

  const porQuestao = new Map<string, typeof opcoes>();
  for (const o of opcoes) {
    const lista = porQuestao.get(o.questionId) ?? [];
    lista.push(o);
    porQuestao.set(o.questionId, lista);
  }

  return linhas.map((l) => ({ ...l, alternativas: porQuestao.get(l.id) ?? [] }));
}

/**
 * Uma questão completa: alternativas, figuras e o texto-base de que ela
 * depende (que mora no enunciado de outra questão da mesma prova).
 */
export async function obterQuestao(id: string) {
  const [q] = await db
    .select()
    .from(libraryQuestions)
    .where(eq(libraryQuestions.id, id))
    .limit(1);
  if (!q) return null;

  const [alternativas, figuras] = await Promise.all([
    db
      .select()
      .from(libraryQuestionOptions)
      .where(eq(libraryQuestionOptions.questionId, id))
      .orderBy(asc(libraryQuestionOptions.ordem)),
    db
      .select()
      .from(libraryFigures)
      .where(
        and(
          eq(libraryFigures.documentId, q.documentId),
          q.numero === null
            ? isNull(libraryFigures.questaoNumero)
            : eq(libraryFigures.questaoNumero, q.numero),
        ),
      )
      .orderBy(asc(libraryFigures.indice)),
  ]);

  let contexto: string | null = null;
  if (q.contextoNumero !== null) {
    const [lider] = await db
      .select({ enunciado: libraryQuestions.enunciado })
      .from(libraryQuestions)
      .where(
        and(
          eq(libraryQuestions.documentId, q.documentId),
          eq(libraryQuestions.numero, q.contextoNumero),
        ),
      )
      .limit(1);
    contexto = lider?.enunciado ?? null;
  }

  return { ...q, alternativas, figuras, contexto };
}

/** Busca full-text nas páginas dos PDFs, com o trecho destacado. */
export async function buscarNoAcervo(termo: string, limite = 20) {
  if (!termo.trim()) return [];
  return db
    .select({
      documentId: sourceDocuments.id,
      instituicao: sourceDocuments.instituicao,
      ano: sourceDocuments.ano,
      tipo: sourceDocuments.tipo,
      relPath: sourceDocuments.relPath,
      pagina: documentPages.pageNumber,
      trecho: sql<string>`ts_headline('portuguese', ${documentPages.content},
        websearch_to_tsquery('portuguese', ${termo}),
        'MaxFragments=2, MinWords=8, MaxWords=24')`,
    })
    .from(documentPages)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, documentPages.documentId))
    .where(sql`${documentPages.search} @@ websearch_to_tsquery('portuguese', ${termo})`)
    .orderBy(
      desc(sql`ts_rank(${documentPages.search}, websearch_to_tsquery('portuguese', ${termo}))`),
    )
    .limit(Math.min(limite, 100));
}

/** Números do acervo, para painel administrativo. */
export async function resumoDoAcervo() {
  const [linha] = await db
    .select({
      documentos: sql<number>`(select count(*)::int from ${sourceDocuments})`,
      paginas: sql<number>`(select count(*)::int from ${documentPages})`,
      questoes: sql<number>`(select count(*)::int from ${libraryQuestions})`,
      validadas: sql<number>`(select count(*)::int from ${libraryQuestions} where validada)`,
      distintas: sql<number>`(select count(*)::int from ${libraryQuestions}
        where validada and duplicata_de is null)`,
      comFigura: sql<number>`(select count(distinct questao_numero)::int
        from ${libraryFigures} where questao_numero is not null)`,
      conflitos: sql<number>`(select count(*)::int from ${libraryQuestions}
        where conflito_duplicata and not rejeitada)`,
      pendentes: sql<number>`(select count(*)::int from ${libraryQuestions}
        where not rejeitada and (conflito_duplicata
          or (jsonb_typeof(problemas) = 'array' and jsonb_array_length(problemas) > 0)))`,
      rejeitadas: sql<number>`(select count(*)::int from ${libraryQuestions} where rejeitada)`,
      revisadas: sql<number>`(select count(*)::int from ${libraryQuestions} where revisada_em is not null)`,
    })
    .from(sql`(select 1) as t`);
  return linha;
}

/**
 * Fila de revisão: o que o pipeline marcou como duvidoso, do mais grave para o
 * menos. Conflito entre cópias vem primeiro — ali há uma resposta errada.
 */
export async function filaDeRevisao(limite = 50) {
  return db
    .select({
      id: libraryQuestions.id,
      numero: libraryQuestions.numero,
      enunciado: libraryQuestions.enunciado,
      problemas: libraryQuestions.problemas,
      conflitoDuplicata: libraryQuestions.conflitoDuplicata,
      gabaritoLetra: libraryQuestions.gabaritoLetra,
      motivoLigacao: libraryQuestions.motivoLigacao,
      instituicao: sourceDocuments.instituicao,
      ano: libraryQuestions.ano,
      relPath: sourceDocuments.relPath,
      pagina: libraryQuestions.pagina,
      validada: libraryQuestions.validada,
      duplicataDe: libraryQuestions.duplicataDe,
      copias: libraryQuestions.copias,
    })
    .from(libraryQuestions)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, libraryQuestions.documentId))
    .where(
      and(
        eq(libraryQuestions.rejeitada, false),
        or(
          eq(libraryQuestions.conflitoDuplicata, true),
          // jsonb_typeof guarda contra linha antiga com escalar (ver migration 0008).
          sql`(jsonb_typeof(${libraryQuestions.problemas}) = 'array' and jsonb_array_length(${libraryQuestions.problemas}) > 0)`,
        ),
      ),
    )
    .orderBy(desc(libraryQuestions.conflitoDuplicata), desc(libraryQuestions.ano))
    .limit(Math.min(limite, 200));
}

/**
 * Opções dos filtros, tiradas do próprio acervo.
 *
 * Nada de lista fixa no código: o acervo cresce quando entram provas novas, e
 * uma lista escrita à mão ficaria oferecendo instituição que não tem questão
 * validada nenhuma — filtro que devolve vazio parece defeito.
 */
export async function facetasDoAcervo() {
  const base = and(
    eq(libraryQuestions.validada, true),
    isNull(libraryQuestions.duplicataDe),
    eq(libraryQuestions.tipo, "objetiva"),
  );

  const [instituicoes, anos, disciplinas, temas] = await Promise.all([
    db
      .select({
        // `library_questions` guarda só o slug; o nome por extenso vive em
        // `source_documents`. O join custaria caro num group by sobre 26 mil
        // linhas, e o slug em maiúsculas ("FUVEST") já é como a banca é
        // conhecida — a tela formata.
        valor: libraryQuestions.instituicaoSlug,
        total: sql<number>`count(*)::int`,
      })
      .from(libraryQuestions)
      .where(base)
      .groupBy(libraryQuestions.instituicaoSlug)
      .orderBy(desc(sql`count(*)`))
      .limit(40),
    db
      .select({ ano: libraryQuestions.ano, total: sql<number>`count(*)::int` })
      .from(libraryQuestions)
      .where(base)
      .groupBy(libraryQuestions.ano)
      .orderBy(desc(libraryQuestions.ano)),
    db
      .select({
        disciplina: libraryQuestions.disciplinaSugerida,
        total: sql<number>`count(*)::int`,
      })
      .from(libraryQuestions)
      .where(base)
      .groupBy(libraryQuestions.disciplinaSugerida)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        disciplina: libraryQuestions.disciplinaSugerida,
        tema: libraryQuestions.temaSugerido,
        total: sql<number>`count(*)::int`,
      })
      .from(libraryQuestions)
      .where(base)
      .groupBy(libraryQuestions.disciplinaSugerida, libraryQuestions.temaSugerido)
      .orderBy(desc(sql`count(*)`))
      .limit(200),
  ]);

  return {
    instituicoes: instituicoes.filter((i) => i.valor),
    anos: anos.filter((a) => a.ano),
    // A disciplina é *sugerida* por classificador com 75,5% de acerto medido,
    // não rótulo curado: por isso o filtro existe, mas a tela avisa.
    disciplinas: disciplinas.filter((d) => d.disciplina),
    temas: temas.filter((t) => t.tema && t.disciplina),
  };
}

/**
 * Catálogo de provas: um caderno por linha, só os que têm questão validada.
 * É o que o aluno vê em /provas, agrupado por instituição e ano.
 */
export async function listarProvas() {
  return db
    .select({
      documentId: sourceDocuments.id,
      instituicao: sourceDocuments.instituicao,
      instituicaoSlug: sourceDocuments.instituicaoSlug,
      ano: sourceDocuments.ano,
      fase: sourceDocuments.fase,
      curso: sourceDocuments.curso,
      banca: sourceDocuments.banca,
      questoes: sql<number>`count(*)::int`,
    })
    .from(libraryQuestions)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, libraryQuestions.documentId))
    .where(
      and(
        eq(libraryQuestions.validada, true),
        isNull(libraryQuestions.duplicataDe),
        eq(libraryQuestions.tipo, "objetiva"),
      ),
    )
    .groupBy(
      sourceDocuments.id,
      sourceDocuments.instituicao,
      sourceDocuments.instituicaoSlug,
      sourceDocuments.ano,
      sourceDocuments.fase,
      sourceDocuments.curso,
      sourceDocuments.banca,
    )
    // Só vale a pena resolver como "prova" um caderno com volume de questões;
    // 5 questões validadas de um caderno de 90 é amostra, não prova.
    .having(sql`count(*) >= 10`)
    .orderBy(asc(sourceDocuments.instituicao), desc(sourceDocuments.ano));
}

/** Uma prova com suas questões válidas em ordem, alternativas incluídas. */
export async function obterProva(documentId: string) {
  const [doc] = await db
    .select({
      id: sourceDocuments.id,
      instituicao: sourceDocuments.instituicao,
      instituicaoSlug: sourceDocuments.instituicaoSlug,
      ano: sourceDocuments.ano,
      fase: sourceDocuments.fase,
      curso: sourceDocuments.curso,
      banca: sourceDocuments.banca,
    })
    .from(sourceDocuments)
    .where(eq(sourceDocuments.id, documentId))
    .limit(1);
  if (!doc) return null;

  const questoes = await db
    .select({
      id: libraryQuestions.id,
      numero: libraryQuestions.numero,
      enunciado: libraryQuestions.enunciado,
      gabaritoLetra: libraryQuestions.gabaritoLetra,
      disciplinaSugerida: libraryQuestions.disciplinaSugerida,
      temaSugerido: libraryQuestions.temaSugerido,
      contextoNumero: libraryQuestions.contextoNumero,
    })
    .from(libraryQuestions)
    .where(
      and(
        eq(libraryQuestions.documentId, documentId),
        eq(libraryQuestions.validada, true),
        isNull(libraryQuestions.duplicataDe),
        eq(libraryQuestions.tipo, "objetiva"),
      ),
    )
    .orderBy(asc(libraryQuestions.numero));

  if (!questoes.length) return { ...doc, questoes: [] };

  const opcoes = await db
    .select()
    .from(libraryQuestionOptions)
    .where(
      inArray(
        libraryQuestionOptions.questionId,
        questoes.map((q) => q.id),
      ),
    )
    .orderBy(asc(libraryQuestionOptions.ordem));

  const porQuestao = new Map<string, typeof opcoes>();
  for (const o of opcoes) {
    const lista = porQuestao.get(o.questionId) ?? [];
    lista.push(o);
    porQuestao.set(o.questionId, lista);
  }

  return {
    ...doc,
    questoes: questoes.map((q) => ({ ...q, alternativas: porQuestao.get(q.id) ?? [] })),
  };
}

/** Quantas questões um filtro devolve, para paginar sem trazer tudo. */
export async function contarQuestoes(filtro: FiltroQuestoes = {}) {
  const cond = condicoes(filtro);
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(libraryQuestions)
    .where(cond.length ? and(...cond) : undefined);
  return linha?.total ?? 0;
}

/** Alternativas de um lote de questões (para a fila de revisão escolher o gabarito). */
export async function alternativasDe(ids: string[]) {
  const mapa = new Map<string, { letra: string; texto: string; correta: boolean | null }[]>();
  if (!ids.length) return mapa;
  const linhas = await db
    .select({
      questionId: libraryQuestionOptions.questionId,
      letra: libraryQuestionOptions.letra,
      texto: libraryQuestionOptions.texto,
      correta: libraryQuestionOptions.correta,
    })
    .from(libraryQuestionOptions)
    .where(inArray(libraryQuestionOptions.questionId, ids))
    .orderBy(asc(libraryQuestionOptions.ordem));
  for (const l of linhas) {
    const lista = mapa.get(l.questionId) ?? [];
    lista.push({ letra: l.letra, texto: l.texto, correta: l.correta });
    mapa.set(l.questionId, lista);
  }
  return mapa;
}

export type VersaoDaQuestao = {
  id: string;
  duplicataDe: string | null;
  gabarito: string | null;
  instituicao: string | null;
  ano: number | null;
  /** É a questão que as outras apontam como original. */
  canonica: boolean;
};

/**
 * As outras versões da mesma questão, com o gabarito que cada uma traz — é
 * isso que "conflito de duplicata" significa, e é o que o revisor precisa ver
 * na tela para decidir qual gabarito está certo.
 *
 * O grupo é resolvido pela raiz (`duplicata_de ?? id`), não pelo id exibido,
 * porque a fila de revisão traz as duas pontas: a questão canônica **e** as
 * cópias dela, que também entram marcadas com `conflito_duplicata`. Procurar
 * só por `duplicata_de = <id exibido>` acha as irmãs quando o item é a
 * canônica e **nada** quando o item é uma cópia — que era o caso em que o
 * revisor mais precisa do contraste, e ficava decidindo às cegas.
 */
export async function versoesDaQuestao(itens: MembroDoGrupo[]): Promise<Map<string, VersaoDaQuestao[]>> {
  if (!itens.length) return new Map();

  const raizes = [...new Set(itens.map(raizDoGrupo))];
  const linhas = await db
    .select({
      id: libraryQuestions.id,
      duplicataDe: libraryQuestions.duplicataDe,
      gabarito: libraryQuestions.gabaritoLetra,
      instituicao: sourceDocuments.instituicao,
      ano: libraryQuestions.ano,
    })
    .from(libraryQuestions)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, libraryQuestions.documentId))
    .where(
      or(inArray(libraryQuestions.id, raizes), inArray(libraryQuestions.duplicataDe, raizes)),
    );

  return agruparPorRaiz(
    itens,
    linhas.map((l) => ({
      id: l.id,
      duplicataDe: l.duplicataDe,
      gabarito: l.gabarito,
      instituicao: l.instituicao,
      ano: l.ano,
      canonica: l.duplicataDe === null,
    })),
  );
}

/** Trilha de auditoria: as últimas revisões, com o nome de quem fez. */
export async function historicoDeRevisoes(limite = 50) {
  return db
    .select({
      id: libraryReviews.id,
      questionId: libraryReviews.questionId,
      acao: libraryReviews.acao,
      antes: libraryReviews.antes,
      depois: libraryReviews.depois,
      nota: libraryReviews.nota,
      createdAt: libraryReviews.createdAt,
      revisor: users.name,
      revisorEmail: users.email,
      instituicao: sourceDocuments.instituicao,
      ano: libraryQuestions.ano,
      numero: libraryQuestions.numero,
    })
    .from(libraryReviews)
    .innerJoin(users, eq(users.id, libraryReviews.reviewerId))
    .innerJoin(libraryQuestions, eq(libraryQuestions.id, libraryReviews.questionId))
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, libraryQuestions.documentId))
    .orderBy(desc(libraryReviews.createdAt))
    .limit(Math.min(limite, 200));
}
