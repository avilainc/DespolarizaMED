import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classificarTemas, corrigirTentativa } from "./correcao";

const q = (id: string, tema: string | null, disciplina: string | null = "Biologia") => ({
  id,
  temaSugerido: tema,
  disciplinaSugerida: disciplina,
});

describe("corrigirTentativa", () => {
  it("conta acertos, erros e em branco separadamente", () => {
    const r = corrigirTentativa(
      [q("a", "Genética"), q("b", "Genética"), q("c", "Ecologia"), q("d", "Ecologia")],
      new Map([
        ["a", { correta: true }],
        ["b", { correta: false }],
        ["c", { correta: true }],
      ]),
    );
    assert.equal(r.total, 4);
    assert.equal(r.acertos, 2);
    assert.equal(r.erros, 1);
    assert.equal(r.emBranco, 1);
    assert.equal(r.percentual, 50);
  });

  it("tema cai para disciplina e depois para 'Sem classificação'", () => {
    const r = corrigirTentativa([q("a", null, "Física"), q("b", null, null)], new Map());
    assert.deepEqual(
      r.temas.map((t) => t.nome).sort(),
      ["Física", "Sem classificação"],
    );
  });

  it("forte exige ≥70% e pelo menos 2 questões; revisar é <50%", () => {
    const r = corrigirTentativa(
      [
        q("a", "Genética"),
        q("b", "Genética"),
        q("c", "Genética"),
        q("d", "Óptica"), // 1 questão certa: 100% mas só 1 → não é forte
        q("e", "Ecologia"),
        q("f", "Ecologia"),
      ],
      new Map([
        ["a", { correta: true }],
        ["b", { correta: true }],
        ["c", { correta: true }],
        ["d", { correta: true }],
        ["e", { correta: false }],
      ]),
    );
    assert.deepEqual(r.fortes.map((t) => t.nome), ["Genética"]);
    assert.deepEqual(r.revisar.map((t) => t.nome), ["Ecologia"]);
  });

  it("prova vazia não divide por zero", () => {
    const r = corrigirTentativa([], new Map());
    assert.equal(r.percentual, 0);
    assert.deepEqual(r.temas, []);
  });

  it("percentual é arredondado (2/3 → 67)", () => {
    const r = corrigirTentativa(
      [q("a", "x"), q("b", "x"), q("c", "x")],
      new Map([
        ["a", { correta: true }],
        ["b", { correta: true }],
        ["c", { correta: false }],
      ]),
    );
    assert.equal(r.percentual, 67);
  });
});

describe("classificarTemas", () => {
  it("ordena fortes por pct desc e revisar por pct asc", () => {
    const { fortes, revisar } = classificarTemas([
      { nome: "A", total: 4, acertos: 3, pct: 0.75 },
      { nome: "B", total: 2, acertos: 2, pct: 1 },
      { nome: "C", total: 5, acertos: 1, pct: 0.2 },
      { nome: "D", total: 3, acertos: 0, pct: 0 },
      { nome: "E", total: 2, acertos: 1, pct: 0.5 },
    ]);
    assert.deepEqual(fortes.map((t) => t.nome), ["B", "A"]);
    assert.deepEqual(revisar.map((t) => t.nome), ["D", "C"]);
  });
});
