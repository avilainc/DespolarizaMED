"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { questionOptions, questions } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { renderizarMath, textoSemHtml } from "@/lib/math-html";

export type ActionResult<T = null> = { ok: true; dados: T } | { ok: false; erro: string };

const LETRAS = ["A", "B", "C", "D", "E"] as const;

const schema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.coerce.number().int().positive(),
  topic: z.string().trim().min(2).max(120),
  subtopic: z.string().trim().max(120).optional().or(z.literal("")),
  type: z.enum(["MULTIPLA_ESCOLHA", "DISSERTATIVA"]),
  difficulty: z.enum(["FACIL", "MEDIA", "DIFICIL"]),
  vestibular: z.string().trim().max(60).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1990).max(2100).optional().or(z.literal("")),
  statement: z.string().min(1),
  explanation: z.string().optional(),
  alternativas: z
    .array(z.object({ letra: z.enum(LETRAS), content: z.string() }))
    .max(5),
  correta: z.enum(LETRAS).optional(),
});

export type QuestaoInput = z.input<typeof schema>;

/**
 * Cria ou atualiza uma questão autoral. Só TEACHER/ADMIN chegam aqui; a tela
 * não é fronteira de segurança, a action revalida o papel sozinha.
 */
export async function salvarQuestao(input: QuestaoInput): Promise<ActionResult<{ id: string }>> {
  await requireSessionWithRole("TEACHER");

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "preencha disciplina, tema e enunciado" };
  const d = parsed.data;

  if (!textoSemHtml(d.statement)) return { ok: false, erro: "o enunciado está vazio" };

  const alternativas = d.alternativas.filter((a) => textoSemHtml(a.content));
  if (d.type === "MULTIPLA_ESCOLHA") {
    if (alternativas.length < 2) return { ok: false, erro: "informe ao menos duas alternativas" };
    if (!d.correta || !alternativas.some((a) => a.letra === d.correta)) {
      return { ok: false, erro: "marque qual alternativa é a correta" };
    }
  }

  const valores = {
    subjectId: d.subjectId,
    topic: d.topic,
    subtopic: d.subtopic || null,
    type: d.type,
    difficulty: d.difficulty,
    vestibular: d.vestibular || null,
    year: typeof d.year === "number" ? d.year : null,
    statement: d.statement,
    explanation: d.explanation || null,
    updatedAt: new Date(),
  };

  const id = await db.transaction(async (tx) => {
    let questionId = d.id;
    if (questionId) {
      const [existente] = await tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);
      if (!existente) throw new Error("questão não encontrada");
      await tx.update(questions).set(valores).where(eq(questions.id, questionId));
      await tx.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
    } else {
      const [nova] = await tx.insert(questions).values(valores).returning({ id: questions.id });
      questionId = nova.id;
    }

    if (d.type === "MULTIPLA_ESCOLHA") {
      await tx.insert(questionOptions).values(
        alternativas.map((a, i) => ({
          questionId: questionId!,
          label: a.letra,
          content: a.content,
          isCorrect: a.letra === d.correta ? "true" : "false",
          order: i,
        })),
      );
    }
    return questionId!;
  });

  revalidatePath("/professor/questoes");
  revalidatePath("/questoes/autorais");
  return { ok: true, dados: { id } };
}

export async function excluirQuestao(id: string): Promise<ActionResult> {
  await requireSessionWithRole("TEACHER");
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "id inválido" };
  await db.delete(questions).where(eq(questions.id, id));
  revalidatePath("/professor/questoes");
  revalidatePath("/questoes/autorais");
  return { ok: true, dados: null };
}

/**
 * Gabarito e resolução de uma questão autoral, só depois que o aluno pede.
 * A listagem nunca inclui `isCorrect` nem `explanation`.
 */
export async function revelarQuestaoAutoral(
  id: string,
): Promise<ActionResult<{ gabarito: string | null; explicacaoHtml: string | null }>> {
  await requireAssinatura();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "questão inválida" };
  const [q] = await db.select({ explanation: questions.explanation }).from(questions).where(eq(questions.id, id)).limit(1);
  if (!q) return { ok: false, erro: "questão não encontrada" };
  const [correta] = await db
    .select({ label: questionOptions.label })
    .from(questionOptions)
    .where(and(eq(questionOptions.questionId, id), eq(questionOptions.isCorrect, "true")))
    .limit(1);
  return {
    ok: true,
    dados: {
      gabarito: correta?.label ?? null,
      explicacaoHtml: q.explanation ? renderizarMath(q.explanation) : null,
    },
  };
}
