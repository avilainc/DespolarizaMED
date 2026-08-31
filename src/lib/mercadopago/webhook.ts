import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validação da assinatura do webhook do Mercado Pago.
 *
 * É o que separa "o MP nos avisou que o pagamento foi aprovado" de "alguém
 * descobriu a URL do webhook e liberou acesso premium para si mesmo". O plano
 * do produto é explícito: o acesso nunca depende do retorno do navegador, e a
 * confirmação acontece no backend com a assinatura validada.
 *
 * O MP manda dois cabeçalhos:
 *   x-signature:  ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8c1aa2a...
 *   x-request-id: uuid da entrega
 *
 * E o manifest assinado é, literalmente (com os pontos-e-vírgulas finais):
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export type ResultadoValidacao =
  | { valido: true }
  | { valido: false; motivo: string };

export function validarAssinatura(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string | undefined;
  /** Tolerância de relógio; entregas antigas são recusadas para evitar replay. */
  toleranciaSegundos?: number;
  agora?: Date;
}): ResultadoValidacao {
  const { xSignature, xRequestId, dataId, secret } = input;

  // Sem secret configurada a porta fecha, nunca abre: um webhook que aceita
  // qualquer corpo é pior que um webhook que não existe.
  if (!secret) return { valido: false, motivo: "MP_WEBHOOK_SECRET não configurada" };
  if (!xSignature) return { valido: false, motivo: "x-signature ausente" };
  if (!dataId) return { valido: false, motivo: "data.id ausente" };

  const partes = new Map(
    xSignature.split(",").map((p) => {
      const [chave, ...resto] = p.split("=");
      return [chave.trim(), resto.join("=").trim()] as const;
    }),
  );

  const ts = partes.get("ts");
  const v1 = partes.get("v1");
  if (!ts || !v1) return { valido: false, motivo: "x-signature malformado" };

  const tolerancia = input.toleranciaSegundos ?? 600;
  const agora = Math.floor((input.agora ?? new Date()).getTime() / 1000);
  const idade = Math.abs(agora - Number(ts));
  if (!Number.isFinite(idade) || idade > tolerancia) {
    return { valido: false, motivo: `timestamp fora da tolerância (${idade}s)` };
  }

  // O MP normaliza o id para minúsculas ao montar o manifest.
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length) return { valido: false, motivo: "assinatura não confere" };
  if (!timingSafeEqual(a, b)) return { valido: false, motivo: "assinatura não confere" };

  return { valido: true };
}
