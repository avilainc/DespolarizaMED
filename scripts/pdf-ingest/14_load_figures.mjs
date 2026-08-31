/**
 * Etapa 14 - Carga das figuras no Postgres.
 *
 * Le data/figures.jsonl e popula library_figures. O PNG fica no disco (em
 * data/figures/); a tabela guarda o caminho, a pagina, o bbox e a questao dona.
 *
 * Uso: pnpm ingest:load-figures
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "data", "figures.jsonl");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL nao definido. Use: pnpm ingest:load-figures");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

async function main() {
  const docs = readFileSync(FILE, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const ids = await sql`select id, sha256 from source_documents`;
  const idPorSha = new Map(ids.map((r) => [r.sha256, r.id]));

  let docsOk = 0;
  let figuras = 0;
  let semDocumento = 0;
  const erros = [];

  for (const [i, d] of docs.entries()) {
    const documentId = idPorSha.get(d.sha256);
    if (!documentId) {
      semDocumento += 1;
      continue;
    }
    try {
      await sql`delete from library_figures where document_id = ${documentId}`;
      if (d.figuras?.length) {
        const linhas = d.figuras.map((f) => ({
          document_id: documentId,
          pagina: f.pagina,
          indice: f.indice,
          questao_numero: f.numero_questao ?? null,
          arquivo: f.arquivo,
          bbox: JSON.stringify(f.bbox),
          largura_px: f.largura_px ?? null,
          altura_px: f.altura_px ?? null,
        }));
        for (let k = 0; k < linhas.length; k += 100) {
          await sql`insert into library_figures ${sql(linhas.slice(k, k + 100))}`;
        }
        figuras += linhas.length;
      }
      docsOk += 1;
    } catch (err) {
      erros.push({ rel: d.rel_path, msg: err.message });
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${docs.length}`);
  }

  const [s] = await sql`
    select count(*)::int total,
           count(*) filter (where questao_numero is not null)::int com_questao
    from library_figures
  `;

  console.log("\n================ CARGA DE FIGURAS ================");
  console.log(`Provas processadas : ${docsOk} (erros: ${erros.length}, sem documento: ${semDocumento})`);
  console.log(`Figuras inseridas  : ${figuras}`);
  console.log(`\nNo banco: ${s.total} figuras (ligadas a uma questao: ${s.com_questao})`);
  for (const e of erros.slice(0, 10)) console.log(`  ERRO ${e.rel}: ${e.msg}`);

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
