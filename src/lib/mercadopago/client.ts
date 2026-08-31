/**
 * Cliente do Mercado Pago.
 *
 * Sem SDK: a API é REST simples e o SDK oficial arrasta dependências e uma
 * camada de tipos que envelhece mais rápido que a própria API. O que
 * precisamos são três chamadas.
 */
const API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não definida");
  return token;
}

type Metodo = "GET" | "POST" | "PUT";

async function chamar<T>(
  metodo: Metodo,
  caminho: string,
  corpo?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken()}`,
    "Content-Type": "application/json",
  };
  // Sem chave de idempotência, um retry de rede vira uma segunda cobrança.
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const resposta = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    // A mensagem do MP entra no log, mas nunca o token.
    throw new Error(`Mercado Pago ${metodo} ${caminho} → ${resposta.status}: ${texto.slice(0, 400)}`);
  }

  return texto ? (JSON.parse(texto) as T) : ({} as T);
}

export type PreapprovalPlan = {
  id: string;
  reason: string;
  status: string;
  init_point: string;
};

export type Preapproval = {
  id: string;
  status: "pending" | "authorized" | "paused" | "cancelled";
  preapproval_plan_id: string;
  payer_email: string;
  external_reference?: string;
  init_point: string;
  next_payment_date?: string;
};

export type Pagamento = {
  id: number;
  status: "approved" | "pending" | "rejected" | "refunded" | "cancelled" | "in_process";
  transaction_amount: number;
  external_reference?: string;
  date_approved?: string;
  metadata?: Record<string, unknown>;
};

/** Cria o plano de assinatura no MP; o id volta para `plans.mercadoPagoPlanId`. */
export function criarPlano(input: {
  reason: string;
  frequencyMonths: number;
  amountBRL: number;
  backUrl: string;
}) {
  return chamar<PreapprovalPlan>("POST", "/preapproval_plan", {
    reason: input.reason,
    auto_recurring: {
      frequency: input.frequencyMonths,
      frequency_type: "months",
      transaction_amount: input.amountBRL,
      currency_id: "BRL",
    },
    back_url: input.backUrl,
    payment_methods_allowed: {
      payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
    },
  });
}

/**
 * Inicia a assinatura de um aluno. `externalReference` é o id da nossa
 * `subscriptions`, e é o que amarra o webhook do MP à linha do nosso banco
 * sem depender de e-mail (que o aluno pode trocar).
 */
export function criarAssinatura(input: {
  planId: string;
  payerEmail: string;
  externalReference: string;
  backUrl: string;
}) {
  return chamar<Preapproval>(
    "POST",
    "/preapproval",
    {
      preapproval_plan_id: input.planId,
      payer_email: input.payerEmail,
      external_reference: input.externalReference,
      back_url: input.backUrl,
    },
    input.externalReference,
  );
}

export function obterAssinatura(id: string) {
  return chamar<Preapproval>("GET", `/preapproval/${id}`);
}

export function obterPagamento(id: string) {
  return chamar<Pagamento>("GET", `/v1/payments/${id}`);
}
