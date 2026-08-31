"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { criarAssinatura } from "@/lib/mercadopago/client";
import { obterPlanoPorSlug, assinaturaVigente } from "./queries";

/**
 * Começa a assinatura: cria a linha PENDING aqui, manda o aluno ao MP.
 *
 * A linha nasce PENDING e só vira ACTIVE pelo webhook, nunca pelo retorno do
 * navegador — quem volta de /planos?status=success pode ter só editado a URL.
 */
export async function assinar(formData: FormData) {
  const { session } = await requireSessionWithRole("STUDENT");
  const slug = String(formData.get("plano") ?? "");

  const plano = await obterPlanoPorSlug(slug);
  if (!plano || !plano.active) throw new Error("plano indisponível");
  if (!plano.mercadoPagoPlanId) throw new Error(`plano ${slug} sem id no Mercado Pago`);

  // Já paga: mandar para o MP de novo criaria uma segunda cobrança recorrente.
  if (await assinaturaVigente(session.user.id)) redirect("/dashboard");

  const [assinatura] = await db
    .insert(subscriptions)
    .values({ studentId: session.user.id, planId: plano.id, status: "PENDING" })
    .returning({ id: subscriptions.id });

  const base = process.env.BETTER_AUTH_URL ?? "https://despolarizamed.com.br";

  let destino: string;
  try {
    const remota = await criarAssinatura({
      planId: plano.mercadoPagoPlanId,
      payerEmail: session.user.email,
      externalReference: assinatura.id,
      backUrl: `${base}/dashboard`,
    });
    destino = remota.init_point;

    await db
      .update(subscriptions)
      .set({ mercadoPagoSubscriptionId: remota.id, updatedAt: new Date() })
      .where(eq(subscriptions.id, assinatura.id));
  } catch (erro) {
    // Sem isto a linha PENDING órfã bloquearia a próxima tentativa do aluno.
    await db.delete(subscriptions).where(eq(subscriptions.id, assinatura.id));
    throw erro;
  }

  redirect(destino);
}
