import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getStudentsSummary } from "@/features/teacher/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Área do professor — DespolarizaMED",
};

function formatDate(date: Date | null) {
  if (!date) return "Nunca acessou";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(date),
  );
}

export default async function ProfessorPage() {
  await requireSessionWithRole("TEACHER");
  const students = await getStudentsSummary();

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.lessonsStarted > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Área do professor</h1>
      <p className="mt-1 text-muted-foreground">
        Acompanhe o progresso dos alunos. Para gerenciar disciplinas, módulos e aulas, use o{" "}
        <Link href="/admin/login" className="text-primary underline underline-offset-4">
          painel de conteúdo
        </Link>
        .
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-foreground">{totalStudents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos com atividade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-foreground">{activeStudents}</CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Progresso por aluno</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">E-mail</th>
                    <th className="pb-2 font-medium">Aulas concluídas</th>
                    <th className="pb-2 font-medium">Última atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-3 text-foreground">{student.name}</td>
                      <td className="py-3 text-muted-foreground">{student.email}</td>
                      <td className="py-3">
                        {student.lessonsStarted > 0 ? (
                          <Badge variant="secondary">
                            {student.lessonsCompleted}/{student.lessonsStarted}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(student.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
