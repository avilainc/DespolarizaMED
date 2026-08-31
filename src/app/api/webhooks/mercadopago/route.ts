import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, paymentEvents, subscriptions } from "@/lib/db/schema";
import { validarAssinatura } from "@/lib/mercadopago/webhook";
import { obterAssinatura, obterPagamento } from "@/lib/mercadopago/client";

export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago: a única fonte que libera acesso pago.
 *
 * Três regras que governam este arquivo:
 *
 * 1. **A assinatura é validada antes de qualquer leitura do corpo.** Sem isso
 *    quem descobrir a URL libera acesso premium para si mesmo.
 * 2. **O corpo da notificação não é acreditado.** O MP manda só o id; o estado
 *    vem de uma consulta à API do MP com o nosso token. Uma notificação
 *    forjada com assinatura válida (secret vazada) ainda não consegue inventar
 *    um pagamento que a API não confirma.
 * 3. **Sempre 200, mesmo em erro nosso.** O MP reenfileira em não-2xx e o
 *    retry cego não conserta bug de código, só multiplica a carga. O evento
 *    fica gravado em `payment_events` com `processed_at` nulo para
 *    reprocessamento nosso.
 */
export async function POST(request: Request) {
  const cru = await request.text();

  let corpo: { type?: string; action?: string; data?: { id?: string } };
  try {
    corpo = JSON.parse(cru);
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const dataId = corpo.data?.id ?? null;

  const validacao = validarAssinatura({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
    secret: process.env.MP_WEBHOOK_SECRET,
  });

  if (!validacao.valido) {
    // 401 de propósito: o MP não deve reenviar o que nunca vai validar.
    console.warn("[mp] webhook recusado:", validacao.motivo);
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  const tipo = corpo.type ?? corpo.action ?? "desconhecido";

  const [evento] = await db
    .insert(paymentEvents)
    .values({ type: tipo, payload: cru })
    .returning({ id: paymentEvents.id });

  try {
    if (tipo.startsWith("subscription_preapproval") || tipo === "preapproval") {
      await sincronizarAssinatura(dataId!);
    } else if (tipo.startsWith("payment")) {
      await registrarPagamento(dataId!);
    }

    await db
      .update(paymentEvents)
      .set({ processedAt: new Date() })
      .where(eq(paymentEvents.id, evento.id));
  } catch (erro) {
    // processed_at fica nulo: o evento está guardado e pode ser reprocessado
    // sem depender de o MP reenviar.
    console.error("[mp] falha ao processar evento", evento.id, erro);
  }

  return NextResponse.json({ ok: true });
}

/** Lê o estado real no MP e reflete na nossa assinatura. */
async function sincronizarAssinatura(preapprovalId: string) {
  const remota = await obterAssinatura(preapprovalId);
  const nossoId = remota.external_reference;
  if (!nossoId) return;

  const status =
    remota.status === "authorized"
      ? "ACTIVE"
      : remota.status === "paused"
        ? "PAST_DUE"
        : remota.status === "cancelled"
          ? "CANCELLED"
          : "PENDING";

  await db
    .update(subscriptions)
    .set({
      status,
      mercadoPagoSubscriptionId: remota.id,
      currentPeriodEnd: remota.next_payment_date ? new Date(remota.next_payment_date) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, nossoId));
}

/** Registra a cobrança e estende o período de acesso quando aprovada. */
async function registrarPagamento(pagamentoId: string) {
  const pago = await obterPagamento(pagamentoId);
  const nossoId = pago.external_reference;
  if (!nossoId) return;

  const [assinatura] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, nossoId))
    .limit(1);
  if (!assinatura) return;

  const status =
    pago.status === "approved"
      ? "APPROVED"
      : pago.status === "refunded" || pago.status === "cancelled" || pago.status === "rejected"
        ? "FAILED"
        : "PENDING";

  // Idempotente: o MP reenvia a mesma notificação, e sem esta checagem o mesmo
  // pagamento entraria duas vezes no extrato do aluno.
  const [existente] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.mercadoPagoPaymentId, String(pago.id)))
    .limit(1);

  if (!existente) {
    await db.insert(payments).values({
      subscriptionId: assinatura.id,
      amountCents: Math.round(pago.transaction_amount * 100),
      status,
      mercadoPagoPaymentId: String(pago.id),
      paidAt: pago.date_approved ? new Date(pago.date_approved) : null,
    });
  }

  if (status === "APPROVED") {
    await db
      .update(subscriptions)
      .set({ status: "ACTIVE", updatedAt: new Date() })
      .where(eq(subscriptions.id, assinatura.id));
  }
}
