"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { libraryQuestionOptions, libraryQuestions, libraryReviews } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";

export type ActionResult<T = null> = { ok: true; dados: T } | { ok: false; erro: string };

const uuid = z.string().uuid();
const nota = z.string().trim().max(500).optional().or(z.literal(""));
const letra = z.string().regex(/^[A-Ea-e]$/).transform((l) => l.toUpperCase());

type Snapshot = {
  validada: boolean;
  rejeitada: boolean;
  gabaritoLetra: string | null;
  conflitoDuplicata: boolean;
  problemas: string[];
};

async function snapshot(id: string, executor: Pick<typeof db, "select"> = db): Promise<Snapshot | null> {
  const [q] = await executor
    .select({
      validada: libraryQuestions.validada,
      rejeitada: libraryQuestions.rejeitada,
      gabaritoLetra: libraryQuestions.gabaritoLetra,
      conflitoDuplicata: libraryQuestions.conflitoDuplicata,
      problemas: libraryQuestions.problemas,
    })
    .from(libraryQuestions)
    .where(eq(libraryQuestions.id, id))
    .limit(1);
  return q ?? null;
}

function diff(antes: Snapshot, depois: Snapshot) {
  const a: Record<string, unknown> = {};
  const d: Record<string, unknown> = {};
  for (const k of Object.keys(depois) as (keyof Snapshot)[]) {
    if (JSON.stringify(antes[k]) !== JSON.stringify(depois[k])) {
      a[k] = antes[k];
      d[k] = depois[k];
    }
  }
  return { antes: a, depois: d };
}

function revalidar() {
  revalidatePath("/gestao/acervo");
  revalidatePath("/questoes");
}

/**
 * Curadoria de uma questão do acervo. Só ADMIN. Cada chamada grava uma linha
 * em `library_reviews` com o diff, o revisor e a hora — é o que responde
 * "quem fez o quê, quando, em qual questão".
 */
async function aplicar(
  id: string,
  acao: "APROVOU" | "REJEITOU" | "CORRIGIU_GABARITO" | "REABRIU",
  mudancas: Partial<Snapshot>,
  observacao: string | undefined,
  gabaritoNovo?: string,
): Promise<ActionResult<{ depois: Snapshot }>> {
  const { session } = await requireSessionWithRole("ADMIN");
  if (!uuid.safeParse(id).success) return { ok: false, erro: "questão inválida" };

  const antes = await snapshot(id);
  if (!antes) return { ok: false, erro: "questão não encontrada" };

  const depois = await db.transaction(async (tx) => {
    await tx
      .update(libraryQuestions)
      .set({ ...mudancas, revisadaPor: session.user.id, revisadaEm: new Date() })
      .where(eq(libraryQuestions.id, id));

    if (gabaritoNovo) {
      // A letra correta vive em dois lugares (coluna e alternativas); os dois
      // precisam concordar, senão a correção da prova diverge da listagem.
      await tx
        .update(libraryQuestionOptions)
        .set({ correta: false })
        .where(eq(libraryQuestionOptions.questionId, id));
      await tx
        .update(libraryQuestionOptions)
        .set({ correta: true })
        .where(and(eq(libraryQuestionOptions.questionId, id), eq(libraryQuestionOptions.letra, gabaritoNovo)));
      // Cópias da mesma questão herdam a decisão e deixam de conflitar.
      await tx
        .update(libraryQuestions)
        .set({ gabaritoLetra: gabaritoNovo, conflitoDuplicata: false })
        .where(eq(libraryQuestions.duplicataDe, id));
    }

    // snapshot(id, tx): a releitura precisa passar pela MESMA transação. Lida
    // via `db` (outra conexão), o UPDATE acima ainda não é visível — READ
    // COMMITTED não vê escrita não commitada de outra sessão — e o diff
    // antes/depois em library_reviews saía sempre vazio.
    const novo = (await snapshot(id, tx))!;
    const d = diff(antes, novo);
    await tx.insert(libraryReviews).values({
      questionId: id,
      reviewerId: session.user.id,
      acao,
      antes: d.antes,
      depois: d.depois,
      nota: observacao || null,
    });
    return novo;
  });

  revalidar();
  return { ok: true, dados: { depois } };
}

/** Aprova: a questão passa a valer para o aluno, sem problemas nem conflito. */
export async function aprovarQuestao(input: { id: string; nota?: string }) {
  const p = z.object({ id: uuid, nota }).safeParse(input);
  if (!p.success) return { ok: false, erro: "dados inválidos" } as const;
  const atual = await snapshot(p.data.id);
  if (!atual) return { ok: false, erro: "questão não encontrada" } as const;
  if (!atual.gabaritoLetra) return { ok: false, erro: "defina o gabarito antes de aprovar" } as const;
  return aplicar(
    p.data.id,
    "APROVOU",
    { validada: true, rejeitada: false, conflitoDuplicata: false, problemas: [] },
    p.data.nota || undefined,
  );
}

/** Rejeita: some da fila e nunca vai para o aluno. */
export async function rejeitarQuestao(input: { id: string; nota?: string }) {
  const p = z.object({ id: uuid, nota }).safeParse(input);
  if (!p.success) return { ok: false, erro: "dados inválidos" } as const;
  return aplicar(p.data.id, "REJEITOU", { validada: false, rejeitada: true }, p.data.nota || undefined);
}

/**
 * Corrige o gabarito e, com isso, resolve conflito entre cópias. A questão
 * fica validada: um humano acabou de olhar para ela.
 */
export async function corrigirGabarito(input: { id: string; letra: string; nota?: string }) {
  const p = z.object({ id: uuid, letra, nota }).safeParse(input);
  if (!p.success) return { ok: false, erro: "dados inválidos" } as const;
  const [alt] = await db
    .select({ id: libraryQuestionOptions.id })
    .from(libraryQuestionOptions)
    .where(and(eq(libraryQuestionOptions.questionId, p.data.id), eq(libraryQuestionOptions.letra, p.data.letra)))
    .limit(1);
  if (!alt) return { ok: false, erro: `a questão não tem alternativa ${p.data.letra}` } as const;
  return aplicar(
    p.data.id,
    "CORRIGIU_GABARITO",
    { gabaritoLetra: p.data.letra, validada: true, rejeitada: false, conflitoDuplicata: false, problemas: [] },
    p.data.nota || undefined,
    p.data.letra,
  );
}

/** Desfaz uma rejeição/aprovação: volta para a fila como não validada. */
export async function reabrirQuestao(input: { id: string; nota?: string }) {
  const p = z.object({ id: uuid, nota }).safeParse(input);
  if (!p.success) return { ok: false, erro: "dados inválidos" } as const;
  return aplicar(
    p.data.id,
    "REABRIU",
    { validada: false, rejeitada: false, problemas: ["reaberta para revisão"] },
    p.data.nota || undefined,
  );
}
