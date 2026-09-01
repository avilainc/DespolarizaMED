/**
 * Acesso de leitura ao Google Drive pela service account.
 *
 * A SA usada é a `gemini@contatos-424700`, a única das duas do monorepo que
 * enxerga a pasta do DespolarizaMED (a outra responde "account not found").
 * O escopo é drive.readonly: este pipeline só lê, o acervo master continua
 * sendo do Drive e nada aqui escreve lá.
 */
import { createWriteStream } from "node:fs";
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const CRED =
  process.env.GOOGLE_SA_JSON ?? "d:/avilaops.com/docs/contatos-424700-279e058fa322.json";

let cache = null;

async function token() {
  // O token vale 1 h; renova com folga de 5 min para não expirar no meio de
  // um download de 3 GB.
  if (cache && cache.expira > Date.now() + 300_000) return cache.valor;

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
  const assinatura = createSign("RSA-SHA256")
    .update(`${cabecalho}.${corpo}`)
    .sign(sa.private_key, "base64url");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${cabecalho}.${corpo}.${assinatura}`,
    }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error(`token do Drive: ${JSON.stringify(t).slice(0, 200)}`);

  cache = { valor: t.access_token, expira: Date.now() + t.expires_in * 1000 };
  return cache.valor;
}

async function api(caminho) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/${caminho}`, {
    headers: { Authorization: `Bearer ${await token()}` },
  });
  const d = await r.json();
  if (d.error) throw new Error(`Drive: ${d.error.message}`);
  return d;
}

export async function listarPasta(pastaId) {
  // supportsAllDrives/includeItemsFromAllDrives: a pasta vive num drive
  // compartilhado, e sem essas flags a API devolve lista vazia sem erro.
  const d = await api(
    `files?q='${pastaId}'+in+parents+and+trashed=false` +
      `&fields=files(id,name,size,mimeType,modifiedTime)&pageSize=200` +
      `&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=name`,
  );
  return d.files ?? [];
}

export async function baixar(fileId, destino, aoProgredir) {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${await token()}` } },
  );
  if (!r.ok) throw new Error(`download ${fileId}: HTTP ${r.status}`);

  const total = Number(r.headers.get("content-length") ?? 0);
  let baixado = 0;
  let ultimoAviso = 0;

  const origem = Readable.fromWeb(r.body);
  origem.on("data", (pedaco) => {
    baixado += pedaco.length;
    // Progresso a cada 10%: log por chunk encheria o terminal de ruído.
    const pct = total ? Math.floor((baixado / total) * 10) : 0;
    if (pct > ultimoAviso) {
      ultimoAviso = pct;
      aoProgredir?.(baixado, total);
    }
  });

  await pipeline(origem, createWriteStream(destino));
  return baixado;
}
