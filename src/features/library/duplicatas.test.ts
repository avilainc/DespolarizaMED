import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { agruparPorRaiz, raizDoGrupo } from "./duplicatas";

// Uma questão canônica e duas cópias dela, como a fila de revisão as recebe.
const CANONICA = { id: "c", duplicataDe: null, gab: "a" };
const COPIA_1 = { id: "x", duplicataDe: "c", gab: "c" };
const COPIA_2 = { id: "y", duplicataDe: "c", gab: "a" };
const GRUPO = [CANONICA, COPIA_1, COPIA_2];

describe("acervo: grupo de duplicatas", () => {
  it("a raiz é a própria questão quando ela é a canônica", () => {
    assert.equal(raizDoGrupo(CANONICA), "c");
    assert.equal(raizDoGrupo(COPIA_1), "c");
  });

  it("a canônica vê as cópias", () => {
    const mapa = agruparPorRaiz([CANONICA], GRUPO);
    assert.deepEqual(
      mapa.get("c")?.map((v) => v.id),
      ["x", "y"],
    );
  });

  it("a cópia vê a canônica e a irmã — era isto que faltava", () => {
    // Antes, a busca era "quem aponta para o id exibido"; para uma cópia isso
    // não acha nada, e o revisor decidia o conflito sem ver o outro gabarito.
    const mapa = agruparPorRaiz([COPIA_1], GRUPO);
    assert.deepEqual(
      mapa.get("x")?.map((v) => v.id),
      ["c", "y"],
    );
  });

  it("nenhum item aparece no próprio grupo", () => {
    const mapa = agruparPorRaiz(GRUPO, GRUPO);
    for (const item of GRUPO) {
      assert.ok(
        !mapa.get(item.id)?.some((v) => v.id === item.id),
        `${item.id} apareceu como sua própria outra versão`,
      );
    }
  });

  it("questão sem duplicata nenhuma fica com lista vazia, não indefinida", () => {
    const sozinha = { id: "s", duplicataDe: null, gab: "b" };
    const mapa = agruparPorRaiz([sozinha], [sozinha]);
    assert.deepEqual(mapa.get("s"), []);
  });

  it("grupos diferentes não se misturam", () => {
    const outroGrupo = [
      { id: "z", duplicataDe: null, gab: "d" },
      { id: "w", duplicataDe: "z", gab: "e" },
    ];
    const mapa = agruparPorRaiz([COPIA_1, outroGrupo[1]], [...GRUPO, ...outroGrupo]);
    assert.deepEqual(
      mapa.get("x")?.map((v) => v.id),
      ["c", "y"],
    );
    assert.deepEqual(
      mapa.get("w")?.map((v) => v.id),
      ["z"],
    );
  });

  it("todo item pedido sai no mapa, mesmo sem linha correspondente", () => {
    const mapa = agruparPorRaiz([{ id: "sumiu", duplicataDe: null }], []);
    assert.deepEqual(mapa.get("sumiu"), []);
  });
});
