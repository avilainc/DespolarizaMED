"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";

export type ResultadoConta = { ok: true } | { ok: false; erro: string };

const nomeSchema = z.string().trim().min(2, "muito curto").max(120, "muito longo");

/**
 * Troca o nome exibido.
 *
 * O e-mail não entra aqui de propósito: mudar e-mail é mudar identidade de
 * login e exige reverificação do endereço novo antes de valer, senão um
 * engano digitando tranca a conta. Fica para quando houver esse fluxo.
 */
export async function alterarNome(formData: FormData): Promise<ResultadoConta> {
  const { session } = await requireSessionWithRole("STUDENT");

  const parsed = nomeSchema.safeParse(formData.get("nome"));
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "nome inválido" };
  }

  await db
    .update(users)
    .set({ name: parsed.data, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/minha-conta");
  return { ok: true };
}
