"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { lectures, liveSessions, subscriptions, users } from "@/lib/db/schema";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { enviarEmail, moldeEmail } from "@/lib/email";

export type ActionResult<T = null> = { ok: true; dados: T } | { ok: false; erro: string };

const uuid = z.string().uuid();
const urlOpcional = z.string().trim().url().max(500).optional().or(z.literal(""));

const plantaoSchema = z.object({
  id: uuid.optional().or(z.literal("")),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  subjectId: z.coerce.number().int().positive().optional().or(z.literal("")),
  meetUrl: urlOpcional,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  recordingUrl: urlOpcional,
});

function escaparHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function revalidar() {
  revalidatePath("/plantoes");
  revalidatePath("/professor/plantoes");
  revalidatePath("/calendario");
}

export async function salvarPlantao(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { session, role } = await requireSessionWithRole("TEACHER");

  const parsed = plantaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, erro: "confira título, datas e links" };
  const d = parsed.data;
  if (d.endsAt <= d.startsAt) return { ok: false, erro: "o fim precisa ser depois do início" };

  const valores = {
    title: d.title,
    description: d.description || null,
    subjectId: typeof d.subjectId === "number" ? d.subjectId : null,
    meetUrl: d.meetUrl || null,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    recordingUrl: d.recordingUrl || null,
  };

  if (d.id) {
    const [existente] = await db
      .select({ teacherId: liveSessions.teacherId })
      .from(liveSessions)
      .where(eq(liveSessions.id, d.id))
      .limit(1);
    if (!existente) return { ok: false, erro: "plantão não encontrado" };
    // Professor só edita o próprio plantão; ADMIN edita qualquer um.
    if (existente.teacherId !== session.user.id && role !== "ADMIN") {
      return { ok: false, erro: "este plantão é de outro professor" };
    }
    await db.update(liveSessions).set(valores).where(eq(liveSessions.id, d.id));
    revalidar();
    return { ok: true, dados: { id: d.id } };
  }

  const [novo] = await db
    .insert(liveSessions)
    .values({ ...valores, teacherId: session.user.id })
    .returning({ id: liveSessions.id });
  revalidar();
  return { ok: true, dados: { id: novo.id } };
}

export async function excluirPlantao(id: string): Promise<ActionResult> {
  const { session, role } = await requireSessionWithRole("TEACHER");
  if (!uuid.safeParse(id).success) return { ok: false, erro: "id inválido" };
  const [existente] = await db
    .select({ teacherId: liveSessions.teacherId })
    .from(liveSessions)
    .where(eq(liveSessions.id, id))
    .limit(1);
  if (!existente) return { ok: false, erro: "plantão não encontrado" };
  if (existente.teacherId !== session.user.id && role !== "ADMIN") {
    return { ok: false, erro: "este plantão é de outro professor" };
  }
  await db.delete(liveSessions).where(eq(liveSessions.id, id));
  revalidar();
  return { ok: true, dados: null };
}

const palestraSchema = z.object({
  id: uuid.optional().or(z.literal("")),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  speaker: z.string().trim().max(120).optional().or(z.literal("")),
  scheduledFor: z.coerce.date().optional().or(z.literal("")),
  videoUrl: urlOpcional,
});

export async function salvarPalestra(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireSessionWithRole("TEACHER");
  const parsed = palestraSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, erro: "confira título, data e link" };
  const d = parsed.data;

  const valores = {
    title: d.title,
    description: d.description || null,
    speaker: d.speaker || null,
    scheduledFor: d.scheduledFor instanceof Date ? d.scheduledFor : null,
    videoUrl: d.videoUrl || null,
  };

  if (d.id) {
    await db.update(lectures).set(valores).where(eq(lectures.id, d.id));
    revalidar();
    return { ok: true, dados: { id: d.id } };
  }
  const [nova] = await db.insert(lectures).values(valores).returning({ id: lectures.id });
  revalidar();
  return { ok: true, dados: { id: nova.id } };
}

export async function excluirPalestra(id: string): Promise<ActionResult> {
  await requireSessionWithRole("TEACHER");
  if (!uuid.safeParse(id).success) return { ok: false, erro: "id inválido" };
  await db.delete(lectures).where(eq(lectures.id, id));
  revalidar();
  return { ok: true, dados: null };
}

/**
 * Avisa por e-mail todos os alunos com assinatura vigente sobre um plantão.
 * É disparado por botão, nunca automaticamente: salvar um rascunho errado
 * não pode mandar e-mail para a base inteira.
 */
export async function avisarAlunosDoPlantao(id: string): Promise<ActionResult<{ enviados: number }>> {
  await requireSessionWithRole("TEACHER");
  if (!uuid.safeParse(id).success) return { ok: false, erro: "id inválido" };

  const [plantao] = await db
    .select({
      title: liveSessions.title,
      description: liveSessions.description,
      startsAt: liveSessions.startsAt,
      endsAt: liveSessions.endsAt,
      professor: users.name,
    })
    .from(liveSessions)
    .innerJoin(users, eq(users.id, liveSessions.teacherId))
    .where(eq(liveSessions.id, id))
    .limit(1);
  if (!plantao) return { ok: false, erro: "plantão não encontrado" };

  const agora = new Date();
  const assinantes = await db
    .selectDistinct({ email: users.email, name: users.name })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.studentId))
    .where(
      and(
        eq(users.role, "STUDENT"),
        or(
          eq(subscriptions.status, "ACTIVE"),
          and(eq(subscriptions.status, "PAST_DUE"), gt(subscriptions.currentPeriodEnd, agora)),
        ),
      ),
    );

  const quando = plantao.startsAt.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" });
  const url = `${process.env.BETTER_AUTH_URL ?? "https://despolarizamed.com.br"}/plantoes`;
  const corpo = `Plantão <strong>${escaparHtml(plantao.title)}</strong> com ${escaparHtml(plantao.professor)}, ${quando}.${
    plantao.description ? `<br><br>${escaparHtml(plantao.description)}` : ""
  }<br><br>O link do Google Meet aparece na plataforma 15 minutos antes do início.`;

  let enviados = 0;
  for (const a of assinantes) {
    await enviarEmail({
      para: a.email,
      assunto: `Plantão: ${plantao.title} — ${quando}`,
      html: moldeEmail({ titulo: "Novo plantão agendado", corpo, botao: { texto: "Ver plantões", url } }),
      texto: `Plantão ${plantao.title} com ${plantao.professor}, ${quando}. Acesse ${url}`,
    });
    enviados++;
  }
  return { ok: true, dados: { enviados } };
}
