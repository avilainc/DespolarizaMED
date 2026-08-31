"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { linkDeAssinatura, obterPlano } from "@/lib/mercadopago/client";
import { obterPlanoPorSlug, assinaturaVigente } from "./queries";

/**
 * Começa a assinatura: cria a linha PENDING aqui, manda o aluno ao checkout.
 *
 * A linha nasce PENDING e só vira ACTIVE pelo webhook, nunca pelo retorno do
 * navegador — quem volta de /dashboard pode ter só editado a URL.
 *
 * O destino é o `init_point` do plano no Mercado Pago, não um preapproval
 * criado por nós: POST /preapproval exige o cartão já tokenizado
 * (`card_token_id`) e não devolve link. Quem coleta o cartão é o checkout
 * hospedado do MP.
 */
export async function assinar(formData: FormData) {
  const { session } = await requireSessionWithRole("STUDENT");
  const slug = String(formData.get("plano") ?? "");

  const plano = await obterPlanoPorSlug(slug);
  if (!plano || !plano.active) throw new Error("plano indisponível");
  if (!plano.mercadoPagoPlanId) throw new Error(`plano ${slug} sem id no Mercado Pago`);

  // Já paga: mandar ao checkout de novo criaria uma segunda cobrança recorrente.
  if (await assinaturaVigente(session.user.id)) redirect("/dashboard");

  const [assinatura] = await db
    .insert(subscriptions)
    .values({ studentId: session.user.id, planId: plano.id, status: "PENDING" })
    .returning({ id: subscriptions.id });

  let destino: string;
  try {
    // O init_point é lido do MP em vez de montado à mão: se o plano for
    // recriado lá, o link acompanha sem precisar de deploy.
    const remoto = await obterPlano(plano.mercadoPagoPlanId);
    destino = linkDeAssinatura({
      initPoint: remoto.init_point,
      externalReference: assinatura.id,
    });
  } catch (erro) {
    // Sem isto a linha PENDING órfã bloquearia a próxima tentativa do aluno.
    await db.delete(subscriptions).where(eq(subscriptions.id, assinatura.id));
    throw erro;
  }

  redirect(destino);
}
