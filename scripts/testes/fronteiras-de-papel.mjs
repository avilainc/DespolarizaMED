/**
 * Matriz de autorização em runtime: anônimo × aluno × dono do recurso.
 *
 *   pnpm build && pnpm start          # noutro terminal
 *   node scripts/testes/fronteiras-de-papel.mjs
 *
 * Complementa `actions-sem-sessao.mjs`, que só pergunta "o anônimo passa?".
 * Aqui as perguntas são as que só aparecem com sessão de verdade:
 *
 *   1. REST do Payload: conteúdo pago sai sem cookie? (`/api/<collection>`)
 *   2. Cadastro: dá para se declarar ADMIN no corpo do sign-up?
 *   3. Gabarito: um assinante obtém a resposta de uma questão da prova que
 *      ele tem ABERTA, antes de responder/finalizar? São duas portas para o
 *      mesmo dado — `revelarGabarito` e `responderQuestao`, que devolve o
 *      gabarito junto com a correção.
 *   4. IDOR: o aluno B age sobre a tentativa do aluno A?
 *
 * Cria os próprios dados (dois alunos, assinaturas, uma prova de 3 questões)
 * e apaga no fim. Exige Postgres local e DATABASE_URL apontando para ele — o
 * script recusa rodar contra qualquer host que não seja loopback.
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

// localhost, não 127.0.0.1: o Better Auth compara a Origin com BETTER_AUTH_URL
// e recusa (INVALID_ORIGIN) quando o host difere, mesmo sendo a mesma máquina.
const BASE = process.env.BASE ?? "http://localhost:3000";
const MANIFEST = process.env.MANIFEST ?? ".next/server/server-reference-manifest.json";

const url = process.env.DATABASE_URL ?? "";
const host = url ? new URL(url).hostname : "";
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  console.error(`\n  DATABASE_URL aponta para "${host}". Este script escreve e apaga dados:`);
  console.error("  só roda contra Postgres local.\n");
  process.exit(2);
}

const sql = postgres(url);
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

// UUIDs v4 válidos: o zod 4 confere os bits de versão e variante, e um uuid
// "bonito" tipo 4444-4444 é recusado na validação antes de chegar na guarda.
const DOC = "7d3f1a2b-4c5e-4d6f-8a9b-0c1d2e3f4a5b";
const QUESTOES = [
  ["aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa", "A"],
  ["bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb", "B"],
  ["cccccccc-3333-4333-8333-cccccccccccc", "C"],
];
const EMAILS = ["fronteiras-a@example.invalid", "fronteiras-b@example.invalid"];

const falhas = [];
const cookies = {};

function ok(rotulo, passou, detalhe = "") {
  console.log(`  ${passou ? "ok  " : "FALHA"}  ${rotulo}${detalhe ? `  — ${detalhe}` : ""}`);
  if (!passou) falhas.push(`${rotulo}${detalhe ? `: ${detalhe}` : ""}`);
}

function acao(nome) {
  for (const [id, v] of Object.entries(manifest.node ?? {})) {
    if (v.exportedName === nome) {
      const rota = Object.keys(v.workers ?? {})[0] ?? "";
      const u = rota.replace(/^app/, "").replace(/\/page$/, "").replace(/\([^)]*\)\//g, "");
      return { id, url: u || "/" };
    }
  }
  throw new Error(`action "${nome}" não está no manifest`);
}

async function chamar(nome, args, quem) {
  const { id, url: rota } = acao(nome);
  const r = await fetch(BASE + rota, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Next-Action": id,
      "Content-Type": "text/plain;charset=UTF-8",
      ...(quem ? { Cookie: cookies[quem] } : {}),
    },
    body: JSON.stringify(args),
  });
  const corpo = await r.text();

  // O id da action é hash do módulo: um servidor de outro build responde 404
  // em tudo, e o relatório inteiro viraria falso positivo.
  if (r.status === 404 && /Server action not found/i.test(corpo)) {
    console.error("\n  ABORTADO: o servidor no ar é de outro build que o manifest lido.");
    console.error("  Pare o `pnpm start`, rode `pnpm build` e suba de novo.\n");
    await sql.end();
    process.exit(2);
  }

  // A action responde numa linha apontada pelo envelope ("a":"$@N"); ler a
  // linha 0 devolveria o envelope, não o resultado.
  const env = corpo.match(/^0:(\{.*)$/m);
  if (env) {
    const ref = JSON.parse(env[1]).a;
    if (typeof ref === "string" && ref.startsWith("$@")) {
      const linha = corpo.match(new RegExp(`^${ref.slice(2)}:(.*)$`, "m"));
      if (linha && !linha[1].startsWith("E{")) {
        try {
          return JSON.parse(linha[1]);
        } catch {
          /* cai no retorno bruto abaixo */
        }
      }
    }
  }
  return { _redirecionou: /\/login|\/planos/.test(corpo) };
}

async function limpar() {
  await sql`delete from practice_answers where student_id in (select id from users where email = any(${EMAILS}))`;
  await sql`delete from practice_attempts where student_id in (select id from users where email = any(${EMAILS}))`;
  await sql`delete from users where email = any(${EMAILS})`;
  await sql`delete from library_question_options where question_id = any(${QUESTOES.map((q) => q[0])})`;
  await sql`delete from library_questions where document_id = ${DOC}`;
  await sql`delete from source_documents where id = ${DOC}`;
}

async function preparar() {
  await limpar();

  await sql`insert into source_documents (id, sha256, rel_path, filename, tipo, size_bytes, pages)
            values (${DOC}, 'sha-fronteiras', 'teste/fronteiras.pdf', 'fronteiras.pdf', 'prova', 1, 1)`;

  let n = 0;
  for (const [id, gab] of QUESTOES) {
    n += 1;
    await sql`insert into library_questions (id, document_id, numero, enunciado, gabarito_letra, validada)
              values (${id}, ${DOC}, ${n}, ${`Questão ${n} (fronteiras)`}, ${gab}, true)`;
    for (const letra of ["A", "B", "C", "D", "E"]) {
      await sql`insert into library_question_options (question_id, letra, texto, correta)
                values (${id}, ${letra}, ${`alternativa ${letra}`}, ${letra === gab})`;
    }
  }

  const [plano] = await sql`select id from plans limit 1`;
  if (!plano) throw new Error("nenhum plano cadastrado — rode `pnpm seed:planos` antes");

  for (const [i, email] of EMAILS.entries()) {
    const quem = i === 0 ? "A" : "B";
    const r = await fetch(`${BASE}/api/auth/sign-up/email`, {
      method: "POST",
      // O Better Auth recusa sign-up sem Origin (MISSING_OR_NULL_ORIGIN): é a
      // proteção de CSRF dele, e vale manter — mandamos a origem real.
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email, password: "SenhaForte123!", name: `Fronteiras ${quem}` }),
    });
    const bruto = r.headers.getSetCookie?.() ?? [];
    cookies[quem] = bruto.map((c) => c.split(";")[0]).join("; ");
    const [u] = await sql`select id from users where email = ${email}`;
    if (!u) throw new Error(`sign-up de ${email} não criou conta: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    if (!cookies[quem]) throw new Error(`sign-up de ${email} não devolveu cookie de sessão`);
    await sql`insert into subscriptions (student_id, plan_id, status, current_period_end)
              values (${u.id}, ${plano.id}, 'ACTIVE', now() + interval '30 days')`;
  }
}

console.log(`\n  Fronteiras de autorização — ${BASE}\n`);
await preparar();

console.log("1. REST do Payload sem cookie: conteúdo pago não sai");
for (const col of ["transcripts", "captions", "media", "glossary-terms", "staff", "lesson-materials"]) {
  const r = await fetch(`${BASE}/api/${col}?limit=1`);
  const corpo = await r.text();
  const liberou = r.status === 200 && /"docs":\s*\[\s*\{/.test(corpo);
  ok(`GET /api/${col}`, !liberou, liberou ? `HTTP ${r.status} devolveu documentos` : `HTTP ${r.status}`);
}

console.log("\n2. Cadastro não aceita papel vindo do cliente");
const email = `escalada-${Date.now()}@example.invalid`;
const rEsc = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ email, password: "SenhaForte123!", name: "Escalada", role: "ADMIN" }),
});
const corpoEsc = await rEsc.text();
const [novo] = await sql`select role from users where email = ${email}`;
if (!novo) {
  // Sem conta criada não dá para afirmar nada sobre o papel: o teste não
  // rodou. Dizer "ok" aqui seria aprovar o que não foi exercido.
  ok("sign-up com role=ADMIN", false, `conta não criada — HTTP ${rEsc.status} ${corpoEsc.slice(0, 120)}`);
} else {
  ok("sign-up com role=ADMIN", novo.role === "STUDENT", `papel gravado: ${novo.role}`);
}
await sql`delete from users where email = ${email}`;

console.log("\n3. Gabarito não sai enquanto a prova está aberta");
const ini = await chamar("iniciarTentativa", [DOC], "A");
const attemptId = ini?.dados?.attemptId;
ok("aluno A abre a tentativa", Boolean(attemptId), attemptId ? "" : JSON.stringify(ini));

for (const [qid, gab] of QUESTOES) {
  const r = await chamar("revelarGabarito", [qid], "A");
  ok(`revelarGabarito durante a prova (gabarito ${gab})`, !r?.dados?.gabarito, r?.erro ?? `devolveu ${r?.dados?.gabarito}`);
}
const porta2 = await chamar("responderQuestao", [{ questionId: QUESTOES[0][0], letra: "E" }], "A");
ok("responderQuestao durante a prova", !porta2?.dados?.gabarito, porta2?.erro ?? `devolveu ${porta2?.dados?.gabarito}`);

console.log("\n4. Depois de finalizar, o banco livre volta a funcionar");
for (const [qid, gab] of QUESTOES) {
  await chamar("responderNaTentativa", [{ attemptId, questionId: qid, letra: gab }], "A");
}
await chamar("finalizarTentativa", [attemptId], "A");
const depois = await chamar("revelarGabarito", [QUESTOES[0][0]], "A");
ok("revelarGabarito com a prova finalizada", depois?.dados?.gabarito === "A", `devolveu ${JSON.stringify(depois?.dados?.gabarito ?? depois?.erro)}`);

console.log("\n5. IDOR: aluno B não age sobre a tentativa do aluno A");
const i1 = await chamar("finalizarTentativa", [attemptId], "B");
ok("B finalizarTentativa(tentativa de A)", i1?.ok === false, i1?.erro ?? JSON.stringify(i1));
const i2 = await chamar("responderNaTentativa", [{ attemptId, questionId: QUESTOES[0][0], letra: "E" }], "B");
ok("B responderNaTentativa(tentativa de A)", i2?.ok === false, i2?.erro ?? JSON.stringify(i2));

console.log("\n6. Anônimo não alcança as actions de aluno");
for (const [nome, args] of [["revelarGabarito", [QUESTOES[0][0]]], ["iniciarTentativa", [DOC]]]) {
  const r = await chamar(nome, args, null);
  ok(`${nome} sem sessão`, r?._redirecionou === true, r?._redirecionou ? "redirect /login" : JSON.stringify(r));
}

await limpar();
await sql.end();

console.log();
if (falhas.length === 0) {
  console.log("  OK: todas as fronteiras verificadas se comportaram como esperado.\n");
  process.exit(0);
}
console.log(`  ${falhas.length} fronteira(s) falharam:`);
for (const f of falhas) console.log(`    - ${f}`);
console.log();
process.exit(1);
