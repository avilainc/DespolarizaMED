/**
 * Motor de cronograma. Regras simples e determinísticas, sem ML (roadmap §6):
 *
 * - Estuda-se nos primeiros N dias de cada semana (seg → dom), até a véspera
 *   da prova; o dia da prova nunca recebe item.
 * - Cada dia tem um orçamento em minutos (horas/dia × 60). ~70% vai para
 *   aulas, o restante vira um bloco de exercícios da disciplina do dia.
 * - As disciplinas se alternam em rodízio; as marcadas como difíceis entram
 *   duas vezes no rodízio, então aparecem com o dobro da frequência.
 * - A cada 7º dia de estudo entra uma revisão de questões erradas; a cada 14º,
 *   um simulado (prova antiga completa).
 * - Quando as aulas acabam antes da prova, o que sobra vira revisão por
 *   disciplina, ainda em rodízio.
 */

export type AulaParaPlano = {
  lessonId: number;
  subjectId: number;
  titulo: string;
  disciplina: string;
  minutos: number;
};

export type ItemGerado = {
  scheduledFor: Date;
  subjectId: number | null;
  lessonId: number | null;
  title: string;
};

export type ParametrosPlano = {
  inicio: Date;
  dataProva: Date;
  diasPorSemana: number;
  horasPorDia: number;
  aulas: AulaParaPlano[];
  disciplinasDificeis: number[];
};

const MINUTOS_AULA_PADRAO = 40;

function diasDeEstudo(inicio: Date, dataProva: Date, diasPorSemana: number): Date[] {
  const dias: Date[] = [];
  const d = new Date(inicio);
  d.setHours(8, 0, 0, 0);
  // Estuda-se até a véspera: o dia da prova nunca recebe item.
  const fim = new Date(dataProva);
  fim.setHours(0, 0, 0, 0);
  // dia da semana com segunda = 0
  const idxSemana = (data: Date) => (data.getDay() + 6) % 7;
  while (d < fim) {
    if (idxSemana(d) < diasPorSemana) dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

export function montarCronograma(p: ParametrosPlano): ItemGerado[] {
  const dias = diasDeEstudo(p.inicio, p.dataProva, Math.min(7, Math.max(1, p.diasPorSemana)));
  if (!dias.length) return [];

  const orcamento = Math.max(30, Math.round(p.horasPorDia * 60));
  const orcamentoAulas = Math.round(orcamento * 0.7);

  // Fila por disciplina, na ordem em que as aulas vieram (módulo → ordem).
  const filas = new Map<number, AulaParaPlano[]>();
  const nomes = new Map<number, string>();
  for (const a of p.aulas) {
    const fila = filas.get(a.subjectId) ?? [];
    fila.push(a);
    filas.set(a.subjectId, fila);
    nomes.set(a.subjectId, a.disciplina);
  }
  const dificeis = new Set(p.disciplinasDificeis);
  const rodizio: number[] = [];
  for (const id of filas.keys()) {
    rodizio.push(id);
    if (dificeis.has(id)) rodizio.push(id);
  }
  if (!rodizio.length) return [];

  const itens: ItemGerado[] = [];
  let ponteiro = 0;

  dias.forEach((dia, i) => {
    const n = i + 1;
    if (n % 14 === 0) {
      itens.push({ scheduledFor: dia, subjectId: null, lessonId: null, title: "Simulado: resolver uma prova antiga completa" });
      return;
    }
    if (n % 7 === 0) {
      itens.push({ scheduledFor: dia, subjectId: null, lessonId: null, title: "Revisão: refazer as questões que errou" });
      return;
    }

    // Escolhe a próxima disciplina do rodízio que ainda tem aula; se nenhuma
    // tiver, o dia vira revisão da disciplina da vez.
    let subjectId = rodizio[ponteiro % rodizio.length];
    let tentativas = 0;
    while ((filas.get(subjectId)?.length ?? 0) === 0 && tentativas < rodizio.length) {
      ponteiro++;
      tentativas++;
      subjectId = rodizio[ponteiro % rodizio.length];
    }
    ponteiro++;
    const disciplina = nomes.get(subjectId) ?? "Disciplina";
    const fila = filas.get(subjectId) ?? [];

    if (!fila.length) {
      itens.push({ scheduledFor: dia, subjectId, lessonId: null, title: `Revisão de ${disciplina}: questões do banco` });
      return;
    }

    let usado = 0;
    const horario = new Date(dia);
    while (fila.length && usado < orcamentoAulas) {
      const aula = fila.shift()!;
      const minutos = aula.minutos || MINUTOS_AULA_PADRAO;
      itens.push({
        scheduledFor: new Date(horario),
        subjectId,
        lessonId: aula.lessonId,
        title: `${disciplina}: ${aula.titulo}`,
      });
      usado += minutos;
      horario.setMinutes(horario.getMinutes() + minutos + 10);
    }
    itens.push({
      scheduledFor: new Date(horario),
      subjectId,
      lessonId: null,
      title: `Exercícios de ${disciplina}: 10 questões do banco`,
    });
  });

  return itens;
}
