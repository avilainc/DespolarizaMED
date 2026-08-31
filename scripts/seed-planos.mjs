/**
 * Cria os três planos no banco e, quando faltar, o preapproval_plan no
 * Mercado Pago: pnpm seed:planos
 *
 * Idempotente pelo slug. Os valores seguem o padrão de precificação da casa
 * (barato / âncora / alto), e ficam no banco justamente para poderem mudar
 * pelo painel sem tocar em código — o frontend nunca traz preço fixo.
 */
import postgres from "postgres";

const PLANOS = [
  { slug: "mensal", name: "Mensal", billingPeriod: "MENSAL", priceCents: 9900, meses: 1 },
  { slug: "trimestral", name: "Trimestral", billingPeriod: "TRIMESTRAL", priceCents: 26700, meses: 3 },
  { slug: "semestral", name: "Semestral", billingPeriod: "SEMESTRAL", priceCents: 47400, meses: 6 },
];

const { DATABASE_URL, MP_ACCESS_TOKEN } = process.env;
const BASE = process.env.BETTER_AUTH_URL ?? "https://despolarizamed.com.br";

if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function criarPlanoNoMP(plano) {
  const r = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `despolarizamed-${plano.slug}`,
    },
    body: JSON.stringify({
      reason: `DespolarizaMED ${plano.name}`,
      auto_recurring: {
        frequency: plano.meses,
        frequency_type: "months",
        transaction_amount: plano.priceCents / 100,
        currency_id: "BRL",
      },
      back_url: `${BASE}/dashboard`,
      payment_methods_allowed: {
        payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
      },
    }),
  });

  const texto = await r.text();
  if (!r.ok) throw new Error(`MP ${r.status}: ${texto.slice(0, 300)}`);
  return JSON.parse(texto).id;
}

try {
  for (const plano of PLANOS) {
    const [existente] = await sql`
      select id, mercado_pago_plan_id from plans where slug = ${plano.slug}
    `;

    let mpId = existente?.mercado_pago_plan_id ?? null;

    // Só chama o MP quando falta o id: rodar o seed de novo não cria plano
    // duplicado lá, que ficaria visível para o aluno no checkout.
    if (!mpId && MP_ACCESS_TOKEN) {
      mpId = await criarPlanoNoMP(plano);
      console.log(`  MP: ${plano.slug} -> ${mpId}`);
    }

    if (existente) {
      await sql`
        update plans set name = ${plano.name}, price_cents = ${plano.priceCents},
          billing_period = ${plano.billingPeriod}, mercado_pago_plan_id = ${mpId},
          active = true, updated_at = now()
        where id = ${existente.id}
      `;
      console.log(`atualizado: ${plano.slug} (${plano.priceCents / 100} BRL)`);
    } else {
      await sql`
        insert into plans (name, slug, billing_period, price_cents, mercado_pago_plan_id, active)
        values (${plano.name}, ${plano.slug}, ${plano.billingPeriod}, ${plano.priceCents}, ${mpId}, true)
      `;
      console.log(`criado: ${plano.slug} (${plano.priceCents / 100} BRL)`);
    }
  }

  if (!MP_ACCESS_TOKEN) {
    console.warn("\nMP_ACCESS_TOKEN ausente: planos gravados sem id do Mercado Pago.");
    console.warn("O checkout recusa plano sem id; rode de novo com o token para completar.");
  }
} finally {
  await sql.end();
}
