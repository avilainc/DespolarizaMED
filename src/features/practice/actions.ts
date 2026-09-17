"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  favorites,
  libraryQuestionOptions,
  libraryQuestions,
  practiceAnswers,
  practiceAttempts,
  studentActivities,
} from "@/lib/db/schema";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";

export type ActionResult<T = unknown> = { ok: true; dados: T } | { ok: false; erro: string };

const uuid = z.string().uuid();
const letra = z.string().regex(/^[A-Ea-e]$/).transform((l) => l.toUpperCase());

/**
 * Corrige no servidor, nunca confia na tela: a alternativa correta vem do
 * banco. Devolve o gabarito para a tela revelar depois de registrar.
 */
async function corrigir(questionId: string, letraDada: string) {
  const [q] = await db
    .select({ gabarito: libraryQuestions.gabaritoLetra, validada: libraryQuestions.validada })
    .from(libraryQuestions)
    .where(eq(libraryQuestions.id, questionId))
    .limit(1);
  if (!q || !q.validada) return null;

  let gabarito = q.gabarito?.toUpperCase() ?? null;
  if (!gabarito) {
    const [opcao] = await db
      .select({ letra: libraryQuestionOptions.letra })
      .from(libraryQuestionOptions)
      .where(and(eq(libraryQuestionOptions.questionId, questionId), eq(libraryQuestionOptions.correta, true)))
      .limit(1);
    gabarito = opcao?.letra.toUpperCase() ?? null;
  }
  if (!gabarito) return null;
  return { gabarito, correta: gabarito === letraDada };
}

/**
 * A questão está numa prova que este aluno tem em andamento?
 *
 * Assinatura sozinha não basta para entregar um gabarito: enquanto a prova
 * está aberta, o gabarito das questões dela é justamente o que a prova mede.
 * O aluno não deixa de ser assinante ao abrir a prova — muda o que ele pode
 * pedir sobre aquelas questões, e é essa distinção que esta função carrega.
 *
 * Só olha as tentativas do próprio aluno: a prova de um não fecha a questão
 * para os outros, e o banco livre continua respondendo normalmente para todo
 * mundo que não está com aquela prova aberta.
 */
async function emProvaAberta(studentId: string, questionId: string): Promise<boolean> {
  const [aberta] = await db
    .select({ id: practiceAttempts.id })
    .from(practiceAttempts)
    .innerJoin(libraryQuestions, eq(libraryQuestions.documentId, practiceAttempts.documentId))
    .where(
      and(
        eq(practiceAttempts.studentId, studentId),
        isNull(practiceAttempts.finishedAt),
        eq(libraryQuestions.id, questionId),
      ),
    )
    .limit(1);
  return Boolean(aberta);
}

/** Recusa padrão das duas portas, para não diferirem no texto. */
const PROVA_ABERTA = "prova em andamento: finalize a prova para ver o gabarito" as const;

/**
 * Revela o gabarito sem registrar resposta. Existe para que o gabarito nunca
 * viaje junto com a questão: a tela só o recebe depois de pedir, e pedir
 * exige sessão com assinatura.
 *
 * Exige também que a questão não esteja numa prova aberta deste aluno —
 * senão o banco livre viraria o gabarito da prova que ele está fazendo.
 */
export async function revelarGabarito(questionId: string): Promise<ActionResult<{ gabarito: string }>> {
  const { session } = await requireAssinatura();
  if (!uuid.safeParse(questionId).success) return { ok: false, erro: "questão inválida" };
  if (await emProvaAberta(session.user.id, questionId)) return { ok: false, erro: PROVA_ABERTA };
  const r = await corrigir(questionId, "");
  if (!r) return { ok: false, erro: "questão sem gabarito" };
  return { ok: true, dados: { gabarito: r.gabarito } };
}

/**
 * Resposta avulsa no banco de questões.
 *
 * Devolve o gabarito junto com a correção, então é a segunda porta para o
 * mesmo dado que `revelarGabarito` entrega — responder de propósito errado
 * revela a letra certa igual. Por isso a mesma guarda de prova aberta vale
 * aqui: fechar só uma das duas não fecharia nada.
 */
export async function responderQuestao(input: { questionId: string; letra: string }) {
  const { session } = await requireAssinatura();
  const parsed = z.object({ questionId: uuid, letra }).safeParse(input);
  if (!parsed.success) return { ok: false, erro: "dados inválidos" } as const;

  if (await emProvaAberta(session.user.id, parsed.data.questionId)) {
    return { ok: false, erro: PROVA_ABERTA } as const;
  }

  const resultado = await corrigir(parsed.data.questionId, parsed.data.letra);
  if (!resultado) return { ok: false, erro: "questão sem gabarito" } as const;

  await db.insert(practiceAnswers).values({
    studentId: session.user.id,
    questionId: parsed.data.questionId,
    letra: parsed.data.letra,
    correta: resultado.correta,
  });
  await db.insert(studentActivities).values({
    studentId: session.user.id,
    type: "QUESTAO_RESPONDIDA",
    metadata: JSON.stringify({ questionId: parsed.data.questionId, correta: resultado.correta }),
  });

  return { ok: true, dados: resultado } as const;
}

export async function alternarFavorito(input: {
  tipo: "QUESTION" | "GLOSSARY_TERM" | "LESSON";
  id: string;
}): Promise<ActionResult<{ favorito: boolean }>> {
  const { session } = await requireAssinatura();
  const parsed = z
    .object({ tipo: z.enum(["QUESTION", "GLOSSARY_TERM", "LESSON"]), id: z.string().min(1).max(64) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, erro: "dados inválidos" };

  const cond = and(
    eq(favorites.studentId, session.user.id),
    eq(favorites.entityType, parsed.data.tipo),
    eq(favorites.entityId, parsed.data.id),
  );
  const [existente] = await db.select({ id: favorites.id }).from(favorites).where(cond).limit(1);

  if (existente) {
    await db.delete(favorites).where(eq(favorites.id, existente.id));
    revalidatePath("/favoritos");
    return { ok: true, dados: { favorito: false } };
  }

  await db.insert(favorites).values({
    studentId: session.user.id,
    entityType: parsed.data.tipo,
    entityId: parsed.data.id,
  });
  revalidatePath("/favoritos");
  return { ok: true, dados: { favorito: true } };
}

/** Abre (ou retoma) uma tentativa de prova. Devolve o id da tentativa. */
export async function iniciarTentativa(documentId: string): Promise<ActionResult<{ attemptId: string }>> {
  const { session } = await requireAssinatura();
  if (!uuid.safeParse(documentId).success) return { ok: false, erro: "prova inválida" };

  const [aberta] = await db
    .select({ id: practiceAttempts.id })
    .from(practiceAttempts)
    .where(
      and(
        eq(practiceAttempts.studentId, session.user.id),
        eq(practiceAttempts.documentId, documentId),
        isNull(practiceAttempts.finishedAt),
      ),
    )
    .limit(1);
  if (aberta) return { ok: true, dados: { attemptId: aberta.id } };

  const prova = await obterProva(documentId);
  if (!prova || !prova.questoes.length) return { ok: false, erro: "prova sem questões" };

  const [nova] = await db
    .insert(practiceAttempts)
    .values({
      studentId: session.user.id,
      documentId,
      totalQuestoes: prova.questoes.length,
    })
    .returning({ id: practiceAttempts.id });

  await db.insert(studentActivities).values({
    studentId: session.user.id,
    type: "PROVA_INICIADA",
    metadata: JSON.stringify({ documentId, attemptId: nova.id }),
  });

  return { ok: true, dados: { attemptId: nova.id } };
}

/**
 * Resposta dentro de uma prova. Substitui a anterior da mesma questão na
 * mesma tentativa: até finalizar, o aluno pode mudar de ideia.
 */
export async function responderNaTentativa(input: {
  attemptId: string;
  questionId: string;
  letra: string;
}): Promise<ActionResult<null>> {
  const { session } = await requireAssinatura();
  const parsed = z.object({ attemptId: uuid, questionId: uuid, letra }).safeParse(input);
  if (!parsed.success) return { ok: false, erro: "dados inválidos" };

  const [t] = await db
    .select({ finishedAt: practiceAttempts.finishedAt, documentId: practiceAttempts.documentId })
    .from(practiceAttempts)
    .where(and(eq(practiceAttempts.id, parsed.data.attemptId), eq(practiceAttempts.studentId, session.user.id)))
    .limit(1);
  if (!t) return { ok: false, erro: "tentativa não encontrada" };
  if (t.finishedAt) return { ok: false, erro: "prova já finalizada" };

  const [pertence] = await db
    .select({ id: libraryQuestions.id })
    .from(libraryQuestions)
    .where(and(eq(libraryQuestions.id, parsed.data.questionId), eq(libraryQuestions.documentId, t.documentId)))
    .limit(1);
  if (!pertence) return { ok: false, erro: "questão não é desta prova" };

  const resultado = await corrigir(parsed.data.questionId, parsed.data.letra);
  if (!resultado) return { ok: false, erro: "questão sem gabarito" };

  await db
    .delete(practiceAnswers)
    .where(and(eq(practiceAnswers.attemptId, parsed.data.attemptId), eq(practiceAnswers.questionId, parsed.data.questionId)));
  await db.insert(practiceAnswers).values({
    studentId: session.user.id,
    questionId: parsed.data.questionId,
    attemptId: parsed.data.attemptId,
    letra: parsed.data.letra,
    correta: resultado.correta,
  });

  return { ok: true, dados: null };
}

export async function finalizarTentativa(attemptId: string): Promise<ActionResult<{ acertos: number; total: number }>> {
  const { session } = await requireAssinatura();
  if (!uuid.safeParse(attemptId).success) return { ok: false, erro: "tentativa inválida" };

  const [t] = await db
    .select()
    .from(practiceAttempts)
    .where(and(eq(practiceAttempts.id, attemptId), eq(practiceAttempts.studentId, session.user.id)))
    .limit(1);
  if (!t) return { ok: false, erro: "tentativa não encontrada" };
  if (t.finishedAt) return { ok: true, dados: { acertos: t.acertos, total: t.totalQuestoes } };

  const respostas = await db
    .select({ correta: practiceAnswers.correta })
    .from(practiceAnswers)
    .where(eq(practiceAnswers.attemptId, attemptId));
  const acertos = respostas.filter((r) => r.correta).length;

  await db
    .update(practiceAttempts)
    .set({ finishedAt: new Date(), acertos })
    .where(eq(practiceAttempts.id, attemptId));
  await db.insert(studentActivities).values({
    studentId: session.user.id,
    type: "PROVA_FINALIZADA",
    metadata: JSON.stringify({ attemptId, acertos, total: t.totalQuestoes }),
  });

  revalidatePath("/provas");
  revalidatePath("/desempenho");
  return { ok: true, dados: { acertos, total: t.totalQuestoes } };
}
