import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTableColumns, is } from "drizzle-orm";
import { PgTable, PgTimestamp } from "drizzle-orm/pg-core";

import * as schema from "./index";

/**
 * Guarda contra a volta do bug de fuso (roadmap, seção 3).
 *
 * `timestamp` sem fuso é lido pelo postgres.js como hora local do processo
 * Node, então uma coluna assim volta deslocada em qualquer ambiente fora de
 * UTC. O erro é silencioso: o build passa, a tela carrega, e só um teste que
 * compara instantes percebe. Como basta esquecer `{ withTimezone: true }` numa
 * coluna nova para reintroduzir isso em 2 caracteres, o schema inteiro é
 * varrido aqui em vez de confiar na revisão.
 *
 * Dia de calendário (a data da prova) não entra nesta regra: é `date`, não
 * `timestamp`, então nem aparece na varredura. Ver src/lib/datas.ts.
 */
describe("schema: colunas de tempo", () => {
  // O módulo exporta tabelas e também pgEnum; só as tabelas têm colunas.
  const tabelas: [string, PgTable][] = [];
  for (const [nome, valor] of Object.entries(schema)) {
    if (is(valor, PgTable)) tabelas.push([nome, valor]);
  }

  it("encontra as tabelas do schema (a varredura não é vazia)", () => {
    assert.ok(tabelas.length >= 25, `esperava o schema inteiro, achei ${tabelas.length} tabelas`);
  });

  it("toda coluna timestamp tem fuso (timestamptz)", () => {
    const semFuso: string[] = [];
    let total = 0;

    for (const [nomeTabela, tabela] of tabelas) {
      for (const [nomeColuna, coluna] of Object.entries(getTableColumns(tabela))) {
        if (!is(coluna, PgTimestamp)) continue;
        total++;
        if (!coluna.withTimezone) semFuso.push(`${nomeTabela}.${nomeColuna}`);
      }
    }

    assert.ok(total > 0, "nenhuma coluna timestamp encontrada — a varredura quebrou");
    assert.deepEqual(
      semFuso,
      [],
      `colunas timestamp sem fuso (use { withTimezone: true }): ${semFuso.join(", ")}`,
    );
  });
});
