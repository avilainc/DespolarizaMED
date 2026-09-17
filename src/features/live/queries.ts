import "server-only";

import { and, asc, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { lectures, liveSessions, users } from "@/lib/db/schema";

const camposPlantao = {
  id: liveSessions.id,
  title: liveSessions.title,
  description: liveSessions.description,
  subjectId: liveSessions.subjectId,
  meetUrl: liveSessions.meetUrl,
  startsAt: liveSessions.startsAt,
  endsAt: liveSessions.endsAt,
  recordingUrl: liveSessions.recordingUrl,
  teacherId: liveSessions.teacherId,
  professor: users.name,
};

export async function proximosPlantoes(limite = 20) {
  return db
    .select(camposPlantao)
    .from(liveSessions)
    .innerJoin(users, eq(users.id, liveSessions.teacherId))
    .where(gte(liveSessions.endsAt, new Date()))
    .orderBy(asc(liveSessions.startsAt))
    .limit(limite);
}

export async function plantoesPassados(limite = 20) {
  return db
    .select(camposPlantao)
    .from(liveSessions)
    .innerJoin(users, eq(users.id, liveSessions.teacherId))
    .where(lt(liveSessions.endsAt, new Date()))
    .orderBy(desc(liveSessions.startsAt))
    .limit(limite);
}

export async function plantoesNoPeriodo(de: Date, ate: Date) {
  return db
    .select(camposPlantao)
    .from(liveSessions)
    .innerJoin(users, eq(users.id, liveSessions.teacherId))
    .where(and(gte(liveSessions.startsAt, de), lt(liveSessions.startsAt, ate)))
    .orderBy(asc(liveSessions.startsAt));
}

export async function todosPlantoes() {
  return db
    .select(camposPlantao)
    .from(liveSessions)
    .innerJoin(users, eq(users.id, liveSessions.teacherId))
    .orderBy(desc(liveSessions.startsAt))
    .limit(200);
}

export async function obterPlantao(id: string) {
  const [p] = await db.select().from(liveSessions).where(eq(liveSessions.id, id)).limit(1);
  return p ?? null;
}

export async function listarPalestras() {
  return db.select().from(lectures).orderBy(desc(lectures.scheduledFor)).limit(200);
}

export async function palestrasNoPeriodo(de: Date, ate: Date) {
  return db
    .select()
    .from(lectures)
    .where(and(gte(lectures.scheduledFor, de), lt(lectures.scheduledFor, ate)))
    .orderBy(asc(lectures.scheduledFor));
}

export async function obterPalestra(id: string) {
  const [p] = await db.select().from(lectures).where(eq(lectures.id, id)).limit(1);
  return p ?? null;
}
