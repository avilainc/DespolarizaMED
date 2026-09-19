import { and, desc, eq, gt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema";

export async function listarPlanosAtivos() {
  return db.select().from(plans).where(eq(plans.active, true)).orderBy(plans.priceCents);
}

export async function obterPlanoPorSlug(slug: string) {
  const [plano] = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return plano ?? null;
}

/**
 * A assinatura que libera acesso.
 *
 * PAST_DUE continua valendo enquanto o período pago não terminou: o MP demora
 * a reprocessar um cartão recusado, e cortar o acesso de quem já pagou o mês
 * por causa de uma falha de cobrança da renovação é errado. Quem decide o
 * corte é `currentPeriodEnd`, não o status sozinho.
 */
export async function assinaturaVigente(studentId: string) {
  const agora = new Date();

  const [assinatura] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.studentId, studentId),
        or(
          eq(subscriptions.status, "ACTIVE"),
          and(eq(subscriptions.status, "PAST_DUE"), gt(subscriptions.currentPeriodEnd, agora)),
        ),
      ),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return assinatura ?? null;
}

export async function temAcesso(studentId: string) {
  return (await assinaturaVigente(studentId)) !== null;
}

/**
 * Só o nome do plano vigente, para o rodapé da barra lateral.
 *
 * Consulta própria, e não `assinaturaDoAluno()` (que traz pagamentos e datas),
 * porque isto roda no layout de TODA rota autenticada: trazer o extrato
 * inteiro para escrever "Plano Semestral" seria pagar caro em cada navegação.
 */
export async function nomeDoPlanoVigente(studentId: string) {
  const assinatura = await assinaturaVigente(studentId);
  if (!assinatura) return null;

  const [plano] = await db
    .select({ name: plans.name })
    .from(plans)
    .where(eq(plans.id, assinatura.planId))
    .limit(1);

  return plano?.name ?? null;
}
