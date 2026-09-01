/**
 * Alinha o catálogo do Payload com a árvore real do Google Drive.
 *
 *   node scripts/video/sincronizar-aulas.mjs <staff-email> <staff-senha>
 *
 * O Drive é onde o professor trabalha, então ele é a fonte da verdade da
 * estrutura: 6 módulos e 29 aulas. O catálogo tinha 2 módulos e 10 aulas de um
 * seed antigo, com as aulas 6–10 no módulo errado (estavam em "Biologia
 * Molecular" quando no Drive pertencem a "biologia celular").
 *
 * Idempotente: casa por slug, cria o que falta e atualiza título, módulo e
 * URL do vídeo do que já existe. Não apaga nada — se uma aula sumir do Drive,
 * ela fica no catálogo para alguém decidir, porque apagar aula é destruir o
 * progresso de quem já assistiu.
 */
import { listarPasta } from "./drive.mjs";

const BASE = process.env.SEED_BASE_URL ?? "https://despolarizamed.com.br";
const PASTA_BIOLOGIA = "1Nn0SH-_X7-E8wdZpJncjXro9cRIFagz0";
const [, , email, senha] = process.argv;

if (!email || !senha) {
  console.error("uso: node scripts/video/sincronizar-aulas.mjs <staff-email> <staff-senha>");
  process.exit(1);
}

const slugificar = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function login() {
  const r = await fetch(`${BASE}/api/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ email, password: senha }),
  });
  if (!r.ok) throw new Error(`login: ${r.status} ${await r.text()}`);
  return (await r.json()).token;
}

async function acharPorSlug(colecao, slug, token) {
  const r = await fetch(
    `${BASE}/api/${colecao}?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
    { headers: { Authorization: `JWT ${token}` } },
  );
  return (await r.json()).docs?.[0] ?? null;
}

async function criarOuAtualizar(colecao, slug, corpo, token) {
  const existente = await acharPorSlug(colecao, slug, token);

  const metodo = existente ? "PATCH" : "POST";
  const url = existente ? `${BASE}/api/${colecao}/${existente.id}` : `${BASE}/api/${colecao}`;

  const r = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify(corpo),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`${metodo} ${colecao}/${slug}: ${r.status} ${JSON.stringify(d).slice(0, 300)}`);

  const doc = d.doc ?? d;
  console.log(`  ${existente ? "atualizado" : "criado   "} ${colecao}/${slug} (id ${doc.id})`);
  return doc;
}

/** "aula 12 - núcleo e cromossomos.mp4" -> { numero, titulo } */
function interpretarNome(nome) {
  const m = nome.match(/^aula\s+(\d+)\s*[-–]\s*(.+)\.mp4$/i);
  return m ? { numero: Number(m[1]), titulo: m[2].trim() } : null;
}

/** "módulo 3 - biologia molecular" -> { numero, titulo } */
function interpretarModulo(nome) {
  const m = nome.match(/^m[óo]dulo\s+(\d+)\s*[-–]\s*(.+)$/i);
  return m ? { numero: Number(m[1]), titulo: m[2].trim() } : null;
}

const maiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const token = await login();

const disciplina = await criarOuAtualizar(
  "subjects",
  "biologia",
  {
    name: "Biologia",
    slug: "biologia",
    description:
      "Bioquímica, biologia celular e molecular, embriologia, histologia e sistemas, com foco em vestibulares de Medicina.",
    order: 1,
  },
  token,
);

const pastas = (await listarPasta(PASTA_BIOLOGIA))
  .map((p) => ({ ...p, meta: interpretarModulo(p.name) }))
  .filter((p) => p.meta)
  .sort((a, b) => a.meta.numero - b.meta.numero);

let totalAulas = 0;

for (const pasta of pastas) {
  const { numero, titulo } = pasta.meta;
  console.log(`\nmódulo ${numero} — ${titulo}`);

  const modulo = await criarOuAtualizar(
    "modules",
    slugificar(titulo),
    {
      subject: disciplina.id,
      name: maiuscula(titulo),
      slug: slugificar(titulo),
      order: numero,
    },
    token,
  );

  const aulas = (await listarPasta(pasta.id))
    .filter((a) => a.mimeType === "video/mp4")
    .map((a) => ({ ...a, meta: interpretarNome(a.name) }))
    .filter((a) => a.meta)
    .sort((a, b) => a.meta.numero - b.meta.numero);

  for (const aula of aulas) {
    const n = String(aula.meta.numero).padStart(2, "0");
    await criarOuAtualizar(
      "lessons",
      `aula-${n}`,
      {
        module: modulo.id,
        title: `Aula ${n} — ${maiuscula(aula.meta.titulo)}`,
        slug: `aula-${n}`,
        // A rota da API, não um arquivo estático: cada segmento revalida a
        // assinatura antes de sair. Ver src/app/api/aulas.
        videoUrl: `/api/aulas/aula-${n}/index.m3u8`,
        order: aula.meta.numero,
        published: true,
      },
      token,
    );
    totalAulas++;
  }
}

console.log(`\n${pastas.length} módulos, ${totalAulas} aulas sincronizadas.`);
