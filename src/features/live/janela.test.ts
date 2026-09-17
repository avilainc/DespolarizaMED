import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { meetDisponivel } from "./janela";

const inicio = new Date("2026-09-17T19:00:00Z");
const fim = new Date("2026-09-17T20:00:00Z");
const min = (n: number) => new Date(inicio.getTime() + n * 60_000);

describe("meetDisponivel", () => {
  it("fecha 16 min antes, abre exatamente 15 min antes", () => {
    assert.equal(meetDisponivel(inicio, fim, min(-16)), false);
    assert.equal(meetDisponivel(inicio, fim, min(-15)), true);
  });
  it("aberto durante e no instante final; fechado 1 min depois do fim", () => {
    assert.equal(meetDisponivel(inicio, fim, min(30)), true);
    assert.equal(meetDisponivel(inicio, fim, fim), true);
    assert.equal(meetDisponivel(inicio, fim, min(61)), false);
  });
  it("antecedência configurável", () => {
    assert.equal(meetDisponivel(inicio, fim, min(-30), 30), true);
    assert.equal(meetDisponivel(inicio, fim, min(-30), 15), false);
  });
});
