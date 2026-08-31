"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { countAdmins } from "./users";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
});

export type ActionResult = { ok: true } | { ok: false; erro: string };

/**
 * Troca o papel de uma conta.
 *
 * Três guardas, todas no servidor porque a tela não é a fronteira de
 * segurança: quem chama a action direto não passa pela interface.
 */
export async function alterarPapel(formData: FormData): Promise<ActionResult> {
  // 1. Só ADMIN altera papel. requireSessionWithRole redireciona quem não for.
  const { session } = await requireSessionWithRole("ADMIN");

  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, erro: "dados inválidos" };

  const { userId, role } = parsed.data;

  // 2. Ninguém rebaixa a si mesmo. Sem isto, um admin distraído se tranca para
  // fora da própria tela e só volta rodando `pnpm user:role` no servidor.
  if (userId === session.user.id && role !== "ADMIN") {
    return { ok: false, erro: "você não pode remover o próprio acesso de administrador" };
  }

  const [alvo] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!alvo) return { ok: false, erro: "conta não encontrada" };
  if (alvo.role === role) return { ok: true };

  // 3. A plataforma nunca fica sem nenhum ADMIN: seria uma tela inacessível
  // para todos, recuperável apenas por acesso ao banco.
  if (alvo.role === "ADMIN" && role !== "ADMIN" && (await countAdmins()) <= 1) {
    return { ok: false, erro: "este é o último administrador; promova outro antes" };
  }

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

  revalidatePath("/gestao/usuarios");
  return { ok: true };
}
