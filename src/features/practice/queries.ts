import "server-only";

import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  favorites,
  libraryQuestions,
  practiceAnswers,
  practiceAttempts,
  sourceDocuments,
} from "@/lib/db/schema";

/**
 * Leitura do que o aluno já fez: respostas avulsas, provas e favoritos.
 * Tudo aqui é por `studentId`; quem chama já validou a sessão.
 */

/** Ids de questões que o aluno já respondeu (avulsas ou em prova). */
export async function idsRespondidas(studentId: string) {
  const linhas = await db
    .selectDistinct({ id: practiceAnswers.questionId })
    .from(practiceAnswers)
    .where(eq(practiceAnswers.studentId, studentId));
  return linhas.map((l) => l.id);
}

/**
 * Ids cuja resposta MAIS RECENTE está errada. Uma questão errada e depois
 * acertada sai da lista: o que interessa para revisar é o estado atual.
 */
export async function idsErradas(studentId: string) {
  const linhas = await db
    .select({ questionId: practiceAnswers.questionId, correta: practiceAnswers.correta })
    .from(practiceAnswers)
    .where(eq(practiceAnswers.studentId, studentId))
    .orderBy(desc(practiceAnswers.answeredAt));
  const estado = new Map<string, boolean>();
  for (const l of linhas) if (!estado.has(l.questionId)) estado.set(l.questionId, l.correta);
  return [...estado].filter(([, correta]) => !correta).map(([id]) => id);
}

export async function idsFavoritas(studentId: string, tipo: "QUESTION" | "GLOSSARY_TERM" | "LESSON") {
  const linhas = await db
    .select({ id: favorites.entityId })
    .from(favorites)
    .where(and(eq(favorites.studentId, studentId), eq(favorites.entityType, tipo)))
    .orderBy(desc(favorites.createdAt));
  return linhas.map((l) => l.id);
}

/** Última resposta do aluno para cada uma das questões pedidas. */
export async function ultimasRespostas(studentId: string, questionIds: string[]) {
  const mapa = new Map<string, { letra: string; correta: boolean }>();
  if (!questionIds.length) return mapa;
  const linhas = await db
    .select({
      questionId: practiceAnswers.questionId,
      letra: practiceAnswers.letra,
      correta: practiceAnswers.correta,
    })
    .from(practiceAnswers)
    .where(and(eq(practiceAnswers.studentId, studentId), inArray(practiceAnswers.questionId, questionIds)))
    .orderBy(desc(practiceAnswers.answeredAt));
  // Ordenado do mais recente para o mais antigo: a primeira ocorrência vence.
  for (const l of linhas) {
    if (!mapa.has(l.questionId)) mapa.set(l.questionId, { letra: l.letra, correta: l.correta });
  }
  return mapa;
}

/** Números gerais para o painel de desempenho. */
export async function estatisticasDoAluno(studentId: string) {
  const [geral] = await db
    .select({
      respondidas: sql<number>`count(*)::int`,
      acertos: sql<number>`count(*) filter (where ${practiceAnswers.correta})::int`,
      distintas: sql<number>`count(distinct ${practiceAnswers.questionId})::int`,
    })
    .from(practiceAnswers)
    .where(eq(practiceAnswers.studentId, studentId));

  const porDisciplina = await db
    .select({
      disciplina: libraryQuestions.disciplinaSugerida,
      respondidas: sql<number>`count(*)::int`,
      acertos: sql<number>`count(*) filter (where ${practiceAnswers.correta})::int`,
    })
    .from(practiceAnswers)
    .innerJoin(libraryQuestions, eq(libraryQuestions.id, practiceAnswers.questionId))
    .where(and(eq(practiceAnswers.studentId, studentId), isNotNull(libraryQuestions.disciplinaSugerida)))
    .groupBy(libraryQuestions.disciplinaSugerida)
    .orderBy(desc(sql`count(*)`));

  const porTema = await db
    .select({
      disciplina: libraryQuestions.disciplinaSugerida,
      tema: libraryQuestions.temaSugerido,
      respondidas: sql<number>`count(*)::int`,
      acertos: sql<number>`count(*) filter (where ${practiceAnswers.correta})::int`,
    })
    .from(practiceAnswers)
    .innerJoin(libraryQuestions, eq(libraryQuestions.id, practiceAnswers.questionId))
    .where(and(eq(practiceAnswers.studentId, studentId), isNotNull(libraryQuestions.temaSugerido)))
    .groupBy(libraryQuestions.disciplinaSugerida, libraryQuestions.temaSugerido)
    // Tema com menos de 3 respostas não diz nada sobre domínio; só faz ruído.
    .having(sql`count(*) >= 3`)
    .orderBy(desc(sql`count(*)`));

  const ultimos30Dias = await db.execute<{ dia: string; respondidas: number; acertos: number }>(sql`
    select to_char(answered_at::date, 'YYYY-MM-DD') as dia,
           count(*)::int as respondidas,
           count(*) filter (where correta)::int as acertos
    from ${practiceAnswers}
    where student_id = ${studentId} and answered_at >= now() - interval '30 days'
    group by answered_at::date
    order by answered_at::date
  `);

  return { geral, porDisciplina, porTema, ultimos30Dias: [...ultimos30Dias] };
}

/** Provas do aluno, da mais recente para a mais antiga. */
export async function tentativasDoAluno(studentId: string) {
  return db
    .select({
      id: practiceAttempts.id,
      documentId: practiceAttempts.documentId,
      instituicao: sourceDocuments.instituicao,
      ano: sourceDocuments.ano,
      fase: sourceDocuments.fase,
      startedAt: practiceAttempts.startedAt,
      finishedAt: practiceAttempts.finishedAt,
      totalQuestoes: practiceAttempts.totalQuestoes,
      acertos: practiceAttempts.acertos,
    })
    .from(practiceAttempts)
    .innerJoin(sourceDocuments, eq(sourceDocuments.id, practiceAttempts.documentId))
    .where(eq(practiceAttempts.studentId, studentId))
    .orderBy(desc(practiceAttempts.startedAt));
}

/** Tentativa em aberto deste aluno nesta prova, se houver. */
export async function tentativaEmAberto(studentId: string, documentId: string) {
  const [t] = await db
    .select()
    .from(practiceAttempts)
    .where(
      and(
        eq(practiceAttempts.studentId, studentId),
        eq(practiceAttempts.documentId, documentId),
        isNull(practiceAttempts.finishedAt),
      ),
    )
    .orderBy(desc(practiceAttempts.startedAt))
    .limit(1);
  return t ?? null;
}

/** Uma tentativa com as respostas já dadas. Só o dono enxerga. */
export async function obterTentativa(attemptId: string, studentId: string) {
  const [t] = await db
    .select()
    .from(practiceAttempts)
    .where(and(eq(practiceAttempts.id, attemptId), eq(practiceAttempts.studentId, studentId)))
    .limit(1);
  if (!t) return null;

  const respostas = await db
    .select({
      questionId: practiceAnswers.questionId,
      letra: practiceAnswers.letra,
      correta: practiceAnswers.correta,
    })
    .from(practiceAnswers)
    .where(eq(practiceAnswers.attemptId, attemptId));

  return { ...t, respostas: new Map(respostas.map((r) => [r.questionId, r])) };
}

/** Favoritos do aluno com o texto da questão, para a tela /favoritos. */
export async function questoesFavoritas(studentId: string) {
  const ids = await idsFavoritas(studentId, "QUESTION");
  if (!ids.length) return [];
  const linhas = await db
    .select({
      id: libraryQuestions.id,
      enunciado: libraryQuestions.enunciado,
      instituicaoSlug: libraryQuestions.instituicaoSlug,
      ano: libraryQuestions.ano,
      disciplinaSugerida: libraryQuestions.disciplinaSugerida,
    })
    .from(libraryQuestions)
    .where(inArray(libraryQuestions.id, ids));
  const ordem = new Map(ids.map((id, i) => [id, i]));
  return linhas.sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0));
}
