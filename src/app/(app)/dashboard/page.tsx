import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSubjects } from "@/lib/payload/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookMarked, BookOpen, CalendarDays, FileText, HelpCircle, History, TrendingUp, Video } from "lucide-react";

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
        <Link href="/questoes">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="size-5" />
              </div>
              <CardTitle className="mt-3 flex items-center justify-between text-base">
                Banco de questões
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Milhares de questões de vestibular filtradas por banca, ano, disciplina e tema.
            </CardContent>
          </Card>
        </Link>
        <Link href="/provas">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <CardTitle className="mt-3 flex items-center justify-between text-base">
                Provas antigas
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Resolva provas completas e veja seus pontos fortes e o que revisar.
            </CardContent>
          </Card>
        </Link>
        <Link href="/desempenho">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-5" />
              </div>
              <CardTitle className="mt-3 flex items-center justify-between text-base">
                Desempenho
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Aproveitamento por disciplina e tema, com o histórico dos últimos 30 dias.
            </CardContent>
          </Card>
        </Link>
        <Atalho href="/plano" titulo="Plano de estudos" icone={<CalendarDays className="size-5" />}>
          Cronograma até a data da sua prova, com aulas, exercícios e revisões.
        </Atalho>
        <Atalho href="/plantoes" titulo="Plantões e palestras" icone={<Video className="size-5" />}>
          Tire dúvidas ao vivo com os professores pelo Google Meet.
        </Atalho>
        <Atalho href="/glossario" titulo="Glossário" icone={<BookMarked className="size-5" />}>
          Termos e definições escritos pela equipe, por disciplina.
        </Atalho>
        <Atalho href="/atividades" titulo="Atividades" icone={<History className="size-5" />}>
          Seu histórico de aulas, provas e plano.
        </Atalho>
      </div>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  icone,
  children,
}: {
  href: string;
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icone}</div>
          <CardTitle className="mt-3 flex items-center justify-between text-base">
            {titulo}
            <ArrowRight className="size-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{children}</CardContent>
      </Card>
    </Link>
  );
}
