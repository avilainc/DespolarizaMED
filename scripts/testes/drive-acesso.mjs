// Testa se a service account enxerga a pasta de aulas do DespolarizaMED.
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const CRED = process.argv[2];
const PASTA = "1Nn0SH-_X7-E8wdZpJncjXro9cRIFagz0"; // biologia
const sa = JSON.parse(readFileSync(CRED, "utf8"));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const agora = Math.floor(Date.now() / 1000);
const cabecalho = b64({ alg: "RS256", typ: "JWT" });
const corpo = b64({
  iss: sa.client_email,
  scope: "https://www.googleapis.com/auth/drive.readonly",
  aud: "https://oauth2.googleapis.com/token",
  exp: agora + 3600,
  iat: agora,
});
const assinatura = createSign("RSA-SHA256").update(`${cabecalho}.${corpo}`).sign(sa.private_key, "base64url");

const r = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: `${cabecalho}.${corpo}.${assinatura}`,
  }),
});
const tok = await r.json();
if (!tok.access_token) { console.log("  token FALHOU:", JSON.stringify(tok).slice(0,200)); process.exit(1); }
console.log("  token OK");

const q = await fetch(
  `https://www.googleapis.com/drive/v3/files?q='${PASTA}'+in+parents&fields=files(id,name,size)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  { headers: { Authorization: `Bearer ${tok.access_token}` } },
);
const d = await q.json();
if (d.error) console.log("  acesso NEGADO:", d.error.message.slice(0, 120));
else console.log(`  acesso OK: ${d.files?.length ?? 0} itens na pasta biologia`);
