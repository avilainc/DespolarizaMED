import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { montarCronograma, type AulaParaPlano } from "./engine";

function aulas(disciplinas: Record<string, number>, minutos = 30): AulaParaPlano[] {
  const lista: AulaParaPlano[] = [];
  let subjectId = 1;
  for (const [nome, n] of Object.entries(disciplinas)) {
    for (let i = 1; i <= n; i++) {
      lista.push({ lessonId: subjectId * 100 + i, subjectId, titulo: `${nome} ${i}`, disciplina: nome, minutos });
    }
    subjectId++;
  }
  return lista;
}

// segunda-feira, 2026-09-14
const INICIO = new Date(2026, 8, 14);
const diasDepois = (n: number) => new Date(2026, 8, 14 + n);
const chaveDia = (d: Date) => d.toISOString().slice(0, 10);

describe("montarCronograma", () => {
  it("1 disciplina: só estuda nos N primeiros dias da semana e cada dia termina em exercícios", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(13),
      diasPorSemana: 3,
      horasPorDia: 2,
      aulas: aulas({ Biologia: 40 }),
      disciplinasDificeis: [],
    });
    const dias = new Set(itens.map((i) => chaveDia(i.scheduledFor)));
    // 2 semanas × 3 dias = 6 dias de estudo
    assert.equal(dias.size, 6);
    for (const d of dias) {
      const dow = new Date(d).getUTCDay(); // 1=seg … 3=qua
      assert.ok(dow >= 1 && dow <= 3, `dia ${d} fora de seg–qua`);
    }
    const porDia = new Map<string, typeof itens>();
    for (const i of itens) porDia.set(chaveDia(i.scheduledFor), [...(porDia.get(chaveDia(i.scheduledFor)) ?? []), i]);
    for (const [, lista] of porDia) {
      const ultimo = lista[lista.length - 1];
      assert.ok(ultimo.title.startsWith("Exercícios de Biologia"), `dia sem bloco de exercícios: ${ultimo.title}`);
      assert.ok(lista.filter((i) => i.lessonId !== null).length >= 1, "dia sem aula");
    }
  });

  it("orçamento: 70% das horas em aulas (2h → 84 min → 3 aulas de 30 min, não 4)", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(1),
      diasPorSemana: 1,
      horasPorDia: 2,
      aulas: aulas({ Biologia: 10 }, 30),
      disciplinasDificeis: [],
    });
    assert.equal(itens.filter((i) => i.lessonId !== null).length, 3);
  });

  it("várias disciplinas alternam em rodízio, e a difícil aparece com o dobro da frequência", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(41), // 6 semanas
      diasPorSemana: 6,
      horasPorDia: 1,
      aulas: aulas({ Biologia: 60, Fisica: 60, Quimica: 60 }, 30),
      disciplinasDificeis: [2], // Fisica
    });
    const diasComAula = itens.filter((i) => i.lessonId !== null);
    const porDisciplina = new Map<number, Set<string>>();
    for (const i of diasComAula) {
      const s = porDisciplina.get(i.subjectId!) ?? new Set();
      s.add(chaveDia(i.scheduledFor));
      porDisciplina.set(i.subjectId!, s);
    }
    const bio = porDisciplina.get(1)!.size;
    const fis = porDisciplina.get(2)!.size;
    const qui = porDisciplina.get(3)!.size;
    assert.ok(fis >= bio * 2 - 1 && fis <= bio * 2 + 1, `Física ${fis} dias vs Biologia ${bio}`);
    assert.ok(Math.abs(bio - qui) <= 1, `Biologia ${bio} vs Química ${qui}`);
  });

  it("7º dia de estudo é revisão e 14º é simulado; nenhum dos dois tem aula", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(28), // prova na 5ª segunda: 4 semanas cheias antes
      diasPorSemana: 7,
      horasPorDia: 1,
      aulas: aulas({ Biologia: 200 }, 20),
      disciplinasDificeis: [],
    });
    const porDia = new Map<string, typeof itens>();
    for (const i of itens) porDia.set(chaveDia(i.scheduledFor), [...(porDia.get(chaveDia(i.scheduledFor)) ?? []), i]);
    const dias = [...porDia.keys()].sort();
    assert.equal(dias.length, 28);
    assert.ok(!dias.includes(chaveDia(diasDepois(28))), "o dia da prova não pode ter item");
    const so = (n: number) => porDia.get(dias[n - 1])!;
    assert.equal(so(7).length, 1);
    assert.match(so(7)[0].title, /^Revisão/);
    assert.equal(so(14).length, 1);
    assert.match(so(14)[0].title, /^Simulado/);
    assert.match(so(21)[0].title, /^Revisão/);
    assert.match(so(28)[0].title, /^Simulado/);
    assert.ok(so(1).some((i) => i.lessonId !== null));
  });

  it("poucos dias: prova amanhã gera exatamente 1 dia de estudo (hoje); prova hoje gera nada", () => {
    const base = { inicio: INICIO, diasPorSemana: 7, horasPorDia: 1, aulas: aulas({ Biologia: 5 }), disciplinasDificeis: [] };
    const amanha = montarCronograma({ ...base, dataProva: diasDepois(1) });
    assert.equal(new Set(amanha.map((i) => chaveDia(i.scheduledFor))).size, 1);
    assert.deepEqual(montarCronograma({ ...base, dataProva: diasDepois(0) }), []);
  });

  it("período longo: quando as aulas acabam, os dias restantes viram revisão por disciplina (sem repetir aula)", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(59),
      diasPorSemana: 5,
      horasPorDia: 3,
      aulas: aulas({ Biologia: 4, Fisica: 4 }, 30),
      disciplinasDificeis: [],
    });
    const lessonIds = itens.filter((i) => i.lessonId !== null).map((i) => i.lessonId);
    assert.equal(new Set(lessonIds).size, lessonIds.length, "aula repetida no cronograma");
    assert.equal(lessonIds.length, 8, "todas as aulas devem ser alocadas");
    const revisoes = itens.filter((i) => /^Revisão de (Biologia|Fisica)/.test(i.title));
    assert.ok(revisoes.length > 10, "dias sem aula deveriam virar revisão");
  });

  it("sem aulas publicadas: não gera nada (em vez de um plano só de revisões vazias)", () => {
    const itens = montarCronograma({
      inicio: INICIO,
      dataProva: diasDepois(30),
      diasPorSemana: 5,
      horasPorDia: 2,
      aulas: [],
      disciplinasDificeis: [],
    });
    assert.deepEqual(itens, []);
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    const p = {
      inicio: INICIO,
      dataProva: diasDepois(20),
      diasPorSemana: 4,
      horasPorDia: 2.5,
      aulas: aulas({ Biologia: 12, Quimica: 9 }, 25),
      disciplinasDificeis: [1],
    };
    assert.deepEqual(montarCronograma(p), montarCronograma(p));
  });
});
