import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Olá, {session?.user.name} 👋</h1>
      <p className="mt-1 text-muted-foreground">Continue de onde parou.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disciplinas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: Biologia, Física e Química com progresso por módulo.
          </CardContent>
        </Card>
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
