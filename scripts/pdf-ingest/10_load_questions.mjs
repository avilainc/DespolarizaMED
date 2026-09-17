/**
 * Etapa 10 - Carga das questoes no Postgres.
 *
 * Le data/questions_final.jsonl e popula library_questions /
 * library_question_options, amarrando cada questao ao documento de origem
 * (source_documents) e ao gabarito usado.
 *
 * Idempotente por documento: apaga as questoes daquele documento e reinsere.
 *
 * Uso: pnpm ingest:load-questions
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "data", "questions_final.jsonl");
const SUBJECTS = path.join(ROOT, "data", "subjects.jsonl");
const TOPICS = path.join(ROOT, "data", "topics.jsonl");
const DOCUMENTS = path.join(ROOT, "data", "documents.jsonl");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL nao definido. Use: pnpm ingest:load-questions");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const limparNul = (s) => (s ?? "").replace(/\u0000/g, "");

function lerQuestoes() {
  // Split explicito em vez de readline: o readline do Node quebra linha
  // tambem em U+2028 (LINE SEPARATOR), que aparece dentro do texto de algumas
  // provas e partia o JSON no meio.
  const porDoc = new Map();
  for (const linha of readFileSync(FILE, "utf8").split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const q = JSON.parse(linha);
    if (!porDoc.has(q.sha256)) porDoc.set(q.sha256, []);
    porDoc.get(q.sha256).push(q);
  }
  return porDoc;
}

/** Sugestões de disciplina (etapa 15), casadas por sha + número + página. */
function lerDisciplinas() {
  const mapa = new Map();
  if (!existsSync(SUBJECTS)) return mapa;
  for (const linha of readFileSync(SUBJECTS, "utf8").split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const s = JSON.parse(linha);
    mapa.set(`${s.sha256}#${s.numero}#${s.pagina}`, s);
  }
  return mapa;
}

/** Temas (etapa 18), mesma chave. */
function lerTemas() {
  const mapa = new Map();
  if (!existsSync(TOPICS)) return mapa;
  for (const linha of readFileSync(TOPICS, "utf8").split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const t = JSON.parse(linha);
    mapa.set(`${t.sha256}#${t.numero}#${t.pagina}`, t);
  }
  return mapa;
}

/** Banca por documento (etapa 04), para desnormalizar na questão. */
function lerBancas() {
  const mapa = new Map();
  if (!existsSync(DOCUMENTS)) return mapa;
  for (const linha of readFileSync(DOCUMENTS, "utf8").split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const d = JSON.parse(linha);
    if (d.banca) mapa.set(d.sha256, d.banca);
  }
  return mapa;
}

async function main() {
  const porDoc = lerQuestoes();
  const disciplinas = lerDisciplinas();
  const temas = lerTemas();
  const bancas = lerBancas();
  console.log(`${porDoc.size} provas com questoes.`);

  const ids = await sql`select id, sha256 from source_documents`;
  const idPorSha = new Map(ids.map((r) => [r.sha256, r.id]));

  let docsOk = 0;
  let questoesOk = 0;
  let opcoesOk = 0;
  let semDocumento = 0;
  const erros = [];

  let i = 0;
  for (const [sha, questoes] of porDoc) {
    i += 1;
    const documentId = idPorSha.get(sha);
    if (!documentId) {
      semDocumento += 1;
      continue;
    }
    try {
      await sql`delete from library_questions where document_id = ${documentId}`;

      const linhas = questoes.map((q) => {
        const chave = `${q.sha256}#${q.numero}#${q.pagina}`;
        const d = disciplinas.get(chave);
        const t = temas.get(chave);
        return {
        document_id: documentId,
        disciplina_sugerida: d?.disciplina ?? null,
        disciplina_fonte: d?.fonte ?? null,
        disciplina_pontos: d?.pontos ?? null,
        tema_sugerido: t?.tema ?? null,
        tema_pontos: t?.pontos ?? null,
        banca: bancas.get(q.sha256) ?? null,
        numero: q.numero,
        numero_forca: q.numero_forca ?? null,
        pagina: q.pagina ?? null,
        tipo: q.tipo ?? "objetiva",
        enunciado: limparNul(q.enunciado),
        instituicao_slug: q.instituicao_slug ?? null,
        ano: q.ano ?? null,
        fase: q.fase ?? null,
        curso: q.curso ?? null,
        gabarito_letra: q.gabarito_letra ?? null,
        gabarito_document_id: idPorSha.get(q.gabarito_sha256) ?? null,
        cobertura_gabarito: q.cobertura_gabarito ?? null,
        motivo_ligacao: q.motivo_ligacao ?? null,
        anulada: Boolean(q.anulada),
        depende_de_contexto: Boolean(q.depende_de_contexto),
        contexto_numero: q.contexto_numero ?? null,
        contexto_fonte: q.contexto_fonte ?? null,
        duplicata_de: q.duplicata_de ?? null,
        copias: q.copias ?? 1,
        confirmada_por_duplicata: Boolean(q.confirmada_por_duplicata),
        conflito_duplicata: Boolean(q.conflito_duplicata),
        // sql.json, e nao JSON.stringify: a string viraria um escalar jsonb
        // ('"[]"') e jsonb_array_length() quebra na fila de revisao.
        problemas: sql.json(q.problemas ?? []),
        // Conflito entre cópias derruba a validação: se duas extrações
        // independentes da mesma questão apontam respostas diferentes, uma
        // delas está errada e não dá para saber qual sem olhar. Antes essas
        // questões continuavam marcadas como validadas — o pipeline sabia do
        // problema e mesmo assim as dava por boas.
        validada:
          (q.problemas ?? []).length === 0 &&
          Boolean(q.gabarito_letra) &&
          !q.conflito_duplicata,
        };
      });

      // Lotes pequenos de proposito: nesta maquina (8 GB) um lote de 50
      // questoes com enunciado longo estourou a memoria e derrubou a carga de
      // um documento inteiro.
      const inseridas = [];
      for (let k = 0; k < linhas.length; k += 15) {
        const lote = linhas.slice(k, k + 15);
        const r = await sql`insert into library_questions ${sql(lote)} returning id`;
        inseridas.push(...r.map((x) => x.id));
      }

      const opcoes = [];
      questoes.forEach((q, idx) => {
        const questionId = inseridas[idx];
        if (!questionId) return;
        q.alternativas.forEach((a, j) => {
          opcoes.push({
            question_id: questionId,
            letra: a.letra,
            texto: limparNul(a.texto),
            correta: q.gabarito_letra ? a.letra === q.gabarito_letra : null,
            ordem: j,
          });
        });
      });

      for (let k = 0; k < opcoes.length; k += 40) {
        await sql`insert into library_question_options ${sql(opcoes.slice(k, k + 40))}`;
      }

      docsOk += 1;
      questoesOk += inseridas.length;
      opcoesOk += opcoes.length;
    } catch (err) {
      erros.push({ sha, msg: err.message });
    }
    if (i % 100 === 0) console.log(`  ${i}/${porDoc.size}`);
  }

  const [s] = await sql`
    select
      (select count(*) from library_questions)                      as questoes,
      (select count(*) from library_questions where validada)       as validadas,
      (select count(*) from library_question_options)               as opcoes,
      (select count(*) from library_question_options where correta) as corretas
  `;

  console.log("\n================ CARGA DE QUESTOES ================");
  console.log(`Provas carregadas    : ${docsOk} (erros: ${erros.length}, sem documento: ${semDocumento})`);
  console.log(`Questoes inseridas   : ${questoesOk}`);
  console.log(`Alternativas         : ${opcoesOk}`);
  console.log("\nNo banco:");
  console.log(`  library_questions        : ${s.questoes}  (validadas: ${s.validadas})`);
  console.log(`  library_question_options : ${s.opcoes}  (marcadas corretas: ${s.corretas})`);
  for (const e of erros.slice(0, 10)) console.log(`  ERRO ${e.sha}: ${e.msg}`);

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
