import { createHmac } from "node:crypto";
import { validarAssinatura } from "../../src/lib/mercadopago/webhook.ts";

const secret = "segredo-de-teste";
const ts = "1788000000";
const dataId = "123456789";
const reqId = "req-abc";
const agora = new Date(Number(ts) * 1000);

const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

const casos = [
  ["assinatura correta", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId, secret, agora }, true],
  ["v1 adulterado", { xSignature: `ts=${ts},v1=${"0".repeat(64)}`, xRequestId: reqId, dataId, secret, agora }, false],
  ["secret errada", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId, secret: "outra", agora }, false],
  ["sem secret", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId, secret: undefined, agora }, false],
  ["sem x-signature", { xSignature: null, xRequestId: reqId, dataId, secret, agora }, false],
  ["replay antigo (2h)", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId, secret, agora: new Date((Number(ts) + 7200) * 1000) }, false],
  ["request-id trocado", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: "outro", dataId, secret, agora }, false],
  ["data.id trocado", { xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId: "999", secret, agora }, false],
  ["malformado", { xSignature: "lixo", xRequestId: reqId, dataId, secret, agora }, false],
];

// O MP normaliza o id para minúsculas; um id com maiúsculas deve validar igual.
const dataIdMaiusculo = "ABC123";
const v1Min = createHmac("sha256", secret).update(`id:abc123;request-id:${reqId};ts:${ts};`).digest("hex");
casos.push(["id em maiúsculas normaliza", { xSignature: `ts=${ts},v1=${v1Min}`, xRequestId: reqId, dataId: dataIdMaiusculo, secret, agora }, true]);

let falhas = 0;
for (const [nome, entrada, esperado] of casos) {
  const r = validarAssinatura(entrada);
  const ok = r.valido === esperado;
  if (!ok) falhas++;
  const motivo = r.valido ? "" : ` (${r.motivo})`;
  console.log(`${ok ? "PASS" : "FALHA"}  ${nome}${motivo}`);
}
console.log(falhas === 0 ? "\ntodos passaram" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
