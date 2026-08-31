import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Porta de entrada do harness.
 *
 * Duas camadas, como manda o contrato: a rede (só o orchestrator alcança a app
 * pela internal_url, garantido pelo Caddy respondendo 404 fora de 10.8.0.0/24)
 * e o Bearer aqui. Esta é a segunda: a app não confia na primeira, porque em
 * dev não há Caddy nenhum na frente.
 *
 * A comparação é em tempo constante. Um `===` vaza o prefixo do token por
 * tempo de resposta, e essas rotas são chamadas de fora a cada 15 min, o que dá
 * amostra de sobra para medir a diferença.
 */
export function harnessTokenOk(request: Request): boolean {
  const expected = process.env.GAPP_HARNESS_TOKEN;

  // Sem token configurado a rota fica fechada, nunca aberta: fail-closed. Uma
  // app sem GAPP_HARNESS_TOKEN ainda não foi registrada pelo orchestrator, e
  // responder 200 aqui entregaria stats para qualquer um que alcance a porta.
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice(7));
  const target = Buffer.from(expected);

  // timingSafeEqual exige mesmo tamanho; comparar o tamanho antes vaza só o
  // comprimento do token, que não é segredo útil.
  if (provided.length !== target.length) return false;

  return timingSafeEqual(provided, target);
}

/** 401 padronizado: sem corpo descritivo, para não confirmar o que existe atrás. */
export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
