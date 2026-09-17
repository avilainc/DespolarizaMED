import "server-only";

import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { questionOptions, questions } from "@/lib/db/schema";
import { getSubjects } from "@/lib/payload/queries";

/**
 * Questões autorais (tabela `questions`): escritas pelos professores no
 * editor, com disciplina e tema curados. É a contraparte do acervo extraído
 * (`library_questions`), que tem volume mas classificação apenas sugerida.
 */

export type FiltroAutorais = {
  subjectId?: number;
  topic?: string;
  difficulty?: "FACIL" | "MEDIA" | "DIFICIL";
  vestibular?: string;
  limite?: number;
  offset?: number;
};

function condicoes(f: FiltroAutorais): SQL[] {
  const cond: SQL[] = [];
  if (f.subjectId) cond.push(eq(questions.subjectId, f.subjectId));
  if (f.topic) cond.push(eq(questions.topic, f.topic));
  if (f.difficulty) cond.push(eq(questions.difficulty, f.difficulty));
  if (f.vestibular) cond.push(eq(questions.vestibular, f.vestibular));
  return cond;
}

export async function listarQuestoesAutorais(filtro: FiltroAutorais = {}) {
  const cond = condicoes(filtro);
  const linhas = await db
    .select()
    .from(questions)
    .where(cond.length ? and(...cond) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(Math.min(filtro.limite ?? 20, 100))
    .offset(filtro.offset ?? 0);
  if (!linhas.length) return [];

  const opcoes = await db
    .select()
    .from(questionOptions)
    .where(
      inArray(
        questionOptions.questionId,
        linhas.map((l) => l.id),
      ),
    )
    .orderBy(asc(questionOptions.order));
  const porQuestao = new Map<string, typeof opcoes>();
  for (const o of opcoes) {
    const lista = porQuestao.get(o.questionId) ?? [];
    lista.push(o);
    porQuestao.set(o.questionId, lista);
  }

  // Nome da disciplina vem do Payload; um `find` de 100 é mais barato que um
  // join que o Drizzle não pode fazer com tabela que não gerencia.
  const subjects = await getSubjects();
  const nomePorId = new Map(subjects.map((s) => [s.id, s.name]));

  return linhas.map((l) => ({
    ...l,
    disciplina: nomePorId.get(l.subjectId) ?? null,
    alternativas: porQuestao.get(l.id) ?? [],
  }));
}

export async function contarQuestoesAutorais(filtro: FiltroAutorais = {}) {
  const cond = condicoes(filtro);
  const [linha] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(questions)
    .where(cond.length ? and(...cond) : undefined);
  return linha?.total ?? 0;
}

export async function obterQuestaoAutoral(id: string) {
  const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!q) return null;
  const alternativas = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.questionId, id))
    .orderBy(asc(questionOptions.order));
  return { ...q, alternativas };
}

/** Temas já usados, para o autocomplete do editor. */
export async function temasAutorais(subjectId?: number) {
  const linhas = await db
    .select({ topic: questions.topic, total: sql<number>`count(*)::int` })
    .from(questions)
    .where(subjectId ? eq(questions.subjectId, subjectId) : undefined)
    .groupBy(questions.topic)
    .orderBy(desc(sql`count(*)`));
  return linhas;
}
