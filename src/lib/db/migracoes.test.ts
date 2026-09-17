import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MIGRACOES_DA_IMAGEM,
  estadoDasMigracoes,
  pendentesDoJournal,
  type EntradaDoJournal,
} from "./migracoes";

const JOURNAL: EntradaDoJournal[] = [
  { tag: "0000_inicial", when: 100 },
  { tag: "0001_meio", when: 200 },
  { tag: "0002_ultima", when: 300 },
];

/** Executor de mentira: devolve, em ordem, as respostas programadas. */
function executorFalso(respostas: unknown[]) {
  const fila = [...respostas];
  return { execute: async () => fila.shift() };
}

describe("migrations: o que a imagem tem × o que o banco aplicou", () => {
  it("banco em dia não tem pendência", () => {
    assert.deepEqual(pendentesDoJournal(JOURNAL, 300), []);
  });

  it("banco atrasado lista só o que falta, na ordem", () => {
    assert.deepEqual(pendentesDoJournal(JOURNAL, 100), ["0001_meio", "0002_ultima"]);
  });

  it("banco virgem (sem tabela de controle) tem tudo pendente", () => {
    assert.deepEqual(pendentesDoJournal(JOURNAL, null), ["0000_inicial", "0001_meio", "0002_ultima"]);
  });

  it("banco à frente da imagem não vira pendência negativa", () => {
    // Acontece em rollback: a imagem antiga volta com um banco já migrado.
    // Não há o que aplicar, e o número não pode ficar negativo.
    assert.deepEqual(pendentesDoJournal(JOURNAL, 999), []);
  });

  it("a comparação é estritamente maior, como no migrator do Drizzle", () => {
    // `when` igual ao último aplicado significa que ELA é a última aplicada.
    assert.deepEqual(pendentesDoJournal(JOURNAL, 200), ["0002_ultima"]);
  });

  it("o journal real da imagem está ordenado e não vazio", () => {
    assert.ok(MIGRACOES_DA_IMAGEM.length > 0, "journal vazio: a medição não teria sentido");
    for (let i = 1; i < MIGRACOES_DA_IMAGEM.length; i++) {
      assert.ok(
        MIGRACOES_DA_IMAGEM[i].when > MIGRACOES_DA_IMAGEM[i - 1].when,
        `journal fora de ordem em ${MIGRACOES_DA_IMAGEM[i].tag}`,
      );
    }
  });
});

describe("migrations: leitura do banco", () => {
  it("banco sem a tabela de controle reporta tudo pendente e versão nula", async () => {
    const estado = await estadoDasMigracoes(executorFalso([[{ tabela: null }]]));
    assert.equal(estado.versao, null);
    assert.equal(estado.aplicadaEm, null);
    assert.equal(estado.pendentes.length, MIGRACOES_DA_IMAGEM.length);
  });

  it("converte o created_at que o driver devolve como texto", async () => {
    const ultima = MIGRACOES_DA_IMAGEM[MIGRACOES_DA_IMAGEM.length - 1];
    const estado = await estadoDasMigracoes(
      executorFalso([
        [{ tabela: "drizzle.__drizzle_migrations" }],
        [{ hash: "abc123", created_at: String(ultima.when) }],
      ]),
    );
    assert.equal(estado.versao, "abc123");
    assert.equal(estado.aplicadaEm, ultima.when);
    assert.deepEqual(estado.pendentes, []);
  });

  it("aceita resultado embrulhado em rows", async () => {
    const estado = await estadoDasMigracoes(
      executorFalso([
        { rows: [{ tabela: "drizzle.__drizzle_migrations" }] },
        { rows: [{ hash: "h", created_at: "0" }] },
      ]),
    );
    assert.equal(estado.versao, "h");
    assert.equal(estado.pendentes.length, MIGRACOES_DA_IMAGEM.length);
  });

  it("banco atrasado nomeia as migrations que faltam", async () => {
    const primeira = MIGRACOES_DA_IMAGEM[0];
    const estado = await estadoDasMigracoes(
      executorFalso([
        [{ tabela: "drizzle.__drizzle_migrations" }],
        [{ hash: "h", created_at: String(primeira.when) }],
      ]),
    );
    assert.equal(estado.pendentes.length, MIGRACOES_DA_IMAGEM.length - 1);
    assert.ok(!estado.pendentes.includes(primeira.tag));
  });
});
