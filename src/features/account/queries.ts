import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, payments, subscriptions } from "@/lib/db/schema";

/** A assinatura mais recente do aluno, com o plano junto, para a tela de conta. */
export async function assinaturaDoAluno(studentId: string) {
  const [linha] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
      planoNome: plans.name,
      planoPeriodo: plans.billingPeriod,
      planoPreco: plans.priceCents,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.studentId, studentId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return linha ?? null;
}

/** Extrato: o aluno precisa conseguir conferir o que foi cobrado dele. */
export async function pagamentosDoAluno(studentId: string) {
  return db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(subscriptions, eq(subscriptions.id, payments.subscriptionId))
    .where(eq(subscriptions.studentId, studentId))
    .orderBy(desc(payments.createdAt))
    .limit(24);
}
