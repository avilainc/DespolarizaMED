/**
 * Apresentação de preço — a parte sem banco, compartilhada pela landing e por
 * `/planos`.
 *
 * Existe porque o preço estava em dois lugares que discordavam: a landing
 * anunciava valores fixos em `features/marketing/content.ts` (R$ 97/79/67) e o
 * checkout cobrava o que está na tabela `plans` (R$ 99/267/474). Quem via a
 * oferta na home e criava conta encontrava outro valor — além de matar a
 * conversão no ponto mais caro do funil, o art. 30 do CDC vincula o fornecedor
 * à oferta anunciada.
 *
 * Agora as duas telas leem `listarPlanosAtivos()` e formatam por aqui. Mudar
 * preço é mexer no banco (via `pnpm seed:planos`), num lugar só.
 */

export const PERIODO: Record<string, { rotulo: string; curto: string; meses: number }> = {
  MENSAL: { rotulo: "por mês", curto: "/mês", meses: 1 },
  TRIMESTRAL: { rotulo: "a cada 3 meses", curto: "/trimestre", meses: 3 },
  SEMESTRAL: { rotulo: "a cada 6 meses", curto: "/semestre", meses: 6 },
};

/** Fallback para um período que o banco tenha e este mapa ainda não conheça. */
const DESCONHECIDO = { rotulo: "por período", curto: "", meses: 1 };

export function periodoDe(billingPeriod: string) {
  return PERIODO[billingPeriod] ?? DESCONHECIDO;
}

export function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

export type PlanoExibivel = { priceCents: number; billingPeriod: string };

/**
 * O equivalente mensal, que é o que deixa a comparação honesta: sem ele,
 * "R$ 474" ao lado de "R$ 99" parece mais caro, quando é mais barato por mês.
 */
export function porMes(plano: PlanoExibivel) {
  return Math.round(plano.priceCents / periodoDe(plano.billingPeriod).meses);
}

/** O menor preço mensal do conjunto — usado para destacar um plano só. */
export function melhorPrecoMensal(planos: PlanoExibivel[]) {
  return planos.length > 0 ? Math.min(...planos.map(porMes)) : 0;
}
