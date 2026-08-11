import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSubjects } from "@/lib/payload/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const subjects = await getSubjects();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Olá, {session?.user.name} 👋</h1>
      <p className="mt-1 text-muted-foreground">Continue de onde parou.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <Link key={subject.id} href={`/disciplinas/${subject.slug}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="size-5" />
                  </div>
                  <CardTitle className="mt-3 flex items-center justify-between text-base">
                    {subject.name}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                {subject.description && (
                  <CardContent className="text-sm text-muted-foreground">
                    {subject.description}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disciplinas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nenhuma disciplina publicada ainda.
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano de estudos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: cronograma personalizado até a data da sua prova.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banco de questões</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: exercícios filtrados por disciplina, tema e vestibular.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
