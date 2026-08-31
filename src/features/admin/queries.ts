import { db } from "@/lib/db";
import { lessonProgress, subscriptions, users } from "@/lib/db/schema";
import { getSubjects, getModulesBySubject, getLessonsByModule } from "@/lib/payload/queries";
import { and, count, eq, gte } from "drizzle-orm";

export async function getStudentMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [[total], [newThisMonth]] = await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.role, "STUDENT")),
    db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), gte(users.createdAt, thirtyDaysAgo))),
  ]);

  return {
    total: total.count,
    newThisMonth: newThisMonth.count,
  };
}

export async function getContentMetrics() {
  const subjects = await getSubjects();
  const moduleCounts = await Promise.all(subjects.map((s) => getModulesBySubject(s.id)));
  const modules = moduleCounts.flat();
  const lessonCounts = await Promise.all(modules.map((m) => getLessonsByModule(m.id)));
  const lessons = lessonCounts.flat();

  return {
    subjects: subjects.length,
    modules: modules.length,
    lessons: lessons.length,
  };
}

export async function getFinancialMetrics() {
  const [[activeSubscriptions]] = await Promise.all([
    db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "ACTIVE")),
  ]);

  return {
    activeSubscriptions: activeSubscriptions.count,
    // MRR requires joining subscriptions -> plans; left at 0 until Mercado Pago
    // integration actually populates subscriptions with real data.
    mrrCents: 0,
  };
}

export async function getEngagementMetrics() {
  const [[completed], [inProgress]] = await Promise.all([
    db
      .select({ count: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.completed, true)),
    db
      .select({ count: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.completed, false)),
  ]);

  return {
    lessonsCompleted: completed.count,
    lessonsInProgress: inProgress.count,
  };
}
