import "server-only";

import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessonProgress, practiceAnswers } from "@/lib/db/schema";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson, Module, Subject } from "@/payload/payload-types";

export type ProgressoDisciplina = {
  disciplina: Subject;
  totalAulas: number;
  concluidas: number;
  emAndamento: number;
  /** Próxima aula a assistir: a primeira não concluída na ordem dos módulos. */
  proxima: { titulo: string; slug: string; modulo: string | null } | null;
};

/**
 * Progresso do aluno em cada disciplina publicada.
 *
 * Duas fontes: o catálogo está no Payload (disciplina → módulo → aula) e o
 * progresso está no Postgres da aplicação (`lesson_progress`). A junção é
 * feita aqui, em memória, porque são coleções pequenas — dezenas de aulas por
 * disciplina — e um join de verdade exigiria replicar o catálogo no Drizzle.
 *
 * Tudo que a tela mostra sai daqui. Nenhum número de progresso é estimado:
 * disciplina sem aula publicada devolve zero e a tela diz "nenhuma aula
 * publicada ainda", em vez de desenhar uma barra vazia que parece atraso do
 * aluno.
 */
export async function progressoDasDisciplinas(alunoId: string): Promise<ProgressoDisciplina[]> {
  const payload = await getPayloadClient();

  const [disciplinas, modulos, aulas, progresso] = await Promise.all([
    payload.find({ collection: "subjects", sort: "order", limit: 100 }),
    payload.find({ collection: "modules", sort: "order", limit: 500, depth: 0 }),
    payload.find({
      collection: "lessons",
      where: { published: { equals: true } },
      sort: "order",
      limit: 1000,
      depth: 0,
    }),
    db
      .select({
        lessonId: lessonProgress.lessonId,
        completed: lessonProgress.completed,
        positionSeconds: lessonProgress.positionSeconds,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.studentId, alunoId)),
  ]);

  const estado = new Map(progresso.map((p) => [p.lessonId, p]));
  const modulosPorDisciplina = new Map<number, Module[]>();
  for (const m of modulos.docs) {
    const id = typeof m.subject === "object" ? m.subject.id : m.subject;
    const lista = modulosPorDisciplina.get(id) ?? [];
    lista.push(m);
    modulosPorDisciplina.set(id, lista);
  }

  const aulasPorModulo = new Map<number, Lesson[]>();
  for (const a of aulas.docs) {
    const id = typeof a.module === "object" ? a.module.id : a.module;
    const lista = aulasPorModulo.get(id) ?? [];
    lista.push(a);
    aulasPorModulo.set(id, lista);
  }

  return disciplinas.docs.map((disciplina) => {
    let totalAulas = 0;
    let concluidas = 0;
    let emAndamento = 0;
    let proxima: ProgressoDisciplina["proxima"] = null;

    for (const modulo of modulosPorDisciplina.get(disciplina.id) ?? []) {
      for (const aula of aulasPorModulo.get(modulo.id) ?? []) {
        totalAulas++;
        const p = estado.get(aula.id);
        if (p?.completed) concluidas++;
        else if (p && p.positionSeconds > 0) emAndamento++;
        if (!proxima && !p?.completed) {
          proxima = { titulo: aula.title, slug: aula.slug, modulo: modulo.name };
        }
      }
    }

    return { disciplina, totalAulas, concluidas, emAndamento, proxima };
  });
}

export type Continuacao = {
  aula: { id: number; titulo: string; slug: string; duracaoSegundos: number | null };
  modulo: string | null;
  disciplina: { nome: string; slug: string } | null;
  posicaoSegundos: number;
  /** true quando o aluno ainda não começou nenhuma aula. */
  primeiraVez: boolean;
};

/**
 * "De onde o aluno parou".
 *
 * Regra, nesta ordem: a aula mais recente que ele começou e não terminou;
 * senão a primeira aula não concluída do catálogo; senão nada — e a tela
 * mostra o convite para começar, não um card falso.
 */
export async function continuarDe(alunoId: string): Promise<Continuacao | null> {
  const payload = await getPayloadClient();

  const [emCurso] = await db
    .select({
      lessonId: lessonProgress.lessonId,
      positionSeconds: lessonProgress.positionSeconds,
    })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, alunoId), eq(lessonProgress.completed, false)))
    .orderBy(desc(lessonProgress.updatedAt))
    .limit(1);

  let aula: Lesson | undefined;
  let posicao = 0;
  let primeiraVez = false;

  if (emCurso) {
    const r = await payload.find({
      collection: "lessons",
      where: { id: { equals: emCurso.lessonId }, published: { equals: true } },
      limit: 1,
      depth: 2,
    });
    aula = r.docs[0];
    posicao = emCurso.positionSeconds;
  }

  if (!aula) {
    // Sem aula em curso: pega a primeira publicada que ele ainda não concluiu.
    const concluidas = await db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.studentId, alunoId), eq(lessonProgress.completed, true)));

    const r = await payload.find({
      collection: "lessons",
      where: {
        published: { equals: true },
        ...(concluidas.length
          ? { id: { not_in: concluidas.map((c) => c.lessonId) } }
          : {}),
      },
      sort: "order",
      limit: 1,
      depth: 2,
    });
    aula = r.docs[0];
    primeiraVez = concluidas.length === 0;
  }

  if (!aula) return null;

  const modulo = typeof aula.module === "object" ? aula.module : null;
  const disciplina =
    modulo && typeof modulo.subject === "object"
      ? { nome: modulo.subject.name, slug: modulo.subject.slug }
      : null;

  return {
    aula: {
      id: aula.id,
      titulo: aula.title,
      slug: aula.slug,
      duracaoSegundos: aula.durationSeconds ?? null,
    },
    modulo: modulo?.name ?? null,
    disciplina,
    posicaoSegundos: posicao,
    primeiraVez,
  };
}

export type ResumoSemana = {
  aulasConcluidas: number;
  questoesRespondidas: number;
  acertos: number;
  /** Percentual inteiro, ou null quando não houve resposta na semana. */
  taxaAcerto: number | null;
};

/**
 * O que o aluno fez nos últimos sete dias.
 *
 * Sete dias corridos e não "esta semana": o aluno que estuda no domingo à
 * noite veria o painel zerar na segunda de manhã, o que desmotiva sem
 * informar nada. `taxaAcerto` é null — e não 0 — quando não houve resposta:
 * zero por cento diz "você errou tudo", null diz "ainda não há o que medir",
 * e a tela trata os dois casos de forma diferente.
 */
export async function resumoDaSemana(alunoId: string): Promise<ResumoSemana> {
  const desde = new Date();
  desde.setDate(desde.getDate() - 7);

  const [aulas, questoes] = await Promise.all([
    db
      .select({ total: count() })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.studentId, alunoId),
          eq(lessonProgress.completed, true),
          gte(lessonProgress.updatedAt, desde),
        ),
      ),
    db
      .select({
        total: count(),
        acertos: sql<number>`count(*) filter (where ${practiceAnswers.correta})::int`,
      })
      .from(practiceAnswers)
      .where(and(eq(practiceAnswers.studentId, alunoId), gte(practiceAnswers.answeredAt, desde))),
  ]);

  const respondidas = questoes[0]?.total ?? 0;
  const acertos = questoes[0]?.acertos ?? 0;

  return {
    aulasConcluidas: aulas[0]?.total ?? 0,
    questoesRespondidas: respondidas,
    acertos,
    taxaAcerto: respondidas > 0 ? Math.round((acertos / respondidas) * 100) : null,
  };
}

/** Aulas concluídas por id, para marcar a lista de aulas de um módulo. */
export async function estadoDasAulas(alunoId: string, lessonIds: number[]) {
  if (!lessonIds.length) return new Map<number, { concluida: boolean; posicao: number }>();

  const linhas = await db
    .select({
      lessonId: lessonProgress.lessonId,
      completed: lessonProgress.completed,
      positionSeconds: lessonProgress.positionSeconds,
    })
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.studentId, alunoId), inArray(lessonProgress.lessonId, lessonIds)),
    );

  return new Map(
    linhas.map((l) => [l.lessonId, { concluida: l.completed, posicao: l.positionSeconds }]),
  );
}
