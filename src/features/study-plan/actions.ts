"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { studentActivities, studyPlanItems, studyPlans } from "@/lib/db/schema";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getLessonsByModule, getModulesBySubject, getSubjects } from "@/lib/payload/queries";
import { chaveDia, diaParaData, ehDiaCalendario } from "@/lib/datas";
import { montarCronograma, type AulaParaPlano } from "./engine";

export type ActionResult<T = null> = { ok: true; dados: T } | { ok: false; erro: string };

const schema = z.object({
  targetVestibular: z.string().trim().min(2).max(80),
  // Dia de calendário vindo de <input type="date">: fica string "YYYY-MM-DD"
  // do formulário até o banco, sem virar Date (e sem ganhar fuso) no meio.
  examDate: z.string().refine(ehDiaCalendario, "data inválida"),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  hoursPerDay: z.coerce.number().min(0.5).max(12),
  disciplinasDificeis: z.array(z.coerce.number().int().positive()).max(20).default([]),
});

async function aulasPublicadas(): Promise<AulaParaPlano[]> {
  const subjects = await getSubjects();
  const aulas: AulaParaPlano[] = [];
  for (const s of subjects) {
    const modules = await getModulesBySubject(s.id);
    for (const m of modules) {
      const lessons = await getLessonsByModule(m.id);
      for (const l of lessons) {
        aulas.push({
          lessonId: l.id,
          subjectId: s.id,
          titulo: l.title,
          disciplina: s.name,
          minutos: l.durationSeconds ? Math.max(10, Math.round(l.durationSeconds / 60)) : 0,
        });
      }
    }
  }
  return aulas;
}

/**
 * Cria ou refaz o plano. Itens já concluídos ficam como histórico; os
 * pendentes de hoje em diante são substituídos pelo cronograma novo.
 */
export async function salvarPlano(formData: FormData): Promise<ActionResult> {
  const { session } = await requireAssinatura();

  const parsed = schema.safeParse({
    targetVestibular: formData.get("targetVestibular"),
    examDate: formData.get("examDate"),
    daysPerWeek: formData.get("daysPerWeek"),
    hoursPerDay: formData.get("hoursPerDay"),
    disciplinasDificeis: formData.getAll("disciplinasDificeis"),
  });
  if (!parsed.success) return { ok: false, erro: "confira os campos: vestibular, data e horas" };
  const d = parsed.data;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  // Comparação lexicográfica: "YYYY-MM-DD" ordena igual à ordem cronológica.
  if (d.examDate <= chaveDia(hoje)) return { ok: false, erro: "a data da prova precisa estar no futuro" };

  const aulas = await aulasPublicadas();
  const itens = montarCronograma({
    inicio: hoje,
    dataProva: diaParaData(d.examDate),
    diasPorSemana: d.daysPerWeek,
    horasPorDia: d.hoursPerDay,
    aulas,
    disciplinasDificeis: d.disciplinasDificeis,
  });

  await db.transaction(async (tx) => {
    const [existente] = await tx
      .select({ id: studyPlans.id })
      .from(studyPlans)
      .where(eq(studyPlans.studentId, session.user.id))
      .limit(1);

    let planId = existente?.id;
    const valores = {
      targetVestibular: d.targetVestibular,
      examDate: d.examDate,
      daysPerWeek: d.daysPerWeek,
      hoursPerDay: Math.round(d.hoursPerDay),
      updatedAt: new Date(),
    };
    if (planId) {
      await tx.update(studyPlans).set(valores).where(eq(studyPlans.id, planId));
      await tx
        .delete(studyPlanItems)
        .where(
          and(
            eq(studyPlanItems.studyPlanId, planId),
            eq(studyPlanItems.completed, false),
            gte(studyPlanItems.scheduledFor, hoje),
          ),
        );
    } else {
      const [novo] = await tx
        .insert(studyPlans)
        .values({ studentId: session.user.id, ...valores })
        .returning({ id: studyPlans.id });
      planId = novo.id;
    }

    // Aula já concluída num plano anterior não volta para o cronograma.
    const jaFeitas = new Set(
      (
        await tx
          .select({ lessonId: studyPlanItems.lessonId })
          .from(studyPlanItems)
          .where(and(eq(studyPlanItems.studyPlanId, planId), eq(studyPlanItems.completed, true)))
      )
        .map((r) => r.lessonId)
        .filter((id): id is number => id !== null),
    );
    const novos = itens.filter((i) => i.lessonId === null || !jaFeitas.has(i.lessonId));

    if (novos.length) {
      await tx.insert(studyPlanItems).values(
        novos.map((i) => ({
          studyPlanId: planId!,
          scheduledFor: i.scheduledFor,
          subjectId: i.subjectId,
          lessonId: i.lessonId,
          title: i.title,
        })),
      );
    }
  });

  await db.insert(studentActivities).values({
    studentId: session.user.id,
    type: "PLANO_GERADO",
    metadata: JSON.stringify({ vestibular: d.targetVestibular, itens: itens.length }),
  });

  revalidatePath("/plano");
  revalidatePath("/calendario");
  return { ok: true, dados: null };
}

export async function alternarItemDoPlano(itemId: string): Promise<ActionResult<{ completed: boolean }>> {
  const { session } = await requireAssinatura();
  if (!z.string().uuid().safeParse(itemId).success) return { ok: false, erro: "item inválido" };

  const [item] = await db
    .select({ id: studyPlanItems.id, completed: studyPlanItems.completed })
    .from(studyPlanItems)
    .innerJoin(studyPlans, eq(studyPlans.id, studyPlanItems.studyPlanId))
    .where(and(eq(studyPlanItems.id, itemId), eq(studyPlans.studentId, session.user.id)))
    .limit(1);
  if (!item) return { ok: false, erro: "item não encontrado" };

  await db.update(studyPlanItems).set({ completed: !item.completed }).where(eq(studyPlanItems.id, itemId));
  revalidatePath("/plano");
  return { ok: true, dados: { completed: !item.completed } };
}
