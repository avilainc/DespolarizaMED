import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { CollectionConfig } from "payload";

/**
 * Guarda contra collection do Payload aberta para anônimo.
 *
 * O painel do Payload não é a única porta das collections: o mesmo config
 * monta uma API REST em `/api/<slug>`, servida pelo catch-all em
 * `src/app/(payload)/api/[...slug]/route.ts`. Quem decide o que sai por ali é
 * `access.read` — não a tela, não o menu do /admin.
 *
 * O que originou este teste: `transcripts`, `captions`, `media` e `staff`
 * tinham `read: () => true`. Em runtime, sem cookie nenhum,
 * `GET /api/transcripts` devolvia a transcrição inteira de uma aula paga e,
 * por profundidade, o e-mail do professor junto; `GET /api/staff` listava as
 * contas do painel. Nenhuma tela usava essas rotas — o app lê o Payload pela
 * Local API — então a abertura não servia a nada e ninguém notaria.
 *
 * A checagem é comportamental de propósito: em vez de procurar o texto
 * `() => true`, chama a própria função com um request sem usuário e recusa
 * quem devolver `true` literal. Assim continua valendo se a regra virar
 * `(args) => algumaCoisa(args)`, e não quebra com o padrão legítimo de
 * devolver um FILTRO para o anônimo — `Lessons` devolve
 * `{ published: { equals: true } }`, que restringe em vez de liberar.
 */

const ESTA_PASTA = import.meta.dirname;

/**
 * As únicas collections que podem responder `true` para um anônimo.
 *
 * São o catálogo (nome de disciplina e de módulo), não conteúdo de aula: não
 * carregam texto de aula, definição, legenda nem gabarito. Hoje nem a landing
 * depende delas — ela usa conteúdo fixo em `features/marketing/content` — e o
 * app lê o Payload pela Local API, então fechá-las também não quebraria nada.
 * Ficam abertas por serem catálogo de produto, e ficam NESTA LISTA para que
 * abrir qualquer outra seja uma decisão explícita, não um descuido.
 */
const PUBLICAS_DE_PROPOSITO = ["subjects", "modules"];

/** `read` pode ser função, e pode devolver boolean ou um where do Payload. */
type Acesso = CollectionConfig["access"];

async function carregarCollections(): Promise<[string, CollectionConfig][]> {
  const arquivos = readdirSync(ESTA_PASTA).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
  );

  const collections: [string, CollectionConfig][] = [];
  for (const arquivo of arquivos) {
    const mod = (await import(join(ESTA_PASTA, arquivo))) as Record<string, unknown>;
    for (const [nome, valor] of Object.entries(mod)) {
      if (valor && typeof valor === "object" && "slug" in valor && "fields" in valor) {
        collections.push([nome, valor as CollectionConfig]);
      }
    }
  }
  return collections.sort((a, b) => a[0].localeCompare(b[0]));
}

/** Um request anônimo, como o que chega na REST sem cookie de painel. */
function requisicaoAnonima() {
  return { req: { user: null } } as unknown as Parameters<
    NonNullable<NonNullable<Acesso>["read"]>
  >[0];
}

describe("payload: nenhuma collection aberta para anônimo", () => {
  it("toda collection declara access.read explicitamente", async () => {
    const collections = await carregarCollections();
    assert.ok(collections.length >= 8, `esperava as collections do config, achei ${collections.length}`);

    const semRegra = collections
      .filter(([, c]) => typeof c.access?.read !== "function")
      .map(([nome]) => nome);

    assert.deepEqual(
      semRegra,
      [],
      `collections sem access.read próprio (herdam o padrão do Payload): ${semRegra.join(", ")}`,
    );
  });

  it("nenhuma collection devolve `true` para um request sem usuário", async () => {
    const collections = await carregarCollections();
    const abertas: string[] = [];

    for (const [nome, c] of collections) {
      if (PUBLICAS_DE_PROPOSITO.includes(c.slug)) continue;
      const read = c.access?.read;
      if (typeof read !== "function") continue;
      const resultado = await read(requisicaoAnonima());
      // `true` = liberado. `false` = negado. Objeto = liberado PORÉM filtrado,
      // que é o padrão legítimo (ex.: só o que está publicado).
      if (resultado === true) abertas.push(`${nome} (slug "${c.slug}")`);
    }

    assert.deepEqual(
      abertas,
      [],
      "collections legíveis por anônimo via REST do Payload (GET /api/<slug>):\n  " +
        abertas.join("\n  ") +
        "\nSe a abertura for mesmo desejada, documente o porquê no próprio arquivo antes de liberar.",
    );
  });

  it("collections de conteúdo pago exigem usuário, não apenas filtram", async () => {
    const collections = await carregarCollections();
    const PAGAS = ["transcripts", "captions", "media", "lesson-materials"];

    const falhas: string[] = [];
    for (const [nome, c] of collections) {
      if (!PAGAS.includes(c.slug)) continue;
      const read = c.access?.read;
      if (typeof read !== "function") continue;
      const resultado = await read(requisicaoAnonima());
      // Aqui um filtro não basta: transcrição/legenda/arquivo não têm noção de
      // "publicado", então qualquer coisa diferente de negar entrega o conteúdo.
      if (resultado !== false) falhas.push(`${nome} devolveu ${JSON.stringify(resultado)}`);
    }

    assert.deepEqual(
      falhas,
      [],
      `conteúdo pago acessível sem usuário:\n  ${falhas.join("\n  ")}`,
    );
  });
});
