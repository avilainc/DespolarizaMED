import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { chaveDia, diaParaData, diasAte, ehDiaCalendario } from "./datas";

describe("datas: dia de calendário", () => {
  it("diaParaData ancora na meia-noite local, não em UTC", () => {
    const d = diaParaData("2026-12-01");
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 11);
    assert.equal(d.getDate(), 1);
    assert.equal(d.getHours(), 0);
  });

  it("a volta chaveDia(diaParaData(x)) preserva o dia", () => {
    // O que `new Date("2026-12-01")` erra: ele ancora em UTC, e em qualquer
    // fuso a oeste de Greenwich chaveDia devolveria 30/11.
    for (const dia of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      assert.equal(chaveDia(diaParaData(dia)), dia);
    }
  });

  it("chaveDia usa o dia local do instante, com zero à esquerda", () => {
    assert.equal(chaveDia(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    assert.equal(chaveDia(new Date(2026, 8, 17, 0, 0)), "2026-09-17");
  });

  it("ehDiaCalendario aceita só YYYY-MM-DD válido", () => {
    assert.ok(ehDiaCalendario("2026-12-01"));
    assert.ok(!ehDiaCalendario("01/12/2026"));
    assert.ok(!ehDiaCalendario("2026-12-01T10:00:00Z"));
    assert.ok(!ehDiaCalendario("2026-13-40"));
    assert.ok(!ehDiaCalendario(""));
  });

  it("diasAte conta dias de calendário e nunca fica negativo", () => {
    const hoje = new Date(2026, 8, 17, 22, 30);
    assert.equal(diasAte("2026-09-17", hoje), 0);
    assert.equal(diasAte("2026-09-18", hoje), 1);
    assert.equal(diasAte("2026-10-17", hoje), 30);
    assert.equal(diasAte("2026-09-01", hoje), 0);
  });

  it("a ordem lexicográfica de YYYY-MM-DD é a ordem cronológica", () => {
    // É disso que salvarPlano depende para recusar prova no passado.
    const dias = ["2026-12-01", "2026-01-05", "2027-01-01", "2026-01-15"];
    assert.deepEqual([...dias].sort(), ["2026-01-05", "2026-01-15", "2026-12-01", "2027-01-01"]);
  });
});
