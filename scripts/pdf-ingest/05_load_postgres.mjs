/**
 * Etapa 5 - Carga no Postgres.
 *
 * Le data/documents.jsonl (metadados por PDF) + data/text/**.json.gz (texto por
 * pagina) e popula source_documents / document_pages.
 *
 * Idempotente: a chave e' o sha256 do arquivo. Rodar de novo atualiza os
 * metadados e substitui as paginas do documento.
 *
 * Uso: pnpm ingest:load        (via dotenv-cli, ver package.json)
 *      node scripts/pdf-ingest/05_load_postgres.mjs --limit 50
 */
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DOCS = path.join(ROOT, "data", "documents.jsonl");
const TEXT_DIR = path.join(ROOT, "data", "text");

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || 0;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL nao definido. Use: pnpm ingest:load");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

function textPath(sha) {
  return path.join(TEXT_DIR, sha.slice(0, 2), `${sha}.json.gz`);
}

function readDocs() {
  // Split explicito em vez de readline: o readline do Node tambem quebra em
  // U+2028, que ocorre dentro do texto de algumas provas.
  return readFileSync(DOCS, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

async function loadOne(doc) {
  const gz = await readFile(textPath(doc.sha256));
  const payload = JSON.parse(gunzipSync(gz).toString("utf8"));

  const [row] = await sql`
    insert into source_documents ${sql({
      sha256: doc.sha256,
      rel_path: doc.rel_path,
      all_paths: JSON.stringify(doc.all_paths),
      filename: doc.filename,
      categoria: doc.categoria,
      instituicao: doc.instituicao,
      instituicao_slug: doc.instituicao_slug,
      ano: doc.ano,
      ano_fonte: doc.ano_fonte,
      subpasta: JSON.stringify(doc.subpasta),
      banca: doc.banca ?? null,
      banca_evidencia: doc.banca_evidencia ?? null,
      fase: doc.fase,
      curso: doc.curso,
      tipo: doc.tipo,
      tipo_fonte: doc.tipo_fonte,
      sinais: JSON.stringify(doc.sinais),
      size_bytes: doc.size_bytes,
      pages: doc.pages,
      chars: doc.chars,
      pages_nativas: doc.pages_nativas,
      pages_ocr: doc.pages_ocr,
      pages_sem_texto: doc.pages_sem_texto,
      ocr_conf_media: doc.ocr_conf_media,
      pdf_metadata: doc.pdf_metadata ? JSON.stringify(doc.pdf_metadata) : null,
    })}
    on conflict (sha256) do update set
      rel_path        = excluded.rel_path,
      all_paths       = excluded.all_paths,
      filename        = excluded.filename,
      categoria       = excluded.categoria,
      instituicao     = excluded.instituicao,
      instituicao_slug= excluded.instituicao_slug,
      ano             = excluded.ano,
      ano_fonte       = excluded.ano_fonte,
      subpasta        = excluded.subpasta,
      banca           = excluded.banca,
      banca_evidencia = excluded.banca_evidencia,
      fase            = excluded.fase,
      curso           = excluded.curso,
      tipo            = excluded.tipo,
      tipo_fonte      = excluded.tipo_fonte,
      sinais          = excluded.sinais,
      size_bytes      = excluded.size_bytes,
      pages           = excluded.pages,
      chars           = excluded.chars,
      pages_nativas   = excluded.pages_nativas,
      pages_ocr       = excluded.pages_ocr,
      pages_sem_texto = excluded.pages_sem_texto,
      ocr_conf_media  = excluded.ocr_conf_media,
      pdf_metadata    = excluded.pdf_metadata,
      ingested_at     = now()
    returning id
  `;

  const documentId = row.id;
  await sql`delete from document_pages where document_id = ${documentId}`;

  const pages = payload.pages.map((p) => ({
    document_id: documentId,
    page_number: p.n,
    source: p.source ?? "pdf",
    layout: p.layout ?? null,
    ordem: p.ordem ?? null,
    chars: p.chars ?? (p.text ? p.text.length : 0),
    ocr_conf: p.ocr_conf ?? null,
    // Postgres recusa NUL em colunas text — alguns PDFs antigos trazem \x00.
    content: (p.text ?? "").replace(/\u0000/g, ""),
  }));

  // lotes pequenos: algumas paginas passam de 60 KB de texto
  for (let i = 0; i < pages.length; i += 25) {
    const chunk = pages.slice(i, i + 25);
    await sql`insert into document_pages ${sql(chunk)}`;
  }
  return pages.length;
}

async function main() {
  let docs = readDocs();
  if (limit) docs = docs.slice(0, limit);
  console.log(`${docs.length} documentos para carregar.`);

  let okDocs = 0;
  let okPages = 0;
  const errors = [];

  for (const [i, doc] of docs.entries()) {
    try {
      okPages += await loadOne(doc);
      okDocs += 1;
    } catch (err) {
      errors.push({ rel: doc.rel_path, msg: err.message });
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${docs.length}`);
  }

  const [stats] = await sql`
    select
      (select count(*) from source_documents)                     as documentos,
      (select count(*) from document_pages)                       as paginas,
      (select count(*) from document_pages where source = 'ocr')  as paginas_ocr,
      (select coalesce(sum(chars), 0) from document_pages)        as caracteres
  `;

  console.log("\n================ CARGA ================");
  console.log(`Documentos inseridos : ${okDocs} (erros: ${errors.length})`);
  console.log(`Paginas inseridas    : ${okPages}`);
  console.log("\nNo banco:");
  console.log(`  source_documents   : ${stats.documentos}`);
  console.log(`  document_pages     : ${stats.paginas}  (OCR: ${stats.paginas_ocr})`);
  console.log(`  caracteres         : ${Number(stats.caracteres).toLocaleString("pt-BR")}`);
  for (const e of errors.slice(0, 15)) console.log(`  ERRO ${e.rel}: ${e.msg}`);

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
