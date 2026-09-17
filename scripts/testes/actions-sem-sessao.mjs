/**
 * Sonda toda server action registrada no build, sem cookie de sessão nenhum.
 *
 *   pnpm build && pnpm start          # noutro terminal
 *   node scripts/testes/actions-sem-sessao.mjs
 *
 * Por que existe: toda action exportada é um endpoint HTTP. O Next registra um
 * id para cada uma em `.next/server/server-reference-manifest.json`, esse id
 * aparece no bundle do cliente, e qualquer um pode fazer POST com o header
 * `Next-Action` correspondente. Quem protege a action não é a tela que
 * desenha o botão — é a guarda dentro dela.
 *
 * Isto não roda no CI: precisa de `pnpm build` mais Postgres de verdade. O que
 * roda no CI é a varredura estática em src/lib/auth/ordem-da-guarda.test.ts,
 * que lê a ordem das chamadas sem subir nada. As duas se complementam: a
 * estática pega a regressão no pull request; esta confirma, contra o servidor
 * de verdade, que a leitura do código correspondia ao comportamento.
 *
 * Achado que motivou o script: `aprovarQuestao` e `corrigirGabarito` liam o
 * acervo antes de chegar na guarda de ADMIN (que morava dentro do helper
 * `aplicar()`). A escrita seguia barrada, mas um anônimo distinguia
 * "questão não encontrada" de "defina o gabarito antes de aprovar" e de
 * "a questão não tem alternativa X" — e fazia o servidor consultar o banco.
 * Ler o código não pegou: cada função parecia certa; errada era só a ordem.
 */
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:3000";
const MANIFEST = process.env.MANIFEST ?? ".next/server/server-reference-manifest.json";

/** UUID válido (zod v4 confere versão e variante); não precisa existir. */
const UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

/**
 * A guarda roda antes de qualquer validação de argumento, então o formato não
 * importa — mas variar evita que uma action passe por "recusada" quando na
 * verdade só engasgou no argumento.
 */
const ARGS = [[{ id: UUID }], [UUID], []];

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
} catch {
  console.error(`não achei ${MANIFEST} — rode \`pnpm build\` antes.`);
  process.exit(2);
}

const acoes = Object.entries(manifest.node ?? {})
  .map(([id, v]) => ({
    id,
    nome: v.exportedName ?? "?",
    arquivo: v.filename ?? "?",
    rota: Object.keys(v.workers ?? {})[0] ?? "",
  }))
  .sort((a, b) => (a.arquivo + a.nome).localeCompare(b.arquivo + b.nome));

/** A rota onde a action está registrada, como caminho de URL. */
function urlDa(rota) {
  const limpa = rota
    .replace(/^app/, "")
    .replace(/\/page$/, "")
    .replace(/\([^)]*\)\//g, "");
  return limpa === "" ? "/" : limpa;
}

async function sondar(acao) {
  for (const args of ARGS) {
    const r = await fetch(BASE + urlDa(acao.rota), {
      method: "POST",
      redirect: "manual",
      headers: { "Next-Action": acao.id, "Content-Type": "text/plain;charset=UTF-8" },
      // Sem Cookie: de propósito. É o ponto do teste.
      body: JSON.stringify(args),
    });
    const corpo = await r.text();
    const destino = r.headers.get("x-action-redirect") ?? r.headers.get("location") ?? "";

    // O id da action é hash do módulo: mudar o código muda o id. Se o servidor
    // no ar for de outro build, TODAS respondem 404 e o relatório viraria uma
    // fila de falsos positivos. Melhor parar e dizer o que está errado.
    if (r.status === 404 && /Server action not found/i.test(corpo)) {
      return { desatualizado: true };
    }

    // Duas recusas legítimas, nenhuma devolvendo dados: redirect para o login
    // (as actions da app, via requireSessionWithRole) e exceção (o handler do
    // Payload, que autentica por conta própria e lança).
    if (/\/login/.test(corpo) || /\/login/.test(destino)) continue;
    if (/^\d+:E\{/m.test(corpo)) continue;

    const payload = corpo.match(/^\d+:(?!E\{)(\{.*|\[.*)$/m);
    return {
      recusou: false,
      args: JSON.stringify(args),
      detalhe: payload
        ? payload[1].slice(0, 110)
        : `status ${r.status} ${corpo.slice(0, 80).replace(/\s+/g, " ")}`,
    };
  }
  return { recusou: true };
}

console.log(`\nPOST sem cookie em ${acoes.length} server actions registradas (${BASE})\n`);

const responderam = [];
for (const acao of acoes) {
  const r = await sondar(acao);
  if (r.desatualizado) {
    console.error(
      `\n  ${acao.nome}: "Server action not found".\n` +
        `  O servidor no ar é de outro build que o manifest lido.\n` +
        `  Reinicie: pare o \`pnpm start\`, rode \`pnpm build\` e suba de novo.\n`,
    );
    process.exit(2);
  }
  const curto = acao.arquivo.replace(/^.*node_modules\//, "…/").replace("features/", "");
  console.log(
    `  ${curto.slice(-40).padEnd(40)} ${acao.nome.padEnd(22)} ${r.recusou ? "recusado" : `RESPONDEU  ${r.detalhe}`}`,
  );
  if (!r.recusou) responderam.push(`${acao.arquivo} → ${acao.nome}() com args ${r.args}`);
}

console.log();
if (responderam.length === 0) {
  console.log(`  OK: nenhuma das ${acoes.length} actions respondeu a um anônimo.\n`);
  process.exit(0);
}
console.log(`  ${responderam.length} action(s) responderam sem sessão:`);
for (const v of responderam) console.log(`    - ${v}`);
console.log();
process.exit(1);
