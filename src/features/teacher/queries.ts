import { db } from "@/lib/db";
import { lessonProgress, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type StudentSummary = {
  id: string;
  name: string;
  email: string;
  lessonsCompleted: number;
  lessonsStarted: number;
  lastActivityAt: Date | null;
};

export async function getStudentsSummary(): Promise<StudentSummary[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      lessonsCompleted: sql<number>`count(*) filter (where ${lessonProgress.completed} = true)`,
      lessonsStarted: sql<number>`count(*)`,
      lastActivityAt: sql<Date | null>`max(${lessonProgress.updatedAt})`,
    })
    .from(users)
    .leftJoin(lessonProgress, eq(lessonProgress.studentId, users.id))
    .where(eq(users.role, "STUDENT"))
    .groupBy(users.id, users.name, users.email)
    .orderBy(users.name);

  return rows;
}
