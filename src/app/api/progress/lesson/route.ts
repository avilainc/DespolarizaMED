import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const bodySchema = z.object({
  lessonId: z.number().int().positive(),
  positionSeconds: z.number().int().min(0),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { lessonId, positionSeconds, completed } = parsed.data;
  const studentId = session.user.id;

  const existing = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, studentId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(lessonProgress)
      .set({ positionSeconds, completed, updatedAt: new Date() })
      .where(eq(lessonProgress.id, existing[0].id));
  } else {
    await db.insert(lessonProgress).values({
      studentId,
      lessonId,
      positionSeconds,
      completed,
    });
  }

  return NextResponse.json({ ok: true });
}
