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
      // `::int` não é enfeite: `count()` do Postgres é bigint, e o driver
      // devolve bigint como STRING. O `sql<number>` é só uma asserção de tipo
      // — não converte nada —, então sem o cast o TypeScript acreditava em
      // `number` e o valor em tempo de execução era `"11"`. Enquanto a tela só
      // imprimia "11/12" ninguém percebia; na hora de somar o total de aulas
      // concluídas da turma, `0 + "11" + "0" + "7"` virou "01107140".
      lessonsCompleted: sql<number>`(count(*) filter (where ${lessonProgress.completed} = true))::int`,
      // `count(lesson_progress.id)` e não `count(*)`: com LEFT JOIN, o aluno
      // que nunca abriu uma aula ainda produz UMA linha (toda de NULL), e
      // `count(*)` conta linhas — ele aparecia como "0/1 aulas concluídas" ao
      // lado de "Nunca acessou". Contar a coluna ignora os NULL.
      lessonsStarted: sql<number>`count(${lessonProgress.id})::int`,
      lastActivityAt: sql<Date | null>`max(${lessonProgress.updatedAt})`,
    })
    .from(users)
    .leftJoin(lessonProgress, eq(lessonProgress.studentId, users.id))
    .where(eq(users.role, "STUDENT"))
    .groupBy(users.id, users.name, users.email)
    .orderBy(users.name);

  return rows;
}
