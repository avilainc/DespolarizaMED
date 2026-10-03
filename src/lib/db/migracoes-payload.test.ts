import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  bloqueioDoPayload,
  estadoDasMigracoesPayload,
  pendentesDoPayload,
  sondarBloqueioDoPayload,
} from "./migracoes-payload";

const IMAGEM = ["20260811_init", "20261001_meio", "20261002_ultima"];

function executorFalso(respostas: unknown[]) {
  const fila = [...respostas];
  return { execute: async () => fila.shift() };
}

describe("migrations do Payload: o que a imagem tem × o que o banco aplicou", () => {
  it("banco em dia não tem pendência", () => {
    const aplicadas = IMAGEM.map((name) => ({ name, batch: 1 }));
    assert.deepEqual(pendentesDoPayload(IMAGEM, aplicadas), []);
  });

  it("banco atrasado lista só o que falta, na ordem da imagem", () => {
    assert.deepEqual(pendentesDoPayload(IMAGEM, [{ name: "20260811_init", batch: 1 }]), [
      "20261001_meio",
      "20261002_ultima",
    ]);
  });

  it("decide por nome, não por posição: buraco no meio também é pendência", () => {
    // O Payload roda toda migration cujo nome falta, mesmo que uma posterior
    // já tenha rodado (acontece com migrations de branches mescladas).
    const aplicadas = [
      { name: "20260811_init", batch: 1 },
      { name: "20261002_ultima", batch: 2 },
    ];
    assert.deepEqual(pendentesDoPayload(IMAGEM, aplicadas), ["20261001_meio"]);
  });

  it("banco virgem (sem tabela de controle) tem tudo pendente", () => {
    assert.deepEqual(pendentesDoPayload(IMAGEM, null), IMAGEM);
  });

  it("registro de push de dev (batch -1) não conta como aplicado", () => {
    const aplicadas = [{ name: "20260811_init", batch: -1 }];
    assert.deepEqual(pendentesDoPayload(IMAGEM, aplicadas), IMAGEM);
  });

  it("banco à frente da imagem (rollback) não gera pendência", () => {
    const aplicadas = [...IMAGEM, "20261231_futura"].map((name) => ({ name, batch: 1 }));
    assert.deepEqual(pendentesDoPayload(IMAGEM, aplicadas), []);
  });
});

describe("migrations do Payload: o índice é o que roda em produção", () => {
  // `prodMigrations` recebe o array de `src/migrations/index.ts`, não a pasta.
  // Uma migration gerada e não registrada lá nunca roda no deploy, e a medição
  // também não a vê — o defeito ficaria invisível dos dois lados. O gerador do
  // Payload atualiza o índice sozinho; isto pega a edição manual que o esquece.
  const PASTA = path.join(process.cwd(), "src", "migrations");
  const indice = readFileSync(path.join(PASTA, "index.ts"), "utf8");
  const arquivos = readdirSync(PASTA)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => f.slice(0, -3));

  it("há ao menos a migration inicial", () => {
    assert.ok(arquivos.length > 0);
  });

  for (const nome of arquivos) {
    it(`${nome} está registrada no índice`, () => {
      assert.ok(indice.includes(`name: '${nome}'`), `${nome}.ts não está em src/migrations/index.ts`);
    });
  }
});

describe("migrations do Payload: leitura do banco", () => {
  it("banco sem payload_migrations reporta tudo pendente e versão nula", async () => {
    const estado = await estadoDasMigracoesPayload(executorFalso([[{ tabela: null }]]), IMAGEM);
    assert.equal(estado.versao, null);
    assert.deepEqual(estado.pendentes, IMAGEM);
  });

  it("converte o batch que o driver devolve como texto e ignora o de dev", async () => {
    const estado = await estadoDasMigracoesPayload(
      executorFalso([
        [{ tabela: "payload_migrations" }],
        [
          { name: "dev", batch: "-1" },
          ...IMAGEM.map((name) => ({ name, batch: "1" })),
        ],
      ]),
      IMAGEM,
    );
    assert.deepEqual(estado.pendentes, []);
    assert.equal(estado.versao, IMAGEM.at(-1));
  });

  it("aceita resultado embrulhado em rows", async () => {
    const estado = await estadoDasMigracoesPayload(
      executorFalso([{ rows: [{ tabela: "payload_migrations" }] }, { rows: [] }]),
      IMAGEM,
    );
    assert.equal(estado.versao, null);
    assert.deepEqual(estado.pendentes, IMAGEM);
  });
});

describe("migrations do Payload: quando não deixar o adapter migrar sozinho", () => {
  it("banco virgem segue: a init cria tudo", () => {
    assert.equal(bloqueioDoPayload({ daImagem: IMAGEM, aplicadas: null, schemaExiste: false }), null);
  });

  it("banco com a init registrada segue, mesmo com pendências depois dela", () => {
    const aplicadas = [{ name: "20260811_init", batch: 1 }];
    assert.equal(bloqueioDoPayload({ daImagem: IMAGEM, aplicadas, schemaExiste: true }), null);
  });

  it("registro de push de dev bloqueia (o Payload perguntaria e sairia com 0)", () => {
    const aplicadas = [
      { name: "dev", batch: -1 },
      { name: "20260811_init", batch: 1 },
    ];
    const motivo = bloqueioDoPayload({ daImagem: IMAGEM, aplicadas, schemaExiste: true });
    assert.match(motivo ?? "", /batch = -1/);
  });

  it("tabelas existentes sem a init registrada bloqueiam, com o insert no texto", () => {
    for (const aplicadas of [null, []]) {
      const motivo = bloqueioDoPayload({ daImagem: IMAGEM, aplicadas, schemaExiste: true });
      assert.match(motivo ?? "", /insert into payload_migrations .*'20260811_init'/);
    }
  });

  it("a sonda lê o banco e chega ao mesmo veredito", async () => {
    const ok = await sondarBloqueioDoPayload(
      executorFalso([
        [{ controle: "payload_migrations", staff: "staff" }],
        [{ name: "20260811_init", batch: "1" }],
      ]),
      IMAGEM,
    );
    assert.equal(ok, null);

    const semControle = await sondarBloqueioDoPayload(
      executorFalso([[{ controle: null, staff: "staff" }]]),
      IMAGEM,
    );
    assert.ok(semControle);
  });
});
