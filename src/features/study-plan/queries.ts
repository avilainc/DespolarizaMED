import "server-only";

import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { studyPlanItems, studyPlans } from "@/lib/db/schema";

export async function planoDoAluno(studentId: string) {
  const [plano] = await db.select().from(studyPlans).where(eq(studyPlans.studentId, studentId)).limit(1);
  if (!plano) return null;

  const [resumo] = await db
    .select({
      total: sql<number>`count(*)::int`,
      concluidos: sql<number>`count(*) filter (where ${studyPlanItems.completed})::int`,
    })
    .from(studyPlanItems)
    .where(eq(studyPlanItems.studyPlanId, plano.id));

  return { ...plano, total: resumo?.total ?? 0, concluidos: resumo?.concluidos ?? 0 };
}

/** Itens do plano num intervalo, em ordem cronológica. */
export async function itensDoPeriodo(studentId: string, de: Date, ate: Date) {
  return db
    .select({
      id: studyPlanItems.id,
      scheduledFor: studyPlanItems.scheduledFor,
      subjectId: studyPlanItems.subjectId,
      lessonId: studyPlanItems.lessonId,
      title: studyPlanItems.title,
      completed: studyPlanItems.completed,
    })
    .from(studyPlanItems)
    .innerJoin(studyPlans, eq(studyPlans.id, studyPlanItems.studyPlanId))
    .where(
      and(
        eq(studyPlans.studentId, studentId),
        gte(studyPlanItems.scheduledFor, de),
        lte(studyPlanItems.scheduledFor, ate),
      ),
    )
    .orderBy(asc(studyPlanItems.scheduledFor));
}
