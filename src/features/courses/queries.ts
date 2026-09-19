import "server-only";

import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { lessonProgress, practiceAnswers } from "@/lib/db/schema";
import { getPayloadClient } from "@/lib/payload";
import type { Lesson, Module, Subject } from "@/payload/payload-types";

/**
 * Consultas de curso que cruzam Payload (conteúdo) com Drizzle (progresso).
 *
 * O conteúdo vive no Payload e o progresso do aluno no Postgres via Drizzle,
 * então nenhum join do banco resolve as duas pontas. O padrão aqui é sempre o
 * mesmo: puxa a árvore do Payload uma vez, coleta os ids das aulas e faz UMA
 * consulta de progresso com `inArray`, em vez de uma por aula.
 *
 * Nada aqui inventa número. Onde não há dado (aluno sem nenhuma resposta,
 * disciplina sem aula publicada) a função devolve zero ou null e quem
 * renderiza decide o que mostrar; a regra do redesign é não preencher tela
 * com métrica falsa.
 */

export type AulaComEstado = Lesson & {
  concluida: boolean;
  /** Segundos já assistidos. Zero quando o aluno nunca abriu a aula. */
  posicaoSegundos: number;
};

export type ModuloComAulas = {
  modulo: Module;
  aulas: AulaComEstado[];
  concluidas: number;
};

export type ProgressoDisciplina = {
  subjectId: number;
  totalAulas: number;
  concluidas: number;
  totalModulos: number;
};

/** Todas as aulas publicadas, já ligadas ao módulo e à disciplina. */
async function aulasPublicadas() {
  const payload = await getPayloadClient();
  const [modulos, aulas] = await Promise.all([
    payload.find({ collection: "modules", sort: "order", limit: 500 }),
    payload.find({
      collection: "lessons",
      where: { published: { equals: true } },
      sort: "order",
      limit: 1000,
    }),
  ]);

  const moduloPorId = new Map<number, Module>(modulos.docs.map((m) => [m.id, m]));
  return { moduloPorId, aulas: aulas.docs as Lesson[] };
}

function idDoModulo(aula: Lesson): number | null {
  return typeof aula.module === "number" ? aula.module : (aula.module?.id ?? null);
}

function idDaDisciplina(modulo: Module | undefined): number | null {
  if (!modulo) return null;
  return typeof modulo.subject === "number" ? modulo.subject : (modulo.subject?.id ?? null);
}

/**
 * Quantas aulas cada disciplina tem e quantas o aluno concluiu.
 *
 * `studentId` opcional porque a página de disciplinas também é renderizada
 * para quem ainda não tem progresso nenhum, e o card precisa mostrar
 * "10 aulas" mesmo assim.
 */
export async function progressoDasDisciplinas(studentId?: string): Promise<Map<number, ProgressoDisciplina>> {
  const { moduloPorId, aulas } = await aulasPublicadas();

  const concluidas = new Set<number>();
  if (studentId && aulas.length > 0) {
    const linhas = await db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.studentId, studentId),
          eq(lessonProgress.completed, true),
          inArray(
            lessonProgress.lessonId,
            aulas.map((a) => a.id),
          ),
        ),
      );
    for (const l of linhas) concluidas.add(l.lessonId);
  }

  const porDisciplina = new Map<number, ProgressoDisciplina>();
  const modulosVistos = new Map<number, Set<number>>();

  for (const aula of aulas) {
    const modId = idDoModulo(aula);
    const subjectId = idDaDisciplina(modId ? moduloPorId.get(modId) : undefined);
    if (subjectId == null) continue;

    const atual = porDisciplina.get(subjectId) ?? {
      subjectId,
      totalAulas: 0,
      concluidas: 0,
      totalModulos: 0,
    };
    atual.totalAulas += 1;
    if (concluidas.has(aula.id)) atual.concluidas += 1;
    porDisciplina.set(subjectId, atual);

    if (modId != null) {
      const vistos = modulosVistos.get(subjectId) ?? new Set<number>();
      vistos.add(modId);
      modulosVistos.set(subjectId, vistos);
    }
  }

  for (const [subjectId, vistos] of modulosVistos) {
    const atual = porDisciplina.get(subjectId);
    if (atual) atual.totalModulos = vistos.size;
  }

  return porDisciplina;
}

/** Módulos de uma disciplina com as aulas e o estado de cada uma para este aluno. */
export async function modulosComProgresso(subjectId: number, studentId: string): Promise<ModuloComAulas[]> {
  const payload = await getPayloadClient();
  const modulos = await payload.find({
    collection: "modules",
    where: { subject: { equals: subjectId } },
    sort: "order",
    limit: 200,
  });

  const porModulo = await Promise.all(
    modulos.docs.map(async (modulo) => {
      const aulas = await payload.find({
        collection: "lessons",
        where: { module: { equals: modulo.id }, published: { equals: true } },
        sort: "order",
        limit: 200,
      });
      return { modulo: modulo as Module, aulas: aulas.docs as Lesson[] };
    }),
  );

  const todosIds = porModulo.flatMap((m) => m.aulas.map((a) => a.id));
  const estado = new Map<number, { completed: boolean; positionSeconds: number }>();
  if (todosIds.length > 0) {
    const linhas = await db
      .select({
        lessonId: lessonProgress.lessonId,
        completed: lessonProgress.completed,
        positionSeconds: lessonProgress.positionSeconds,
      })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.studentId, studentId), inArray(lessonProgress.lessonId, todosIds)));
    for (const l of linhas) estado.set(l.lessonId, { completed: l.completed, positionSeconds: l.positionSeconds });
  }

  return porModulo.map(({ modulo, aulas }) => {
    const comEstado: AulaComEstado[] = aulas.map((aula) => {
      const e = estado.get(aula.id);
      return { ...aula, concluida: e?.completed ?? false, posicaoSegundos: e?.positionSeconds ?? 0 };
    });
    return {
      modulo,
      aulas: comEstado,
      concluidas: comEstado.filter((a) => a.concluida).length,
    };
  });
}

export type Continuacao = {
  aula: Lesson;
  disciplina: Subject | null;
  modulo: Module | null;
  posicaoSegundos: number;
  /** true quando é a primeira aula do aluno, não a retomada de uma começada. */
  primeira: boolean;
};

/**
 * A aula que o dashboard oferece como "continuar".
 *
 * Ordem de preferência: a última aula que o aluno começou e não terminou;
 * depois, a primeira aula publicada que ele ainda não concluiu. Devolve null
 * quando não há aula publicada nenhuma, e nesse caso o dashboard mostra outra
 * coisa em vez de um card apontando para o vazio.
 */
export async function continuarEstudando(studentId: string): Promise<Continuacao | null> {
  const { moduloPorId, aulas } = await aulasPublicadas();
  if (aulas.length === 0) return null;

  const aulaPorId = new Map(aulas.map((a) => [a.id, a]));
  const progresso = await db
    .select({
      lessonId: lessonProgress.lessonId,
      completed: lessonProgress.completed,
      positionSeconds: lessonProgress.positionSeconds,
      updatedAt: lessonProgress.updatedAt,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.studentId, studentId))
    .orderBy(desc(lessonProgress.updatedAt))
    .limit(200);

  const emAndamento = progresso.find((p) => !p.completed && aulaPorId.has(p.lessonId));
  const concluidas = new Set(progresso.filter((p) => p.completed).map((p) => p.lessonId));

  const escolhida = emAndamento
    ? { aula: aulaPorId.get(emAndamento.lessonId)!, posicao: emAndamento.positionSeconds, primeira: false }
    : (() => {
        const proxima = aulas.find((a) => !concluidas.has(a.id));
        return proxima ? { aula: proxima, posicao: 0, primeira: progresso.length === 0 } : null;
      })();

  if (!escolhida) return null;

  const modId = idDoModulo(escolhida.aula);
  const modulo = modId != null ? (moduloPorId.get(modId) ?? null) : null;
  let disciplina: Subject | null = null;
  const subjectId = idDaDisciplina(modulo ?? undefined);
  if (subjectId != null) {
    const payload = await getPayloadClient();
    disciplina = (await payload.findByID({ collection: "subjects", id: subjectId }).catch(() => null)) as Subject | null;
  }

  return {
    aula: escolhida.aula,
    disciplina,
    modulo,
    posicaoSegundos: escolhida.posicao,
    primeira: escolhida.primeira,
  };
}

export type ResumoSemana = {
  aulasConcluidas: number;
  questoesRespondidas: number;
  acertos: number;
  /** null quando o aluno não respondeu nada na semana: 0% seria mentira. */
  taxaAcerto: number | null;
};

/** O que o aluno fez nos últimos sete dias. Só contagem, nada estimado. */
export async function resumoDaSemana(studentId: string): Promise<ResumoSemana> {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [aulas, respostas] = await Promise.all([
    db
      .select({ total: count() })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.studentId, studentId),
          eq(lessonProgress.completed, true),
          gte(lessonProgress.updatedAt, seteDiasAtras),
        ),
      ),
    db
      .select({
        total: count(),
        acertos: sql<number>`count(*) filter (where ${practiceAnswers.correta})`.mapWith(Number),
      })
      .from(practiceAnswers)
      .where(and(eq(practiceAnswers.studentId, studentId), gte(practiceAnswers.answeredAt, seteDiasAtras))),
  ]);

  const respondidas = respostas[0]?.total ?? 0;
  const acertos = respostas[0]?.acertos ?? 0;

  return {
    aulasConcluidas: aulas[0]?.total ?? 0,
    questoesRespondidas: respondidas,
    acertos,
    taxaAcerto: respondidas > 0 ? Math.round((acertos / respondidas) * 100) : null,
  };
}
